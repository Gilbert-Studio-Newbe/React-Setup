'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';

import {
  nodes as initialNodes,
  edges as initialEdges,
} from '@/components/initial-elements';
import AnnotationNode from '@/components/AnnotationNode';
import ToolbarNode from '@/components/ToolbarNode';
import ResizerNode from '@/components/ResizerNode';
import CircleNode from '@/components/CircleNode';
import TextInputNode from '@/components/TextInputNode';
import ButtonEdge from '@/components/ButtonEdge';

const nodeTypes = {
  annotation: AnnotationNode,
  tools: ToolbarNode,
  resizer: ResizerNode,
  circle: CircleNode,
  textinput: TextInputNode,
};

const edgeTypes = {
  button: ButtonEdge,
};

const nodeClassName = (node: any) => node.type;

export default function FlowPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  return (
    <div className="w-screen h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        attributionPosition="top-right"
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        className="bg-[#F7F9FB] dark:bg-[#1a1a1a]"
      >
        <MiniMap zoomable pannable nodeClassName={nodeClassName} />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
} 