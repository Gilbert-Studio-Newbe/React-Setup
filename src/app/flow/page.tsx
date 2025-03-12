'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useKeyPress,
  useOnSelectionChange,
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
import NodeSelector from '@/components/NodeSelector';
import Toast from '@/components/Toast';
import HelpPanel from '@/components/HelpPanel';
import NumberInputNode from '@/components/NumberInputNode';
import CostInputNode from '@/components/CostInputNode';
import CalculationNode from '@/components/CalculationNode';

const nodeTypes = {
  annotation: AnnotationNode,
  tools: ToolbarNode,
  resizer: ResizerNode,
  circle: CircleNode,
  textinput: TextInputNode,
  numberinput: NumberInputNode,
  costinput: CostInputNode,
  calculation: CalculationNode,
};

const edgeTypes = {
  button: ButtonEdge,
};

const nodeClassName = (node: any) => node.type;

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [toast, setToast] = React.useState<{ message: string } | null>(null);
  const selectedNodesRef = useRef<string[]>([]);
  
  const deletePressed = useKeyPress('Delete');
  
  // Track selected nodes
  useOnSelectionChange({
    onChange: ({ nodes }) => {
      selectedNodesRef.current = nodes.map(node => node.id);
    },
  });
  
  // Handle delete key press
  useEffect(() => {
    if (deletePressed && selectedNodesRef.current.length > 0) {
      setNodes(nds => nds.filter(node => !selectedNodesRef.current.includes(node.id)));
      setToast({ message: `Deleted ${selectedNodesRef.current.length} node(s)` });
      selectedNodesRef.current = [];
    }
  }, [deletePressed, setNodes]);
  
  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  return (
    <div className="w-screen h-screen relative">
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
        deleteKeyCode="Delete"
      >
        <MiniMap zoomable pannable nodeClassName={nodeClassName} />
        <Controls />
        <Background />
      </ReactFlow>
      <NodeSelector className="absolute top-4 left-4 z-10" />
      <HelpPanel className="absolute top-4 right-4 z-10" />
      
      {toast && (
        <Toast 
          message={toast.message} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}

// Wrap the Flow component with ReactFlowProvider to ensure context is available
export default function FlowPage() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
} 