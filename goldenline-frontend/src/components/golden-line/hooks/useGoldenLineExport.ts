import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { AppNode } from '../../../types/flow';
import { SPEC_GROUPS, getSpecValue } from '../MachineDatasheet';

interface UseGoldenLineExportProps {
    nodes: AppNode[];
    projectName: string;
}

export const useGoldenLineExport = ({ nodes, projectName }: UseGoldenLineExportProps) => {
    const handleExportExcel = useCallback(() => {
        const machineNodes = nodes.filter(n => n.type !== 'grup' && n.data?.label);
        if (machineNodes.length === 0) return;

        // Group machines by their parent cell in order of grup nodes
        const grupNodes = nodes.filter(n => n.type === 'grup');
        const machinesByGroup: { groupName: string; machines: AppNode[] }[] = [];

        grupNodes.forEach(grup => {
            const children = machineNodes.filter(m =>
                (m as any).parentId === grup.id || (m.data as any).parentNodeId === grup.id
            );
            if (children.length > 0) {
                machinesByGroup.push({ groupName: grup.data.label, machines: children });
            }
        });

        const groupedIds = new Set(machinesByGroup.flatMap(g => g.machines.map(m => m.id)));
        const ungrouped = machineNodes.filter(m => !groupedIds.has(m.id));
        if (ungrouped.length > 0) {
            machinesByGroup.push({ groupName: 'Genel', machines: ungrouped });
        }

        const columns: { machine: AppNode; groupName: string }[] = [];
        machinesByGroup.forEach(({ groupName, machines }) => {
            machines.forEach(m => columns.push({ machine: m, groupName }));
        });

        const data: any[][] = [];

        // Row 1: Cell # groupings
        const row1: any[] = ['Cell #'];
        machinesByGroup.forEach(({ groupName, machines }) => {
            row1.push(groupName);
            for (let i = 1; i < machines.length; i++) row1.push('');
        });
        data.push(row1);

        // Row 2: Sequential numbers
        const row2: any[] = ['#'];
        columns.forEach((_, i) => row2.push(i + 1));
        data.push(row2);

        // Row 3: Machine/Process Name
        const row3: any[] = ['Machine/Process Name'];
        columns.forEach(({ machine }) => row3.push(machine.data.label || ''));
        data.push(row3);

        // Spec sections
        SPEC_GROUPS.forEach(group => {
            const headerRow: any[] = [group.name];
            columns.forEach(() => headerRow.push(''));
            data.push(headerRow);

            group.specs.forEach(spec => {
                const row: any[] = [spec];
                columns.forEach(({ machine }) => {
                    const val = getSpecValue(machine, spec);
                    row.push(val === '-' ? '' : val);
                });
                data.push(row);
            });
        });

        const ws = XLSX.utils.aoa_to_sheet(data);

        // Merge Row 1 cells for each cell group
        const merges: XLSX.Range[] = [];
        let colIdx = 1;
        machinesByGroup.forEach(({ machines }) => {
            if (machines.length > 1) {
                merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + machines.length - 1 } });
            }
            colIdx += machines.length;
        });
        if (merges.length > 0) ws['!merges'] = merges;

        ws['!cols'] = [{ wch: 52 }, ...columns.map(() => ({ wch: 26 }))];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'MCD');
        XLSX.writeFile(wb, `${projectName || 'Golden_Line'}_MCD.xlsx`);
    }, [nodes, projectName]);

    return { handleExportExcel };
};
