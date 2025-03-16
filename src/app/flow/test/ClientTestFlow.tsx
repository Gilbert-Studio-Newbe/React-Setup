'use client';

import React, { useCallback } from 'react';
import {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionLineType,
  MarkerType,
  Panel,
  ReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Import components using barrel files
import {
  NumberInputNode,
  CostInputNode,
  CalculationNode,
  ResultNode,
  StyledEdge,
  NodeSelector,
  SafeReactFlowProvider
} from '../../../components';

// Define node types
const nodeTypes = {
  numberinput: NumberInputNode,
  costinput: CostInputNode,
  calculation: CalculationNode,
  result: ResultNode,
};

// Define edge types
const edgeTypes = {
  default: StyledEdge,
};

// Create initial nodes
const initialNodes = [
  // Row 1: Input nodes
  {
    id: 'numberinput-1',
    type: 'numberinput',
    data: { 
      label: 'Area Input',
      value: 10,
      min: 0,
      max: 100,
      step: 1,
      unit: 'm²'
    },
    position: { x: 50, y: 50 },
  },
  {
    id: 'numberinput-2',
    type: 'numberinput',
    data: { 
      label: 'Height Input',
      value: 5,
      min: 0,
      max: 100,
      step: 1,
      unit: 'm'
    },
    position: { x: 50, y: 150 },
  },
  {
    id: 'costinput-1',
    type: 'costinput',
    data: { 
      label: 'Cost Input',
      value: 25,
      currency: '$',
      description: 'Cost per square meter'
    },
    position: { x: 50, y: 250 },
  },
  
  // Row 2: Calculation nodes
  {
    id: 'calculation-1',
    type: 'calculation',
    data: { 
      label: 'Area × Height',
      operation: 'multiply',
      result: 0
    },
    position: { x: 350, y: 100 },
  },
  {
    id: 'calculation-2',
    type: 'calculation',
    data: { 
      label: 'Volume × Cost',
      operation: 'multiply',
      result: 0
    },
    position: { x: 350, y: 250 },
  },
  
  // Row 3: Result node
  {
    id: 'result-1',
    type: 'result',
    data: { 
      label: 'Total Cost',
      value: 0,
      unit: '$',
      description: 'Final calculation result'
    },
    position: { x: 650, y: 175 },
  },
];

// Create connections between nodes
const initialEdges = [
  // Connect inputs to first calculation
  { 
    id: 'e1-3', 
    source: 'numberinput-1', 
    target: 'calculation-1',
    type: 'default',
  },
  { 
    id: 'e2-3', 
    source: 'numberinput-2', 
    target: 'calculation-1',
    type: 'default',
  },
  
  // Connect first calculation and cost input to second calculation
  { 
    id: 'e3-4', 
    source: 'calculation-1', 
    target: 'calculation-2',
    type: 'default',
  },
  { 
    id: 'e5-4', 
    source: 'costinput-1', 
    target: 'calculation-2',
    type: 'default',
  },
  
  // Connect second calculation to result
  { 
    id: 'e4-6', 
    source: 'calculation-2', 
    target: 'result-1',
    type: 'default',
  },
];

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: 'default',
        }}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
        
        <Panel position="top-right" className="m-4">
          <NodeSelector />
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function ClientTestFlow() {
  return (
    <SafeReactFlowProvider>
      <Flow />
    </SafeReactFlowProvider>
  );
} 