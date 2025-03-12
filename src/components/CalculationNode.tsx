'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow, NodeProps, useNodes } from '@xyflow/react';

interface CalculationNodeData {
  label?: string;
  operation?: 'add' | 'subtract' | 'multiply' | 'divide';
  input1?: number;
  input2?: number;
  result?: number;
}

const CalculationNode: React.FC<NodeProps<CalculationNodeData>> = ({ id, data, selected }) => {
  // Set default values if not provided
  const label = data.label || 'Calculation';
  const [operation, setOperation] = useState<'add' | 'subtract' | 'multiply' | 'divide'>(
    data.operation || 'add'
  );
  const [input1, setInput1] = useState<number>(data.input1 || 0);
  const [input2, setInput2] = useState<number>(data.input2 || 0);
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
      // No connections, keep current inputs but set result to 0
      calculateResult(input1, input2);
      return;
    }
    
    // Track which inputs have been set
    let newInput1 = input1;
    let newInput2 = input2;
    let input1Set = false;
    let input2Set = false;
    
    // Process each incoming edge
    incomingEdges.forEach(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      if (!sourceNode || !sourceNode.data) {
        return;
      }
      
      // Determine which input to update based on the target handle
      const isInput1 = edge.targetHandle === 'input1' || !edge.targetHandle;
      
      // Extract value from source node, checking multiple possible properties
      let rawValue;
      
      // Check for different properties in the source node
      if (sourceNode.data.outputValue !== undefined) {
        rawValue = sourceNode.data.outputValue;
        console.log('Using outputValue:', rawValue, typeof rawValue);
      } else if (sourceNode.data.value !== undefined) {
        rawValue = sourceNode.data.value;
        console.log('Using value:', rawValue, typeof rawValue);
      } else if (sourceNode.data.result !== undefined) {
        rawValue = sourceNode.data.result;
        console.log('Using result:', rawValue, typeof rawValue);
      } else if (sourceNode.data.input1 !== undefined && isInput1) {
        rawValue = sourceNode.data.input1;
        console.log('Using input1:', rawValue, typeof rawValue);
      } else if (sourceNode.data.input2 !== undefined && !isInput1) {
        rawValue = sourceNode.data.input2;
        console.log('Using input2:', rawValue, typeof rawValue);
      } else {
        rawValue = 0;
        console.log('No suitable value found, using 0');
      }
      
      // Ensure the value is a number
      let numericValue: number;
      if (typeof rawValue === 'string') {
        // Try to extract numeric value from string (remove any units)
        const cleanValue = rawValue.replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleanValue);
        numericValue = !isNaN(parsed) ? parsed : 0;
        console.log('Parsed string value:', rawValue, 'to number:', numericValue);
      } else {
        numericValue = typeof rawValue === 'number' ? rawValue : 0;
      }
      
      // Update the appropriate input
      if (isInput1 && !input1Set) {
        newInput1 = numericValue;
        input1Set = true;
        console.log('Setting input1 to:', newInput1);
      } else if (!isInput1 && !input2Set) {
        newInput2 = numericValue;
        input2Set = true;
        console.log('Setting input2 to:', newInput2);
      }
    });
    
    // Update state with new input values
    if (input1Set) setInput1(newInput1);
    if (input2Set) setInput2(newInput2);
    
    // Calculate the result based on inputs and operation
    calculateResult(newInput1, newInput2);
    
  }, [id, operation, getEdges, setNodes, nodes]);
  
  // Calculate result based on inputs and operation
  const calculateResult = (value1: number, value2: number) => {
    let calculatedResult = 0;
    
    console.log(`Calculating ${operation} with inputs:`, value1, value2);
    
    switch (operation) {
      case 'add':
        calculatedResult = value1 + value2;
        break;
      case 'subtract':
        calculatedResult = value1 - value2;
        break;
      case 'multiply':
        calculatedResult = value1 * value2;
        break;
      case 'divide':
        if (value2 !== 0) {
          calculatedResult = value1 / value2;
        } else {
          console.warn('Division by zero attempted');
          calculatedResult = 0;
        }
        break;
    }
    
    console.log('Calculation result:', calculatedResult, 'Operation:', operation);
    
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
                input1: value1,
                input2: value2,
                result: calculatedResult
              }
            };
          }
          return node;
        })
      );
      isUpdatingRef.current = false;
    }, 0);
  };
  
  return (
    <div className="p-4 rounded-md border-2 border-black bg-white dark:bg-gray-800 shadow-md w-[250px] font-mono dark:border-gray-600">
      <div className="mb-3 text-lg font-bold text-black dark:text-white">{label}</div>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Operation:</label>
        <select
          value={operation}
          onChange={(e) => updateNodeData(e.target.value as 'add' | 'subtract' | 'multiply' | 'divide')}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white nodrag focus:ring-1 focus:ring-black dark:focus:ring-gray-400 focus:border-transparent"
        >
          <option value="add">Addition (+)</option>
          <option value="subtract">Subtraction (-)</option>
          <option value="multiply">Multiplication (×)</option>
          <option value="divide">Division (÷)</option>
        </select>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600 flex items-center justify-between">
        <span className="text-gray-700 dark:text-gray-300 font-medium">Result:</span>
        <span className="font-bold text-black dark:text-white">
          {getOperationSymbol(operation)} {result.toFixed(2)}
        </span>
      </div>
      
      {/* Input 1 Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input1"
        className="w-2 h-4 !bg-blue-500 border-none"
        style={{ top: '40%' }}
      />
      
      {/* Input 2 Handle */}
      <Handle
        type="target"
        position={Position.Right}
        id="input2"
        className="w-2 h-4 !bg-green-500 border-none"
        style={{ top: '40%' }}
      />
      
      {/* Default Target Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-4 !bg-black dark:!bg-gray-400 border-none"
      />
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-4 !bg-black dark:!bg-gray-400 border-none"
      />
    </div>
  );
};

export default React.memo(CalculationNode); 