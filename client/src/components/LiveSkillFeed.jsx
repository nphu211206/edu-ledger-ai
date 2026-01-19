// File: client/src/components/LiveSkillFeed.jsx

import React, { useState, useEffect } from 'react';
import { getTrendingSkills } from '../services/api';
import './LiveSkillFeed.css'; // Chúng ta sẽ tạo file CSS này ngay sau đây

const SkillTag = ({ name, animationDuration }) => (
    <div className="skill-tag" style={{ animationDuration: `${animationDuration}s` }}>
        {name}
    </div>
);

const LiveSkillFeed = () => {
    const [skills, setSkills] = useState([]);

    useEffect(() => {
        getTrendingSkills().then(skillNames => {
            // Nhân đôi danh sách để tạo hiệu ứng lặp lại vô tận một cách mượt mà
            const extendedSkills = [...skillNames, ...skillNames];
            setSkills(extendedSkills);
        });
    }, []);

    if (skills.length === 0) {
        return null; // Không hiển thị gì nếu không có dữ liệu
    }

    // Tạo các giá trị ngẫu nhiên để dòng chảy trông tự nhiên hơn
    const getRandomDuration = () => 20 + Math.random() * 20; // Tốc độ từ 20s đến 40s

    return (
        <div className="skill-feed-container">
            <div className="skill-feed-track">
                {skills.map((skill, index) => (
                    <SkillTag key={index} name={skill} animationDuration={getRandomDuration()} />
                ))}
            </div>
            <div className="skill-feed-fade left" />
            <div className="skill-feed-fade right" />
        </div>
    );
};

export default LiveSkillFeed;