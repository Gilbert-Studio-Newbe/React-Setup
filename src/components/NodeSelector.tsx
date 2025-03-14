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
    { type: 'numberinput', label: 'Number Input Node' },
    { type: 'costinput', label: 'Cost Input Node' },
    { type: 'calculation', label: 'Calculation Node' },
    { type: 'join', label: 'Join Node' },
    { type: 'csvimport', label: 'CSV Import Node' },
    { type: 'result', label: 'Result Node' },
    { type: 'ifcimport', label: 'IFC Import Node' },
    { type: 'jsonload', label: 'JSON Load Node' },
    { type: 'jsondisplay', label: 'JSON Display Node' },
    { type: 'debugdisplay', label: 'Debug Display Node' },
  ];

  const addNode = (type: string) => {
    // Get the center of the viewport
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Convert screen coordinates to flow coordinates
    const position = screenToFlowPosition({ x: centerX, y: centerY });
    
    // Create a unique ID
    const id = `${type}-${Date.now()}`;
    
    // Create the node data based on type
    let data: any = { label: `New ${type} Node` };
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
          label: 'Join',
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