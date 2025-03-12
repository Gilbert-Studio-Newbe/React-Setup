'use client';

import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

interface StyledEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  style?: React.CSSProperties;
  markerEnd?: string;
  label?: string;
  data?: {
    type?: 'default' | 'straight' | 'step' | 'smoothstep';
    color?: string;
    strokeWidth?: number;
    animated?: boolean;
  };
}

export default function StyledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
}: StyledEdgeProps) {
  // Get path based on edge type
  const getPath = () => {
    const pathParams = {
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    };

    // For now, we'll just use bezier paths for all types
    // since the other path functions aren't exported by @xyflow/react
    return getBezierPath(pathParams);
  };

  const [edgePath, labelX, labelY] = getPath();
  
  // Default styles
  const color = data?.color || '#888';
  const strokeWidth = data?.strokeWidth || 1.5;
  const animated = data?.animated || false;

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          stroke: color,
          strokeWidth,
          strokeDasharray: animated ? '5,5' : 'none',
          animation: animated ? 'dashdraw 0.5s linear infinite' : 'none',
        }} 
      />
      
      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-none transform-origin-center nodrag nopan bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              color,
              border: `1px solid ${color}`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
      
      <style jsx global>{`
        @keyframes dashdraw {
          from {
            stroke-dashoffset: 10;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  );
} 