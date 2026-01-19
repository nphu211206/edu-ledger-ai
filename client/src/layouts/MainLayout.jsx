// /client/src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer'; // <-- BƯỚC 1: IMPORT FOOTER VÀO

const MainLayout = () => {
    // Chúng ta cần một div gốc để áp dụng flexbox
    return (
        <div className="flex flex-col min-h-screen bg-gray-900">
            <Header />
            {/* Thẻ main sẽ tự động co giãn để đẩy footer xuống dưới */}
            <main className="flex-grow">
                {/* Chúng ta không cần container ở đây nữa vì các trang con sẽ tự quản lý */}
                <Outlet />
            </main>
            <Footer /> {/* <-- BƯỚC 2: THÊM FOOTER VÀO CUỐI CÙNG */}
        </div>
    );
};

export default MainLayout;