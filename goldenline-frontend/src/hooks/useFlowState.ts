import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useNodesState,
  useEdgesState,
  type ReactFlowInstance,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import type { AppNode, AppEdge } from '../types/flow';
import {
  mapBackendNodeToFrontend,
  mapBackendEdgeToFrontend,
  mapFrontendNodeToBackend,
  mapFrontendEdgeToBackend,
  type FlowDataPayload,
} from '../types/flow';
import { bridge } from '../api/bridge';

type AggregatedData = {
  aggregatedNodes: AppNode[];
  aggregatedEdges: AppEdge[];
  parentDataMap: Map<string, { nodes: AppNode[]; edges: AppEdge[] }>;
};

type CriticalPathResult =
  | {
      nodeIds: string[];
      edgeIds: string[];
      duration: number;
    }
  | {
      error: string;
    };

const cloneNode = (node: AppNode): AppNode => ({
  ...node,
  data: node.data ? { ...node.data } : node.data,
});

const cloneEdge = (edge: AppEdge): AppEdge => ({
  ...edge,
});

const sortNodesByHierarchy = (nodes: AppNode[]): AppNode[] => {
  const indexMap = new Map(nodes.map((node, index) => [node.id, index]));
  const depthCache = new Map<string, number>();

  const getParentId = (node: AppNode) =>
    (node as unknown as { parentId?: string | null }).parentId ?? null;

  const computeDepth = (node: AppNode | undefined, visited = new Set<string>()): number => {
    if (!node) {
      return 0;
    }

    if (depthCache.has(node.id)) {
      return depthCache.get(node.id)!;
    }

    if (visited.has(node.id)) {
      depthCache.set(node.id, 0);
      return 0;
    }

    visited.add(node.id);
    const parentId = getParentId(node);
    const parentNode = parentId ? nodes.find((n) => n.id === parentId) : undefined;
    const depth = parentNode ? computeDepth(parentNode, visited) + 1 : 0;
    visited.delete(node.id);
    depthCache.set(node.id, depth);
    return depth;
  };

  return [...nodes].sort((a, b) => {
    const depthA = computeDepth(a);
    const depthB = computeDepth(b);
    if (depthA !== depthB) {
      return depthA - depthB;
    }
    const indexA = indexMap.get(a.id) ?? 0;
    const indexB = indexMap.get(b.id) ?? 0;
    return indexA - indexB;
  });
};

const calculateCriticalPath = (
  nodes: AppNode[],
  edges: AppEdge[]
): CriticalPathResult => {
  const getParentId = (node: AppNode) =>
    (node as unknown as { parentId?: string | null }).parentId
      ?? node.data?.parentNodeId
      ?? null;

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const leafNodes = nodes.filter((node) => node.type !== 'grup');
  const leafNodeIds = new Set(leafNodes.map((node) => node.id));

  if (leafNodes.length === 0) {
    return { error: 'Kritik yol hesaplanamadi: gecerli montaj adimi bulunamadi.' };
  }

  const childrenByParent = new Map<string, string[]>();
  nodes.forEach((node) => {
    const parentId = getParentId(node);
    if (!parentId) {
      return;
    }
    const bucket = childrenByParent.get(parentId);
    if (bucket) {
      bucket.push(node.id);
    } else {
      childrenByParent.set(parentId, [node.id]);
    }
  });

  const baseDurationById = new Map<string, number>();
  leafNodes.forEach((node) => {
    const rawDuration =
      typeof node.data?.duration === 'number'
        ? node.data.duration
        : parseFloat(String(node.data?.duration ?? 0));
    baseDurationById.set(node.id, Number.isFinite(rawDuration) ? rawDuration : 0);
  });

  const collectDescendants = (groupId: string) => {
    const result = new Set<string>();
    const stack = [...(childrenByParent.get(groupId) ?? [])];
    while (stack.length) {
      const current = stack.pop()!;
      if (result.has(current)) {
        continue;
      }
      result.add(current);
      const children = childrenByParent.get(current);
      if (children) {
        children.forEach((child) => stack.push(child));
      }
    }
    return result;
  };

  const groupDescendants = new Map<string, Set<string>>();
  const groupLeafSet = new Map<string, Set<string>>();

  nodes.forEach((node) => {
    if (node.type !== 'grup') {
      return;
    }
    const descendants = collectDescendants(node.id);
    groupDescendants.set(node.id, descendants);
    groupLeafSet.set(
      node.id,
      new Set(Array.from(descendants).filter((id) => leafNodeIds.has(id)))
    );
  });

  const entryLeavesMemo = new Map<string, string[]>();
  const exitLeavesMemo = new Map<string, string[]>();
  const visitingEntry = new Set<string>();
  const visitingExit = new Set<string>();

  const getEntryLeaves = (nodeId: string): string[] => {
    const node = nodeById.get(nodeId);
    if (!node) {
      return [];
    }
    if (node.type !== 'grup') {
      return [nodeId];
    }
    const cached = entryLeavesMemo.get(nodeId);
    if (cached) {
      return cached;
    }
    if (visitingEntry.has(nodeId)) {
      const fallback = Array.from(groupLeafSet.get(nodeId) ?? []);
      entryLeavesMemo.set(nodeId, fallback);
      return fallback;
    }

    visitingEntry.add(nodeId);
    const descendants = groupDescendants.get(nodeId) ?? new Set<string>();
    const leafSet = groupLeafSet.get(nodeId) ?? new Set<string>();
    if (leafSet.size === 0) {
      entryLeavesMemo.set(nodeId, []);
      visitingEntry.delete(nodeId);
      return [];
    }

    const hasPred = new Map<string, boolean>();
    leafSet.forEach((id) => hasPred.set(id, false));

    edges.forEach((edge) => {
      if (!descendants.has(edge.source) || !descendants.has(edge.target)) {
        return;
      }
      const targetLeaves = getEntryLeaves(edge.target);
      targetLeaves.forEach((target) => {
        if (leafSet.has(target)) {
          hasPred.set(target, true);
        }
      });
    });

    const entries = Array.from(leafSet).filter((id) => !hasPred.get(id));
    const result = entries.length ? entries : Array.from(leafSet);
    entryLeavesMemo.set(nodeId, result);
    visitingEntry.delete(nodeId);
    return result;
  };

  const getExitLeaves = (nodeId: string): string[] => {
    const node = nodeById.get(nodeId);
    if (!node) {
      return [];
    }
    if (node.type !== 'grup') {
      return [nodeId];
    }
    const cached = exitLeavesMemo.get(nodeId);
    if (cached) {
      return cached;
    }
    if (visitingExit.has(nodeId)) {
      const fallback = Array.from(groupLeafSet.get(nodeId) ?? []);
      exitLeavesMemo.set(nodeId, fallback);
      return fallback;
    }

    visitingExit.add(nodeId);
    const descendants = groupDescendants.get(nodeId) ?? new Set<string>();
    const leafSet = groupLeafSet.get(nodeId) ?? new Set<string>();
    if (leafSet.size === 0) {
      exitLeavesMemo.set(nodeId, []);
      visitingExit.delete(nodeId);
      return [];
    }

    const hasSucc = new Map<string, boolean>();
    leafSet.forEach((id) => hasSucc.set(id, false));

    edges.forEach((edge) => {
      if (!descendants.has(edge.source) || !descendants.has(edge.target)) {
        return;
      }
      const sourceLeaves = getExitLeaves(edge.source);
      sourceLeaves.forEach((source) => {
        if (leafSet.has(source)) {
          hasSucc.set(source, true);
        }
      });
    });

    const exits = Array.from(leafSet).filter((id) => !hasSucc.get(id));
    const result = exits.length ? exits : Array.from(leafSet);
    exitLeavesMemo.set(nodeId, result);
    visitingExit.delete(nodeId);
    return result;
  };

  const expandedEdges: Array<{ source: string; target: string; edgeId: string }> = [];
  edges.forEach((edge) => {
    const sourceIsLeaf = leafNodeIds.has(edge.source);
    const targetIsLeaf = leafNodeIds.has(edge.target);

    if (sourceIsLeaf && targetIsLeaf) {
      expandedEdges.push({ source: edge.source, target: edge.target, edgeId: edge.id });
      return;
    }

    const sourceLeaves = sourceIsLeaf
      ? [edge.source]
      : getExitLeaves(edge.source);
    const targetLeaves = targetIsLeaf
      ? [edge.target]
      : getEntryLeaves(edge.target);

    sourceLeaves.forEach((source) => {
      targetLeaves.forEach((target) => {
        expandedEdges.push({ source, target, edgeId: edge.id });
      });
    });
  });

  const successors = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  const edgeMap = new Map<string, string>();

  leafNodeIds.forEach((id) => {
    successors.set(id, []);
    predecessors.set(id, []);
    indegree.set(id, 0);
  });

  expandedEdges.forEach((edge) => {
    if (!leafNodeIds.has(edge.source) || !leafNodeIds.has(edge.target)) {
      return;
    }
    successors.get(edge.source)?.push(edge.target);
    predecessors.get(edge.target)?.push(edge.source);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
    const key = `${edge.source}::${edge.target}`;
    if (!edgeMap.has(key)) {
      edgeMap.set(key, edge.edgeId);
    }
  });

  const queue: string[] = [];
  indegree.forEach((value, key) => {
    if (value === 0) {
      queue.push(key);
    }
  });

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    topoOrder.push(current);
    const nextNodes = successors.get(current) ?? [];
    nextNodes.forEach((next) => {
      const nextInDegree = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, nextInDegree);
      if (nextInDegree === 0) {
        queue.push(next);
      }
    });
  }

  if (topoOrder.length !== leafNodes.length) {
    return { error: 'Kritik yol hesaplanamadi: grafikte dongu tespit edildi.' };
  }

  const earliestFinish = new Map<string, number>();
  const bestPredecessor = new Map<string, string | null>();

  topoOrder.forEach((nodeId) => {
    const preds = predecessors.get(nodeId) ?? [];
    let start = 0;
    let bestPred: string | null = null;
    preds.forEach((predId) => {
      const finish = earliestFinish.get(predId) ?? 0;
      if (finish > start) {
        start = finish;
        bestPred = predId;
      }
    });

    const duration = baseDurationById.get(nodeId) ?? 0;
    earliestFinish.set(nodeId, start + Math.max(duration, 0));
    bestPredecessor.set(nodeId, bestPred);
  });

  let endNodeId = topoOrder[0];
  let maxDuration = earliestFinish.get(endNodeId) ?? 0;
  topoOrder.forEach((nodeId) => {
    const finish = earliestFinish.get(nodeId) ?? 0;
    if (finish > maxDuration) {
      maxDuration = finish;
      endNodeId = nodeId;
    }
  });

  const pathNodeIds: string[] = [];
  const pathEdgeIds: string[] = [];
  let currentNode: string | null = endNodeId;
  while (currentNode) {
    pathNodeIds.push(currentNode);
    const prev = bestPredecessor.get(currentNode);
    if (!prev) {
      break;
    }
    const key = `${prev}::${currentNode}`;
    const edgeId = edgeMap.get(key);
    if (edgeId) {
      pathEdgeIds.push(edgeId);
    }
    currentNode = prev;
  }

  pathNodeIds.reverse();
  pathEdgeIds.reverse();

  const criticalNodeSet = new Set(pathNodeIds);
  pathNodeIds.forEach((nodeId) => {
    let parentId = getParentId(nodeById.get(nodeId) as AppNode);
    while (parentId) {
      if (!criticalNodeSet.has(parentId)) {
        criticalNodeSet.add(parentId);
      }
      parentId = getParentId(nodeById.get(parentId) as AppNode);
    }
  });

  return {
    nodeIds: Array.from(criticalNodeSet),
    edgeIds: pathEdgeIds,
    duration: maxDuration,
  };
};

const ROOT_PARENT_ID: string | null = null;
const ROOT_CACHE_KEY = 'root';

export interface BreadcrumbItem {
  id: string | null;
  label: string;
}

const useFlowState = (projectId: string | undefined) => {
  const [nodes, setNodes, internalOnNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, internalOnEdgesChange] = useEdgesState<AppEdge>([]);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentParentId, setCurrentParentId] =
    useState<string | null>(ROOT_PARENT_ID);

  const [projectName] = useState('Project Root');
  const [breadcrumbStack, setBreadcrumbStack] = useState<BreadcrumbItem[]>([
    { id: ROOT_PARENT_ID, label: 'Project Root' },
  ]);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [flowCache, setFlowCache] = useState<
    Record<string, { nodes: AppNode[]; edges: AppEdge[] }>
  >({});
  const [isCriticalPathEnabled, setIsCriticalPathEnabled] = useState(false);
  const [criticalNodeIds, setCriticalNodeIds] = useState<Set<string>>(
    () => new Set()
  );
  const [criticalEdgeIds, setCriticalEdgeIds] = useState<Set<string>>(
    () => new Set()
  );
  const [criticalPathError, setCriticalPathError] = useState<string | null>(
    null
  );

  const projectIdNum = useMemo(() => {
    if (!projectId) return undefined;
    const parsed = Number.parseInt(projectId, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, [projectId]);

  useEffect(() => {
    setBreadcrumbStack([{ id: ROOT_PARENT_ID, label: projectName }]);
    setCurrentParentId(ROOT_PARENT_ID);
    setFlowCache({});
  }, [projectIdNum, projectName]);

  useEffect(() => {
    setIsCriticalPathEnabled(false);
    setCriticalNodeIds(new Set());
    setCriticalEdgeIds(new Set());
    setCriticalPathError(null);
  }, [projectIdNum]);

  const loadFlowFromBackend = useCallback(
    async (parentId: string | null) => {
      const cacheKey = parentId ?? ROOT_CACHE_KEY;

      if (flowCache[cacheKey]) {
        const { nodes: cachedNodes, edges: cachedEdges } = flowCache[cacheKey];
        setNodes(sortNodesByHierarchy(cachedNodes));
        setEdges(cachedEdges);
        setIsInitialLoad(true);
        return;
      }

      if (!projectIdNum) {
        setIsLoading(false);
        setError("Geçersiz Proje ID'si.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await bridge.getFlow(projectIdNum, parentId ?? null);
        const flowNodes = sortNodesByHierarchy(data.nodes.map(mapBackendNodeToFrontend));
        const flowEdges = data.edges.map(mapBackendEdgeToFrontend);

        setNodes(flowNodes);
        setEdges(flowEdges);
        setFlowCache((prev) => ({
          ...prev,
          [cacheKey]: { nodes: flowNodes, edges: flowEdges },
        }));
        setIsInitialLoad(true);
      } catch (err) {
        console.error('Akış verisi yüklenirken hata oluştu:', err);
        setError("Proje verisi yüklenemedi. Lütfen API'nin çalıştığından emin olun.");
      } finally {
        setIsLoading(false);
      }
    },
    [projectIdNum, setNodes, setEdges, flowCache]
  );

  useEffect(() => {
    loadFlowFromBackend(currentParentId);
  }, [currentParentId, loadFlowFromBackend]);

  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0 && isInitialLoad) {
      setTimeout(() => {
        reactFlowInstance.fitView();
      }, 100);
      setIsInitialLoad(false);
    }
  }, [reactFlowInstance, nodes, isInitialLoad]);

  const buildProjectData = useCallback(async (): Promise<AggregatedData> => {
    if (!projectIdNum) {
      throw new Error('Ge�ersiz proje ID');
    }

    if (!reactFlowInstance) {
      throw new Error('React Flow instance haz�r de�il');
    }

    const makeCacheKey = (parentId: string | null) =>
      parentId ?? ROOT_CACHE_KEY;

    const parentDataMap = new Map<
      string,
      { nodes: AppNode[]; edges: AppEdge[] }
    >();

    const queue: Array<string | null> = [ROOT_PARENT_ID];
    const processedKeys = new Set<string>();

    while (queue.length > 0) {
      const parentId = queue.shift() ?? ROOT_PARENT_ID;
      const cacheKey = makeCacheKey(parentId);
      if (processedKeys.has(cacheKey)) {
        continue;
      }
      processedKeys.add(cacheKey);

      let dataForParent: { nodes: AppNode[]; edges: AppEdge[] };

      if (parentId === currentParentId) {
        const currentNodes = (reactFlowInstance.getNodes() ?? []) as AppNode[];
        const currentEdges = (reactFlowInstance.getEdges() ?? []) as AppEdge[];
        dataForParent = {
          nodes: currentNodes.map(cloneNode),
          edges: currentEdges.map(cloneEdge),
        };
      } else if (flowCache[cacheKey]) {
        dataForParent = {
          nodes: flowCache[cacheKey].nodes.map(cloneNode),
          edges: flowCache[cacheKey].edges.map(cloneEdge),
        };
      } else {
        const response = await bridge.getFlow(projectIdNum, parentId ?? null);
        const fetchedNodes = response.nodes.map(mapBackendNodeToFrontend);
        const fetchedEdges = response.edges.map(mapBackendEdgeToFrontend);
        dataForParent = {
          nodes: fetchedNodes.map(cloneNode),
          edges: fetchedEdges.map(cloneEdge),
        };
      }

      parentDataMap.set(cacheKey, dataForParent);

      dataForParent.nodes
        .filter((node) => node.type === 'grup')
        .forEach((groupNode) => {
          const childKey = makeCacheKey(groupNode.id);
          if (!processedKeys.has(childKey)) {
            queue.push(groupNode.id);
          }
        });
    }

    const aggregatedNodes = new Map<string, AppNode>();
    const aggregatedEdges = new Map<string, AppEdge>();

    const includeData = (nodesList: AppNode[], edgesList: AppEdge[]) => {
      nodesList.forEach((node) => aggregatedNodes.set(node.id, node));
      edgesList.forEach((edge) => aggregatedEdges.set(edge.id, edge));
    };

    parentDataMap.forEach((value) => {
      includeData(value.nodes, value.edges);
    });

    Object.entries(flowCache).forEach(([cacheKey, data]) => {
      if (parentDataMap.has(cacheKey)) {
        return;
      }

      if (cacheKey !== ROOT_CACHE_KEY && !aggregatedNodes.has(cacheKey)) {
        return;
      }

      const clonedNodes = data.nodes.map(cloneNode);
      const clonedEdges = data.edges.map(cloneEdge);
      parentDataMap.set(cacheKey, {
        nodes: clonedNodes,
        edges: clonedEdges,
      });
      includeData(clonedNodes, clonedEdges);
    });

    return {
      aggregatedNodes: Array.from(aggregatedNodes.values()),
      aggregatedEdges: Array.from(aggregatedEdges.values()),
      parentDataMap,
    };
  }, [projectIdNum, reactFlowInstance, currentParentId, flowCache]);


  useEffect(() => {
    if (!isCriticalPathEnabled) {
      setCriticalNodeIds(new Set());
      setCriticalEdgeIds(new Set());
      setCriticalPathError(null);
      return;
    }

    if (isLoading) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const { aggregatedNodes, aggregatedEdges } = await buildProjectData();
        if (cancelled) {
          return;
        }
        const result = calculateCriticalPath(aggregatedNodes, aggregatedEdges);
        if ('error' in result) {
          setCriticalPathError(result.error);
          setCriticalNodeIds(new Set());
          setCriticalEdgeIds(new Set());
        } else {
          setCriticalPathError(null);
          setCriticalNodeIds(new Set(result.nodeIds));
          setCriticalEdgeIds(new Set(result.edgeIds));
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        console.error('Kritik yol hesaplan�rken hata olu�tu:', err);
        setCriticalPathError(
          'Kritik yol hesaplanamad�. L�tfen daha sonra tekrar deneyin.'
        );
        setCriticalNodeIds(new Set());
        setCriticalEdgeIds(new Set());
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [isCriticalPathEnabled, isLoading, buildProjectData, nodes, edges, flowCache]);

  const saveFlowToBackend = useCallback(async () => {
    if (!projectIdNum) {
      console.error("Gecersiz proje ID'si");
      setError('Gecersiz Proje ID\'si. Kayit yapilamadi.');
      return;
    }

    if (!reactFlowInstance) {
      console.warn('React Flow instance henuz hazir degil. Kayit yapilamadi.');
      return;
    }

    try {
      const { aggregatedNodes, aggregatedEdges, parentDataMap } =
        await buildProjectData();

      const payload: FlowDataPayload = {
        nodes: aggregatedNodes.map((node) =>
          mapFrontendNodeToBackend(node, projectIdNum)
        ),
        edges: aggregatedEdges.map((edge) =>
          mapFrontendEdgeToBackend(edge, projectIdNum)
        ),
      };

      setError(null);
      await bridge.saveFlow(projectIdNum, payload);
      alert('Proje basariyla kaydedildi!');

      setFlowCache(Object.fromEntries(parentDataMap));
    } catch (err) {
      const message = err instanceof Error ? err.message : null;
      console.error('Akis verisi kaydedilirken hata olustu:', err);
      setError(
        message || 'Proje kaydedilemedi. Lutfen tekrar deneyin.'
      );
    }
  }, [projectIdNum, reactFlowInstance, buildProjectData, setFlowCache]);
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      internalOnNodesChange(changes as NodeChange<AppNode>[]);
    },
    [internalOnNodesChange]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      internalOnEdgesChange(changes as EdgeChange<AppEdge>[]);
    },
    [internalOnEdgesChange]
  );

  const drillDown = useCallback(
    (nodeId: string, nodeLabel: string) => {
      const cacheKey = currentParentId ?? ROOT_CACHE_KEY;
      setFlowCache((prev) => ({
        ...prev,
        [cacheKey]: { nodes, edges },
      }));

      setBreadcrumbStack((prev) => {
        const last = prev[prev.length - 1];
        if (last?.id === nodeId) {
          return prev;
        }
        return [...prev, { id: nodeId, label: nodeLabel }];
      });
      setCurrentParentId(nodeId);
    },
    [nodes, edges, currentParentId]
  );

  const navigateToParent = useCallback(
    (targetId: string | null) => {
      if (targetId === currentParentId) {
        return;
      }

      const cacheKey = currentParentId ?? ROOT_CACHE_KEY;
      setFlowCache((prev) => ({
        ...prev,
        [cacheKey]: { nodes, edges },
      }));

      const targetIndex = breadcrumbStack.findIndex(
        (item) => item.id === targetId
      );
      if (targetIndex === -1) {
        return;
      }

      const nextStack = breadcrumbStack.slice(0, targetIndex + 1);
      setBreadcrumbStack(nextStack);
      setCurrentParentId(targetId);
    },
    [nodes, edges, currentParentId, breadcrumbStack]
  );

  return {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    setReactFlowInstance,
    isLoading,
    error,
    saveFlowToBackend,
    drillDown,
    navigateToParent,
    breadcrumbStack,
    projectName,
    currentParentId,
    isCriticalPathEnabled,
    setIsCriticalPathEnabled,
    criticalNodeIds,
    criticalEdgeIds,
    criticalPathError,
  };
};

export default useFlowState;


