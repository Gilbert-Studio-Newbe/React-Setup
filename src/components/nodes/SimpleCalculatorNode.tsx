import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Handle, Position, useNodeId, useUpdateNodeInternals, useNodeConnections } from '@xyflow/react';
import { useReactFlow } from '@xyflow/react';

// Define the operations available for the calculator
type Operation = 'add' | 'subtract' | 'multiply' | 'divide';

// Define the data structure for the calculator node
interface SimpleCalculatorNodeData {
  operation: Operation;
  input1?: number;
  input2?: number;
  result?: number;
}

// The SimpleCalculatorNode component
export default function SimpleCalculatorNode({ data }: { data: SimpleCalculatorNodeData }) {
  const nodeId = useNodeId();
  const { getNode, setNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const connections = useNodeConnections();
  const isInitialRender = useRef(true);
  
  // Local state to prevent unnecessary re-renders
  const [localState, setLocalState] = useState({
    input1: data.input1,
    input2: data.input2,
    result: data.result,
    operation: data.operation || 'add'
  });

  // Memoize the connections to input handles
  const { input1Connection, input2Connection } = useMemo(() => {
    const input1Conn = connections.incoming.find(c => c.target === nodeId && c.targetHandle === 'input1');
    const input2Conn = connections.incoming.find(c => c.target === nodeId && c.targetHandle === 'input2');
    
    return {
      input1Connection: input1Conn,
      input2Connection: input2Conn
    };
  }, [connections.incoming, nodeId]);

  // Get source node values
  const sourceValues = useMemo(() => {
    let input1Value = undefined;
    let input2Value = undefined;
    
    if (input1Connection) {
      const sourceNode = getNode(input1Connection.source);
      input1Value = sourceNode?.data?.result;
    }
    
    if (input2Connection) {
      const sourceNode = getNode(input2Connection.source);
      input2Value = sourceNode?.data?.result;
    }
    
    return { input1Value, input2Value };
  }, [input1Connection, input2Connection, getNode]);

  // Calculate the result based on inputs and operation
  const calculateResult = useCallback((input1: number | undefined, input2: number | undefined, operation: Operation): number | undefined => {
    if (input1 === undefined || input2 === undefined) {
      return undefined;
    }
    
    switch (operation) {
      case 'add':
        return input1 + input2;
      case 'subtract':
        return input1 - input2;
      case 'multiply':
        return input1 * input2;
      case 'divide':
        return input2 === 0 ? undefined : input1 / input2;
      default:
        return undefined;
    }
  }, []);

  // Memoize the result calculation
  const calculatedResult = useMemo(() => {
    return calculateResult(sourceValues.input1Value, sourceValues.input2Value, localState.operation);
  }, [sourceValues.input1Value, sourceValues.input2Value, localState.operation, calculateResult]);

  // Update node data when inputs or operation changes
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    const newInput1 = sourceValues.input1Value;
    const newInput2 = sourceValues.input2Value;
    const newResult = calculatedResult;
    
    // Only update if values have actually changed
    if (
      newInput1 !== localState.input1 || 
      newInput2 !== localState.input2 || 
      newResult !== localState.result
    ) {
      setLocalState({
        input1: newInput1,
        input2: newInput2,
        result: newResult,
        operation: localState.operation
      });
      
      setNodes(nodes => 
        nodes.map(node => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                input1: newInput1,
                input2: newInput2,
                result: newResult
              }
            };
          }
          return node;
        })
      );
    }
  }, [sourceValues.input1Value, sourceValues.input2Value, calculatedResult, nodeId, setNodes, localState]);

  // Handle operation change
  const handleOperationChange = useCallback((newOperation: Operation) => {
    setLocalState(prev => ({
      ...prev,
      operation: newOperation
    }));
    
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              operation: newOperation
            }
          };
        }
        return node;
      })
    );
  }, [nodeId, setNodes]);

  // Get the operation symbol for display
  const getOperationSymbol = (op: Operation): string => {
    switch (op) {
      case 'add': return '+';
      case 'subtract': return '-';
      case 'multiply': return '×';
      case 'divide': return '÷';
      default: return '+';
    }
  };

  return (
    <div className="calculator-node">
      <div className="node-header">Calculator ({getOperationSymbol(localState.operation)})</div>
      
      <div className="node-content">
        <div className="input-row">
          <span>Input 1:</span>
          <span className="value">{localState.input1 !== undefined ? localState.input1 : 'Not connected'}</span>
          <Handle
            type="target"
            position={Position.Left}
            id="input1"
            style={{ top: '30%' }}
          />
        </div>
        
        <div className="input-row">
          <span>Input 2:</span>
          <span className="value">{localState.input2 !== undefined ? localState.input2 : 'Not connected'}</span>
          <Handle
            type="target"
            position={Position.Left}
            id="input2"
            style={{ top: '70%' }}
          />
        </div>
        
        <div className="operation-selector">
          <button 
            className={localState.operation === 'add' ? 'active' : ''} 
            onClick={() => handleOperationChange('add')}
          >
            +
          </button>
          <button 
            className={localState.operation === 'subtract' ? 'active' : ''} 
            onClick={() => handleOperationChange('subtract')}
          >
            -
          </button>
          <button 
            className={localState.operation === 'multiply' ? 'active' : ''} 
            onClick={() => handleOperationChange('multiply')}
          >
            ×
          </button>
          <button 
            className={localState.operation === 'divide' ? 'active' : ''} 
            onClick={() => handleOperationChange('divide')}
          >
            ÷
          </button>
        </div>
        
        <div className="result-row">
          <span>Result:</span>
          <span className="value">
            {localState.result !== undefined 
              ? localState.result 
              : 'N/A'}
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id="result"
            style={{ top: '50%' }}
          />
        </div>
      </div>
      
      <style jsx>{`
        .calculator-node {
          width: 220px;
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
        
        .value {
          font-weight: bold;
          color: #333;
        }
        
        .operation-selector {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
        }
        
        .operation-selector button {
          width: 40px;
          height: 40px;
          border: 1px solid #ddd;
          background: #f8f8f8;
          border-radius: 3px;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s;
        }
        
        .operation-selector button:hover {
          background: #e8e8e8;
        }
        
        .operation-selector button.active {
          background: #e0e0e0;
          border-color: #aaa;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
} 