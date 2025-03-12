'use client';

import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow, NodeProps } from '@xyflow/react';

interface NumberInputNodeData {
  label?: string;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const NumberInputNode: React.FC<NodeProps<NumberInputNodeData>> = ({ id, data, selected }) => {
  // Set default values if not provided
  const label = data.label || 'Number Input';
  const min = data.min !== undefined ? data.min : 0;
  const max = data.max !== undefined ? data.max : 1000;
  const step = data.step || 1;
  const unit = data.unit || '';
  
  // Local state for the input value
  const [value, setValue] = useState<number>(data.value !== undefined ? data.value : 0);
  const { setNodes } = useReactFlow();
  
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
    updateNodeData(newValue);
  };
  
  // Handle increment/decrement buttons
  const handleIncrement = () => {
    const newValue = Math.min(value + step, max);
    updateNodeData(newValue);
  };
  
  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    updateNodeData(newValue);
  };
  
  // Update local state if data.value changes externally
  useEffect(() => {
    if (data.value !== undefined && data.value !== value) {
      setValue(data.value);
    }
  }, [data.value]);
  
  return (
    <div className="p-3 rounded-md border border-[var(--xy-node-border-default)] bg-white dark:bg-gray-800 shadow-[var(--xy-node-boxshadow-default)] w-[200px] font-mono">
      <div className="mb-2 text-base font-medium">{label}</div>
      
      <div className="flex items-center">
        <button 
          className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-l-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          onClick={handleDecrement}
        >
          -
        </button>
        
        <input
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="w-full h-8 px-2 text-center border-y border-[var(--xy-node-border-default)] focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white nodrag"
        />
        
        <button 
          className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-r-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          onClick={handleIncrement}
        >
          +
        </button>
        
        {unit && (
          <span className="ml-2 text-gray-600 dark:text-gray-400">{unit}</span>
        )}
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-black border-2 border-white rounded-full"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-black border-2 border-white rounded-full"
      />
    </div>
  );
};

export default React.memo(NumberInputNode); 