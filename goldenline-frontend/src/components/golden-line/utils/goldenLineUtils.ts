import type { AppNode, AppEdge } from '../../../types/flow';

export interface BreadcrumbItem {
    id: string | null;
    label: string;
}

export const ROOT_PARENT_ID: string | null = null;
export const ROOT_CACHE_KEY = 'root';

export const sortNodesByHierarchy = (nodes: AppNode[]): AppNode[] => {
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

export const calculateCriticalPath = (
    nodes: AppNode[],
    edges: AppEdge[]
): { nodeIds: string[]; edgeIds: string[]; duration: number } | { error: string } => {
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

export const getDisplayNodes = (
    nodes: AppNode[],
    criticalNodeIds: Set<string>,
    isCriticalPathEnabled: boolean
) => {
    const getParentId = (node: AppNode) =>
        (node as any).parentId ?? node.data?.parentNodeId ?? null;

    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const childrenByParent = new Map<string, string[]>();

    nodes.forEach((node) => {
        const parentId = getParentId(node);
        if (!parentId) return;
        const bucket = childrenByParent.get(parentId);
        if (bucket) {
            bucket.push(node.id);
        } else {
            childrenByParent.set(parentId, [node.id]);
        }
    });

    const collectDescendants = (groupId: string) => {
        const result = new Set<string>();
        const stack = [...(childrenByParent.get(groupId) ?? [])];
        while (stack.length) {
            const current = stack.pop()!;
            if (result.has(current)) continue;
            result.add(current);
            const next = childrenByParent.get(current);
            if (next) {
                next.forEach((child) => stack.push(child));
            }
        }
        return result;
    };

    const groupDurationById = new Map<string, number>();
    nodes.forEach((node) => {
        if (node.type !== "grup") return;
        const descendants = collectDescendants(node.id);
        let sum = 0;
        descendants.forEach(dId => {
            const dNode = nodeById.get(dId);
            if (dNode && dNode.type !== "grup") {
                sum += Number(dNode.data?.duration || 0);
            }
        });
        groupDurationById.set(node.id, sum);
    });

    return nodes.map((node) => {
        const isCritical = isCriticalPathEnabled && criticalNodeIds.has(node.id);
        const groupDuration = node.type === "grup" ? groupDurationById.get(node.id) ?? 0 : 0;

        return {
            ...node,
            data: {
                ...node.data,
                ...(node.type === "grup" ? { groupDurationDays: groupDuration } : {}),
                ...(isCritical ? { __isCritical: true } : {}),
            },
        };
    });
};

export const getDisplayEdges = (
    edges: AppEdge[],
    criticalEdgeIds: Set<string>,
    isCriticalPathEnabled: boolean
) => {
    if (!isCriticalPathEnabled || criticalEdgeIds.size === 0) {
        return edges;
    }

    return edges.map((edge) => {
        const isCritical = criticalEdgeIds.has(edge.id);
        return {
            ...edge,
            className: `${edge.className ?? ''} ${isCritical ? 'critical-edge' : 'edge-dim'}`.trim(),
            style: {
                ...(edge.style ?? {}),
                stroke: isCritical ? '#d9534f' : edge.style?.stroke ?? '#c3c8cf',
                strokeWidth: isCritical ? 3 : edge.style?.strokeWidth ?? 1.5,
            },
            animated: isCritical ? true : edge.animated,
        };
    });
};
