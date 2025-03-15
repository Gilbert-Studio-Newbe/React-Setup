'use client';

import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import BaseNode, { BaseNodeData } from './BaseNode';

interface Parameter {
  id: string;
  name: string;
  value: any;
  valueType: string;
  description?: string;
}

interface JsonData {
  bim_element_id?: string;
  item_name?: string;
  bim_product_id?: string;
  parameters?: Parameter[];
  [key: string]: any;
}

interface JsonLoadNodeData extends BaseNodeData {
  jsonData?: JsonData;
  onJsonLoad?: (data: JsonData) => void;
}

const JsonLoadNode = ({ id, data, isConnectable }: NodeProps<JsonLoadNodeData>) => {
  const { label = 'JSON Load' } = data || {};
  const [jsonData, setJsonData] = useState<JsonData | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [expandedParameter, setExpandedParameter] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setNodes } = useReactFlow();

  // Update the node data when jsonData changes
  useEffect(() => {
    if (jsonData) {
      setNodes(nodes => 
        nodes.map(node => 
          node.id === id 
            ? { ...node, data: { ...node.data, jsonData } }
            : node
        )
      );
    }
  }, [jsonData, id, setNodes]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check if it's a JSON file
      if (!file.name.toLowerCase().endsWith('.json')) {
        setError('Please select a JSON file (.json)');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsedData = JSON.parse(content) as JsonData;
          
          // Update local state
          setJsonData(parsedData);
          setIsLoaded(true);
          setError('');
          
          // Call the onJsonLoad callback if provided
          if (data?.onJsonLoad) {
            data.onJsonLoad(parsedData);
          }
        } catch (error) {
          console.error('Error parsing JSON:', error);
          setError('Invalid JSON file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleParameter = (paramId: string) => {
    if (expandedParameter === paramId) {
      setExpandedParameter(null);
    } else {
      setExpandedParameter(paramId);
    }
  };

  const formatValue = (value: any, type: string): string => {
    if (value === null || value === undefined) return 'null';
    
    switch (type.toLowerCase()) {
      case 'length':
      case 'real number':
        return typeof value === 'number' 
          ? value.toFixed(2) + (type.toLowerCase() === 'length' ? ' mm' : '') 
          : String(value);
      case 'angle':
        return typeof value === 'number' 
          ? `${value.toFixed(4)}°` 
          : String(value);
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  };

  // Hidden file input
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".json"
      onChange={handleFileChange}
      className="hidden"
    />
  );

  return (
    <BaseNode<JsonLoadNodeData>
      data={{
        ...data,
        label: label || 'JSON Load'
      }}
      isConnectable={isConnectable}
      error={error}
      handles={{
        outputs: [
          { 
            id: 'output', 
            position: 50,
            style: { 
              background: '#f59e0b',
              border: '2px solid #f59e0b',
              width: '10px',
              height: '10px'
            }
          }
        ]
      }}
    >
      {/* Hidden file input */}
      {fileInput}
      
      {/* Expand/Collapse Toggle */}
      {isLoaded && jsonData && (
        <div className="mb-3 flex justify-end">
          <button 
            onClick={toggleExpand}
            className="p-1 text-xs bg-gray-200 dark:bg-gray-700 rounded"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      )}
      
      {/* Import Button */}
      <button
        onClick={handleBrowseClick}
        className="w-full mb-3 px-4 py-2 bg-white hover:bg-gray-50 text-black border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 rounded-md shadow transition-all duration-200 text-sm font-medium flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        {isLoaded ? 'Change JSON File' : 'Load JSON File'}
      </button>
      
      {/* JSON Data Display */}
      {isLoaded && jsonData && (
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-300 dark:border-gray-600 max-h-[300px] overflow-y-auto">
          {/* Basic Info */}
          <div className="mb-2">
            {jsonData.bim_element_id && (
              <div className="mb-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Element ID:</span>
                <div className="text-sm text-gray-800 dark:text-gray-200 truncate">
                  {jsonData.bim_element_id}
                </div>
              </div>
            )}
            {jsonData.item_name && (
              <div className="mb-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Item Name:</span>
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  {jsonData.item_name}
                </div>
              </div>
            )}
            {jsonData.bim_product_id && (
              <div className="mb-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Product ID:</span>
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  {jsonData.bim_product_id}
                </div>
              </div>
            )}
          </div>
          
          {/* Parameters */}
          {jsonData.parameters && jsonData.parameters.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Parameters: {jsonData.parameters.length}
              </div>
              
              {isExpanded ? (
                <div className="border border-gray-300 dark:border-gray-600 rounded-md divide-y divide-gray-300 dark:divide-gray-600 bg-white dark:bg-gray-800">
                  {jsonData.parameters.slice(0, isExpanded ? undefined : 5).map((param) => (
                    <div key={param.id} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <div 
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => toggleParameter(param.id)}
                      >
                        <div className="font-medium text-sm text-gray-800 dark:text-gray-200">{param.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{param.valueType}</div>
                      </div>
                      
                      {expandedParameter === param.id && (
                        <div className="mt-1 pl-2 border-l-2 border-gray-300 dark:border-gray-500">
                          {param.description && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {param.description}
                            </div>
                          )}
                          <div className="text-sm mt-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Value: </span>
                            <span className="font-mono text-gray-800 dark:text-gray-200">{formatValue(param.value, param.valueType)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {jsonData.parameters.length} parameters available. Click 'Expand' to view.
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Input Handle - Keep at the top */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: '#6366f1', 
          width: '10px', 
          height: '10px',
          border: '2px solid #6366f1',
          top: '-5px'
        }}
        isConnectable={isConnectable}
      />
    </BaseNode>
  );
};

export default memo(JsonLoadNode); 