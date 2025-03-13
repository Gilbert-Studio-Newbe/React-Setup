'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface ResultNodeData {
  label?: string;
  value?: number | string;
  unit?: string;
  description?: string;
}

const ResultNode = ({ data, isConnectable }: NodeProps<ResultNodeData>) => {
  const { 
    label = 'Result', 
    value = 0, 
    unit = '', 
    description = ''
  } = data || {};

  // Format the value for display
  const displayValue = typeof value === 'number' 
    ? value.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
    : value;

  return (
    <div className="p-4 rounded-md border-2 border-black bg-white dark:bg-gray-800 shadow-md w-[250px]">
      {/* Title */}
      <div className="mb-3 text-lg font-bold text-black dark:text-white">
        {label}
      </div>
      
      {/* Description (if provided) */}
      {description && (
        <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">
          {description}
        </div>
      )}
      
      {/* Result Display */}
      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md border border-gray-300 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Value:</span>
          <div className="font-mono text-lg font-bold text-black dark:text-white">
            {displayValue}
            {unit && <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">{unit}</span>}
          </div>
        </div>
      </div>
      
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: '#000', 
          width: '10px', 
          height: '10px',
          border: '2px solid #000'
        }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default memo(ResultNode); 