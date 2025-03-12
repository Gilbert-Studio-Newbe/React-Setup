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
    <div className={`p-3 rounded-md border ${selected ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 shadow-md w-[250px]`}>
      <div className="mb-2 font-medium text-gray-700 dark:text-gray-300">{label}</div>
      
      {description && (
        <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">{description}</div>
      )}
      
      <div className="flex items-center">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-l-md">
          {currency}
        </div>
        
        <input
          type="number"
          value={value}
          onChange={handleChange}
          step="0.01"
          min="0"
          className="w-full h-8 px-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white nodrag"
        />
        
        <div className="flex-shrink-0 px-2 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded-r-md border-y border-r border-gray-300 dark:border-gray-600">
          {formatCurrency(value)}
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="custom-handle bg-[var(--xy-handle-border-color-default)] rounded-sm w-2 h-1 border-none min-w-[2px] min-h-[2px]"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="custom-handle bg-[var(--xy-handle-border-color-default)] rounded-sm w-2 h-1 border-none min-w-[2px] min-h-[2px]"
      />
    </div>
  );
};

export default React.memo(CostInputNode); 