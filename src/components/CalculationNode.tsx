'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const isUpdatingRef = useRef(false);
  const prevNodesRef = useRef<string>('');
  
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
    
    // Prevent cascading updates by checking if we're already updating
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    
    // Use setTimeout to break the synchronous update cycle
    setTimeout(() => {
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
      isUpdatingRef.current = false;
    }, 0);
  };
  
  // Calculate the result based on connected nodes
  useEffect(() => {
    // Skip if we're already updating to prevent cascading updates
    if (isUpdatingRef.current) return;
    
    // Stringify nodes to compare with previous state
    const nodesJson = JSON.stringify(nodes.map(n => ({ id: n.id, data: n.data })));
    
    // Only recalculate if nodes have changed
    if (nodesJson === prevNodesRef.current) return;
    prevNodesRef.current = nodesJson;
    
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
    
    // Prevent cascading updates
    isUpdatingRef.current = true;
    
    // Use setTimeout to break the synchronous update cycle
    setTimeout(() => {
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
      isUpdatingRef.current = false;
    }, 0);
  }, [id, operation, getEdges, setNodes, nodes]);
  
  return (
    <div className="p-3 rounded-md border border-[var(--xy-node-border-default)] bg-white dark:bg-gray-800 shadow-[var(--xy-node-boxshadow-default)] w-[200px] font-mono">
      <div className="mb-2 text-base font-medium">{label}</div>
      
      <div className="mb-3">
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Operation</label>
        <select
          value={operation}
          onChange={(e) => updateNodeData(e.target.value as 'add' | 'subtract' | 'multiply' | 'divide')}
          className="w-full p-1 border border-[var(--xy-node-border-default)] rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white nodrag"
        >
          <option value="add">Addition (+)</option>
          <option value="subtract">Subtraction (-)</option>
          <option value="multiply">Multiplication (×)</option>
          <option value="divide">Division (÷)</option>
        </select>
      </div>
      
      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded flex items-center justify-between">
        <span className="text-gray-600 dark:text-gray-300">Result:</span>
        <span className="font-medium">
          {getOperationSymbol(operation)} {result.toFixed(2)}
        </span>
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

export default React.memo(CalculationNode); 