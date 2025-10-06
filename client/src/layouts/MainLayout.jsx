// /client/src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header'; // Import Header đã có

const MainLayout = () => {
    return (
        <>
            <Header />
            <main className="container mx-auto p-6">
                {/* Outlet là nơi nội dung của các trang con (Dashboard, Profile,...) sẽ được hiển thị */}
                <Outlet />
            </main>
        </>
    );
};

export default MainLayout;