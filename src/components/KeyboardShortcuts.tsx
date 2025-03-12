'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useReactFlow, Node, Edge } from '@xyflow/react';

interface KeyboardShortcutsProps {
  onShortcut?: (action: string, data?: any) => void;
}

export default function KeyboardShortcuts({ onShortcut }: KeyboardShortcutsProps) {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const clipboardRef = useRef<{nodes: Node[]; edges: Edge[]}>({ nodes: [], edges: [] });
  
  // Handle delete operation
  const handleDelete = useCallback(() => {
    const allNodes = getNodes();
    const allEdges = getEdges();
    
    const selectedNodes = allNodes.filter(node => node.selected);
    const selectedEdges = allEdges.filter(edge => edge.selected);
    
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
    
    // Delete selected nodes
    if (selectedNodes.length > 0) {
      setNodes((nodes) => nodes.filter((node) => !node.selected));
    }
    
    // Delete selected edges
    if (selectedEdges.length > 0) {
      setEdges((edges) => edges.filter((edge) => !edge.selected));
    }
    
    if (onShortcut) {
      onShortcut('delete', { nodeCount: selectedNodes.length, edgeCount: selectedEdges.length });
    }
  }, [getNodes, getEdges, setNodes, setEdges, onShortcut]);
  
  // Handle copy operation
  const handleCopy = useCallback(() => {
    const allNodes = getNodes();
    const allEdges = getEdges();
    
    const selectedNodes = allNodes.filter(node => node.selected);
    const selectedEdges = allEdges.filter(edge => 
      edge.selected && 
      selectedNodes.some(node => node.id === edge.source) && 
      selectedNodes.some(node => node.id === edge.target)
    );
    
    if (selectedNodes.length === 0) return;
    
    clipboardRef.current = {
      nodes: selectedNodes,
      edges: selectedEdges,
    };
    
    if (onShortcut) {
      onShortcut('copy', { nodeCount: selectedNodes.length, edgeCount: selectedEdges.length });
    }
  }, [getNodes, getEdges, onShortcut]);
  
  // Handle paste operation
  const handlePaste = useCallback(() => {
    const { nodes: clipboardNodes, edges: clipboardEdges } = clipboardRef.current;
    
    if (clipboardNodes.length === 0) return;
    
    // Create a mapping of old node IDs to new node IDs
    const idMap = new Map();
    
    // Create new nodes with new IDs and positions offset from the originals
    const newNodes = clipboardNodes.map((node) => {
      const newId = `${node.id}-copy-${Date.now()}`;
      idMap.set(node.id, newId);
      
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        selected: true,
      };
    });
    
    // Create new edges with updated source and target IDs
    const newEdges = clipboardEdges.map((edge) => ({
      ...edge,
      id: `${edge.id}-copy-${Date.now()}`,
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target) || edge.target,
      selected: true,
    }));
    
    // Add new nodes and edges to the flow
    setNodes((nodes) => [...nodes.map(node => ({ ...node, selected: false })), ...newNodes]);
    setEdges((edges) => [...edges.map(edge => ({ ...edge, selected: false })), ...newEdges]);
    
    if (onShortcut) {
      onShortcut('paste', { nodeCount: newNodes.length, edgeCount: newEdges.length });
    }
  }, [setNodes, setEdges, onShortcut]);
  
  // Handle cut operation
  const handleCut = useCallback(() => {
    handleCopy();
    handleDelete();
    
    if (onShortcut) {
      onShortcut('cut');
    }
  }, [handleCopy, handleDelete, onShortcut]);
  
  // Handle duplicate operation
  const handleDuplicate = useCallback(() => {
    handleCopy();
    handlePaste();
    
    if (onShortcut) {
      onShortcut('duplicate');
    }
  }, [handleCopy, handlePaste, onShortcut]);
  
  // Handle select all operation
  const handleSelectAll = useCallback(() => {
    const allNodes = getNodes();
    const allEdges = getEdges();
    
    setNodes((nodes) => nodes.map((node) => ({ ...node, selected: true })));
    setEdges((edges) => edges.map((edge) => ({ ...edge, selected: true })));
    
    if (onShortcut) {
      onShortcut('selectAll', { nodeCount: allNodes.length, edgeCount: allEdges.length });
    }
  }, [getNodes, getEdges, setNodes, setEdges, onShortcut]);
  
  // Handle undo operation
  const handleUndo = useCallback(() => {
    if (onShortcut) {
      onShortcut('undo');
    }
  }, [onShortcut]);
  
  // Handle redo operation
  const handleRedo = useCallback(() => {
    if (onShortcut) {
      onShortcut('redo');
    }
  }, [onShortcut]);
  
  // Set up keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if focus is in an input element
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }
      
      // Handle keyboard shortcuts
      if (event.key === 'Delete' || event.key === 'Backspace') {
        handleDelete();
      } else if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'c':
            handleCopy();
            break;
          case 'v':
            handlePaste();
            break;
          case 'x':
            handleCut();
            break;
          case 'd':
            event.preventDefault();
            handleDuplicate();
            break;
          case 'a':
            event.preventDefault();
            handleSelectAll();
            break;
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            event.preventDefault();
            handleRedo();
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleDelete, handleCopy, handlePaste, handleCut, handleDuplicate, handleSelectAll, handleUndo, handleRedo]);
  
  // This component doesn't render anything
  return null;
} 