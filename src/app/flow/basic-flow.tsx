'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  addEdge,
  Connection,
  Edge,
  Panel
} from '@xyflow/react';
import './flow.css';

const initialNodes = [
  {
    id: '1',
    position: { x: 100, y: 100 },
    data: { label: 'Node 1' },
    style: { 
      background: '#fff', 
      color: '#333',
      border: '1px solid #ddd',
      borderRadius: '3px',
      padding: '10px',
      width: '150px'
    }
  },
  {
    id: '2',
    position: { x: 300, y: 200 },
    data: { label: 'Node 2' },
    style: { 
      background: '#fff', 
      color: '#333',
      border: '1px solid #ddd',
      borderRadius: '3px',
      padding: '10px',
      width: '150px'
    }
  },
  {
    id: '3',
    position: { x: 500, y: 100 },
    data: { label: 'Node 3' },
    style: { 
      background: '#fff', 
      color: '#333',
      border: '1px solid #ddd',
      borderRadius: '3px',
      padding: '10px',
      width: '150px'
    }
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true }
];

function BasicFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // This function handles the connection of nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      // Create a unique ID for the new edge
      const edgeId = `e${connection.source}-${connection.target}`;
      
      // Check if this edge already exists to prevent duplicates
      const edgeExists = edges.some(edge => 
        edge.source === connection.source && edge.target === connection.target
      );
      
      if (!edgeExists) {
        setEdges((eds) => addEdge({ ...connection, id: edgeId, animated: true }, eds));
      }
    },
    [edges, setEdges]
  );

  // Function to add a new node
  const addNode = useCallback(() => {
    const newNodeId = `${nodes.length + 1}`;
    const newNode = {
      id: newNodeId,
      position: {
        x: Math.random() * 500,
        y: Math.random() * 300,
      },
      data: { label: `Node ${newNodeId}` },
      style: { 
        background: '#fff', 
        color: '#333',
        border: '1px solid #ddd',
        borderRadius: '3px',
        padding: '10px',
        width: '150px'
      }
    };
    
    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{ animated: true }}
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
        <Panel position="top-right">
          <button 
            onClick={addNode}
            className="add-node-button"
          >
            Add Node
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function BasicFlowWithProvider() {
  return (
    <ReactFlowProvider>
      <BasicFlow />
    </ReactFlowProvider>
  );
} 