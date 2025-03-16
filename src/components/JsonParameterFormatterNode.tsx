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
  onSelectParameter?: (index: number, paramId: string | null) => void;
  onToggleConvertToMillimeters?: (index: number) => void;
  onUpdateCustomLabel?: (index: number, label: string) => void;
  isParametersVisible?: boolean;
  toggleParametersVisibility?: () => void;
}

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
  const [isOpen, setIsOpen] = useState(true);
  
  // Get available parameters from jsonData
  const availableParameters = jsonData?.parameters || [];
  
  return (
    <div className="max-h-[300px] overflow-y-auto scrollbar scrollbar-w-2 scrollbar-thumb-rounded-md scrollbar-thumb-gray-400 scrollbar-track-transparent dark:scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500">
      {selectedParameters.map((param, index) => (
        <div key={index} className="mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="font-medium text-sm text-gray-700 dark:text-gray-300">
              Parameter {index + 1}:
            </div>
            
            {/* Convert to mm toggle */}
            {param.paramId && (
              <div className="flex items-center">
                <label className="text-xs text-gray-600 dark:text-gray-400 mr-1">Convert to mm</label>
                <input 
                  type="checkbox" 
                  checked={param.convertToMillimeters || false}
                  onChange={() => onToggleConvertToMillimeters?.(index)}
                  className="form-checkbox h-3 w-3 text-blue-500 rounded focus:ring-blue-400"
                />
              </div>
            )}
          </div>
          
          {/* Parameter selector */}
          <select
            value={param.paramId || ''}
            onChange={(e) => onSelectParameter?.(index, e.target.value || null)}
            className="w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 nodrag"
          >
            <option value="">Select parameter</option>
            {availableParameters.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.valueType})
              </option>
            ))}
          </select>
          
          {/* Custom label input */}
          {param.paramId && (
            <div className="mt-1">
              <input
                type="text"
                placeholder="Custom label (optional)"
                value={param.customLabel || ''}
                onChange={(e) => onUpdateCustomLabel?.(index, e.target.value)}
                className="w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 nodrag"
              />
            </div>
          )}
        </div>
      ))}
      
      {availableParameters.length === 0 && (
        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded border border-yellow-200 dark:border-yellow-800">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            No parameters available. Connect to a JSON source node.
          </div>
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
  const jsonData = nodeData.jsonData || null;
  const selectedParameters = nodeData.selectedParameters || [];
  const isParametersVisible = nodeData.isParametersVisible !== undefined ? nodeData.isParametersVisible : true;
  const toggleParametersVisibility = nodeData.toggleParametersVisibility;
  
  return (
    <div className="relative p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-md" style={{ width: '350px' }}>
      {/* Title with Toggle Button */}
      <div className="mb-3 flex justify-between items-center">
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {label}
        </div>
        
        <button 
          onClick={toggleParametersVisibility}
          className="p-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {isParametersVisible ? 'Hide Parameters' : 'Show Parameters'}
        </button>
      </div>
      
      {/* Content */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-800 mb-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parameter Formatter</div>
        <div className="font-mono text-sm text-blue-600 dark:text-blue-400 break-all">
          {formattedString}
        </div>
      </div>
      
      {/* Parameter Selector - Client-side only and collapsible */}
      {typeof window !== 'undefined' && isParametersVisible && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <ParameterSelector 
            jsonData={jsonData}
            selectedParameters={selectedParameters}
            onSelectParameter={nodeData.onSelectParameter}
            onToggleConvertToMillimeters={nodeData.onToggleConvertToMillimeters}
            onUpdateCustomLabel={nodeData.onUpdateCustomLabel}
          />
        </div>
      )}
      
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
    </div>
  );
};

export default React.memo(JsonParameterFormatterNode); 