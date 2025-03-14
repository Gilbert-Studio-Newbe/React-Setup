'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NodeProps, useReactFlow, useNodes, useEdges } from '@xyflow/react';
import BaseNode, { BaseNodeData } from './BaseNode';

interface MaterialCostNodeData extends BaseNodeData {
  inputString?: string;
  csvData?: any[];
  matchingRecords?: any[];
  cost?: string | number;
  error?: string;
}

const defaultData: MaterialCostNodeData = {
  label: 'Material Cost',
  inputString: '',
  csvData: [],
  matchingRecords: [],
  cost: null,
  error: ''
};

// Parse the input string to extract parameters
const parseInputString = (inputStr: string) => {
  if (!inputStr) return {};
  
  const parts = inputStr.split(';');
  const result: Record<string, string> = {};
  
  parts.forEach(part => {
    const cleanPart = part.replace(/\*\*/g, '').trim();
    if (cleanPart) {
      const [key, value] = cleanPart.split(',').map(s => s.trim());
      if (key && value) {
        result[key] = value;
      }
    }
  });
  
  return result;
};

// Find exact matches with special handling for unspecified parameters
const findExactMatchesWithDefaults = (records: any[], criteria: Record<string, string>) => {
  if (!records || !records.length) return [];
  
  // First filter for exact matches on the specified criteria
  const exactMatches = records.filter(record => {
    // Check each specified parameter for exact match
    if (criteria.Grade !== undefined && record.Grade !== criteria.Grade) return false;
    if (criteria.Height !== undefined && record['Height (mm)'] !== criteria.Height) return false;
    if (criteria.Width !== undefined && record['Width (mm)'] !== criteria.Width) return false;
    if (criteria.Treatment !== undefined && record.Treatment !== criteria.Treatment) return false;
    
    // If we're here, all specified criteria match
    return true;
  });
  
  // If Treatment wasn't specified in the criteria, prefer records with empty Treatment
  if (exactMatches.length > 0 && criteria.Treatment === undefined) {
    const defaultMatches = exactMatches.filter(record => 
      record.Treatment === "" || record.Treatment === undefined
    );
    
    if (defaultMatches.length > 0) {
      return defaultMatches;
    }
    
    // If no empty Treatment matches, return all matches
    return exactMatches;
  }
  
  return exactMatches;
};

const MaterialCostNode: React.FC<NodeProps<MaterialCostNodeData>> = ({ data = defaultData, isConnectable, id }) => {
  const { setNodes } = useReactFlow();
  const edges = useEdges();
  const nodes = useNodes();
  
  // Initialize state with default values or data props
  const [inputString, setInputString] = useState<string>(data.inputString || '');
  const [csvData, setCsvData] = useState<any[]>(data.csvData || []);
  const [matchingRecords, setMatchingRecords] = useState<any[]>(data.matchingRecords || []);
  const [cost, setCost] = useState<string | number | null>(data.cost || null);
  const [error, setError] = useState<string>(data.error || '');
  
  // Get input data from connected nodes
  useEffect(() => {
    if (!id) return;
    
    // Find edges connected to this node's input
    const incomingEdges = edges.filter(edge => edge.target === id);
    
    let newInputString = '';
    let newCsvData: any[] = [];
    
    // Process each incoming connection
    incomingEdges.forEach(edge => {
      // Find the source node
      const sourceNode = nodes.find(node => node.id === edge.source);
      if (!sourceNode) return;
      
      // Handle different source node types
      if (edge.targetHandle === 'input-string') {
        // Get string input from source node
        if (sourceNode.data.outputValue !== undefined) {
          newInputString = String(sourceNode.data.outputValue);
        }
      } else if (edge.targetHandle === 'input-csv') {
        // Get CSV data from source node
        if (sourceNode.data.csvData) {
          newCsvData = sourceNode.data.csvData;
        } else if (sourceNode.data.outputValue && Array.isArray(sourceNode.data.outputValue)) {
          newCsvData = sourceNode.data.outputValue;
        }
      }
    });
    
    // Update state with new values
    if (newInputString !== inputString) {
      setInputString(newInputString);
    }
    
    if (newCsvData.length > 0 && JSON.stringify(newCsvData) !== JSON.stringify(csvData)) {
      setCsvData(newCsvData);
    }
    
  }, [edges, nodes, id, inputString, csvData]);
  
  // Process data and find matches when inputs change
  useEffect(() => {
    if (!inputString || !csvData.length) {
      // Reset if we don't have both inputs
      if (matchingRecords.length > 0) setMatchingRecords([]);
      if (cost !== null) setCost(null);
      if (error) setError('');
      return;
    }
    
    try {
      // Parse the input string
      const parsedInput = parseInputString(inputString);
      
      // Check if we have any criteria
      if (Object.keys(parsedInput).length === 0) {
        setError('No valid parameters found in input string');
        setMatchingRecords([]);
        setCost(null);
        return;
      }
      
      // Find matching records
      const matches = findExactMatchesWithDefaults(csvData, parsedInput);
      setMatchingRecords(matches);
      
      // Extract cost from first matching record
      if (matches.length > 0) {
        // Look for cost field with various possible names
        const costField = matches[0]['Cost ($Lm)'] || matches[0]['Cost'] || matches[0]['Price'] || null;
        setCost(costField);
        setError('');
      } else {
        setCost(null);
        setError('No matching records found');
      }
    } catch (err) {
      setError(`Error processing data: ${err instanceof Error ? err.message : String(err)}`);
      setMatchingRecords([]);
      setCost(null);
    }
  }, [inputString, csvData]);
  
  // Update node data when state changes
  useEffect(() => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              inputString,
              csvData,
              matchingRecords,
              cost,
              error,
              outputValue: cost
            }
          };
        }
        return node;
      })
    );
  }, [inputString, csvData, matchingRecords, cost, error, id, setNodes]);
  
  // Format the criteria for display
  const formattedCriteria = useMemo(() => {
    if (!inputString) return 'None';
    const criteria = parseInputString(inputString);
    return Object.entries(criteria)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }, [inputString]);
  
  return (
    <BaseNode<MaterialCostNodeData>
      data={data}
      isConnectable={isConnectable}
      error={error}
      handles={{
        inputs: [
          { 
            id: 'input-string', 
            position: 30, 
            style: { 
              background: '#6366f1',
              border: '2px solid #6366f1',
              width: '10px',
              height: '10px'
            } 
          },
          { 
            id: 'input-csv', 
            position: 70, 
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
              background: error ? '#ef4444' : '#f59e0b',
              border: error ? '2px solid #ef4444' : '2px solid #f59e0b',
              width: '10px',
              height: '10px'
            }
          }
        ]
      }}
    >
      {/* Input Information */}
      <div className="mb-4 space-y-2">
        <div className="flex flex-col p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Input String:</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">(Left Input)</span>
          </div>
          <div className="font-mono text-sm text-gray-800 dark:text-gray-200 truncate max-w-full">
            {inputString || 'No input'}
          </div>
        </div>
        
        <div className="flex flex-col p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">CSV Data:</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">(Right Input)</span>
          </div>
          <div className="font-mono text-sm text-gray-800 dark:text-gray-200">
            {csvData.length > 0 ? `${csvData.length} records` : 'No data'}
          </div>
        </div>
      </div>
      
      {/* Search Criteria */}
      <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Criteria:</div>
        <div className="text-sm text-gray-800 dark:text-gray-200">
          {formattedCriteria}
        </div>
      </div>
      
      {/* Results */}
      <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Material Cost:</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {matchingRecords.length > 0 ? `${matchingRecords.length} matches` : 'No matches'}
          </span>
        </div>
        <div className="font-mono text-lg font-bold text-green-600 dark:text-green-400 text-center">
          {cost !== null ? `$${cost}` : 'N/A'}
        </div>
      </div>
    </BaseNode>
  );
};

export default React.memo(MaterialCostNode); 