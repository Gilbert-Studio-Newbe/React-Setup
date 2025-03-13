'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Handle, Position, useReactFlow, NodeProps, useNodes, useOnViewportChange, useStore } from '@xyflow/react';

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
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now()); // Track last update time for forcing refreshes
  
  const { setNodes, getEdges, getNode } = useReactFlow();
  const nodes = useNodes();
  const isUpdatingRef = useRef(false);
  const prevNodesRef = useRef<string>('');
  const prevEdgesRef = useRef<string>('');
  const edgeCountRef = useRef<number>(0);
  const edgeIdsRef = useRef<Set<string>>(new Set());
  
  // Use React Flow's store to directly subscribe to edge changes
  // This ensures we get immediate updates when edges change
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
      // Force a refresh by updating the lastUpdate timestamp
      setLastUpdate(Date.now());
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
  
  // Calculate result based on inputs and operation
  const calculateResult = useCallback((value1: number, value2: number, op: string = operation) => {
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
      // Force a refresh by updating the lastUpdate timestamp
      setLastUpdate(Date.now());
    }, 0);
  }, [id, operation, setNodes]);
  
  // Force refresh on viewport changes to ensure connections are properly updated
  useOnViewportChange({
    onChange: () => {
      // Check if edges have changed
      const edges = getEdges();
      const currentEdgeCount = edges.filter(edge => edge.target === id || edge.source === id).length;
      
      if (currentEdgeCount !== edgeCountRef.current) {
        edgeCountRef.current = currentEdgeCount;
        // Force refresh by updating timestamp
        setLastUpdate(Date.now());
        // Trigger immediate recalculation
        processConnectedEdges();
      }
    }
  });
  
  // Process all connected edges and update inputs accordingly
  const processConnectedEdges = useCallback(() => {
    if (isUpdatingRef.current) return;
    
    const edges = getEdges();
    const incomingEdges = edges.filter(edge => edge.target === id);
    
    // Track which inputs have been set
    let newInput1 = 0; // Default to 0 for disconnected inputs
    let newInput2 = 0; // Default to 0 for disconnected inputs
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
      } else if (sourceNode.data.value !== undefined) {
        rawValue = sourceNode.data.value;
      } else if (sourceNode.data.result !== undefined) {
        rawValue = sourceNode.data.result;
      } else if (sourceNode.data.input1 !== undefined && isInput1) {
        rawValue = sourceNode.data.input1;
      } else if (sourceNode.data.input2 !== undefined && !isInput1) {
        rawValue = sourceNode.data.input2;
      } else {
        rawValue = 0;
      }
      
      // Ensure the value is a number
      let numericValue = Number(rawValue);
      
      // If Number() returns NaN, try to extract numeric value from string
      if (isNaN(numericValue) && typeof rawValue === 'string') {
        const cleanValue = rawValue.replace(/[^\d.-]/g, '');
        numericValue = parseFloat(cleanValue) || 0;
      }
      
      // If still NaN, use 0
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
    
    // Recalculate with updated inputs
    if (newInput1 !== input1 || newInput2 !== input2) {
      console.log(`Recalculating with new inputs: ${newInput1}, ${newInput2}`);
      calculateResult(newInput1, newInput2, operation);
    }
  }, [id, nodes, getEdges, input1, input2, operation, calculateResult]);
  
  // Direct subscription to edge changes from React Flow store
  useEffect(() => {
    // Get current connected edge IDs
    const currentEdgeIds = new Set(
      edges
        .filter(edge => edge.target === id || edge.source === id)
        .map(edge => edge.id)
    );
    
    // Check if edge set has changed
    const hasChanged = 
      currentEdgeIds.size !== edgeIdsRef.current.size || 
      [...currentEdgeIds].some(id => !edgeIdsRef.current.has(id)) ||
      [...edgeIdsRef.current].some(id => !currentEdgeIds.has(id));
    
    if (hasChanged) {
      console.log(`Edge set changed for node ${id}`);
      edgeIdsRef.current = currentEdgeIds;
      
      // Process the new edge configuration immediately
      processConnectedEdges();
    }
  }, [edges, id, processConnectedEdges]);
  
  // Monitor edges for disconnections and refresh the node when a connection is removed
  // This runs on every render to ensure we catch all edge changes
  useEffect(() => {
    const edges = getEdges();
    const edgesJson = JSON.stringify(edges);
    const currentEdgeCount = edges.filter(edge => edge.target === id || edge.source === id).length;
    
    // Update edge count reference
    if (currentEdgeCount !== edgeCountRef.current) {
      edgeCountRef.current = currentEdgeCount;
      console.log(`Edge count changed for node ${id}: ${edgeCountRef.current}`);
    }
    
    // Skip if this is the first render
    if (!prevEdgesRef.current) {
      prevEdgesRef.current = edgesJson;
      return;
    }
    
    // Check if edges have changed
    if (edgesJson !== prevEdgesRef.current) {
      const prevEdges = JSON.parse(prevEdgesRef.current);
      const currentEdges = edges;
      
      // Find edges that were connected to this node but are now removed
      const removedEdges = prevEdges.filter(
        prevEdge => 
          (prevEdge.target === id || prevEdge.source === id) && 
          !currentEdges.some(edge => 
            edge.id === prevEdge.id && 
            edge.source === prevEdge.source && 
            edge.target === prevEdge.target
          )
      );
      
      // Find edges that were added to this node
      const addedEdges = currentEdges.filter(
        currentEdge => 
          (currentEdge.target === id || currentEdge.source === id) && 
          !prevEdges.some(edge => 
            edge.id === currentEdge.id && 
            edge.source === currentEdge.source && 
            edge.target === currentEdge.target
          )
      );
      
      // If any edges connected to this node were removed, refresh the node
      if (removedEdges.length > 0) {
        console.log('Edge disconnected from calculation node, refreshing:', removedEdges);
        
        // Reset inputs if they were connected to the removed edge
        let newInput1 = input1;
        let newInput2 = input2;
        let input1Reset = false;
        let input2Reset = false;
        
        removedEdges.forEach(edge => {
          if (edge.target === id) {
            if (edge.targetHandle === 'input1' && !input1Reset) {
              newInput1 = 0;
              input1Reset = true;
            } else if (edge.targetHandle === 'input2' && !input2Reset) {
              newInput2 = 0;
              input2Reset = true;
            }
          }
        });
        
        // Recalculate with potentially reset inputs
        calculateResult(newInput1, newInput2, operation);
      }
      
      // If any edges were added to this node, process all connections
      if (addedEdges.length > 0) {
        console.log('Edge connected to calculation node, refreshing:', addedEdges);
        processConnectedEdges();
      }
      
      // Update the previous edges reference
      prevEdgesRef.current = edgesJson;
    }
  }, [getEdges, id, input1, input2, operation, calculateResult, lastUpdate, processConnectedEdges]); // Added lastUpdate to ensure this runs frequently
  
  // Additional effect to check for edge changes on every render
  useEffect(() => {
    const edges = getEdges();
    const connectedEdges = edges.filter(edge => edge.target === id || edge.source === id);
    
    // Check if the connected edges have changed
    if (connectedEdges.length !== edgeCountRef.current) {
      console.log(`Connected edges changed for node ${id}: ${connectedEdges.length} (was ${edgeCountRef.current})`);
      edgeCountRef.current = connectedEdges.length;
      
      // Process all connections immediately
      processConnectedEdges();
    }
  }, [getEdges, id, processConnectedEdges]);
  
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
    
    // Process all connections
    processConnectedEdges();
    
  }, [id, operation, getEdges, setNodes, nodes, data, input1, input2, calculateResult, lastUpdate, processConnectedEdges]); // Added lastUpdate to ensure this runs frequently
  
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
    'data.result': data.result,
    'connected edges': edgeCountRef.current
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
  }, [currentResult, id, setNodes, getEdges, lastUpdate]); // Added lastUpdate to ensure this runs frequently

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