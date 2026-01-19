<div align="center">

# 🎓 EduLedger AI

### Nền Tảng Xác Thực Năng Lực & Kết Nối Sinh Viên Với Doanh Nghiệp Bằng AI

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-FF6F61?style=for-the-badge&logo=openai)](https://openai.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Cầu nối thông minh giữa sinh viên tài năng và doanh nghiệp**

[🚀 Bắt đầu](#-quick-start) • [✨ Tính năng](#-tính-năng-chính) • [🛠️ Cài đặt](#️-cài-đặt) • [📖 Tài liệu](#-cấu-trúc-dự-án)

</div>

---

## 📋 Giới Thiệu

**EduLedger AI** là nền tảng công nghệ tiên tiến sử dụng trí tuệ nhân tạo để:
- 🔐 **Xác thực năng lực** sinh viên một cách minh bạch và đáng tin cậy
- 🤝 **Kết nối thông minh** sinh viên với doanh nghiệp phù hợp
- 📊 **Phân tích dữ liệu** để đưa ra gợi ý tuyển dụng chính xác

---

## ✨ Tính Năng Chính

### 👨‍🎓 Dành cho Sinh viên
| Tính năng | Mô tả |
|-----------|-------|
| 📝 **Hồ sơ năng lực** | Tạo portfolio chuyên nghiệp với CV, kỹ năng, dự án |
| 🎯 **AI Matching** | Được gợi ý việc làm phù hợp với năng lực |
| 📜 **Chứng chỉ số** | Xác thực bằng cấp, chứng chỉ an toàn |
| 📍 **Bản đồ việc làm** | Xem vị trí các công ty đang tuyển dụng |

### 🏢 Dành cho Doanh nghiệp
| Tính năng | Mô tả |
|-----------|-------|
| 🔍 **Tìm kiếm ứng viên** | Lọc sinh viên theo kỹ năng, trường, điểm GPA |
| 🤖 **AI Screening** | Đánh giá ứng viên tự động bằng AI |
| 📊 **Dashboard Analytics** | Thống kê tuyển dụng real-time |
| ✅ **Xác minh hồ sơ** | Kiểm tra độ tin cậy của hồ sơ sinh viên |

### 🔐 Bảo mật & Tin cậy
- 🛡️ **Xác thực đa lớp** - JWT + OAuth2
- 📋 **Audit Trail** - Lưu trữ lịch sử hoạt động
- 🔒 **Data Encryption** - Mã hóa dữ liệu nhạy cảm

---

## 🚀 Quick Start

### Yêu Cầu Hệ Thống

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

### 🔧 Cài Đặt

```bash
# 1. Clone repository
git clone https://github.com/nphu211206/edu-ledger-ai.git
cd edu-ledger-ai

# 2. Cài đặt Frontend
cd client
npm install
npm run dev

# 3. Cài đặt Backend (terminal mới)
cd ../server
npm install
node index.js

# 4. Import Database
# Chạy file init.sql vào PostgreSQL
```

### 🌐 Truy Cập

| Service | URL | Mô tả |
|---------|-----|-------|
| 🖥️ **Web App** | http://localhost:5173 | Giao diện người dùng |
| ⚡ **API** | http://localhost:3000 | Backend API |

---

## 🏗️ Cấu Trúc Dự Án

```
edu-ledger-ai/
├── 📁 client/              # Frontend React + Vite
│   ├── 📁 src/
│   │   ├── components/     # UI Components
│   │   ├── pages/          # Route Pages
│   │   └── services/       # API Services
│   └── package.json
├── 📁 server/              # Backend Node.js + Express
│   ├── 📁 controllers/     # Route Controllers
│   ├── 📁 models/          # Database Models
│   ├── 📁 routes/          # API Routes
│   ├── 📁 services/        # Business Logic + AI
│   └── index.js            # Entry Point
├── 📄 init.sql             # Database Schema
├── 📄 LICENSE              # MIT License
└── 📄 README.md            # This file
```

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React" />
<br>React 18
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=nodejs" width="48" height="48" alt="Node.js" />
<br>Node.js
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=express" width="48" height="48" alt="Express" />
<br>Express
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=postgres" width="48" height="48" alt="PostgreSQL" />
<br>PostgreSQL
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
<br>Tailwind
</td>
</tr>
</table>

---

## 📊 Database Schema

```sql
-- Bảng chính
├── users           # Thông tin người dùng
├── students        # Hồ sơ sinh viên
├── companies       # Thông tin doanh nghiệp
├── skills          # Danh sách kỹ năng
├── certificates    # Chứng chỉ số
├── jobs            # Tin tuyển dụng
└── applications    # Đơn ứng tuyển
```

---

## 👨‍💻 Author

**Nguyen Phu** - [@nphu211206](https://github.com/nphu211206)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ Nếu dự án hữu ích, hãy cho một Star nhé!**

Made with ❤️ and ☕ by Nguyen Phu

</div>
