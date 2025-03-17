import React, { useCallback, useMemo, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow, useNodeId, useNodeConnections } from '@xyflow/react';

/**
 * Standard data types supported by nodes in the application
 */
export enum DataType {
  NUMBER = 'number',
  STRING = 'string',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  BIM_ELEMENT = 'bim_element',
  BIM_COLLECTION = 'bim_collection',
  PARAMETER = 'parameter',
  UNDEFINED = 'undefined'
}

/**
 * Standard port types for node inputs and outputs
 */
export enum PortType {
  INPUT = 'input',
  OUTPUT = 'output'
}

/**
 * Interface for port configuration
 */
export interface Port {
  /** Unique identifier for the port */
  id: string;
  /** Display name for the port */
  label?: string;
  /** Data type this port accepts or produces */
  dataType: DataType;
  /** Purpose of this port (e.g., 'value1', 'result', 'filtered') */
  purpose: string;
  /** Position percentage (0-100) along the node edge */
  position?: number;
  /** Side of the node where the port appears */
  side?: 'left' | 'right' | 'top' | 'bottom';
  /** Custom styling for the port */
  style?: React.CSSProperties;
  /** Whether this port is required for the node to function */
  required?: boolean;
  /** Description of what this port expects or produces */
  description?: string;
  /** Current connection status of this port */
  connected?: boolean;
  /** Default value to use when disconnected */
  defaultValue?: any;
}

/**
 * Base interface that can be extended by specific node types
 */
export interface BaseNodeData {
  /** Display label for the node */
  label?: string;
  /** Input value (can be various types) */
  value?: number | string | boolean | object | any[];
  /** Output value (can be various types) */
  outputValue?: number | string | boolean | object | any[];
  /** Result value that will be passed to downstream nodes */
  result?: any;
  /** Error message if node processing failed */
  error?: string;
  /** Warning message for non-critical issues */
  warning?: string;
  /** Whether the node is in a loading state */
  isLoading?: boolean;
  /** Input ports configuration */
  inputPorts?: Port[];
  /** Output ports configuration */
  outputPorts?: Port[];
  /** Allow additional properties */
  [key: string]: unknown;
}

/**
 * Props interface for the BaseNode component
 */
interface BaseNodeProps extends Omit<NodeProps, 'data'> {
  /** Node data containing values and configuration */
  data?: BaseNodeData;
  /** Child components to render inside the node */
  children?: React.ReactNode;
  /** Error message to display */
  error?: string;
  /** Warning message to display */
  warning?: string;
  /** Handle configuration for inputs and outputs */
  handles?: {
    inputs?: Port[];
    outputs?: Port[];
  };
  /** Node dimensions */
  nodeSize?: {
    width: number;
    height: number;
  };
  /** Additional elements to display in the title area */
  titleExtras?: React.ReactNode;
  /** Whether the node supports expanding/collapsing */
  expandable?: boolean;
  /** Whether the node is currently expanded */
  expanded?: boolean;
  /** Callback when expand/collapse is toggled */
  onToggleExpand?: () => void;
  /** Custom class names to apply to the node */
  className?: string;
  /** Callback when an input is connected or disconnected */
  onInputConnectionChange?: (portId: string, connected: boolean) => void;
}

/**
 * BaseNode component that serves as the foundation for all node types in the application.
 * This component handles common functionality like rendering handles, error states,
 * and providing a consistent layout structure.
 * 
 * @param props - Component props
 * @returns React component
 */
export const BaseNode = ({ 
  id,
  data,
  isConnectable,
  children,
  error,
  warning,
  handles = {
    inputs: [{ id: 'input_undefined_default', dataType: DataType.UNDEFINED, purpose: 'default', position: 50 }],
    outputs: [{ id: 'output_undefined_default', dataType: DataType.UNDEFINED, purpose: 'default', position: 50 }]
  },
  nodeSize = { width: 280, height: 120 },
  titleExtras = null,
  expandable = false,
  expanded = true,
  onToggleExpand = () => {},
  className = '',
  onInputConnectionChange
}: BaseNodeProps) => {
  // Use error from props or from data
  const errorMessage = error || data?.error;
  const warningMessage = warning || data?.warning;
  
  // Access React Flow instance to get edges and nodes
  const { getNode, setNodes } = useReactFlow();
  const nodeId = id || useNodeId();
  
  // Get connections for this node using the useNodeConnections hook
  const connections = useNodeConnections(nodeId);
  
  // Generate standardized port IDs based on data type and purpose
  const getStandardPortId = useCallback((port: Port, type: PortType): string => {
    return `${type}_${port.dataType}_${port.purpose}`;
  }, []);
  
  // Memoize inputs and outputs to prevent unnecessary re-renders
  const inputPorts = useMemo(() => {
    // Use inputs from data if available, otherwise use from props
    return data?.inputPorts || handles.inputs || [];
  }, [data?.inputPorts, handles.inputs]);
  
  const outputPorts = useMemo(() => {
    // Use outputs from data if available, otherwise use from props
    return data?.outputPorts || handles.outputs || [];
  }, [data?.outputPorts, handles.outputs]);
  
  // Determine node height based on expanded state
  const nodeHeight = useMemo(() => {
    if (!expandable) return nodeSize.height;
    return expanded ? nodeSize.height : 60; // Collapsed height
  }, [expandable, expanded, nodeSize.height]);
  
  // Handle expand/collapse click
  const handleExpandClick = useCallback(() => {
    if (expandable && onToggleExpand) {
      onToggleExpand();
    }
  }, [expandable, onToggleExpand]);

  // Find source nodes for all input ports
  const findSourceNodes = useCallback(() => {
    if (!connections || !connections.incomers) return {};
    
    const sourceNodes: Record<string, any> = {};
    
    inputPorts.forEach(port => {
      const portId = port.id || getStandardPortId(port, PortType.INPUT);
      const connection = connections.incomers.find(edge => edge.targetHandle === portId);
      
      if (connection) {
        const sourceNode = getNode(connection.source);
        sourceNodes[portId] = sourceNode;
      }
    });
    
    return sourceNodes;
  }, [connections, inputPorts, getNode, getStandardPortId]);
  
  // Get source nodes for all input ports
  const sourceNodes = findSourceNodes();
  
  // Check connection status for all input ports
  useEffect(() => {
    if (!nodeId || !connections) return;
    
    // Check each input port's connection status
    const updatedPorts = inputPorts.map(port => {
      const portId = port.id || getStandardPortId(port, PortType.INPUT);
      const isConnected = connections.incomers?.some(edge => edge.targetHandle === portId) || false;
      
      // If the connection status has changed
      if (port.connected !== isConnected) {
        // Call the onInputConnectionChange callback if provided
        if (onInputConnectionChange) {
          onInputConnectionChange(portId, isConnected);
        }
        
        // Return updated port with new connection status
        return { ...port, connected: isConnected };
      }
      
      return port;
    });
    
    // Check if any ports have changed
    const hasChanges = updatedPorts.some((port, index) => port.connected !== inputPorts[index].connected);
    
    // If there are changes, update the node data
    if (hasChanges) {
      // Update the node data with new connection statuses
      setNodes(nodes => 
        nodes.map(node => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                inputPorts: updatedPorts
              }
            };
          }
          return node;
        })
      );
    }
  }, [nodeId, inputPorts, connections, setNodes, getStandardPortId, onInputConnectionChange]);
  
  return (
    <div 
      className={`
        relative p-3 rounded-lg border-2 
        ${errorMessage ? 'border-red-400' : warningMessage ? 'border-yellow-400' : 'border-gray-300'} 
        bg-white dark:bg-gray-800 
        ${className}
      `}
      style={{ 
        width: nodeSize.width, 
        height: nodeHeight,
        transition: 'height 0.2s ease-in-out'
      }}
    >
      {/* Title bar */}
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium text-gray-800 dark:text-gray-200">
          {data?.label || 'Node'}
        </div>
        <div className="flex items-center">
          {titleExtras}
          {expandable && (
            <button 
              onClick={handleExpandClick}
              className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {expanded ? '▼' : '▶'}
            </button>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {errorMessage && (
        <div className="text-red-500 text-sm mb-2 p-1 bg-red-50 dark:bg-red-900/20 rounded">
          {errorMessage}
        </div>
      )}
      
      {/* Warning message */}
      {warningMessage && (
        <div className="text-yellow-500 text-sm mb-2 p-1 bg-yellow-50 dark:bg-yellow-900/20 rounded">
          {warningMessage}
        </div>
      )}
      
      {/* Loading indicator */}
      {data?.isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Node content */}
      <div 
        className="overflow-hidden" 
        style={{ 
          height: expandable ? (expanded ? 'calc(100% - 40px)' : '0px') : 'calc(100% - 30px)',
          transition: 'height 0.2s ease-in-out'
        }}
      >
        {children}
      </div>
      
      {/* Input handles */}
      {inputPorts.map((port) => {
        const portId = port.id || getStandardPortId(port, PortType.INPUT);
        const position = port.position || 50;
        const side = port.side || 'left';
        
        const getPortColor = (dataType: DataType) => {
          switch (dataType) {
            case DataType.NUMBER:
              return '#3498db'; // Blue
            case DataType.STRING:
              return '#2ecc71'; // Green
            case DataType.BOOLEAN:
              return '#e74c3c'; // Red
            case DataType.OBJECT:
              return '#9b59b6'; // Purple
            case DataType.ARRAY:
              return '#f39c12'; // Orange
            case DataType.BIM_ELEMENT:
              return '#1abc9c'; // Turquoise
            case DataType.BIM_COLLECTION:
              return '#34495e'; // Dark blue
            case DataType.PARAMETER:
              return '#d35400'; // Dark orange
            default:
              return '#95a5a6'; // Gray
          }
        };
        
        const getHandlePosition = (side: string): Position => {
          switch (side) {
            case 'right':
              return Position.Right;
            case 'top':
              return Position.Top;
            case 'bottom':
              return Position.Bottom;
            case 'left':
            default:
              return Position.Left;
          }
        };
        
        const getHandleStyle = (side: string, position: number) => {
          const baseStyle = { 
            background: getPortColor(port.dataType),
            ...port.style
          };
          
          switch (side) {
            case 'right':
              return { ...baseStyle, right: -8, top: `${position}%` };
            case 'top':
              return { ...baseStyle, top: -8, left: `${position}%` };
            case 'bottom':
              return { ...baseStyle, bottom: -8, left: `${position}%` };
            case 'left':
            default:
              return { ...baseStyle, left: -8, top: `${position}%` };
          }
        };
        
        return (
          <Handle
            key={`input-${portId}`}
            type="target"
            position={getHandlePosition(side)}
            id={portId}
            style={getHandleStyle(side, position)}
            isConnectable={isConnectable}
          />
        );
      })}
      
      {/* Output handles */}
      {outputPorts.map((port) => {
        const portId = port.id || getStandardPortId(port, PortType.OUTPUT);
        const position = port.position || 50;
        const side = port.side || 'right';
        
        const getPortColor = (dataType: DataType) => {
          switch (dataType) {
            case DataType.NUMBER:
              return '#3498db'; // Blue
            case DataType.STRING:
              return '#2ecc71'; // Green
            case DataType.BOOLEAN:
              return '#e74c3c'; // Red
            case DataType.OBJECT:
              return '#9b59b6'; // Purple
            case DataType.ARRAY:
              return '#f39c12'; // Orange
            case DataType.BIM_ELEMENT:
              return '#1abc9c'; // Turquoise
            case DataType.BIM_COLLECTION:
              return '#34495e'; // Dark blue
            case DataType.PARAMETER:
              return '#d35400'; // Dark orange
            default:
              return '#95a5a6'; // Gray
          }
        };
        
        const getHandlePosition = (side: string): Position => {
          switch (side) {
            case 'left':
              return Position.Left;
            case 'top':
              return Position.Top;
            case 'bottom':
              return Position.Bottom;
            case 'right':
            default:
              return Position.Right;
          }
        };
        
        const getHandleStyle = (side: string, position: number) => {
          const baseStyle = { 
            background: getPortColor(port.dataType),
            ...port.style
          };
          
          switch (side) {
            case 'left':
              return { ...baseStyle, left: -8, top: `${position}%` };
            case 'top':
              return { ...baseStyle, top: -8, left: `${position}%` };
            case 'bottom':
              return { ...baseStyle, bottom: -8, left: `${position}%` };
            case 'right':
            default:
              return { ...baseStyle, right: -8, top: `${position}%` };
          }
        };
        
        return (
          <Handle
            key={`output-${portId}`}
            type="source"
            position={getHandlePosition(side)}
            id={portId}
            style={getHandleStyle(side, position)}
            isConnectable={isConnectable}
          />
        );
      })}
    </div>
  );
};

export default BaseNode; 