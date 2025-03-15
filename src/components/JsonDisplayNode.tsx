'use client';

import React, { memo, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';

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

interface JsonDisplayNodeData {
  label?: string;
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
        // Format the value with units
        if (typeof processedValue === 'number') {
          switch (valueType && valueType.toLowerCase()) {
            case 'length':
              finalValue = `${processedValue.toFixed(2)} m`;
              break;
            case 'angle':
              finalValue = `${processedValue.toFixed(4)} rad`;
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
        finalValue = processedValue;
    }
    
    console.log('Processed value for output mode:', mode, 'Value:', finalValue, 'Type:', typeof finalValue);
    return finalValue;
  }, []);
  
  // Process and update the output value based on the selected mode - defined with useCallback before it's used
  const updateOutputValue = useCallback((value: any, valueType: string) => {
    if (value === undefined || valueType === undefined) {
      console.log('Warning: Attempting to update with undefined value or type');
      return;
    }
    
    const finalValue = processValueForOutputMode(value, valueType, outputMode);
    console.log('Output value updated:', finalValue, 'Type:', typeof finalValue, 'Mode:', outputMode, 'ValueType:', valueType);
    setOutputValue(finalValue);
  }, [outputMode, processValueForOutputMode]);
  
  // Update local state when jsonData changes from props
  useEffect(() => {
    if (jsonData) {
      setLocalJsonData(jsonData);
    }
  }, [jsonData]);
  
  // Update getEdgesRef when reactFlowInstance changes
  useEffect(() => {
    getEdgesRef.current = reactFlowInstance.getEdges;
  }, [reactFlowInstance]);
  
  // Handle disconnections and reset data when needed
  useEffect(() => {
    if (!id) return;
    
    // Get the current edges using the ref
    const currentEdges = getEdgesRef.current();
    console.log('Checking connections for JsonDisplayNode:', id, 'Edges:', currentEdges.length);
    
    // Check if there are any edges connected to this node
    const hasIncomingConnections = currentEdges.some(edge => edge.target === id);
    
    // If no connections and we have data, reset it
    if (!hasIncomingConnections && localJsonData) {
      console.log('No incoming connections, resetting JSON Display node data');
      setLocalJsonData(null);
      setSelectedParamId(null);
      setOutputValue(0);
      setFilterTerm('');
      setEditedValues({});
      
      // Update the node data
      setNodes(nds => 
        nds.map(node => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                jsonData: null,
                outputValue: 0
              }
            };
          }
          return node;
        })
      );
    }
  }, [id, localJsonData, setNodes]);
  
  // Update selected parameter when it changes from props
  useEffect(() => {
    if (selectedParameter) {
      setSelectedParamId(selectedParameter);
    }
  }, [selectedParameter]);
  
  // Get the currently selected parameter
  const selectedParam = useMemo(() => {
    if (!localJsonData?.parameters || !selectedParamId) return null;
    return localJsonData.parameters.find(p => p.id === selectedParamId) || null;
  }, [localJsonData, selectedParamId]);
  
  // Update the node's data when outputMode changes
  useEffect(() => {
    if (id) {
      console.log('Output mode changed to:', outputMode);
      setNodes((nds) => 
        nds.map((node) => {
          if (node.id === id) {
            if (node.data.outputMode !== outputMode) {
              console.log('Updating node output mode:', node.id, outputMode);
              
              // If we have a selected parameter, immediately update the output value with the new mode
              if (selectedParam) {
                const currentValue = editedValues[selectedParam.id] !== undefined 
                  ? editedValues[selectedParam.id] 
                  : selectedParam.value;
                
                // Process the value based on the new output mode
                const updatedValue = processValueForOutputMode(currentValue, selectedParam.valueType, outputMode);
                
                return {
                  ...node,
                  data: {
                    ...node.data,
                    outputMode: outputMode,
                    outputValue: updatedValue
                  }
                };
              }
              
              return {
                ...node,
                data: {
                  ...node.data,
                  outputMode: outputMode
                }
              };
            }
          }
          return node;
        })
      );
      
      // If we have a selected parameter, update the output value with the new mode
      if (selectedParam) {
        const currentValue = editedValues[selectedParam.id] !== undefined 
          ? editedValues[selectedParam.id] 
          : selectedParam.value;
        
        updateOutputValue(currentValue, selectedParam.valueType);
      }
    }
  }, [outputMode, id, setNodes, selectedParam, editedValues, processValueForOutputMode, updateOutputValue]);
  
  // Update the node's data when outputValue changes
  useEffect(() => {
    // Update the node's data directly with the current outputValue
    if (id && outputValue !== null) {
      console.log('Updating node data with outputValue:', outputValue, 'Type:', typeof outputValue);
      
      // Ensure numeric values are preserved as numbers, but don't convert strings that should remain strings
      let finalValue = outputValue;
      
      // Only try to convert strings to numbers if they look like numbers and we're in raw mode
      if (typeof outputValue === 'string' && outputMode === 'raw') {
        // Check if this string is meant to be a number (doesn't contain non-numeric chars except . and -)
        const looksLikeNumber = /^-?\d*\.?\d*$/.test(outputValue.trim());
        if (looksLikeNumber) {
          const parsed = parseFloat(outputValue);
          if (!isNaN(parsed)) {
            finalValue = parsed;
            console.log('Converted string to number:', outputValue, '->', finalValue);
          }
        } else {
          // This is a string that should remain a string
          console.log('Preserving string value:', outputValue);
        }
      }
      
      setNodes((nds) => 
        nds.map((node) => {
          if (node.id === id) {
            // Only update if the value has actually changed
            if (node.data.outputValue !== finalValue) {
              console.log('Found node to update:', node.id, 'with value:', finalValue, 'Type:', typeof finalValue);
              return {
                ...node,
                data: {
                  ...node.data,
                  outputValue: finalValue
                }
              };
            }
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
    
    // Determine which control to render based on valueType and name
    switch (param.valueType.toLowerCase()) {
      case 'boolean':
        return (
          <select
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={currentValue === true ? 'Yes' : 'No'}
            onChange={(e) => handleValueChange(param.id, e.target.value, param.valueType)}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        );
      
      case 'string':
        // Special handling for specific string parameters
        if (param.name === 'strOrientation' || param.name === 'dirCutB') {
          return (
            <select
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={currentValue}
              onChange={(e) => handleValueChange(param.id, e.target.value, param.valueType)}
            >
              <option value="Floor">Floor</option>
              <option value="Wall">Wall</option>
              <option value="Roof">Roof</option>
              <option value="Ceiling">Ceiling</option>
              <option value="Left">Left</option>
              <option value="Right">Right</option>
            </select>
          );
        } else if (param.name === 'strConfiguration') {
          return (
            <select
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={currentValue}
              onChange={(e) => handleValueChange(param.id, e.target.value, param.valueType)}
            >
              <option value="Open Cassette">Open Cassette</option>
              <option value="Closed Cassette">Closed Cassette</option>
              <option value="Standard">Standard</option>
            </select>
          );
        } else if (param.name === 'dirJoists') {
          return (
            <select
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={currentValue}
              onChange={(e) => handleValueChange(param.id, e.target.value, param.valueType)}
            >
              <option value="Vertical">Vertical</option>
              <option value="Horizontal">Horizontal</option>
            </select>
          );
        } else {
          // Default string input
          return (
            <input
              type="text"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={currentValue}
              onChange={(e) => handleValueChange(param.id, e.target.value, param.valueType)}
            />
          );
        }
      
      case 'integer':
        return (
          <div className="flex items-center">
            <input
              type="number"
              step="1"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={currentValue}
              onChange={(e) => handleValueChange(param.id, e.target.value, param.valueType)}
            />
          </div>
        );
      
      case 'real number':
        return (
          <div className="flex items-center">
            <input
              type="number"
              step="0.01"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={currentValue}
              onChange={(e) => handleValueChange(param.id, e.target.value, param.valueType)}
            />
          </div>
        );
      
      case 'length':
        return (
          <div className="flex items-center">
            <input
              type="number"
              step="0.01"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={currentValue}
              onChange={(e) => handleValueChange(param.id, e.target.value, param.valueType)}
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">m</span>
          </div>
        );
      
      case 'angle':
        return (
          <div className="flex items-center">
            <input
              type="number"
              step="0.01"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={currentValue}
              onChange={(e) => handleValueChange(param.id, e.target.value, param.valueType)}
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">rad</span>
          </div>
        );
      
      default:
        // Default fallback for any other type
        return (
          <input
            type="text"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={String(currentValue)}
            onChange={(e) => handleValueChange(param.id, e.target.value, param.valueType)}
          />
        );
    }
  };
  
  // Format value for display
  const formatValue = (value: any, type: string): string => {
    if (value === null || value === undefined) return 'null';
    
    switch (type.toLowerCase()) {
      case 'length':
      case 'real number':
        return typeof value === 'number' 
          ? value.toFixed(2) + (type.toLowerCase() === 'length' ? ' m' : '') 
          : String(value);
      case 'angle':
        return typeof value === 'number' 
          ? `${(value * (180/Math.PI)).toFixed(1)}° (${value.toFixed(4)} rad)` 
          : String(value);
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  };

  return (
    <div className={`p-4 rounded-md border-2 border-black bg-white dark:bg-gray-800 shadow-md ${isCollapsed ? 'w-[280px]' : 'w-[350px]'}`}>
      {/* Title with Collapse Toggle */}
      <div className="mb-3 flex justify-between items-center">
        <div className="text-lg font-bold text-black dark:text-white">
          {selectedParam ? (selectedParam.description || selectedParam.name) : label}
        </div>
        {localJsonData && (
          <button 
            onClick={toggleCollapse}
            className="p-1 text-xs bg-gray-200 dark:bg-gray-700 rounded"
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
          </button>
        )}
      </div>
      
      {/* Basic Info - Always show in collapsed mode */}
      {localJsonData && isCollapsed && (
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md border border-gray-300 dark:border-gray-600">
          {/* Element Info - Only show if no parameter is selected */}
          {!selectedParam && (
            <>
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
                <div className="mb-1">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Product ID:</span>
                  <div className="text-sm text-black dark:text-white">
                    {localJsonData.bim_product_id}
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Selected Parameter Info - Simplified display */}
          {selectedParam && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {selectedParam.valueType}
              </div>
              <div className="text-lg font-mono font-bold">
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
              </div>
            </div>
          )}
          
          {/* Output Mode Selection is hidden in collapsed mode */}
        </div>
      )}
      
      {/* Expanded View */}
      {!isCollapsed && (
        <>
          {/* Basic Info */}
          {localJsonData && (
            <div className="mb-3 bg-gray-100 dark:bg-gray-700 p-3 rounded-md border border-gray-300 dark:border-gray-600">
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
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={filterTerm}
                  onChange={(e) => setFilterTerm(e.target.value)}
                />
              </div>
              
              {/* Parameter List */}
              <div className="mb-3 max-h-[150px] overflow-y-auto border rounded nodrag hover:overflow-scroll">
                {filteredParameters.map((param) => (
                  <div 
                    key={param.id}
                    className={`p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedParamId === param.id ? 'bg-blue-100 dark:bg-blue-900' : ''
                    }`}
                    onClick={() => handleSelectParameter(param.id)}
                  >
                    <div className="flex justify-between">
                      <div className="font-medium text-sm">{param.name}</div>
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
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md border border-gray-300 dark:border-gray-600">
                  <div className="mb-2">
                    <div className="font-medium">{selectedParam.name}</div>
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
                      <div className="text-sm font-mono">
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
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default memo(JsonDisplayNode); 