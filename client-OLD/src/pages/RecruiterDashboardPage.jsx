// /client/src/pages/RecruiterDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const SERVER_URL = 'http://localhost:3000';
const Spinner = () => <div className="spinner"></div>;
const SpinnerSmall = () => <div className="spinner-small"></div>;

// Component hiển thị kết quả tìm kiếm
const SearchResultCard = ({ student }) => (
    <div className="search-result-card">
        <img src={student.avatarUrl} alt={`${student.name}'s avatar`} />
        <div className="result-info">
            <div className="result-name">{student.name}</div>
            <div className="result-username">@{student.username}</div>
            <p className="result-bio">{student.bio || "Không có bio."}</p>
        </div>
        <Link to={`/profile/${student.username}`} className="view-profile-btn">Xem Hồ sơ</Link>
    </div>
);

export default function RecruiterDashboardPage() {
    const [recruiter, setRecruiter] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchCriteria, setSearchCriteria] = useState([{ name: '', minScore: 70 }]);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');
    const token = localStorage.getItem('jwt_token');

    useEffect(() => {
        const fetchRecruiterData = async () => {
            // ... (code fetch data như cũ)
             if (token) {
                try {
                    const config = { headers: { 'Authorization': `Bearer ${token}` } };
                    const response = await axios.get(`${SERVER_URL}/api/me`, config);
                    setRecruiter(response.data);
                } catch (error) {
                    console.error("Lỗi khi lấy thông tin nhà tuyển dụng:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchRecruiterData();
    }, [token]);

    const handleCriteriaChange = (index, event) => {
        const values = [...searchCriteria];
        values[index][event.target.name] = event.target.value;
        setSearchCriteria(values);
    };

    const handleAddCriterion = () => {
        setSearchCriteria([...searchCriteria, { name: '', minScore: 70 }]);
    };

    const handleRemoveCriterion = (index) => {
        const values = [...searchCriteria];
        values.splice(index, 1);
        setSearchCriteria(values);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setIsSearching(true);
        setSearchResults([]);
        setError('');

        const validCriteria = searchCriteria.filter(c => c.name.trim() !== '');
        if (validCriteria.length === 0) {
            setError('Vui lòng nhập ít nhất một kỹ năng để tìm kiếm.');
            setIsSearching(false);
            return;
        }

        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const response = await axios.post(`${SERVER_URL}/api/recruiter/search`, { skills: validCriteria }, config);
            setSearchResults(response.data);
        } catch (err) {
            setError(err.response?.data || 'Tìm kiếm thất bại. Vui lòng thử lại.');
        } finally {
            setIsSearching(false);
        }
    };

    if (isLoading) {
        return <div className="app-container"><Spinner /></div>;
    }

    return (
        <div className="dashboard-container recruiter-dashboard">
            <aside className="profile-sidebar">
                <div className="profile-card">
                    <h3>Nhà tuyển dụng</h3>
                    <div className="profile-name">{recruiter?.name}</div>
                    <div className="profile-login">{recruiter?.username}</div>
                </div>
            </aside>
            <main className="profile-main-content">
                <div className="profile-section">
                    <h2>Smart Search Engine</h2>
                    <p>Tìm kiếm ứng viên dựa trên các kỹ năng đã được EduLedger AI xác thực.</p>
                    <form onSubmit={handleSearch} className="smart-search-form">
                        {searchCriteria.map((criterion, index) => (
                            <div className="criterion-row" key={index}>
                                <input
                                    type="text"
                                    placeholder="Kỹ năng (ví dụ: React)"
                                    name="name"
                                    value={criterion.name}
                                    onChange={event => handleCriteriaChange(index, event)}
                                />
                                <input
                                    type="number"
                                    placeholder="Điểm tối thiểu"
                                    name="minScore"
                                    value={criterion.minScore}
                                    onChange={event => handleCriteriaChange(index, event)}
                                    min="0"
                                    max="100"
                                />
                                <button type="button" className="remove-btn" onClick={() => handleRemoveCriterion(index)}>×</button>
                            </div>
                        ))}
                        <div className="form-actions">
                            <button type="button" className="add-btn" onClick={handleAddCriterion}>+ Thêm tiêu chí</button>
                            <button type="submit" className="auth-btn" disabled={isSearching}>
                                {isSearching ? <SpinnerSmall /> : 'Tìm kiếm'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="profile-section search-results-section">
                    <h2>Kết quả tìm kiếm</h2>
                    {isSearching && <Spinner />}
                    {error && <p className="error-message">{error}</p>}
                    {!isSearching && searchResults.length > 0 && (
                        <div className="search-results-grid">
                            {searchResults.map(student => (
                                <SearchResultCard key={student.id} student={student} />
                            ))}
                        </div>
                    )}
                    {!isSearching && searchResults.length === 0 && (
                        <p>Không có kết quả nào. Hãy thử thay đổi tiêu chí tìm kiếm của bạn.</p>
                    )}
                </div>
            </main>
        </div>
    );
}