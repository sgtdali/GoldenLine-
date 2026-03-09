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
import type { AppNode } from "../../types/flow";
import { getDisplayNodes, getDisplayEdges } from "./utils/goldenLineUtils";
import { GoldenLineFloatingBar } from "./components/GoldenLineFloatingBar";

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
        onNodeDrag, onNodeDragStop, onNodesDelete, onEdgesDelete,
    } = useFlowInteractions({
        nodes, setNodes, edges, setEdges,
        reactFlowInstance: rfInstance,
        setSelectedNode, nodeTypes, currentParentId, drillDown,
    });

    const { handleExportToMSProject, handleImportFromMSProject } = useEditorActions({
        reactFlowInstance: rfInstance,
        projectId: projectId,
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
    }, [isSpacePressed]);

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
                hideMSProjectButtons={true}
                hideCriticalPathToggle={true}
            />

            <div className="editor-container">
                <div className="react-flow-wrapper" ref={reactFlowWrapper} onDragOver={onDragOver} onDrop={onDrop}>
                    <ReactFlow
                        nodes={displayNodes}
                        edges={displayEdges}
                        nodeTypes={nodeTypes}
                        connectionMode={ConnectionMode.Loose}
                        minZoom={0.1}
                        panOnDrag={isSpacePressed ? [0, 1] : [1]}
                        selectionOnDrag
                        snapToGrid={isSnapPressed}
                        snapGrid={[10, 10]}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
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
                        <Background gap={10} size={1} variant={BackgroundVariant.Lines} />
                    </ReactFlow>

                    <GoldenLineFloatingBar onDragStart={onDragStart} />
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
