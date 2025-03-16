import { useCallback, useEffect } from 'react';
import { Node, Edge, useReactFlow, Connection } from '@xyflow/react';

// Define the types of operations that can be performed
type Operation = 'add' | 'subtract' | 'multiply' | 'divide' | 'none';

// Helper function to perform calculations
const calculateResult = (values: number[], operation: Operation): number => {
  if (!values.length) return 0;
  
  switch (operation) {
    case 'add':
      return values.reduce((sum, value) => sum + value, 0);
    case 'subtract':
      return values.reduce((result, value, index) => 
        index === 0 ? value : result - value, 0);
    case 'multiply':
      return values.reduce((product, value) => product * value, 1);
    case 'divide':
      return values.reduce((result, value, index) => 
        index === 0 ? value : (value !== 0 ? result / value : result), 0);
    default:
      return values[0] || 0;
  }
};

// Custom hook for handling node calculations
export const useNodeCalculations = () => {
  const { getNodes, setNodes, getEdges, getNode } = useReactFlow();

  // Function to get all incoming connections to a node
  const getIncomingConnections = useCallback((nodeId: string) => {
    const edges = getEdges();
    return edges.filter(edge => edge.target === nodeId);
  }, [getEdges]);

  // Function to get the value from a source node
  const getSourceNodeValue = useCallback((sourceId: string): number => {
    const node = getNode(sourceId);
    if (!node) return 0;

    // Different node types store their values differently
    if (node.type === 'numberinput' || node.type === 'costinput') {
      return parseFloat(node.data.value) || 0;
    } else if (node.type === 'calculation') {
      return parseFloat(node.data.result) || 0;
    } else if (node.type === 'result') {
      return parseFloat(node.data.value) || 0;
    } else {
      // For other node types, try to find a value property
      return parseFloat(node.data.value || node.data.result || 0);
    }
  }, [getNode]);

  // Function to update calculation nodes
  const updateCalculations = useCallback(() => {
    const nodes = getNodes();
    const updatedNodes = [...nodes];
    let hasChanges = false;

    // Process calculation nodes
    const calculationNodes = nodes.filter(node => node.type === 'calculation');
    calculationNodes.forEach(node => {
      const incomingConnections = getIncomingConnections(node.id);
      const sourceValues = incomingConnections.map(conn => 
        getSourceNodeValue(conn.source));
      
      const operation = node.data.operation || 'add';
      const result = calculateResult(sourceValues, operation);
      
      // Only update if the result has changed
      if (result !== node.data.result) {
        const nodeIndex = updatedNodes.findIndex(n => n.id === node.id);
        if (nodeIndex !== -1) {
          updatedNodes[nodeIndex] = {
            ...updatedNodes[nodeIndex],
            data: {
              ...updatedNodes[nodeIndex].data,
              result
            }
          };
          hasChanges = true;
        }
      }
    });

    // Process result nodes
    const resultNodes = nodes.filter(node => node.type === 'result');
    resultNodes.forEach(node => {
      const incomingConnections = getIncomingConnections(node.id);
      // For result nodes, we just take the first incoming value
      if (incomingConnections.length > 0) {
        const sourceValue = getSourceNodeValue(incomingConnections[0].source);
        
        // Only update if the value has changed
        if (sourceValue !== node.data.value) {
          const nodeIndex = updatedNodes.findIndex(n => n.id === node.id);
          if (nodeIndex !== -1) {
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              data: {
                ...updatedNodes[nodeIndex].data,
                value: sourceValue
              }
            };
            hasChanges = true;
          }
        }
      }
    });

    // Update nodes if there were changes
    if (hasChanges) {
      setNodes(updatedNodes);
    }
  }, [getNodes, getIncomingConnections, getSourceNodeValue, setNodes]);

  // Function to handle node changes
  const onNodesChange = useCallback((changes: any) => {
    // After nodes change, update calculations
    setTimeout(() => {
      updateCalculations();
    }, 0);
  }, [updateCalculations]);

  // Function to handle edge changes
  const onEdgesChange = useCallback((changes: any) => {
    // After edges change, update calculations
    setTimeout(() => {
      updateCalculations();
    }, 0);
  }, [updateCalculations]);

  // Function to handle new connections
  const onConnect = useCallback((connection: Connection) => {
    // After a new connection is made, update calculations
    setTimeout(() => {
      updateCalculations();
    }, 0);
  }, [updateCalculations]);

  // Run calculations when the hook is first used
  useEffect(() => {
    updateCalculations();
  }, [updateCalculations]);

  return {
    updateCalculations,
    onNodesChange,
    onEdgesChange,
    onConnect
  };
};

export default useNodeCalculations; 