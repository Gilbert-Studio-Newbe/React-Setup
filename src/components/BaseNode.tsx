import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

// Base interface that can be extended by specific node types
export interface BaseNodeData {
  label?: string;
  value?: number | string;
  outputValue?: number | string;
  [key: string]: unknown;  // Allow additional properties
}

interface BaseNodeProps<T extends BaseNodeData> extends NodeProps<T> {
  children?: React.ReactNode;
  error?: string;
  handles?: {
    inputs?: Array<{
      id: string;
      position?: number;
      style?: React.CSSProperties;
    }>;
    outputs?: Array<{
      id: string;
      position?: number;
      style?: React.CSSProperties;
    }>;
  };
}

export const BaseNode = <T extends BaseNodeData>({ 
  data,
  isConnectable,
  children,
  error,
  handles = {
    inputs: [{ id: 'input', position: 50 }],
    outputs: [{ id: 'output', position: 50 }]
  }
}: BaseNodeProps<T>) => {
  return (
    <div className={`
      relative p-4 rounded-lg border-2 
      ${error ? 'border-red-400' : 'border-gray-300'} 
      bg-white dark:bg-gray-800 
      shadow-md w-[280px] 
      transition-all duration-200 
      hover:shadow-lg
      ${error ? 'dark:border-red-600' : 'dark:border-gray-600'}
    `}>
      {/* Title */}
      <div className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
        {data?.label || 'Base'}
      </div>

      {/* Content */}
      {children}

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-2 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Input Handles */}
      {handles.inputs?.map((input, index) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          style={{ 
            top: `${input.position || (((index + 1) / (handles.inputs?.length || 1)) * 100)}%`,
            background: '#6366f1',
            width: '10px',
            height: '10px',
            border: '2px solid #6366f1',
            ...input.style
          }}
          isConnectable={isConnectable}
        />
      ))}

      {/* Output Handles */}
      {handles.outputs?.map((output, index) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          style={{ 
            top: `${output.position || (((index + 1) / (handles.outputs?.length || 1)) * 100)}%`,
            background: error ? '#ef4444' : '#f59e0b',
            width: '10px',
            height: '10px',
            border: error ? '2px solid #ef4444' : '2px solid #f59e0b',
            transition: 'all 0.2s',
            ...output.style
          }}
          isConnectable={isConnectable}
        />
      ))}
    </div>
  );
};

export default React.memo(BaseNode); 