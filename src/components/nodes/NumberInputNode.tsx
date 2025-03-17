import { useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position, useNodeId } from '@xyflow/react';
import { useReactFlow } from '@xyflow/react';

// Define the data structure for the number input node
interface NumberInputNodeData {
  value: number;
  result: number;
}

// The NumberInputNode component
export default function NumberInputNode({ data }: { data: NumberInputNodeData }) {
  const nodeId = useNodeId();
  const { setNodes } = useReactFlow();
  const isInitialRender = useRef(true);
  const previousValue = useRef<number | null>(null);
  
  // Local state to prevent unnecessary re-renders
  const [value, setValue] = useState<number>(data?.value || 0);
  
  // Initialize the value from data on first render
  useEffect(() => {
    if (isInitialRender.current) {
      setValue(data?.value || 0);
      isInitialRender.current = false;
    }
  }, [data?.value]);
  
  // Update the node data when the value changes
  const updateNodeData = useCallback((newValue: number) => {
    // Only update if the value has actually changed
    if (previousValue.current !== newValue) {
      previousValue.current = newValue;
      
      setNodes(nodes => 
        nodes.map(node => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                value: newValue,
                result: newValue
              }
            };
          }
          return node;
        })
      );
    }
  }, [nodeId, setNodes]);
  
  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    setValue(newValue);
    updateNodeData(newValue);
  }, [updateNodeData]);
  
  // Update node data when value changes
  useEffect(() => {
    if (!isInitialRender.current) {
      updateNodeData(value);
    }
  }, [value, updateNodeData]);
  
  return (
    <div className="number-input-node">
      <div className="node-header">Number Input</div>
      
      <div className="node-content">
        <div className="input-row">
          <input
            type="number"
            value={value}
            onChange={handleInputChange}
            className="number-input"
          />
        </div>
        
        <div className="result-row">
          <span>Output:</span>
          <span className="value">{value}</span>
          <Handle
            type="source"
            position={Position.Right}
            id="result"
          />
        </div>
      </div>
      
      <style jsx>{`
        .number-input-node {
          width: 180px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 5px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .node-header {
          padding: 8px;
          background: #f0f0f0;
          border-bottom: 1px solid #ddd;
          font-weight: bold;
          border-radius: 5px 5px 0 0;
        }
        
        .node-content {
          padding: 10px;
        }
        
        .input-row, .result-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          position: relative;
        }
        
        .number-input {
          width: 100%;
          padding: 5px;
          border: 1px solid #ddd;
          border-radius: 3px;
        }
        
        .value {
          font-weight: bold;
          color: #333;
        }
      `}</style>
    </div>
  );
} 