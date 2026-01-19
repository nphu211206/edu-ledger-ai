// File: client/src/components/jobs/JobsFilter.jsx
// HÃY THAY THẾ TOÀN BỘ NỘI DUNG FILE NÀY

import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Briefcase, DollarSign, ListFilter, X } from 'lucide-react';

const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Remote'];
const SALARY_RANGES = ['Tất cả', 'Dưới 10 triệu', '10 - 20 triệu', '20 - 40 triệu', 'Trên 40 triệu', 'Thỏa thuận'];

// Debounce function to limit API calls while typing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const JobsFilter = ({ onFilterChange }) => {
    const [keyword, setKeyword] = useState('');
    const [location, setLocation] = useState('');
    const [selectedJobTypes, setSelectedJobTypes] = useState([]);
    const [selectedSalary, setSelectedSalary] = useState('Tất cả');

    // Debounced function for keyword/location changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedFilterChange = useCallback(
        debounce((filters) => {
            onFilterChange(filters);
        }, 500), // Wait 500ms after user stops typing
        [onFilterChange]
    );

    // Effect to trigger filter change when any state changes
    useEffect(() => {
        const filters = {
            keyword: keyword.trim(),
            location: location.trim(),
            jobTypes: selectedJobTypes, // Send array of selected types
            salaryRange: selectedSalary !== 'Tất cả' ? selectedSalary : '', // Send selected range or empty
        };
        // Use debounced function only for keyword/location to avoid instant calls while typing
        if (filters.keyword !== keyword || filters.location !== location) {
             debouncedFilterChange(filters);
        } else {
            // For checkboxes and select, trigger immediately
             onFilterChange(filters);
        }

    }, [keyword, location, selectedJobTypes, selectedSalary, onFilterChange, debouncedFilterChange]);

    const handleJobTypeChange = (e) => {
        const { value, checked } = e.target;
        setSelectedJobTypes(prev =>
            checked ? [...prev, value] : prev.filter(type => type !== value)
        );
    };

    const handleSalaryChange = (e) => {
        setSelectedSalary(e.target.value);
    };

    const clearFilters = () => {
        setKeyword('');
        setLocation('');
        setSelectedJobTypes([]);
        setSelectedSalary('Tất cả');
        // onFilterChange({}); // Trigger update with empty filters immediately
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 sticky top-24">
            <h3 className="text-xl font-bold mb-4 border-b pb-3 text-gray-800 flex items-center gap-2"><ListFilter className="w-5 h-5"/> Bộ lọc tìm kiếm</h3>

            {/* Search Keyword */}
            <div className="mb-4">
                <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">Từ khóa</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </span>
                    <input type="text" id="keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Chức danh, công ty..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition" />
                </div>
            </div>

            {/* Location */}
            <div className="mb-6">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Địa điểm</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                    </span>
                    <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Hà Nội, TP.HCM..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition" />
                </div>
            </div>

            {/* Job Type */}
            <div className="mb-6 border-t pt-4">
                <h4 className="font-semibold mb-2 text-gray-800 flex items-center"><Briefcase className="h-5 w-5 mr-2 text-gray-600"/>Loại công việc</h4>
                <div className="space-y-2">
                    {JOB_TYPES.map(type => (
                        <div key={type} className="flex items-center">
                            <input
                                id={type}
                                name="jobType"
                                type="checkbox"
                                value={type}
                                checked={selectedJobTypes.includes(type)}
                                onChange={handleJobTypeChange}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor={type} className="ml-3 text-sm text-gray-600 cursor-pointer">{type}</label>
                        </div>
                    ))}
                </div>
            </div>

             {/* Salary Range */}
             <div className="mb-6 border-t pt-4">
                <h4 className="font-semibold mb-2 text-gray-800 flex items-center"><DollarSign className="h-5 w-5 mr-2 text-gray-600"/>Mức lương</h4>
                 <select
                    id="salaryRange"
                    value={selectedSalary}
                    onChange={handleSalaryChange}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {SALARY_RANGES.map(range => (
                        <option key={range} value={range}>{range}</option>
                    ))}
                </select>
            </div>

            {/* Clear Filters Button */}
            <div className="pt-4 mt-4 border-t">
                <button
                    type="button"
                    onClick={clearFilters}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center justify-center gap-1"
                >
                   <X className="w-4 h-4"/> Xóa tất cả bộ lọc
                </button>
            </div>
        </div>
    );
};

export default JobsFilter;