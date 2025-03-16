'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ReactFlowProvider, 
  Background, 
  Controls, 
  MiniMap, 
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Panel,
  ConnectionLineType,
  Connection,
  addEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Define initial nodes
const initialNodes: Node[] = [
  {
    id: 'input-1',
    type: 'input',
    data: { label: 'Input Node 1' },
    position: { x: 250, y: 100 },
    style: {
      background: '#fff',
      border: '1px solid #ddd',
      padding: 10,
      borderRadius: 5,
      width: 150,
    },
  },
  {
    id: 'output-1',
    type: 'output',
    data: { label: 'Output Node 1' },
    position: { x: 500, y: 100 },
    style: {
      background: '#fff',
      border: '1px solid #ddd',
      padding: 10,
      borderRadius: 5,
      width: 150,
    },
  }
];

// Define initial edges
const initialEdges: Edge[] = [];

// Simple Flow component
const SimpleFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: '#555' }
    }, eds));
  }, [setEdges]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#aaa" gap={20} size={1} variant="dots" />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <div className="px-4 py-2 bg-green-500 text-white rounded shadow">
            Flow page loaded successfully
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default function SimpleFlowPage() {
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render on client side
  if (!isClient) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading Flow Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <ReactFlowProvider>
        <SimpleFlow />
      </ReactFlowProvider>
    </div>
  );
} 