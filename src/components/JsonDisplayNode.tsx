'use client';

import React, { memo, useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

interface JsonDisplayNodeData extends BaseNodeData {
  jsonData?: JsonData;
  selectedParameter?: string;
  onChange?: (paramId: string, newValue: any) => void;
  outputValue?: any;
  outputMode?: 'raw' | 'formatted' | 'withUnits';
}

const JsonDisplayNode = ({ data, isConnectable, id }: NodeProps<JsonDisplayNodeData>) => {
  const { 
    label = 'JSON Display', 
    jsonData,
    selectedParameter,
    onChange,
    outputMode: initialOutputMode = 'raw'
  } = data || {};
  
  const reactFlowInstance = useReactFlow();
  const { setNodes } = reactFlowInstance;
  const getEdgesRef = useRef(reactFlowInstance.getEdges);
  
  const [localJsonData, setLocalJsonData] = useState<JsonData | null>(null);
  const [filterTerm, setFilterTerm] = useState<string>('');
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [selectedParamId, setSelectedParamId] = useState<string | null>(selectedParameter || null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [outputValue, setOutputValue] = useState<any>(null);
  const [outputMode, setOutputMode] = useState<'raw' | 'formatted' | 'withUnits'>(initialOutputMode);
  const [error, setError] = useState<string>('');
  
  // Helper function to process a value based on the output mode - defined with useCallback before it's used
  const processValueForOutputMode = useCallback((value: any, valueType: string, mode: 'raw' | 'formatted' | 'withUnits'): any => {
    if (value === undefined || value === null) {
      console.log('Warning: Attempting to process undefined or null value');
      return mode === 'raw' ? 0 : '0.00';
    }
    
    let processedValue = value;
    
    // First, ensure we have the raw numeric value if it's a string with units
    if (typeof value === 'string' && valueType && valueType.toLowerCase() !== 'string') {
      // Only try to convert to number if it's not explicitly a string type
      const cleanValue = value.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleanValue);
      if (!isNaN(parsed)) {
        processedValue = parsed;
      }
    }
    
    // Now apply the output mode
    let finalValue;
    switch (mode) {
      case 'raw':
        // For string type, preserve the string value
        if (valueType && valueType.toLowerCase() === 'string') {
          finalValue = value;
        } else {
          // For numeric types, ensure it's a number if possible
          finalValue = typeof processedValue === 'number' ? processedValue : 
                      (typeof processedValue === 'string' ? parseFloat(processedValue) || processedValue : value);
        }
        break;
      case 'formatted':
        // Format the value based on its type (without units)
        if (typeof processedValue === 'number') {
          switch (valueType && valueType.toLowerCase()) {
            case 'length':
            case 'real number':
              finalValue = processedValue.toFixed(2);
              break;
            case 'angle':
              finalValue = processedValue.toFixed(4);
              break;
            default:
              finalValue = processedValue;
          }
        } else {
          // For non-numeric values, just use the original value
          finalValue = value;
        }
        break;
      case 'withUnits':
        // Format with units
        if (typeof processedValue === 'number') {
          switch (valueType && valueType.toLowerCase()) {
            case 'length':
              finalValue = `${processedValue.toFixed(2)} mm`;
              break;
            case 'angle':
              finalValue = `${processedValue.toFixed(4)}°`;
              break;
            case 'real number':
              finalValue = processedValue.toFixed(2);
              break;
            default:
              finalValue = processedValue;
          }
        } else {
          // For non-numeric values, just use the original value
          finalValue = value;
        }
        break;
      default:
        finalValue = value;
    }
    
    return finalValue;
  }, []);
  
  // Helper function to format values for display
  const formatValue = useCallback((value: any, valueType: string): string => {
    if (value === undefined || value === null) return 'N/A';
    
    switch (valueType.toLowerCase()) {
      case 'length':
        return typeof value === 'number' ? `${value.toFixed(2)} mm` : value.toString();
      case 'angle':
        return typeof value === 'number' ? `${value.toFixed(4)}°` : value.toString();
      case 'boolean':
        return value === true || value === 'Yes' ? 'Yes' : 'No';
      case 'real number':
        return typeof value === 'number' ? value.toFixed(2) : value.toString();
      default:
        return value.toString();
    }
  }, []);
  
  // Update output value based on selected parameter and output mode
  const updateOutputValue = useCallback((value: any, valueType: string) => {
    if (value === undefined || valueType === undefined) {
      console.log('Warning: Attempting to update output value with undefined value or valueType');
      return;
    }
    
    const processedValue = processValueForOutputMode(value, valueType, outputMode);
    console.log('Updating output value:', value, 'Processed:', processedValue, 'Mode:', outputMode);
    setOutputValue(processedValue);
  }, [outputMode, processValueForOutputMode]);
  
  // Update local JSON data when props change
  useEffect(() => {
    if (jsonData) {
      setLocalJsonData(jsonData);
      
      // If a parameter is already selected, update the output value
      if (selectedParamId) {
        const param = jsonData.parameters?.find(p => p.id === selectedParamId);
        if (param) {
          const currentValue = editedValues[selectedParamId] !== undefined ? editedValues[selectedParamId] : param.value;
          updateOutputValue(currentValue, param.valueType);
        }
      }
    }
  }, [jsonData, selectedParamId, editedValues, updateOutputValue]);
  
  // Update node data when output value changes
  useEffect(() => {
    if (id && outputValue !== null) {
      console.log('Setting node data with output value:', outputValue);
      setNodes(nds => 
        nds.map(node => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                outputValue,
                outputMode
              }
            };
          }
          return node;
        })
      );
    }
  }, [outputValue, id, setNodes, outputMode]);
  
  // Call onChange when edited values change
  useEffect(() => {
    if (onChange && selectedParamId && editedValues[selectedParamId] !== undefined) {
      onChange(selectedParamId, editedValues[selectedParamId]);
      
      // Update output value for connections
      setOutputValue(editedValues[selectedParamId]);
    }
  }, [editedValues, selectedParamId, onChange]);
  
  // Filter parameters based on filter term
  const filteredParameters = useMemo(() => {
    if (!localJsonData?.parameters) return [];
    if (!filterTerm) return localJsonData.parameters;
    
    const lowerFilterTerm = filterTerm.toLowerCase();
    return localJsonData.parameters.filter(param => 
      param.name.toLowerCase().includes(lowerFilterTerm) || 
      (param.description && param.description.toLowerCase().includes(lowerFilterTerm))
    );
  }, [localJsonData, filterTerm]);
  
  // Handle parameter selection
  const handleSelectParameter = useCallback((paramId: string) => {
    setSelectedParamId(paramId);
    
    // Find the parameter
    const param = localJsonData?.parameters?.find(p => p.id === paramId);
    if (param) {
      // Get the current value (edited or original)
      const currentValue = editedValues[paramId] !== undefined ? editedValues[paramId] : param.value;
      
      // Process the value based on the output mode
      updateOutputValue(currentValue, param.valueType);
      
      // Auto-collapse when a parameter is selected
      setIsCollapsed(true);
    }
  }, [localJsonData, editedValues, updateOutputValue]);
  
  // Handle value change based on parameter type
  const handleValueChange = useCallback((paramId: string, newValue: any, valueType: string) => {
    if (paramId === undefined || valueType === undefined) {
      console.log('Warning: Attempting to handle value change with undefined paramId or valueType');
      return;
    }
    
    let processedValue = newValue;
    
    // Process value based on type
    switch (valueType.toLowerCase()) {
      case 'integer':
        processedValue = parseInt(newValue, 10);
        if (isNaN(processedValue)) return; // Invalid integer
        break;
      case 'real number':
      case 'length':
      case 'angle':
        processedValue = parseFloat(newValue);
        if (isNaN(processedValue)) return; // Invalid number
        break;
      case 'boolean':
        processedValue = newValue === 'Yes' || newValue === true;
        break;
      // String and other types don't need special processing
    }
    
    console.log('Value changed:', newValue, 'Processed value:', processedValue, 'Type:', typeof processedValue);
    
    setEditedValues(prev => ({
      ...prev,
      [paramId]: processedValue
    }));
    
    // Update output value based on the current output mode
    updateOutputValue(processedValue, valueType);
  }, [updateOutputValue]);
  
  // Handle output mode change
  const handleOutputModeChange = useCallback((mode: 'raw' | 'formatted' | 'withUnits') => {
    console.log('Output mode change requested:', mode);
    setOutputMode(mode);
  }, []);
  
  // Toggle collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Get the appropriate input control for a parameter
  const renderInputControl = (param: Parameter) => {
    // Get the current value (edited or original)
    const currentValue = editedValues[param.id] !== undefined 
      ? editedValues[param.id] 
      : param.value;
    
    switch (param.valueType.toLowerCase()) {
      case 'boolean':
        return (
          <select
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white nodrag"
            value={currentValue === true || currentValue === 'Yes' ? 'Yes' : 'No'}
            onChange={(e) => handleValueChange(param.id, e.target.value, param.valueType)}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        );
      case 'integer':
      case 'real number':
      case 'length':
      case 'angle':
        return (
          <input
            type="number"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white nodrag"
            value={currentValue}
            onChange={(e) => handleValueChange(param.id, e.target.value, param.valueType)}
            step={param.valueType.toLowerCase() === 'integer' ? 1 : 0.01}
          />
        );
      default:
        return (
          <input
            type="text"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white nodrag"
            value={currentValue}
            onChange={(e) => handleValueChange(param.id, e.target.value, param.valueType)}
          />
        );
    }
  };
  
  // Find the selected parameter
  const selectedParam = localJsonData?.parameters?.find(p => p.id === selectedParamId);
  
  return (
    <BaseNode<JsonDisplayNodeData>
      data={{
        ...data,
        label: label || 'JSON Display'
      }}
      isConnectable={isConnectable}
      error={error}
      handles={{
        inputs: [
          { 
            id: 'input', 
            position: 50, 
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
              background: '#f59e0b',
              border: '2px solid #f59e0b',
              width: '10px',
              height: '10px'
            }
          }
        ]
      }}
    >
      {/* Collapse/Expand Toggle */}
      <div className="mb-3 flex justify-end">
        <button 
          onClick={toggleCollapse}
          className="p-1 text-xs bg-gray-200 dark:bg-gray-700 rounded"
        >
          {isCollapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>
      
      {/* Collapsed View */}
      {isCollapsed ? (
        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          {/* Selected Parameter Display */}
          {selectedParam ? (
            <>
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedParam.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedParam.valueType}
                </div>
              </div>
              
              {/* Output Value Display */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Output:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {outputMode === 'withUnits' 
                    ? formatValue(
                        editedValues[selectedParam.id] !== undefined 
                          ? editedValues[selectedParam.id] 
                          : selectedParam.value, 
                        selectedParam.valueType
                      )
                    : outputMode === 'formatted'
                      ? (typeof outputValue === 'number' ? outputValue.toFixed(2) : outputValue)
                      : outputValue
                  }
                </span>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              No parameter selected
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Basic Info */}
          {localJsonData && (
            <div className="mb-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-300 dark:border-gray-600">
              {localJsonData.bim_element_id && (
                <div className="mb-1">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Element ID:</span>
                  <div className="text-sm text-black dark:text-white truncate">
                    {localJsonData.bim_element_id}
                  </div>
                </div>
              )}
              {localJsonData.item_name && (
                <div className="mb-1">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Item Name:</span>
                  <div className="text-sm text-black dark:text-white">
                    {localJsonData.item_name}
                  </div>
                </div>
              )}
              {localJsonData.bim_product_id && (
                <div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Product ID:</span>
                  <div className="text-sm text-black dark:text-white">
                    {localJsonData.bim_product_id}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Filter and Parameter List */}
          {localJsonData?.parameters && localJsonData.parameters.length > 0 ? (
            <>
              {/* Filter */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Filter parameters..."
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white nodrag"
                  value={filterTerm}
                  onChange={(e) => setFilterTerm(e.target.value)}
                />
              </div>
              
              {/* Parameter List */}
              <div className="mb-3 max-h-[150px] overflow-y-auto border rounded nodrag hover:overflow-scroll bg-white dark:bg-gray-800">
                {filteredParameters.map((param) => (
                  <div 
                    key={param.id}
                    className={`p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedParamId === param.id ? 'bg-blue-100 dark:bg-blue-900' : ''
                    }`}
                    onClick={() => handleSelectParameter(param.id)}
                  >
                    <div className="flex justify-between">
                      <div className="font-medium text-sm text-gray-800 dark:text-gray-200">{param.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{param.valueType}</div>
                    </div>
                    {param.description && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {param.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Selected Parameter Editor */}
              {selectedParam && (
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-300 dark:border-gray-600">
                  <div className="mb-2">
                    <div className="font-medium text-gray-800 dark:text-gray-200">{selectedParam.name}</div>
                    {selectedParam.description && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {selectedParam.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Type: {selectedParam.valueType}
                    </div>
                    
                    {/* Current Value */}
                    <div className="mb-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Current Value:</div>
                      <div className="text-sm font-mono text-gray-800 dark:text-gray-200">
                        {formatValue(selectedParam.value, selectedParam.valueType)}
                      </div>
                    </div>
                    
                    {/* Edit Value */}
                    <div>
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Edit Value:</div>
                      {renderInputControl(selectedParam)}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Output Mode Selection in expanded view - always visible */}
              <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Output Mode:</div>
                <div className="flex gap-2">
                  <button
                    className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                      outputMode === 'raw' 
                        ? 'bg-blue-500 text-white shadow-md transform scale-105' 
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                    onClick={() => handleOutputModeChange('raw')}
                  >
                    Raw
                  </button>
                  <button
                    className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                      outputMode === 'formatted' 
                        ? 'bg-blue-500 text-white shadow-md transform scale-105' 
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                    onClick={() => handleOutputModeChange('formatted')}
                  >
                    Formatted
                  </button>
                  <button
                    className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                      outputMode === 'withUnits' 
                        ? 'bg-blue-500 text-white shadow-md transform scale-105' 
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                    onClick={() => handleOutputModeChange('withUnits')}
                  >
                    With Units
                  </button>
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Output: <span className="font-mono">{String(outputValue)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-4 text-gray-500 dark:text-gray-400">
              No JSON data available. Connect to a JSON Load node.
            </div>
          )}
        </>
      )}
    </BaseNode>
  );
};

export default memo(JsonDisplayNode); 