import { useCallback, useMemo, useEffect, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow, useNodeId, useStore } from '@xyflow/react';

// Define the data structure for the debug node
export type DebugNodeData = {
  inputValue?: any;
  stringifiedValue?: string;
  debug?: string;
};

// Function to stringify a value for display
const stringifyValue = (value: any): string => {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  
  try {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  } catch (err) {
    return `Error stringifying value: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
};

// Custom selector to get edges connected to this node
const getConnectedEdgesSelector = (nodeId: string) => (state: any) => {
  const edges = state.edges || [];
  return edges.filter((edge: any) => edge.target === nodeId);
};

// The DebugNode component
const DebugNode = ({ data }: NodeProps<DebugNodeData>) => {
  const nodeId = useNodeId();
  const { setNodes, getNode, getEdges } = useReactFlow();
  
  // Local state to prevent excessive re-renders
  const [localData, setLocalData] = useState({
    inputValue: data?.inputValue,
    stringifiedValue: data?.stringifiedValue
  });
  
  // Get connected edges using store selector
  const connectedEdges = useStore(getConnectedEdgesSelector(nodeId || ''));
  
  // Find the source node for the input using direct edge access - memoized to prevent recalculation
  const sourceInfo = useMemo(() => {
    const edges = getEdges();
    const edge = edges.find(e => e.target === nodeId && e.targetHandle === 'input');
    
    if (!edge) return { sourceNode: undefined, inputValue: undefined };
    
    const sourceNode = getNode(edge.source);
    const inputValue = sourceNode?.data?.result;
    
    return { sourceNode, inputValue };
  }, [nodeId, getEdges, getNode, connectedEdges]);
  
  // Stringify the input value for display
  const stringifiedValue = useMemo(() => {
    return stringifyValue(sourceInfo.inputValue);
  }, [sourceInfo.inputValue]);
  
  // Get the type of the input value
  const inputType = useMemo(() => {
    if (sourceInfo.inputValue === undefined) return 'undefined';
    if (sourceInfo.inputValue === null) return 'null';
    return typeof sourceInfo.inputValue;
  }, [sourceInfo.inputValue]);
  
  // Create debug info
  const debugInfo = useMemo(() => {
    return `
      NodeId: ${nodeId}
      Direct edges: ${JSON.stringify(getEdges().filter(e => e.target === nodeId))}
      Source Node: ${sourceInfo.sourceNode?.id || 'none'} (${typeof sourceInfo.sourceNode?.data?.result})
      Input Value: ${sourceInfo.inputValue}
    `;
  }, [nodeId, getEdges, sourceInfo]);
  
  // Update the node data when the input value changes, but only if it's actually changed
  useEffect(() => {
    // Check if values have actually changed to prevent unnecessary updates
    if (
      sourceInfo.inputValue !== localData.inputValue ||
      stringifiedValue !== localData.stringifiedValue
    ) {
      console.log(`Updating debug node ${nodeId} with input value:`, sourceInfo.inputValue);
      
      // Update local state first
      setLocalData({
        inputValue: sourceInfo.inputValue,
        stringifiedValue
      });
      
      // Then update the node data
      setNodes((nodes) => {
        return nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                inputValue: sourceInfo.inputValue,
                stringifiedValue,
                debug: debugInfo,
              },
            };
          }
          return node;
        });
      });
    }
  }, [nodeId, setNodes, sourceInfo.inputValue, stringifiedValue, debugInfo, localData]);
  
  return (
    <div className="debug-node">
      <div className="debug-node-header">
        <strong>Debug</strong>
      </div>
      
      <div className="debug-node-body">
        <div className="debug-node-row">
          <span>Type:</span>
          <span className="debug-node-type">{inputType}</span>
        </div>
        
        <div className="debug-node-value-container">
          <span>Value:</span>
          <pre className="debug-node-value">
            {stringifiedValue}
          </pre>
        </div>
        
        {/* Debug info (hidden in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-node-debug">
            <details>
              <summary>Debug Info</summary>
              <pre className="debug-node-debug-info">
                {debugInfo}
              </pre>
            </details>
          </div>
        )}
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#9b59b6' }}
      />
      
      <style jsx>{`
        .debug-node {
          width: 220px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 5px;
          overflow: hidden;
        }
        
        .debug-node-header {
          background: #f5f5f5;
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
        
        .debug-node-body {
          padding: 10px;
        }
        
        .debug-node-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .debug-node-type {
          font-family: monospace;
          background: #f0f0f0;
          padding: 2px 6px;
          border-radius: 3px;
        }
        
        .debug-node-value-container {
          display: flex;
          flex-direction: column;
        }
        
        .debug-node-value {
          font-family: monospace;
          background: #f8f8f8;
          padding: 8px;
          border-radius: 3px;
          margin-top: 4px;
          overflow: auto;
          max-height: 150px;
          white-space: pre-wrap;
          word-break: break-all;
          font-size: 12px;
          border: 1px solid #eee;
        }
        
        .debug-node-debug {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed #eee;
        }
        
        .debug-node-debug-info {
          font-family: monospace;
          font-size: 10px;
          background: #f8f8f8;
          padding: 5px;
          border-radius: 3px;
          margin-top: 5px;
          overflow: auto;
          max-height: 100px;
          white-space: pre-wrap;
          word-break: break-all;
        }
      `}</style>
    </div>
  );
};

export default DebugNode; 