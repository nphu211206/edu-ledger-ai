// File: client/src/components/jobs/JobCard.jsx
// HÃY THAY THẾ TOÀN BỘ NỘI DUNG FILE NÀY

import React from 'react';
import { MapPin, DollarSign, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion } from 'framer-motion';

const formatSalary = (salary) => {
    if (!salary) return 'Thỏa thuận';
    if (salary.type === 'Thỏa thuận') return 'Thỏa thuận';
    if (salary.min && salary.max) return `${salary.min} - ${salary.max} ${salary.unit}`;
    if (salary.min) return `Từ ${salary.min} ${salary.unit}`;
    if (salary.max) return `Lên đến ${salary.max} ${salary.unit}`;
    return 'Thỏa thuận';
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

const JobCard = ({ job }) => {
    const timeAgo = job.postedDate 
        ? formatDistanceToNow(new Date(job.postedDate), { addSuffix: true, locale: vi })
        : 'Không xác định';

    return (
        <motion.div
            variants={cardVariants}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col sm:flex-row items-start gap-6"
        >
            <img 
                src={job.company.logoUrl} 
                alt={`${job.company.name} logo`} 
                className="w-16 h-16 rounded-md object-contain border p-1 flex-shrink-0" 
            />
            
            <div className="flex-grow">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
                            <a href={`/jobs/${job.id}`}>{job.title}</a>
                        </h2>
                        <p className="text-md text-gray-600">{job.company.name}</p>
                    </div>
                    <span className="text-xs text-gray-500 mt-2 sm:mt-1 flex items-center flex-shrink-0">
                        <Clock className="h-3.5 w-3.5 mr-1.5"/> {timeAgo}
                    </span>
                </div>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700 mb-4">
                    <div className="flex items-center" title="Địa điểm">
                        <MapPin className="h-4 w-4 mr-1.5 text-gray-500"/>
                        <span>{job.location}</span>
                    </div>
                    <div className="flex items-center" title="Mức lương">
                        <DollarSign className="h-4 w-4 mr-1.5 text-gray-500"/>
                        <span>{formatSalary(job.salary)}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {job.skills.slice(0, 4).map(skill => (
                        <span key={skill} className="bg-blue-50 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200">
                            {skill}
                        </span>
                    ))}
                    {job.skills.length > 4 && (
                        <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                            +{job.skills.length - 4}
                        </span>
                    )}
                </div>
            </div>

            <div className="w-full sm:w-auto mt-4 sm:mt-0 sm:self-center">
                <button className="w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 shadow-sm hover:shadow-md">
                    Ứng tuyển
                </button>
            </div>
        </motion.div>
    );
};

export default JobCard;