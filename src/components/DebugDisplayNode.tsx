'use client';

import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow, useNodes, useEdges } from '@xyflow/react';

interface DebugDisplayNodeData {
  label?: string;
  value?: any;
  inputs?: Record<string, any>;
  [key: string]: any;
}

const DebugDisplayNode = ({ data, isConnectable, id }: NodeProps<DebugDisplayNodeData>) => {
  const { label = 'Debug Display', ...restData } = data || {};
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  
  const { setNodes } = useReactFlow();
  const nodes = useNodes();
  const edges = useEdges();
  
  // Collect values from connected nodes
  useEffect(() => {
    if (!id) return;
    
    // Find all edges that connect to this node
    const incomingEdges = edges.filter(edge => edge.target === id);
    
    if (incomingEdges.length === 0) {
      // No connections, clear inputs
      if (Object.keys(inputs).length > 0) {
        setInputs({});
        updateNodeData({});
      }
      return;
    }
    
    // Collect values from all connected nodes
    const newInputs: Record<string, any> = {};
    
    incomingEdges.forEach((edge, index) => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      if (!sourceNode || !sourceNode.data) return;
      
      // Generate a key for this input
      const inputKey = `input${index + 1}`;
      
      // Try to get a meaningful name for the source
      const sourceName = sourceNode.data.label || `Node ${edge.source}`;
      
      // Extract value from source node, checking multiple possible properties
      let value;
      
      if (sourceNode.data.outputValue !== undefined) {
        value = sourceNode.data.outputValue;
      } else if (sourceNode.data.value !== undefined) {
        value = sourceNode.data.value;
      } else if (sourceNode.data.result !== undefined) {
        value = sourceNode.data.result;
      } else {
        // If no specific value found, use the entire source node data
        value = { ...sourceNode.data };
      }
      
      // Store both the value and source information
      newInputs[inputKey] = {
        value,
        source: sourceName,
        sourceId: edge.source,
        sourceHandle: edge.sourceHandle
      };
    });
    
    // Check if inputs have actually changed before updating state
    const currentInputsStr = JSON.stringify(inputs);
    const newInputsStr = JSON.stringify(newInputs);
    
    if (currentInputsStr !== newInputsStr) {
      // Only update if there's an actual change
      setInputs(newInputs);
      updateNodeData(newInputs);
    }
    
  // Remove setNodes from the dependency array to prevent infinite updates
  }, [id, nodes, edges]);
  
  // Update node data with inputs
  const updateNodeData = (newInputs: Record<string, any>) => {
    if (!id) return;
    
    // Use a callback to ensure we're not causing unnecessary updates
    setNodes(nodes => {
      // Find the current node
      const currentNode = nodes.find(node => node.id === id);
      if (!currentNode) return nodes;
      
      // Check if the data has actually changed
      const currentInputs = currentNode.data.inputs;
      const currentValue = currentNode.data.value;
      const newValue = Object.values(newInputs)[0]?.value;
      
      if (
        JSON.stringify(currentInputs) === JSON.stringify(newInputs) &&
        JSON.stringify(currentValue) === JSON.stringify(newValue)
      ) {
        // No change, return the original nodes
        return nodes;
      }
      
      // Only update if there's an actual change
      return nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              inputs: newInputs,
              // For backward compatibility, set the first input as the main value
              value: Object.values(newInputs)[0]?.value
            }
          };
        }
        return node;
      });
    });
  };
  
  // Format value for display
  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch (error) {
        return `[Error displaying object: ${error}]`;
      }
    }
    
    return String(value);
  };
  
  // Get the type of a value
  const getType = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };
  
  // Get a color based on the type
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'string': return 'text-green-600 dark:text-green-400';
      case 'number': return 'text-blue-600 dark:text-blue-400';
      case 'boolean': return 'text-purple-600 dark:text-purple-400';
      case 'object': return 'text-orange-600 dark:text-orange-400';
      case 'array': return 'text-yellow-600 dark:text-yellow-400';
      case 'null':
      case 'undefined': return 'text-gray-500 dark:text-gray-400';
      default: return 'text-gray-800 dark:text-gray-200';
    }
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Render inputs section
  const renderInputs = () => {
    if (Object.keys(inputs).length === 0) {
      return (
        <div className="text-gray-500 dark:text-gray-400 italic">
          No inputs connected
        </div>
      );
    }
    
    return (
      <div className="mb-4">
        <div className="font-medium mb-2 text-black dark:text-white">Connected Inputs:</div>
        {Object.entries(inputs).map(([key, inputData]: [string, any]) => (
          <div key={key} className="mb-3 border-l-2 border-blue-500 pl-2">
            <div className="font-medium text-blue-600 dark:text-blue-400">
              {inputData.source} ({inputData.sourceId})
            </div>
            <div className={`${getTypeColor(getType(inputData.value))} ml-2`}>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({getType(inputData.value)})
              </span>
              <pre className="whitespace-pre-wrap break-words mt-1 bg-gray-200 dark:bg-gray-800 p-2 rounded">
                {formatValue(inputData.value)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="p-4 rounded-md border-2 border-black bg-white dark:bg-gray-800 shadow-md w-[350px]">
      {/* Title with Expand/Collapse Toggle */}
      <div className="mb-3 flex justify-between items-center">
        <div className="text-lg font-bold text-black dark:text-white">
          {label}
        </div>
        <button 
          onClick={toggleExpanded}
          className="p-1 text-xs bg-gray-200 dark:bg-gray-700 rounded"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      
      {/* Debug Information */}
      {isExpanded && (
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md border border-gray-300 dark:border-gray-600 overflow-auto max-h-[400px]">
          <div className="font-mono text-sm">
            {/* Display connected inputs first */}
            {renderInputs()}
            
            {/* Display other node data */}
            <div className="font-medium mb-2 text-black dark:text-white">Node Data:</div>
            {Object.entries(restData)
              .filter(([key]) => key !== 'inputs') // Skip inputs as we display them separately
              .map(([key, value]) => (
                <div key={key} className="mb-2">
                  <div className="font-medium">{key}:</div>
                  <div className={`${getTypeColor(getType(value))} ml-2`}>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({getType(value)})
                    </span>
                    <pre className="whitespace-pre-wrap break-words mt-1 bg-gray-200 dark:bg-gray-800 p-2 rounded">
                      {formatValue(value)}
                    </pre>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: '#000', 
          width: '10px', 
          height: '10px',
          border: '2px solid #000'
        }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default memo(DebugDisplayNode); 