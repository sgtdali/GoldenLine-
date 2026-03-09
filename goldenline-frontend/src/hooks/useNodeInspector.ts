
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Edge } from '@xyflow/react';
import type { AppNode } from '../types/flow';

const useNodeInspector = ({
  nodes,
  edges,
  setNodes,
}: {
  nodes: AppNode[];
  edges: Edge[];
  setNodes: (
    nodes: AppNode[] | ((nodes: AppNode[]) => AppNode[])
  ) => void;
}) => {
  const [selectedNode, setSelectedNode] = useState<AppNode | null>(null);

  const predecessors = useMemo(() => {
    if (!selectedNode) return [];
    return edges
      .filter((edge) => edge.target === selectedNode.id)
      .map((edge) => nodes.find((node) => node.id === edge.source))
      .filter((node): node is AppNode => node !== undefined);
  }, [selectedNode, nodes, edges]);

  const successors = useMemo(() => {
    if (!selectedNode) return [];
    return edges
      .filter((edge) => edge.source === selectedNode.id)
      .map((edge) => nodes.find((node) => node.id === edge.target))
      .filter((node): node is AppNode => node !== undefined);
  }, [selectedNode, nodes, edges]);

  const applyNodeUpdate = useCallback(
    (nodeId: string, mutate: (node: AppNode) => AppNode) => {
      let updatedNode: AppNode | null = null;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId) {
            return node;
          }
          const nextNode = mutate(node);
          updatedNode = nextNode;
          return nextNode;
        })
      );
      if (updatedNode) {
        setSelectedNode((prev) =>
          prev && prev.id === nodeId ? updatedNode : prev
        );
      }
    },
    [setNodes, setSelectedNode]
  );

  const updateNodeLabel = useCallback(
    (nodeId: string, label: string) => {
      applyNodeUpdate(nodeId, (node) => ({
        ...node,
        data: { ...node.data, label },
      }));
    },
    [applyNodeUpdate]
  );

  const updateNodeMachineType = useCallback(
    (nodeId: string, machineType: string) => {
      applyNodeUpdate(nodeId, (node) => ({
        ...node,
        data: { ...node.data, machineType },
      }));
    },
    [applyNodeUpdate]
  );

  const updateNodeDepartment = useCallback(
    (nodeId: string, department: string) => {
      applyNodeUpdate(nodeId, (node) => ({
        ...node,
        data: { ...node.data, department },
      }));
    },
    [applyNodeUpdate]
  );

  const updateNodeCompletion = useCallback(
    (nodeId: string, completion: number) => {
      const safeCompletion = Number.isNaN(completion) ? 0 : completion;
      applyNodeUpdate(nodeId, (node) => ({
        ...node,
        data: { ...node.data, completion: safeCompletion },
      }));
    },
    [applyNodeUpdate]
  );

  const updateNodeDuration = useCallback(
    (nodeId: string, duration: number) => {
      const safeDuration = Number.isNaN(duration) ? 0 : duration;
      applyNodeUpdate(nodeId, (node) => ({
        ...node,
        data: { ...node.data, duration: safeDuration },
      }));
    },
    [applyNodeUpdate]
  );

  const updateNodeImage = useCallback(
    (nodeId: string, imagePath: string | null) => {
      applyNodeUpdate(nodeId, (node) => {
        const nextData = { ...node.data };
        if (imagePath) {
          nextData.imagePath = imagePath;
        } else {
          delete (nextData as any).imagePath;
        }
        return {
          ...node,
          data: nextData,
        };
      });
    },
    [applyNodeUpdate],
  );

  const updateNodeUtilities = useCallback(
    (nodeId: string, utilities: any) => {
      applyNodeUpdate(nodeId, (node) => ({
        ...node,
        data: { ...node.data, utilities },
      }));
    },
    [applyNodeUpdate]
  );

  const updateNodeSpecification = useCallback(
    (nodeId: string, specification: any) => {
      applyNodeUpdate(nodeId, (node) => ({
        ...node,
        data: { ...node.data, specification },
      }));
    },
    [applyNodeUpdate]
  );

  const updateNodeQuality = useCallback(
    (nodeId: string, quality: any) => {
      applyNodeUpdate(nodeId, (node) => ({
        ...node,
        data: { ...node.data, quality },
      }));
    },
    [applyNodeUpdate]
  );

  useEffect(() => {
    if (!selectedNode) {
      return;
    }
    const latest = nodes.find((node) => node.id === selectedNode.id);
    if (!latest) {
      setSelectedNode(null);
      return;
    }
    if (latest !== selectedNode) {
      setSelectedNode(latest);
    }
  }, [nodes, selectedNode]);

  return {
    selectedNode,
    setSelectedNode,
    predecessors,
    successors,
    updateNodeLabel,
    updateNodeMachineType,
    updateNodeDepartment,
    updateNodeCompletion,
    updateNodeDuration,
    updateNodeImage,
    updateNodeUtilities,
    updateNodeSpecification,
    updateNodeQuality,
  };
};

export default useNodeInspector;
