'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import BaseNode, { BaseNodeData } from './BaseNode';

interface ResultNodeData extends BaseNodeData {
  value?: number | string;
  unit?: string;
  description?: string;
}

const ResultNode = ({ data, isConnectable, id }: NodeProps<ResultNodeData>) => {
  const { 
    label = 'Result', 
    value = 0, 
    unit = '', 
    description = ''
  } = data || {};

  // Log the received data for debugging
  console.log(`ResultNode ${id} render:`, { value, type: typeof value });

  // Format the value for display
  const displayValue = typeof value === 'number' 
    ? value.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
    : value;

  return (
    <BaseNode<ResultNodeData>
      data={{
        ...data,
        label: label
      }}
      isConnectable={isConnectable}
      handles={{
        inputs: [
          { 
            id: 'input', 
            position: 50, 
            style: { 
              background: '#6366f1',
              border: '2px solid #6366f1',
              width: '10px',
              height: '10px'
            } 
          }
        ]
      }}
    >
      {/* Description (if provided) */}
      {description && (
        <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">
          {description}
        </div>
      )}
      
      {/* Result Display */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-300 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Value:</span>
          <div className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
            {displayValue}
            {unit && <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">{unit}</span>}
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(ResultNode); 