import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';

interface MiniMapProps {
  locationName: string | null;
}

// Map keywords to approximate (x, y) coordinates on our 200x300 viewBox
const coordinateMap: Record<string, { x: number, y: number, name: string }> = {
  "평양": { x: 75, y: 80, name: "평양" },
  "의주": { x: 45, y: 30, name: "의주" },
  "한성": { x: 95, y: 150, name: "한성(서울)" },
  "서울": { x: 95, y: 150, name: "한성(서울)" },
  "한양": { x: 95, y: 150, name: "한성(서울)" },
  "경복": { x: 95, y: 150, name: "한성(서울)" },
  "개성": { x: 90, y: 135, name: "개성" },
  "강화": { x: 82, y: 145, name: "강화" },
  "충주": { x: 115, y: 170, name: "충주" },
  "탄금대": { x: 115, y: 170, name: "충주" },
  "진주": { x: 125, y: 220, name: "진주" },
  "동래": { x: 150, y: 230, name: "동래(부산)" },
  "부산": { x: 150, y: 230, name: "동래(부산)" },
  "제주": { x: 80, y: 280, name: "제주" },
  "울릉": { x: 190, y: 140, name: "울릉" },
  "안동": { x: 140, y: 180, name: "안동" },
  "광주": { x: 95, y: 225, name: "광주" },
  "전주": { x: 100, y: 195, name: "전주" },
};

export default function MiniMap({ locationName }: MiniMapProps) {
  const activePin = useMemo(() => {
    if (!locationName) return null;
    
    // Find matching keyword
    for (const [key, value] of Object.entries(coordinateMap)) {
      if (locationName.includes(key)) {
        return value;
      }
    }
    return null;
  }, [locationName]);

  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-3 flex flex-col items-center w-40 pointer-events-auto">
      <div className="flex items-center gap-1.5 w-full mb-2 border-b border-gray-100 pb-1.5">
        <MapPin size={14} className="text-gray-500" />
        <span className="text-xs font-bold text-gray-700">미니맵</span>
      </div>
      
      <div className="relative w-full aspect-[2/3] bg-blue-50/50 rounded-lg overflow-hidden border border-blue-100/50">
        <svg viewBox="0 0 200 300" className="w-full h-full text-green-100 fill-current drop-shadow-sm">
          {/* Rough Korean Peninsula SVG Path */}
          <path 
            d="M 50 20 L 70 15 L 90 20 L 110 30 L 130 50 L 150 80 L 165 110 L 175 140 L 170 180 L 160 210 L 155 240 L 130 250 L 100 255 L 80 240 L 60 210 L 80 180 L 75 140 L 60 110 L 40 80 L 40 50 Z" 
            stroke="#bbf7d0" 
            strokeWidth="2" 
            strokeLinejoin="round" 
          />
          {/* Jeju */}
          <ellipse cx="80" cy="280" rx="12" ry="7" />
          {/* Ulleung */}
          <circle cx="190" cy="140" r="4" />
        </svg>

        {/* Active Pin Overlay */}
        {activePin && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-full flex flex-col items-center animate-in fade-in zoom-in duration-300"
            style={{ left: `${(activePin.x / 200) * 100}%`, top: `${(activePin.y / 300) * 100}%` }}
          >
            <div className="bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap mb-0.5">
              {activePin.name}
            </div>
            <div className="relative flex justify-center items-center">
              <MapPin size={16} className="text-red-500 fill-red-100 relative z-10" />
              <div className="absolute w-4 h-4 bg-red-400 rounded-full animate-ping opacity-75"></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Status Text */}
      <div className="mt-2 text-[10px] text-gray-500 text-center px-1 h-3 truncate w-full">
        {activePin ? '위치 표시됨' : (locationName ? '위치 정보 없음' : '장소를 선택하세요')}
      </div>
    </div>
  );
}
