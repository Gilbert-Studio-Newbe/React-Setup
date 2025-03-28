'use client';

import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow, useNodes, useEdges } from '@xyflow/react';
import useIsomorphicLayoutEffect from '../../hooks/useIsomorphicLayoutEffect';

interface DebugDisplayNodeData {
  label?: string;
  value?: any;
  inputs?: Record<string, any>;
  [key: string]: any;
}

// Maximum length for truncated values
const MAX_STRING_LENGTH = 500;
// Maximum length for collapsed view
const MAX_COLLAPSED_LENGTH = 100;

const DebugDisplayNode = ({ data, isConnectable, id }: NodeProps<DebugDisplayNodeData>) => {
  const { label = 'Debug Display', ...restData } = data || {};
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isScrollable, setIsScrollable] = useState<boolean>(false);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Track which values are expanded (for large objects/strings)
  const [expandedValues, setExpandedValues] = useState<Record<string, boolean>>({});
  
  const { setNodes } = useReactFlow();
  const nodes = useNodes();
  const edges = useEdges();
  
  // Set initial selected key when data changes
  useIsomorphicLayoutEffect(() => {
    if (!selectedKey && Object.keys(restData).length > 0) {
      setSelectedKey(Object.keys(restData)[0]);
    }
  }, [restData, selectedKey]);
  
  // Check if content is scrollable
  useIsomorphicLayoutEffect(() => {
    if (contentRef.current) {
      const { scrollHeight, clientHeight } = contentRef.current;
      setIsScrollable(scrollHeight > clientHeight);
    }
  }, [restData, isExpanded, expandedValues, inputs]);
  
  // Collect values from connected nodes
  useIsomorphicLayoutEffect(() => {
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
    try {
      const currentInputsStr = JSON.stringify(inputs);
      const newInputsStr = JSON.stringify(newInputs);
      
      if (currentInputsStr !== newInputsStr) {
        // Only update if there's an actual change
        setInputs(newInputs);
        updateNodeData(newInputs);
      }
    } catch (error) {
      console.error('Error comparing inputs in DebugDisplayNode:', error);
      // Fallback: update anyway
      setInputs(newInputs);
      updateNodeData(newInputs);
    }
    
  }, [id, nodes, edges, setInputs, updateNodeData]);
  
  // Update node data with inputs - memoize this function
  const updateNodeData = useCallback((newInputs: Record<string, any>) => {
    if (!id) return;
    
    // Use a callback to ensure we're not causing unnecessary updates
    setNodes(nodes => {
      // Find the current node
      const currentNode = nodes.find(node => node.id === id);
      if (!currentNode) return nodes;
      
      // Check if the data has actually changed
      try {
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
      } catch (error) {
        console.error('Error comparing node data in DebugDisplayNode:', error);
        // Continue with the update in case of error
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
  }, [id, setNodes]);
  
  // Format value for display
  const formatValue = (value: any, key?: string): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    if (typeof value === 'object') {
      try {
        const stringified = JSON.stringify(value, null, 2);
        
        // If the string is very long and not expanded, truncate it
        if (key && stringified.length > MAX_STRING_LENGTH && !expandedValues[key]) {
          return stringified.substring(0, MAX_STRING_LENGTH) + '...';
        }
        
        return stringified;
      } catch (error) {
        return `[Error displaying object: ${error}]`;
      }
    }
    
    // For long strings, truncate if not expanded
    if (key && typeof value === 'string' && value.length > MAX_STRING_LENGTH && !expandedValues[key]) {
      return value.substring(0, MAX_STRING_LENGTH) + '...';
    }
    
    return String(value);
  };
  
  // Format value for collapsed view (shorter)
  const formatCollapsedValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    if (typeof value === 'object') {
      try {
        const stringified = JSON.stringify(value);
        if (stringified.length > MAX_COLLAPSED_LENGTH) {
          return stringified.substring(0, MAX_COLLAPSED_LENGTH) + '...';
        }
        return stringified;
      } catch (error) {
        return '[Object]';
      }
    }
    
    const strValue = String(value);
    if (strValue.length > MAX_COLLAPSED_LENGTH) {
      return strValue.substring(0, MAX_COLLAPSED_LENGTH) + '...';
    }
    
    return strValue;
  };
  
  // Check if a value should have a "Show More" button
  const shouldShowExpandButton = (value: any, key: string): boolean => {
    if (value === null || value === undefined) return false;
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value).length > MAX_STRING_LENGTH;
      } catch (error) {
        return false;
      }
    }
    
    return typeof value === 'string' && value.length > MAX_STRING_LENGTH;
  };
  
  // Toggle expanded state for a specific value
  const toggleValueExpanded = (key: string) => {
    setExpandedValues(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Get the type of a value
  const getType = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };
  
  // Get color based on type
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'string': return 'text-green-600 dark:text-green-400';
      case 'number': return 'text-blue-600 dark:text-blue-400';
      case 'boolean': return 'text-purple-600 dark:text-purple-400';
      case 'object': return 'text-yellow-600 dark:text-yellow-400';
      case 'array': return 'text-orange-600 dark:text-orange-400';
      case 'null': return 'text-gray-600 dark:text-gray-400';
      case 'undefined': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-800 dark:text-gray-200';
    }
  };
  
  // Toggle expanded/collapsed state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Toggle filter dropdown
  const toggleFilter = () => {
    setFilterOpen(!filterOpen);
  };
  
  // Handle filter selection
  const handleFilterSelect = (key: string) => {
    setSelectedKey(key);
    setFilterOpen(false);
    
    // Scroll to the selected key if expanded
    if (isExpanded && contentRef.current) {
      setTimeout(() => {
        const element = document.getElementById(`debug-key-${key}`);
        if (element) {
          contentRef.current?.scrollTo({
            top: element.offsetTop - 10,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };
  
  // Get the currently selected value
  const getSelectedValue = () => {
    return selectedKey ? restData[selectedKey] : undefined;
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
              <pre className="whitespace-pre-wrap break-words mt-1 bg-gray-200 dark:bg-gray-800 p-2 rounded 
                overflow-x-auto scrollbar scrollbar-w-2 scrollbar-thumb-rounded-md
                scrollbar-thumb-gray-400 scrollbar-track-transparent
                dark:scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500">
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
        
        <div className="flex items-center space-x-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={toggleFilter}
              className="p-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center"
            >
              <span className="mr-1">{selectedKey || 'Select'}</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {filterOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg z-10 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent dark:scrollbar-thumb-gray-600">
                {Object.keys(restData).map(key => (
                  <button
                    key={key}
                    onClick={() => handleFilterSelect(key)}
                    className={`
                      w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                      ${key === selectedKey ? 'bg-gray-200 dark:bg-gray-600' : ''}
                    `}
                  >
                    {key}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={toggleExpanded}
            className="p-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>
      
      {/* Selected Value Display (when collapsed) */}
      {!isExpanded && selectedKey && (
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md border border-gray-300 dark:border-gray-600">
          <div className="font-medium mb-1">{selectedKey}:</div>
          <div className={`${getTypeColor(getType(getSelectedValue()))} font-mono text-sm`}>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({getType(getSelectedValue())})
            </span>
            <pre className="whitespace-pre-wrap break-words mt-1 bg-gray-200 dark:bg-gray-800 p-2 rounded overflow-x-auto">
              {formatCollapsedValue(getSelectedValue())}
            </pre>
          </div>
        </div>
      )}
      
      {/* Debug Information (when expanded) */}
      {isExpanded && (
        <div className="relative">
          {/* Main Content Area with enhanced Tailwind scrollbar */}
          <div 
            ref={contentRef}
            className={`
              bg-gray-100 dark:bg-gray-700 p-3 rounded-md border border-gray-300 dark:border-gray-600 
              overflow-y-auto max-h-[500px] w-full
              scrollbar scrollbar-w-2 scrollbar-thumb-rounded-md
              scrollbar-thumb-gray-400 scrollbar-track-gray-200 
              dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800
              hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500
              focus:scrollbar-thumb-gray-500 dark:focus:scrollbar-thumb-gray-500
              active:scrollbar-thumb-gray-600 dark:active:scrollbar-thumb-gray-400
              transition-all duration-200
              ${isScrollable ? 'shadow-inner' : ''}
            `}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="font-mono text-sm">
              {/* Display connected inputs first */}
              {renderInputs()}
              
              {/* Display other node data */}
              <div className="font-medium mb-2 text-black dark:text-white">Node Data:</div>
              {Object.entries(restData)
                .filter(([key]) => key !== 'inputs') // Skip inputs as we display them separately
                .map(([key, value]) => (
                  <div 
                    key={key} 
                    className={`mb-4 ${key === selectedKey ? 'ring-2 ring-blue-500 dark:ring-blue-400 rounded' : ''}`}
                    id={`debug-key-${key}`}
                  >
                    <div className="font-medium sticky top-0 bg-gray-100 dark:bg-gray-700 py-1 z-10 border-b border-gray-300 dark:border-gray-600">
                      {key}:
                    </div>
                    <div className={`${getTypeColor(getType(value))} ml-2 mt-1`}>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({getType(value)})
                      </span>
                      <pre 
                        className="whitespace-pre-wrap break-words mt-1 bg-gray-200 dark:bg-gray-800 p-2 rounded 
                          overflow-x-auto scrollbar scrollbar-w-2 scrollbar-thumb-rounded-md
                          scrollbar-thumb-gray-400 scrollbar-track-transparent
                          dark:scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500"
                      >
                        {formatValue(value, key)}
                      </pre>
                      
                      {/* Show More/Less button for large values */}
                      {shouldShowExpandButton(value, key) && (
                        <button
                          onClick={() => toggleValueExpanded(key)}
                          className="mt-1 text-xs bg-gray-300 dark:bg-gray-600 px-2 py-1 rounded
                            hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                        >
                          {expandedValues[key] ? 'Show Less' : 'Show More'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
            
            {/* Scroll indicator - only show if content is actually scrollable */}
            {isScrollable && (
              <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2 border-t border-gray-300 dark:border-gray-600 pt-2 animate-pulse">
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Scroll for more content
                </div>
              </div>
            )}
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
        className="connectionindicator"
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default memo(DebugDisplayNode); 