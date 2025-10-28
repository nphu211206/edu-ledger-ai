/*************************************************************************************************
*
* EduLedger AI - Database Initialization Script (Phiên bản Tối Thượng - "Bất Tử" v2.4.1)
*
* MỤC ĐÍCH:
* Script này thiết lập TOÀN BỘ cấu trúc CSDL EduLedger AI, bao gồm:
* 1. Tự động tìm và xóa tất cả Foreign Key Constraints liên quan MỘT CÁCH AN TOÀN.
* 2. Xóa các bảng cũ an toàn.
* 3. Tạo lại các bảng với cấu trúc chi tiết, tối ưu, constraints chuẩn (sửa lỗi Unique Null).
* 4. Tạo Indexes để tăng hiệu năng.
* 5. Chèn dữ liệu mẫu phong phú (idempotent - an toàn khi chạy lại).
*
* CẢNH BÁO QUAN TRỌNG:
* SCRIPT NÀY SẼ XÓA SẠCH DỮ LIỆU CŨ. LUÔN BACKUP TRƯỚỚC KHI CHẠY.
*
* HƯỚNG DẪN:
* 1. Kết nối CSDL 'EduLedgerDB'.
* 2. Thực thi (Execute) TOÀN BỘ script này.
* 3. Kiểm tra messages output (KHÔNG NÊN CÒN LỖI ĐỎ).
*
* PHIÊN BẢN: 2.4.1 ("Bất Tử" - Fix NTEXT)
* NGÀY CẬP NHẬT: 2025-10-28
* TÁC GIẢ: Gemini AI & Đối tác lập trình
*
*************************************************************************************************/

-- Bước 0: Chọn CSDL
USE EduLedgerDB;
GO

PRINT '*** BẮT ĐẦU QUÁ TRÌNH KHỞI TẠO CSDL EDULEDGER AI (TỐI THƯỢNG - "Bất Tử" v2.4.1) ***';
PRINT 'CẢNH BÁO: Dữ liệu cũ trong các bảng liên quan sẽ bị xóa!';
GO

-- Bước 1: Tự động tìm và xóa các Foreign Key Constraints cũ (Phương pháp Dynamic SQL cải tiến)
PRINT '--- Bước 1: Tự động tìm và xóa Foreign Key Constraints cũ... ---';
DECLARE @SqlDropFK NVARCHAR(MAX) = N'';

-- Tạo câu lệnh DROP cho TẤT CẢ các FK trong các bảng sẽ bị xóa HOẶC tham chiếu đến các bảng sẽ bị xóa
SELECT @SqlDropFK += 'IF OBJECT_ID(''' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + QUOTENAME(name) + ''', ''F'') IS NOT NULL ALTER TABLE ' +
                    QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) +
                    ' DROP CONSTRAINT ' + QUOTENAME(name) + ';' + CHAR(13) + CHAR(10)
FROM sys.foreign_keys
WHERE OBJECT_NAME(referenced_object_id) IN ('Users', 'Companies', 'Skills', 'Jobs') -- Bảng được tham chiếu
   OR OBJECT_NAME(parent_object_id) IN ('JobApplications', 'JobSkills', 'UserSkills', 'WorkExperiences', 'Education', 'Jobs', 'Users',
                                        -- Thêm các bảng khác có FK cần xóa ở đây nếu có
                                        'Credentials_Blockchain', 'ProjectSkills', 'Projects', 'CompanyRecruiters'); -- Bảng tham chiếu

-- Thực thi lệnh DROP constraints nếu có
IF LEN(@SqlDropFK) > 0
BEGIN
    PRINT 'Executing DROP CONSTRAINT statements:';
    PRINT @SqlDropFK; -- In ra để debug nếu cần
    EXEC sp_executesql @SqlDropFK;
    PRINT 'Đã xóa các Foreign Key Constraints liên quan.';
END
ELSE
BEGIN
    PRINT 'Không tìm thấy Foreign Key Constraints liên quan để xóa.';
END
GO

-- Bước 2: Xóa các Bảng cũ (nếu có) - Đã an toàn hơn nhiều
PRINT '--- Bước 2: Xóa các Bảng cũ (nếu có)... ---';
-- Xóa theo thứ tự ngược lại của sự phụ thuộc
IF OBJECT_ID('dbo.Credentials_Blockchain', 'U') IS NOT NULL DROP TABLE dbo.Credentials_Blockchain;
IF OBJECT_ID('dbo.ProjectSkills', 'U') IS NOT NULL DROP TABLE dbo.ProjectSkills;
IF OBJECT_ID('dbo.Projects', 'U') IS NOT NULL DROP TABLE dbo.Projects;
IF OBJECT_ID('dbo.CompanyRecruiters', 'U') IS NOT NULL DROP TABLE dbo.CompanyRecruiters;
IF OBJECT_ID('dbo.JobApplications', 'U') IS NOT NULL BEGIN PRINT 'Dropping table: JobApplications...'; DROP TABLE dbo.JobApplications; END
IF OBJECT_ID('dbo.JobSkills', 'U') IS NOT NULL BEGIN PRINT 'Dropping table: JobSkills...'; DROP TABLE dbo.JobSkills; END
IF OBJECT_ID('dbo.UserSkills', 'U') IS NOT NULL BEGIN PRINT 'Dropping table: UserSkills...'; DROP TABLE dbo.UserSkills; END
IF OBJECT_ID('dbo.WorkExperiences', 'U') IS NOT NULL BEGIN PRINT 'Dropping table: WorkExperiences...'; DROP TABLE dbo.WorkExperiences; END
IF OBJECT_ID('dbo.Education', 'U') IS NOT NULL BEGIN PRINT 'Dropping table: Education...'; DROP TABLE dbo.Education; END
IF OBJECT_ID('dbo.Jobs', 'U') IS NOT NULL BEGIN PRINT 'Dropping table: Jobs...'; DROP TABLE dbo.Jobs; END
IF OBJECT_ID('dbo.Skills', 'U') IS NOT NULL BEGIN PRINT 'Dropping table: Skills...'; DROP TABLE dbo.Skills; END
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL BEGIN PRINT 'Dropping table: Users...'; DROP TABLE dbo.Users; END
IF OBJECT_ID('dbo.Companies', 'U') IS NOT NULL BEGIN PRINT 'Dropping table: Companies...'; DROP TABLE dbo.Companies; END
PRINT 'Hoàn tất xóa các bảng cũ.';
GO

-- Bước 3: Tạo lại các Bảng với cấu trúc "Tối Thượng"
PRINT '--- Bước 3: Tạo lại các Bảng với cấu trúc "Tối Thượng"... ---';

-- Bảng Companies
PRINT 'Creating table: Companies...';
CREATE TABLE Companies (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    slug NVARCHAR(255) NOT NULL,
    logoUrl NVARCHAR(MAX) NULL,
    bannerUrl NVARCHAR(MAX) NULL,
    tagline NVARCHAR(500) NULL,
    description NVARCHAR(MAX) NULL, -- SỬA: NTEXT -> NVARCHAR(MAX)
    website NVARCHAR(255) NULL,
    industry NVARCHAR(150) NULL,
    companySize NVARCHAR(100) NULL,
    foundedYear INT NULL,
    country NVARCHAR(100) NULL DEFAULT N'Việt Nam',
    mainLocation NVARCHAR(255) NULL,
    socialLinks NVARCHAR(MAX) NULL,
    benefits NVARCHAR(MAX) NULL, -- SỬA: NTEXT -> NVARCHAR(MAX) (Giả định, nếu benefits là NTEXT)
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Companies_Name UNIQUE(name),
    CONSTRAINT UQ_Companies_Slug UNIQUE(slug),
    CONSTRAINT CK_Companies_FoundedYear CHECK (foundedYear IS NULL OR (foundedYear > 1800 AND foundedYear <= YEAR(GETDATE()))),
    CONSTRAINT CK_Companies_Website CHECK (website IS NULL OR website = '' OR website LIKE 'http%://%' OR website LIKE 'https%://%') -- Cho phép rỗng
);
CREATE UNIQUE INDEX IX_Companies_Slug ON Companies(slug);
CREATE INDEX IX_Companies_Name ON Companies(name);
GO

-- Bảng Users (Sửa lỗi UNIQUE NULL)
PRINT 'Creating table: Users...';
CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100) NULL,
    email NVARCHAR(255) NULL,
    passwordHash NVARCHAR(255) NULL,
    role NVARCHAR(20) NOT NULL,
    avatarUrl NVARCHAR(MAX) NULL,
    bio NVARCHAR(MAX) NULL, -- SỬA: NTEXT -> NVARCHAR(MAX)
    isActive BIT NOT NULL DEFAULT 1,
    lastLoginAt DATETIME2 NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    githubId BIGINT NULL,
    githubUsername NVARCHAR(100) NULL,
    githubAccessToken NVARCHAR(255) NULL,
    companyId INT NULL,
    CONSTRAINT CK_Users_Role CHECK (role IN ('student', 'recruiter', 'admin')),
    CONSTRAINT CK_Users_RecruiterHasEmail CHECK (role != 'recruiter' OR email IS NOT NULL),
    CONSTRAINT CK_Users_StudentHasGithub CHECK (role != 'student' OR githubId IS NOT NULL OR githubUsername IS NOT NULL),
    CONSTRAINT FK_Users_Companies FOREIGN KEY (companyId) REFERENCES Companies(id) ON DELETE SET NULL
);
PRINT 'Creating Filtered Unique Indexes for Users...';
CREATE UNIQUE INDEX UQ_Users_Email_NotNull ON Users(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX UQ_Users_GithubId_NotNull ON Users(githubId) WHERE githubId IS NOT NULL;
CREATE UNIQUE INDEX UQ_Users_GithubUsername_NotNull ON Users(githubUsername) WHERE githubUsername IS NOT NULL;
CREATE INDEX IX_Users_Role ON Users(role);
CREATE INDEX IX_Users_CompanyId ON Users(companyId) WHERE companyId IS NOT NULL;
GO

-- Bảng Skills
PRINT 'Creating table: Skills...';
CREATE TABLE Skills (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100) NOT NULL,
    category NVARCHAR(100) NULL,
    description NVARCHAR(MAX) NULL, -- SỬA: NTEXT -> NVARCHAR(MAX)
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Skills_Name UNIQUE(name)
);
CREATE INDEX IX_Skills_Name ON Skills(name);
CREATE INDEX IX_Skills_Category ON Skills(category) WHERE category IS NOT NULL;
GO

-- Bảng Jobs
PRINT 'Creating table: Jobs...';
CREATE TABLE Jobs (
    id INT PRIMARY KEY IDENTITY(1,1),
    recruiterId INT NOT NULL,
    companyId INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NOT NULL, -- SỬA: NTEXT -> NVARCHAR(MAX)
    location NVARCHAR(255) NULL,
    minSalary DECIMAL(18, 2) NULL,
    maxSalary DECIMAL(18, 2) NULL,
    salaryCurrency NVARCHAR(10) NULL DEFAULT 'VND',
    salary NVARCHAR(100) NULL,
    isSalaryNegotiable BIT NOT NULL DEFAULT 0,
    jobType NVARCHAR(50) NULL,
    experienceLevel NVARCHAR(50) NULL,
    remotePolicy NVARCHAR(50) NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'Active', -- CỘT QUAN TRỌNG ĐÃ THÊM
    expiresAt DATETIME2 NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT CK_Jobs_Status CHECK (status IN ('Active', 'Inactive', 'Draft', 'Expired')),
    CONSTRAINT CK_Jobs_SalaryRange CHECK (minSalary IS NULL OR maxSalary IS NULL OR minSalary <= maxSalary),
    CONSTRAINT FK_Jobs_Users_Recruiter FOREIGN KEY (recruiterId) REFERENCES Users(id) ON DELETE NO ACTION,
    CONSTRAINT FK_Jobs_Companies FOREIGN KEY (companyId) REFERENCES Companies(id) ON DELETE CASCADE
);
CREATE INDEX IX_Jobs_CompanyId ON Jobs(companyId);
CREATE INDEX IX_Jobs_Status_CreatedAt ON Jobs(status, createdAt DESC);
CREATE INDEX IX_Jobs_ExperienceLevel ON Jobs(experienceLevel) WHERE experienceLevel IS NOT NULL;
CREATE INDEX IX_Jobs_RemotePolicy ON Jobs(remotePolicy) WHERE remotePolicy IS NOT NULL;
GO

-- Bảng WorkExperiences
PRINT 'Creating table: WorkExperiences...';
CREATE TABLE WorkExperiences (
    id INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    company NVARCHAR(255) NOT NULL,
    location NVARCHAR(255) NULL,
    startDate DATE NOT NULL,
    endDate DATE NULL,
    description NVARCHAR(MAX) NULL, -- SỬA: NTEXT -> NVARCHAR(MAX)
    isCurrent AS (CONVERT(BIT, CASE WHEN endDate IS NULL THEN 1 ELSE 0 END)) PERSISTED,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT CK_WorkExperiences_Dates CHECK (endDate IS NULL OR startDate <= endDate),
    CONSTRAINT FK_WorkExperiences_Users FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);
CREATE INDEX IX_WorkExperiences_UserId_StartDate ON WorkExperiences(userId, startDate DESC);
GO

-- Bảng Education
PRINT 'Creating table: Education...';
CREATE TABLE Education (
    id INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    school NVARCHAR(255) NOT NULL,
    degree NVARCHAR(255) NOT NULL,
    fieldOfStudy NVARCHAR(255) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NULL,
    grade NVARCHAR(100) NULL,
    description NVARCHAR(MAX) NULL, -- SỬA: NTEXT -> NVARCHAR(MAX)
    isCurrent AS (CONVERT(BIT, CASE WHEN endDate IS NULL THEN 1 ELSE 0 END)) PERSISTED,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT CK_Education_Dates CHECK (endDate IS NULL OR startDate <= endDate),
    CONSTRAINT FK_Education_Users FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);
CREATE INDEX IX_Education_UserId_StartDate ON Education(userId, startDate DESC);
GO

-- Bảng UserSkills
PRINT 'Creating table: UserSkills...';
CREATE TABLE UserSkills (
    id INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    skillId INT NOT NULL,
    score INT NOT NULL,
    verifiedBy NVARCHAR(50) NULL DEFAULT 'AI',
    lastVerifiedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_UserSkills UNIQUE (userId, skillId),
    CONSTRAINT CK_UserSkills_Score CHECK (score >= 0 AND score <= 100),
    CONSTRAINT FK_UserSkills_Users FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE NO ACTION,
    CONSTRAINT FK_UserSkills_Skills FOREIGN KEY (skillId) REFERENCES Skills(id) ON DELETE CASCADE
);
CREATE INDEX IX_UserSkills_UserId_Score ON UserSkills(userId, score DESC);
CREATE INDEX IX_UserSkills_SkillId_Score ON UserSkills(skillId, score DESC);
GO

-- Bảng JobSkills
PRINT 'Creating table: JobSkills...';
CREATE TABLE JobSkills (
    id INT PRIMARY KEY IDENTITY(1,1),
    jobId INT NOT NULL,
    skillId INT NOT NULL,
    requiredScore INT NULL,
    importanceLevel INT NULL DEFAULT 3,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_JobSkills UNIQUE (jobId, skillId),
    CONSTRAINT CK_JobSkills_Score CHECK (requiredScore IS NULL OR (requiredScore >= 0 AND requiredScore <= 100)),
    CONSTRAINT CK_JobSkills_Importance CHECK (importanceLevel IS NULL OR (importanceLevel >= 1 AND importanceLevel <= 5)),
    CONSTRAINT FK_JobSkills_Jobs FOREIGN KEY (jobId) REFERENCES Jobs(id) ON DELETE CASCADE,
    CONSTRAINT FK_JobSkills_Skills FOREIGN KEY (skillId) REFERENCES Skills(id) ON DELETE CASCADE
);
CREATE INDEX IX_JobSkills_JobId ON JobSkills(jobId);
CREATE INDEX IX_JobSkills_SkillId ON JobSkills(skillId);
GO

-- Bảng JobApplications
PRINT 'Creating table: JobApplications...';
CREATE TABLE JobApplications (
    id INT PRIMARY KEY IDENTITY(1,1),
    jobId INT NOT NULL,
    studentId INT NOT NULL,
    coverLetter NVARCHAR(MAX) NULL, -- SỬA: NTEXT -> NVARCHAR(MAX)
    status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    appliedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    recruiterNotes NVARCHAR(MAX) NULL, -- SỬA: NTEXT -> NVARCHAR(MAX)
    statusChangedAt DATETIME2 NULL,
    changedByUserId INT NULL,
    CONSTRAINT UQ_JobApplications UNIQUE (jobId, studentId),
    CONSTRAINT CK_JobApplications_Status CHECK (status IN ('Pending', 'Reviewed', 'Interviewing', 'Offered', 'Rejected', 'Hired', 'Withdrawn')),
    CONSTRAINT FK_JobApplications_Jobs FOREIGN KEY (jobId) REFERENCES Jobs(id) ON DELETE CASCADE,
    CONSTRAINT FK_JobApplications_Users_Student FOREIGN KEY (studentId) REFERENCES Users(id) ON DELETE NO ACTION,
    CONSTRAINT FK_JobApplications_Users_ChangedBy FOREIGN KEY (changedByUserId) REFERENCES Users(id) ON DELETE NO ACTION
);
CREATE INDEX IX_JobApplications_JobId_Status ON JobApplications(jobId, status);
CREATE INDEX IX_JobApplications_StudentId_AppliedAt ON JobApplications(studentId, appliedAt DESC);
GO

PRINT '--- Bước 4: Chèn Dữ liệu Mẫu (Seed Data) phong phú (Idempotent)... ---';

-- Seeding Companies
PRINT 'Seeding Companies...';
MERGE Companies AS target
USING (VALUES
    (N'FPT Software', 'fpt-software', N'Global IT Services & Solutions Provider', N'FPT Software là công ty công nghệ...', 'https://fptsoftware.com', 'IT Services', '10000+', 1999, N'Hà Nội', 'https://inkythuatso.com/uploads/images/2021/11/fpt-logo-inkythuatso-1-14-10-18-09.jpg'),
    (N'Viettel Group', 'viettel-group', N'Tập đoàn Công nghiệp - Viễn thông Quân đội', N'Viettel là tập đoàn...', 'https://viettel.com.vn', 'Telecommunications', '10000+', 1989, N'Hà Nội', 'https://cdn.haitrieu.com/wp-content/uploads/2021/10/Logo-Viettel-Telecom.png'),
    (N'VNG Corporation', 'vng-corporation', N'Build Technologies and Grow People...', N'VNG là kỳ lân công nghệ...', 'https://vng.com.vn', 'Technology', '1000-5000', 2004, N'TP. Hồ Chí Minh', 'https://vcdn-sohoa.vnecdn.net/2019/08/21/VNG-logo-8588-1566378453.png'),
    (N'Momo (M_Service)', 'momo-mservice', N'Siêu ứng dụng Ví điện tử số 1 Việt Nam', N'Momo cung cấp nền tảng...', 'https://momo.vn', 'Fintech', '1000-5000', 2007, N'TP. Hồ Chí Minh', 'https://static.mservice.io/img/logo-momo.png'),
    (N'NashTech Vietnam', 'nashtech-vietnam', N'Technology solutions & Business process outsourcing', N'NashTech, a Harvey Nash...', 'https://nashtechglobal.com/vn/', 'IT Outsourcing', '1000-5000', 2000, N'TP. Hồ Chí Minh & Hà Nội', NULL)
) AS source (name, slug, tagline, description, website, industry, companySize, foundedYear, mainLocation, logoUrl)
ON target.slug = source.slug
WHEN NOT MATCHED THEN
    INSERT (name, slug, tagline, description, website, industry, companySize, foundedYear, mainLocation, logoUrl)
    VALUES (source.name, source.slug, source.tagline, source.description, source.website, source.industry, source.companySize, source.foundedYear, source.mainLocation, source.logoUrl)
WHEN MATCHED THEN
    UPDATE SET target.name = source.name, target.tagline = source.tagline, target.logoUrl = ISNULL(source.logoUrl, target.logoUrl), target.website=source.website, target.foundedYear=source.foundedYear;
GO

-- Seeding Skills
PRINT 'Seeding Skills...';
MERGE Skills AS target
USING (VALUES
    ('JavaScript', 'Programming Language'), ('React', 'Frontend Framework'), ('Node.js', 'Backend Runtime'),
    ('HTML', 'Web Markup'), ('CSS', 'Web Styling'), ('Tailwind CSS', 'CSS Framework'),
    ('SQL Server', 'Database'), ('PostgreSQL', 'Database'), ('MongoDB', 'Database'),
    ('Python', 'Programming Language'), ('Django', 'Backend Framework'), ('Flask', 'Backend Framework'),
    ('Java', 'Programming Language'), ('Spring Boot', 'Backend Framework'),
    ('Docker', 'DevOps'), ('Kubernetes', 'DevOps'), ('AWS', 'Cloud Platform'), ('Azure', 'Cloud Platform'),
    ('Git', 'Version Control'), ('Problem Solving', 'Soft Skill'), ('Teamwork', 'Soft Skill'), ('English', 'Language')
) AS source (name, category)
ON target.name = source.name
WHEN NOT MATCHED THEN
    INSERT (name, category) VALUES (source.name, source.category);
GO

-- Seeding Users (Filtered Index đã sửa lỗi UNIQUE NULL)
PRINT 'Seeding Users...';
DECLARE @FptCompanyId_Seed_U INT, @VngCompanyId_Seed_U INT, @MomoCompanyId_Seed_U INT;
SELECT @FptCompanyId_Seed_U = id FROM Companies WHERE slug = 'fpt-software';
SELECT @VngCompanyId_Seed_U = id FROM Companies WHERE slug = 'vng-corporation';
SELECT @MomoCompanyId_Seed_U = id FROM Companies WHERE slug = 'momo-mservice';
DECLARE @PasswordHash_Seed_U NVARCHAR(255) = '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ012345' + CAST(NEWID() AS NVARCHAR(36)); -- Mật khẩu giả hash

MERGE Users AS target
USING (VALUES
    (N'Nguyễn Phúc Hưng (FPT Recruiter)', 'nphu211206@gmail.com', @PasswordHash_Seed_U, 'recruiter', @FptCompanyId_Seed_U, NULL, NULL, NULL, NULL),
    (N'Trần Thị B (VNG HR)', 'hr.vng@example.com', @PasswordHash_Seed_U, 'recruiter', @VngCompanyId_Seed_U, NULL, NULL, NULL, NULL),
    (N'Lê Văn C (Momo Talent)', 'talent.momo@example.com', @PasswordHash_Seed_U, 'recruiter', @MomoCompanyId_Seed_U, NULL, NULL, NULL, NULL),
    (N'Alice Wonderland', NULL, NULL, 'student', NULL, 'https://avatars.githubusercontent.com/u/123456?v=4', 123456, 'alice-dev', N'Passionate frontend dev...'),
    (N'Bob The Builder', NULL, NULL, 'student', NULL, 'https://avatars.githubusercontent.com/u/789012?v=4', 789012, 'bob-codes', N'Backend enthusiast...'),
    (N'Charlie Chaplin', NULL, NULL, 'student', NULL, 'https://avatars.githubusercontent.com/u/345678?v=4', 345678, 'charlie-py', N'Data science student...')
) AS source (name, email, passwordHash, role, companyId, avatarUrl, githubId, githubUsername, bio)
ON (target.email = source.email AND source.email IS NOT NULL) OR (target.githubId = source.githubId AND source.githubId IS NOT NULL)
WHEN NOT MATCHED THEN
    INSERT (name, email, passwordHash, role, companyId, avatarUrl, githubId, githubUsername, bio)
    VALUES (source.name, source.email, source.passwordHash, source.role, source.companyId, source.avatarUrl, source.githubId, source.githubUsername, source.bio)
WHEN MATCHED THEN
    UPDATE SET target.name = ISNULL(source.name, target.name), target.avatarUrl = ISNULL(source.avatarUrl, target.avatarUrl), target.bio = ISNULL(source.bio, target.bio), target.companyId = ISNULL(source.companyId, target.companyId), target.updatedAt = GETUTCDATE();
GO

-- Seeding Jobs (Đầy đủ, Xóa cũ trước)
PRINT 'Seeding Jobs...';
DECLARE @FptRecruiterId_Seed_J INT, @VngRecruiterId_Seed_J INT, @MomoRecruiterId_Seed_J INT;
DECLARE @ReactSkillId_Seed_J INT, @NodeSkillId_Seed_J INT, @SqlSkillId_Seed_J INT, @PythonSkillId_Seed_J INT, @DockerSkillId_Seed_J INT, @JsSkillId_Seed_J INT, @HtmlSkillId_Seed_J INT, @CssSkillId_Seed_J INT, @MongoSkillId_Seed_J INT, @KubeSkillId_Seed_J INT, @AwsSkillId_Seed_J INT;

SELECT @FptRecruiterId_Seed_J = id FROM Users WHERE email = 'nphu211206@gmail.com'; SELECT @VngRecruiterId_Seed_J = id FROM Users WHERE email = 'hr.vng@example.com'; SELECT @MomoRecruiterId_Seed_J = id FROM Users WHERE email = 'talent.momo@example.com';
DECLARE @FptCompanyId_Seed_J INT = (SELECT id FROM Companies WHERE slug = 'fpt-software'); DECLARE @VngCompanyId_Seed_J INT = (SELECT id FROM Companies WHERE slug = 'vng-corporation'); DECLARE @MomoCompanyId_Seed_J INT = (SELECT id FROM Companies WHERE slug = 'momo-mservice');
SELECT @ReactSkillId_Seed_J = id FROM Skills WHERE name = 'React'; SELECT @NodeSkillId_Seed_J = id FROM Skills WHERE name = 'Node.js'; SELECT @SqlSkillId_Seed_J = id FROM Skills WHERE name = 'SQL Server'; SELECT @PythonSkillId_Seed_J = id FROM Skills WHERE name = 'Python'; SELECT @DockerSkillId_Seed_J = id FROM Skills WHERE name = 'Docker'; SELECT @JsSkillId_Seed_J = id FROM Skills WHERE name = 'JavaScript'; SELECT @HtmlSkillId_Seed_J = id FROM Skills WHERE name = 'HTML'; SELECT @CssSkillId_Seed_J = id FROM Skills WHERE name = 'CSS'; SELECT @MongoSkillId_Seed_J = id FROM Skills WHERE name = 'MongoDB'; SELECT @KubeSkillId_Seed_J = id FROM Skills WHERE name = 'Kubernetes'; SELECT @AwsSkillId_Seed_J = id FROM Skills WHERE name = 'AWS';

PRINT 'Deleting old sample jobs (if any)...';
DELETE FROM JobSkills WHERE jobId IN (SELECT id FROM Jobs WHERE recruiterId IN (@FptRecruiterId_Seed_J, @VngRecruiterId_Seed_J, @MomoRecruiterId_Seed_J) AND companyId IN (@FptCompanyId_Seed_J, @VngCompanyId_Seed_J, @MomoCompanyId_Seed_J));
DELETE FROM Jobs WHERE recruiterId IN (@FptRecruiterId_Seed_J, @VngRecruiterId_Seed_J, @MomoRecruiterId_Seed_J) AND companyId IN (@FptCompanyId_Seed_J, @VngCompanyId_Seed_J, @MomoCompanyId_Seed_J);

-- Job 1: FPT React Dev
IF @FptRecruiterId_Seed_J IS NOT NULL AND @FptCompanyId_Seed_J IS NOT NULL AND @ReactSkillId_Seed_J IS NOT NULL AND @JsSkillId_Seed_J IS NOT NULL AND @HtmlSkillId_Seed_J IS NOT NULL AND @CssSkillId_Seed_J IS NOT NULL
BEGIN
    PRINT 'Inserting Job 1 (FPT React)...';
    INSERT INTO Jobs (recruiterId, companyId, title, description, location, minSalary, maxSalary, salary, isSalaryNegotiable, jobType, experienceLevel, remotePolicy, status) VALUES (@FptRecruiterId_Seed_J, @FptCompanyId_Seed_J, N'Frontend Developer (ReactJS)', N'Tham gia dự án phát triển sản phẩm SaaS cho thị trường quốc tế. Yêu cầu thành thạo React, Redux/Context, TypeScript. Có kinh nghiệm với Unit Test là lợi thế.', N'Hà Nội, Đà Nẵng', 15000000, 30000000, N'15-30 triệu', 0, 'Full-time', 'Junior', 'Hybrid', 'Active');
    DECLARE @Job1Id_Seed_J INT = SCOPE_IDENTITY();
    INSERT INTO JobSkills (jobId, skillId) VALUES (@Job1Id_Seed_J, @ReactSkillId_Seed_J), (@Job1Id_Seed_J, @JsSkillId_Seed_J), (@Job1Id_Seed_J, @HtmlSkillId_Seed_J), (@Job1Id_Seed_J, @CssSkillId_Seed_J);
END ELSE PRINT 'WARNING: Could not insert Job 1 due to missing Recruiter/Company/Skill IDs.';

-- Job 2: VNG Node.js Dev
IF @VngRecruiterId_Seed_J IS NOT NULL AND @VngCompanyId_Seed_J IS NOT NULL AND @NodeSkillId_Seed_J IS NOT NULL AND @MongoSkillId_Seed_J IS NOT NULL AND @DockerSkillId_Seed_J IS NOT NULL
BEGIN
    PRINT 'Inserting Job 2 (VNG Node.js)...';
    INSERT INTO Jobs (recruiterId, companyId, title, description, location, minSalary, maxSalary, salary, isSalaryNegotiable, jobType, experienceLevel, remotePolicy, status) VALUES (@VngRecruiterId_Seed_J, @VngCompanyId_Seed_J, N'Backend Developer (Node.js, Microservices)', N'Xây dựng và tối ưu hệ thống backend cho ZaloPay. Yêu cầu kinh nghiệm làm việc với Node.js, Express/NestJS, MongoDB, Kafka/RabbitMQ.', N'TP. Hồ Chí Minh', 30000000, 50000000, N'30-50 triệu', 0, 'Full-time', 'Mid', 'Onsite', 'Active');
    DECLARE @Job2Id_Seed_J INT = SCOPE_IDENTITY();
    INSERT INTO JobSkills (jobId, skillId) VALUES (@Job2Id_Seed_J, @NodeSkillId_Seed_J), (@Job2Id_Seed_J, @MongoSkillId_Seed_J), (@Job2Id_Seed_J, @DockerSkillId_Seed_J);
END ELSE PRINT 'WARNING: Could not insert Job 2 due to missing Recruiter/Company/Skill IDs.';

-- Job 3: Momo Python Intern
IF @MomoRecruiterId_Seed_J IS NOT NULL AND @MomoCompanyId_Seed_J IS NOT NULL AND @PythonSkillId_Seed_J IS NOT NULL AND @SqlSkillId_Seed_J IS NOT NULL
BEGIN
    PRINT 'Inserting Job 3 (Momo Python Intern)...';
    INSERT INTO Jobs (recruiterId, companyId, title, description, location, minSalary, maxSalary, salary, isSalaryNegotiable, jobType, experienceLevel, remotePolicy, status) VALUES (@MomoRecruiterId_Seed_J, @MomoCompanyId_Seed_J, N'Data Analyst Intern (Python)', N'Cơ hội thực tập cho sinh viên năm 3-4 yêu thích dữ liệu. Tham gia thu thập, xử lý, phân tích dữ liệu người dùng. Yêu cầu kiến thức cơ bản về Python, SQL. Biết Pandas, NumPy là lợi thế.', N'TP. Hồ Chí Minh', 5000000, 8000000, N'5-8 triệu (Hỗ trợ)', 0, 'Internship', 'Intern', 'Onsite', 'Active');
    DECLARE @Job3Id_Seed_J INT = SCOPE_IDENTITY();
    INSERT INTO JobSkills (jobId, skillId) VALUES (@Job3Id_Seed_J, @PythonSkillId_Seed_J), (@Job3Id_Seed_J, @SqlSkillId_Seed_J);
END ELSE PRINT 'WARNING: Could not insert Job 3 due to missing Recruiter/Company/Skill IDs.';

-- Job 4: FPT DevOps Engineer (Draft)
IF @FptRecruiterId_Seed_J IS NOT NULL AND @FptCompanyId_Seed_J IS NOT NULL AND @DockerSkillId_Seed_J IS NOT NULL AND @KubeSkillId_Seed_J IS NOT NULL AND @AwsSkillId_Seed_J IS NOT NULL
BEGIN
    PRINT 'Inserting Job 4 (FPT DevOps - Draft)...';
    INSERT INTO Jobs (recruiterId, companyId, title, description, location, salary, isSalaryNegotiable, jobType, experienceLevel, remotePolicy, status) VALUES (@FptRecruiterId_Seed_J, @FptCompanyId_Seed_J, N'DevOps Engineer (CI/CD, Cloud)', N'Thiết lập và quản lý hạ tầng CI/CD, monitoring cho các dự án lớn. Yêu cầu kinh nghiệm với Jenkins/GitLab CI, Docker, K8s, AWS/Azure.', N'Hà Nội', N'Thỏa thuận', 1, 'Full-time', 'Mid', 'Hybrid', 'Draft');
    DECLARE @Job4Id_Seed_J INT = SCOPE_IDENTITY();
    INSERT INTO JobSkills (jobId, skillId) VALUES (@Job4Id_Seed_J, @DockerSkillId_Seed_J), (@Job4Id_Seed_J, @KubeSkillId_Seed_J), (@Job4Id_Seed_J, @AwsSkillId_Seed_J);
END ELSE PRINT 'WARNING: Could not insert Job 4 due to missing Recruiter/Company/Skill IDs.';
GO

PRINT '--- Bước 5: Thêm dữ liệu mẫu khác (Tùy chọn)... ---';
PRINT '*** HOÀN TẤT QUÁ TRÌNH KHỞI TẠO CSDL EDULEDGER AI (TỐI THƯỢNG - "Bất Tử" v2.4.1) ***';
GO