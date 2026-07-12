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
}

const colorMap = {
  event: "#FF6B6B",
  person: "#4D96FF",
  place: "#6BCB77",
};

export default function HistoryGraph({ nodes, links, onNodeClick, onLinkClick, highlightNodes, showPerson, showPlace }: HistoryGraphProps) {
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
    if (node.group === "person" && !showPerson) return true;
    if (node.group === "place" && !showPlace) return true;
    return false;
  }, [showPerson, showPlace]);

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

  return (
    <div ref={containerRef} className="w-full h-full">
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={{ nodes, links }}
        nodeLabel="label"
        nodeCanvasObject={paintNode}
        nodeRelSize={8}
        linkColor={getLinkColor}
        linkWidth={1.5}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(node, event) => onNodeClick(node as GraphNode, event as MouseEvent)}
        onLinkClick={(link, event) => onLinkClick(link as GraphLink, event as MouseEvent)}
        d3VelocityDecay={0.3}
        cooldownTicks={100}
      />
    </div>
  );
}
