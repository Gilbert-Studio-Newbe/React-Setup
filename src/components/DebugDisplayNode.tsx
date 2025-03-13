'use client';

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface DebugDisplayNodeData {
  label?: string;
  value?: any;
  [key: string]: any;
}

const DebugDisplayNode = ({ data, isConnectable }: NodeProps<DebugDisplayNodeData>) => {
  const { label = 'Debug Display', ...restData } = data || {};
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  
  // Format value for display
  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch (error) {
        return `[Error displaying object: ${error}]`;
      }
    }
    
    return String(value);
  };
  
  // Get the type of a value
  const getType = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };
  
  // Get a color based on the type
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'string': return 'text-green-600 dark:text-green-400';
      case 'number': return 'text-blue-600 dark:text-blue-400';
      case 'boolean': return 'text-purple-600 dark:text-purple-400';
      case 'object': return 'text-orange-600 dark:text-orange-400';
      case 'array': return 'text-yellow-600 dark:text-yellow-400';
      case 'null':
      case 'undefined': return 'text-gray-500 dark:text-gray-400';
      default: return 'text-gray-800 dark:text-gray-200';
    }
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="p-4 rounded-md border-2 border-black bg-white dark:bg-gray-800 shadow-md w-[350px]">
      {/* Title with Expand/Collapse Toggle */}
      <div className="mb-3 flex justify-between items-center">
        <div className="text-lg font-bold text-black dark:text-white">
          {label}
        </div>
        <button 
          onClick={toggleExpanded}
          className="p-1 text-xs bg-gray-200 dark:bg-gray-700 rounded"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      
      {/* Debug Information */}
      {isExpanded && (
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md border border-gray-300 dark:border-gray-600 overflow-auto max-h-[400px]">
          <div className="font-mono text-sm">
            {Object.entries(restData).map(([key, value]) => (
              <div key={key} className="mb-2">
                <div className="font-medium">{key}:</div>
                <div className={`${getTypeColor(getType(value))} ml-2`}>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({getType(value)})
                  </span>
                  <pre className="whitespace-pre-wrap break-words mt-1 bg-gray-200 dark:bg-gray-800 p-2 rounded">
                    {formatValue(value)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
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

export default memo(DebugDisplayNode); 