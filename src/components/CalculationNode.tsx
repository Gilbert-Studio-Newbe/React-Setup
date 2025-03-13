'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Handle, Position, useReactFlow, NodeProps, useNodes, useStore } from '@xyflow/react';

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
  
  // Refs for tracking updates and preventing loops
  const { setNodes, getEdges } = useReactFlow();
  const nodes = useNodes();
  const isUpdatingRef = useRef(false);
  const edgeCountRef = useRef<number>(0);
  const prevEdgesMapRef = useRef<Map<string, boolean>>(new Map());
  const operationChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use React Flow's store to directly access edges
  const edges = useStore(state => state.edges);
  
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
  
  // Calculate result based on inputs and operation
  const calculateResult = useCallback((value1: number, value2: number, op: string): number => {
    const num1 = Number(value1);
    const num2 = Number(value2);
    
    switch (op) {
      case 'add':
        return num1 + num2;
      case 'subtract':
        return num1 - num2;
      case 'multiply':
        return num1 * num2;
      case 'divide':
        return num2 !== 0 ? num1 / num2 : 0;
      default:
        return num1 + num2;
    }
  }, []);
  
  // Update node data in React Flow
  const updateNodeData = useCallback((updates: Partial<CalculationNodeData>) => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updates
            }
          };
        }
        return node;
      })
    );
    
    // Reset the updating flag after a short delay
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  }, [id, setNodes]);
  
  // Handle operation change
  const handleOperationChange = useCallback((newOperation: 'add' | 'subtract' | 'multiply' | 'divide') => {
    // Clear any existing timeout
    if (operationChangeTimeoutRef.current) {
      clearTimeout(operationChangeTimeoutRef.current);
    }
    
    // Update the operation state immediately
    setOperation(newOperation);
    
    // Calculate new result with the new operation
    const newResult = calculateResult(input1, input2, newOperation);
    setResult(newResult);
    
    // Update node data with a slight delay to ensure UI updates first
    operationChangeTimeoutRef.current = setTimeout(() => {
      updateNodeData({
        operation: newOperation,
        result: newResult,
        outputValue: newResult
      });
    }, 10);
  }, [calculateResult, input1, input2, updateNodeData]);
  
  // Process connected edges and update inputs
  const processConnectedEdges = useCallback(() => {
    const currentEdges = getEdges();
    const incomingEdges = currentEdges.filter(edge => edge.target === id);
    
    // Track which inputs have been set
    let newInput1 = input1;
    let newInput2 = input2;
    let input1Set = false;
    let input2Set = false;
    
    // Reset inputs if no incoming edges
    const hasInput1Edge = incomingEdges.some(edge => edge.targetHandle === 'input1');
    if (!hasInput1Edge) {
      newInput1 = 0;
      input1Set = true;
    }
    
    const hasInput2Edge = incomingEdges.some(edge => edge.targetHandle === 'input2');
    if (!hasInput2Edge) {
      newInput2 = 0;
      input2Set = true;
    }
    
    // Process each incoming edge
    incomingEdges.forEach(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      if (!sourceNode || !sourceNode.data) return;
      
      const isInput1 = edge.targetHandle === 'input1';
      
      // Extract value from source node
      let rawValue;
      
      if (sourceNode.data.outputValue !== undefined) {
        rawValue = sourceNode.data.outputValue;
      } else if (sourceNode.data.value !== undefined) {
        rawValue = sourceNode.data.value;
      } else if (sourceNode.data.result !== undefined) {
        rawValue = sourceNode.data.result;
      } else {
        rawValue = 0;
      }
      
      // Ensure the value is a number
      let numericValue = Number(rawValue);
      if (isNaN(numericValue)) {
        numericValue = 0;
      }
      
      // Update the appropriate input
      if (isInput1 && !input1Set) {
        newInput1 = numericValue;
        input1Set = true;
      } else if (!isInput1 && !input2Set) {
        newInput2 = numericValue;
        input2Set = true;
      }
    });
    
    // Update inputs and recalculate if they've changed
    if (newInput1 !== input1 || newInput2 !== input2) {
      setInput1(newInput1);
      setInput2(newInput2);
      
      const newResult = calculateResult(newInput1, newInput2, operation);
      setResult(newResult);
      
      updateNodeData({
        input1: newInput1,
        input2: newInput2,
        result: newResult,
        outputValue: newResult
      });
    }
  }, [calculateResult, getEdges, id, input1, input2, nodes, operation, updateNodeData]);
  
  // Monitor edges for changes
  useEffect(() => {
    const relevantEdges = edges.filter(edge => edge.target === id || edge.source === id);
    const currentEdgesMap = new Map();
    
    relevantEdges.forEach(edge => {
      currentEdgesMap.set(edge.id, true);
    });
    
    // Check for deleted edges
    const deletedEdges = [];
    prevEdgesMapRef.current.forEach((_, edgeId) => {
      if (!currentEdgesMap.has(edgeId)) {
        deletedEdges.push(edgeId);
      }
    });
    
    // Process edges if changes detected
    if (deletedEdges.length > 0 || relevantEdges.length !== prevEdgesMapRef.current.size) {
      processConnectedEdges();
    }
    
    // Update previous edges map
    prevEdgesMapRef.current = currentEdgesMap;
    edgeCountRef.current = relevantEdges.length;
    
  }, [edges, id, processConnectedEdges]);
  
  // Update when data changes externally
  useEffect(() => {
    if (isUpdatingRef.current) return;
    
    if (data.input1 !== input1 || data.input2 !== input2 || data.operation !== operation) {
      const newInput1 = data.input1 !== undefined ? Number(data.input1) : input1;
      const newInput2 = data.input2 !== undefined ? Number(data.input2) : input2;
      const newOperation = data.operation || operation;
      
      setInput1(newInput1);
      setInput2(newInput2);
      if (data.operation) setOperation(newOperation);
      
      const newResult = calculateResult(newInput1, newInput2, newOperation);
      setResult(newResult);
      
      updateNodeData({
        input1: newInput1,
        input2: newInput2,
        operation: newOperation,
        result: newResult,
        outputValue: newResult
      });
    }
  }, [data, calculateResult, input1, input2, operation, updateNodeData]);
  
  // Initial processing of edges
  useEffect(() => {
    // Process edges on mount
    processConnectedEdges();
    
    // Set up interval to check for edge changes (fallback)
    const intervalId = setInterval(() => {
      processConnectedEdges();
    }, 500);
    
    return () => {
      clearInterval(intervalId);
      if (operationChangeTimeoutRef.current) {
        clearTimeout(operationChangeTimeoutRef.current);
      }
    };
  }, [processConnectedEdges]);
  
  // Handle UI operation change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOperation = e.target.value as 'add' | 'subtract' | 'multiply' | 'divide';
    handleOperationChange(newOperation);
  };

  // Debug log to verify operation changes
  useEffect(() => {
    console.log(`Operation changed to: ${operation}`);
  }, [operation]);

  return (
    <div className="p-4 rounded-md border-2 border-black bg-white dark:bg-gray-800 shadow-md w-[250px] font-mono dark:border-gray-600">
      <div className="mb-3 text-lg font-bold text-black dark:text-white">{label}</div>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Operation:</label>
        <select
          value={operation}
          onChange={handleSelectChange}
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
          {getOperationSymbol(operation)} {result.toFixed(2)}
        </span>
      </div>
      
      {/* Input 1 Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input1"
        style={{ 
          background: '#3b82f6', // Blue color
          width: '10px', 
          height: '10px',
          border: '2px solid #3b82f6',
          top: '40%'
        }}
        className="connectionindicator"
      />
      
      {/* Input 2 Handle */}
      <Handle
        type="target"
        position={Position.Right}
        id="input2"
        style={{ 
          background: '#10b981', // Green color
          width: '10px', 
          height: '10px',
          border: '2px solid #10b981',
          top: '40%'
        }}
        className="connectionindicator"
      />
      
      {/* Default Target Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: '#000', 
          width: '10px', 
          height: '10px',
          border: '2px solid #000'
        }}
        className="connectionindicator"
      />
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: '#000', 
          width: '10px', 
          height: '10px',
          border: '2px solid #000'
        }}
        className="connectionindicator"
      />
    </div>
  );
};

export default React.memo(CalculationNode); 