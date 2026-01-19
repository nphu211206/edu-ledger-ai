// File: client/src/components/InteractiveJobMap.jsx
// PHIÊN BẢN NÂNG CẤP VỚI MARKER TÙY CHỈNH VÀ TƯƠNG TÁC

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- TẠO CUSTOM MARKER ---
// Sử dụng DivIcon để có thể dùng HTML và CSS, linh hoạt hơn rất nhiều so với ảnh
const createCustomIcon = (isHovered) => {
    return L.divIcon({
        html: `<div class="custom-marker ${isHovered ? 'hovered' : ''}"><div class="pulse"></div><div class="dot"></div></div>`,
        className: 'custom-marker-container',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });
};

// Component con để tự động điều chỉnh view của bản đồ
const MapEffect = ({ jobsWithCoords }) => {
    const map = useMap();
    useEffect(() => {
        if (jobsWithCoords.length > 0) {
            const bounds = L.latLngBounds(jobsWithCoords.map(job => job.coordinates));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [jobsWithCoords, map]);
    return null;
};

const InteractiveJobMap = ({ jobs, hoveredJobId, onMarkerClick }) => {
    const jobsWithCoords = jobs.filter(job => job.coordinates && job.coordinates.length === 2);

    return (
        <div className="h-[500px] w-full rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl relative">
            <MapContainer center={[16.047079, 108.206230]} zoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%', backgroundColor: '#111827' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {jobsWithCoords.map(job => (
                    <Marker 
                        key={job.id} 
                        position={job.coordinates} 
                        icon={createCustomIcon(job.id === hoveredJobId)}
                        eventHandlers={{
                            click: () => onMarkerClick(job.id),
                        }}
                    >
                        <Popup>
                            <div className="font-sans">
                                <h3 className="font-bold text-base mb-1">{job.title}</h3>
                                <p className="text-sm text-gray-600">{job.company.name}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
                <MapEffect jobsWithCoords={jobsWithCoords} />
            </MapContainer>
        </div>
    );
};

export default InteractiveJobMap;