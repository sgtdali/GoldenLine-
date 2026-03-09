import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { AppNode } from '../../../types/flow';

interface UseGoldenLineExportProps {
    nodes: AppNode[];
    projectName: string;
}

export const useGoldenLineExport = ({ nodes, projectName }: UseGoldenLineExportProps) => {
    const handleExportExcel = useCallback(() => {
        if (nodes.length === 0) {
            alert("Dışa aktarılacak veri bulunamadı.");
            return;
        }

        const nodeById = new Map(nodes.map(n => [n.id, n]));
        const machineNodes = nodes.filter(node => node.type !== "grup");

        // --- Sheet 1: Golden Line (Akış) ---
        const flowData = machineNodes.map((node) => {
            const parentId = (node as any).parentId || node.data?.parentNodeId;
            const parentNode = parentId ? nodeById.get(parentId) : null;
            const parentName = parentNode?.data?.label || "-";
            return {
                "Hücre": parentName,
                "Makine": node.data?.label || ""
            };
        });

        // --- Sheet 2: Utilities (Teknik Veriler) ---
        const utilsHeader = [
            ["", "", "Elektrik Bilgileri", "", "", "Hava Bilgileri", "", "", "Doğalgaz Bilgileri", "", "", "", "Soğutma Suyu Bilgileri", "", "", "", "", "", "", "Şebeke Suyu Bilgileri", "", ""], // Row 1
            ["Hücre No", "Makine Ad", "UPS", "Nominal Güç", "Voltaj&Hz&Faz", "Tüketim", "Bağlantı Tipi", "Ölçüler", "Tüketim", "Basınç", "Bağlantı Tipi", "Ölçüler", "Debi", "Basınç", "Devre Tipi", "Giriş Sıcaklık", "Çıkış Sıcaklık", "Bağlantı Tipi", "Ölçüler", "Debi", "Bağlantı Tipi", "Ölçüler"] // Row 2
        ];

        const utilsData = machineNodes.map((node) => {
            const parentId = (node as any).parentId || node.data?.parentNodeId;
            const parentNode = parentId ? nodeById.get(parentId) : null;
            const parentName = parentNode?.data?.label || "-";

            const utils = (node.data as any)?.utilities || {};
            const electrical = utils.electrical;
            const air = utils.air;
            const gas = utils.naturalGas;
            const water = utils.coolingWater;
            const mainWater = utils.mainWater;

            return [
                parentName,
                node.data?.label || "",
                electrical?.ups || "-",
                electrical?.nominalPower || "-",
                electrical?.voltageHzPhase || "-",
                air?.consumption || "-",
                air?.connectionType || "-",
                air?.connectionSize || "-",
                gas?.consumption || "-",
                gas?.pressure || "-",
                gas?.connectionType || "-",
                gas?.connectionSize || "-",
                water?.flow || "-",
                water?.pressure || "-",
                water?.circuitType || "-",
                water?.inletTemp || "-",
                water?.outletTemp || "-",
                water?.connectionType || "-",
                water?.connectionSize || "-",
                mainWater?.flow || "-",
                mainWater?.connectionType || "-",
                mainWater?.connectionSize || "-"
            ];
        });

        const workbook = XLSX.utils.book_new();

        // Add Flow Sheet
        const flowWorksheet = XLSX.utils.json_to_sheet(flowData);
        XLSX.utils.book_append_sheet(workbook, flowWorksheet, "Golden Line");

        // Add Utilities Sheet
        const utilsWorksheet = XLSX.utils.aoa_to_sheet([...utilsHeader, ...utilsData]);

        if (!utilsWorksheet['!merges']) utilsWorksheet['!merges'] = [];
        utilsWorksheet['!merges'].push({ s: { r: 0, c: 2 }, e: { r: 0, c: 4 } });
        utilsWorksheet['!merges'].push({ s: { r: 0, c: 5 }, e: { r: 0, c: 7 } });
        utilsWorksheet['!merges'].push({ s: { r: 0, c: 8 }, e: { r: 0, c: 11 } });
        utilsWorksheet['!merges'].push({ s: { r: 0, c: 12 }, e: { r: 0, c: 18 } });
        utilsWorksheet['!merges'].push({ s: { r: 0, c: 19 }, e: { r: 0, c: 21 } });

        XLSX.utils.book_append_sheet(workbook, utilsWorksheet, "Teknik Veriler");

        XLSX.writeFile(workbook, `${projectName || "Golden_Line"}_Detayli_Akis.xlsx`);
    }, [nodes, projectName]);

    return { handleExportExcel };
};
