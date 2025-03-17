'use client';

import { useCallback } from 'react';
import {
  ReactFlow as Flow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { SimpleCalculatorNode, DebugNode, NumberInputNode } from '@/components/nodes';

// Define the node types
const nodeTypes = {
  numberInput: NumberInputNode,
  calculator: SimpleCalculatorNode,
  debug: DebugNode,
};

// Initial nodes for the flow
const initialNodes = [
  {
    id: 'input1',
    type: 'numberInput',
    position: { x: 100, y: 100 },
    data: { value: 5, result: 5 },
  },
  {
    id: 'input2',
    type: 'numberInput',
    position: { x: 100, y: 250 },
    data: { value: 10, result: 10 },
  },
  {
    id: 'calculator1',
    type: 'calculator',
    position: { x: 400, y: 175 },
    data: { operation: 'add' },
  },
  {
    id: 'debug1',
    type: 'debug',
    position: { x: 700, y: 175 },
    data: {},
  },
];

// Initial edges for the flow
const initialEdges = [
  {
    id: 'edge-input1-calculator1',
    source: 'input1',
    target: 'calculator1',
    sourceHandle: 'result',
    targetHandle: 'input1',
  },
  {
    id: 'edge-input2-calculator1',
    source: 'input2',
    target: 'calculator1',
    sourceHandle: 'result',
    targetHandle: 'input2',
  },
  {
    id: 'edge-calculator1-debug1',
    source: 'calculator1',
    target: 'debug1',
    sourceHandle: 'result',
    targetHandle: 'input',
  },
];

// The Flow component that uses React Flow hooks
function FlowComponent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowInstance = useReactFlow();
  
  // Handle new connections
  const onConnect = useCallback(
    (connection) => {
      console.log('New connection:', connection);
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );
  
  // Add a new calculator node
  const addCalculatorNode = useCallback(
    (operation) => {
      const id = `calculator-${nodes.length + 1}`;
      const newNode = {
        id,
        type: 'calculator',
        position: { x: 400, y: 350 },
        data: { operation },
      };
      
      setNodes((nds) => [...nds, newNode]);
    },
    [nodes, setNodes]
  );
  
  // Add a new debug node
  const addDebugNode = useCallback(() => {
    const id = `debug-${nodes.length + 1}`;
    const newNode = {
      id,
      type: 'debug',
      position: { x: 700, y: 350 },
      data: {},
    };
    
    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes]);
  
  // Add a new number input node
  const addNumberInputNode = useCallback(() => {
    const id = `input-${nodes.length + 1}`;
    const newNode = {
      id,
      type: 'numberInput',
      position: { x: 100, y: 350 },
      data: { value: 0, result: 0 },
    };
    
    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes]);
  
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div className="controls">
        <h3>Add Nodes</h3>
        <div className="buttons">
          <button onClick={() => addNumberInputNode()}>Add Number Input</button>
          <button onClick={() => addCalculatorNode('add')}>Add Calculator (+)</button>
          <button onClick={() => addCalculatorNode('subtract')}>Add Calculator (-)</button>
          <button onClick={() => addCalculatorNode('multiply')}>Add Calculator (×)</button>
          <button onClick={() => addCalculatorNode('divide')}>Add Calculator (÷)</button>
          <button onClick={() => addDebugNode()}>Add Debug Node</button>
        </div>
      </div>
      
      <Flow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </Flow>
      
      <style jsx>{`
        .controls {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 10;
          background: white;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .controls h3 {
          margin-top: 0;
          margin-bottom: 10px;
        }
        
        .buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        
        .buttons button {
          padding: 5px 10px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 3px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .buttons button:hover {
          background: #e0e0e0;
        }
      `}</style>
    </div>
  );
}

// The CalculatorExample component that wraps FlowComponent with ReactFlowProvider
export default function CalculatorExample() {
  return (
    <ReactFlowProvider>
      <FlowComponent />
    </ReactFlowProvider>
  );
} 