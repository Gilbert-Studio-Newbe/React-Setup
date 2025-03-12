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
  useOnSelectionChange,
  OnConnect,
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
// Import only the edge types we'll actually use
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

// Only keep the edge types we need
const edgeTypes = {
  button: ButtonEdge,
  animated: AnimatedEdge,
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

// Helper function to safely clone objects for history
const safeClone = (obj: any) => {
  try {
    // Remove any React-specific properties that might cause issues
    const cleanObj = JSON.parse(JSON.stringify(obj, (key, value) => {
      // Skip React internal properties
      if (key === '_owner' || key === '_store' || key.startsWith('__')) {
        return undefined;
      }
      return value;
    }));
    return cleanObj;
  } catch (error) {
    console.error('Error cloning object for history:', error);
    return obj;
  }
};

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const selectedElementsRef = useRef<{nodeIds: string[]; edgeIds: string[]}>({ nodeIds: [], edgeIds: [] });
  
  // Edge configuration - update to use original line types
  const [edgeType, setEdgeType] = useState<'bezier' | 'straight' | 'step' | 'smoothstep'>('bezier');
  const [connectionLineType, setConnectionLineType] = useState<ConnectionLineType>(ConnectionLineType.Bezier);
  const [edgeColor, setEdgeColor] = useState(edgeColors[0].value);
  const [edgeAnimated, setEdgeAnimated] = useState(false);
  const [showMarker, setShowMarker] = useState(true);
  
  // History management
  const [history, setHistory] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const isHistoryActionRef = useRef(false);
  const nodesJsonRef = useRef('');
  const edgesJsonRef = useRef('');
  const isInitialRender = useRef(true);
  const pendingHistoryUpdate = useRef(false);
  
  // Initialize history with initial state
  useEffect(() => {
    if (isInitialRender.current) {
      const initialState = {
        nodes: safeClone(nodes),
        edges: safeClone(edges)
      };
      setHistory([initialState]);
      setCurrentHistoryIndex(0);
      
      // Update refs with initial state
      nodesJsonRef.current = JSON.stringify(nodes);
      edgesJsonRef.current = JSON.stringify(edges);
      
      isInitialRender.current = false;
    }
  }, []);
  
  // Save current state to history when nodes or edges change
  useEffect(() => {
    // Skip if this is the initial render or a history action
    if (isInitialRender.current || isHistoryActionRef.current) {
      isHistoryActionRef.current = false;
      return;
    }
    
    // Prevent multiple history updates in the same render cycle
    if (pendingHistoryUpdate.current) {
      return;
    }
    
    pendingHistoryUpdate.current = true;
    
    // Use setTimeout to defer the history update to the next tick
    // This prevents the infinite loop by ensuring state updates don't cascade
    setTimeout(() => {
      try {
        // Stringify the current state to compare with previous state
        const nodesJson = JSON.stringify(nodes);
        const edgesJson = JSON.stringify(edges);
        
        // Only update history if something actually changed
        if (nodesJson === nodesJsonRef.current && edgesJson === edgesJsonRef.current) {
          pendingHistoryUpdate.current = false;
          return;
        }
        
        // Update refs with current state
        nodesJsonRef.current = nodesJson;
        edgesJsonRef.current = edgesJson;
        
        // Create a snapshot of the current state
        const currentState = {
          nodes: safeClone(nodes),
          edges: safeClone(edges)
        };
        
        // If we're not at the end of the history, truncate the future states
        const newHistory = currentHistoryIndex < history.length - 1
          ? [...history.slice(0, currentHistoryIndex + 1), currentState]
          : [...history, currentState];
        
        // Limit history length
        const limitedHistory = newHistory.length > MAX_HISTORY_LENGTH
          ? newHistory.slice(newHistory.length - MAX_HISTORY_LENGTH)
          : newHistory;
        
        setHistory(limitedHistory);
        setCurrentHistoryIndex(Math.min(currentHistoryIndex + 1, MAX_HISTORY_LENGTH - 1));
      } catch (error) {
        console.error('Error updating history:', error);
      } finally {
        pendingHistoryUpdate.current = false;
      }
    }, 0);
  }, [nodes, edges, history, currentHistoryIndex]);
  
  // Handle undo action
  const handleUndo = useCallback(() => {
    if (currentHistoryIndex > 0 && history.length > 0) {
      try {
        isHistoryActionRef.current = true;
        const prevState = history[currentHistoryIndex - 1];
        
        if (!prevState) {
          console.error('Previous state is undefined');
          return;
        }
        
        // Create clean copies of the previous state
        const prevNodes = safeClone(prevState.nodes);
        const prevEdges = safeClone(prevState.edges);
        
        // Update the state
        setNodes(prevNodes);
        setEdges(prevEdges);
        setCurrentHistoryIndex(currentHistoryIndex - 1);
        
        // Show toast notification
        setToast({ message: 'Undo successful' });
        setTimeout(() => setToast(null), 3000);
      } catch (error) {
        console.error('Error during undo:', error);
        setToast({ message: 'Error during undo operation' });
        setTimeout(() => setToast(null), 3000);
      }
    } else {
      // Show toast notification for no more undo
      setToast({ message: 'Nothing to undo' });
      setTimeout(() => setToast(null), 3000);
    }
  }, [history, currentHistoryIndex, setNodes, setEdges]);
  
  // Handle redo action
  const handleRedo = useCallback(() => {
    if (currentHistoryIndex < history.length - 1 && history.length > 0) {
      try {
        isHistoryActionRef.current = true;
        const nextState = history[currentHistoryIndex + 1];
        
        if (!nextState) {
          console.error('Next state is undefined');
          return;
        }
        
        // Create clean copies of the next state
        const nextNodes = safeClone(nextState.nodes);
        const nextEdges = safeClone(nextState.edges);
        
        // Update the state
        setNodes(nextNodes);
        setEdges(nextEdges);
        setCurrentHistoryIndex(currentHistoryIndex + 1);
        
        // Show toast notification
        setToast({ message: 'Redo successful' });
        setTimeout(() => setToast(null), 3000);
      } catch (error) {
        console.error('Error during redo:', error);
        setToast({ message: 'Error during redo operation' });
        setTimeout(() => setToast(null), 3000);
      }
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
        type: edgeAnimated ? 'animated' : undefined, // Only use animated type if animated is true
        animated: edgeAnimated,
        label: `${edgeType} edge`,
        markerEnd: showMarker ? {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        } : undefined,
        data: {
          color: edgeColor,
          strokeWidth: 2,
        },
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
      
      // Show toast notification
      setToast({ message: 'Connection created' });
      setTimeout(() => setToast(null), 3000);
    },
    [setEdges, edgeType, edgeColor, edgeAnimated, showMarker],
  );
  
  // Handle edge type change
  const handleEdgeTypeChange = useCallback((type: 'bezier' | 'straight' | 'step' | 'smoothstep') => {
    setEdgeType(type);
    
    // Update connection line type based on edge type
    switch (type) {
      case 'bezier':
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
      default:
        setConnectionLineType(ConnectionLineType.Bezier);
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
        deleteKeyCode="Delete"
        fitView
        attributionPosition="top-right"
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={connectionLineType}
        connectionLineStyle={{ stroke: edgeColor, strokeWidth: 2 }}
        className="bg-[#F7F9FB] dark:bg-[#1a1a1a]"
        defaultEdgeOptions={{ type: edgeAnimated ? 'animated' : undefined }}
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
                <option value="bezier">Bezier</option>
                <option value="straight">Straight</option>
                <option value="step">Step</option>
                <option value="smoothstep">Smooth Step</option>
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
            
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-sm ml-3">
                <input 
                  type="checkbox" 
                  checked={edgeAnimated}
                  onChange={(e) => setEdgeAnimated(e.target.checked)}
                  className="rounded"
                />
                Animated
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