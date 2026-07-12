import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';

interface MiniMapProps {
  locationName: string | null;
}

// Map keywords to approximate (x, y) coordinates on our 350x350 East Asia viewBox
const coordinateMap: Record<string, { x: number, y: number, name: string, isForeign?: boolean, region?: string }> = {
  // --- KOREA ---
  "조선": { x: 220, y: 180, name: "조선", region: "korea" },
  "고려": { x: 220, y: 180, name: "고려", region: "korea" },
  "대한민국": { x: 220, y: 200, name: "대한민국", region: "korea" },
  "한국": { x: 220, y: 200, name: "한국", region: "korea" },
  "평양": { x: 200, y: 130, name: "평양" },
  "의주": { x: 170, y: 80, name: "의주" },
  "한성": { x: 220, y: 200, name: "한성(서울)" },
  "서울": { x: 220, y: 200, name: "한성(서울)" },
  "한양": { x: 220, y: 200, name: "한성(서울)" },
  "경복": { x: 220, y: 200, name: "한성(서울)" },
  "개성": { x: 215, y: 185, name: "개성" },
  "강화": { x: 207, y: 195, name: "강화" },
  "충주": { x: 240, y: 220, name: "충주" },
  "탄금대": { x: 240, y: 220, name: "충주" },
  "진주": { x: 250, y: 270, name: "진주" },
  "동래": { x: 275, y: 280, name: "동래(부산)" },
  "부산": { x: 275, y: 280, name: "동래(부산)" },
  "제주": { x: 205, y: 330, name: "제주" },
  "울릉": { x: 315, y: 190, name: "울릉" },
  "안동": { x: 265, y: 230, name: "안동" },
  "광주": { x: 220, y: 275, name: "광주" },
  "전주": { x: 225, y: 245, name: "전주" },

  // --- INTERNATIONAL ---
  "명": { x: 80, y: 180, name: "명나라(중국)", isForeign: true, region: "china" },
  "청": { x: 130, y: 70, name: "청/후금(만주)", isForeign: true, region: "china" },
  "만주": { x: 155, y: 40, name: "만주", isForeign: true, region: "china" },
  "요동": { x: 125, y: 90, name: "요동", isForeign: true },
  "일": { x: 330, y: 290, name: "일본", isForeign: true, region: "japan" },
  "왜": { x: 330, y: 290, name: "일본(왜)", isForeign: true, region: "japan" },
  "대마": { x: 290, y: 295, name: "대마도(쓰시마)", isForeign: true }
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

  const activeRegion = activePin?.region;

  return (
    <div className="bg-white/20 backdrop-blur-sm border border-gray-200/30 shadow-lg rounded-2xl p-3 flex flex-col items-center w-56 pointer-events-auto">
      <div className="flex items-center gap-1.5 w-full mb-2 border-b border-gray-100/30 pb-1.5">
        <MapPin size={14} className="text-gray-600/80" />
        <span className="text-xs font-bold text-gray-700/80">동북아시아 미니맵</span>
      </div>
      
      <div className="relative w-full aspect-square bg-blue-50/10 rounded-lg overflow-hidden border border-blue-100/20">
        <div 
          className="w-full h-full transition-transform duration-700 ease-in-out origin-center"
          style={{ transform: activePin?.isForeign ? 'scale(1) translate(0, 0)' : 'scale(1.5) translate(-17%, -1%)' }}
        >
          <svg viewBox="0 0 350 350" className="w-full h-full drop-shadow-sm transition-colors duration-500">
            {/* China / Manchuria */}
            <path 
              d="M -20 -20 L 225 -20 L 215 50 L 195 45 L 175 50 L 165 80 L 165 110 L 185 140 L 200 170 L 205 210 L 185 240 L 155 260 L 105 280 L 25 320 L -20 320 Z" 
              fill="#dcfce7" 
              stroke={activeRegion === 'china' ? '#ef4444' : '#bbf7d0'} 
              strokeWidth={activeRegion === 'china' ? '3' : '2'} 
              strokeLinejoin="round" 
              className="opacity-70 transition-all duration-500"
            />
            
            {/* Korean Peninsula */}
            <path 
              d="M 175 50 L 195 45 L 215 50 L 235 60 L 255 80 L 275 110 L 290 140 L 300 170 L 295 210 L 285 240 L 280 270 L 255 280 L 225 285 L 205 270 L 185 240 L 205 210 L 200 170 L 185 140 L 165 110 L 165 80 Z" 
              fill="#bbf7d0" 
              stroke={activeRegion === 'korea' ? '#ef4444' : '#86efac'} 
              strokeWidth={activeRegion === 'korea' ? '3' : '2'} 
              strokeLinejoin="round" 
              className="transition-all duration-500"
            />
            {/* Jeju */}
            <ellipse cx="205" cy="330" rx="12" ry="7" fill="#bbf7d0" stroke={activeRegion === 'korea' ? '#ef4444' : '#86efac'} strokeWidth={activeRegion === 'korea' ? '3' : '2'} className="transition-all duration-500" />
            {/* Ulleung */}
            <circle cx="315" cy="190" r="4" fill="#bbf7d0" stroke={activeRegion === 'korea' ? '#ef4444' : '#86efac'} strokeWidth={activeRegion === 'korea' ? '2.5' : '1.5'} className="transition-all duration-500" />
            {/* Tsushima (Daemado) */}
            <ellipse cx="290" cy="295" rx="5" ry="8" fill="#bbf7d0" stroke="#86efac" strokeWidth="1.5" />

            {/* Japan */}
            <path 
              d="M 275 350 L 305 310 L 345 300 L 355 260 L 335 230 L 315 240 L 315 280 L 285 310 Z M 345 230 L 365 210 L 375 170 L 355 180 L 335 210 Z" 
              fill="#dcfce7" 
              stroke={activeRegion === 'japan' ? '#ef4444' : '#bbf7d0'} 
              strokeWidth={activeRegion === 'japan' ? '3' : '2'} 
              strokeLinejoin="round" 
              className="opacity-70 transition-all duration-500"
            />
          </svg>

          {/* Active Pin Overlay */}
          {activePin && (
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-full flex flex-col items-center animate-in fade-in zoom-in duration-300"
              style={{ left: `${(activePin.x / 350) * 100}%`, top: `${(activePin.y / 350) * 100}%` }}
            >
              <div 
                className="bg-gray-900 text-white font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap mb-0.5 transition-all"
                style={{ fontSize: activePin?.isForeign ? '10px' : '7px' }}
              >
                {activePin.name}
              </div>
              <div className="relative flex justify-center items-center">
                <MapPin size={activePin?.isForeign ? 16 : 11} className="text-red-500 fill-red-100 relative z-10 transition-all" />
                <div className="absolute w-full h-full bg-red-400 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Status Text */}
      <div className="mt-2 text-[10px] text-gray-500 text-center px-1 h-3 truncate w-full">
        {activePin ? '위치 표시됨' : (locationName ? '위치 정보 없음' : '장소를 선택하세요')}
      </div>
    </div>
  );
}
