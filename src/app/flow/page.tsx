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
  useReactFlow,
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
  { value: '#1a73e8', name: 'Blue' },
  { value: '#34a853', name: 'Green' },
  { value: '#ea4335', name: 'Red' },
  { value: '#fbbc05', name: 'Yellow' },
  { value: '#9c27b0', name: 'Purple' },
  { value: '#00acc1', name: 'Cyan' },
  { value: '#ff9800', name: 'Orange' },
  { value: '#757575', name: 'Gray' },
  { value: '#000000', name: 'Black' },
];

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const selectedElementsRef = useRef<{nodeIds: string[]; edgeIds: string[]}>({ nodeIds: [], edgeIds: [] });
  
  // Edge configuration
  const [edgeType, setEdgeType] = useState<'default' | 'animated'>('default');
  const [connectionLineType, setConnectionLineType] = useState<ConnectionLineType>(ConnectionLineType.Bezier);
  const [edgeColor, setEdgeColor] = useState(edgeColors[0].value);
  const [edgeAnimated, setEdgeAnimated] = useState(false);
  const [showMarker, setShowMarker] = useState(true);
  
  // Track edge updates
  const edgeUpdateSuccessful = useRef(true);
  
  // History management
  const [history, setHistory] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const isHistoryActionRef = useRef(false);
  const nodesJsonRef = useRef('');
  const edgesJsonRef = useRef('');
  
  // Save current state to history when nodes or edges change
  useEffect(() => {
    // Skip if this change was caused by an undo/redo action
    if (isHistoryActionRef.current) {
      isHistoryActionRef.current = false;
      return;
    }
    
    // Stringify the current state to compare with previous state
    const nodesJson = JSON.stringify(nodes);
    const edgesJson = JSON.stringify(edges);
    
    // Only update history if something actually changed
    if (nodesJson === nodesJsonRef.current && edgesJson === edgesJsonRef.current) {
      return;
    }
    
    // Update refs with current state
    nodesJsonRef.current = nodesJson;
    edgesJsonRef.current = edgesJson;
    
    // Create a snapshot of the current state
    const currentState = {
      nodes: JSON.parse(nodesJson),
      edges: JSON.parse(edgesJson)
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
  }, [nodes, edges, history.length, currentHistoryIndex]);
  
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
  
  // Handle edge update start
  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  // Handle edge update
  const onEdgeUpdate = useCallback((oldEdge: Edge, newConnection: Connection) => {
    edgeUpdateSuccessful.current = true;
    setEdges((els) => els.map((el) => (el.id === oldEdge.id ? { ...el, ...newConnection } : el)));
  }, [setEdges]);

  // Handle edge update end
  const onEdgeUpdateEnd = useCallback((_, edge: Edge) => {
    if (!edgeUpdateSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      
      // Show toast notification
      setToast({ message: 'Edge deleted on drop' });
      setTimeout(() => setToast(null), 3000);
    }
    
    edgeUpdateSuccessful.current = true;
  }, [setEdges]);
  
  // Handle edge type change
  const handleEdgeTypeChange = useCallback((type: 'default' | 'animated') => {
    setEdgeType(type);
    
    // Update connection line type based on edge type
    if (type === 'animated') {
      setEdgeAnimated(true);
    } else {
      setEdgeAnimated(false);
    }
    
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
        onEdgeUpdateStart={onEdgeUpdateStart}
        onEdgeUpdate={onEdgeUpdate}
        onEdgeUpdateEnd={onEdgeUpdateEnd}
        fitView
        attributionPosition="top-right"
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={connectionLineType}
        connectionLineStyle={{ stroke: edgeColor, strokeWidth: 2 }}
        className="bg-[#F7F9FB] dark:bg-[#1a1a1a]"
        deleteKeyCode="Delete"
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
                <option value="default">Default</option>
                <option value="animated">Animated</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Color:</span>
              <select 
                value={edgeColor}
                onChange={(e) => setEdgeColor(e.target.value)}
                className="p-1 border rounded bg-white dark:bg-gray-700 text-sm"
              >
                {edgeColors.map((color) => (
                  <option key={color.value} value={color.value} style={{ color: color.value }}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
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