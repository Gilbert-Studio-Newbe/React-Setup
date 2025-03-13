'use client';

import React from 'react';
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  getBezierPath, 
  getSmoothStepPath, 
  getStraightPath
} from '@xyflow/react';

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

    // Use the appropriate path function based on the edge type
    const edgeType = data?.type || 'default';
    
    switch (edgeType) {
      case 'straight':
        return getStraightPath(pathParams);
      case 'step':
      case 'smoothstep':
        return getSmoothStepPath({
          ...pathParams,
          borderRadius: 8, // Add rounded corners
        });
      case 'default':
      default:
        return getBezierPath(pathParams);
    }
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