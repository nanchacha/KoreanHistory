"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { GraphNode, GraphLink } from "../data/mockData";

interface HistoryGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick: (node: GraphNode, event: MouseEvent) => void;
  onLinkClick: (link: GraphLink, event: MouseEvent) => void;
  highlightNodes?: Set<string>;
  showPerson: boolean;
  showPlace: boolean;
  showExamTopics?: boolean;
  examNodeIds?: Set<string>;
}

const colorMap = {
  event: "#FF6B6B",
  person: "#4D96FF",
  place: "#6BCB77",
};

export default function HistoryGraph({ nodes, links, onNodeClick, onLinkClick, highlightNodes, showPerson, showPlace, showExamTopics, examNodeIds }: HistoryGraphProps) {
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setDimensions({ width: clientWidth, height: clientHeight });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isNodeDimmed = useCallback((node: any) => {
    if (showExamTopics && examNodeIds && !examNodeIds.has(node.id)) return true;
    if (node.group === "person" && !showPerson) return true;
    if (node.group === "place" && !showPlace) return true;
    return false;
  }, [showPerson, showPlace, showExamTopics, examNodeIds]);

  // Use a callback to paint nodes, including highlights
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isHighlighted = highlightNodes && highlightNodes.has(node.id);
    const dimmed = isNodeDimmed(node);
    
    const color = colorMap[node.group as keyof typeof colorMap] || "#999";

    ctx.save();
    if (dimmed) {
      ctx.globalAlpha = 0.15; // Dim the node
    } else {
      ctx.globalAlpha = 1.0;
    }

    const label = node.label;
    const fontSize = node.group === "event" ? 14 / globalScale : 11 / globalScale;
    ctx.font = `${node.group === "event" ? "bold " : ""}${fontSize}px Sans-Serif`;
    
    // Calculate dimensions based on text size
    const textWidth = ctx.measureText(label).width;
    const paddingX = 10 / globalScale;
    const paddingY = 6 / globalScale;
    const width = textWidth + paddingX * 2;
    const height = fontSize + paddingY * 2;
    
    // Events get a standard slightly rounded box, persons/places get a fully rounded pill shape
    const radius = node.group === "event" ? 4 / globalScale : height / 2;

    ctx.beginPath();
    
    // Draw rounded rectangle (supported in modern canvas)
    if (ctx.roundRect) {
      ctx.roundRect(node.x - width / 2, node.y - height / 2, width, height, radius);
    } else {
      // Fallback if roundRect is not supported
      ctx.rect(node.x - width / 2, node.y - height / 2, width, height);
    }
    
    ctx.fillStyle = color;
    ctx.fill();
    
    if (isHighlighted) {
      ctx.strokeStyle = "#FFE600";
      ctx.lineWidth = 3 / globalScale;
      ctx.stroke();
    }
    
    // Draw label centered inside the shape
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff"; // White text for all for clean contrast
    ctx.fillText(label, node.x, node.y);

    ctx.restore();
  }, [highlightNodes, isNodeDimmed]);

  const getLinkColor = useCallback((link: any) => {
    // Determine if link should be dimmed by checking its source/target
    const sourceNode = typeof link.source === 'object' ? link.source : nodes.find(n => n.id === link.source);
    const targetNode = typeof link.target === 'object' ? link.target : nodes.find(n => n.id === link.target);
    
    if ((sourceNode && isNodeDimmed(sourceNode)) || (targetNode && isNodeDimmed(targetNode))) {
      return "rgba(156, 163, 175, 0.15)"; // Very faint gray for dimmed links
    }
    return "#9ca3af"; // Normal gray
  }, [nodes, isNodeDimmed]);

  const graphData = React.useMemo(() => ({ nodes, links }), [nodes, links]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    
    const matchingNodes = nodes.filter(n => n.label.toLowerCase().includes(query)).map(n => ({ type: 'node', data: n }));
    
    return matchingNodes;
  }, [searchQuery, nodes]);

  useEffect(() => {
    setVisibleCount(5);
    setIsDropdownOpen(searchResults.length > 0 && searchQuery.trim().length > 0);
  }, [searchQuery, searchResults.length]);

  const handleSelectItem = (item: any) => {
    if (!fgRef.current) return;
    
    if (item.type === 'edge') {
      const foundEdge = item.data;
      const source: any = typeof foundEdge.source === 'object' ? foundEdge.source : nodes.find(n => n.id === foundEdge.source);
      const target: any = typeof foundEdge.target === 'object' ? foundEdge.target : nodes.find(n => n.id === foundEdge.target);
      
      if (source && target && source.x !== undefined && target.x !== undefined) {
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        fgRef.current.centerAt(midX, midY, 1000);
        fgRef.current.zoom(6, 1000);
      }
    } else {
      const foundNode = item.data;
      if (foundNode && foundNode.x !== undefined) {
        fgRef.current.centerAt(foundNode.x, foundNode.y, 1000);
        fgRef.current.zoom(6, 1000);
      }
    }
    setIsDropdownOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSelectItem(searchResults[0]);
    } else {
      alert("검색 결과가 없습니다.");
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative" onClick={() => setIsDropdownOpen(false)}>
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel="label"
        nodeCanvasObject={paintNode}
        nodeRelSize={8}
        linkColor={getLinkColor}
        linkWidth={1.5}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(node, event) => onNodeClick(node as GraphNode, event as MouseEvent)}
        onLinkClick={(link, event) => onLinkClick(link as GraphLink, event as MouseEvent)}
      />
      
      {/* Search Bar & Dropdown */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col w-[65vw] max-w-[270px] md:max-w-[320px]" onClick={(e) => e.stopPropagation()}>
        {/* Dropdown Results (placed above the input so it opens upwards) */}
        {isDropdownOpen && searchResults.length > 0 && (
          <div className="w-full mb-2 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 overflow-hidden text-sm flex flex-col max-h-[30vh] md:max-h-[300px] overflow-y-auto custom-scrollbar">
            {searchResults.slice(0, visibleCount).map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectItem(item)}
                className="text-left px-3 py-2.5 md:px-4 md:py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors flex items-center justify-between"
              >
                <span className="font-medium text-gray-800 truncate pr-2 text-xs md:text-sm">
                  {item.data.label}
                </span>
                <span className={`text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${item.type === 'edge' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                  {item.type === 'edge' ? '관계' : '노드'}
                </span>
              </button>
            ))}
            
            {visibleCount < searchResults.length && (
              <button 
                type="button"
                onClick={() => setVisibleCount(prev => prev + 5)}
                className="w-full py-2.5 md:py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 font-medium flex items-center justify-center gap-1.5 transition-colors text-[11px] md:text-xs"
              >
                더보기 ({searchResults.length - visibleCount}개 남음) 
                <span className="text-[10px]">▼</span>
              </button>
            )}
          </div>
        )}

        <form 
          onSubmit={handleSearch}
          className="flex items-center bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 overflow-hidden w-full"
        >
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setIsDropdownOpen(true); }}
            placeholder="노드 검색..."
            className="flex-1 min-w-0 px-3 py-2 md:px-4 md:py-3 text-sm md:text-base text-gray-700 bg-transparent outline-none placeholder-gray-400"
          />
          <button 
            type="submit" 
            className="px-3 py-2 md:px-5 md:py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors border-l border-gray-200 font-bold text-sm whitespace-nowrap flex-shrink-0"
          >
            검색
          </button>
        </form>
      </div>
    </div>
  );
}
