'use client';

import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ConnectionLineType,
  MarkerType,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Import custom node types
import NumberInputNode from '../../../components/NumberInputNode';
import CostInputNode from '../../../components/CostInputNode';
import CalculationNode from '../../../components/CalculationNode';
import ResultNode from '../../../components/ResultNode';
import TailwindNode from '../../../components/TailwindNode';
import IfcImportNode from '../../../components/IfcImportNode';
import JsonLoadNode from '../../../components/JsonLoadNode';
import JsonDisplayNode from '../../../components/JsonDisplayNode';
import ClientOnlyDebugDisplayNode from '../../../components/ClientOnlyDebugDisplayNode';
import JoinNode from '../../../components/JoinNode';
import CSVImportNode from '../../../components/CSVImportNode';
import MaterialCostNode from '../../../components/MaterialCostNode';
import JsonParameterFormatterNode from '../../../components/JsonParameterFormatterNode';

// Import custom edge types
import StyledEdge from '../../../components/StyledEdge';
import ButtonEdge from '../../../components/ButtonEdge';
import AnimatedEdge from '../../../components/AnimatedEdge';

// Import NodeSelector
import NodeSelector from '../../../components/NodeSelector';

// Import our custom hook for calculations
import useNodeCalculations from './useNodeCalculations';

// Define node types
const nodeTypes = {
  numberinput: NumberInputNode,
  costinput: CostInputNode,
  calculation: CalculationNode,
  result: ResultNode,
  tailwind: TailwindNode,
  ifcimport: IfcImportNode,
  jsonload: JsonLoadNode,
  jsondisplay: JsonDisplayNode,
  debugdisplay: ClientOnlyDebugDisplayNode,
  join: JoinNode,
  csvimport: CSVImportNode,
  materialcost: MaterialCostNode,
  jsonparameterformatter: JsonParameterFormatterNode,
};

// Define edge types
const edgeTypes = {
  default: StyledEdge,
  button: ButtonEdge,
  animated: AnimatedEdge,
};

// Create initial nodes with built-in types and custom types
const initialNodes: Node[] = [
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
const initialEdges: Edge[] = [
  // Connect inputs to first calculation
  { 
    id: 'e1-3', 
    source: 'numberinput-1', 
    target: 'calculation-1',
    type: 'default',
    data: {
      color: '#6366f1',
      strokeWidth: 2
    }
  },
  { 
    id: 'e2-3', 
    source: 'numberinput-2', 
    target: 'calculation-1',
    type: 'default',
    data: {
      color: '#6366f1',
      strokeWidth: 2
    }
  },
  
  // Connect first calculation and cost input to second calculation
  { 
    id: 'e3-4', 
    source: 'calculation-1', 
    target: 'calculation-2',
    type: 'default',
    data: {
      color: '#f59e0b',
      strokeWidth: 2
    }
  },
  { 
    id: 'e5-4', 
    source: 'costinput-1', 
    target: 'calculation-2',
    type: 'default',
    data: {
      color: '#f59e0b',
      strokeWidth: 2
    }
  },
  
  // Connect second calculation to result
  { 
    id: 'e4-6', 
    source: 'calculation-2', 
    target: 'result-1',
    type: 'animated',
    data: {
      color: '#10b981',
      strokeWidth: 2
    }
  },
];

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Use our custom hook for calculations
  const { 
    updateCalculations,
    onNodesChange: calculationNodesChange,
    onEdgesChange: calculationEdgesChange,
    onConnect: calculationConnect
  } = useNodeCalculations();

  // Combine the standard handlers with our calculation handlers
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    calculationNodesChange(changes);
  }, [onNodesChange, calculationNodesChange]);

  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    calculationEdgesChange(changes);
  }, [onEdgesChange, calculationEdgesChange]);

  const handleConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'default',
        data: {
          color: '#6366f1',
          strokeWidth: 2
        }
      };
      setEdges((eds) => addEdge(newEdge, eds));
      calculationConnect(params);
    },
    [setEdges, calculationConnect]
  );

  // Run calculations when the component mounts
  useEffect(() => {
    updateCalculations();
  }, [updateCalculations]);

  // Handle input value changes
  const handleNodeDataChange = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData,
            },
          };
        }
        return node;
      })
    );
    
    // Update calculations after data changes
    setTimeout(() => {
      updateCalculations();
    }, 0);
  }, [setNodes, updateCalculations]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: 'default',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        }}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background />
        
        {/* Add NodeSelector in the top right corner */}
        <Panel position="top-right" className="m-4">
          <NodeSelector />
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function ClientTestFlow() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
} 