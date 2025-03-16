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
  const { setNodes, getNodes, getEdges } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  
  // State for node data
  const [jsonData, setJsonData] = useState<JsonData | null>(data?.jsonData || null);
  const [formattedString, setFormattedString] = useState<string>(data?.formattedString || 'No output yet');
  const [selectedParameters, setSelectedParameters] = useState<SelectedParameter[]>(
    data?.selectedParameters || []
  );
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
  
  // Process incoming JSON data and update formatted string
  useEffect(() => {
    if (id && jsonData) {
      // Format parameters
      const formatted = formatParameters();
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
  }, [id, jsonData, formatParameters, setNodes, updateNodeInternals]);
  
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
              onSelectParameter: handleSelectParameter,
              onToggleConvertToMillimeters: handleToggleConvertToMillimeters,
              onUpdateCustomLabel: handleUpdateCustomLabel,
              isParametersVisible, // Pass the visibility state
              toggleParametersVisibility // Pass the toggle function
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
    handleSelectParameter, 
    handleToggleConvertToMillimeters, 
    handleUpdateCustomLabel,
    isParametersVisible, // Add to dependency array
    toggleParametersVisibility // Add to dependency array
  ]);
  
  // Merge the state into the data
  const enhancedData = {
    ...data,
    formattedString,
    jsonData,
    selectedParameters,
    // Add callbacks for the static component to use
    onSelectParameter: handleSelectParameter,
    onToggleConvertToMillimeters: handleToggleConvertToMillimeters,
    onUpdateCustomLabel: handleUpdateCustomLabel,
    isParametersVisible, // Pass the visibility state
    toggleParametersVisibility // Pass the toggle function
  };
  
  // Render the static component with enhanced data
  return <JsonParameterFormatterNode {...props} data={enhancedData} />;
};

export default memo(ClientJsonParameterFormatterNode); 