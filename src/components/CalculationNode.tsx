'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow, NodeProps, useNodes } from '@xyflow/react';

interface CalculationNodeData {
  label?: string;
  operation?: 'add' | 'subtract' | 'multiply' | 'divide';
  input1?: number;
  input2?: number;
  result?: number;
  outputValue?: number;
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
            // Calculate the result with the new operation
            const newResult = calculateResultValue(input1, input2, newOperation);
            
            return {
              ...node,
              data: {
                ...node.data,
                operation: newOperation,
                result: newResult,
                outputValue: newResult
              }
            };
          }
          return node;
        })
      );
      isUpdatingRef.current = false;
    }, 0);
  };
  
  // Helper function to calculate result value without side effects
  const calculateResultValue = (value1: number, value2: number, op: string = operation): number => {
    // Convert inputs to numbers explicitly to handle any type issues
    const num1 = Number(value1);
    const num2 = Number(value2);
    
    console.log('Raw calculation inputs (after Number conversion):', num1, num2, 'Operation:', op);
    
    let calculatedResult = 0;
    
    // Perform calculation based on operation
    switch (op) {
      case 'add':
        calculatedResult = num1 + num2;
        break;
      case 'subtract':
        calculatedResult = num1 - num2;
        break;
      case 'multiply':
        calculatedResult = num1 * num2;
        break;
      case 'divide':
        if (num2 !== 0) {
          calculatedResult = num1 / num2;
        } else {
          console.warn('Division by zero attempted');
          calculatedResult = 0;
        }
        break;
      default:
        // Default to addition if operation is not recognized
        calculatedResult = num1 + num2;
    }
    
    console.log('Raw calculation result:', calculatedResult);
    return calculatedResult;
  };
  
  // Calculate the result based on connected nodes
  useEffect(() => {
    // Skip if we're already updating to prevent cascading updates
    if (isUpdatingRef.current) return;
    
    // Force calculation when data changes directly
    if (data.input1 !== input1 || data.input2 !== input2 || data.operation !== operation) {
      const newInput1 = data.input1 !== undefined ? Number(data.input1) : Number(input1);
      const newInput2 = data.input2 !== undefined ? Number(data.input2) : Number(input2);
      const newOperation = data.operation || operation;
      
      console.log('Data changed directly, new inputs:', newInput1, newInput2, 'Operation:', newOperation);
      
      setInput1(newInput1);
      setInput2(newInput2);
      if (data.operation) setOperation(newOperation);
      
      // Calculate and update result
      calculateResult(newInput1, newInput2, newOperation);
      return;
    }
    
    // Stringify nodes to compare with previous state
    const nodesJson = JSON.stringify(nodes.map(n => ({ id: n.id, data: n.data })));
    
    // Only recalculate if nodes have changed
    if (nodesJson === prevNodesRef.current) return;
    prevNodesRef.current = nodesJson;
    
    const edges = getEdges();
    const incomingEdges = edges.filter(edge => edge.target === id);
    
    if (incomingEdges.length === 0) {
      // No connections, keep current inputs but recalculate result
      calculateResult(input1, input2, operation);
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
      const isInput1 = edge.targetHandle === 'input1';
      
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
      
      // Ensure the value is a number - use Number() directly for consistent conversion
      let numericValue = Number(rawValue);
      
      // If Number() returns NaN, try to extract numeric value from string
      if (isNaN(numericValue) && typeof rawValue === 'string') {
        // Try to extract numeric value from string (remove any units)
        const cleanValue = rawValue.replace(/[^\d.-]/g, '');
        numericValue = parseFloat(cleanValue) || 0;
        console.log('Parsed string value:', rawValue, 'to number:', numericValue);
      }
      
      // If still NaN, use 0
      if (isNaN(numericValue)) {
        numericValue = 0;
        console.log('Value is NaN after parsing, using 0');
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
    
    // Always recalculate the result when this effect runs
    // This ensures the calculation happens even if inputs haven't changed
    console.log('Calling calculateResult with:', newInput1, newInput2, operation);
    calculateResult(newInput1, newInput2, operation);
    
  }, [id, operation, getEdges, setNodes, nodes, data]);
  
  // Calculate result based on inputs and operation
  const calculateResult = (value1: number, value2: number, op: string = operation) => {
    // Convert inputs to numbers explicitly
    const num1 = Number(value1);
    const num2 = Number(value2);
    
    console.log('Calculation inputs after explicit Number conversion:', num1, num2);
    
    // Calculate result
    const calculatedResult = calculateResultValue(num1, num2, op);
    
    console.log(`Calculating ${op} with inputs:`, num1, num2);
    console.log('Final calculation result:', calculatedResult, 'Operation:', op);
    
    // Update local state with the result
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
                input1: num1,
                input2: num2,
                operation: op,
                result: calculatedResult,
                outputValue: calculatedResult // Always set outputValue for connections
              }
            };
          }
          return node;
        })
      );
      isUpdatingRef.current = false;
    }, 0);
  };
  
  // Calculate the current result directly in the render method
  const currentResult = calculateResultValue(input1, input2, operation);
  
  // Log the current result and data for debugging
  console.log(`CalculationNode ${id} render:`, { 
    currentResult, 
    result, 
    input1, 
    input2, 
    operation,
    'data.outputValue': data.outputValue,
    'data.result': data.result
  });
  
  // Ensure the node data is updated with the current result
  useEffect(() => {
    // Skip if we're already updating to prevent cascading updates
    if (isUpdatingRef.current) return;
    
    // Update the node data with the current result
    setNodes(nodes => {
      // First update this node
      const updatedNodes = nodes.map(node => {
        if (node.id === id && node.data.result !== currentResult) {
          console.log('Updating node data with current result:', currentResult);
          return {
            ...node,
            data: {
              ...node.data,
              result: currentResult,
              outputValue: currentResult // Ensure outputValue is set for connections
            }
          };
        }
        return node;
      });
      
      // Then find any connected result nodes and update them
      const edges = getEdges();
      const outgoingEdges = edges.filter(edge => edge.source === id);
      
      if (outgoingEdges.length > 0) {
        console.log('Found outgoing edges from calculation node:', outgoingEdges);
        
        return updatedNodes.map(node => {
          // Check if this node is connected to our calculation node
          const connection = outgoingEdges.find(edge => edge.target === node.id);
          if (connection && node.type === 'result') {
            console.log('Updating connected result node with value:', currentResult);
            return {
              ...node,
              data: {
                ...node.data,
                value: currentResult
              }
            };
          }
          return node;
        });
      }
      
      return updatedNodes;
    });
  }, [currentResult, id, setNodes, getEdges]);

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
      
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Input 1:</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{input1}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Input 2:</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{input2}</span>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600 flex items-center justify-between">
        <span className="text-gray-700 dark:text-gray-300 font-medium">Result:</span>
        <span className="font-bold text-black dark:text-white">
          {getOperationSymbol(operation)} {currentResult.toFixed(2)}
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