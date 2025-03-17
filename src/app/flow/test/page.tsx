'use client';

import React from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  NodeTypes
} from '@xyflow/react';
import { SimpleCalculatorNode, NumberInputNode } from '../../../components/nodes';
import '../flow.css';

// Define custom node types
const nodeTypes: NodeTypes = {
  simpleCalculator: SimpleCalculatorNode,
  numberInput: NumberInputNode
};

// Initial nodes with just one calculator node for testing
const initialNodes = [
  {
    id: 'calculator-test',
    type: 'simpleCalculator',
    position: { x: 250, y: 200 },
    data: { 
      label: 'Test Calculator',
      operation: 'add'
    }
  }
];

// No edges initially
const initialEdges = [];

function TestFlow() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default function TestPage() {
  return (
    <ReactFlowProvider>
      <TestFlow />
    </ReactFlowProvider>
  );
} 