import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    ReactFlow,
    Background,
    Controls,
    ReactFlowProvider,
    ReactFlowInstance,
    NodeTypes,
    Edge,
    ConnectionMode,
    BackgroundVariant,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "./GoldenLine.css";

import useGoldenLineState from "./hooks/useGoldenLineState";
import { useFlowInteractions } from "../../hooks/useFlowInteractions";
import { useEditorActions } from "../../hooks/useEditorActions";
import useNodeInspector from "../../hooks/useNodeInspector";
import { useGoldenLineExport } from "./hooks/useGoldenLineExport";

import InspectorPanel from "../InspectorPanel";
import NodeEditorHeader from "../NodeEditorHeader";
import CustomNode from "../CustomNode";
import GrupNode from "../GrupNode";
import type { AppNode, AppEdge } from "../../types/flow";
import { toast } from "sonner";
import { getDisplayNodes, getDisplayEdges } from "./utils/goldenLineUtils";
import { GoldenLineFloatingBar } from "./components/GoldenLineFloatingBar";
import MachineDatasheet from "./MachineDatasheet";
import GoldenLineCatalog from "./GoldenLineCatalog";

function GoldenLineContent() {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();
    const [searchParams] = useSearchParams();
    const initialProjectName = searchParams.get("name") || "Golden Line";

    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance<AppNode, Edge> | null>(null);
    const [inspectorWidth, setInspectorWidth] = useState<number | null>(null);
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isSnapPressed, setIsSnapPressed] = useState(false);
    const [viewMode, setViewMode] = useState<"flow" | "datasheet">("flow");
    const [showGrid, setShowGrid] = useState(true);
    const [showCatalog, setShowCatalog] = useState(false);
    const isResizingInspector = useRef(false);

    const nodeTypes: NodeTypes = useMemo(() => ({
        custom: (props: any) => <CustomNode {...props} isSimpleMode={true} />,
        input: (props: any) => <CustomNode {...props} isSimpleMode={true} />,
        output: (props: any) => <CustomNode {...props} isSimpleMode={true} />,
        default: (props: any) => <CustomNode {...props} isSimpleMode={true} />,
        grup: (props: any) => <GrupNode {...props} hideDuration={true} />,
    }), []);

    const {
        nodes, setNodes, onNodesChange,
        edges, setEdges, onEdgesChange,
        isLoading, saveFlowToBackend, setReactFlowInstance,
        currentParentId, drillDown, navigateToParent,
        breadcrumbStack, projectName,
        isCriticalPathEnabled, setIsCriticalPathEnabled,
        criticalNodeIds, criticalEdgeIds,
        undo, redo, takeSnapshot
    } = useGoldenLineState(projectId || "default", initialProjectName);

    const {
        selectedNode, setSelectedNode,
        predecessors, successors,
        updateNodeLabel, updateNodeMachineType, updateNodeDepartment, updateNodeCompletion,
        updateNodeDuration, updateNodeImage, updateNodeUtilities, updateNodeSpecification, updateNodeQuality,
    } = useNodeInspector({ nodes, edges, setNodes });

    const {
        onDragStart, onDragOver, onDrop, onConnect,
        onNodeClick, onPaneClick, onNodeDoubleClick,
        onNodeDrag, 
        onNodeDragStop: internalOnNodeDragStop, 
        onNodesDelete: internalOnNodesDelete, 
        onEdgesDelete: internalOnEdgesDelete,
    } = useFlowInteractions({
        nodes, setNodes, edges, setEdges,
        reactFlowInstance: rfInstance,
        setSelectedNode, nodeTypes, currentParentId, drillDown,
    });

    const onNodeDragStop = useCallback((e: any, n: any) => { 
        takeSnapshot(); 
        internalOnNodeDragStop(e, n); 
    }, [takeSnapshot, internalOnNodeDragStop]);

    const onNodesDelete = useCallback((ns: any) => { 
        takeSnapshot(); 
        internalOnNodesDelete(ns); 
    }, [takeSnapshot, internalOnNodesDelete]);

    const onEdgesDelete = useCallback((es: any) => { 
        takeSnapshot(); 
        internalOnEdgesDelete(es); 
    }, [takeSnapshot, internalOnEdgesDelete]);

    const { handleExportToMSProject, handleImportFromMSProject } = useEditorActions({
        reactFlowInstance: rfInstance,
        projectId: projectId || "default",
        setNodes, setEdges, projectName,
    });

    const { handleExportExcel } = useGoldenLineExport({ nodes, projectName });

    const importInputRef = useRef<HTMLInputElement | null>(null);

    const displayNodes = useMemo(() =>
        getDisplayNodes(nodes, criticalNodeIds, isCriticalPathEnabled),
        [nodes, criticalNodeIds, isCriticalPathEnabled]);

    const displayEdges = useMemo(() =>
        getDisplayEdges(edges, criticalEdgeIds, isCriticalPathEnabled),
        [edges, criticalEdgeIds, isCriticalPathEnabled]);

    const onBackClick = () => navigate("/golden-line");

    const onInit = (instance: ReactFlowInstance<AppNode, Edge>) => {
        setRfInstance(instance);
        setReactFlowInstance(instance);
    };

    const [clipboard, setClipboard] = useState<{ nodes: AppNode[], edges: AppEdge[] } | null>(null);

    const handleCopy = useCallback(() => {
        if (!rfInstance) return;
        const selectedNodes = rfInstance.getNodes().filter((node) => node.selected) as AppNode[];
        if (selectedNodes.length === 0) return;

        const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
        const selectedEdges = rfInstance.getEdges().filter(
            (edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
        ) as AppEdge[];

        setClipboard({ 
            nodes: JSON.parse(JSON.stringify(selectedNodes)), 
            edges: JSON.parse(JSON.stringify(selectedEdges)) 
        });
        toast.info(`${selectedNodes.length} öğe kopyalandı`);
    }, [rfInstance]);

    const handlePaste = useCallback(() => {
        if (!clipboard || !rfInstance) return;
        takeSnapshot();

        const idMap: Record<string, string> = {};
        const newNodes = clipboard.nodes.map((node) => {
            const newId = crypto.randomUUID();
            idMap[node.id] = newId;

            return {
                ...node,
                id: newId,
                position: {
                    x: node.position.x + 40,
                    y: node.position.y + 40,
                },
                selected: true,
                data: {
                    ...node.data,
                    label: `${node.data.label} (Kopya)`
                }
            };
        });

        const newEdges = clipboard.edges.map((edge) => ({
            ...edge,
            id: crypto.randomUUID(),
            source: idMap[edge.source],
            target: idMap[edge.target],
            selected: true,
        })).filter(edge => edge.source && edge.target);

        // Deselect current selection and add new items
        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })).concat(newNodes));
        setEdges((eds) => eds.map((e) => ({ ...e, selected: false })).concat(newEdges as any));
        
        // Update clipboard position for next paste
        setClipboard({
            nodes: newNodes.map(n => ({ ...n, selected: false })),
            edges: newEdges.map(e => ({ ...e, selected: false })) as any
        });

        toast.success(`${newNodes.length} öğe yapıştırıldı`);
    }, [clipboard, rfInstance, setNodes, setEdges]);

    useEffect(() => {
        const isEditableTarget = (target: EventTarget | null) => {
            if (!(target instanceof HTMLElement)) return false;
            const tag = target.tagName.toLowerCase();
            return tag === "input" || tag === "textarea" || target.isContentEditable;
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (isEditableTarget(event.target)) return;
            if (event.code === "Space") {
                if (!isSpacePressed) {
                    event.preventDefault();
                    setIsSpacePressed(true);
                }
            } else if (event.key === "Shift") {
                setIsSnapPressed(true);
            } else if (event.ctrlKey && event.key === "c") {
                handleCopy();
            } else if (event.ctrlKey && event.key === "v") {
                handlePaste();
            } else if (event.ctrlKey && event.key === "z") {
                event.preventDefault();
                if (event.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            } else if (event.ctrlKey && event.key === "y") {
                event.preventDefault();
                redo();
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (isEditableTarget(event.target)) return;
            if (event.code === "Space") { setIsSpacePressed(false); return; }
            if (event.key === "Shift") { setIsSnapPressed(false); }
        };

        const handleBlur = () => { setIsSpacePressed(false); setIsSnapPressed(false); };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", handleBlur);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("blur", handleBlur);
        };
    }, [isSpacePressed, handleCopy, handlePaste, undo, redo, takeSnapshot]);

    const startResizeInspector = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        isResizingInspector.current = true;
        const onMouseMove = (moveEvent: MouseEvent) => {
            const container = reactFlowWrapper.current?.parentElement;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const relativeX = moveEvent.clientX - rect.left;
            setInspectorWidth(Math.min(Math.max(rect.width - relativeX, 280), rect.width * 0.6));
        };
        const onMouseUp = () => {
            isResizingInspector.current = false;
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    }, []);

    if (isLoading) {
        return <div className="node-editor-layout node-editor-container">Golden Line yükleniyor...</div>;
    }

    return (
        <div className="node-editor-layout node-editor-container">
            <NodeEditorHeader
                onBackClick={onBackClick}
                onSaveClick={saveFlowToBackend}
                breadcrumbItems={breadcrumbStack}
                projectName={projectName}
                onBreadcrumbClick={navigateToParent}
                isCriticalPathEnabled={isCriticalPathEnabled}
                onToggleCriticalPath={(value) => setIsCriticalPathEnabled(value)}
                onExportMSProject={handleExportToMSProject}
                onExportExcel={handleExportExcel}
                onImportMSProject={(file) => handleImportFromMSProject(file)}
                onTriggerImport={() => importInputRef.current?.click()}
                importInputRef={importInputRef}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid(!showGrid)}
                onUndo={undo}
                onRedo={redo}
                hideMSProjectButtons={true}
                hideCriticalPathToggle={true}
            />

            <div className="editor-container">
                {viewMode === "flow" ? (
                    <>
                        {showCatalog && (
                            <div className="catalog-sidebar">
                                <GoldenLineCatalog
                                    isEmbedded
                                    onItemDragStart={(e, type, label, item) => onDragStart(e, type, label, item)}
                                />
                            </div>
                        )}
                        <div className="react-flow-wrapper" ref={reactFlowWrapper} onDragOver={onDragOver} onDrop={onDrop}>
                            <ReactFlow
                                nodes={displayNodes}
                                edges={displayEdges}
                                nodeTypes={nodeTypes}
                                connectionMode={ConnectionMode.Loose}
                                minZoom={0.1}
                                panOnDrag={isSpacePressed ? [0, 1] : [1]}
                                selectionOnDrag
                                snapToGrid={true}
                                snapGrid={[20, 20]}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={(params) => { takeSnapshot(); onConnect(params); }}
                                onInit={onInit}
                                fitView
                                onNodeClick={onNodeClick}
                                onPaneClick={onPaneClick}
                                onNodeDoubleClick={onNodeDoubleClick}
                                onNodeDrag={onNodeDrag as any}
                                onNodeDragStop={onNodeDragStop as any}
                                onNodesDelete={onNodesDelete as any}
                                onEdgesDelete={onEdgesDelete as any}
                            >
                                <Controls />
                                {showGrid && <Background gap={20} size={1} variant={BackgroundVariant.Dots} color="#334155" />}
                            </ReactFlow>

                            <GoldenLineFloatingBar
                                onDragStart={onDragStart}
                                showCatalog={showCatalog}
                                onToggleCatalog={() => setShowCatalog(v => !v)}
                            />
                        </div>

                        {selectedNode && (
                            <>
                                <div className="inspector-resize-handle" onMouseDown={startResizeInspector} />
                                <InspectorPanel
                                    selectedNode={selectedNode}
                                    predecessors={predecessors}
                                    successors={successors}
                                    updateNodeLabel={updateNodeLabel}
                                    updateNodeMachineType={updateNodeMachineType}
                                    updateNodeDepartment={updateNodeDepartment}
                                    updateNodeCompletion={updateNodeCompletion}
                                    updateNodeDuration={updateNodeDuration}
                                    updateNodeImage={updateNodeImage}
                                    updateNodeUtilities={updateNodeUtilities}
                                    updateNodeSpecification={updateNodeSpecification}
                                    updateNodeQuality={updateNodeQuality}
                                    style={inspectorWidth ? { width: inspectorWidth } : undefined}
                                    isSimpleMode={true}
                                />
                            </>
                        )}
                    </>
                ) : (
                    <MachineDatasheet 
                        nodes={nodes} 
                        updateNodeLabel={updateNodeLabel}
                        updateNodeMachineType={updateNodeMachineType}
                        updateNodeUtilities={updateNodeUtilities}
                        updateNodeSpecification={updateNodeSpecification}
                    />
                )}
            </div>
        </div>
    );
}

function GoldenLine() {
    return (
        <ReactFlowProvider>
            <GoldenLineContent />
        </ReactFlowProvider>
    );
}

export default GoldenLine;
