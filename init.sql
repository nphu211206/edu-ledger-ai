-- Ra lệnh cho SSMS làm việc trên đúng CSDL của chúng ta
USE EduLedgerDB;
GO

-- Xóa các bảng theo đúng thứ tự phụ thuộc để không bị lỗi
DROP TABLE IF EXISTS JobSkills;
DROP TABLE IF EXISTS JobApplications; -- <-- BỔ SUNG BẢNG NÀY VÀO QUY TRÌNH XÓA
DROP TABLE IF EXISTS Jobs;
GO

-- TẠO LẠI BẢNG JOBS VỚI CẤU TRÚC CHUẨN
CREATE TABLE Jobs (
    id INT PRIMARY KEY IDENTITY(1,1),
    recruiterId INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NTEXT NOT NULL,
    location NVARCHAR(100),
    salary NVARCHAR(100),
    jobType NVARCHAR(50), 
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (recruiterId) REFERENCES Users(id) ON DELETE CASCADE
);
GO

-- TẠO LẠI BẢNG JOBSKILLS VỚI CẤU TRÚC CHUẨN
CREATE TABLE JobSkills (
    id INT PRIMARY KEY IDENTITY(1,1),
    jobId INT NOT NULL,
    skillId INT NOT NULL,
    requiredScore INT,
    FOREIGN KEY (jobId) REFERENCES Jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (skillId) REFERENCES Skills(id) ON DELETE CASCADE
);
GO

-- TẠO LUÔN BẢNG JOBAPPLICATIONS ĐỂ HOÀN THIỆN
CREATE TABLE JobApplications (
    id INT PRIMARY KEY IDENTITY(1,1),
    jobId INT NOT NULL,
    studentId INT NOT NULL,
    status NVARCHAR(50) DEFAULT 'Pending', -- Ví dụ: Pending, Reviewed, Rejected, Hired
    appliedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (jobId) REFERENCES Jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (studentId) REFERENCES Users(id) -- Không nên ON DELETE CASCADE ở đây
);
GO

PRINT '===> HOÀN HẢO! Cấu trúc bảng cho tính năng Việc làm đã được tạo thành công!';
-- Lấy ID của một nhà tuyển dụng đã có để làm tác giả cho các tin tuyển dụng
-- LƯU Ý: Hãy thay 'nphu211206@gmail.com' bằng email nhà tuyển dụng bạn đã đăng ký
DECLARE @RecruiterId INT;
SELECT @RecruiterId = id FROM Users WHERE email = 'nphu211206@gmail.com' AND role = 'recruiter';

-- Nếu tìm thấy nhà tuyển dụng, tiến hành thêm 3 tin tuyển dụng mẫu
IF @RecruiterId IS NOT NULL
BEGIN
    INSERT INTO Jobs (recruiterId, title, description, location, salary, jobType)
    VALUES
    (
        @RecruiterId,
        'Frontend Developer (ReactJS)',
        'Công ty Product ABC đang tìm kiếm 2 lập trình viên ReactJS tài năng để tham gia phát triển sản phẩm SaaS triệu người dùng. Yêu cầu kinh nghiệm 1-2 năm, thành thạo React Hooks, Redux, và Tailwind CSS.',
        'Hà Nội',
        '20-35 triệu',
        'Full-time'
    ),
    (
        @RecruiterId,
        'Backend Developer (Node.js, SQL)',
        'Tìm kiếm ứng viên Backend mạnh về Node.js và SQL Server để xây dựng hệ thống lõi cho nền tảng e-commerce. Có kinh nghiệm làm việc với Express.js là một lợi thế lớn.',
        'TP. Hồ Chí Minh',
        'Đến 40 triệu',
        'Full-time'
    ),
    (
        @RecruiterId,
        'Thực tập sinh DevOps',
        'Cơ hội thực tập DevOps dành cho sinh viên năm cuối. Được đào tạo về CI/CD, Docker, Kubernetes và các công cụ giám sát hệ thống. Hỗ trợ lương và có cơ hội trở thành nhân viên chính thức.',
        'Đà Nẵng',
        '5-8 triệu',
        'Internship'
    );

    PRINT '===> HOÀN HẢO! Đã thêm thành công 3 tin tuyển dụng mẫu vào CSDL.';
END
ELSE
BEGIN
    PRINT '===> LỖI: Không tìm thấy nhà tuyển dụng với email cung cấp. Vui lòng kiểm tra lại email trong script.';
END
GO
USE EduLedgerDB;
GO

-- ========= BẢNG KINH NGHIỆM LÀM VIỆC (WorkExperiences) =========
PRINT '===> Creating table: WorkExperiences';
CREATE TABLE WorkExperiences (
    id INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    title NVARCHAR(255) NOT NULL,          -- Chức danh (VD: Lập trình viên Frontend)
    company NVARCHAR(255) NOT NULL,        -- Tên công ty
    location NVARCHAR(255),                -- Địa điểm
    startDate DATE NOT NULL,               -- Ngày bắt đầu
    endDate DATE,                          -- Ngày kết thúc (NULL nếu đang làm)
    description NTEXT,                     -- Mô tả công việc, thành tựu
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 DEFAULT GETUTCDATE(),

    -- Khóa ngoại trỏ đến người dùng sở hữu kinh nghiệm này
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);
GO

-- ========= BẢNG HỌC VẤN (Education) =========
PRINT '===> Creating table: Education';
CREATE TABLE Education (
    id INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    school NVARCHAR(255) NOT NULL,         -- Tên trường
    degree NVARCHAR(255) NOT NULL,         -- Bằng cấp (VD: Cử nhân, Kỹ sư)
    fieldOfStudy NVARCHAR(255) NOT NULL,   -- Chuyên ngành (VD: Khoa học máy tính)
    startDate DATE NOT NULL,               -- Ngày bắt đầu
    endDate DATE,                          -- Ngày kết thúc (NULL nếu đang học)
    grade NVARCHAR(100),                   -- Điểm số / GPA
    description NTEXT,                     -- Mô tả thêm, các hoạt động, thành tích
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 DEFAULT GETUTCDATE(),

    -- Khóa ngoại trỏ đến người dùng sở hữu học vấn này
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);
GO

PRINT '===> HOÀN HẢO! Cấu trúc CSDL cho Hồ sơ Năng lực đã được mở rộng thành công.';
USE EduLedgerDB;
GO

-- ========= BƯỚC 1: TẠO BẢNG COMPANIES MỚI HOÀN HẢO =========
PRINT '===> Creating table: Companies';
CREATE TABLE Companies (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL UNIQUE,      -- Tên công ty
    slug NVARCHAR(255) NOT NULL UNIQUE,      -- Đường dẫn URL thân thiện (VD: fpt-software)
    logoUrl NVARCHAR(MAX),                   -- URL logo
    bannerUrl NVARCHAR(MAX),                 -- URL ảnh bìa
    tagline NVARCHAR(500),                   -- Slogan/Câu giới thiệu ngắn
    description NTEXT,                       -- Mô tả chi tiết về công ty
    website NVARCHAR(255),                   -- Website chính thức
    companySize NVARCHAR(100),               -- Quy mô (VD: 100-500 nhân viên)
    country NVARCHAR(100),                   -- Quốc gia
    mainLocation NVARCHAR(255),              -- Trụ sở chính
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- ========= BƯỚC 2: NÂNG CẤP BẢNG USERS ĐỂ LIÊN KẾT VỚI COMPANIES =========
PRINT '===> Altering table: Users';
-- Thêm cột companyId để biết nhà tuyển dụng thuộc công ty nào
ALTER TABLE Users
ADD companyId INT NULL;

-- Tạo khóa ngoại
ALTER TABLE Users
ADD CONSTRAINT FK_Users_Companies FOREIGN KEY (companyId) REFERENCES Companies(id);
GO

-- ========= BƯỚC 3: NÂNG CẤP BẢNG JOBS ĐỂ LIÊN KẾT VỚI COMPANIES =========
PRINT '===> Altering table: Jobs';
-- Thêm cột companyId để biết tin tuyển dụng thuộc công ty nào
ALTER TABLE Jobs
ADD companyId INT NULL; -- Tạm thời cho phép NULL để không lỗi dữ liệu cũ

-- Cập nhật dữ liệu cũ (ước tính): Gán companyId cho các job đã có dựa trên recruiterId
-- CHÚNG TA SẼ CẦN MỘT LOGIC PHỨC TẠP HƠN ĐỂ MIGRATE DỮ LIỆU THẬT SAU NÀY
PRINT '===> Migrating old data (placeholder)...';

-- Tạo khóa ngoại
ALTER TABLE Jobs
ADD CONSTRAINT FK_Jobs_Companies FOREIGN KEY (companyId) REFERENCES Companies(id);
GO

PRINT '===> HOÀN HẢO! CSDL đã sẵn sàng cho "Đế chế Doanh nghiệp".';
USE EduLedgerDB;
GO

PRINT '===> Checking and Upgrading table: Companies';

-- Thêm cột SLUG nếu chưa có. Đây là cột quan trọng nhất.
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'slug' AND Object_ID = Object_ID(N'Companies'))
BEGIN
    ALTER TABLE Companies ADD slug NVARCHAR(255);
    PRINT 'Added column: slug';
END
GO
-- Thêm ràng buộc UNIQUE cho slug để không bị trùng lặp
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE Name = 'UQ_Companies_Slug')
BEGIN
    -- Cập nhật giá trị tạm thời cho các dòng đã có để tránh lỗi UNIQUE
    UPDATE Companies SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL;
    ALTER TABLE Companies ALTER COLUMN slug NVARCHAR(255) NOT NULL;
    ALTER TABLE Companies ADD CONSTRAINT UQ_Companies_Slug UNIQUE(slug);
    PRINT 'Added UNIQUE constraint to slug';
END
GO

-- Thêm các cột còn thiếu
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'bannerUrl' AND Object_ID = Object_ID(N'Companies'))
BEGIN
    ALTER TABLE Companies ADD bannerUrl NVARCHAR(MAX);
    PRINT 'Added column: bannerUrl';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'country' AND Object_ID = Object_ID(N'Companies'))
BEGIN
    ALTER TABLE Companies ADD country NVARCHAR(100);
    PRINT 'Added column: country';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'updatedAt' AND Object_ID = Object_ID(N'Companies'))
BEGIN
    ALTER TABLE Companies ADD updatedAt DATETIME2 DEFAULT GETUTCDATE();
    PRINT 'Added column: updatedAt';
END
GO

-- Đổi tên cột 'location' thành 'mainLocation' cho nhất quán
IF EXISTS (SELECT * FROM sys.columns WHERE Name = N'location' AND Object_ID = Object_ID(N'Companies')) 
    AND NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'mainLocation' AND Object_ID = Object_ID(N'Companies'))
BEGIN
    EXEC sp_rename 'Companies.location', 'mainLocation', 'COLUMN';
    PRINT 'Renamed column: location to mainLocation';
END
GO


PRINT '===> Checking and Upgrading table: Users';
-- Nâng cấp bảng Users (chỉ thực hiện nếu chưa có)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'companyId' AND Object_ID = Object_ID(N'Users'))
BEGIN
    ALTER TABLE Users ADD companyId INT NULL;
    ALTER TABLE Users ADD CONSTRAINT FK_Users_Companies FOREIGN KEY (companyId) REFERENCES Companies(id);
    PRINT 'Upgraded table: Users with companyId';
END
GO

PRINT '===> Checking and Upgrading table: Jobs';
-- Nâng cấp bảng Jobs (chỉ thực hiện nếu chưa có)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'companyId' AND Object_ID = Object_ID(N'Jobs'))
BEGIN
    ALTER TABLE Jobs ADD companyId INT NULL;
    ALTER TABLE Jobs ADD CONSTRAINT FK_Jobs_Companies FOREIGN KEY (companyId) REFERENCES Companies(id);
    PRINT 'Upgraded table: Jobs with companyId';
END
GO

PRINT '===> HOÀN HẢO! CSDL đã ở trạng thái hoàn hảo và sẵn sàng cho bước tiếp theo.';