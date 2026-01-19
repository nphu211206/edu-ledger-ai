// File: server/services/auth.service.js

const { sql, poolPromise } = require('../config/db.js');
const bcrypt = require('bcryptjs');
/**
 * Tạo slug từ tên công ty (VD: FPT Software -> fpt-software)
 * @param {string} name Tên công ty
 * @returns {string} slug
 */
const createSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Xóa ký tự đặc biệt
        .replace(/[\s_-]+/g, '-') // Thay thế khoảng trắng và gạch dưới bằng gạch ngang
        .replace(/^-+|-+$/g, ''); // Xóa gạch ngang ở đầu và cuối
};

/**
 * Dịch vụ đăng ký toàn diện cho Nhà tuyển dụng
 * @param {object} data Dữ liệu từ controller: { fullName, email, password, companyName }
 * @returns {object} Thông tin user vừa tạo
 */
const registerRecruiterAndCompany = async ({ fullName, email, password, companyName }) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const checkRequest = new sql.Request(transaction);
        checkRequest.input('email', sql.NVarChar, email);
        checkRequest.input('companyName', sql.NVarChar, companyName);
        const existingUser = await checkRequest.query('SELECT 1 FROM Users WHERE email = @email');
        if (existingUser.recordset.length > 0) throw new Error('Email này đã được sử dụng.');
        const existingCompany = await checkRequest.query('SELECT 1 FROM Companies WHERE name = @companyName');
        if (existingCompany.recordset.length > 0) throw new Error('Tên công ty này đã tồn tại trong hệ thống.');

        const companySlug = createSlug(companyName);
        const companyRequest = new sql.Request(transaction);
        companyRequest.input('name', sql.NVarChar, companyName);
        companyRequest.input('slug', sql.NVarChar, companySlug);
        const newCompanyResult = await companyRequest.query(`INSERT INTO Companies (name, slug) OUTPUT INSERTED.id VALUES (@name, @slug);`);
        const newCompanyId = newCompanyResult.recordset[0].id;

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const userRequest = new sql.Request(transaction);
        userRequest.input('email', sql.NVarChar, email);
        userRequest.input('passwordHash', sql.NVarChar, passwordHash);
        userRequest.input('name', sql.NVarChar, fullName);
        userRequest.input('companyId', sql.Int, newCompanyId);

        const newUserResult = await userRequest.query(
            `INSERT INTO Users (email, passwordHash, name, role, companyId)
             OUTPUT INSERTED.id, INSERTED.name, INSERTED.email
             VALUES (@email, @passwordHash, @name, 'recruiter', @companyId);`
        );
        
        await transaction.commit();
        return newUserResult.recordset[0];
    } catch (error) {
        await transaction.rollback();
        console.error('SQL Transaction Error in registerRecruiter:', error);
        throw error;
    }
};

module.exports = {
    registerRecruiterAndCompany,
};