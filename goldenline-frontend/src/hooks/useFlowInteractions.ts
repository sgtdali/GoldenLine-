import { useState, useCallback, useRef } from 'react';
import {
  addEdge,
  getConnectedEdges,
  useReactFlow,
  MarkerType,
} from '@xyflow/react';
import type {
  Node,
  Edge,
  Connection,
  ReactFlowInstance,
  NodeTypes,
  XYPosition,
} from '@xyflow/react';
import type { AppNode, AppNodeData } from '../types/flow';
import { v4 as uuidv4 } from 'uuid';

// Parametreler, API'ye bağlı hook yapısına uyarlandı
type Params = {
  nodes: AppNode[];
  setNodes: React.Dispatch<React.SetStateAction<AppNode[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  reactFlowInstance: ReactFlowInstance<AppNode, Edge> | null;
  setSelectedNode: (node: AppNode | null) => void;
  nodeTypes: NodeTypes | undefined;
  currentParentId: string | null;
  drillDown: (nodeId: string, label: string) => void;
};

// "Çalışan" koddaki 'isPointInBox' (Adım 10.2'de düzeltilen haliyle)
const isPointInBox = (
  point: { x: number; y: number },
  box: { x: number; y: number; width: number; height: number }
) => {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
};

const ensureParentBeforeChild = <T extends Node>(
  nodesList: T[],
  childId: string,
  parentId?: string | null
) => {
  if (!parentId) {
    return nodesList;
  }

  const parentIndex = nodesList.findIndex((n) => n.id === parentId);
  const childIndex = nodesList.findIndex((n) => n.id === childId);

  if (parentIndex === -1 || childIndex === -1 || parentIndex < childIndex) {
    return nodesList;
  }

  const updatedNodes = [...nodesList];
  const [childNode] = updatedNodes.splice(childIndex, 1);
  const newParentIndex = updatedNodes.findIndex((n) => n.id === parentId);

  if (!childNode || newParentIndex === -1) {
    return nodesList;
  }

  updatedNodes.splice(newParentIndex + 1, 0, childNode);
  return updatedNodes;
};

// Prevent nesting a node inside its own descendant chain
const wouldCreateCycle = (
  nodesList: Node[],
  movingId: string,
  candidateParentId?: string | null
) => {
  if (!candidateParentId) {
    return false;
  }

  if (candidateParentId === movingId) {
    return true;
  }

  const lookup = new Map(nodesList.map((n) => [n.id, n.parentId ?? null]));

  let current: string | null | undefined = candidateParentId;
  while (current) {
    if (current === movingId) {
      return true;
    }
    current = lookup.get(current) ?? null;
  }

  return false;
};

const buildDepthMap = (nodesList: Node[]) => {
  const lookup = new Map(nodesList.map((node) => [node.id, node]));
  const depthCache = new Map<string, number>();

  const computeDepth = (
    node: Node | undefined,
    trail: Set<string> = new Set()
  ): number => {
    if (!node) {
      return 0;
    }

    const cached = depthCache.get(node.id);
    if (cached !== undefined) {
      return cached;
    }

    if (trail.has(node.id)) {
      depthCache.set(node.id, 0);
      return 0;
    }

    trail.add(node.id);
    const parentId = node.parentId;
    const parent = parentId ? lookup.get(parentId) : undefined;
    const depth = parent ? computeDepth(parent, trail) + 1 : 0;
    trail.delete(node.id);
    depthCache.set(node.id, depth);
    return depth;
  };

  nodesList.forEach((node) => {
    computeDepth(node);
  });

  return depthCache;
};

const applyParentSelectionClass = <T extends Node>(
  nodesList: T[],
  selectedParentId?: string | null
) => {
  const targetId = selectedParentId ?? null;

  let highlightIds: Set<string> | null = null;
  if (targetId) {
    const childrenByParent = new Map<string, string[]>();
    nodesList.forEach((node) => {
      const parentId = node.parentId ?? null;
      if (!parentId) return;
      const bucket = childrenByParent.get(parentId);
      if (bucket) {
        bucket.push(node.id);
      } else {
        childrenByParent.set(parentId, [node.id]);
      }
    });

    const stack: string[] = [targetId];
    highlightIds = new Set<string>();
    while (stack.length) {
      const current = stack.pop()!;
      const children = childrenByParent.get(current);
      if (!children) continue;

      for (const childId of children) {
        if (!highlightIds.has(childId)) {
          highlightIds.add(childId);
          stack.push(childId);
        }
      }
    }
  }

  let hasChanges = false;

  const updatedNodes = nodesList.map((node) => {
    const existingClasses = (node.className ?? '')
      .split(/\s+/)
      .filter((cls) => cls && cls !== 'parent-selected');

    const shouldHighlight = highlightIds?.has(node.id) ?? false;

    const nextClasses = shouldHighlight
      ? [...existingClasses, 'parent-selected'].join(' ')
      : existingClasses.join(' ');

    const normalizedClassName = nextClasses || undefined;

    if (normalizedClassName === node.className) {
      return node;
    }

    hasChanges = true;
    return {
      ...node,
      className: normalizedClassName,
    };
  }) as T[];

  return hasChanges ? updatedNodes : nodesList;
};

export const useFlowInteractions = ({
  nodes,
  setNodes,
  edges,
  setEdges,
  reactFlowInstance,
  setSelectedNode,
  nodeTypes,
  currentParentId,
  drillDown,
}: Params) => {
  const {
    screenToFlowPosition,
    getIntersectingNodes,
    getNode,
    getEdges,
  } = useReactFlow<AppNode, Edge>();

  const overlappingNodeRef = useRef<Node | null>(null);
  const selectedGroupIdRef = useRef<string | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);

  const updateParentSelection = useCallback(
    (parentId?: string | null) => {
      selectedGroupIdRef.current = parentId ?? null;
      setNodes((nds) =>
        applyParentSelectionClass(nds, selectedGroupIdRef.current)
      );
    },
    [setNodes]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#0078d4',
              width: 20,
              height: 20,
            },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string, nodeLabel: string, catalogData?: any) => {
    setDraggedNodeType(nodeType);
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', nodeLabel);
    if (catalogData) {
      event.dataTransfer.setData('application/catalog-data', JSON.stringify(catalogData));
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // 'onDrop' (Sidebar'dan sürükleme): "Çalışan" koddaki mantık hatalıydı.
  // Adım 10.2'deki DÜZELTİLMİŞ (mutlak pozisyonlu) versiyonu kullanıyoruz.
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');
      const catalogDataRaw = event.dataTransfer.getData('application/catalog-data');

      if (!type || !reactFlowInstance) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let parentId: string | undefined = undefined;
      let relativePosition = { ...position } as { x: number; y: number };
      const groupNodes = nodes.filter((n: any) => n.type === 'grup');

      const depthMap = buildDepthMap(nodes as Node[]);
      const candidateGroups: {
        node: AppNode;
        depth: number;
        absPos: XYPosition;
      }[] = [];

      groupNodes.forEach((groupNode: AppNode) => {
        const internalGroupNode = reactFlowInstance.getInternalNode(groupNode.id);
        if (!internalGroupNode || !(internalGroupNode as any).internals) return;
        const absPos = (internalGroupNode as any).internals.positionAbsolute;
        const measured = (internalGroupNode as any).measured;
        if (!absPos || !measured) return;
        if (
          !isPointInBox(position, {
            x: absPos.x,
            y: absPos.y,
            width: measured.width || 0,
            height: measured.height || 0,
          })
        ) {
          return;
        }

        candidateGroups.push({
          node: groupNode,
          depth: depthMap.get(groupNode.id) ?? 0,
          absPos,
        });
      });

      const targetGroupEntry = candidateGroups.reduce<{
        node: AppNode;
        depth: number;
        absPos: XYPosition;
      } | null>((best, current) => {
        if (!best || current.depth >= best.depth) {
          return current;
        }
        return best;
      }, null);

      if (targetGroupEntry) {
        parentId = targetGroupEntry.node.id;
        relativePosition = {
          x: position.x - targetGroupEntry.absPos.x,
          y: position.y - targetGroupEntry.absPos.y,
        };
      } else {
        parentId = currentParentId ?? undefined;
      }

      const newNodeId = uuidv4();

      // Katalog verisi varsa kullan
      let catalogParsed: any = null;
      if (catalogDataRaw) {
        try {
          catalogParsed = JSON.parse(catalogDataRaw);
        } catch (e) {
          console.error("Katalog verisi parse edilemedi", e);
        }
      }

      const baseData: AppNodeData =
        type === 'grup'
          ? { label: label }
          : {
            label: label,
            completion: 0,
            department: 'Genel',
            duration: 0,
            ...(catalogParsed && {
              machineType: catalogParsed.name,
              utilities: catalogParsed.utilities,
              specification: catalogParsed.specification,
            }),
          };

      const newNodeData: AppNodeData = {
        ...baseData,
        parentNodeId: parentId ?? null,
      };

      const newNode: AppNode = {
        id: newNodeId as any,
        type: type as any,
        position: relativePosition as any,
        data: newNodeData as any,
        parentId: parentId as any,
        style: (type === 'grup') ? { width: 200, height: 150 } : undefined,
      };
      setNodes((nds) => {
        const nextNodes = nds.concat(newNode as any);
        const orderedNodes = ensureParentBeforeChild(
          nextNodes,
          newNode.id as string,
          parentId
        );
        return applyParentSelectionClass(
          orderedNodes,
          selectedGroupIdRef.current
        );
      });
    },
    [screenToFlowPosition, setNodes, nodes, reactFlowInstance, currentParentId]
  );

  const onNodeClick = useCallback((event: any, node: AppNode) => {
    setSelectedNode(node);
    if (node.type === 'grup') {
      updateParentSelection(node.id);
    } else {
      updateParentSelection(null);
    }
  }, [setSelectedNode, updateParentSelection]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    updateParentSelection(null);
  }, [setSelectedNode, updateParentSelection]);

  const onNodeDoubleClick = useCallback((event: any, node: AppNode) => {
    event.preventDefault();
    event.stopPropagation();
    drillDown(node.id, node.data?.label ?? node.id);
  }, [drillDown]);

  // "ÇALIŞAN" KODDAKİ onNodeDrag (Zıplamayan)
  const onNodeDrag = useCallback(
    (event: any, node: Node) => {
      // 'positionAbsolute' artık 'getInternalNode' ile SÜREKLİ GÜNCELLENEN
      // 'nodes' (prop) yerine 'reactFlowInstance'dan alınacak.
      if (!node.measured?.width || !node.measured?.height || !reactFlowInstance) {
        return;
      }

      // 'node' objesi (event'ten gelen) GECİKMELİ olabilir.
      // En güncel node listesini instance'dan al:
      const allNodes = reactFlowInstance.getNodes();

      // Sürüklenen node'un en GÜNCEL halini bul
      const internalDragNode = reactFlowInstance.getInternalNode(node.id);
      if (!internalDragNode || !(internalDragNode as any).internals?.positionAbsolute) {
        return; // (reading 'x') hatasını önle
      }

      const depthMap = buildDepthMap(allNodes as Node[]);
      const nodeLookup = new Map(allNodes.map((n) => [n.id, n]));

      const nodeRect = {
        x: (internalDragNode as any).internals.positionAbsolute.x,
        y: (internalDragNode as any).internals.positionAbsolute.y,
        width: node.measured.width,
        height: node.measured.height,
      };

      const candidateGroups: Array<{ node: Node; depth: number }> = [];

      allNodes.forEach((candidate) => {
        if (candidate.type !== 'grup' || candidate.id === node.id) {
          return;
        }

        let ancestorId = candidate.parentId ?? null;
        while (ancestorId) {
          if (ancestorId === node.id) {
            return;
          }
          ancestorId = nodeLookup.get(ancestorId)?.parentId ?? null;
        }

        const internalGroupNode = reactFlowInstance.getInternalNode(candidate.id);
        if (
          !internalGroupNode ||
          !(internalGroupNode as any).internals?.positionAbsolute ||
          !candidate.measured
        ) {
          return;
        }

        const groupRect = {
          x: (internalGroupNode as any).internals.positionAbsolute.x,
          y: (internalGroupNode as any).internals.positionAbsolute.y,
          width: candidate.measured.width,
          height: candidate.measured.height,
        };

        const intersects =
          nodeRect.x < groupRect.x + groupRect.width &&
          nodeRect.x + nodeRect.width > groupRect.x &&
          nodeRect.y < groupRect.y + groupRect.height &&
          nodeRect.y + nodeRect.height > groupRect.y;

        if (!intersects) {
          return;
        }

        candidateGroups.push({
          node: candidate,
          depth: depthMap.get(candidate.id) ?? 0,
        });
      });

      const bestMatch = candidateGroups.reduce<{
        node: Node;
        depth: number;
      } | null>((best, current) => {
        if (!best || current.depth >= best.depth) {
          return current;
        }
        return best;
      }, null);

      overlappingNodeRef.current = bestMatch?.node ?? null;
    },
    [reactFlowInstance] // Bağımlılık 'nodes' değil, 'reactFlowInstance' olmalı
  );

  // "ÇALIŞAN" KODDAKİ onNodeDragStop (Zıplamayan)
  const onNodeDragStop = useCallback(
    (event: any, node: Node) => {
      if (!reactFlowInstance) {
        overlappingNodeRef.current = null;
        return;
      }

      const overlappingNode = overlappingNodeRef.current;
      const nextParentId = overlappingNode?.id;
      const previousParentId = node.parentId;

      if (previousParentId === nextParentId) {
        overlappingNodeRef.current = null;
        return;
      }

      if (wouldCreateCycle(reactFlowInstance.getNodes(), node.id, nextParentId)) {
        console.warn('Invalid parent: node cannot be moved into its own descendant.');
        overlappingNodeRef.current = null;
        return;
      }

      // 'node' (event'ten gelen) yerine 'getInternalNode' kullan
      const internalDragNode = reactFlowInstance.getInternalNode(node.id);
      if (!internalDragNode || !(internalDragNode as any).internals?.positionAbsolute) {
        console.error("Sürüklenen node'un mutlak pozisyonu tanımsız.", node);
        overlappingNodeRef.current = null;
        return;
      }
      const dragNodeAbsPos = (internalDragNode as any).internals.positionAbsolute as XYPosition;

      setNodes((nds) => {
        const nextNodes = nds.map((n) => {
          if (n.id !== node.id) return n;

          let newPosition: XYPosition;

          if (overlappingNode) {
            const internalGroupNode = reactFlowInstance.getInternalNode(overlappingNode.id);
            if (!internalGroupNode || !(internalGroupNode as any).internals?.positionAbsolute) {
              console.error("Ebeveyn node'un mutlak pozisyonu tanımsız.", overlappingNode);
              return n;
            }
            const nextParentNodeAbsPos = (internalGroupNode as any).internals.positionAbsolute;
            newPosition = {
              x: dragNodeAbsPos.x - nextParentNodeAbsPos.x,
              y: dragNodeAbsPos.y - nextParentNodeAbsPos.y,
            };
          } else {
            newPosition = dragNodeAbsPos;
          }

          return {
            ...n,
            parentId: nextParentId ?? undefined,
            data: {
              ...n.data,
              parentNodeId: nextParentId ?? null,
            },
            position: newPosition,
          };
        });

        const reordered = ensureParentBeforeChild(
          nextNodes,
          node.id,
          nextParentId
        );
        return applyParentSelectionClass(
          reordered,
          selectedGroupIdRef.current
        );
      });

      overlappingNodeRef.current = null;
    },
    [reactFlowInstance, setNodes]
  );

  // "Çalışan" koddaki onNodesDelete
  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
    const allEdges = getEdges();
    const edgesToRemove = getConnectedEdges(nodesToDelete as AppNode[], allEdges);
    setEdges((eds) => eds.filter((e) => !edgesToRemove.includes(e)));
    setNodes((nds) => nds.filter((n) => !(nodesToDelete as AppNode[]).includes(n as AppNode)));
  }, [setNodes, setEdges, getEdges, getConnectedEdges]);

  // "Çalışan" koddaki onEdgesDelete
  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    setEdges((eds) => eds.filter((e) => !edgesToDelete.includes(e)));
  }, [setEdges]);

  return {
    draggedNodeType,
    setDraggedNodeType,
    onDragStart,
    onDragOver,
    onDrop,
    onConnect,
    onNodeClick,
    onPaneClick,
    onNodeDoubleClick,
    onNodeDrag, // "Çalışan" koddan (düzeltilmiş)
    onNodeDragStop, // "Çalışan" koddan (düzeltilmiş)
    onNodesDelete,
    onEdgesDelete,
  } as const;
}
