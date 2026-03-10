import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    useNodesState,
    useEdgesState,
    type ReactFlowInstance,
    type OnNodesChange,
    type OnEdgesChange,
    type NodeChange,
    type EdgeChange,
} from '@xyflow/react';
import type { AppNode, AppEdge } from '../../../types/flow';
import {
    sortNodesByHierarchy,
    calculateCriticalPath,
    ROOT_PARENT_ID,
    ROOT_CACHE_KEY,
    type BreadcrumbItem
} from '../utils/goldenLineUtils';

const useGoldenLineState = (projectId: string, initialProjectName: string = 'Golden Line') => {
    const STORAGE_KEY = `golden_line_project_${projectId}`;

    const [nodes, setNodes, internalOnNodesChange] = useNodesState<AppNode>([]);
    const [edges, setEdges, internalOnEdgesChange] = useEdgesState<AppEdge>([]);
    const [reactFlowInstance, setReactFlowInstance] =
        useState<ReactFlowInstance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentParentId, setCurrentParentId] =
        useState<string | null>(ROOT_PARENT_ID);

    const [projectName] = useState(initialProjectName);
    const [breadcrumbStack, setBreadcrumbStack] = useState<BreadcrumbItem[]>([
        { id: ROOT_PARENT_ID, label: initialProjectName },
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

    // Undo/Redo History
    const [undoStack, setUndoStack] = useState<{ nodes: AppNode[]; edges: AppEdge[] }[]>([]);
    const [redoStack, setRedoStack] = useState<{ nodes: AppNode[]; edges: AppEdge[] }[]>([]);

    const takeSnapshot = useCallback(() => {
        setUndoStack((prev) => {
            const snapshot = { 
                nodes: JSON.parse(JSON.stringify(nodes)), 
                edges: JSON.parse(JSON.stringify(edges)) 
            };
            
            // Don't push if it's the same as the last snapshot
            if (prev.length > 0) {
                const last = prev[prev.length - 1];
                if (JSON.stringify(last.nodes) === JSON.stringify(snapshot.nodes) && 
                    JSON.stringify(last.edges) === JSON.stringify(snapshot.edges)) {
                    return prev;
                }
            }
            
            const nextStack = [...prev, snapshot];
            if (nextStack.length > 25) nextStack.shift(); // Keep last 25 steps
            return nextStack;
        });
        // Clear redo stack on new action
        setRedoStack([]);
    }, [nodes, edges]);

    const undo = useCallback(() => {
        setUndoStack((prev) => {
            if (prev.length === 0) return prev;
            const newUndoStack = [...prev];
            const prevState = newUndoStack.pop();
            
            if (prevState) {
                // Save current state to redo stack before moving back
                const currentSnapshot = { 
                    nodes: JSON.parse(JSON.stringify(nodes)), 
                    edges: JSON.parse(JSON.stringify(edges)) 
                };
                setRedoStack(prevRedo => [currentSnapshot, ...prevRedo].slice(0, 25));
                
                setNodes(prevState.nodes);
                setEdges(prevState.edges);
            }
            return newUndoStack;
        });
    }, [nodes, edges, setNodes, setEdges]);

    const redo = useCallback(() => {
        setRedoStack((prev) => {
            if (prev.length === 0) return prev;
            const newRedoStack = [...prev];
            const nextState = newRedoStack.shift();
            
            if (nextState) {
                // Save current state to undo stack before moving forward
                const currentSnapshot = { 
                    nodes: JSON.parse(JSON.stringify(nodes)), 
                    edges: JSON.parse(JSON.stringify(edges)) 
                };
                setUndoStack(prevUndo => [...prevUndo, currentSnapshot].slice(-25));
                
                setNodes(nextState.nodes);
                setEdges(nextState.edges);
            }
            return newRedoStack;
        });
    }, [nodes, edges, setNodes, setEdges]);

    // Load from LocalStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.flowCache) {
                    setFlowCache(parsed.flowCache);
                    const initial = parsed.flowCache[ROOT_CACHE_KEY] || { nodes: [], edges: [] };
                    setNodes(sortNodesByHierarchy(initial.nodes));
                    setEdges(initial.edges);
                }
            }
        } catch (err) {
            console.error('Error loading Golden Line data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [setNodes, setEdges]);

    // Handle drill down/up with cache
    useEffect(() => {
        const cacheKey = currentParentId ?? ROOT_CACHE_KEY;
        if (flowCache[cacheKey]) {
            const { nodes: cachedNodes, edges: cachedEdges } = flowCache[cacheKey];
            setNodes(sortNodesByHierarchy(cachedNodes));
            setEdges(cachedEdges);
            setIsInitialLoad(true);
        } else {
            setNodes([]);
            setEdges([]);
            setIsInitialLoad(true);
        }
    }, [currentParentId, flowCache, setEdges, setNodes]);

    useEffect(() => {
        if (reactFlowInstance && nodes.length > 0 && isInitialLoad) {
            setTimeout(() => {
                reactFlowInstance.fitView();
            }, 100);
            setIsInitialLoad(false);
        }
    }, [reactFlowInstance, nodes, isInitialLoad]);

    // Aggregated data for critical path and saving
    const buildAggregatedData = useCallback(() => {
        // Capture current state into cache first
        const cacheKey = currentParentId ?? ROOT_CACHE_KEY;
        const currentLevel = { nodes, edges };

        const aggregatedNodesMap = new Map<string, AppNode>();
        const aggregatedEdgesMap = new Map<string, AppEdge>();

        // Include everything from flowCache
        Object.values(flowCache).forEach(level => {
            level.nodes.forEach(n => aggregatedNodesMap.set(n.id, n));
            level.edges.forEach(e => aggregatedEdgesMap.set(e.id, e));
        });

        // Overwrite current level with latest state
        currentLevel.nodes.forEach(n => aggregatedNodesMap.set(n.id, n));
        currentLevel.edges.forEach(e => aggregatedEdgesMap.set(e.id, e));

        return {
            aggregatedNodes: Array.from(aggregatedNodesMap.values()),
            aggregatedEdges: Array.from(aggregatedEdgesMap.values()),
            parentDataMap: { ...flowCache, [cacheKey]: currentLevel }
        };
    }, [nodes, edges, currentParentId, flowCache]);

    // Critical path effect
    useEffect(() => {
        if (!isCriticalPathEnabled) {
            setCriticalNodeIds(new Set());
            setCriticalEdgeIds(new Set());
            setCriticalPathError(null);
            return;
        }

        const { aggregatedNodes, aggregatedEdges } = buildAggregatedData();
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
    }, [isCriticalPathEnabled, nodes, edges, currentParentId, flowCache, buildAggregatedData]);

    const saveFlowToLocalStorage = useCallback(async () => {
        try {
            const { parentDataMap } = buildAggregatedData();
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ flowCache: parentDataMap }));
            setFlowCache(parentDataMap);
            toast.success('Golden Line başarıyla kaydedildi!');
        } catch (err) {
            console.error('Error saving Golden Line data:', err);
            setError('Kaydedilemedi.');
        }
    }, [STORAGE_KEY, buildAggregatedData]);

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
        saveFlowToBackend: saveFlowToLocalStorage,
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
        undo,
        redo,
        takeSnapshot
    };
};

export default useGoldenLineState;
