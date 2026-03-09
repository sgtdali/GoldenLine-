import React, { useRef } from "react";
import { CSVLink } from "react-csv";

type Props = {
  projectId: string;
  onDragStart: (
    event: React.DragEvent,
    nodeType: string,
    nodeLabel: string
  ) => void;
  handleExportToMSProject: () => void;
  handleImportFromMSProject: (file: File) => void;
  csvData: any[];
  csvHeaders: any[];
  csvLinkRef: React.RefObject<any>;
};

const Sidebar: React.FC<Props> = ({
  projectId,
  onDragStart,
  handleExportToMSProject,
  handleImportFromMSProject,
  csvData,
  csvHeaders,
  csvLinkRef,
}) => {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const triggerImport = () => {
    importInputRef.current?.click();
  };

  const handleImportChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImportFromMSProject(file);
    }
    // reset input so the same file can be selected again if needed
    event.target.value = "";
  };

  return (
    <aside className="sidebar">
      <h3>Dugum Tipleri</h3>
      <p>Yeni bir dugum eklemek icin tuvale surukleyin:</p>

      <div
        className="dndnode"
        onDragStart={(event) =>
          onDragStart(event as any, "default", "Montaj Adimi")
        }
        draggable
      >
        Montaj Adimi
      </div>

      <div
        className="dndnode"
        style={{ borderColor: "#555", color: "#555", background: "#f0f0f0" }}
        onDragStart={(event) => onDragStart(event as any, "grup", "Grup")}
        draggable
      >
        Grup (Alt Akis)
      </div>

      <h3 style={{ marginTop: "20px" }}>Entegrasyon</h3>
      <button className="sidebar-button export" onClick={handleExportToMSProject}>
        MS Project'e Aktar (XML)
      </button>
      <CSVLink
        data={csvData}
        headers={csvHeaders}
        filename={`montajui_proje_${projectId}.csv`}
        style={{ display: "none" }}
        ref={csvLinkRef}
        target="_blank"
      />
      <button className="sidebar-button import" onClick={triggerImport}>
        MS Project'ten Yukle
      </button>
      <input
        ref={importInputRef}
        type="file"
        accept=".mpp,.xml"
        style={{ display: "none" }}
        onChange={handleImportChange}
      />
    </aside>
  );
};

export default Sidebar;
