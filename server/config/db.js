// /server/config/db.js
// PHIÊN BẢN SỬA LỖI - Tương thích 100% với SQL_CONN_STRING

const sql = require('mssql');

// Lấy chuỗi kết nối trực tiếp từ file .env của bạn
const connectionString = process.env.SQL_CONN_STRING;

if (!connectionString) {
    console.error('LỖI NGHIÊM TRỌNG: Biến môi trường SQL_CONN_STRING chưa được thiết lập trong file .env!');
    process.exit(1); // Dừng ứng dụng ngay lập tức nếu không có chuỗi kết nối
}

// Tạo pool kết nối bằng cách truyền thẳng chuỗi kết nối vào
const poolPromise = new sql.ConnectionPool(connectionString)
    .connect()
    .then(pool => {
        console.log('✅ Kết nối thành công tới CSDL EduLedgerDB');
        return pool;
    })
    .catch(err => {
        console.error('Lỗi kết nối CSDL:', err.message);
        console.error('Vui lòng kiểm tra lại chuỗi kết nối trong file .env của bạn.');
        process.exit(1);
    });

module.exports = {
    sql,
    poolPromise
};