'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  const { setNodes, getNodes, getEdges } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  
  // State for node data
  const [dimensionOutputMode, setDimensionOutputMode] = useState(
    data?.dimensionOutputMode || 'raw'
  );
  const [jsonData, setJsonData] = useState<JsonData | null>(data?.jsonData || null);
  const [formattedString, setFormattedString] = useState<string>(data?.formattedString || 'No output yet');
  const [dimensionValue, setDimensionValue] = useState<number>(data?.dimensionValue || 0);
  const [selectedParameters, setSelectedParameters] = useState<SelectedParameter[]>(
    data?.selectedParameters || []
  );
  
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
      return 'No parameters selected';
    }
    
    const formatTemplate = data?.formatTemplate || '**{label}**, {value};';
    const trimWhitespace = data?.trimWhitespace !== false;
    const handleNullValues = data?.handleNullValues || 'skip';
    
    // Sort selected parameters by order
    const sortedParams = [...selectedParameters].sort((a, b) => a.order - b.order);
    
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
        // Assuming the value is already in mm, but you could add conversion logic here if needed
        value = value;
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
    
    // Join the formatted parts
    let result = formattedParts.join(' ');
    
    // Trim whitespace if configured
    if (trimWhitespace) {
      result = result.trim();
    }
    
    return result || 'No output generated';
  }, [jsonData, selectedParameters, data?.formatTemplate, data?.trimWhitespace, data?.handleNullValues]);
  
  // Extract dimension value from selected parameters
  const extractDimensionValue = useCallback(() => {
    if (!jsonData || !jsonData.parameters || !selectedParameters || selectedParameters.length === 0) {
      return 0;
    }
    
    // Use the first selected parameter with a numeric value
    for (const selectedParam of selectedParameters) {
      if (!selectedParam.paramId) continue;
      
      const param = jsonData.parameters?.find(p => p.id === selectedParam.paramId);
      if (!param) continue;
      
      // Check if the value is numeric
      const value = param.value;
      if (typeof value === 'number' && !isNaN(value)) {
        // Apply conversion if needed
        if (selectedParam.convertToMillimeters && param.valueType === 'length') {
          // Assuming the value is already in mm, but you could add conversion logic here if needed
          return value;
        }
        return value;
      }
    }
    
    return 0;
  }, [jsonData, selectedParameters]);
  
  // Update node data when dimension output mode changes
  useEffect(() => {
    if (id) {
      setNodes(nodes => 
        nodes.map(node => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                dimensionOutputMode
              }
            };
          }
          return node;
        })
      );
    }
  }, [dimensionOutputMode, id, setNodes]);
  
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
      
      // If we have JSON data, update the formatted string and dimension value
      if (jsonData) {
        const formatted = formatParameters();
        setFormattedString(formatted);
        
        const dimension = extractDimensionValue();
        setDimensionValue(dimension);
      }
    }
  }, [selectedParameters, id, setNodes, jsonData, formatParameters, extractDimensionValue]);
  
  // Process incoming JSON data and update formatted string and dimension value
  useEffect(() => {
    if (id && jsonData) {
      // Format parameters
      const formatted = formatParameters();
      setFormattedString(formatted);
      
      // Extract dimension value
      const dimension = extractDimensionValue();
      setDimensionValue(dimension);
      
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
                dimensionValue: dimension,
                outputValue: formatted
              }
            };
          }
          return node;
        })
      );
      
      // Update node internals to refresh handles
      updateNodeInternals(id);
    }
  }, [id, jsonData, formatParameters, extractDimensionValue, setNodes, updateNodeInternals]);
  
  // Check for incoming connections and update JSON data
  useEffect(() => {
    if (!id) return;
    
    const edges = getEdges();
    const nodes = getNodes();
    
    // Find edges where this node is the target
    const incomingEdges = edges.filter(edge => edge.target === id);
    
    // Process each incoming edge
    incomingEdges.forEach(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      if (sourceNode && sourceNode.data.jsonData) {
        // Update JSON data if it's different
        if (JSON.stringify(sourceNode.data.jsonData) !== JSON.stringify(jsonData)) {
          setJsonData(sourceNode.data.jsonData);
        }
      }
    });
  }, [id, getEdges, getNodes, jsonData]);
  
  // Add event listener for custom events from the static component
  useEffect(() => {
    const handleOutputModeChange = (event: CustomEvent) => {
      setDimensionOutputMode(event.detail.mode);
    };
    
    // Add event listener
    window.addEventListener('dimensionOutputModeChange', handleOutputModeChange as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('dimensionOutputModeChange', handleOutputModeChange as EventListener);
    };
  }, []);
  
  // Merge the state into the data
  const enhancedData = {
    ...data,
    dimensionOutputMode,
    formattedString,
    dimensionValue,
    jsonData,
    selectedParameters,
    // Add callbacks for the static component to use
    onOutputModeChange: (mode: string) => {
      setDimensionOutputMode(mode);
    },
    onSelectParameter: handleSelectParameter,
    onToggleConvertToMillimeters: handleToggleConvertToMillimeters,
    onUpdateCustomLabel: handleUpdateCustomLabel
  };
  
  // Render the static component with enhanced data
  return <JsonParameterFormatterNode {...props} data={enhancedData} />;
};

export default React.memo(ClientJsonParameterFormatterNode); 