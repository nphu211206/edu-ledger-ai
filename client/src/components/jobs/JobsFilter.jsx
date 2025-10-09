// File: client/src/components/jobs/JobsFilter.jsx
// HÃY THAY THẾ TOÀN BỘ NỘI DUNG FILE NÀY

import React, { useState } from 'react';
import { Search, MapPin, Briefcase, DollarSign, Code } from 'lucide-react';

const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Remote'];

const JobsFilter = ({ onFilterChange }) => {
    const [keyword, setKeyword] = useState('');
    const [location, setLocation] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        onFilterChange({ keyword, location });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
            <h3 className="text-xl font-bold mb-4 border-b pb-3">Bộ lọc tìm kiếm</h3>
            <form onSubmit={handleSearch}>
                {/* Search Keyword */}
                <div className="mb-4">
                    <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">Từ khóa</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            id="keyword"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Chức danh, công ty..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>
                </div>
                {/* Location */}
                <div className="mb-6">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Địa điểm</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Hà Nội, TP.HCM..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-md hover:bg-blue-700 transition duration-300 mb-6 flex items-center justify-center"
                >
                    <Search className="h-5 w-5 mr-2" />
                    Tìm kiếm
                </button>

                {/* Các bộ lọc nâng cao */}
                <div className="mb-4">
                    <h4 className="font-semibold mb-2 flex items-center"><Briefcase className="h-5 w-5 mr-2 text-gray-600"/>Loại công việc</h4>
                    <div className="space-y-2">
                        {JOB_TYPES.map(type => (
                            <div key={type} className="flex items-center">
                                <input id={type} name="jobType" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <label htmlFor={type} className="ml-3 text-sm text-gray-600">{type}</label>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="pt-4 mt-4 border-t">
                    <button type="button" className="w-full text-sm text-blue-600 hover:text-blue-800 font-semibold">
                        Xóa tất cả bộ lọc
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JobsFilter;