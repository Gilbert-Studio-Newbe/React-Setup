'use client';

import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow, NodeProps, useNodes } from '@xyflow/react';

interface CalculationNodeData {
  label?: string;
  operation?: 'add' | 'subtract' | 'multiply' | 'divide';
  result?: number;
}

const CalculationNode: React.FC<NodeProps<CalculationNodeData>> = ({ id, data, selected }) => {
  // Set default values if not provided
  const label = data.label || 'Calculation';
  const [operation, setOperation] = useState<'add' | 'subtract' | 'multiply' | 'divide'>(
    data.operation || 'add'
  );
  const [result, setResult] = useState<number>(data.result || 0);
  
  const { setNodes, getEdges } = useReactFlow();
  const nodes = useNodes();
  
  // Get the operation symbol
  const getOperationSymbol = (op: string): string => {
    switch (op) {
      case 'add': return '+';
      case 'subtract': return '-';
      case 'multiply': return '×';
      case 'divide': return '÷';
      default: return '+';
    }
  };
  
  // Update the node data when the operation changes
  const updateNodeData = (newOperation: 'add' | 'subtract' | 'multiply' | 'divide') => {
    setOperation(newOperation);
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              operation: newOperation
            }
          };
        }
        return node;
      })
    );
  };
  
  // Calculate the result based on connected nodes
  useEffect(() => {
    const edges = getEdges();
    const incomingEdges = edges.filter(edge => edge.target === id);
    
    if (incomingEdges.length === 0) {
      setResult(0);
      return;
    }
    
    // Get values from connected nodes
    const values = incomingEdges.map(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      if (!sourceNode || !sourceNode.data || sourceNode.data.value === undefined) {
        return 0;
      }
      return sourceNode.data.value;
    });
    
    // Calculate result based on operation
    let calculatedResult = values[0] || 0;
    
    if (values.length > 1) {
      for (let i = 1; i < values.length; i++) {
        switch (operation) {
          case 'add':
            calculatedResult += values[i];
            break;
          case 'subtract':
            calculatedResult -= values[i];
            break;
          case 'multiply':
            calculatedResult *= values[i];
            break;
          case 'divide':
            if (values[i] !== 0) {
              calculatedResult /= values[i];
            }
            break;
        }
      }
    }
    
    // Update result
    setResult(calculatedResult);
    
    // Update node data
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              result: calculatedResult
            }
          };
        }
        return node;
      })
    );
  }, [id, operation, nodes, getEdges, setNodes]);
  
  return (
    <div className={`p-3 rounded-md border ${selected ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 shadow-md w-[200px]`}>
      <div className="mb-2 font-medium text-gray-700 dark:text-gray-300">{label}</div>
      
      <div className="mb-3">
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Operation</label>
        <select
          value={operation}
          onChange={(e) => updateNodeData(e.target.value as 'add' | 'subtract' | 'multiply' | 'divide')}
          className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white nodrag"
        >
          <option value="add">Addition (+)</option>
          <option value="subtract">Subtraction (-)</option>
          <option value="multiply">Multiplication (×)</option>
          <option value="divide">Division (÷)</option>
        </select>
      </div>
      
      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded flex items-center justify-between">
        <span className="text-gray-600 dark:text-gray-300">Result:</span>
        <span className="font-mono font-medium">
          {getOperationSymbol(operation)} {result.toFixed(2)}
        </span>
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

export default React.memo(CalculationNode); 