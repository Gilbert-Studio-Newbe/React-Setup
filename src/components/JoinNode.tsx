'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { NodeProps, useReactFlow, useNodes, useEdges } from '@xyflow/react';
import BaseNode, { BaseNodeData } from './BaseNode';

interface JoinNodeData extends BaseNodeData {
  input1?: string;
  input2?: string;
  separator?: string;
  result?: string;
}

const defaultData: JoinNodeData = {
  label: 'Join',
  input1: '',
  input2: '',
  separator: ' ',
  result: '',
  outputValue: ''
};

const JoinNode: React.FC<NodeProps<JoinNodeData>> = ({ data = defaultData, isConnectable, id }) => {
  const { setNodes } = useReactFlow();
  const nodes = useNodes();
  const edges = useEdges();

  // Initialize state with default values or data props
  const [input1, setInput1] = useState<string>(data.input1 ?? '');
  const [input2, setInput2] = useState<string>(data.input2 ?? '');
  const [separator, setSeparator] = useState<string>(data.separator ?? ' ');
  const [result, setResult] = useState<string>(data.result ?? '');

  // Concatenate values based on inputs and separator
  const concatenateValues = useCallback(() => {
    // Convert inputs to strings if they aren't already
    const str1 = String(input1);
    const str2 = String(input2);
    
    // Join the strings with the separator
    const joinedResult = str1 + separator + str2;
    setResult(joinedResult);

    // Update node data with new result
    setNodes(nds => 
      nds.map(node => {
        if (node.id === id) {
          const newData: JoinNodeData = {
            ...node.data,
            result: joinedResult,
            outputValue: joinedResult,
            input1,
            input2,
            separator
          };
          return {
            ...node,
            data: newData
          };
        }
        return node;
      })
    );
  }, [input1, input2, separator, id, setNodes]);

  // Handle incoming connections and updates
  useEffect(() => {
    if (!id) return;

    // Find all edges that connect to this node
    const incomingEdges = edges.filter(edge => edge.target === id);

    // Reset inputs that have no connected edges
    const hasInput1Connection = incomingEdges.some(edge => edge.targetHandle === 'input1');
    const hasInput2Connection = incomingEdges.some(edge => edge.targetHandle === 'input2');

    if (!hasInput1Connection) {
      setInput1('');
    }
    if (!hasInput2Connection) {
      setInput2('');
    }

    // Process each incoming connection
    incomingEdges.forEach(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      if (!sourceNode?.data) return;

      // Get the value from the source node with type checking
      let value: string = '';
      const nodeData = sourceNode.data as Record<string, unknown>;
      
      if (nodeData.value !== undefined) {
        value = String(nodeData.value);
      } else if (nodeData.outputValue !== undefined) {
        value = String(nodeData.outputValue);
      } else if (nodeData.result !== undefined) {
        value = String(nodeData.result);
      }

      // Update the appropriate input based on the target handle
      if (edge.targetHandle === 'input1' && value !== input1) {
        setInput1(value);
      } else if (edge.targetHandle === 'input2' && value !== input2) {
        setInput2(value);
      }
    });
  }, [edges, nodes, id, input1, input2]);

  // Recalculate when inputs or separator changes
  useEffect(() => {
    concatenateValues();
  }, [input1, input2, separator, concatenateValues]);

  // Handle separator change
  const handleSeparatorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeparator(e.target.value);
  };

  return (
    <BaseNode<JoinNodeData>
      data={data}
      isConnectable={isConnectable}
      handles={{
        inputs: [
          { 
            id: 'input1', 
            position: 30, 
            style: { 
              background: '#6366f1',
              border: '2px solid #6366f1',
              width: '10px',
              height: '10px'
            } 
          },
          { 
            id: 'input2', 
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
              background: '#f59e0b',
              border: '2px solid #f59e0b',
              width: '10px',
              height: '10px'
            }
          }
        ]
      }}
    >
      {/* Separator Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Separator:
        </label>
        <input
          type="text"
          value={separator}
          onChange={handleSeparatorChange}
          className="
            nodrag
            w-full p-2 rounded-md 
            border border-gray-300 dark:border-gray-600 
            bg-gray-50 dark:bg-gray-700 
            text-gray-800 dark:text-gray-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            hover:border-gray-400 dark:hover:border-gray-500
            transition-all duration-200
          "
          placeholder="Space, comma, etc."
        />
      </div>

      {/* Input Values Display */}
      <div className="mb-4 space-y-2">
        <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          <span className="text-sm text-gray-600 dark:text-gray-300">Input 1:</span>
          <span className="font-mono text-gray-800 dark:text-gray-200 truncate max-w-[150px]">{input1}</span>
        </div>
        <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          <span className="text-sm text-gray-600 dark:text-gray-300">Input 2:</span>
          <span className="font-mono text-gray-800 dark:text-gray-200 truncate max-w-[150px]">{input2}</span>
        </div>
      </div>

      {/* Result Display */}
      <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Result:</span>
          <span className="font-mono text-blue-600 dark:text-blue-400 truncate max-w-[180px]">
            {result}
          </span>
        </div>
      </div>
    </BaseNode>
  );
};

export default React.memo(JoinNode); 