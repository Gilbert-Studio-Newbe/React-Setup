'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { NodeProps, useReactFlow, useUpdateNodeInternals } from '@xyflow/react';
import JsonParameterFormatterNode from './JsonParameterFormatterNode';

// Define interfaces for type safety
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

// Client-side wrapper component that adds interactivity
const ClientJsonParameterFormatterNode = (props: NodeProps) => {
  const { data, id } = props;
  const { setNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  
  // State for node data
  const [jsonData, setJsonData] = useState<JsonData | null>(data?.jsonData || null);
  const [formattedString, setFormattedString] = useState<string>(data?.formattedString || 'No output yet');
  const [selectedParameters, setSelectedParameters] = useState<SelectedParameter[]>(
    data?.selectedParameters || []
  );
  // Add state for dimension output value
  const [dimensionOutputValue, setDimensionOutputValue] = useState<number | null>(data?.dimensionOutputValue || null);
  // Add state for collapsible parameters
  const [isParametersVisible, setIsParametersVisible] = useState<boolean>(true);
  
  // Toggle parameters visibility
  const toggleParametersVisibility = useCallback(() => {
    setIsParametersVisible(prev => !prev);
  }, []);
  
  // Handle parameter selection
  const handleSelectParameter = useCallback((index: number, paramId: string | null) => {
    setSelectedParameters(prev => {
      const updated = [...prev];
      if (index >= 0 && index < updated.length) {
        updated[index] = { ...updated[index], paramId };
      }
      return updated;
    });
  }, []);
  
  // Handle toggle convert to millimeters
  const handleToggleConvertToMillimeters = useCallback((index: number) => {
    setSelectedParameters(prev => {
      const updated = [...prev];
      if (index >= 0 && index < updated.length) {
        updated[index] = { 
          ...updated[index], 
          convertToMillimeters: !updated[index].convertToMillimeters 
        };
      }
      return updated;
    });
  }, []);
  
  // Handle update custom label
  const handleUpdateCustomLabel = useCallback((index: number, label: string) => {
    setSelectedParameters(prev => {
      const updated = [...prev];
      if (index >= 0 && index < updated.length) {
        updated[index] = { ...updated[index], customLabel: label };
      }
      return updated;
    });
  }, []);
  
  // Format parameters based on template and selected parameters
  const formatParameters = useCallback(() => {
    if (!jsonData || !jsonData.parameters || !selectedParameters || selectedParameters.length === 0) {
      setDimensionOutputValue(null);
      return 'No parameters selected';
    }
    
    const formatTemplate = data?.formatTemplate || '**{label}**, {value};';
    const trimWhitespace = data?.trimWhitespace !== false;
    const handleNullValues = data?.handleNullValues || 'skip';
    
    // Sort selected parameters by order
    const sortedParams = [...selectedParameters].sort((a, b) => a.order - b.order);
    
    // Extract numeric dimension value from the first parameter with a numeric value
    let dimensionValue: number | null = null;
    
    // Format each parameter
    const formattedParts = sortedParams.map(selectedParam => {
      if (!selectedParam.paramId) return null;
      
      const param = jsonData.parameters?.find(p => p.id === selectedParam.paramId);
      if (!param) return null;
      
      // Skip null values if configured to do so
      if ((param.value === null || param.value === undefined) && handleNullValues === 'skip') {
        return null;
      }
      
      // Get value, applying conversion if needed
      let value = param.value;
      if (selectedParam.convertToMillimeters && param.valueType === 'length' && typeof value === 'number') {
        // Convert to millimeters by multiplying by 1000 (assuming input is in meters)
        value = value * 1000;
      }
      
      // Extract numeric dimension value if not already found
      if (dimensionValue === null && typeof value === 'number') {
        dimensionValue = value;
      } else if (dimensionValue === null && typeof value === 'string') {
        // Try to extract numeric value from string
        const match = value.match(/[-+]?[0-9]*\.?[0-9]+/);
        if (match) {
          dimensionValue = parseFloat(match[0]);
        }
      }
      
      // Format the value based on type
      let formattedValue = value;
      if (typeof value === 'number') {
        formattedValue = value.toFixed(2);
      } else if (value === null || value === undefined) {
        formattedValue = 'N/A';
      }
      
      // Use custom label if provided, otherwise use parameter name
      const label = selectedParam.customLabel || param.name;
      
      // Replace placeholders in template
      return formatTemplate
        .replace('{label}', label)
        .replace('{value}', String(formattedValue))
        .replace('{id}', param.id)
        .replace('{type}', param.valueType || 'unknown');
    }).filter(Boolean); // Remove null entries
    
    // Update dimension output value
    setDimensionOutputValue(dimensionValue);
    
    // Join the formatted parts
    let result = formattedParts.join(' ');
    
    // Trim whitespace if configured
    if (trimWhitespace) {
      result = result.trim();
    }
    
    return result || 'No output generated';
  }, [jsonData, selectedParameters, data?.formatTemplate, data?.trimWhitespace, data?.handleNullValues, setDimensionOutputValue]);
  
  // Update node data when selected parameters change
  useEffect(() => {
    if (id) {
      setNodes(nodes => 
        nodes.map(node => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                selectedParameters
              }
            };
          }
          return node;
        })
      );
      
      // If we have JSON data, update the formatted string
      if (jsonData) {
        const formatted = formatParameters();
        setFormattedString(formatted);
      }
    }
  }, [selectedParameters, id, setNodes, jsonData, formatParameters]);
  
  // Add an effect to update local state when jsonData prop changes
  useEffect(() => {
    if (data?.jsonData && JSON.stringify(data.jsonData) !== JSON.stringify(jsonData)) {
      console.log('ClientJsonParameterFormatterNode: Received new JSON data from props', {
        parametersCount: data.jsonData.parameters?.length || 0,
        nodeId: id
      });
      setJsonData(data.jsonData);
    }
  }, [data?.jsonData, jsonData, id]);
  
  // Process incoming JSON data and update formatted string
  useEffect(() => {
    if (id && jsonData) {
      // Format parameters
      const formatted = formatParameters();
      console.log('ClientJsonParameterFormatterNode: Formatted parameters', {
        formattedString: formatted,
        dimensionOutputValue,
        nodeId: id
      });
      setFormattedString(formatted);
      
      // Update node data
      setNodes(nodes => 
        nodes.map(node => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                jsonData,
                formattedString: formatted,
                outputValue: formatted,
                dimensionOutputValue
              }
            };
          }
          return node;
        })
      );
      
      // Update node internals to refresh handles
      updateNodeInternals(id);
    }
  }, [id, jsonData, formatParameters, setNodes, updateNodeInternals, dimensionOutputValue]);
  
  // Update node data when state changes
  useEffect(() => {
    if (!id) return;
    
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              jsonData,
              selectedParameters,
              formattedString,
              dimensionOutputValue,
              onSelectParameter: handleSelectParameter,
              onToggleConvertToMillimeters: handleToggleConvertToMillimeters,
              onUpdateCustomLabel: handleUpdateCustomLabel,
              isParametersVisible,
              toggleParametersVisibility
            }
          };
        }
        return node;
      })
    );
  }, [
    id, 
    setNodes, 
    jsonData, 
    selectedParameters, 
    formattedString, 
    dimensionOutputValue,
    handleSelectParameter, 
    handleToggleConvertToMillimeters, 
    handleUpdateCustomLabel,
    isParametersVisible,
    toggleParametersVisibility
  ]);
  
  // Merge the state into the data
  const enhancedData = {
    ...data,
    formattedString,
    jsonData,
    selectedParameters,
    dimensionOutputValue,
    // Add callbacks for the static component to use
    onSelectParameter: handleSelectParameter,
    onToggleConvertToMillimeters: handleToggleConvertToMillimeters,
    onUpdateCustomLabel: handleUpdateCustomLabel,
    isParametersVisible,
    toggleParametersVisibility
  };
  
  // Render the static component with enhanced data
  return <JsonParameterFormatterNode {...props} data={enhancedData} />;
};

export default memo(ClientJsonParameterFormatterNode); 