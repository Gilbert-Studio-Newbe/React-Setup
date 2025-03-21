'use client';

import React, { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import Toast from './Toast';

interface NodeSelectorProps {
  className?: string;
}

const NodeSelector: React.FC<NodeSelectorProps> = ({ className }) => {
  const { addNodes, screenToFlowPosition } = useReactFlow();
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const nodeTypes = [
    { type: 'numberinput', label: 'Number Input' },
    { type: 'costinput', label: 'Cost Input' },
    { type: 'calculation', label: 'Calculation' },
    { type: 'join', label: 'Join String' },
    { type: 'csvimport', label: 'CSV Import' },
    { type: 'result', label: 'Result' },
    { type: 'ifcimport', label: 'IFC Import' },
    { type: 'jsonload', label: 'JSON Load' },
    { type: 'jsondisplay', label: 'JSON Display' },
    { type: 'debugdisplay', label: 'Debug Display' },
    { type: 'materialcost', label: 'Material Cost' },
    { type: 'jsonparameterformatter', label: 'Parameter Formatter' },
  ];

  const addNode = (type: string) => {
    // Get the center of the viewport
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Convert screen coordinates to flow coordinates
    const position = screenToFlowPosition({ x: centerX, y: centerY });
    
    // Create a unique ID
    const id = `${type}-${Date.now()}`;
    
    // Initialize with empty data - will be populated in the switch statement
    let data: any = {};
    let style = {};
    let nodeConfig: any = {
      id,
      type,
      position,
      data,
    };
    
    // Configure specific node types
    switch (type) {
      case 'numberinput':
        // Number input node with default configuration
        data = {
          label: 'Number Input',
          value: 0,
          min: 0,
          max: 100,
          step: 1,
          unit: ''
        };
        break;
      case 'costinput':
        // Cost input node with default configuration
        data = {
          label: 'Cost Input',
          value: 0,
          currency: '$',
          description: 'Enter cost amount'
        };
        break;
      case 'calculation':
        // Calculation node with default configuration
        data = {
          label: 'Calculation',
          operation: 'add',
          result: 0
        };
        break;
      case 'join':
        // Join node with default configuration
        data = {
          label: 'Join String',
          input1: '',
          input2: '',
          separator: ' ',
          result: ''
        };
        break;
      case 'csvimport':
        // CSV Import node with default configuration
        data = {
          label: 'CSV Import',
          fileName: '',
          headers: [],
          rowCount: 0,
          previewRows: [],
          isCollapsed: false
        };
        break;
      case 'materialcost':
        // Material Cost node with default configuration
        data = {
          label: 'Material Cost',
          inputString: '',
          csvData: [],
          matchingRecords: [],
          cost: null,
          error: ''
        };
        break;
      case 'jsonparameterformatter':
        // Prompt for a custom label
        const formatterLabel = prompt('Enter a label for the Parameter Formatter node:', 'Parameter Formatter');
        
        // Use the provided label or default if canceled
        const actualFormatterLabel = formatterLabel || 'Parameter Formatter';
        
        data = {
          label: actualFormatterLabel,
          jsonData: null,
          selectedParameters: [
            { paramId: null, order: 0, customLabel: '' },
            { paramId: null, order: 1, customLabel: '' },
            { paramId: null, order: 2, customLabel: '' },
            { paramId: null, order: 3, customLabel: '' },
            { paramId: null, order: 4, customLabel: '' }
          ],
          dimensionParameter: null,
          formatTemplate: '**{label}**, {value};',
          trimWhitespace: true,
          handleNullValues: 'skip',
          formattedString: '',
          dimensionValue: null
        };
        break;
      case 'result':
        // Result node with default configuration
        data = {
          label: 'Result',
          value: 0,
          unit: '',
          description: 'Final calculation result'
        };
        break;
      case 'ifcimport':
        // IFC Import node with default configuration
        data = {
          label: 'IFC Import',
          onFileImport: (file: File) => {
            console.log('IFC file imported:', file.name);
          }
        };
        break;
      case 'jsonload':
        // JSON Load node with default configuration
        data = {
          label: 'JSON Load',
          jsonData: null, // Initialize with null to ensure the property exists
          onJsonLoad: (jsonData: any) => {
            console.log('JSON data loaded:', jsonData);
          }
        };
        break;
      case 'jsondisplay':
        // JSON Display node with default configuration
        data = {
          label: 'JSON Display',
          onChange: (paramId: string, newValue: any) => {
            console.log('Parameter updated:', paramId, newValue);
          },
          outputMode: 'raw' // Default to raw output mode
        };
        break;
      case 'debugdisplay':
        // Debug Display node with default configuration
        data = {
          label: 'Debug Display',
          value: null,
          description: 'Connect to any node to see its data'
        };
        break;
    }
    
    // Update the nodeConfig with the populated data
    nodeConfig.data = data;
    
    // Add the node to the flow
    addNodes(nodeConfig);
    
    // Show toast notification
    setToast({ message: `Added ${nodeTypes.find(nt => nt.type === type)?.label || type} to the canvas` });
  };

  return (
    <>
      <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg ${className}`}>
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Add Node</h3>
        <div className="grid grid-cols-2 gap-3">
          {nodeTypes.map((node) => (
            <button
              key={node.type}
              onClick={() => addNode(node.type)}
              className="px-4 py-3 bg-white hover:bg-gray-50 text-black border-2 border-black rounded-md shadow transition-all duration-200 text-sm font-medium flex items-center justify-center"
            >
              {node.label}
            </button>
          ))}
        </div>
      </div>
      
      {toast && (
        <Toast 
          message={toast.message} 
          onClose={() => setToast(null)} 
        />
      )}
    </>
  );
};

export default NodeSelector; 