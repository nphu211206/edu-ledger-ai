// File: server/services/jobs.service.js
// PHIÊN BẢN TỐI THƯỢNG - LOGIC DATABASE CHO JOBS (v2.4 - CRUD MASTER)
// File này chứa TOÀN BỘ logic nghiệp vụ tương tác với CSDL cho các tác vụ liên quan đến Jobs.
// Bao gồm tìm kiếm, xem chi tiết, tạo, cập nhật, xóa, thay đổi trạng thái, và ứng tuyển.

const sql = require('mssql'); // Import thư viện mssql
const { poolPromise } = require('../config/db.js'); // Import pool kết nối CSDL

// ====================================================================
// === HẰNG SỐ & CẤU HÌNH ===
// ====================================================================
const DEFAULT_PAGE_LIMIT = 10; // Số lượng job mặc định trên mỗi trang
const VALID_JOB_STATUSES = ['Active', 'Inactive', 'Draft', 'Expired']; // Các trạng thái job hợp lệ
const VALID_SORT_OPTIONS = { // Các tùy chọn sắp xếp hợp lệ
    'createdAt_desc': 'j.createdAt DESC',
    'createdAt_asc': 'j.createdAt ASC',
    'salary_desc': 'j.maxSalary DESC, j.minSalary DESC', // Ưu tiên maxSalary
    'salary_asc': 'j.minSalary ASC, j.maxSalary ASC',     // Ưu tiên minSalary
    // 'relevance_desc': 'FREETEXTTABLE(j.*, @keyword) AS ft' // Cần Full-Text Search
};

// ====================================================================
// === CÁC HÀM HỖ TRỢ NỘI BỘ (Internal Helper Functions) ===
// ====================================================================

/**
 * Ghi log lỗi chi tiết vào console với định dạng chuẩn.
 * @param {string} functionName - Tên hàm xảy ra lỗi (ví dụ: 'findAllJobs').
 * @param {Error} error - Đối tượng Error bắt được.
 * @param {object} [context={}] - Dữ liệu ngữ cảnh bổ sung (ví dụ: { jobId: 1, filter: {...} }).
 */
const logDbError = (functionName, error, context = {}) => {
    console.error(`\n--- ❌ SQL Error in Service: ${functionName} ---`);
    console.error(`Timestamp: ${new Date().toISOString()}`);
    console.error(`Error Message: ${error.message}`);
    // In lỗi gốc từ driver CSDL nếu có
    if (error.originalError) {
        console.error("Original DB Error Details (Code, Class, State):", {
            code: error.originalError.info.number,
            class: error.originalError.info.class,
            state: error.originalError.info.state,
            message: error.originalError.info.message
        });
    }
    // In context
    if (Object.keys(context).length > 0) {
        try {
            console.error("Context Data:", JSON.stringify(context, null, 2));
        } catch (e) {
            console.error("Context Data (unserializable):", context);
        }
    }
    // In stack trace
    if (error.stack) {
        console.error("Stack Trace:");
        console.error(error.stack);
    }
    console.error(`--- End Error Report for ${functionName} ---\n`);
};

/**
 * Chuyển đổi chuỗi địa điểm thành tọa độ [lat, lng] (nếu có thể).
 * @param {string | null} locationString - Chuỗi địa điểm từ CSDL (ví dụ: "Hà Nội", "TP. Hồ Chí Minh").
 * @returns {Array<number> | null} Tọa độ [lat, lng] hoặc null nếu không tìm thấy.
 */
const getLocationCoordinates = (locationString) => {
    if (!locationString) return null;
    const normalizedLocation = locationString.toLowerCase().trim();
    // Danh sách tọa độ các thành phố lớn (Có thể mở rộng hoặc dùng API Geocoding)
    const cityCoordinates = {
        'hà nội': [21.0285, 105.8542], 'ha noi': [21.0285, 105.8542],
        'hồ chí minh': [10.7769, 106.7009], 'ho chi minh': [10.7769, 106.7009], 'tp.hcm': [10.7769, 106.7009], 'hcmc': [10.7769, 106.7009], 'sài gòn': [10.7769, 106.7009], 'saigon': [10.7769, 106.7009],
        'đà nẵng': [16.0544, 108.2022], 'da nang': [16.0544, 108.2022],
        'hải phòng': [20.8449, 106.6881], 'hai phong': [20.8449, 106.6881],
        'cần thơ': [10.0452, 105.7469], 'can tho': [10.0452, 105.7469],
    };
    // Tìm kiếm khớp
    for (const city in cityCoordinates) {
        if (normalizedLocation.includes(city)) {
            return cityCoordinates[city];
        }
    }
    return null; // Không tìm thấy
};

/**
 * Chuyển đổi chuỗi salary range từ frontend filter thành object {min, max, isNegotiable}.
 * @param {string} rangeString - Chuỗi từ filter (VD: "10 - 20 triệu", "Dưới 10 triệu", "Trên 40 triệu", "Thỏa thuận").
 * @returns {object|null} { min: number | null, max: number | null, isNegotiable: boolean } hoặc null nếu là 'Tất cả' hoặc không hợp lệ.
 */
const parseSalaryRangeFilter = (rangeString) => {
    if (!rangeString || typeof rangeString !== 'string' || rangeString.toLowerCase() === 'tất cả') {
        return null; // Không áp dụng filter
    }
    const lowerCaseRange = rangeString.toLowerCase();
    // Trường hợp 1: Thỏa thuận
    if (lowerCaseRange.includes('thỏa thuận')) {
        return { min: null, max: null, isNegotiable: true };
    }
    // Trường hợp 2: Có số
    const numbers = lowerCaseRange.match(/\d+/g)?.map(Number); // Lấy tất cả các số
    if (!numbers || numbers.length === 0) {
        return null; // Không tìm thấy số, không lọc
    }

    let min = null;
    let max = null;

    if (lowerCaseRange.startsWith('dưới') || lowerCaseRange.startsWith('under') || lowerCaseRange.startsWith('<')) {
        max = numbers[0]; // VD: "Dưới 10 triệu" -> max = 10
    } else if (lowerCaseRange.startsWith('trên') || lowerCaseRange.startsWith('over') || lowerCaseRange.startsWith('>')) {
        min = numbers[0]; // VD: "Trên 40 triệu" -> min = 40
    } else if (numbers.length === 1) {
        min = numbers[0]; // VD: "20 triệu" (coi là từ 20)
    } else if (numbers.length >= 2) {
        min = Math.min(numbers[0], numbers[1]); // VD: "10 - 20 triệu" -> min = 10, max = 20
        max = Math.max(numbers[0], numbers[1]);
    }

    // Chỉ trả về nếu có min hoặc max hợp lệ
    if (min !== null || max !== null) {
        return { min, max, isNegotiable: false };
    }
    return null; // Trường hợp không parse được
};

/**
 * Kiểm tra quyền sở hữu job của một recruiter (Helper).
 * @param {number} jobId - ID của Job.
 * @param {number} recruiterId - ID của Recruiter cần kiểm tra.
 * @param {sql.Transaction | sql.Request} transactionOrRequest - Transaction hoặc Request đang hoạt động (BẮT BUỘC).
 * @returns {Promise<boolean>} True nếu recruiter sở hữu job, false nếu không.
 * @throws {Error} Nếu có lỗi CSDL.
 */
const checkJobOwnership = async (jobId, recruiterId, transactionOrRequest) => {
    try {
        // Đảm bảo transactionOrRequest hợp lệ
        if (!transactionOrRequest || (typeof transactionOrRequest.input !== 'function' && typeof transactionOrRequest.request?.input !== 'function' && typeof transactionOrRequest.query !== 'function')) { // Thêm check .query
             logDbError('checkJobOwnership', new Error('Invalid transaction or request object passed.'), { jobId, recruiterId });
             throw new Error('Đối tượng truy vấn CSDL không hợp lệ.');
        }

        // ===>>> SỬA LẠI DÒNG NÀY <<<===
        // Cũ: const req = transactionOrRequest.request ? transactionOrRequest.request() : transactionOrRequest;
        // Mới: Tạo request mới gắn với transaction/pool context được truyền vào
        const req = new sql.Request(transactionOrRequest);

        const result = await req
            .input('jobId_checkOwnership', sql.Int, jobId)
            .input('recruiterId_checkOwnership', sql.Int, recruiterId)
            .query('SELECT 1 FROM Jobs WHERE id = @jobId_checkOwnership AND recruiterId = @recruiterId_checkOwnership');

        return result.recordset.length > 0;
    } catch (error) {
        logDbError('checkJobOwnership', error, { jobId, recruiterId });
        // Ném lại lỗi cụ thể hơn nếu có thể
        if (error.message.includes('Invalid object name')) {
             throw new Error('Lỗi CSDL: Không tìm thấy bảng Jobs.');
        }
        throw new Error('Lỗi xảy ra khi kiểm tra quyền sở hữu tin tuyển dụng.'); // Giữ lỗi chung
    }
};

/**
 * Cập nhật (đồng bộ) danh sách Skills cho một Job trong một Transaction (Helper).
 * Xóa các skill cũ không còn trong danh sách mới, thêm các skill mới chưa có.
 * @param {number} jobId - ID của Job cần cập nhật skills.
 * @param {Array<string>} newSkillNames - Mảng TÊN các skill mới (đã được trim/lọc).
 * @param {sql.Transaction} transaction - Transaction đang hoạt động (BẮT BUỘC).
 */
const updateJobSkillsInTransaction = async (jobId, newSkillNames, transaction) => {
    console.log(`[updateJobSkillsInTransaction] Syncing skills for job ${jobId}. New skills:`, newSkillNames);
    // Đảm bảo đầu vào là mảng các chuỗi hợp lệ
    const validSkills = (Array.isArray(newSkillNames) ? newSkillNames : [])
        .map(s => typeof s === 'string' ? s.trim() : '')
        .filter(Boolean); // Lọc bỏ chuỗi rỗng

    const newSkillIds = new Set(); // Dùng Set để tránh trùng lặp skillId
    
    // 1. Lấy Skill IDs cho các skill mới (tạo nếu chưa có)
    for (const skillName of validSkills) {
        const skillRequest = new sql.Request(transaction).input('skillName_merge', sql.NVarChar(100), skillName);
        const skillResult = await skillRequest.query(`
            MERGE Skills AS target
            USING (SELECT @skillName_merge AS name) AS source
            ON target.name = source.name -- So sánh chính xác tên skill
            WHEN NOT MATCHED BY TARGET THEN
                INSERT (name) VALUES (source.name)
            OUTPUT inserted.id, $action AS Action; -- Lấy ID và biết là INSERT hay đã tồn tại
        `);
        
        let skillId;
        if (skillResult.recordset.length > 0) { // $action là 'INSERT' hoặc 'UPDATE' (mặc dù ở đây k update)
            skillId = skillResult.recordset[0].id;
            if (skillResult.recordset[0].Action === 'INSERT') {
                 console.log(`[updateJobSkillsInTransaction] Inserted new skill '${skillName}' with ID: ${skillId}`);
            }
        } else {
            // Nếu MERGE không trả về (trường hợp WHEN MATCHED và không có OUTPUT), query lại
            const existingSkill = await new sql.Request(transaction).input('skillName_exist', sql.NVarChar(100), skillName).query('SELECT id FROM Skills WHERE name = @skillName_exist');
            if (existingSkill.recordset.length === 0) {
                // Lỗi nghiêm trọng: MERGE thất bại
                throw new Error(`Không thể tìm thấy hoặc tạo skill '${skillName}' trong CSDL.`);
            }
            skillId = existingSkill.recordset[0].id;
        }
        newSkillIds.add(skillId); // Thêm ID vào Set
    }
    const newSkillIdArray = Array.from(newSkillIds);
    console.log(`[updateJobSkillsInTransaction] Finalized new Skill IDs for job ${jobId}:`, newSkillIdArray);

    // 2. Lấy Skill IDs hiện tại của Job
    const currentSkillsResult = await new sql.Request(transaction)
        .input('jobId_current', sql.Int, jobId)
        .query('SELECT skillId FROM JobSkills WHERE jobId = @jobId_current');
    const currentSkillIds = new Set(currentSkillsResult.recordset.map(r => r.skillId));
    console.log(`[updateJobSkillsInTransaction] Current Skill IDs for job ${jobId}:`, Array.from(currentSkillIds));

    // 3. Xác định Skills cần xóa (có trong current, không có trong new)
    const skillsToDelete = Array.from(currentSkillIds).filter(id => !newSkillIds.has(id));
    // 4. Xác định Skills cần thêm (có trong new, không có trong current)
    const skillsToAdd = newSkillIdArray.filter(id => !currentSkillIds.has(id));

    // 5. Thực thi Xóa liên kết cũ
    if (skillsToDelete.length > 0) {
        const deleteParams = skillsToDelete.map((_, i) => `@delSkillId${i}`).join(',');
        const deleteRequest = new sql.Request(transaction).input('jobId_del', sql.Int, jobId);
        skillsToDelete.forEach((id, i) => deleteRequest.input(`delSkillId${i}`, sql.Int, id));
        await deleteRequest.query(`DELETE FROM JobSkills WHERE jobId = @jobId_del AND skillId IN (${deleteParams})`);
        console.log(`[updateJobSkillsInTransaction] Deleted ${skillsToDelete.length} old skill links for job ${jobId}:`, skillsToDelete);
    }

    // 6. Thực thi Thêm liên kết mới (dùng Bulk Insert cho hiệu quả)
    if (skillsToAdd.length > 0) {
        const jobSkillsTable = new sql.Table('JobSkills');
        jobSkillsTable.columns.add('jobId', sql.Int, { nullable: false });
        jobSkillsTable.columns.add('skillId', sql.Int, { nullable: false });
        for (const skillId of skillsToAdd) { jobSkillsTable.rows.add(jobId, skillId); }
        await new sql.Request(transaction).bulk(jobSkillsTable);
        console.log(`[updateJobSkillsInTransaction] Bulk inserted ${skillsToAdd.length} new skill links for job ${jobId}:`, skillsToAdd);
    }

    if (skillsToDelete.length === 0 && skillsToAdd.length === 0) {
        console.log(`[updateJobSkillsInTransaction] No skill changes needed for job ${jobId}.`);
    }
};

// ====================================================================
// === NGHIỆP VỤ CHÍNH CỦA SERVICE (Public & Protected) ===
// ====================================================================

/**
 * [Public] Lấy danh sách việc làm công khai với bộ lọc "Tối Thượng" và phân trang.
 * @param {number} [page=1]
 * @param {number} [limit=DEFAULT_PAGE_LIMIT]
 * @param {object} [filters={}] Các filter: keyword, location, jobTypes[], salaryRange, experienceLevels[], remotePolicies[], companySlugs[], skillNames[]
 * @param {string} [sortBy='createdAt_desc'] Tùy chọn sắp xếp (VD: 'salary_desc')
 * @returns {Promise<{jobs: Array<object>, totalPages: number, currentPage: number, totalJobs: number}>}
 */
const findAllJobs = async (page = 1, limit = DEFAULT_PAGE_LIMIT, filters = {}, sortBy = 'createdAt_desc') => {
    // 1. Chuẩn hóa Input
    const currentPage = Math.max(1, Number(page) || 1);
    const currentLimit = Math.max(1, Number(limit) || DEFAULT_PAGE_LIMIT);
    const offset = (currentPage - 1) * currentLimit;
    console.log(`[findAllJobs] Fetching page ${currentPage}, limit ${currentLimit} with filters:`, filters, `sortBy: ${sortBy}`);

    const pool = await poolPromise;
    try {
        const request = pool.request(); // Request chính cho query
        let selectClauses = [ // Các cột cơ bản cần lấy
             'j.id', 'j.title', 'j.location', 'j.salary', 'j.jobType', 'j.createdAt', 'j.status', 'j.updatedAt',
             'j.minSalary', 'j.maxSalary', 'j.salaryCurrency', 'j.isSalaryNegotiable',
             'j.experienceLevel', 'j.remotePolicy', 'j.description', // Lấy cả description
             'c.id AS companyId', 'c.name AS companyName', 'c.logoUrl AS companyLogoUrl', 'c.slug AS companySlug'
        ];
        let joinClauses = ['LEFT JOIN Companies c ON j.companyId = c.id']; // Luôn join Company
        let whereClauses = ["j.status = 'Active'"]; // Chỉ lấy job 'Active'
        let hasSkillFilter = false; // Cờ kiểm tra nếu có lọc skill

        // 2. Xây dựng động các mệnh đề WHERE, JOIN, INPUTS
        
        // 2.1 Keyword Filter (Tìm trong title, description job VÀ tên company)
        if (filters.keyword && typeof filters.keyword === 'string' && filters.keyword.trim()) {
            const keywordTrimmed = filters.keyword.trim();
            whereClauses.push(`(j.title LIKE @keyword OR j.description LIKE @keyword OR c.name LIKE @keyword)`);
            request.input('keyword', sql.NVarChar, `%${keywordTrimmed}%`);
            console.log(`[findAllJobs] Applied keyword filter: %${keywordTrimmed}%`);
        }
        
        // 2.2 Location Filter
        if (filters.location && typeof filters.location === 'string' && filters.location.trim()) {
            const locationTrimmed = filters.location.trim();
            whereClauses.push(`j.location LIKE @location`);
            request.input('location', sql.NVarChar, `%${locationTrimmed}%`);
            console.log(`[findAllJobs] Applied location filter: %${locationTrimmed}%`);
        }
        
        // 2.3 Job Types Filter (Mảng)
        if (filters.jobTypes && Array.isArray(filters.jobTypes) && filters.jobTypes.length > 0) {
            const validJobTypes = filters.jobTypes.filter(type => typeof type === 'string' && type.trim());
            if (validJobTypes.length > 0) {
                const typeParams = validJobTypes.map((_, i) => `@jobType${i}`).join(',');
                whereClauses.push(`j.jobType IN (${typeParams})`);
                validJobTypes.forEach((type, i) => request.input(`jobType${i}`, sql.NVarChar(50), type));
                console.log(`[findAllJobs] Applied jobTypes filter: ${validJobTypes.join(', ')}`);
            }
        }
        
        // 2.4 Experience Levels Filter (Mảng)
        if (filters.experienceLevels && Array.isArray(filters.experienceLevels) && filters.experienceLevels.length > 0) {
            const validLevels = filters.experienceLevels.filter(lvl => typeof lvl === 'string' && lvl.trim());
            if (validLevels.length > 0) {
                const levelParams = validLevels.map((_, i) => `@level${i}`);
                // Thêm 'IS NULL' nếu 'Không yêu cầu' (chuỗi rỗng) được chọn
                const nullCheck = validLevels.includes('') ? 'OR j.experienceLevel IS NULL' : '';
                whereClauses.push(`(j.experienceLevel IN (${levelParams.join(',')}) ${nullCheck})`);
                validLevels.forEach((lvl, i) => request.input(`level${i}`, sql.NVarChar(50), lvl));
                console.log(`[findAllJobs] Applied experienceLevels filter: ${validLevels.join(', ')}`);
            }
        }
        
        // 2.5 Remote Policies Filter (Mảng)
        if (filters.remotePolicies && Array.isArray(filters.remotePolicies) && filters.remotePolicies.length > 0) {
            const validPolicies = filters.remotePolicies.filter(p => typeof p === 'string' && p.trim());
            if (validPolicies.length > 0) {
                const policyParams = validPolicies.map((_, i) => `@policy${i}`);
                const nullCheck = validPolicies.includes('') ? 'OR j.remotePolicy IS NULL' : '';
                whereClauses.push(`(j.remotePolicy IN (${policyParams.join(',')}) ${nullCheck})`);
                validPolicies.forEach((p, i) => request.input(`policy${i}`, sql.NVarChar(50), p));
                 console.log(`[findAllJobs] Applied remotePolicies filter: ${validPolicies.join(', ')}`);
            }
        }
        
        // 2.6 Company Slugs Filter (Mảng)
         if (filters.companySlugs && Array.isArray(filters.companySlugs) && filters.companySlugs.length > 0) {
            const validSlugs = filters.companySlugs.filter(s => typeof s === 'string' && s.trim());
            if (validSlugs.length > 0) {
                const slugParams = validSlugs.map((_, i) => `@compSlug${i}`);
                whereClauses.push(`c.slug IN (${slugParams.join(',')})`);
                validSlugs.forEach((s, i) => request.input(`compSlug${i}`, sql.NVarChar(255), s));
                console.log(`[findAllJobs] Applied companySlugs filter: ${validSlugs.join(', ')}`);
            }
        }
        
        // 2.7 Skill Names Filter (Mảng - Yêu cầu TẤT CẢ skill phải có)
        if (filters.skillNames && Array.isArray(filters.skillNames) && filters.skillNames.length > 0) {
             const validSkillNames = filters.skillNames.filter(name => typeof name === 'string' && name.trim());
             if (validSkillNames.length > 0) {
                 hasSkillFilter = true; // Đánh dấu cần join skill
                 joinClauses.push('JOIN JobSkills js ON j.id = js.jobId');
                 joinClauses.push('JOIN Skills s ON js.skillId = s.id');
                 const skillNameParams = validSkillNames.map((_, i) => `@skillName${i}`);
                 whereClauses.push(`s.name IN (${skillNameParams.join(',')})`);
                 validSkillNames.forEach((name, i) => request.input(`skillName${i}`, sql.NVarChar(100), name));
                 console.log(`[findAllJobs] Applied skillNames filter: ${validSkillNames.join(', ')}`);
             }
        }
        
        // 2.8 Salary Range Filter (Dựa trên cột số)
        const salaryRange = parseSalaryRangeFilter(filters.salaryRange);
        if (salaryRange) {
            console.log(`[findAllJobs] Parsed salary filter:`, salaryRange);
            if (salaryRange.isNegotiable) {
                whereClauses.push(`j.isSalaryNegotiable = 1`);
            } else {
                 let salaryConditions = ['(j.isSalaryNegotiable = 0 OR j.isSalaryNegotiable IS NULL)'];
                 const scale = 1000000; // Giả sử đơn vị là triệu VNĐ
                 if (salaryRange.min !== null) {
                     salaryConditions.push(`(j.maxSalary IS NULL OR j.maxSalary >= @filterMinSalary)`);
                     request.input('filterMinSalary', sql.Decimal(18, 2), salaryRange.min * scale);
                 }
                 if (salaryRange.max !== null) {
                     salaryConditions.push(`(j.minSalary IS NULL OR j.minSalary <= @filterMaxSalary)`);
                     request.input('filterMaxSalary', sql.Decimal(18, 2), salaryRange.max * scale);
                 }
                 if (salaryConditions.length > 1) {
                    whereClauses.push(`(${salaryConditions.join(' AND ')})`);
                    console.log(`[findAllJobs] Applied numeric salary filter (using new columns).`);
                 }
            }
        }

        // 3. Ghép các mệnh đề
        const whereCondition = `WHERE ${whereClauses.join(' AND ')}`;
        const joinCondition = joinClauses.join(' ');
        let groupByClause = '';
        let havingClause = '';
        
        // 3.1 Xử lý GROUP BY/HAVING nếu có lọc skill
         if (hasSkillFilter && Array.isArray(filters.skillNames) && filters.skillNames.length > 0) {
             const validSkillNamesCount = filters.skillNames.filter(Boolean).length;
             if (validSkillNamesCount > 0) {
                 // Cần GROUP BY theo tất cả các cột đã SELECT
                  const groupByColumns = [
                      'j.id', 'j.title', 'j.location', 'j.salary', 'j.jobType', 'j.createdAt', 'j.status', 'j.updatedAt',
                      'j.minSalary', 'j.maxSalary', 'j.salaryCurrency', 'j.isSalaryNegotiable',
                      'j.experienceLevel', 'j.remotePolicy', 'j.description',
                      'c.id', 'c.name', 'c.logoUrl', 'c.slug'
                  ].join(', ');
                 groupByClause = `GROUP BY ${groupByColumns}`;
                 havingClause = `HAVING COUNT(DISTINCT s.name) = ${validSkillNamesCount}`; // Đảm bảo khớp đủ số lượng skill
                 // Sửa lại selectClauses để dùng `j.id` cho GROUP BY
                 selectClauses[0] = 'j.id'; // Bỏ DISTINCT
             }
         }

        // 4. Query đếm tổng số lượng
        let countQuery;
         if (hasSkillFilter && havingClause) {
             countQuery = `SELECT COUNT(*) AS total FROM ( SELECT j.id FROM Jobs j ${joinCondition} ${whereCondition} ${groupByClause} ${havingClause} ) AS FilteredJobs;`;
         } else {
             countQuery = `SELECT COUNT(DISTINCT j.id) as total FROM Jobs j ${joinCondition} ${whereCondition};`;
         }
        console.log("[findAllJobs] Count Query:", countQuery.replace(/\s+/g, ' '));
        const countRequest = pool.request();
        for (const key in request.parameters) { countRequest.input(key, request.parameters[key].type, request.parameters[key].value); }
        const countResult = await countRequest.query(countQuery);
        const totalJobs = countResult.recordset[0].total;
        const totalPages = Math.ceil(totalJobs / currentLimit);
        console.log(`[findAllJobs] Total jobs found: ${totalJobs}, Total pages: ${totalPages}`);

        // 5. Query lấy dữ liệu job theo trang
        let jobs = [];
        if (totalJobs > 0) {
             // Thêm subquery lấy skills vào SELECT chính
             const skillsSubQuery = `(SELECT s_sub.name FROM JobSkills js_sub JOIN Skills s_sub ON js_sub.skillId = s_sub.id WHERE js_sub.jobId = j.id FOR JSON PATH) AS skillsJsonString`;
             // Đảm bảo không thêm trùng lặp
             if (!selectClauses.includes(skillsSubQuery)) {
                 selectClauses.push(skillsSubQuery);
             }
             // Xây dựng lại SELECT clause cuối cùng
             const finalSelectClause = (hasSkillFilter && havingClause) ? selectClauses.join(', ') : 'DISTINCT ' + selectClauses.join(', ');
             // Sắp xếp
             const orderByClause = `ORDER BY ${VALID_SORT_OPTIONS[sortBy] || VALID_SORT_OPTIONS['createdAt_desc']}`;
             const jobsQuery = `
                SELECT ${finalSelectClause}
                FROM Jobs j
                ${joinCondition}
                ${whereCondition}
                ${groupByClause}
                ${havingClause}
                ${orderByClause}
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY;
            `;
            request.input('offset', sql.Int, offset);
            request.input('limit', sql.Int, currentLimit);
            console.log("[findAllJobs] Jobs Query:", jobsQuery.replace(/\s+/g, ' '));
            const jobsResult = await request.query(jobsQuery);

            // 6. Map kết quả trả về (chi tiết)
            jobs = jobsResult.recordset.map(job => {
                 let skills = [];
                 try { if (job.skillsJsonString) { skills = JSON.parse(job.skillsJsonString).map(s => s.name); } }
                 catch (e) { console.warn(`[findAllJobs] Bad skills JSON for job ${job.id}: ${e.message}`); }
                 // Cắt ngắn description để preview
                 const descriptionPreview = job.description?.substring(0, 150) + (job.description?.length > 150 ? '...' : '');
                 // Trả về object job chuẩn hóa
                 return {
                     id: job.id, title: job.title, location: job.location, salary: job.salary, jobType: job.jobType, postedDate: job.createdAt, status: job.status, descriptionPreview: descriptionPreview,
                     minSalary: job.minSalary, maxSalary: job.maxSalary, salaryCurrency: job.salaryCurrency, isSalaryNegotiable: job.isSalaryNegotiable,
                     experienceLevel: job.experienceLevel, remotePolicy: job.remotePolicy, updatedAt: job.updatedAt,
                     coordinates: getLocationCoordinates(job.location), // Lấy tọa độ
                     company: { id: job.companyId, name: job.companyName, logoUrl: job.companyLogoUrl, slug: job.companySlug },
                     skills: skills // Mảng tên skills
                 };
            });
        }

        console.log(`[findAllJobs] Returning ${jobs.length} jobs for page ${currentPage}`);
        return { jobs, totalPages, currentPage, totalJobs };

    } catch (error) {
        logDbError('findAllJobs', error, { page, limit, filters, sortBy });
        throw new Error('Lỗi xảy ra trong quá trình truy vấn danh sách việc làm.');
    }
};


/**
 * [Public] Tìm chi tiết một việc làm dựa vào ID (Phiên bản Tối Thượng).
 * @param {number} jobId - ID của job cần tìm.
 * @returns {Promise<object>} Thông tin chi tiết job (bao gồm skills, relatedJobs, company info).
 * @throws {Error} Nếu không tìm thấy job hoặc có lỗi CSDL.
 */
const findJobById = async (jobId) => {
    // 1. Validate Input
    if (!jobId || isNaN(parseInt(jobId, 10))) {
         console.warn(`[findJobById] Invalid Job ID received: ${jobId}`);
         throw new Error('Job ID không hợp lệ.');
    }
    const validJobId = parseInt(jobId, 10);
    console.log(`[findJobById] Fetching details for job ID: ${validJobId}`);

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        console.log(`[findJobById] Transaction started for Job ID: ${validJobId}`);
        const request = new sql.Request(transaction).input('jobId', sql.Int, validJobId);

        // 2. Query thông tin chính của Job và Company (chi tiết)
        const jobQuery = `
            SELECT
                j.*, -- Lấy tất cả cột từ Jobs
                c.id as companyId_alias, c.name as companyName, c.logoUrl as companyLogoUrl,
                c.description as companyBio, c.slug as companySlug, c.website as companyWebsite,
                c.companySize, c.industry, c.mainLocation as companyLocation
            FROM Jobs j
            LEFT JOIN Companies c ON j.companyId = c.id
            WHERE j.id = @jobId AND j.status = 'Active'; -- Chỉ lấy job đang active
        `;
        const jobResult = await request.query(jobQuery);
        if (jobResult.recordset.length === 0) {
             await transaction.rollback();
             console.log(`[findJobById] Job not found or not active: ${validJobId}`);
             throw new Error('Không tìm thấy tin tuyển dụng hoặc tin đã hết hạn.');
        }
        const jobDetails = jobResult.recordset[0];
        console.log(`[findJobById] Found job details for ID: ${validJobId}`);

        // 3. Query lấy danh sách Skills
        const skillsQuery = `SELECT s.name FROM Skills s JOIN JobSkills js ON s.id = js.skillId WHERE js.jobId = @jobId ORDER BY s.name;`;
        // Tạo request mới trong transaction để tránh xung đột param
        const skillsResult = await new sql.Request(transaction).input('jobId', sql.Int, validJobId).query(skillsQuery);
        const skills = skillsResult.recordset.map(s => s.name);
        console.log(`[findJobById] Found ${skills.length} skills for job ID ${validJobId}.`);

        // 4. Query lấy các Jobs liên quan
        const relatedJobsQuery = `
            SELECT DISTINCT TOP 7
                j_rel.id, j_rel.title, j_rel.location, j_rel.salary, j_rel.isSalaryNegotiable,
                c_rel.name as companyName, c_rel.slug as companySlug,
                CASE WHEN j_rel.companyId = @companyId THEN 1 ELSE 0 END as isSameCompany,
                (SELECT COUNT(*) FROM JobSkills js_rel_inner JOIN JobSkills js_orig ON js_rel_inner.skillId = js_orig.skillId WHERE js_rel_inner.jobId = j_rel.id AND js_orig.jobId = @jobId) as commonSkillsCount
            FROM Jobs j_rel
            JOIN Companies c_rel ON j_rel.companyId = c_rel.id
            LEFT JOIN JobSkills js_rel ON j_rel.id = js_rel.jobId
            WHERE j_rel.id != @jobId AND j_rel.status = 'Active'
              AND (j_rel.companyId = @companyId OR js_rel.skillId IN (SELECT skillId FROM JobSkills WHERE jobId = @jobId))
            ORDER BY
                isSameCompany DESC, commonSkillsCount DESC, j_rel.createdAt DESC;
        `;
        const relatedJobsResult = await new sql.Request(transaction)
            .input('jobId', sql.Int, validJobId)
            .input('companyId', sql.Int, jobDetails.companyId)
            .query(relatedJobsQuery);
        console.log(`[findJobById] Found ${relatedJobsResult.recordset.length} potential related jobs.`);

        await transaction.commit(); // Hoàn tất transaction
        console.log(`[findJobById] Transaction committed for Job ID: ${validJobId}`);

        // 5. Format kết quả trả về (Tối Thượng)
        // Loại bỏ các cột company thừa từ jobDetails (để tránh trùng lặp)
        const { companyId_alias, companyName, companyLogoUrl, companyBio, companySlug, companyWebsite, companySize, industry, companyLocation, ...restOfJobDetails } = jobDetails;
        return {
            ...restOfJobDetails, // Chứa tất cả các trường của Job (id, title, minSalary, status, ...)
            company: { // Gom thông tin company vào object riêng
                id: jobDetails.companyId, // Dùng companyId gốc từ bảng Jobs
                name: companyName,
                logoUrl: companyLogoUrl,
                slug: companySlug,
                bio: companyBio,
                website: companyWebsite,
                size: companySize,
                industry: industry,
                location: companyLocation
            },
            skills: skills, // Mảng tên skills
            relatedJobs: relatedJobsResult.recordset.slice(0, 5).map(rj => ({ // Lọc 5 job liên quan nhất
                id: rj.id,
                title: rj.title,
                location: rj.location,
                salary: rj.isSalaryNegotiable ? 'Thỏa thuận' : (rj.salary || 'N/A'),
                companyName: rj.companyName,
                companySlug: rj.companySlug
            }))
        };
    } catch (error) {
        if (transaction && transaction.active) {
            console.warn(`[findJobById] Rolling back transaction for Job ID: ${validJobId} due to error.`);
            await transaction.rollback();
        }
        if (error.message.includes('Không tìm thấy')) throw error; // Ném lại lỗi 404
        logDbError('findJobById', error, { jobId: validJobId });
        throw new Error('Lỗi xảy ra trong quá trình truy vấn chi tiết việc làm.');
    }
};


/**
 * [Protected] Tạo một tin tuyển dụng mới cho nhà tuyển dụng (SỬA LỖI @recruiterId).
 * @param {number} recruiterId - ID của nhà tuyển dụng.
 * @param {object} jobData - Dữ liệu job từ request body.
 * @returns {Promise<object>} Thông tin job vừa tạo.
 */
const createJob = async (recruiterId, jobData) => {
    // 1. Validate Input Chi tiết
    const { title, description, location, salary, jobType, skills,
            minSalary, maxSalary, salaryCurrency, isSalaryNegotiable,
            experienceLevel, remotePolicy, status = 'Active', expiresAt } = jobData;
    console.log(`[createJob] Attempting to create job for recruiter ID: ${recruiterId}`, jobData);
    if (!recruiterId || isNaN(recruiterId)) throw new Error('recruiterId là bắt buộc (lỗi xác thực).');
    if (!title?.trim()) throw new Error('Dữ liệu không hợp lệ: Tiêu đề công việc là bắt buộc.');
    if (!description?.trim()) throw new Error('Dữ liệu không hợp lệ: Mô tả công việc là bắt buộc.');
    const validSkills = (Array.isArray(skills) ? skills : []).map(s => s.trim()).filter(Boolean);
    if (validSkills.length === 0) throw new Error('Dữ liệu không hợp lệ: Cần ít nhất một kỹ năng.');
    if (minSalary && maxSalary && parseFloat(minSalary) > parseFloat(maxSalary)) { throw new Error('Dữ liệu không hợp lệ: Lương tối thiểu không được lớn hơn lương tối đa.'); }
    if (status && !VALID_JOB_STATUSES.includes(status)) { throw new Error(`Dữ liệu không hợp lệ: Trạng thái job không hợp lệ.`); }
    
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        console.log(`[createJob] Transaction started for recruiter ID: ${recruiterId}`);

        // 2. Lấy companyId của Recruiter và Kiểm tra
        const userCompanyRequest = new sql.Request(transaction); // Request riêng
        userCompanyRequest.input('recruiterId_check', sql.Int, recruiterId); // Input cho request này
        const userCompanyResult = await userCompanyRequest.query('SELECT companyId, role FROM Users WHERE id = @recruiterId_check');
        if (userCompanyResult.recordset.length === 0) { await transaction.rollback(); throw new Error('Tài khoản nhà tuyển dụng không tồn tại.'); }
        const { companyId, role } = userCompanyResult.recordset[0];
        if (role !== 'recruiter') { await transaction.rollback(); throw new Error('Tài khoản này không phải là nhà tuyển dụng.'); }
        if (!companyId) { await transaction.rollback(); console.warn(`[createJob] Recruiter ${recruiterId} has no associated companyId.`); throw new Error('Tài khoản nhà tuyển dụng chưa được liên kết với công ty. Vui lòng cập nhật hồ sơ công ty.'); }
        console.log(`[createJob] Recruiter ${recruiterId} belongs to Company ID: ${companyId}`);

        // 3. Chèn Job mới vào bảng Jobs
        const jobRequest = new sql.Request(transaction); // Tạo request MỚI
        // Input TẤT CẢ các biến với tên duy nhất
        jobRequest.input('recruiterId', sql.Int, recruiterId); // Đây là biến @recruiterId
        jobRequest.input('companyId', sql.Int, companyId);
        jobRequest.input('title', sql.NVarChar(255), title.trim());
        jobRequest.input('description', sql.NText, description.trim());
        jobRequest.input('location', sql.NVarChar(255), location ? location.trim() : null);
        jobRequest.input('salary', sql.NVarChar(100), salary ? salary.trim() : null);
        jobRequest.input('minSalary', sql.Decimal(18, 2), minSalary ? parseFloat(minSalary) : null);
        jobRequest.input('maxSalary', sql.Decimal(18, 2), maxSalary ? parseFloat(maxSalary) : null);
        jobRequest.input('salaryCurrency', sql.NVarChar(10), (salaryCurrency || 'VND').toUpperCase());
        jobRequest.input('isSalaryNegotiable', sql.Bit, isSalaryNegotiable ? 1 : 0);
        jobRequest.input('jobType', sql.NVarChar(50), jobType || 'Full-time');
        jobRequest.input('experienceLevel', sql.NVarChar(50), experienceLevel || null);
        jobRequest.input('remotePolicy', sql.NVarChar(50), remotePolicy || null);
        jobRequest.input('status', sql.NVarChar(50), status);
        jobRequest.input('expiresAt', sql.DateTime2, expiresAt || null);

        // Câu lệnh INSERT sử dụng các tên biến đã input
        const jobResult = await jobRequest.query(`
            INSERT INTO Jobs (
                recruiterId, companyId, title, description, location, salary,
                minSalary, maxSalary, salaryCurrency, isSalaryNegotiable,
                jobType, experienceLevel, remotePolicy, status, expiresAt
            )
            OUTPUT INSERTED.* -- Lấy tất cả các cột của job vừa tạo
            VALUES (
                @recruiterId, @companyId, @title, @description, @location, @salary,
                @minSalary, @maxSalary, @salaryCurrency, @isSalaryNegotiable,
                @jobType, @experienceLevel, @remotePolicy, @status, @expiresAt
            );
        `);
        const newJob = jobResult.recordset[0];
        const newJobId = newJob.id;
        console.log(`[createJob] Inserted new job with ID: ${newJobId}`);

        // 4. Xử lý Skills (MERGE và BULK INSERT)
        // Hàm này sử dụng request riêng bên trong nó, không xung đột
        await updateJobSkillsInTransaction(newJobId, validSkills, transaction);

        await transaction.commit();
        console.log(`[createJob] Transaction committed. Job ${newJobId} created successfully.`);

        // 5. Trả về Job mới (đã có skills)
        return { ...newJob, skills: validSkills }; // Trả về object job đầy đủ từ DB và mảng tên skill
    } catch (error) {
        if (transaction && transaction.active) await transaction.rollback();
        logDbError('createJob', error, { recruiterId, jobData: { ...jobData, skills: validSkills } }); // Log data đã chuẩn hóa
        throw error; // Ném lại lỗi (ví dụ: lỗi từ updateJobSkillsInTransaction)
    }
};


/**
 * [Protected] Lấy danh sách jobs đã đăng bởi một recruiter.
 * @param {number} recruiterId - ID của nhà tuyển dụng.
 * @param {object} [filters={}] Filter theo status (VD: { status: 'Active' })
 * @param {string} [sortBy='createdAt_desc']
 * @returns {Promise<Array<object>>} Mảng các object job.
 */
const findJobsByRecruiter = async (recruiterId, filters = {}, sortBy = 'createdAt_desc') => {
    if (!recruiterId || isNaN(recruiterId)) throw new Error('Recruiter ID không hợp lệ.');
    console.log(`[findJobsByRecruiter] Fetching jobs for recruiter ID: ${recruiterId}, filters:`, filters, `sortBy: ${sortBy}`);
    try {
        const pool = await poolPromise;
        const request = pool.request().input('recruiterId', sql.Int, recruiterId);
        let whereClauses = ['j.recruiterId = @recruiterId'];
        // Filter theo status (nếu có)
        if (filters.status && VALID_JOB_STATUSES.includes(filters.status)) {
            whereClauses.push('j.status = @status');
            request.input('status', sql.NVarChar(50), filters.status);
        }
        const whereCondition = `WHERE ${whereClauses.join(' AND ')}`;
        const orderByClause = `ORDER BY ${VALID_SORT_OPTIONS[sortBy] || VALID_SORT_OPTIONS['createdAt_desc']}`;
        // Lấy tất cả các cột cần thiết cho JobManagementRow
        const query = `
            SELECT
                j.*, -- Lấy hết cột của Job
                (SELECT COUNT(*) FROM JobApplications ja WHERE ja.jobId = j.id) AS applicants,
                (SELECT s.name FROM JobSkills js JOIN Skills s ON js.skillId = s.id WHERE js.jobId = j.id FOR JSON PATH) AS skillsJsonString -- Lấy skills
            FROM Jobs j
            ${whereCondition}
            ${orderByClause};
        `;
        console.log('[findJobsByRecruiter] Query:', query.replace(/\s+/g, ' '));
        const result = await request.query(query);
        console.log(`[findJobsByRecruiter] Found ${result.recordset.length} jobs for recruiter ID: ${recruiterId}`);
        // Map lại skills
        return result.recordset.map(job => {
             let skills = [];
             try { if (job.skillsJsonString) { skills = JSON.parse(job.skillsJsonString).map(s => s.name); } }
             catch (e) { console.warn(`[findJobsByRecruiter] Bad skills JSON for job ${job.id}: ${e.message}`); }
             const { skillsJsonString, ...restOfJob } = job; // Loại bỏ chuỗi JSON thừa
             return { ...restOfJob, skills };
        });
    } catch (error) {
        logDbError('findJobsByRecruiter', error, { recruiterId, filters, sortBy });
        throw new Error('Lỗi khi truy vấn danh sách tin tuyển dụng của bạn.');
    }
};


/**
 * [Protected] Sinh viên tạo một đơn ứng tuyển mới cho một Job.
 * @param {object} applicationData - { jobId, studentId, coverLetter }.
 * @returns {Promise<{success: boolean, application: object}>} Kết quả ứng tuyển.
 */
const createApplication = async ({ jobId, studentId, coverLetter }) => {
    // 1. Kiểm tra tính hợp lệ của Input
    const validJobId = parseInt(jobId, 10);
    const validStudentId = parseInt(studentId, 10);

    if (isNaN(validJobId) || validJobId <= 0 || isNaN(validStudentId) || validStudentId <= 0) {
        console.warn(`[createApplication] Invalid input received: jobId=${jobId}, studentId=${studentId}`);
        throw new Error('Dữ liệu không hợp lệ: Job ID và Student ID phải là số hợp lệ.');
    }
    console.log(`[createApplication] Attempt: Student ID ${validStudentId} applying for Job ID ${validJobId}`);

    const pool = await poolPromise; // Lấy connection pool
    const transaction = new sql.Transaction(pool); // Tạo một transaction mới
    try {
        await transaction.begin();
        console.log(`[createApplication] Transaction started for (Job:${validJobId}, Student:${validStudentId})`);
        const request = new sql.Request(transaction); // Tạo request object gắn liền với transaction

        // 2. Kiểm tra xem sinh viên đã ứng tuyển job này chưa (chống trùng lặp)
        request.input('jobId_check', sql.Int, validJobId);
        request.input('studentId_check', sql.Int, validStudentId);
        const checkResult = await request.query(`SELECT 1 FROM JobApplications WHERE jobId = @jobId_check AND studentId = @studentId_check`);
        if (checkResult.recordset.length > 0) {
            await transaction.rollback();
            console.warn(`[createApplication] Duplicate application attempt blocked for (Job:${validJobId}, Student:${validStudentId})`);
            throw new Error('Bạn đã ứng tuyển vào vị trí này rồi.');
        }

        // 3. Kiểm tra xem Job có tồn tại và đang ở trạng thái 'Active' không
        const jobCheckRequest = new sql.Request(transaction); // Tạo request mới
        jobCheckRequest.input('jobId_status_check', sql.Int, validJobId);
        const jobCheckResult = await jobCheckRequest.query(`SELECT status FROM Jobs WHERE id = @jobId_status_check`);
        if (jobCheckResult.recordset.length === 0) {
            await transaction.rollback();
            console.warn(`[createApplication] Job not found: ${validJobId}`);
            throw new Error('Tin tuyển dụng không tồn tại hoặc đã bị xóa.');
        }
        const jobStatus = jobCheckResult.recordset[0].status;
        if (jobStatus !== 'Active') {
            await transaction.rollback();
            console.warn(`[createApplication] Job ${validJobId} is not 'Active'. Current status: ${jobStatus}`);
            throw new Error('Tin tuyển dụng này hiện không nhận đơn ứng tuyển (có thể đã hết hạn hoặc bị ẩn).');
        }

        // 4. Chèn (INSERT) đơn ứng tuyển mới
        console.log(`[createApplication] All checks passed. Inserting application for (Job:${validJobId}, Student:${validStudentId})...`);
        const insertRequest = new sql.Request(transaction);
        insertRequest.input('jobId_insert', sql.Int, validJobId);
        insertRequest.input('studentId_insert', sql.Int, validStudentId);
        insertRequest.input('coverLetter_insert', sql.NText, (coverLetter && coverLetter.trim()) ? coverLetter.trim() : null);
        insertRequest.input('status_insert', sql.NVarChar(50), 'Pending');
        const insertResult = await insertRequest.query(`
            INSERT INTO JobApplications (jobId, studentId, coverLetter, status, appliedAt, statusChangedAt)
            OUTPUT INSERTED.* -- Trả về TOÀN BỘ dòng vừa được chèn
            VALUES (@jobId_insert, @studentId_insert, @coverLetter_insert, @status_insert, GETUTCDATE(), GETUTCDATE());
        `);
        if (insertResult.recordset.length === 0) {
             await transaction.rollback();
             console.error(`[createApplication] INSERT failed unexpectedly for (Job:${validJobId}, Student:${validStudentId}).`);
             throw new Error('Không thể tạo đơn ứng tuyển do lỗi hệ thống.');
        }

        // 5. Commit Transaction
        await transaction.commit();
        const newApplication = insertResult.recordset[0];
        console.log(`[createApplication] Transaction committed. Application created successfully. ID: ${newApplication.id}`);
        
        // 6. Trả về kết quả thành công
        return { success: true, application: newApplication };
    } catch (error) {
        // 7. Xử lý lỗi (Rollback Transaction)
        if (transaction && transaction.active) {
            console.warn(`[createApplication] Rolling back transaction for (Job:${validJobId}, Student:${validStudentId}) due to error.`);
            await transaction.rollback();
        }
        if (error.number === 2627 || error.number === 2601) { // Lỗi UNIQUE constraint
             logDbError('createApplication - Constraint Violation', error, { jobId, studentId });
            throw new Error('Bạn đã ứng tuyển vào vị trí này rồi (lỗi trùng lặp).');
        }
        logDbError('createApplication', error, { jobId, studentId });
        throw new Error(error.message || 'Lỗi xảy ra trong quá trình nộp đơn ứng tuyển.');
    }
};


/**
 * [Protected] Cập nhật thông tin một tin tuyển dụng (chỉ chủ sở hữu).
 * @param {number} jobId - ID của Job cần cập nhật.
 * @param {number} recruiterId - ID của NTD thực hiện (để kiểm tra quyền).
 * @param {object} jobData - Dữ liệu cần cập nhật.
 * @returns {Promise<object>} Thông tin job sau khi cập nhật (kèm skills).
 */
const updateJob = async (jobId, recruiterId, jobData) => {
    console.log(`[updateJob] Attempting to update job ID: ${jobId} by recruiter ID: ${recruiterId}`);
    // 1. Validate Input
    if (!jobId || isNaN(jobId) || !recruiterId || isNaN(recruiterId)) throw new Error('Job ID và Recruiter ID không hợp lệ.');
    if (!jobData || Object.keys(jobData).length === 0) throw new Error('Không có dữ liệu để cập nhật.');

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        // 2. Kiểm tra quyền sở hữu (dùng request của transaction)
        const request = new sql.Request(transaction); // Request dùng chung
        if (!await checkJobOwnership(jobId, recruiterId, request)) {
            await transaction.rollback();
            throw new Error('Bạn không có quyền chỉnh sửa tin tuyển dụng này.');
        }

        // 3. Build câu lệnh UPDATE động
        const allowedFields = [ 'title', 'description', 'location', 'salary', 'minSalary', 'maxSalary', 'salaryCurrency', 'isSalaryNegotiable', 'jobType', 'experienceLevel', 'remotePolicy', 'status', 'expiresAt' ];
        let setClauses = [];
        request.input('jobId_update', sql.Int, jobId); // Input jobId cho WHERE clause
        for (const field of allowedFields) {
            if (jobData[field] !== undefined) { // Cho phép cập nhật cả giá trị null/rỗng
                const paramName = `param_${field}`;
                let value = jobData[field];
                let sqlType;
                // Xác định kiểu dữ liệu và chuẩn hóa
                switch (field) {
                    case 'title': sqlType = sql.NVarChar(255); value = value?.trim() || null; if (!value) throw new Error("Tiêu đề không được để trống."); break;
                    case 'description': sqlType = sql.NText; value = value?.trim() || null; if (!value) throw new Error("Mô tả không được để trống."); break;
                    case 'location': sqlType = sql.NVarChar(255); value = value?.trim() || null; break;
                    case 'salary': sqlType = sql.NVarChar(100); value = value?.trim() || null; break;
                    case 'minSalary': case 'maxSalary': sqlType = sql.Decimal(18, 2); value = (value !== '' && value !== null) ? parseFloat(value) : null; if (isNaN(value)) value = null; break;
                    case 'salaryCurrency': sqlType = sql.NVarChar(10); value = (value?.trim() || 'VND').toUpperCase(); break;
                    case 'isSalaryNegotiable': sqlType = sql.Bit; value = value ? 1 : 0; break;
                    case 'jobType': case 'experienceLevel': case 'remotePolicy': case 'status': sqlType = sql.NVarChar(50); value = value?.trim() || null; break;
                    case 'expiresAt': sqlType = sql.DateTime2; value = value || null; break;
                    default: continue;
                }
                 if (field === 'status' && value && !VALID_JOB_STATUSES.includes(value)) throw new Error(`Trạng thái job không hợp lệ: ${value}`);
                setClauses.push(`${field} = @${paramName}`);
                request.input(paramName, sqlType, value);
            }
        }
        // Validation lương min/max
        const finalMinSalary = (jobData.minSalary !== undefined) ? (jobData.minSalary ? parseFloat(jobData.minSalary) : null) : jobData.minSalary; // Giữ undefined nếu k có
        const finalMaxSalary = (jobData.maxSalary !== undefined) ? (jobData.maxSalary ? parseFloat(jobData.maxSalary) : null) : jobData.maxSalary;
        if (finalMinSalary !== null && finalMaxSalary !== null && finalMinSalary > finalMaxSalary) { throw new Error('Lương tối thiểu không được lớn hơn lương tối đa.'); }

        if (setClauses.length === 0 && jobData.skills === undefined) { // Không có gì thay đổi
             await transaction.rollback();
             throw new Error('Không có thông tin thay đổi nào được cung cấp.');
        }

        // 4. Cập nhật bảng Jobs (nếu có)
        let updatedJobResult;
        if (setClauses.length > 0) {
            setClauses.push('updatedAt = GETUTCDATE()');
            const updateQuery = `UPDATE Jobs SET ${setClauses.join(', ')} OUTPUT INSERTED.* WHERE id = @jobId_update;`;
            console.log("[updateJob] Update Query:", updateQuery);
            updatedJobResult = await request.query(updateQuery);
            if (updatedJobResult.recordset.length === 0) throw new Error('Cập nhật thông tin job thất bại.');
            console.log(`[updateJob] Job details updated for ID: ${jobId}`);
        } else {
             const currentJob = await new sql.Request(transaction).input('jobId', sql.Int, jobId).query('SELECT * FROM Jobs WHERE id = @jobId');
             updatedJobResult = currentJob;
        }

        // 5. Cập nhật Skills (nếu có trong jobData)
        if (jobData.skills !== undefined) { // Cho phép truyền mảng rỗng để xóa hết skill
            await updateJobSkillsInTransaction(jobId, jobData.skills, transaction);
        }

        await transaction.commit();
        console.log(`[updateJob] Transaction committed. Job ${jobId} updated successfully.`);

        // 6. Query lại skills để trả về kết quả đầy đủ
        const finalSkillsResult = await pool.request().input('jobId_final', sql.Int, jobId).query('SELECT s.name FROM JobSkills js JOIN Skills s ON js.skillId = s.id WHERE js.jobId = @jobId_final');
        const finalSkills = finalSkillsResult.recordset.map(s => s.name);
        return { ...updatedJobResult.recordset[0], skills: finalSkills };

    } catch (error) {
        if (transaction && transaction.active) await transaction.rollback();
        logDbError('updateJob', error, { jobId, recruiterId, jobData });
        throw error;
    }
};


/**
 * [Protected] Thay đổi trạng thái của một tin tuyển dụng (chỉ chủ sở hữu).
 * @param {number} jobId
 * @param {number} recruiterId
 * @param {string} newStatus - Trạng thái mới ('Active', 'Inactive', 'Expired').
 * @returns {Promise<object>} Job với trạng thái đã cập nhật.
 */
const changeJobStatus = async (jobId, recruiterId, newStatus) => {
    // 1. Validate Input
    console.log(`[changeJobStatus] Attempting status change for job ${jobId} to '${newStatus}' by recruiter ${recruiterId}`);
    if (!jobId || isNaN(jobId) || !recruiterId || isNaN(recruiterId)) throw new Error('Job ID và Recruiter ID không hợp lệ.');
    if (!newStatus || !VALID_JOB_STATUSES.includes(newStatus)) throw new Error(`Trạng thái mới không hợp lệ.`);

    const pool = await poolPromise;
    const request = pool.request();
    try {
        // 2. Kiểm tra quyền sở hữu và Cập nhật trong cùng 1 query
        request.input('jobId', sql.Int, jobId);
        request.input('recruiterId', sql.Int, recruiterId);
        request.input('newStatus', sql.NVarChar(50), newStatus);
        const result = await request.query(`
            UPDATE Jobs SET status = @newStatus, updatedAt = GETUTCDATE()
            OUTPUT INSERTED.*
            WHERE id = @jobId AND recruiterId = @recruiterId; -- Chỉ update nếu đúng chủ sở hữu
        `);

        if (result.recordset.length === 0) {
            // Không update được, kiểm tra lý do
            const jobExists = await pool.request().input('jobId_exists', sql.Int, jobId).query('SELECT recruiterId FROM Jobs WHERE id = @jobId_exists');
            if (jobExists.recordset.length === 0) {
                 throw new Error('Không tìm thấy tin tuyển dụng.');
            } else if (jobExists.recordset[0].recruiterId !== recruiterId) {
                 throw new Error('Bạn không có quyền thay đổi trạng thái tin tuyển dụng này.');
            }
             throw new Error('Cập nhật trạng thái thất bại không rõ lý do.');
        }
        console.log(`[changeJobStatus] Status of job ${jobId} changed to '${newStatus}'.`);

        // 3. Query lại skills để trả về kết quả đầy đủ
         const finalSkillsResult = await pool.request().input('jobId_skills', sql.Int, jobId).query('SELECT s.name FROM JobSkills js JOIN Skills s ON js.skillId = s.id WHERE js.jobId = @jobId_skills');
         const finalSkills = finalSkillsResult.recordset.map(s => s.name);
        return { ...result.recordset[0], skills: finalSkills };

    } catch (error) {
        logDbError('changeJobStatus', error, { jobId, recruiterId, newStatus });
        throw error;
    }
};


/**
 * [Protected] Xóa vĩnh viễn một tin tuyển dụng (chỉ chủ sở hữu).
 * @param {number} jobId
 * @param {number} recruiterId
 * @returns {Promise<{success: boolean, message: string}>}
 */
const deleteJob = async (jobId, recruiterId) => {
    console.log(`[deleteJob] Attempting to delete job ID: ${jobId} by recruiter ID: ${recruiterId}`);
    if (!jobId || isNaN(jobId) || !recruiterId || isNaN(recruiterId)) throw new Error('Job ID và Recruiter ID không hợp lệ.');

    const pool = await poolPromise;
    // Dùng transaction để đảm bảo nếu check pass mà delete fail (hiếm) thì rollback
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction); // Gắn request vào transaction

        // 1. Kiểm tra quyền sở hữu
        if (!await checkJobOwnership(jobId, recruiterId, request)) {
            await transaction.rollback();
            throw new Error('Bạn không có quyền xóa tin tuyển dụng này.');
        }

        // 2. Xóa Job (ON DELETE CASCADE sẽ tự xóa JobSkills và JobApplications)
        // Cần tạo request mới hoặc clear parameters. Tạo mới an toàn hơn.
        const deleteRequest = new sql.Request(transaction)
            .input('jobId_del', sql.Int, jobId)
            .input('recruiterId_del', sql.Int, recruiterId);
        const result = await deleteRequest.query('DELETE FROM Jobs WHERE id = @jobId_del AND recruiterId = @recruiterId_del');

        if (result.rowsAffected[0] === 0) {
             await transaction.rollback();
             throw new Error('Không tìm thấy tin tuyển dụng để xóa (lỗi logic).');
        }

        await transaction.commit();
        console.log(`[deleteJob] Job ID: ${jobId} deleted successfully.`);
        return { success: true, message: 'Xóa tin tuyển dụng thành công.' };

    } catch (error) {
        if (transaction && transaction.active) await transaction.rollback();
        logDbError('deleteJob', error, { jobId, recruiterId });
        throw new Error('Lỗi xảy ra trong quá trình xóa tin tuyển dụng.');
    }
};

// ====================================================================
// === XUẤT CÁC HÀM ĐỂ CONTROLLERS SỬ DỤNG ===
// ====================================================================
module.exports = {
    // Public
    findAllJobs: findAllJobs,
    findJobById: findJobById,
    // Protected (Student)
    createApplication: createApplication,
    // Protected (Recruiter)
    createJob: createJob,
    findJobsByRecruiter: findJobsByRecruiter,
    updateJob: updateJob,
    changeJobStatus: changeJobStatus,
    deleteJob: deleteJob,
    // Export hàm helper
    checkJobOwnership: checkJobOwnership,
};
console.log("✅✅✅ jobs.service.js (Tối Thượng v2.4 - CRUD Master - Fixed All) loaded.");