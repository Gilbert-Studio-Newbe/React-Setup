import React from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';

// Base interface that can be extended by specific node types
export interface BaseNodeData {
  label?: string;
  value?: number | string;
  outputValue?: number | string;
  [key: string]: unknown;  // Allow additional properties
}

// Use a more specific type for the NodeProps generic parameter
interface BaseNodeProps extends Omit<NodeProps, 'data'> {
  data?: any;
  children?: React.ReactNode;
  error?: string;
  handles?: {
    inputs?: Array<{
      id: string;
      position?: number;
      side?: 'left' | 'right' | 'top' | 'bottom';
      style?: React.CSSProperties;
    }>;
    outputs?: Array<{
      id: string;
      position?: number;
      side?: 'left' | 'right' | 'top' | 'bottom';
      style?: React.CSSProperties;
    }>;
  };
  // Add a nodeSize prop to allow specifying fixed dimensions for different node types
  nodeSize?: {
    width: number;
    height: number;
  };
  // Add titleExtras prop to allow adding elements to the title area
  titleExtras?: React.ReactNode;
}

export const BaseNode = ({ 
  data,
  isConnectable,
  children,
  error,
  handles = {
    inputs: [{ id: 'input', position: 50 }],
    outputs: [{ id: 'output', position: 50 }]
  },
  // Update default node size to be more compact
  nodeSize = { width: 280, height: 120 },
  // Add titleExtras parameter with default value of null
  titleExtras = null
}: BaseNodeProps) => {
  return (
    <div 
      className={`
        relative p-3 rounded-lg border-2 
        ${error ? 'border-red-400' : 'border-gray-300'} 
        bg-white dark:bg-gray-800 
        shadow-md
        transition-all duration-300 
        hover:shadow-lg
        ${error ? 'dark:border-red-600' : 'dark:border-gray-600'}
      `}
      style={{
        width: `${nodeSize.width}px`,
        height: `${nodeSize.height}px`,
        boxSizing: 'border-box',
        transition: 'height 0.3s ease-in-out, width 0.3s ease-in-out',
      }}
    >
      {/* Title - Updated to include titleExtras */}
      <div className="mb-2 flex justify-between items-center">
        <div className="text-md font-semibold text-gray-800 dark:text-gray-200">
          {data?.label || 'Base'}
        </div>
        {titleExtras && (
          <div className="flex items-center">
            {titleExtras}
          </div>
        )}
      </div>

      {/* Content - Adjusted to use available height without fixed max-height */}
      <div className="overflow-auto" style={{ 
        height: `${nodeSize.height - 50}px`,
        transition: 'height 0.3s ease-in-out'
      }}>
        {children}
      </div>

      {/* Error Display - More compact */}
      {error && (
        <div className="mt-1 p-1 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Input Handles */}
      {handles.inputs?.map((input, index) => {
        // Fix for Position indexing using type assertion
        const positionKey = input.side ? 
          (input.side.charAt(0).toUpperCase() + input.side.slice(1)) as keyof typeof Position : 
          'Left';
        const handlePosition = Position[positionKey];
        
        // Calculate the style based on the side
        let style: React.CSSProperties = { 
          background: '#6366f1',
          width: '10px',
          height: '10px',
          border: '2px solid #6366f1',
          ...input.style
        };
        
        // Position the handle based on the side
        if (input.side === 'left' || input.side === undefined) {
          style.top = `${input.position || (((index + 1) / (handles.inputs?.length || 1)) * 100)}%`;
        } else if (input.side === 'right') {
          style.top = `${input.position || (((index + 1) / (handles.inputs?.length || 1)) * 100)}%`;
        } else if (input.side === 'top') {
          style.left = `${input.position || (((index + 1) / (handles.inputs?.length || 1)) * 100)}%`;
        } else if (input.side === 'bottom') {
          style.left = `${input.position || (((index + 1) / (handles.inputs?.length || 1)) * 100)}%`;
        }
        
        return (
          <Handle
            key={input.id}
            type="target"
            position={handlePosition}
            id={input.id}
            style={style}
            isConnectable={isConnectable}
          />
        );
      })}

      {/* Output Handles */}
      {handles.outputs?.map((output, index) => {
        // Fix for Position indexing using type assertion
        const positionKey = output.side ? 
          (output.side.charAt(0).toUpperCase() + output.side.slice(1)) as keyof typeof Position : 
          'Right';
        const handlePosition = Position[positionKey];
        
        // Calculate the style based on the side
        let style: React.CSSProperties = { 
          background: error ? '#ef4444' : '#f59e0b',
          width: '10px',
          height: '10px',
          border: error ? '2px solid #ef4444' : '2px solid #f59e0b',
          transition: 'all 0.2s',
          ...output.style
        };
        
        // Position the handle based on the side
        if (output.side === 'right' || output.side === undefined) {
          style.top = `${output.position || (((index + 1) / (handles.outputs?.length || 1)) * 100)}%`;
        } else if (output.side === 'left') {
          style.top = `${output.position || (((index + 1) / (handles.outputs?.length || 1)) * 100)}%`;
        } else if (output.side === 'top') {
          style.left = `${output.position || (((index + 1) / (handles.outputs?.length || 1)) * 100)}%`;
        } else if (output.side === 'bottom') {
          style.left = `${output.position || (((index + 1) / (handles.outputs?.length || 1)) * 100)}%`;
        }
        
        return (
          <Handle
            key={output.id}
            type="source"
            position={handlePosition}
            id={output.id}
            style={style}
            isConnectable={isConnectable}
          />
        );
      })}
    </div>
  );
};

export default React.memo(BaseNode); 