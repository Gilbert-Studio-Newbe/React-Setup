'use client';

import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

// Define interfaces
interface Parameter {
  id: string;
  name: string;
  value: any;
  valueType: string;
  description?: string;
}

interface JsonData {
  parameters?: Parameter[];
  [key: string]: any;
}

interface SelectedParameter {
  paramId: string | null;
  order: number;
  customLabel?: string;
  convertToMillimeters?: boolean;
}

interface JsonParameterFormatterNodeData {
  label?: string;
  jsonData?: JsonData | null;
  selectedParameters?: SelectedParameter[];
  formatTemplate?: string;
  trimWhitespace?: boolean;
  handleNullValues?: 'ignore' | 'skip';
  formattedString?: string;
  outputValue?: string;
  dimensionValue?: number;
  dimensionOutputMode?: 'raw' | 'formatted' | 'withUnits';
  onOutputModeChange?: (mode: string) => void;
  onSelectParameter?: (index: number, paramId: string | null) => void;
  onToggleConvertToMillimeters?: (index: number) => void;
  onUpdateCustomLabel?: (index: number, label: string) => void;
}

// Process dimension value based on output mode - with improved error handling
const processDimensionValue = (value: number | undefined | null, mode: string = 'raw') => {
  // Handle undefined, null, or NaN values
  if (value === undefined || value === null || isNaN(Number(value))) {
    return 'N/A';
  }
  
  // Convert to number to ensure we're working with a numeric value
  const numValue = Number(value);
  
  try {
    switch (mode) {
      case 'raw':
        return numValue.toString();
      case 'formatted':
        return numValue.toFixed(2);
      case 'withUnits':
        return `${numValue.toFixed(2)} mm`;
      default:
        return numValue.toString();
    }
  } catch (error) {
    console.error('Error processing dimension value:', error);
    return 'Error';
  }
};

// Parameter Selection UI - Client-side only component
const ParameterSelector = ({ 
  jsonData, 
  selectedParameters = [],
  onSelectParameter,
  onToggleConvertToMillimeters,
  onUpdateCustomLabel
}: { 
  jsonData: JsonData | null;
  selectedParameters: SelectedParameter[];
  onSelectParameter?: (index: number, paramId: string | null) => void;
  onToggleConvertToMillimeters?: (index: number) => void;
  onUpdateCustomLabel?: (index: number, label: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Only render on client side
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return null;
  }
  
  return (
    <div className="mt-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 nodrag"
      >
        {isOpen ? 'Hide Parameters' : 'Configure Parameters'}
      </button>
      
      {isOpen && (
        <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-md max-h-40 overflow-y-auto">
          {selectedParameters.map((param, index) => (
            <div key={index} className="mb-2 p-1 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Parameter {index + 1}:</span>
                <select 
                  value={param.paramId || ''}
                  onChange={(e) => onSelectParameter?.(index, e.target.value || null)}
                  className="text-xs p-1 border rounded nodrag"
                >
                  <option value="">Select parameter</option>
                  {jsonData?.parameters?.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.description || p.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {param.paramId && (
                <>
                  <div className="flex items-center mb-1">
                    <span className="text-xs mr-2">Custom Label:</span>
                    <input 
                      type="text"
                      value={param.customLabel || ''}
                      onChange={(e) => onUpdateCustomLabel?.(index, e.target.value)}
                      className="text-xs p-1 border rounded flex-1 nodrag"
                      placeholder="Custom label (optional)"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <label className="flex items-center text-xs">
                      <input 
                        type="checkbox"
                        checked={param.convertToMillimeters || false}
                        onChange={() => onToggleConvertToMillimeters?.(index)}
                        className="mr-1 nodrag"
                      />
                      Convert to mm
                    </label>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {(!jsonData || !jsonData.parameters || jsonData.parameters.length === 0) && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              No parameters available. Connect to a JSON source node.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Component - Static version without useState
const JsonParameterFormatterNode = ({ data, isConnectable }: NodeProps) => {
  // Safely access data with defaults
  const nodeData = data as JsonParameterFormatterNodeData || {};
  const label = nodeData.label || 'Parameter Formatter';
  const formattedString = nodeData.formattedString || 'No output yet';
  const dimensionOutputMode = nodeData.dimensionOutputMode || 'raw';
  const jsonData = nodeData.jsonData || null;
  const selectedParameters = nodeData.selectedParameters || [];
  
  // Handle output mode change
  const handleOutputModeChange = (mode: string) => {
    // Use the callback if available (client-side)
    if (nodeData.onOutputModeChange && typeof window !== 'undefined') {
      nodeData.onOutputModeChange(mode);
    } else {
      // Fallback for server-side rendering
      console.log('Output mode change not handled:', mode);
    }
  };
  
  return (
    <div className="relative p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-md" style={{ width: '400px', minHeight: '280px' }}>
      {/* Title */}
      <div className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
        {label}
      </div>
      
      {/* Content */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-800 mb-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parameter Formatter</div>
        <div className="font-mono text-sm text-blue-600 dark:text-blue-400 break-all">
          {formattedString}
        </div>
      </div>
      
      {/* Parameter Selector - Client-side only */}
      {typeof window !== 'undefined' && (
        <ParameterSelector 
          jsonData={jsonData}
          selectedParameters={selectedParameters}
          onSelectParameter={nodeData.onSelectParameter}
          onToggleConvertToMillimeters={nodeData.onToggleConvertToMillimeters}
          onUpdateCustomLabel={nodeData.onUpdateCustomLabel}
        />
      )}
      
      {/* Dimension Output Mode Selector - Client-side only */}
      <div className="mb-4 mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Dimension Output Mode:
        </label>
        <select
          value={dimensionOutputMode}
          onChange={(e) => handleOutputModeChange(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 nodrag"
        >
          <option value="raw">Raw</option>
          <option value="formatted">Formatted</option>
          <option value="withUnits">With Units</option>
        </select>
      </div>
      
      {/* Dimension Value Display */}
      <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-800">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dimension Output:</span>
          <span className="font-mono text-green-600 dark:text-green-400">
            {processDimensionValue(nodeData.dimensionValue, dimensionOutputMode)}
          </span>
        </div>
      </div>
      
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ 
          background: '#6366f1', 
          width: '10px', 
          height: '10px',
          border: '2px solid #6366f1'
        }}
        isConnectable={isConnectable}
      />
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ 
          background: '#f59e0b', 
          width: '10px', 
          height: '10px',
          border: '2px solid #f59e0b'
        }}
        isConnectable={isConnectable}
      />
      
      {/* Dimension Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="dimension"
        style={{ 
          background: '#10b981', 
          width: '10px', 
          height: '10px',
          border: '2px solid #10b981',
          top: '80%'
        }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default React.memo(JsonParameterFormatterNode); 