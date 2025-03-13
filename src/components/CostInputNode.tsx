'use client';

import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow, NodeProps } from '@xyflow/react';

interface CostInputNodeData {
  label?: string;
  value?: number;
  currency?: string;
  description?: string;
}

const CostInputNode: React.FC<NodeProps<CostInputNodeData>> = ({ id, data, selected }) => {
  // Set default values if not provided
  const label = data.label || 'Cost Input';
  const currency = data.currency || '$';
  const description = data.description || '';
  
  // Local state for the input value
  const [value, setValue] = useState<number>(data.value !== undefined ? data.value : 0);
  const { setNodes } = useReactFlow();
  
  // Format the value as currency
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  // Update the node data when the value changes
  const updateNodeData = (newValue: number) => {
    setValue(newValue);
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              value: newValue
            }
          };
        }
        return node;
      })
    );
  };
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      updateNodeData(newValue);
    }
  };
  
  // Update local state if data.value changes externally
  useEffect(() => {
    if (data.value !== undefined && data.value !== value) {
      setValue(data.value);
    }
  }, [data.value]);
  
  return (
    <div className="p-4 rounded-md border-2 border-black bg-white dark:bg-gray-800 shadow-md w-[250px] font-mono dark:border-gray-600">
      <div className="mb-2 text-lg font-bold text-black dark:text-white">{label}</div>
      
      {description && (
        <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">{description}</div>
      )}
      
      <div className="flex items-center">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-l-md border border-gray-300 dark:border-gray-600 text-black dark:text-white font-medium">
          {currency}
        </div>
        
        <input
          type="number"
          value={value}
          onChange={handleChange}
          step="0.01"
          min="0"
          className="w-full h-10 px-3 border-y border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-400 dark:bg-gray-700 dark:text-white nodrag"
        />
        
        <div className="flex-shrink-0 px-3 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-600 rounded-r-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
          {formatCurrency(value)}
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-4 !bg-black dark:!bg-gray-400 border-none"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-4 !bg-black dark:!bg-gray-400 border-none"
      />
    </div>
  );
};

export default React.memo(CostInputNode); 