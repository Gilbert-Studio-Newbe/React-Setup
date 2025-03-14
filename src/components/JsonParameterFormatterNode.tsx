'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  parameters?: Parameter[];
  [key: string]: any;
}

interface SelectedParameter {
  paramId: string | null;
  order: number;
}

interface JsonParameterFormatterNodeData extends BaseNodeData {
  jsonData?: JsonData | null;
  selectedParameters?: SelectedParameter[];
  dimensionParameter?: string | null;
  dimensionUnit?: string;
  formatTemplate?: string;
  trimWhitespace?: boolean;
  handleNullValues?: 'ignore' | 'skip';
  formattedString?: string;
  dimensionValue?: number | null;
}

const defaultData: JsonParameterFormatterNodeData = {
  label: 'Parameter Formatter',
  jsonData: null,
  selectedParameters: [
    { paramId: null, order: 0 },
    { paramId: null, order: 1 },
    { paramId: null, order: 2 },
    { paramId: null, order: 3 },
    { paramId: null, order: 4 }
  ],
  dimensionParameter: null,
  dimensionUnit: 'm',
  formatTemplate: '**{name}**, {value};',
  trimWhitespace: true,
  handleNullValues: 'skip',
  formattedString: '',
  dimensionValue: null
};

const dimensionUnits = [
  { value: 'm', label: 'meters (m)' },
  { value: 'mm', label: 'millimeters (mm)' },
  { value: 'cm', label: 'centimeters (cm)' },
  { value: 'm²', label: 'square meters (m²)' },
  { value: 'm³', label: 'cubic meters (m³)' }
];

const JsonParameterFormatterNode: React.FC<NodeProps<JsonParameterFormatterNodeData>> = ({ 
  data = defaultData, 
  isConnectable, 
  id 
}) => {
  const { setNodes } = useReactFlow();
  
  // Initialize state with default values or data props
  const [jsonData, setJsonData] = useState<JsonData | null>(data.jsonData || null);
  const [selectedParameters, setSelectedParameters] = useState<SelectedParameter[]>(
    data.selectedParameters || defaultData.selectedParameters
  );
  const [dimensionParameter, setDimensionParameter] = useState<string | null>(
    data.dimensionParameter || null
  );
  const [dimensionUnit, setDimensionUnit] = useState<string>(
    data.dimensionUnit || 'm'
  );
  const [formatTemplate, setFormatTemplate] = useState<string>(
    data.formatTemplate || '**{name}**, {value};'
  );
  const [trimWhitespace, setTrimWhitespace] = useState<boolean>(
    data.trimWhitespace !== undefined ? data.trimWhitespace : true
  );
  const [handleNullValues, setHandleNullValues] = useState<'ignore' | 'skip'>(
    data.handleNullValues || 'skip'
  );
  const [formattedString, setFormattedString] = useState<string>(
    data.formattedString || ''
  );
  const [dimensionValue, setDimensionValue] = useState<number | null>(
    data.dimensionValue || null
  );
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [filterTerms, setFilterTerms] = useState<string[]>(Array(5).fill(''));
  const [dimensionFilterTerm, setDimensionFilterTerm] = useState<string>('');
  const [showDropdowns, setShowDropdowns] = useState<boolean[]>(Array(5).fill(false));
  const [showDimensionDropdown, setShowDimensionDropdown] = useState<boolean>(false);
  
  // Refs for dropdown containers
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>(Array(5).fill(null));
  const dimensionDropdownRef = useRef<HTMLDivElement | null>(null);
  
  // Update jsonData when it changes from props
  useEffect(() => {
    if (data.jsonData) {
      setJsonData(data.jsonData);
    }
  }, [data.jsonData]);
  
  // Extract parameters from JSON data
  const parameters = useMemo(() => {
    if (!jsonData || !jsonData.parameters) {
      return [];
    }
    return jsonData.parameters;
  }, [jsonData]);
  
  // Filter parameters based on search terms
  const filteredParameters = useMemo(() => {
    return filterTerms.map((term, index) => {
      if (!term) return parameters;
      
      const lowerTerm = term.toLowerCase();
      return parameters.filter(param => 
        param.name.toLowerCase().includes(lowerTerm) || 
        (param.description && param.description.toLowerCase().includes(lowerTerm))
      );
    });
  }, [parameters, filterTerms]);
  
  // Filter dimension parameters
  const filteredDimensionParameters = useMemo(() => {
    if (!dimensionFilterTerm) return parameters;
    
    const lowerTerm = dimensionFilterTerm.toLowerCase();
    return parameters.filter(param => 
      param.name.toLowerCase().includes(lowerTerm) || 
      (param.description && param.description.toLowerCase().includes(lowerTerm))
    );
  }, [parameters, dimensionFilterTerm]);
  
  // Get parameter by ID
  const getParameterById = useCallback((paramId: string | null) => {
    if (!paramId || !parameters.length) return null;
    return parameters.find(param => param.id === paramId) || null;
  }, [parameters]);
  
  // Format the output string based on selected parameters
  const generateFormattedString = useCallback(() => {
    if (!parameters.length) return '';
    
    const validParameters = selectedParameters
      .filter(sp => sp.paramId !== null)
      .sort((a, b) => a.order - b.order)
      .map(sp => {
        const param = getParameterById(sp.paramId);
        return param;
      })
      .filter(param => param !== null);
    
    if (validParameters.length === 0) return '';
    
    const formattedParts = validParameters.map(param => {
      if (!param) return '';
      
      // Skip null values if configured to do so
      if (handleNullValues === 'skip' && (param.value === null || param.value === undefined)) {
        return '';
      }
      
      // Format the parameter according to the template
      let formatted = formatTemplate
        .replace('{name}', param.name)
        .replace('{value}', String(param.value || ''));
      
      // Trim whitespace if configured
      if (trimWhitespace) {
        formatted = formatted.trim();
      }
      
      return formatted;
    }).filter(part => part !== '');
    
    return formattedParts.join(' ');
  }, [parameters, selectedParameters, getParameterById, formatTemplate, trimWhitespace, handleNullValues]);
  
  // Calculate dimension value
  const calculateDimensionValue = useCallback(() => {
    if (!dimensionParameter || !parameters.length) return null;
    
    const param = getParameterById(dimensionParameter);
    if (!param) return null;
    
    // Extract numeric value
    let value = param.value;
    if (typeof value === 'string') {
      // Try to extract numeric part
      const match = value.match(/[\d.]+/);
      if (match) {
        value = parseFloat(match[0]);
      } else {
        return null;
      }
    } else if (typeof value !== 'number') {
      return null;
    }
    
    // Convert based on unit if needed
    // For now, we'll just return the raw value
    return value;
  }, [dimensionParameter, parameters, getParameterById]);
  
  // Update formatted string and dimension value when inputs change
  useEffect(() => {
    try {
      const newFormattedString = generateFormattedString();
      const newDimensionValue = calculateDimensionValue();
      
      setFormattedString(newFormattedString);
      setDimensionValue(newDimensionValue);
      
      // Update node data
      if (id) {
        setNodes(nds => 
          nds.map(node => {
            if (node.id === id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  selectedParameters,
                  dimensionParameter,
                  dimensionUnit,
                  formatTemplate,
                  trimWhitespace,
                  handleNullValues,
                  formattedString: newFormattedString,
                  dimensionValue: newDimensionValue,
                  outputValue: newFormattedString // Primary output is the formatted string
                }
              };
            }
            return node;
          })
        );
      }
    } catch (error) {
      console.error('Error updating node data:', error);
    }
  }, [
    id, 
    selectedParameters, 
    dimensionParameter, 
    dimensionUnit, 
    formatTemplate, 
    trimWhitespace, 
    handleNullValues, 
    generateFormattedString, 
    calculateDimensionValue, 
    setNodes
  ]);
  
  // Handle parameter selection
  const handleSelectParameter = useCallback((index: number, paramId: string) => {
    setSelectedParameters(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], paramId };
      return updated;
    });
    
    // Close the dropdown
    setShowDropdowns(prev => {
      const updated = [...prev];
      updated[index] = false;
      return updated;
    });
    
    // Clear the filter term
    setFilterTerms(prev => {
      const updated = [...prev];
      updated[index] = '';
      return updated;
    });
  }, []);
  
  // Handle dimension parameter selection
  const handleSelectDimensionParameter = useCallback((paramId: string) => {
    setDimensionParameter(paramId);
    setShowDimensionDropdown(false);
    setDimensionFilterTerm('');
  }, []);
  
  // Handle parameter reordering
  const moveParameter = useCallback((index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === selectedParameters.length - 1)
    ) {
      return;
    }
    
    setSelectedParameters(prev => {
      const updated = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Swap order values
      const currentOrder = updated[index].order;
      updated[index].order = updated[targetIndex].order;
      updated[targetIndex].order = currentOrder;
      
      // Sort by order
      return updated.sort((a, b) => a.order - b.order);
    });
  }, [selectedParameters]);
  
  // Toggle collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check parameter dropdowns
      dropdownRefs.current.forEach((ref, index) => {
        if (ref && !ref.contains(event.target as Node)) {
          setShowDropdowns(prev => {
            const updated = [...prev];
            updated[index] = false;
            return updated;
          });
        }
      });
      
      // Check dimension dropdown
      if (dimensionDropdownRef.current && !dimensionDropdownRef.current.contains(event.target as Node)) {
        setShowDimensionDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Toggle dropdown visibility
  const toggleDropdown = (index: number) => {
    setShowDropdowns(prev => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };
  
  // Toggle dimension dropdown visibility
  const toggleDimensionDropdown = () => {
    setShowDimensionDropdown(prev => !prev);
  };
  
  return (
    <BaseNode<JsonParameterFormatterNodeData>
      data={data}
      isConnectable={isConnectable}
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
            position: 30,
            style: { 
              background: '#f59e0b',
              border: '2px solid #f59e0b',
              width: '10px',
              height: '10px'
            }
          },
          { 
            id: 'dimension', 
            position: 70,
            style: { 
              background: '#10b981',
              border: '2px solid #10b981',
              width: '10px',
              height: '10px'
            }
          }
        ]
      }}
    >
      {/* Title with Collapse Toggle */}
      <div className="mb-3 flex justify-between items-center">
        <div className="text-lg font-bold text-black dark:text-white">
          {data.label || 'Parameter Formatter'}
        </div>
        <button 
          onClick={toggleCollapse}
          className="p-1 text-xs bg-gray-200 dark:bg-gray-700 rounded nodrag"
        >
          {isCollapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>
      
      {/* Data Preview - Always show in collapsed mode */}
      {jsonData && (
        <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">JSON Data:</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {parameters.length} parameters
            </span>
          </div>
        </div>
      )}
      
      {/* Output Preview - Always show */}
      <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-800">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Formatted Output:</div>
        <div className="font-mono text-sm text-blue-600 dark:text-blue-400 break-all">
          {formattedString || 'No output yet'}
        </div>
      </div>
      
      {/* Dimension Value - Always show */}
      <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-800">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dimension Value:</div>
        <div className="font-mono text-sm text-green-600 dark:text-green-400">
          {dimensionValue !== null 
            ? `${dimensionValue} ${dimensionUnit}` 
            : 'No dimension selected'}
        </div>
      </div>
      
      {/* Expanded View */}
      {!isCollapsed && (
        <>
          {/* Parameter Selection Area */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Parameter Selection:</div>
            
            {selectedParameters.map((selected, index) => (
              <div key={`param-${index}`} className="mb-2 relative">
                <div className="flex items-center gap-2">
                  {/* Parameter Selector */}
                  <div 
                    ref={el => dropdownRefs.current[index] = el} 
                    className="relative flex-grow"
                  >
                    <div 
                      onClick={() => toggleDropdown(index)}
                      className="p-2 border rounded cursor-pointer bg-white dark:bg-gray-700 flex justify-between items-center nodrag"
                    >
                      <span className="truncate">
                        {selected.paramId 
                          ? getParameterById(selected.paramId)?.name || 'Select parameter' 
                          : 'Select parameter'}
                      </span>
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                    {/* Dropdown */}
                    {showDropdowns[index] && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-300 dark:border-gray-600">
                          <input
                            type="text"
                            placeholder="Search parameters..."
                            className="w-full p-1 border rounded text-sm nodrag"
                            value={filterTerms[index]}
                            onChange={(e) => {
                              const updated = [...filterTerms];
                              updated[index] = e.target.value;
                              setFilterTerms(updated);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        
                        {/* Parameter List */}
                        <div className="max-h-[150px] overflow-y-auto">
                          {filteredParameters[index].length > 0 ? (
                            filteredParameters[index].map((param) => (
                              <div 
                                key={param.id}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                onClick={() => handleSelectParameter(index, param.id)}
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
                            ))
                          ) : (
                            <div className="p-2 text-center text-gray-500 dark:text-gray-400 text-sm">
                              No parameters found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Reorder Buttons */}
                  <div className="flex flex-col">
                    <button
                      className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30 nodrag"
                      onClick={() => moveParameter(index, 'up')}
                      disabled={index === 0}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30 nodrag"
                      onClick={() => moveParameter(index, 'down')}
                      disabled={index === selectedParameters.length - 1}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Dimension Parameter Section */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dimension Parameter:</div>
            
            <div className="flex gap-2 items-center">
              {/* Dimension Parameter Selector */}
              <div 
                ref={dimensionDropdownRef} 
                className="relative flex-grow"
              >
                <div 
                  onClick={toggleDimensionDropdown}
                  className="p-2 border rounded cursor-pointer bg-white dark:bg-gray-700 flex justify-between items-center nodrag"
                >
                  <span className="truncate">
                    {dimensionParameter 
                      ? getParameterById(dimensionParameter)?.name || 'Select dimension' 
                      : 'Select dimension'}
                  </span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {/* Dropdown */}
                {showDimensionDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-300 dark:border-gray-600">
                      <input
                        type="text"
                        placeholder="Search parameters..."
                        className="w-full p-1 border rounded text-sm nodrag"
                        value={dimensionFilterTerm}
                        onChange={(e) => setDimensionFilterTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    {/* Parameter List */}
                    <div className="max-h-[150px] overflow-y-auto">
                      {filteredDimensionParameters.length > 0 ? (
                        filteredDimensionParameters.map((param) => (
                          <div 
                            key={param.id}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => handleSelectDimensionParameter(param.id)}
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
                        ))
                      ) : (
                        <div className="p-2 text-center text-gray-500 dark:text-gray-400 text-sm">
                          No parameters found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Unit Selector */}
              <select
                className="p-2 border rounded bg-white dark:bg-gray-700 nodrag"
                value={dimensionUnit}
                onChange={(e) => setDimensionUnit(e.target.value)}
              >
                {dimensionUnits.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Settings */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Settings:</div>
            
            {/* Format Template */}
            <div className="mb-2">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Format Template:
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 nodrag"
                value={formatTemplate}
                onChange={(e) => setFormatTemplate(e.target.value)}
                placeholder="**{name}**, {value};"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use {'{name}'} and {'{value}'} as placeholders
              </div>
            </div>
            
            {/* Trim Whitespace */}
            <div className="mb-2 flex items-center">
              <input
                type="checkbox"
                id={`trim-whitespace-${id}`}
                className="mr-2 nodrag"
                checked={trimWhitespace}
                onChange={(e) => setTrimWhitespace(e.target.checked)}
              />
              <label htmlFor={`trim-whitespace-${id}`} className="text-sm text-gray-700 dark:text-gray-300">
                Trim whitespace
              </label>
            </div>
            
            {/* Handle Null Values */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Handle Null Values:
              </label>
              <select
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 nodrag"
                value={handleNullValues}
                onChange={(e) => setHandleNullValues(e.target.value as 'ignore' | 'skip')}
              >
                <option value="ignore">Include with empty value</option>
                <option value="skip">Skip parameter</option>
              </select>
            </div>
          </div>
        </>
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
      
      {/* Output Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ 
          top: '30%',
          background: '#f59e0b', 
          width: '10px', 
          height: '10px',
          border: '2px solid #f59e0b'
        }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="dimension"
        style={{ 
          top: '70%',
          background: '#10b981', 
          width: '10px', 
          height: '10px',
          border: '2px solid #10b981'
        }}
        isConnectable={isConnectable}
      />
    </BaseNode>
  );
};

export default React.memo(JsonParameterFormatterNode); 