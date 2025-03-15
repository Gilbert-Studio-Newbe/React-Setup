'use client';

import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow, NodeProps } from '@xyflow/react';
import BaseNode, { BaseNodeData } from './BaseNode';

interface NumberInputNodeData extends BaseNodeData {
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
  const [error, setError] = useState<string>('');
  
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
              value: newValue,
              outputValue: newValue
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
    if (isNaN(newValue)) {
      setError('Please enter a valid number');
      return;
    }
    setError('');
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
    <BaseNode<NumberInputNodeData>
      data={{
        ...data,
        label: label
      }}
      isConnectable={true}
      error={error}
      handles={{
        outputs: [
          { 
            id: 'output', 
            position: 50,
            style: { 
              background: '#f59e0b',
              border: '2px solid #f59e0b',
              width: '10px',
              height: '10px'
            }
          }
        ]
      }}
    >
      <div className="flex items-center">
        <button 
          className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-l-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-bold"
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
          className="w-full h-8 px-2 text-center border-y border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 nodrag"
        />
        
        <button 
          className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-r-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-bold"
          onClick={handleIncrement}
        >
          +
        </button>
        
        {unit && (
          <span className="ml-2 text-gray-700 dark:text-gray-300">{unit}</span>
        )}
      </div>
      
      {/* Display current value */}
      <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Value:</span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
            {value}{unit && <span className="ml-1 text-xs">{unit}</span>}
          </span>
        </div>
      </div>
      
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: '#6366f1',
          width: '10px', 
          height: '10px',
          border: '2px solid #6366f1'
        }}
        className="connectionindicator"
      />
    </BaseNode>
  );
};

export default React.memo(NumberInputNode); 