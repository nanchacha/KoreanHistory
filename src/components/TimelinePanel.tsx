import React from 'react';
import { GraphNode } from '../data/mockData';
import { Clock, MapPin, ChevronRight, X } from 'lucide-react';

interface TimelinePanelProps {
  timelineGroups: GraphNode[][];
  onNodeClick: (node: GraphNode) => void;
  onClose: () => void;
}

export default function TimelinePanel({ timelineGroups, onNodeClick, onClose }: TimelinePanelProps) {
  if (!timelineGroups || timelineGroups.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-30 w-72 md:w-80 max-h-[85vh] flex flex-col pointer-events-auto bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-amber-50/50">
        <div className="flex items-center gap-2 text-amber-700">
          <Clock size={16} className="text-amber-500" />
          <h3 className="font-bold text-sm">연결된 사건 타임라인</h3>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 p-1"
        >
          <X size={16} />
        </button>
      </div>

      <div className="overflow-y-auto custom-scrollbar p-4 flex-1">
        {timelineGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="mb-6 last:mb-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                사건 그룹 {groupIdx + 1}
              </span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
            
            <div className="relative pl-3 border-l-2 border-amber-200/60 ml-2 space-y-4">
              {group.map((node, nodeIdx) => (
                <div 
                  key={node.id} 
                  className="relative group cursor-pointer"
                  onClick={() => onNodeClick(node)}
                >
                  {/* Timeline Dot */}
                  <div className="absolute -left-[17px] top-1 w-3 h-3 bg-white border-2 border-amber-400 rounded-full group-hover:bg-amber-400 transition-colors z-10 shadow-sm" />
                  
                  {/* Content Card */}
                  <div className="bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm group-hover:shadow-md group-hover:border-amber-200 transition-all">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-gray-800 text-sm">{node.label.replace('\n', ' ')}</span>
                        {node.properties?.year && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 rounded">
                            {node.properties.year}년
                          </span>
                        )}
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                    </div>
                    
                    {node.properties?.summary && (
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {node.properties.summary}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
