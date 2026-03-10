import React, { useRef } from "react";
import type { BreadcrumbItem } from "../hooks/useFlowState";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { LayoutGrid, Table, Undo2, Redo2 } from "lucide-react";

type NodeEditorHeaderProps = {
  projectName: string;
  onBackClick: () => void;
  onSaveClick: () => void;
  onExportMSProject: () => void;
  onExportExcel?: () => void;
  onImportMSProject: (file: File) => void;
  onTriggerImport?: () => void;
  importInputRef?: React.RefObject<HTMLInputElement>;
  breadcrumbItems: BreadcrumbItem[];
  onBreadcrumbClick: (id: string | null) => void;
  isCriticalPathEnabled: boolean;
  onToggleCriticalPath: (enabled: boolean) => void;
  viewMode: "flow" | "datasheet";
  onViewModeChange: (mode: "flow" | "datasheet") => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  hideMSProjectButtons?: boolean;
  hideCriticalPathToggle?: boolean;
};

const NodeEditorHeader: React.FC<NodeEditorHeaderProps> = ({
  projectName,
  onBackClick,
  onSaveClick,
  onExportMSProject,
  onExportExcel,
  onImportMSProject,
  onTriggerImport,
  importInputRef,
  breadcrumbItems,
  onBreadcrumbClick,
  isCriticalPathEnabled,
  onToggleCriticalPath,
  viewMode,
  onViewModeChange,
  showGrid,
  onToggleGrid,
  onUndo,
  onRedo,
  hideMSProjectButtons = false,
  hideCriticalPathToggle = false,
}) => {
  const fallbackImportRef = useRef<HTMLInputElement>(null);
  const fileInputRef = importInputRef ?? fallbackImportRef;

  const handleImportChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportMSProject(file);
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleImportClick = () => {
    if (onTriggerImport) {
      onTriggerImport();
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <header className="node-editor-header">
      <div className="header-left">
        <Button variant="outline" size="sm" onClick={onBackClick}>
          &lt; Projeler
        </Button>

        <nav className="breadcrumb-nav" aria-label="Montaj konumu">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const label = index === 0 ? projectName : item.label;
            const key = item.id ?? "root";

            return (
              <span key={key} className="breadcrumb-segment">
                {index > 0 && <span className="breadcrumb-separator">/</span>}
                {isLast ? (
                  <span className="breadcrumb-label active">{label}</span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="breadcrumb-button"
                    onClick={() => onBreadcrumbClick(item.id)}
                  >
                    {label}
                  </Button>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      <div className="header-right">
        <div className="view-mode-toggle flex items-center bg-slate-100 p-1 rounded-lg mr-4 border border-slate-200">
          <Button
            variant={viewMode === "flow" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("flow")}
            className={`rounded-md gap-2 ${viewMode === "flow" ? "shadow-sm" : "text-slate-500"}`}
          >
            <LayoutGrid className="w-4 h-4" />
            Akış Görünümü
          </Button>
          <Button
            variant={viewMode === "datasheet" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("datasheet")}
            className={`rounded-md gap-2 ${viewMode === "datasheet" ? "shadow-sm" : "text-slate-500"}`}
          >
            <Table className="w-4 h-4" />
            Spesifikasyon Matrisi
          </Button>
        </div>

        {viewMode === "flow" && onToggleGrid && (
          <Button
            variant={showGrid ? "default" : "outline"}
            size="sm"
            onClick={onToggleGrid}
            className="mr-4 gap-2"
            title="Izgarayı Aç/Kapat"
          >
            <LayoutGrid className="w-4 h-4" />
            Izgara
          </Button>
        )}

        {(onUndo || onRedo) && (
          <div className="undo-redo-controls flex items-center bg-slate-100 p-1 rounded-lg mr-4 border border-slate-200">
            {onUndo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onUndo}
                className="rounded-md text-slate-500 hover:text-slate-900 px-2"
                title="Geri Al (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
            )}
            {onRedo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRedo}
                className="rounded-md text-slate-500 hover:text-slate-900 px-2"
                title="İleri Al (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {!hideCriticalPathToggle && (
          <label className="critical-toggle">
            <Switch
              checked={isCriticalPathEnabled}
              onCheckedChange={onToggleCriticalPath}
            />
            <span>Kritik yolu goster</span>
          </label>
        )}
        {onExportExcel && (
          <Button variant="outline" size="sm" onClick={onExportExcel}>
            Excel'e Aktar
          </Button>
        )}
        {!hideMSProjectButtons && (
          <>
            <Button variant="outline" size="sm" onClick={onExportMSProject}>
              MS Project'e Aktar
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportClick}>
              MS Project'ten Yukle
            </Button>
          </>
        )}
        <input
          type="file"
          accept=".mpp,.xml"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImportChange}
        />
        <Button size="sm" onClick={onSaveClick}>
          Kaydet
        </Button>
      </div>
    </header>
  );
};

export default NodeEditorHeader;
