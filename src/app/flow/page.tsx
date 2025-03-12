'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Node,
  Edge,
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
import AnimatedEdge from '@/components/AnimatedEdge';
import NodeSelector from '@/components/NodeSelector';
import Toast from '@/components/Toast';
import HelpPanel from '@/components/HelpPanel';
import NumberInputNode from '@/components/NumberInputNode';
import CostInputNode from '@/components/CostInputNode';
import CalculationNode from '@/components/CalculationNode';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import SelectionTracker from '@/components/SelectionTracker';
import FlowToolbar from '@/components/FlowToolbar';

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
  animated: AnimatedEdge,
};

const nodeClassName = (node: any) => node.type;

// Maximum number of history states to keep
const MAX_HISTORY_LENGTH = 50;

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const selectedElementsRef = useRef<{nodeIds: string[]; edgeIds: string[]}>({ nodeIds: [], edgeIds: [] });
  
  // History management
  const [history, setHistory] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const isHistoryActionRef = useRef(false);
  
  // Save current state to history when nodes or edges change
  useEffect(() => {
    // Skip if this change was caused by an undo/redo action
    if (isHistoryActionRef.current) {
      isHistoryActionRef.current = false;
      return;
    }
    
    // Create a snapshot of the current state
    const currentState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges))
    };
    
    // If we're not at the end of the history, truncate the future states
    if (currentHistoryIndex < history.length - 1) {
      setHistory(prev => prev.slice(0, currentHistoryIndex + 1));
    }
    
    // Add the new state to history
    setHistory(prev => {
      const newHistory = [...prev, currentState];
      // Limit history length
      if (newHistory.length > MAX_HISTORY_LENGTH) {
        return newHistory.slice(newHistory.length - MAX_HISTORY_LENGTH);
      }
      return newHistory;
    });
    
    // Update the current index
    setCurrentHistoryIndex(prev => {
      const newIndex = prev + 1;
      return newIndex >= MAX_HISTORY_LENGTH ? MAX_HISTORY_LENGTH - 1 : newIndex;
    });
  }, [nodes, edges]);
  
  // Handle undo action
  const handleUndo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      isHistoryActionRef.current = true;
      const prevState = history[currentHistoryIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setCurrentHistoryIndex(currentHistoryIndex - 1);
      
      // Show toast notification
      setToast({ message: 'Undo successful' });
      setTimeout(() => setToast(null), 3000);
    } else {
      // Show toast notification for no more undo
      setToast({ message: 'Nothing to undo' });
      setTimeout(() => setToast(null), 3000);
    }
  }, [history, currentHistoryIndex, setNodes, setEdges]);
  
  // Handle redo action
  const handleRedo = useCallback(() => {
    if (currentHistoryIndex < history.length - 1) {
      isHistoryActionRef.current = true;
      const nextState = history[currentHistoryIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setCurrentHistoryIndex(currentHistoryIndex + 1);
      
      // Show toast notification
      setToast({ message: 'Redo successful' });
      setTimeout(() => setToast(null), 3000);
    } else {
      // Show toast notification for no more redo
      setToast({ message: 'Nothing to redo' });
      setTimeout(() => setToast(null), 3000);
    }
  }, [history, currentHistoryIndex, setNodes, setEdges]);
  
  // Handle selection changes
  const handleSelectionChange = useCallback((nodeIds: string[], edgeIds: string[]) => {
    selectedElementsRef.current = { nodeIds, edgeIds };
  }, []);
  
  // Handle keyboard shortcuts and toolbar actions
  const handleAction = useCallback((action: string, data?: any) => {
    // Handle undo/redo actions
    if (action === 'undo') {
      handleUndo();
      return;
    } else if (action === 'redo') {
      handleRedo();
      return;
    }
    
    // Show toast notification with more detailed information
    let message = `${action.charAt(0).toUpperCase() + action.slice(1)}`;
    
    if (data) {
      if (data.nodeCount !== undefined || data.edgeCount !== undefined) {
        const nodeText = data.nodeCount ? `${data.nodeCount} node${data.nodeCount !== 1 ? 's' : ''}` : '';
        const edgeText = data.edgeCount ? `${data.edgeCount} edge${data.edgeCount !== 1 ? 's' : ''}` : '';
        
        if (nodeText && edgeText) {
          message += ` ${nodeText} and ${edgeText}`;
        } else {
          message += ` ${nodeText}${edgeText}`;
        }
      }
    }
    
    setToast({ message: `${message}` });
    
    // Auto-dismiss toast after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, [handleUndo, handleRedo]);
  
  // Custom connection handler to create animated edges
  const onConnect = useCallback(
    (params: any) => {
      const newEdge = {
        ...params,
        type: 'animated',
        label: 'animated edge',
        animated: true,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges],
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
      >
        <MiniMap zoomable pannable nodeClassName={nodeClassName} />
        <Controls />
        <Background />
        
        {/* Utility components for keyboard shortcuts and selection tracking */}
        <KeyboardShortcuts onShortcut={handleAction} />
        <SelectionTracker onSelectionChange={handleSelectionChange} />
      </ReactFlow>
      
      {/* UI Components */}
      <NodeSelector className="absolute top-4 left-4 z-10" />
      <FlowToolbar className="absolute top-4 left-[280px] z-10" onAction={handleAction} />
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