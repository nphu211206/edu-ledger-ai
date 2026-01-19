// File: server/services/company.service.js
const { sql, poolPromise } = require('../config/db.js');

/**
 * Tạo slug từ tên công ty (đảm bảo slug là duy nhất nếu cần)
 * @param {string} name Tên công ty
 * @returns {string} slug
 */
const createSlug = (name) => {
    // Logic tạo slug giữ nguyên như trong auth.service.js
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
};


/**
 * Tìm thông tin công ty bằng ID.
 * @param {number} companyId - ID của công ty.
 * @returns {Promise<object|null>} Thông tin công ty hoặc null nếu không tìm thấy.
 */
const findCompanyById = async (companyId) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('companyId', sql.Int, companyId)
            .query('SELECT * FROM Companies WHERE id = @companyId');
        return result.recordset[0] || null;
    } catch (error) {
        console.error(`Error in findCompanyById for ID ${companyId}:`, error);
        throw new Error('Lỗi khi truy vấn thông tin công ty.');
    }
};

/**
 * Cập nhật thông tin công ty.
 * @param {number} companyId - ID công ty cần cập nhật.
 * @param {object} companyData - Dữ liệu mới (chỉ chứa các trường cần cập nhật).
 * @returns {Promise<object>} Thông tin công ty sau khi cập nhật.
 */
const updateCompany = async (companyId, companyData) => {
    // Chỉ lấy các trường được phép cập nhật từ frontend
    const allowedFields = ['name', 'tagline', 'description', 'logoUrl', 'bannerUrl', 'website', 'companySize', 'country', 'mainLocation'];
    const fieldsToUpdate = {};
    let setClause = [];
    const request = (await poolPromise).request().input('companyId', sql.Int, companyId);

    for (const field of allowedFields) {
        if (companyData[field] !== undefined) { // Cho phép cập nhật thành null/rỗng
            const paramName = `param_${field}`;
             // Xác định kiểu dữ liệu SQL dựa trên tên trường (cần điều chỉnh nếu cần)
             let sqlType;
             if (['description'].includes(field)) {
                 sqlType = sql.NText;
             } else if (['logoUrl', 'bannerUrl'].includes(field)) {
                 sqlType = sql.NVarChar(sql.MAX);
             } else {
                 sqlType = sql.NVarChar; // Mặc định là NVarChar
             }

            fieldsToUpdate[field] = companyData[field];
            setClause.push(`${field} = @${paramName}`);
            request.input(paramName, sqlType, companyData[field]);
        }
    }

    // Đặc biệt xử lý 'name' vì nó ảnh hưởng đến 'slug' và là UNIQUE
    if (fieldsToUpdate.name) {
        const newSlug = createSlug(fieldsToUpdate.name);
         // Kiểm tra xem slug mới có bị trùng với công ty khác không
         const slugCheck = await (await poolPromise).request()
             .input('newSlug', sql.NVarChar, newSlug)
             .input('currentCompanyId', sql.Int, companyId)
             .query('SELECT 1 FROM Companies WHERE slug = @newSlug AND id != @currentCompanyId');
         if (slugCheck.recordset.length > 0) {
            throw new Error(`Tên công ty mới tạo ra slug '${newSlug}' đã tồn tại. Vui lòng chọn tên khác.`);
         }
        fieldsToUpdate.slug = newSlug;
        setClause.push('slug = @param_slug');
        request.input('param_slug', sql.NVarChar, newSlug);
    }


    if (setClause.length === 0) {
        throw new Error('Không có dữ liệu hợp lệ để cập nhật.');
    }

    setClause.push('updatedAt = GETUTCDATE()'); // Luôn cập nhật timestamp

    try {
        const query = `
            UPDATE Companies
            SET ${setClause.join(', ')}
            OUTPUT INSERTED.*
            WHERE id = @companyId;
        `;
        const result = await request.query(query);
        if (result.recordset.length === 0) {
            throw new Error('Không tìm thấy công ty để cập nhật.');
        }
        return result.recordset[0];
    } catch (error) {
        console.error(`Error in updateCompany for ID ${companyId}:`, error);
        // Ném lại lỗi để controller xử lý (bao gồm cả lỗi UNIQUE slug)
        throw error;
    }
};

module.exports = {
    findCompanyById,
    updateCompany,
    // (Có thể thêm createCompany, deleteCompany sau nếu cần)
};