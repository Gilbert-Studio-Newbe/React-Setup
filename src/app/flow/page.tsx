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
  Connection,
  ConnectionLineType,
  Panel,
  MarkerType,
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
import StyledEdge from '@/components/StyledEdge';
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
  styled: StyledEdge,
};

const nodeClassName = (node: any) => node.type;

// Maximum number of history states to keep
const MAX_HISTORY_LENGTH = 50;

// Edge colors
const edgeColors = [
  '#1a73e8', // Blue
  '#34a853', // Green
  '#ea4335', // Red
  '#fbbc05', // Yellow
  '#9c27b0', // Purple
  '#00acc1', // Cyan
  '#ff9800', // Orange
];

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const selectedElementsRef = useRef<{nodeIds: string[]; edgeIds: string[]}>({ nodeIds: [], edgeIds: [] });
  
  // Edge configuration
  const [edgeType, setEdgeType] = useState<'default' | 'straight' | 'step' | 'smoothstep' | 'animated'>('default');
  const [connectionLineType, setConnectionLineType] = useState<ConnectionLineType>(ConnectionLineType.Bezier);
  const [edgeColor, setEdgeColor] = useState(edgeColors[0]);
  const [edgeAnimated, setEdgeAnimated] = useState(false);
  const [showMarker, setShowMarker] = useState(true);
  
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
  
  // Custom connection handler to create edges with the selected type
  const onConnect = useCallback(
    (params: Connection) => {
      // Create a new edge with the current edge type and styling
      const newEdge = {
        ...params,
        type: 'styled',
        animated: false,
        label: `${edgeType} edge`,
        markerEnd: showMarker ? {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        } : undefined,
        data: {
          type: edgeType,
          color: edgeColor,
          strokeWidth: 2,
          animated: edgeAnimated,
        },
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
      
      // Show toast notification
      setToast({ message: 'Connection created' });
      setTimeout(() => setToast(null), 3000);
    },
    [setEdges, edgeType, edgeColor, edgeAnimated, showMarker],
  );
  
  // Handle edge drop outside of a valid connection
  const onEdgeUpdateEnd = useCallback(
    (_, edge) => {
      // Delete the edge when it's dropped outside of a valid connection
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      
      // Show toast notification
      setToast({ message: 'Edge deleted on drop' });
      setTimeout(() => setToast(null), 3000);
    },
    [setEdges],
  );
  
  // Handle edge update (reconnection)
  const onEdgeUpdate = useCallback(
    (oldEdge, newConnection) => {
      setEdges((els) => updateEdge(oldEdge, newConnection, els));
    },
    [setEdges],
  );
  
  // Helper function to update an edge
  const updateEdge = (oldEdge: Edge, newConnection: Connection, edges: Edge[]) => {
    return edges.map((edge) => {
      if (edge.id === oldEdge.id) {
        return {
          ...edge,
          ...newConnection,
        };
      }
      
      return edge;
    });
  };
  
  // Handle edge type change
  const handleEdgeTypeChange = useCallback((type: 'default' | 'straight' | 'step' | 'smoothstep' | 'animated') => {
    setEdgeType(type);
    
    // Update connection line type based on edge type
    switch (type) {
      case 'default':
        setConnectionLineType(ConnectionLineType.Bezier);
        break;
      case 'straight':
        setConnectionLineType(ConnectionLineType.Straight);
        break;
      case 'step':
        setConnectionLineType(ConnectionLineType.Step);
        break;
      case 'smoothstep':
        setConnectionLineType(ConnectionLineType.SmoothStep);
        break;
      case 'animated':
        setConnectionLineType(ConnectionLineType.Bezier);
        setEdgeAnimated(true);
        return;
    }
    
    // Reset animation for non-animated types
    setEdgeAnimated(false);
    
    // Show toast notification
    setToast({ message: `Edge type set to ${type}` });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <div className="w-screen h-screen relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeUpdate={onEdgeUpdate}
        onEdgeUpdateEnd={onEdgeUpdateEnd}
        fitView
        attributionPosition="top-right"
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={connectionLineType}
        connectionLineStyle={{ stroke: edgeColor, strokeWidth: 2 }}
        className="bg-[#F7F9FB] dark:bg-[#1a1a1a]"
      >
        <MiniMap zoomable pannable nodeClassName={nodeClassName} />
        <Controls />
        <Background />
        
        {/* Edge Type Selector Panel */}
        <Panel position="bottom-center" className="bg-white dark:bg-gray-800 p-3 rounded-t-lg shadow-lg">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Edge Type:</span>
              <select 
                value={edgeType}
                onChange={(e) => handleEdgeTypeChange(e.target.value as any)}
                className="p-1 border rounded bg-white dark:bg-gray-700 text-sm"
              >
                <option value="default">Default (Bezier)</option>
                <option value="straight">Straight</option>
                <option value="step">Step</option>
                <option value="smoothstep">Smooth Step</option>
                <option value="animated">Animated</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Color:</span>
              <select 
                value={edgeColor}
                onChange={(e) => setEdgeColor(e.target.value)}
                className="p-1 border rounded bg-white dark:bg-gray-700 text-sm"
                style={{ color: edgeColor }}
              >
                {edgeColors.map((color) => (
                  <option key={color} value={color} style={{ color }}>
                    {color}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-sm">
                <input 
                  type="checkbox" 
                  checked={edgeAnimated}
                  onChange={(e) => setEdgeAnimated(e.target.checked)}
                  className="rounded"
                />
                Animated
              </label>
              
              <label className="flex items-center gap-1 text-sm ml-3">
                <input 
                  type="checkbox" 
                  checked={showMarker}
                  onChange={(e) => setShowMarker(e.target.checked)}
                  className="rounded"
                />
                Show Arrow
              </label>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              Tip: Drag an edge end and drop it to delete the connection
            </div>
          </div>
        </Panel>
        
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