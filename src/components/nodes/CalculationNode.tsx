'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { NodeProps, useReactFlow, useNodes, useEdges, Handle, Position } from '@xyflow/react';
import BaseNode, { BaseNodeData } from './BaseNode';

// Define a proper interface for the CalculationNodeData
interface CalculationNodeData extends BaseNodeData {
  input1?: number;
  input2?: number;
  operation?: 'add' | 'subtract' | 'multiply' | 'divide';
  result?: number;
  hasDollarSign?: boolean;
  customName?: string;
  isExpanded?: boolean;
  numericOutputValue?: number;
}

// Define default data for the node
const defaultData: CalculationNodeData = {
  label: 'Calculate',
  input1: 0,
  input2: 0,
  operation: 'add',
  result: 0,
  outputValue: 0,
  hasDollarSign: false,
  customName: '',
  isExpanded: false
};

// Define the component with proper type annotations
const CalculationNode = (props: NodeProps) => {
  const { data, isConnectable, id } = props;
  
  // Safely cast data to our expected type with defaults
  const nodeData: CalculationNodeData = { ...defaultData, ...(data as CalculationNodeData || {}) };
  
  const { setNodes } = useReactFlow();
  const nodes = useNodes();
  const edges = useEdges();

  // Initialize state with values from nodeData
  const [input1, setInput1] = useState<number>(nodeData.input1 ?? 0);
  const [input2, setInput2] = useState<number>(nodeData.input2 ?? 0);
  const [operation, setOperation] = useState<'add' | 'subtract' | 'multiply' | 'divide'>(
    nodeData.operation ?? 'add'
  );
  const [result, setResult] = useState<number | string>(nodeData.result ?? 0);
  const [error, setError] = useState<string>('');
  const [hasDollarSign, setHasDollarSign] = useState<boolean>(nodeData.hasDollarSign ?? false);
  const [customName, setCustomName] = useState<string>(nodeData.customName ?? '');
  const [isExpanded, setIsExpanded] = useState<boolean>(nodeData.isExpanded ?? false);
  
  // Track if we're currently processing an update to prevent loops
  const processingUpdate = React.useRef(false);

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
    
    // Format the result with dollar sign if needed
    const formattedResult = hasDollarSign 
      ? `$${roundedResult.toFixed(2)}` 
      : roundedResult;
    
    setResult(formattedResult);

    // Update node data with new result
    setNodes(nds => 
      nds.map(node => {
        if (node.id === id) {
          // Store both the numeric result and the formatted result
          const formattedOutput = hasDollarSign ? `$${roundedResult.toFixed(2)}` : roundedResult;
          
          const newData = {
            ...node.data,
            result: roundedResult,
            // Always use the formatted result as the outputValue to ensure consistency
            outputValue: formattedOutput,
            // Add a numeric output value for nodes that need a number
            numericOutputValue: roundedResult,
            input1,
            input2,
            operation,
            hasDollarSign,
            customName,
            isExpanded
          };
          return {
            ...node,
            data: newData
          };
        }
        return node;
      })
    );
  }, [input1, input2, operation, id, setNodes, hasDollarSign, customName, isExpanded]);

  // Handle incoming connections and updates
  useEffect(() => {
    if (!id || processingUpdate.current) return;
    
    processingUpdate.current = true;
    
    try {
      // Find all edges that connect to this node
      const incomingEdges = edges.filter(edge => edge.target === id);

      // Reset inputs that have no connected edges
      const hasInput1Connection = incomingEdges.some(edge => edge.targetHandle === 'input1');
      const hasInput2Connection = incomingEdges.some(edge => edge.targetHandle === 'input2');

      // Track if we need to update state
      let newInput1 = input1;
      let newInput2 = input2;
      let input1Changed = false;
      let input2Changed = false;
      let newHasDollarSign = hasDollarSign;

      if (!hasInput1Connection && input1 !== 0) {
        newInput1 = 0;
        input1Changed = true;
      }
      
      if (!hasInput2Connection && input2 !== 0) {
        newInput2 = 0;
        input2Changed = true;
      }

      // Process each incoming connection
      incomingEdges.forEach(edge => {
        const sourceNode = nodes.find(node => node.id === edge.source);
        if (!sourceNode?.data) return;

        // Get the value from the source node with type checking
        let value: number = 0;
        let sourceHasDollarSign = false;
        
        // Safely cast the node data to a record type for property access
        const nodeData = sourceNode.data as Record<string, unknown>;
        
        // Check if source has dollar sign in its output
        if (typeof nodeData.outputValue === 'string' && nodeData.outputValue.includes('$')) {
          sourceHasDollarSign = true;
        }
        
        // First check for numeric output value (from MaterialCostNode)
        if (typeof nodeData.numericOutputValue === 'number') {
          value = nodeData.numericOutputValue;
          console.log('Using numeric output value:', value);
          
          // If this is a material cost node, check if it has a dollar sign
          if (sourceNode.type === 'materialcost') {
            sourceHasDollarSign = true;
          }
        }
        // Check for dimension output value (from JsonParameterFormatterNode)
        else if (typeof nodeData.dimensionOutputValue === 'number') {
          value = nodeData.dimensionOutputValue;
          console.log('Using dimension output value:', value);
        } 
        else if (typeof nodeData.value === 'number') {
          value = nodeData.value;
        } 
        else if (typeof nodeData.outputValue === 'number') {
          value = nodeData.outputValue;
        } 
        else if (typeof nodeData.result === 'number') {
          value = nodeData.result;
        } 
        else if (typeof nodeData.value === 'string' || typeof nodeData.outputValue === 'string') {
          // Try to extract numeric part from string (e.g. "$4.09" -> 4.09)
          const stringValue = (typeof nodeData.value === 'string') ? nodeData.value : String(nodeData.outputValue);
          
          // Check if the string has a dollar sign
          if (stringValue.includes('$')) {
            sourceHasDollarSign = true;
          }
          
          const numericMatch = stringValue.match(/[-+]?[0-9]*\.?[0-9]+/);
          if (numericMatch) {
            const parsed = parseFloat(numericMatch[0]);
            if (!isNaN(parsed)) {
              value = parsed;
              console.log('Extracted numeric value from string:', value, 'from', stringValue);
            }
          }
        }

        // Update the appropriate input based on the target handle
        if (edge.targetHandle === 'input1') {
          // Use small epsilon for floating point comparison
          if (Math.abs(value - newInput1) > 0.0001) {
            newInput1 = value;
            input1Changed = true;
            
            // If this is the first input and it has a dollar sign, set the flag
            if (sourceHasDollarSign) {
              newHasDollarSign = true;
            }
          }
        } else if (edge.targetHandle === 'input2') {
          // Use small epsilon for floating point comparison
          if (Math.abs(value - newInput2) > 0.0001) {
            newInput2 = value;
            input2Changed = true;
            
            // If this is the second input and it has a dollar sign, set the flag
            if (sourceHasDollarSign) {
              newHasDollarSign = true;
            }
          }
        }
      });

      // Only update state if values have changed
      if (input1Changed) {
        setInput1(newInput1);
      }
      if (input2Changed) {
        setInput2(newInput2);
      }
      if (newHasDollarSign !== hasDollarSign) {
        setHasDollarSign(newHasDollarSign);
      }
    } finally {
      processingUpdate.current = false;
    }
  }, [edges, nodes, id, input1, input2, hasDollarSign]);

  // Recalculate when inputs or operation changes
  useEffect(() => {
    if (!processingUpdate.current) {
      calculateResult();
    }
  }, [input1, input2, operation, hasDollarSign, calculateResult]);

  // Operation symbol mapping
  const operationSymbols: Record<string, string> = {
    add: '+',
    subtract: '-',
    multiply: '×',
    divide: '÷'
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Update node data
    if (id) {
      setNodes(nds => 
        nds.map(node => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                isExpanded: newExpandedState
              }
            };
          }
          return node;
        })
      );
    }
  };

  // Get display name (custom name or default label)
  const displayName = customName || nodeData.label || 'Calculate';

  // Format the display result with dollar sign if needed
  const displayResult = typeof result === 'number' 
    ? (hasDollarSign ? `$${result.toFixed(2)}` : result.toLocaleString()) 
    : result;

  // Log the current output value for debugging
  useEffect(() => {
    console.log('Calculator node output:', {
      id,
      result,
      displayResult,
      hasDollarSign,
      outputValue: hasDollarSign ? `$${(typeof result === 'number' ? result : 0).toFixed(2)}` : result
    });
  }, [id, result, displayResult, hasDollarSign]);

  return (
    <div className="relative p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-md" style={{ minWidth: '280px', width: 'auto', minHeight: '120px' }}>
      {/* Title */}
      <div className="mb-2 flex justify-between items-center">
        <div className="text-md font-semibold text-gray-800 dark:text-gray-200">
          {displayName}
        </div>
        <button 
          onClick={toggleExpanded}
          className="p-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      
      {/* Custom Name Input - Only show when expanded */}
      {isExpanded && (
        <div className="mb-4">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Custom Name:
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-gray-200 nodrag"
            value={customName}
            onChange={(e) => {
              const newName = e.target.value;
              setCustomName(newName);
              
              // Update node data immediately when custom name changes
              if (id) {
                setNodes(nds => 
                  nds.map(node => {
                    if (node.id === id) {
                      return {
                        ...node,
                        data: {
                          ...node.data,
                          customName: newName
                        }
                      };
                    }
                    return node;
                  })
                );
              }
            }}
            placeholder="Enter a custom name"
          />
        </div>
      )}

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
      <div className="mb-2 space-y-1">
        <div className="flex justify-between items-center p-1 bg-gray-50 dark:bg-gray-700 rounded-md">
          <span className="text-xs text-gray-600 dark:text-gray-300">Input 1:</span>
          <span className="font-mono text-sm text-gray-800 dark:text-gray-200">
            {hasDollarSign ? `$${input1.toFixed(2)}` : input1}
          </span>
        </div>
      </div>

      {/* Result Display */}
      <div className={`
        p-2 rounded-md mb-2
        ${error ? 'bg-red-50 dark:bg-red-900/30' : 'bg-blue-50 dark:bg-blue-900/30'} 
        border 
        ${error ? 'border-red-200 dark:border-red-800' : 'border-blue-200 dark:border-blue-800'}
      `}>
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Result:</span>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {operationSymbols[operation]}
            </span>
            <span className={`
              font-mono font-bold text-sm
              ${error ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}
            `}>
              {displayResult}
            </span>
          </div>
        </div>
      </div>
      
      {/* Input 2 Display - Moved to bottom */}
      <div className="space-y-1">
        <div className="flex justify-between items-center p-1 bg-gray-50 dark:bg-gray-700 rounded-md">
          <span className="text-xs text-gray-600 dark:text-gray-300">Input 2:</span>
          <span className="font-mono text-sm text-gray-800 dark:text-gray-200">
            {hasDollarSign ? `$${input2.toFixed(2)}` : input2}
          </span>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mt-1 p-1 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {/* Input Handles - Using React Flow's Handle component */}
      <Handle
        type="target"
        position={Position.Left}
        id="input1"
        style={{ 
          background: '#6366f1',
          width: '10px',
          height: '10px',
          border: '2px solid #6366f1',
          top: '50%'
        }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="target"
        position={Position.Bottom}
        id="input2"
        style={{ 
          background: '#6366f1',
          width: '10px',
          height: '10px',
          border: '2px solid #6366f1',
          left: '50%'
        }}
        isConnectable={isConnectable}
      />
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ 
          background: error ? '#ef4444' : '#f59e0b',
          width: '10px',
          height: '10px',
          border: error ? '2px solid #ef4444' : '2px solid #f59e0b',
          top: '50%'
        }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default React.memo(CalculationNode); 