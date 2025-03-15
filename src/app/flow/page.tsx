'use client';

import React, { useCallback, useEffect, useRef, useState, Suspense, ErrorBoundary } from 'react';
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
import dynamic from 'next/dynamic';

// Import ContextNodeMenu with dynamic import to prevent SSR
const ContextNodeMenu = dynamic(
  () => import('@/components/ContextNodeMenu'),
  { ssr: false }
);

import {
  nodes as initialNodes,
  edges as initialEdges,
} from '@/components/initial-elements';
// Import only the edge types we'll actually use
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
import TailwindNode from '@/components/TailwindNode';
import ResultNode from '@/components/ResultNode';
import IfcImportNode from '@/components/IfcImportNode';
import JsonLoadNode from '@/components/JsonLoadNode';
import JsonDisplayNode from '@/components/JsonDisplayNode';
import DebugDisplayNode from '@/components/DebugDisplayNode';
import JoinNode from '@/components/JoinNode';
import CSVImportNode from '@/components/CSVImportNode';
import MaterialCostNode from '@/components/MaterialCostNode';
import JsonParameterFormatterNode from '@/components/JsonParameterFormatterNode';

// Only keep the edge types we need
const edgeTypes = {
  button: ButtonEdge,
  animated: AnimatedEdge,
  default: StyledEdge,
} as any; // Using 'any' to bypass type checking for edgeTypes

// Define nodeTypes with type assertion
const nodeTypes = {
  numberinput: NumberInputNode,
  costinput: CostInputNode,
  calculation: CalculationNode,
  tailwind: TailwindNode,
  result: ResultNode,
  ifcimport: IfcImportNode,
  jsonload: JsonLoadNode,
  jsondisplay: JsonDisplayNode,
  debugdisplay: DebugDisplayNode,
  join: JoinNode,
  csvimport: CSVImportNode,
  materialcost: MaterialCostNode,
  jsonparameterformatter: JsonParameterFormatterNode
} as any; // Using 'any' to bypass type checking for nodeTypes

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

// Initial Tailwind nodes for demonstration
const initialTailwindNodes: Node[] = [
  {
    id: 'tailwind-1',
    type: 'tailwind',
    position: { x: 100, y: 100 },
    data: { label: 'Tailwind Node 1', value: 123 },
  },
  {
    id: 'tailwind-2',
    type: 'tailwind',
    position: { x: 400, y: 100 },
    data: { label: 'Tailwind Node 2' },
  },
  {
    id: 'tailwind-3',
    type: 'tailwind',
    position: { x: 250, y: 250 },
    data: { label: 'Tailwind Node 3', value: 456 },
  },
];

// SavePanel component for saving and loading flows
const SavePanel = ({ 
  onSave, 
  onLoad, 
  onLoadDefault,
  className 
}: { 
  onSave: () => void; 
  onLoad: () => void; 
  onLoadDefault: () => void;
  className?: string 
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex gap-2 ${className}`}>
      <button
        onClick={onSave}
        className="px-4 py-2 bg-white hover:bg-gray-50 text-black border-2 border-black rounded-md shadow transition-all duration-200 text-sm font-medium flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
        </svg>
        Save Flow
      </button>
      <button
        onClick={onLoad}
        className="px-4 py-2 bg-white hover:bg-gray-50 text-black border-2 border-black rounded-md shadow transition-all duration-200 text-sm font-medium flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 6.414V10h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2v-7a2 2 0 012-2h5V6.414L7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z" />
        </svg>
        Load Flow
      </button>
      <button
        onClick={onLoadDefault}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-600 rounded-md shadow transition-all duration-200 text-sm font-medium flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        Default Flow
      </button>
    </div>
  );
};

// Create a client-side only error boundary component
class ClientErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error in React Flow:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex flex-col items-center justify-center p-4 bg-red-50 text-red-800">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="mb-4">There was an error loading the flow editor.</p>
          <pre className="bg-red-100 p-4 rounded-lg overflow-auto max-w-full max-h-[400px] text-sm">
            {this.state.error?.toString()}
          </pre>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create a loading component
const LoadingFallback = () => (
  <div className="w-full h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-lg text-gray-700">Loading Flow Editor...</p>
    </div>
  </div>
);

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const selectedElementsRef = useRef<{nodeIds: string[]; edgeIds: string[]}>({ nodeIds: [], edgeIds: [] });
  const { screenToFlowPosition } = useReactFlow();
  
  // State for context menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
  }>({ x: 0, y: 0, visible: false });

  // Edge configuration - update to use step line types with rounded corners
  const [edgeType, setEdgeType] = useState<'bezier' | 'straight' | 'step' | 'smoothstep'>('step');
  const [connectionLineType, setConnectionLineType] = useState<ConnectionLineType>(ConnectionLineType.Step);
  const [edgeColor, setEdgeColor] = useState('#757575'); // Grey color
  const [edgeAnimated, setEdgeAnimated] = useState(false);
  const [showMarker, setShowMarker] = useState(false); // No arrows
  
  // History management
  const [history, setHistory] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryActionRef = useRef(false);
  const nodesJsonRef = useRef('');
  const edgesJsonRef = useRef('');
  const isInitialRender = useRef(true);
  const pendingHistoryUpdate = useRef(false);
  const isDraggingRef = useRef(false);
  
  // Initialize history with initial state
  useEffect(() => {
    if (isInitialRender.current) {
      const initialState = {
        nodes: safeClone(nodes),
        edges: safeClone(edges)
      };
      setHistory([initialState]);
      setHistoryIndex(0);
      
      // Update refs with initial state
      nodesJsonRef.current = JSON.stringify(nodes);
      edgesJsonRef.current = JSON.stringify(edges);
      
      isInitialRender.current = false;
    }
  }, [nodes, edges]);
  
  // Handle node drag start
  const handleNodeDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);
  
  // Add current state to history
  const addToHistory = useCallback(() => {
    // Create a snapshot of the current state
    const currentState = {
      nodes: safeClone(nodes),
      edges: safeClone(edges)
    };
    
    // If we're not at the end of the history, truncate the future states
    const newHistory = historyIndex < history.length - 1
      ? [...history.slice(0, historyIndex + 1), currentState]
      : [...history, currentState];
    
    // Limit history length
    const limitedHistory = newHistory.length > MAX_HISTORY_LENGTH
      ? newHistory.slice(newHistory.length - MAX_HISTORY_LENGTH)
      : newHistory;
    
    setHistory(limitedHistory);
    setHistoryIndex(Math.min(historyIndex + 1, limitedHistory.length - 1));
    
    // Update refs with current state
    nodesJsonRef.current = JSON.stringify(nodes);
    edgesJsonRef.current = JSON.stringify(edges);
    
    console.log('History updated, length:', limitedHistory.length, 'current index:', Math.min(historyIndex + 1, limitedHistory.length - 1));
  }, [nodes, edges, history, historyIndex]);
  
  // Handle node drag stop
  const handleNodeDragStop = useCallback(() => {
    isDraggingRef.current = false;
    
    // Add to history after drag completes
    if (!pendingHistoryUpdate.current) {
      pendingHistoryUpdate.current = true;
      
      // Use setTimeout to ensure this runs after the state updates
      setTimeout(() => {
        addToHistory();
        pendingHistoryUpdate.current = false;
      }, 0);
    }
  }, [addToHistory]);
  
  // Handle pane double-click to show context menu
  const handleDoubleClick = useCallback((event: React.MouseEvent, element: any) => {
    // Only process on client side
    if (typeof window === 'undefined') return;
    
    // If element is defined, it's a node double-click, not a pane double-click
    if (element) {
      console.log('Node double-clicked:', element);
      return;
    }
    
    // This is a pane double-click
    console.log('Pane double-clicked at:', event.clientX, event.clientY);
    
    // Prevent default behavior (like zooming)
    event.preventDefault();
    event.stopPropagation();
    
    // Set the context menu position and make it visible
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      visible: true
    });
  }, []);
  
  // Add a node at the specified position
  const addNodeAtPosition = useCallback((type: string, position: { x: number; y: number }) => {
    // Create a unique ID
    const id = `${type}-${Date.now()}`;
    
    // Initialize with empty data
    let data: any = {};
    
    // Configure specific node types
    switch (type) {
      case 'numberinput':
        data = {
          label: 'Number Input',
          value: 0,
          min: 0,
          max: 100,
          step: 1,
          unit: ''
        };
        break;
      case 'costinput':
        data = {
          label: 'Cost Input',
          value: 0,
          currency: '$',
          description: 'Enter cost amount'
        };
        break;
      case 'calculation':
        data = {
          label: 'Calculation',
          operation: 'add',
          result: 0
        };
        break;
      case 'join':
        data = {
          label: 'Join String',
          input1: '',
          input2: '',
          separator: ' ',
          result: ''
        };
        break;
      case 'csvimport':
        data = {
          label: 'CSV Import',
          fileName: '',
          headers: [],
          rowCount: 0,
          previewRows: [],
          isCollapsed: false
        };
        break;
      case 'materialcost':
        data = {
          label: 'Material Cost',
          inputString: '',
          csvData: [],
          matchingRecords: [],
          cost: null,
          error: ''
        };
        break;
      case 'jsonparameterformatter':
        const formatterLabel = prompt('Enter a label for the Parameter Formatter node:', 'Parameter Formatter');
        const actualFormatterLabel = formatterLabel || 'Parameter Formatter';
        
        data = {
          label: actualFormatterLabel,
          jsonData: null,
          selectedParameters: [
            { paramId: null, order: 0, customLabel: '' },
            { paramId: null, order: 1, customLabel: '' },
            { paramId: null, order: 2, customLabel: '' },
            { paramId: null, order: 3, customLabel: '' },
            { paramId: null, order: 4, customLabel: '' }
          ],
          dimensionParameter: null,
          formatTemplate: '**{label}**, {value};',
          trimWhitespace: true,
          handleNullValues: 'skip',
          formattedString: '',
          dimensionValue: null
        };
        break;
      case 'result':
        data = {
          label: 'Result',
          value: 0,
          unit: '',
          description: 'Final calculation result'
        };
        break;
      case 'ifcimport':
        data = {
          label: 'IFC Import',
          onFileImport: (file: File) => {
            console.log('IFC file imported:', file.name);
          }
        };
        break;
      case 'jsonload':
        data = {
          label: 'JSON Load',
          jsonData: null,
          onJsonLoad: (jsonData: any) => {
            console.log('JSON data loaded:', jsonData);
          }
        };
        break;
      case 'jsondisplay':
        data = {
          label: 'JSON Display',
          onChange: (paramId: string, newValue: any) => {
            console.log('Parameter updated:', paramId, newValue);
          },
          outputMode: 'raw'
        };
        break;
      case 'debugdisplay':
        data = {
          label: 'Debug Display',
          value: null,
          description: 'Connect to any node to see its data'
        };
        break;
    }
    
    // Create the new node
    const newNode = {
      id,
      type,
      position,
      data
    };
    
    // Add the node to the flow
    setNodes((nds) => [...nds, newNode]);
    
    // Show toast notification
    const nodeLabel = nodeTypes[type as keyof typeof nodeTypes] || type;
    setToast({ message: `Added ${nodeLabel} node at (${Math.round(position.x)}, ${Math.round(position.y)})` });
    setTimeout(() => setToast(null), 3000);
    
    // Add to history
    setTimeout(() => {
      addToHistory();
    }, 100);
  }, [setNodes, addToHistory]);
  
  // Save current state to history when edges change (but not nodes, which are handled by drag events)
  useEffect(() => {
    // Skip if this is the initial render or a history action
    if (isInitialRender.current || isHistoryActionRef.current || isDraggingRef.current) {
      isHistoryActionRef.current = false;
      return;
    }
    
    // Prevent multiple history updates in the same render cycle
    if (pendingHistoryUpdate.current) {
      return;
    }
    
    pendingHistoryUpdate.current = true;
    
    // Use requestAnimationFrame instead of setTimeout for better timing
    requestAnimationFrame(() => {
      try {
        // Stringify the current state to compare with previous state
        const edgesJson = JSON.stringify(edges);
        
        // Only update history if edges actually changed
        if (edgesJson === edgesJsonRef.current) {
          pendingHistoryUpdate.current = false;
          return;
        }
        
        // Update refs with current state
        edgesJsonRef.current = edgesJson;
        
        // Create a snapshot of the current state
        const currentState = {
          nodes: safeClone(nodes),
          edges: safeClone(edges)
        };
        
        // If we're not at the end of the history, truncate the future states
        const newHistory = historyIndex < history.length - 1
          ? [...history.slice(0, historyIndex + 1), currentState]
          : [...history, currentState];
        
        // Limit history length
        const limitedHistory = newHistory.length > MAX_HISTORY_LENGTH
          ? newHistory.slice(newHistory.length - MAX_HISTORY_LENGTH)
          : newHistory;
        
        setHistory(limitedHistory);
        setHistoryIndex(Math.min(historyIndex + 1, limitedHistory.length - 1));
        
        console.log('History updated for edge change, length:', limitedHistory.length, 'current index:', Math.min(historyIndex + 1, limitedHistory.length - 1));
      } catch (error) {
        console.error('Error updating history:', error);
      } finally {
        pendingHistoryUpdate.current = false;
      }
    });
  }, [edges, nodes, history, historyIndex]);
  
  // Handle undo action
  const handleUndo = useCallback(() => {
    console.log('Undo triggered, history length:', history.length, 'current index:', historyIndex);
    
    if (historyIndex > 0 && history.length > 0) {
      try {
        isHistoryActionRef.current = true;
        const prevState = history[historyIndex - 1];
        
        if (!prevState) {
          console.error('Previous state is undefined');
          return;
        }
        
        console.log('Applying previous state at index:', historyIndex - 1);
        
        // Create clean copies of the previous state
        const prevNodes = safeClone(prevState.nodes);
        const prevEdges = safeClone(prevState.edges);
        
        // Update the state
        setNodes(prevNodes);
        setEdges(prevEdges);
        setHistoryIndex(historyIndex - 1);
        
        // Show toast notification
        setToast({ message: 'Undo successful' });
        setTimeout(() => setToast(null), 3000);
      } catch (error) {
        console.error('Error during undo:', error);
        setToast({ message: 'Error during undo operation' });
        setTimeout(() => setToast(null), 3000);
      }
    } else {
      console.log('Nothing to undo, at beginning of history');
      // Show toast notification for no more undo
      setToast({ message: 'Nothing to undo' });
      setTimeout(() => setToast(null), 3000);
    }
  }, [history, historyIndex, setNodes, setEdges]);
  
  // Handle redo action
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1 && history.length > 0) {
      try {
        isHistoryActionRef.current = true;
        const nextState = history[historyIndex + 1];
        
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
        setHistoryIndex(historyIndex + 1);
        
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
  }, [history, historyIndex, setNodes, setEdges]);
  
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
        markerEnd: showMarker ? {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        } : undefined,
        style: { strokeWidth: 1.5, stroke: edgeColor },
        data: {
          color: edgeColor,
          strokeWidth: 1.5,
          type: 'step' // Store step as the edge type in the data
        },
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
      
      // Handle special connections between nodes
      // Find source and target nodes
      const sourceNode = nodes.find(node => node.id === params.source);
      const targetNode = nodes.find(node => node.id === params.target);
      
      // If connecting from JSON Load to JSON Display
      if (sourceNode?.type === 'jsonload' && targetNode?.type === 'jsondisplay') {
        // Update the target node with the JSON data from the source node
        if (sourceNode.data.jsonData) {
          setNodes(nds => 
            nds.map(node => {
              if (node.id === targetNode.id) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    jsonData: sourceNode.data.jsonData
                  }
                };
              }
              return node;
            })
          );
        }
      }
      
      // If connecting to a Debug Display node, pass all source node data
      if (targetNode?.type === 'debugdisplay' && sourceNode) {
        setNodes(nds => 
          nds.map(node => {
            if (node.id === targetNode.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  sourceNodeId: sourceNode.id,
                  sourceNodeType: sourceNode.type,
                  sourceNodeData: { ...sourceNode.data }
                }
              };
            }
            return node;
          })
        );
      }
      
      // If connecting to a JSON Parameter Formatter node, pass JSON data
      if (targetNode?.type === 'jsonparameterformatter' && sourceNode) {
        // Check if the source node has JSON data
        if (sourceNode.data.jsonData) {
          setNodes(nds => 
            nds.map(node => {
              if (node.id === targetNode.id) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    jsonData: sourceNode.data.jsonData
                  }
                };
              }
              return node;
            })
          );
        }
      }
      
      // If connecting from Calculation to other nodes (e.g., Result)
      if (sourceNode?.type === 'calculation' && targetNode) {
        // Check if the source node has a result value
        if (sourceNode.data.result !== undefined || sourceNode.data.outputValue !== undefined) {
          // Get the output value (prefer outputValue if available)
          const outputValue = sourceNode.data.outputValue !== undefined 
            ? sourceNode.data.outputValue 
            : sourceNode.data.result;
          
          // Log the output value for debugging
          console.log('Calculation output value:', outputValue, typeof outputValue);
          
          setNodes(nds => 
            nds.map(node => {
              if (node.id === targetNode.id) {
                // Handle different target node types
                if (node.type === 'result') {
                  console.log('Setting result node value to:', outputValue);
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      value: outputValue
                    }
                  };
                }
                // Add handling for other node types if needed
              }
              return node;
            })
          );
        }
      }
      
      // If connecting from JSON Display to other nodes (e.g., Result)
      if (sourceNode?.type === 'jsondisplay' && targetNode) {
        // Check if the source node has an output value
        if (sourceNode.data.outputValue !== undefined) {
          // Log the output value for debugging
          console.log('JSON Display output value:', sourceNode.data.outputValue, typeof sourceNode.data.outputValue);
          
          setNodes(nds => 
            nds.map(node => {
              if (node.id === targetNode.id) {
                // Get the output value based on the output mode
                let outputValue = sourceNode.data.outputValue;
                
                // Ensure we have a numeric value for calculation nodes
                if (typeof outputValue === 'string' && 
                    (targetNode.type === 'calculation' || targetNode.type === 'result')) {
                  // Try to convert to number if it's a formatted string
                  const parsed = parseFloat(outputValue);
                  if (!isNaN(parsed)) {
                    outputValue = parsed;
                  }
                }
                
                console.log('Processed output value for connection:', outputValue, typeof outputValue);
                
                // Handle different target node types
                if (node.type === 'result') {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      value: outputValue
                    }
                  };
                } else if (node.type === 'calculation') {
                  // For calculation nodes, determine which input to update based on the connection
                  const isInput1 = params.targetHandle === 'input1';
                  
                  // Ensure the value is a number for calculation nodes
                  let calcValue = outputValue;
                  if (typeof calcValue === 'string') {
                    const parsed = parseFloat(calcValue);
                    if (!isNaN(parsed)) {
                      calcValue = parsed;
                    } else {
                      calcValue = 0; // Default to 0 if we can't parse a number
                    }
                  } else if (calcValue === null || calcValue === undefined) {
                    calcValue = 0;
                  }
                  
                  // Force to number type to ensure proper calculation
                  calcValue = Number(calcValue);
                  
                  console.log(`Setting calculation ${isInput1 ? 'input1' : 'input2'} to:`, calcValue, typeof calcValue);
                  
                  // Create a new data object with the updated input and force recalculation
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      [isInput1 ? 'input1' : 'input2']: calcValue,
                      // Remove result to force recalculation
                      result: undefined
                    }
                  };
                } else {
                  // Generic approach for other node types
                  shouldUpdate = node.data.value !== outputValue;
                  if (shouldUpdate) {
                    updated = true;
                    return {
                      ...node,
                      data: {
                        ...node.data,
                        value: outputValue
                      }
                    };
                  }
                }
              }
              return node;
            })
          );
        }
      }
      
      // If connecting from JSON Parameter Formatter to other nodes
      if (sourceNode?.type === 'jsonparameterformatter' && targetNode) {
        // Check which output handle was used (output or dimension)
        const isMainOutput = params.sourceHandle === 'output' || !params.sourceHandle;
        const isDimensionOutput = params.sourceHandle === 'dimension';
        
        // Get the appropriate output value
        let outputValue = isMainOutput 
          ? sourceNode.data.outputValue 
          : sourceNode.data.dimensionOutputValue;
        
        console.log(`JSON Parameter Formatter ${isMainOutput ? 'main' : 'dimension'} output:`, outputValue);
        
        // Ensure the dimension output value is a valid number or null
        if (isDimensionOutput && (outputValue === undefined || outputValue === null)) {
          outputValue = 0;
          console.log('Dimension output value was undefined or null, setting to 0');
        }
        
        // Update the target node with the output value
        setNodes(nds => 
          nds.map(node => {
            if (node.id === targetNode.id) {
              // Handle different target node types
              if (targetNode.type === 'calculator' || targetNode.type === 'calculation') {
                // For calculator nodes, update the appropriate input
                const isFirstInput = params.targetHandle === 'input-a' || params.targetHandle === 'input1';
                const isSecondInput = params.targetHandle === 'input-b' || params.targetHandle === 'input2';
                
                // Ensure the value is a number for calculation nodes
                let calcValue = outputValue;
                if (typeof calcValue === 'string') {
                  // Try to extract numeric part from string with improved regex
                  const match = calcValue.match(/[-+]?[0-9]*\.?[0-9]+/);
                  if (match) {
                    calcValue = parseFloat(match[0]);
                    console.log('Extracted numeric value from string:', calcValue, 'from', calcValue);
                  } else {
                    calcValue = 0; // Default to 0 if we can't parse a number
                    console.log('Could not extract numeric value from string, defaulting to 0');
                  }
                } else if (calcValue === null || calcValue === undefined) {
                  calcValue = 0;
                  console.log('Output value was null or undefined, defaulting to 0');
                } else if (typeof calcValue !== 'number') {
                  calcValue = 0;
                  console.log('Output value was not a number, defaulting to 0');
                } else {
                  console.log('Using numeric output value directly:', calcValue);
                }
                
                // Force to number type and round to avoid floating point issues
                calcValue = Number(parseFloat(calcValue.toString()).toFixed(4));
                console.log(`Setting calculation ${isFirstInput ? 'input1' : 'input2'} to:`, calcValue);
                
                if (isFirstInput) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      input1: calcValue,
                      valueA: calcValue,
                      // Remove result to force recalculation
                      result: undefined
                    }
                  };
                } else if (isSecondInput) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      input2: calcValue,
                      valueB: calcValue,
                      // Remove result to force recalculation
                      result: undefined
                    }
                  };
                }
              } else {
                // Generic approach for other node types
                shouldUpdate = node.data.value !== outputValue;
                if (shouldUpdate) {
                  updated = true;
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      value: outputValue
                    }
                  };
                }
              }
            }
            return node;
          })
        );
      }
      
      // If connecting from Material Cost node to other nodes
      if (sourceNode?.type === 'materialcost' && targetNode) {
        // Check if we should use the numeric value for calculations
        let outputValue = sourceNode.data.outputValue;
        let numericValue = sourceNode.data.numericOutputValue;
        
        console.log('Material Cost output:', outputValue, 'Numeric value:', numericValue);
        
        // Update the target node with the appropriate value
        setNodes(nds => 
          nds.map(node => {
            if (node.id === targetNode.id) {
              // Handle different target node types
              if (targetNode.type === 'calculator' || targetNode.type === 'calculation') {
                // For calculator nodes, use the numeric value
                const isFirstInput = params.targetHandle === 'input-a' || params.targetHandle === 'input1';
                const isSecondInput = params.targetHandle === 'input-b' || params.targetHandle === 'input2';
                
                // Use the numeric value if available, otherwise try to extract it
                let calcValue = numericValue;
                if (calcValue === null || calcValue === undefined) {
                  if (typeof outputValue === 'string') {
                    // Try to extract numeric part from string with improved regex
                    const match = outputValue.match(/[-+]?[0-9]*\.?[0-9]+/);
                    if (match) {
                      calcValue = parseFloat(match[0]);
                      console.log('Extracted numeric value from string:', calcValue, 'from', outputValue);
                    } else {
                      calcValue = 0;
                      console.log('Could not extract numeric value from string, defaulting to 0');
                    }
                  } else if (typeof outputValue === 'number') {
                    calcValue = outputValue;
                    console.log('Using numeric output value directly:', calcValue);
                  } else {
                    calcValue = 0;
                    console.log('No valid output value found, defaulting to 0');
                  }
                } else {
                  console.log('Using numeric output value:', calcValue);
                }
                
                // Force to number type and round to avoid floating point issues
                calcValue = Number(parseFloat(calcValue.toString()).toFixed(4));
                console.log(`Setting calculation ${isFirstInput ? 'input1' : 'input2'} to:`, calcValue);
                
                if (isFirstInput) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      input1: calcValue,
                      valueA: calcValue,
                      // Remove result to force recalculation
                      result: undefined
                    }
                  };
                } else if (isSecondInput) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      input2: calcValue,
                      valueB: calcValue,
                      // Remove result to force recalculation
                      result: undefined
                    }
                  };
                }
              } else {
                // For other node types, use the formatted value
                return {
                  ...node,
                  data: {
                    ...node.data,
                    value: outputValue
                  }
                };
              }
            }
            return node;
          })
        );
      }
      
      // Show toast notification
      setToast({ message: 'Connection created' });
      setTimeout(() => setToast(null), 3000);
    },
    [setEdges, edgeColor, edgeAnimated, showMarker, nodes, setNodes],
  );
  
  // Update connections when node data changes
  useEffect(() => {
    // Find all connections between JSON Load and JSON Display nodes
    const jsonLoadConnections = edges.filter(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      const targetNode = nodes.find(node => node.id === edge.target);
      return sourceNode?.type === 'jsonload' && targetNode?.type === 'jsondisplay';
    });
    
    // Update the target nodes with the JSON data from the source nodes
    if (jsonLoadConnections.length > 0) {
      setNodes(nds => {
        let updated = false;
        const newNodes = nds.map(node => {
          // Check if this node is a target in any of the JSON connections
          const connection = jsonLoadConnections.find(edge => edge.target === node.id);
          if (connection) {
            // Find the source node
            const sourceNode = nodes.find(n => n.id === connection.source);
            if (sourceNode?.data.jsonData && (!node.data.jsonData || JSON.stringify(node.data.jsonData) !== JSON.stringify(sourceNode.data.jsonData))) {
              updated = true;
              return {
                ...node,
                data: {
                  ...node.data,
                  jsonData: sourceNode.data.jsonData
                }
              };
            }
          }
          return node;
        });
        
        return updated ? newNodes : nds;
      });
    }
    
    // Find all connections to Debug Display nodes
    const debugDisplayConnections = edges.filter(edge => {
      const targetNode = nodes.find(node => node.id === edge.target);
      return targetNode?.type === 'debugdisplay';
    });
    
    // Find all connections to JSON Parameter Formatter nodes
    const jsonParameterFormatterConnections = edges.filter(edge => {
      const targetNode = nodes.find(node => node.id === edge.target);
      return targetNode?.type === 'jsonparameterformatter';
    });
    
    // Find all connections from JSON Parameter Formatter nodes
    const jsonParameterFormatterOutputConnections = edges.filter(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      return sourceNode?.type === 'jsonparameterformatter';
    });
    
    // Update nodes connected to JSON Parameter Formatter outputs
    if (jsonParameterFormatterOutputConnections.length > 0) {
      setNodes(nds => {
        let updated = false;
        const newNodes = nds.map(node => {
          // Check if this node is a target in any of the JSON Parameter Formatter output connections
          const connection = jsonParameterFormatterOutputConnections.find(edge => edge.target === node.id);
          if (connection) {
            // Find the source node
            const sourceNode = nodes.find(n => n.id === connection.source);
            if (sourceNode) {
              // Check which output handle was used (output or dimension)
              const isMainOutput = connection.sourceHandle === 'output' || !connection.sourceHandle;
              const isDimensionOutput = connection.sourceHandle === 'dimension';
              
              // Get the appropriate output value
              let outputValue = isMainOutput 
                ? sourceNode.data.outputValue 
                : sourceNode.data.dimensionOutputValue;
              
              // Only update if the value has changed
              let shouldUpdate = false;
              
              // Handle different target node types
              if (node.type === 'result') {
                shouldUpdate = node.data.value !== outputValue;
                if (shouldUpdate) {
                  updated = true;
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      value: outputValue
                    }
                  };
                } else if (node.type === 'calculation') {
                  // For calculation nodes, determine which input to update based on the connection
                  const isInput1 = connection.targetHandle === 'input1';
                  
                  // Ensure the value is a number for calculation nodes
                  let calcValue = outputValue;
                  if (typeof calcValue === 'string') {
                    const parsed = parseFloat(calcValue);
                    if (!isNaN(parsed)) {
                      calcValue = parsed;
                    } else {
                      calcValue = 0; // Default to 0 if we can't parse a number
                    }
                  } else if (calcValue === null || calcValue === undefined) {
                    calcValue = 0;
                  }
                  
                  // Force to number type to ensure proper calculation
                  calcValue = Number(calcValue);
                  
                  // Create a new data object with the updated input and force recalculation
                  updated = true;
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      [isInput1 ? 'input1' : 'input2']: calcValue,
                      // Remove result to force recalculation
                      result: undefined
                    }
                  };
                } else {
                  // Generic approach for other node types
                  shouldUpdate = node.data.value !== outputValue;
                  if (shouldUpdate) {
                    updated = true;
                    return {
                      ...node,
                      data: {
                        ...node.data,
                        value: outputValue
                      }
                    };
                  }
                }
              }
            }
          }
          return node;
        });
        
        return updated ? newNodes : nds;
      });
    }
    
    // Update the Debug Display nodes with the source node data
    if (debugDisplayConnections.length > 0) {
      setNodes(nds => {
        let updated = false;
        const newNodes = nds.map(node => {
          // Check if this node is a Debug Display node that's a target in any connection
          if (node.type === 'debugdisplay') {
            const connection = debugDisplayConnections.find(edge => edge.target === node.id);
            if (connection) {
              // Find the source node
              const sourceNode = nodes.find(n => n.id === connection.source);
              if (sourceNode) {
                // Only update if the source node data has changed
                const sourceDataString = JSON.stringify(sourceNode.data);
                const currentSourceDataString = node.data.sourceNodeData ? JSON.stringify(node.data.sourceNodeData) : '';
                
                if (sourceDataString !== currentSourceDataString) {
                  updated = true;
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      sourceNodeId: sourceNode.id,
                      sourceNodeType: sourceNode.type,
                      sourceNodeData: { ...sourceNode.data }
                    }
                  };
                }
              }
            }
          }
          return node;
        });
        
        return updated ? newNodes : nds;
      });
    }
    
    // Find all connections from JSON Display nodes to other nodes
    const jsonDisplayConnections = edges.filter(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      return sourceNode?.type === 'jsondisplay';
    });
    
    // Find all connections from Calculation nodes to other nodes
    const calculationConnections = edges.filter(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      return sourceNode?.type === 'calculation';
    });
    
    // Log calculation connections for debugging
    if (calculationConnections.length > 0) {
      console.log('Calculation connections:', calculationConnections.map(conn => ({
        from: conn.source,
        to: conn.target,
        sourceType: nodes.find(n => n.id === conn.source)?.type,
        targetType: nodes.find(n => n.id === conn.target)?.type
      })));
    }
    
    // Update the target nodes with the output value from the Calculation nodes
    if (calculationConnections.length > 0) {
      setNodes(nds => {
        let updated = false;
        const newNodes = nds.map(node => {
          // Check if this node is a target in any of the Calculation connections
          const connection = calculationConnections.find(edge => edge.target === node.id);
          if (connection) {
            // Find the source node
            const sourceNode = nodes.find(n => n.id === connection.source);
            if (sourceNode) {
              // Get the output value from the calculation node
              // Try outputValue first, then result if outputValue is not available
              let outputValue = sourceNode.data.outputValue !== undefined 
                ? sourceNode.data.outputValue 
                : sourceNode.data.result;
              
              console.log('Calculation node output value:', outputValue, typeof outputValue);
              
              // Only update if the value has changed and the target is a result node
              if (node.type === 'result' && node.data.value !== outputValue) {
                updated = true;
                console.log('Updating result node with calculation output:', outputValue);
                return {
                  ...node,
                  data: {
                    ...node.data,
                    value: outputValue
                  }
                };
              }
            }
          }
          return node;
        });
        
        return updated ? newNodes : nds;
      });
    }
    
    // Update the target nodes with the output value from the JSON Display nodes
    if (jsonDisplayConnections.length > 0) {
      setNodes(nds => {
        let updated = false;
        const newNodes = nds.map(node => {
          // Check if this node is a target in any of the JSON Display connections
          const connection = jsonDisplayConnections.find(edge => edge.target === node.id);
          if (connection) {
            // Find the source node
            const sourceNode = nodes.find(n => n.id === connection.source);
            if (sourceNode?.data.outputValue !== undefined) {
              // Get the output value based on the output mode
              let outputValue = sourceNode.data.outputValue;
              
              // Ensure we have a numeric value for calculation nodes
              if (typeof outputValue === 'string' && 
                  (node.type === 'calculation' || node.type === 'result')) {
                // Try to convert to number if it's a formatted string
                const parsed = parseFloat(outputValue);
                if (!isNaN(parsed)) {
                  outputValue = parsed;
                }
              }
              
              // Only update if the value has changed
              let shouldUpdate = false;
              
              // Handle different target node types
              if (node.type === 'result') {
                shouldUpdate = node.data.value !== outputValue;
                if (shouldUpdate) {
                  updated = true;
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      value: outputValue
                    }
                  };
                }
              } else if (node.type === 'calculation') {
                // For calculation nodes, determine which input to update based on the connection
                const isInput1 = connection.targetHandle === 'input1';
                
                // Ensure the value is a number for calculation nodes
                let calcValue = outputValue;
                if (typeof calcValue === 'string') {
                  const parsed = parseFloat(calcValue);
                  if (!isNaN(parsed)) {
                    calcValue = parsed;
                  } else {
                    calcValue = 0; // Default to 0 if we can't parse a number
                  }
                } else if (calcValue === null || calcValue === undefined) {
                  calcValue = 0;
                }
                
                // Force to number type to ensure proper calculation
                calcValue = Number(calcValue);
                
                console.log(`Updating calculation ${isInput1 ? 'input1' : 'input2'} to:`, calcValue, typeof calcValue);
                
                // Create a new data object with the updated input and force recalculation
                return {
                  ...node,
                  data: {
                    ...node.data,
                    [isInput1 ? 'input1' : 'input2']: calcValue,
                    // Remove result to force recalculation
                    result: undefined
                  }
                };
              } else {
                // Generic approach for other node types
                shouldUpdate = node.data.value !== outputValue;
                if (shouldUpdate) {
                  updated = true;
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      value: outputValue
                    }
                  };
                }
              }
            }
          }
          return node;
        });
        
        return updated ? newNodes : nds;
      });
    }
  }, [nodes, edges, setNodes]);
  
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

  // Add a Tailwind node to the canvas
  const addTailwindNode = useCallback(() => {
    const newNode: Node = {
      id: `tailwind-${Date.now()}`,
      type: 'tailwind',
      position: { 
        x: Math.random() * 500, 
        y: Math.random() * 300 
      },
      data: { 
        label: `Tailwind Node ${nodes.length + 1}`,
        value: Math.floor(Math.random() * 1000)
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    
    // Show toast notification
    setToast({ message: 'Added Tailwind node' });
    setTimeout(() => setToast(null), 3000);
  }, [nodes, setNodes]);

  // Save flow to localStorage
  const handleSaveFlow = useCallback(() => {
    try {
      const flow = {
        nodes,
        edges,
        edgeType,
        edgeColor,
        edgeAnimated,
        showMarker,
      };
      localStorage.setItem('savedFlow', JSON.stringify(flow));
      setToast({ message: 'Flow saved successfully' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error saving flow:', error);
      setToast({ message: 'Error saving flow' });
      setTimeout(() => setToast(null), 3000);
    }
  }, [nodes, edges, edgeType, edgeColor, edgeAnimated, showMarker]);
  
  // Load flow from localStorage
  const handleLoadFlow = useCallback(() => {
    try {
      const savedFlow = localStorage.getItem('savedFlow');
      if (savedFlow) {
        const flow = JSON.parse(savedFlow);
        
        // Set history action to prevent adding to history
        isHistoryActionRef.current = true;
        
        // Update state with saved flow
        setNodes(flow.nodes);
        setEdges(flow.edges);
        setEdgeType(flow.edgeType);
        setEdgeColor(flow.edgeColor);
        setEdgeAnimated(flow.edgeAnimated);
        setShowMarker(flow.showMarker);
        
        // Update connection line type based on edge type
        switch (flow.edgeType) {
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
        }
        
        setToast({ message: 'Flow loaded successfully' });
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast({ message: 'No saved flow found' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error('Error loading flow:', error);
      setToast({ message: 'Error loading flow' });
      setTimeout(() => setToast(null), 3000);
    }
  }, [setNodes, setEdges]);
  
  // Save a default flow with JSON Load, JSON Display, Number Input, and Calculation nodes
  const saveDefaultFlow = useCallback(() => {
    try {
      // Create a default flow with the nodes already set up
      const defaultNodes: Node[] = [
        {
          id: 'jsonload-1',
          type: 'jsonload',
          position: { x: 100, y: 100 },
          data: { 
            label: 'JSON Load Node',
            jsonData: null
          }
        },
        {
          id: 'jsondisplay-1',
          type: 'jsondisplay',
          position: { x: 100, y: 300 },
          data: { 
            label: 'JSON Display Node',
            jsonData: null,
            outputValue: null,
            outputMode: 'raw' // Default to raw output mode
          }
        },
        {
          id: 'debugdisplay-1',
          type: 'debugdisplay',
          position: { x: 100, y: 500 },
          data: { 
            label: 'Debug Display Node',
            description: 'Connect to any node to see its data'
          }
        },
        {
          id: 'numberinput-1',
          type: 'numberinput',
          position: { x: 400, y: 100 },
          data: { 
            label: 'Number Input',
            value: 7
          }
        },
        {
          id: 'calculation-1',
          type: 'calculation',
          position: { x: 400, y: 300 },
          data: { 
            label: 'Calculation',
            operation: 'multiplication',
            input1: 0,
            input2: 0,
            result: 0
          }
        }
      ];
      
      // Create edges connecting the nodes
      const defaultEdges: Edge[] = [
        {
          id: 'edge-jsonload-jsondisplay',
          source: 'jsonload-1',
          target: 'jsondisplay-1',
          type: undefined,
          animated: false,
          style: { strokeWidth: 1.5, stroke: edgeColor },
          data: { 
            offset: 15, 
            borderRadius: 8,
            type: 'step'
          }
        },
        {
          id: 'edge-jsondisplay-debugdisplay',
          source: 'jsondisplay-1',
          target: 'debugdisplay-1',
          type: undefined,
          animated: false,
          style: { strokeWidth: 1.5, stroke: edgeColor },
          data: { 
            offset: 15, 
            borderRadius: 8,
            type: 'step'
          }
        },
        {
          id: 'edge-jsondisplay-calculation',
          source: 'jsondisplay-1',
          target: 'calculation-1',
          targetHandle: 'input1',
          type: undefined,
          animated: false,
          style: { strokeWidth: 1.5, stroke: edgeColor },
          data: { 
            offset: 15, 
            borderRadius: 8,
            type: 'step'
          }
        },
        {
          id: 'edge-numberinput-calculation',
          source: 'numberinput-1',
          target: 'calculation-1',
          targetHandle: 'input2',
          type: undefined,
          animated: false,
          style: { strokeWidth: 1.5, stroke: edgeColor },
          data: { 
            offset: 15, 
            borderRadius: 8,
            type: 'step'
          }
        }
      ];
      
      const defaultFlow = {
        nodes: defaultNodes,
        edges: defaultEdges,
        edgeType,
        edgeColor,
        edgeAnimated,
        showMarker
      };
      
      localStorage.setItem('defaultFlow', JSON.stringify(defaultFlow));
      setToast({ message: 'Default flow saved successfully' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error saving default flow:', error);
      setToast({ message: 'Error saving default flow' });
      setTimeout(() => setToast(null), 3000);
    }
  }, [edgeType, edgeColor, edgeAnimated, showMarker]);
  
  useEffect(() => {
    if (isInitialRender.current) {
      // Always create a new default flow
      saveDefaultFlow();
      
      // Then load it
      const newDefaultFlow = localStorage.getItem('defaultFlow');
      if (newDefaultFlow) {
        const flow = JSON.parse(newDefaultFlow);
        setNodes(flow.nodes);
        setEdges(flow.edges);
        setToast({ message: 'Default flow loaded' });
        setTimeout(() => setToast(null), 5000);
      }
      
      // Also check if there's a saved flow (but don't load it automatically)
      const savedFlow = localStorage.getItem('savedFlow');
      if (savedFlow) {
        try {
          // Don't automatically load, just show a toast that a saved flow exists
          setToast({ message: 'Saved flow available. Click "Load Flow" to restore.' });
          setTimeout(() => setToast(null), 5000);
        } catch (error) {
          console.error('Error checking saved flow:', error);
        }
      }
    }
  }, [setNodes, setEdges, saveDefaultFlow]);
  
  // Load the default flow
  const loadDefaultFlow = useCallback(() => {
    try {
      const defaultFlow = localStorage.getItem('defaultFlow');
      if (defaultFlow) {
        const flow = JSON.parse(defaultFlow);
        
        // Set history action to prevent adding to history
        isHistoryActionRef.current = true;
        
        // Update state with default flow
        setNodes(flow.nodes);
        setEdges(flow.edges);
        
        setToast({ message: 'Default flow loaded successfully' });
        setTimeout(() => setToast(null), 3000);
      } else {
        // If no default flow exists, create and save one
        saveDefaultFlow();
        
        // Then load it
        const newDefaultFlow = localStorage.getItem('defaultFlow');
        if (newDefaultFlow) {
          const flow = JSON.parse(newDefaultFlow);
          setNodes(flow.nodes);
          setEdges(flow.edges);
        }
        
        setToast({ message: 'Created and loaded default flow' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error('Error loading default flow:', error);
      setToast({ message: 'Error loading default flow' });
      setTimeout(() => setToast(null), 3000);
    }
  }, [setNodes, setEdges, saveDefaultFlow]);

  return (
    <div className="w-full h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={(event) => {
          // Close context menu when clicking elsewhere on the pane
          if (contextMenu.visible) {
            setContextMenu({ ...contextMenu, visible: false });
          }
        }}
        onPaneContextMenu={(event) => {
          // Prevent default context menu
          event.preventDefault();
          
          // Show our custom context menu at the mouse position
          setContextMenu({
            x: event.clientX,
            y: event.clientY,
            visible: true
          });
        }}
        onDoubleClick={handleDoubleClick}
        deleteKeyCode="Delete"
        fitView
        zoomOnDoubleClick={false}
        zoomOnScroll={true}
        panOnScroll={false}
        panOnDrag={true}
        attributionPosition="bottom-left"
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.Step}
        connectionLineStyle={{ stroke: edgeColor, strokeWidth: 1.5 }}
        className="bg-[#F7F9FB] dark:bg-[#1a1a1a]"
        defaultEdgeOptions={{ 
          type: edgeAnimated ? 'animated' : undefined,
          style: { strokeWidth: 1.5, stroke: edgeColor },
          data: { 
            offset: 15, 
            borderRadius: 8,
            type: 'step' // Force step type for square edges with rounded corners
          }
        }}
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <div className="flex space-x-2">
            <button
              onClick={() => handleAction('undo')}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={historyIndex <= 0}
            >
              Undo
            </button>
            <button
              onClick={() => handleAction('redo')}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={historyIndex >= history.length - 1}
            >
              Redo
            </button>
          </div>
        </Panel>
        <KeyboardShortcuts onShortcut={handleAction} />
        <SelectionTracker onSelectionChange={handleSelectionChange} />
        
        {/* Context Menu for adding nodes on double-click */}
        {contextMenu.visible && (
          <ContextNodeMenu
            position={{ x: contextMenu.x, y: contextMenu.y }}
            onClose={() => setContextMenu({ ...contextMenu, visible: false })}
            onNodeSelect={(type) => {
              const reactFlowBounds = document.querySelector('.react-flow')?.getBoundingClientRect();
              if (reactFlowBounds) {
                const position = screenToFlowPosition({
                  x: contextMenu.x - reactFlowBounds.left,
                  y: contextMenu.y - reactFlowBounds.top
                });
                addNodeAtPosition(type, position);
              }
            }}
          />
        )}
      </ReactFlow>
      
      {/* UI Components */}
      <NodeSelector className="absolute top-4 left-4 z-10" />
      <FlowToolbar className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10" onAction={handleAction} />
      <HelpPanel className="absolute top-4 right-4 z-10" />
      <SavePanel 
        className="absolute bottom-4 right-4 z-10" 
        onSave={handleSaveFlow} 
        onLoad={handleLoadFlow} 
        onLoadDefault={loadDefaultFlow}
      />
      
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          {toast.message}
        </div>
      )}
    </div>
  );
}

// Wrap the Flow component with ReactFlowProvider to ensure context is available
export default function FlowPage() {
  // State to track if we're on client side
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render on client side
  if (!isClient) {
    return <LoadingFallback />;
  }

  return (
    <ClientErrorBoundary>
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </ClientErrorBoundary>
  );
} 