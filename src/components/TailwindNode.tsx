import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

// Define the data structure for the node
interface TailwindNodeData {
  label: string;
  value?: number;
}

// Custom node component styled with Tailwind CSS
function TailwindNode({ data, isConnectable }: NodeProps<TailwindNodeData>) {
  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-white border-2 border-black dark:bg-gray-800 dark:border-gray-600">
      <div className="flex">
        {/* Left handle for inputs */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-2 h-4 !bg-black dark:!bg-gray-400 border-none"
          isConnectable={isConnectable}
        />
        
        <div className="ml-2">
          <div className="text-lg font-bold text-black dark:text-white">{data.label}</div>
          {data.value !== undefined && (
            <div className="text-gray-700 dark:text-gray-300">Value: {data.value}</div>
          )}
        </div>
        
        {/* Right handle for outputs */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-2 h-4 !bg-black dark:!bg-gray-400 border-none"
          isConnectable={isConnectable}
        />
      </div>
    </div>
  );
}

export default memo(TailwindNode); 