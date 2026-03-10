import React, { useMemo } from 'react';
import { AppNode } from '../../types/flow';
import './MachineDatasheet.css';

interface MachineDatasheetProps {
    nodes: AppNode[];
    updateNodeLabel: (id: string, label: string) => void;
    updateNodeMachineType: (id: string, type: string) => void;
    updateNodeUtilities: (id: string, utils: any) => void;
    updateNodeSpecification: (id: string, specs: any) => void;
}

const SPEC_GROUPS = [
    {
        name: "General Information",
        specs: ["Machine Type", "Machine/Process Description", "Station/Pallet Capacity", "Target OEE (%)"]
    },
    {
        name: "Utility and Foundation Requirements",
        specs: [
            "Machine Voltage (V)", "Machine Frequency (Hz)", "Peak Power (kW)", "Estimated Installed Power (kW)",
            "Compressed Air Pressure (bar)", "Compressed Air Consumption (Nm3/h)",
            "Technical Gas Type", "Technical Gas Pressure (bar)", "Technical Gas Consumption (Nm3/h)",
            "Cold Water Amount (L/min)", "Cold Water Circulation Pressure (bar)",
            "Domestic Water Amount (m3/h)", "Ventilation (m3/h)",
            "Noise Level (dB)", "Foundation Type", "Minimum Floor Thickness", "Concrete Type", "Anchoring",
            "Additional foundation requirement"
        ]
    },
    {
        name: "Machine Specifications",
        specs: [
            "Machine Dimensions", "Max Operating Temperature (°C)", "Min Operating Temperature (°C)", "Max Operating Humidity (%)",
            "Part Loading Method", "Part Unloading Method", "Inlet Part Code", "Exit Part Code"
        ]
    },
    {
        name: "Quality Control",
        specs: [
            "Quality Control Frequency 1", "Critical to Quality Specification 1", "Quality Control Method 1",
            "Applicable Standards", "Inspection Level"
        ]
    },
    {
        name: "Maintenance & Safety",
        specs: [
            "Maintenance Manpower Requirement", "Operating Manpower Requirement", "Supervising Manpower Requirement",
            "PPE Requirement", "MSDS Availability", "Fire Extinguisher Type", "Emergency Stop Buttons"
        ]
    }
];

const MachineDatasheet: React.FC<MachineDatasheetProps> = ({ 
    nodes, 
    updateNodeLabel, 
    updateNodeMachineType, 
    updateNodeUtilities, 
    updateNodeSpecification 
}) => {
    const [searchTerm, setSearchTerm] = React.useState("");

    const machines = useMemo(() => {
        return nodes.filter(n => n.type !== 'grup' && n.data?.label && 
            (n.data.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
             (n.data as any).machineType?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [nodes, searchTerm]);

    // Group machines by their parent group (Cell)
    const machinesByGroup = useMemo(() => {
        const groups: Record<string, { name: string, items: AppNode[] }> = {};
        
        machines.forEach(m => {
            const parentId = (m.data as any).parentNodeId || "root";
            if (!groups[parentId]) {
                const parentNode = nodes.find(n => n.id === parentId);
                groups[parentId] = {
                    name: parentNode?.data?.label || "Genel İstasyonlar",
                    items: []
                };
            }
            groups[parentId].items.push(m);
        });
        
        return Object.entries(groups);
    }, [machines, nodes]);

    const getValue = (node: AppNode, specName: string) => {
        const data = node.data as any;
        const specs = data.specification || {};
        const utils = data.utilities || {};

        // Helper to find value in deep structures
        switch (specName) {
            case "Machine Type": return data.machineType || "-";
            case "Machine/Process Description": return data.label || "-";
            case "Peak Power (kW)": return utils.electrical?.nominalPower || "-";
            case "Machine Voltage (V)": return utils.electrical?.voltageHzPhase || "-";
            case "Compressed Air Pressure (bar)": return specs["Compressed Air Pressure (bar)"] || "-";
            case "Compressed Air Consumption (Nm3/h)": return utils.air?.consumption || "-";
            case "Technical Gas Consumption (Nm3/h)": return utils.naturalGas?.consumption || "-";
            case "Inlet Part Code": return specs.inletPartCode || "-";
            case "Exit Part Code": return specs.exitPartCode || "-";
            case "Machine Dimensions": return specs.machineDimensions || "-";
            case "Noise Level (dB)": return specs.infraNoiseLevel || "-";
            case "Foundation Type": return specs.infraFoundationType || "-";
            case "Target OEE (%)": return specs.processTargetOEE || "-";
            case "Cycle time (s)": return specs.processCycleTime || "-";
            default: return specs[specName] || "-";
        }
    };

    const handleValueChange = (node: AppNode, specName: string, newValue: string) => {
        const data = node.data as any;
        const specs = { ...(data.specification || {}) };
        const utils = { ...(data.utilities || {}) };

        switch (specName) {
            case "Machine Type":
                updateNodeMachineType(node.id, newValue);
                break;
            case "Machine/Process Description":
                updateNodeLabel(node.id, newValue);
                break;
            case "Peak Power (kW)":
                utils.electrical = { ...(utils.electrical || {}), nominalPower: newValue };
                updateNodeUtilities(node.id, utils);
                break;
            case "Machine Voltage (V)":
                utils.electrical = { ...(utils.electrical || {}), voltageHzPhase: newValue };
                updateNodeUtilities(node.id, utils);
                break;
            case "Compressed Air Pressure (bar)":
                specs["Compressed Air Pressure (bar)"] = newValue;
                updateNodeSpecification(node.id, specs);
                break;
            case "Compressed Air Consumption (Nm3/h)":
                utils.air = { ...(utils.air || {}), consumption: newValue };
                updateNodeUtilities(node.id, utils);
                break;
            case "Technical Gas Consumption (Nm3/h)":
                utils.naturalGas = { ...(utils.naturalGas || {}), consumption: newValue };
                updateNodeUtilities(node.id, utils);
                break;
            case "Inlet Part Code":
                specs.inletPartCode = newValue;
                updateNodeSpecification(node.id, specs);
                break;
            case "Exit Part Code":
                specs.exitPartCode = newValue;
                updateNodeSpecification(node.id, specs);
                break;
            case "Machine Dimensions":
                specs.machineDimensions = newValue;
                updateNodeSpecification(node.id, specs);
                break;
            case "Noise Level (dB)":
                specs.infraNoiseLevel = newValue;
                updateNodeSpecification(node.id, specs);
                break;
            case "Foundation Type":
                specs.infraFoundationType = newValue;
                updateNodeSpecification(node.id, specs);
                break;
            case "Target OEE (%)":
                specs.processTargetOEE = newValue;
                updateNodeSpecification(node.id, specs);
                break;
            case "Cycle time (s)":
                specs.processCycleTime = newValue;
                updateNodeSpecification(node.id, specs);
                break;
            default:
                specs[specName] = newValue;
                updateNodeSpecification(node.id, specs);
                break;
        }
    };

    if (machines.length === 0) {
        return (
            <div className="datasheet-empty">
                <div className="empty-state-content">
                    <div className="empty-icon">📊</div>
                    <h3>Henüz Makine Bulunmuyor</h3>
                    <p>Akış görünümüne giderek projenize makineler ekleyin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="machine-datasheet-container">
            <div className="datasheet-toolbar">
                <div className="search-wrapper">
                    <input 
                        type="text" 
                        placeholder="Makine ara..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="datasheet-search-input"
                    />
                </div>
                <div className="datasheet-stats">
                    {machines.length} makine listeleniyor
                </div>
            </div>
            <div className="datasheet-table-wrapper">
                <table className="datasheet-table">
                    <thead>
                        <tr>
                            <th className="sticky-col spec-name-header">Specification</th>
                            {machinesByGroup.map(([groupId, group]) => (
                                <React.Fragment key={groupId}>
                                    {group.items.map(m => (
                                        <th key={m.id} className="machine-header">
                                            <div className="group-context">{group.name}</div>
                                            <div className="machine-name">{m.data.label}</div>
                                            <div className="machine-id">{m.id}</div>
                                        </th>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {SPEC_GROUPS.map((group, gIdx) => (
                            <React.Fragment key={gIdx}>
                                <tr className="group-row">
                                    <td colSpan={machines.length + 1}>{group.name}</td>
                                </tr>
                                {group.specs.map((spec, sIdx) => (
                                    <tr key={`${gIdx}-${sIdx}`}>
                                        <td className="sticky-col spec-name">{spec}</td>
                                        {machinesByGroup.map(([groupId, gData]) => (
                                            <React.Fragment key={`row-${groupId}`}>
                                                {gData.items.map(m => {
                                                    const val = getValue(m, spec);
                                                    return (
                                                        <td key={m.id} className="spec-value editable-cell">
                                                            <input 
                                                                type="text" 
                                                                value={val === "-" ? "" : val} 
                                                                onChange={(e) => handleValueChange(m, spec, e.target.value)}
                                                                placeholder="..."
                                                                className="matrix-input"
                                                            />
                                                        </td>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MachineDatasheet;
