'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { NodeProps, useReactFlow, useNodes, useEdges } from '@xyflow/react';
import BaseNode, { BaseNodeData } from './BaseNode';

interface CalculationNodeData extends BaseNodeData {
  input1?: number;
  input2?: number;
  operation?: 'add' | 'subtract' | 'multiply' | 'divide';
  result?: number;
}

const defaultData: CalculationNodeData = {
  label: 'Calculate',
  input1: 0,
  input2: 0,
  operation: 'add',
  result: 0,
  outputValue: 0
};

const CalculationNode: React.FC<NodeProps<CalculationNodeData>> = ({ data = defaultData, isConnectable, id }) => {
  const { setNodes } = useReactFlow();
  const nodes = useNodes();
  const edges = useEdges();

  // Initialize state with default values or data props
  const [input1, setInput1] = useState<number>(data.input1 ?? 0);
  const [input2, setInput2] = useState<number>(data.input2 ?? 0);
  const [operation, setOperation] = useState<'add' | 'subtract' | 'multiply' | 'divide'>(
    data.operation ?? 'add'
  );
  const [result, setResult] = useState<number | string>(data.result ?? 0);
  const [error, setError] = useState<string>('');

  // Calculate result based on inputs and operation
  const calculateResult = useCallback(() => {
    setError('');
    let calculatedResult: number;

    switch (operation) {
      case 'add':
        calculatedResult = input1 + input2;
        break;
      case 'subtract':
        calculatedResult = input1 - input2;
        break;
      case 'multiply':
        calculatedResult = input1 * input2;
        break;
      case 'divide':
        if (input2 === 0) {
          setError('Cannot divide by zero');
          setResult('Error');
          return;
        }
        calculatedResult = input1 / input2;
        break;
      default:
        calculatedResult = 0;
    }

    // Round to 4 decimal places to avoid floating point issues
    const roundedResult = Math.round(calculatedResult * 10000) / 10000;
    setResult(roundedResult);

    // Update node data with new result
    setNodes(nds => 
      nds.map(node => {
        if (node.id === id) {
          const newData: CalculationNodeData = {
            ...node.data,
            result: roundedResult,
            outputValue: roundedResult,
            input1,
            input2,
            operation
          };
          return {
            ...node,
            data: newData
          };
        }
        return node;
      })
    );
  }, [input1, input2, operation, id, setNodes]);

  // Handle incoming connections and updates
  useEffect(() => {
    if (!id) return;

    // Find all edges that connect to this node
    const incomingEdges = edges.filter(edge => edge.target === id);

    // Reset inputs that have no connected edges
    const hasInput1Connection = incomingEdges.some(edge => edge.targetHandle === 'input1');
    const hasInput2Connection = incomingEdges.some(edge => edge.targetHandle === 'input2');

    if (!hasInput1Connection) {
      setInput1(0);
    }
    if (!hasInput2Connection) {
      setInput2(0);
    }

    // Process each incoming connection
    incomingEdges.forEach(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      if (!sourceNode?.data) return;

      // Get the value from the source node with type checking
      let value: number = 0;
      const nodeData = sourceNode.data as Record<string, unknown>;
      
      if (typeof nodeData.value === 'number') {
        value = nodeData.value;
      } else if (typeof nodeData.outputValue === 'number') {
        value = nodeData.outputValue;
      } else if (typeof nodeData.result === 'number') {
        value = nodeData.result;
      } else if (typeof nodeData.value === 'string') {
        const parsed = parseFloat(nodeData.value);
        if (!isNaN(parsed)) {
          value = parsed;
        }
      }

      // Update the appropriate input based on the target handle
      if (edge.targetHandle === 'input1' && value !== input1) {
        setInput1(value);
      } else if (edge.targetHandle === 'input2' && value !== input2) {
        setInput2(value);
      }
    });
  }, [edges, nodes, id, input1, input2]);

  // Recalculate when inputs or operation changes
  useEffect(() => {
    calculateResult();
  }, [input1, input2, operation, calculateResult]);

  // Operation symbol mapping
  const operationSymbols = {
    add: '+',
    subtract: '-',
    multiply: '×',
    divide: '÷'
  };

  return (
    <BaseNode<CalculationNodeData>
      data={data}
      isConnectable={isConnectable}
      error={error}
      handles={{
        inputs: [
          { 
            id: 'input1', 
            position: 30, 
            style: { 
              background: '#6366f1',
              border: '2px solid #6366f1',
              width: '10px',
              height: '10px'
            } 
          },
          { 
            id: 'input2', 
            position: 70, 
            style: { 
              background: '#6366f1',
              border: '2px solid #6366f1',
              width: '10px',
              height: '10px'
            } 
          }
        ],
        outputs: [
          { 
            id: 'output', 
            position: 50,
            style: { 
              background: error ? '#ef4444' : '#f59e0b',
              border: error ? '2px solid #ef4444' : '2px solid #f59e0b',
              width: '10px',
              height: '10px'
            }
          }
        ]
      }}
    >
      {/* Operation Selector */}
      <div className="mb-4">
        <select
          value={operation}
          onChange={(e) => setOperation(e.target.value as 'add' | 'subtract' | 'multiply' | 'divide')}
          className="
            nodrag
            w-full p-2 rounded-md 
            border border-gray-300 dark:border-gray-600 
            bg-gray-50 dark:bg-gray-700 
            text-gray-800 dark:text-gray-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            hover:border-gray-400 dark:hover:border-gray-500
            cursor-pointer
            appearance-none
            transition-all duration-200
          "
        >
          <option value="add">Addition (+)</option>
          <option value="subtract">Subtraction (-)</option>
          <option value="multiply">Multiplication (×)</option>
          <option value="divide">Division (÷)</option>
        </select>
      </div>

      {/* Input Values Display */}
      <div className="mb-4 space-y-2">
        <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          <span className="text-sm text-gray-600 dark:text-gray-300">Input 1:</span>
          <span className="font-mono text-gray-800 dark:text-gray-200">{input1}</span>
        </div>
        <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          <span className="text-sm text-gray-600 dark:text-gray-300">Input 2:</span>
          <span className="font-mono text-gray-800 dark:text-gray-200">{input2}</span>
        </div>
      </div>

      {/* Result Display */}
      <div className={`
        p-3 rounded-md 
        ${error ? 'bg-red-50 dark:bg-red-900/30' : 'bg-blue-50 dark:bg-blue-900/30'} 
        border 
        ${error ? 'border-red-200 dark:border-red-800' : 'border-blue-200 dark:border-blue-800'}
      `}>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Result:</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {operationSymbols[operation]}
            </span>
            <span className={`
              font-mono font-bold text-lg
              ${error ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}
            `}>
              {typeof result === 'number' ? result.toLocaleString() : result}
            </span>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export default React.memo(CalculationNode); 