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

export const SPEC_GROUPS = [
    {
        name: "General Information",
        specs: [
            "Machine/Process Name",
            "Machine/Process Description",
            "Inlet Part Code",
            "Inlet Part Description",
            "Exit Part Code",
            "Exit Part Description",
            "Control Plan Sheet No",
            "Applicable Standards",
            "Process Parameters (SOP or Operation Card No)",
        ]
    },
    {
        name: "Die-Tool-Fixture Specifications",
        specs: [
            "Die 1", "Die 1 Life",
            "Die 2", "Die 2 Life",
            "Tool 1", "Tool 1 Life",
            "Tool 2", "Tool 2 Life",
            "Fixture 1", "Fixture 2",
        ]
    },
    {
        name: "Quality Control",
        specs: [
            "Critical to Quality Specification 1", "Quality Control Frequency 1", "Quality Control Method 1",
            "Critical to Quality Specification 2", "Quality Control Frequency 2", "Quality Control Method 2",
            "Critical to Quality Specification 3", "Quality Control Frequency 3", "Quality Control Method 3",
            "Critical to Quality Specification 4", "Quality Control Frequency 4", "Quality Control Method 4",
            "Critical to Quality Specification 5", "Quality Control Frequency 5", "Quality Control Method 5",
            "Part Rework Availability",
            "Data Acquisition",
        ]
    },
    {
        name: "Machine Sub Equipments",
        specs: [
            "Sub Equipments 1", "Sub Equipments 2", "Sub Equipments 3",
            "Sub Equipments 4", "Sub Equipments 5", "Sub Equipments 6",
            "Sub Equipments 7", "Sub Equipments 8", "Sub Equipments 9",
            "Sub Equipments 10", "Sub Equipments 11", "Sub Equipments 12",
            "Sub Equipments 13", "Sub Equipments 14", "Sub Equipments 15",
            "Sub Equipments 16", "Sub Equipments 17", "Sub Equipments 18",
        ]
    },
    {
        name: "Machine Specifications",
        specs: [
            "Machine Type",
            "Machine Voltage (V) [Depends on country]",
            "Phase [Depends on country]",
            "Machine Frequency (Hz) [Depends on country]",
            "Machine Dimensions",
            "Max Operating Temperature (°C)",
            "Min Operating Temperature (°C)",
            "Max Operating Humidity (%)",
            "Specification 1", "Specification 2", "Specification 3", "Specification 4",
            "Specification 5", "Specification 6", "Specification 7", "Specification 8",
            "Specification 9", "Specification 10", "Specification 11", "Specification 12",
            "Specification 13", "Specification 14", "Specification 15", "Specification 16",
            "Part Loading Method",
            "Part Unloading Method",
            "Part Handling Frequency",
            "Cycle time (Averaged between 2 compliant parts) (s)",
            "Target OEE (%)",
            "Best Practices",
        ]
    },
    {
        name: "Consumables",
        specs: [
            "Consumable 1 Name&Type&Brand", "Consumable 1 First Fill Amount", "Consumable 1 Consumption Amount", "Consumable 1 Lifecycle", "Consumable 1 Storage Condition", "Consumable 1 Minimum Order Quantity",
            "Consumable 2 Name&Type&Brand", "Consumable 2 First Fill Amount", "Consumable 2 Consumption Amount", "Consumable 2 Lifecycle", "Consumable 2 Storage Condition", "Consumable 2 Minimum Order Quantity",
            "Consumable 3 Name&Type&Brand", "Consumable 3 First Fill Amount", "Consumable 3 Consumption Amount", "Consumable 3 Lifecycle", "Consumable 3 Storage Condition", "Consumable 3 Minimum Order Quantity",
            "Consumable 4 Name&Type&Brand", "Consumable 4 First Fill Amount", "Consumable 4 Consumption Amount", "Consumable 4 Lifecycle", "Consumable 4 Storage Condition", "Consumable 4 Minimum Order Quantity",
        ]
    },
    {
        name: "Scrap & Recyclable",
        specs: [
            "Scrap & Recyclable Type",
            "Scrap & Recyclable Quantity",
            "Scrap & Recyclable Handling Method",
            "Scrap & Recyclable Cleaning Frequency",
            "Scrap & Recyclable Recycling Method",
        ]
    },
    {
        name: "Spare Parts",
        specs: [
            "Critical Spare Part List Sheet No",
            "Recommended Critical Spare Parts Quantity",
        ]
    },
    {
        name: "Maintenance",
        specs: [
            "Daily Maintenance-Check 1 (Or Autonomous Maintenance Document No)",
            "Daily Maintenance-Check 2", "Daily Maintenance-Check 3",
            "Daily Maintenance-Check 4", "Daily Maintenance-Check 5",
            "Daily Maintenance-Check 6", "Daily Maintenance-Check 7",
            "Periodic Maintenance 1", "Periodic Maintenance 2", "Periodic Maintenance 3",
            "Periodic Maintenance 4", "Periodic Maintenance 5", "Periodic Maintenance 6",
            "Periodic Maintenance 7", "Periodic Maintenance 8",
            "Preventative Maintenance Availability",
            "Maintenance Manpower Requirement",
            "Operating Manpower Requirement",
            "Quality Inspector Manpower Requirement",
            "Supervising Manpower Requirement",
            "Handling Manpower Requirement",
        ]
    },
    {
        name: "Utility and Foundation Requirements",
        specs: [
            "Estimated Installed Power (kW)",
            "Peak Power (kW)",
            "Compressed Air Pressure (bar)",
            "Compressed Air Consumption (Nm3/h)",
            "Technical Gas Type",
            "Technical Gas Pressure (bar)",
            "Technical Gas Consumption (Nm3/h)",
            "Cold (20-30°C) Water Amount (L/min)",
            "Cold (20-30°C) Water Circulation Pressure (bar)",
            "Domestic Water Amount (m3/h)",
            "Ventilation (m3/h)",
            "Foundation Type",
            "Minimum Floor Thickness",
            "Concrete Type",
            "Anchoring",
            "Additional Foundation Requirement (Pit, Drainage etc.)",
        ]
    },
    {
        name: "Health & Safety",
        specs: [
            "Noise Level (dB)",
            "Spill Response Procedure",
            "MSDS Availability",
            "Storage Conditions",
            "Emergency Stop Buttons / Locations",
            "Guarding of Moving Parts / Barriers Availability",
            "Fire Extinguisher Type & Availability",
            "PPE (Personal Protective Equipment) Requirement",
        ]
    },
];

const QUALITY_PATTERNS: Record<string, { field: 'spec' | 'frequency' | 'method'; index: number }> = {};
for (let i = 1; i <= 5; i++) {
    QUALITY_PATTERNS[`Critical to Quality Specification ${i}`] = { field: 'spec', index: i - 1 };
    QUALITY_PATTERNS[`Quality Control Frequency ${i}`] = { field: 'frequency', index: i - 1 };
    QUALITY_PATTERNS[`Quality Control Method ${i}`] = { field: 'method', index: i - 1 };
}

const CONSUMABLE_FIELD_MAP: Record<string, string> = {
    'Name&Type&Brand': 'name',
    'First Fill Amount': 'firstFill',
    'Consumption Amount': 'consumption',
    'Lifecycle': 'lifecycle',
    'Storage Condition': 'storage',
    'Minimum Order Quantity': 'minOrderQty',
};

const parseConsumableSpec = (specName: string): { index: number; field: string } | null => {
    const match = specName.match(/^Consumable (\d) (.+)$/);
    if (!match) return null;
    const index = parseInt(match[1]) - 1;
    const field = CONSUMABLE_FIELD_MAP[match[2]];
    if (field === undefined) return null;
    return { index, field };
};

export const getSpecValue = (node: AppNode, specName: string): string => {
    const data = node.data as any;
    const specs = data.specification || {};
    const utils = data.utilities || {};

    const qp = QUALITY_PATTERNS[specName];
    if (qp) {
        const quality = specs.quality || [];
        return quality[qp.index]?.[qp.field] || '-';
    }

    const cp = parseConsumableSpec(specName);
    if (cp) {
        const consumables = specs.consumables || [];
        return consumables[cp.index]?.[cp.field] || '-';
    }

    switch (specName) {
        case "Machine/Process Name": return data.label || '-';
        case "Machine Type": return data.machineType || '-';
        case "Inlet Part Code": return specs.inletPartCode || '-';
        case "Inlet Part Description": return specs.inletPartDescription || '-';
        case "Exit Part Code": return specs.exitPartCode || '-';
        case "Exit Part Description": return specs.exitPartDescription || '-';
        case "Machine Dimensions": return specs.machineDimensions || '-';
        case "Machine Voltage (V) [Depends on country]": return utils.electrical?.voltageHzPhase || specs["Machine Voltage (V)"] || '-';
        case "Peak Power (kW)": return utils.electrical?.nominalPower || '-';
        case "Compressed Air Pressure (bar)": return specs["Compressed Air Pressure (bar)"] || '-';
        case "Compressed Air Consumption (Nm3/h)": return utils.air?.consumption || '-';
        case "Technical Gas Consumption (Nm3/h)": return utils.naturalGas?.consumption || '-';
        case "Technical Gas Pressure (bar)": return utils.naturalGas?.pressure || specs["Technical Gas Pressure (bar)"] || '-';
        case "Cold (20-30°C) Water Amount (L/min)": return utils.coolingWater?.flow || '-';
        case "Cold (20-30°C) Water Circulation Pressure (bar)": return utils.coolingWater?.pressure || '-';
        case "Domestic Water Amount (m3/h)": return utils.mainWater?.flow || '-';
        case "Foundation Type": return specs.infraFoundationType || '-';
        case "Minimum Floor Thickness": return specs.infraFloorThickness || specs["Minimum Floor Thickness"] || '-';
        case "Concrete Type": return specs.infraConcreteType || specs["Concrete Type"] || '-';
        case "Anchoring": return specs.infraAnchoring || specs["Anchoring"] || '-';
        case "Noise Level (dB)": return specs.infraNoiseLevel || '-';
        case "Target OEE (%)": return specs.processTargetOEE || '-';
        case "Cycle time (Averaged between 2 compliant parts) (s)": return specs.processCycleTime || specs["Cycle time (s)"] || '-';
        case "Part Loading Method": return specs.processLoadingMethod || specs["Part Loading Method"] || '-';
        case "Part Unloading Method": return specs.processUnloadingMethod || specs["Part Unloading Method"] || '-';
        default: return specs[specName] || '-';
    }
};

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

    const machinesByGroup = useMemo(() => {
        const groups: Record<string, { name: string; items: AppNode[] }> = {};
        machines.forEach(m => {
            const parentId = (m as any).parentId || (m.data as any).parentNodeId || "root";
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

    const handleValueChange = (node: AppNode, specName: string, newValue: string) => {
        const data = node.data as any;
        const specs = { ...(data.specification || {}) };
        const utils = { ...(data.utilities || {}) };

        const qp = QUALITY_PATTERNS[specName];
        if (qp) {
            const quality = [...(specs.quality || [])];
            while (quality.length <= qp.index) quality.push({ spec: '', frequency: '', method: '' });
            quality[qp.index] = { ...quality[qp.index], [qp.field]: newValue };
            updateNodeSpecification(node.id, { ...specs, quality });
            return;
        }

        const cp = parseConsumableSpec(specName);
        if (cp) {
            const consumables = [...(specs.consumables || [])];
            while (consumables.length <= cp.index) consumables.push({});
            consumables[cp.index] = { ...consumables[cp.index], [cp.field]: newValue };
            updateNodeSpecification(node.id, { ...specs, consumables });
            return;
        }

        switch (specName) {
            case "Machine/Process Name":
                updateNodeLabel(node.id, newValue); break;
            case "Machine Type":
                updateNodeMachineType(node.id, newValue); break;
            case "Inlet Part Code":
                updateNodeSpecification(node.id, { ...specs, inletPartCode: newValue }); break;
            case "Inlet Part Description":
                updateNodeSpecification(node.id, { ...specs, inletPartDescription: newValue }); break;
            case "Exit Part Code":
                updateNodeSpecification(node.id, { ...specs, exitPartCode: newValue }); break;
            case "Exit Part Description":
                updateNodeSpecification(node.id, { ...specs, exitPartDescription: newValue }); break;
            case "Machine Dimensions":
                updateNodeSpecification(node.id, { ...specs, machineDimensions: newValue }); break;
            case "Machine Voltage (V) [Depends on country]":
                updateNodeUtilities(node.id, { ...utils, electrical: { ...(utils.electrical || {}), voltageHzPhase: newValue } }); break;
            case "Peak Power (kW)":
                updateNodeUtilities(node.id, { ...utils, electrical: { ...(utils.electrical || {}), nominalPower: newValue } }); break;
            case "Compressed Air Pressure (bar)":
                updateNodeSpecification(node.id, { ...specs, "Compressed Air Pressure (bar)": newValue }); break;
            case "Compressed Air Consumption (Nm3/h)":
                updateNodeUtilities(node.id, { ...utils, air: { ...(utils.air || {}), consumption: newValue } }); break;
            case "Technical Gas Consumption (Nm3/h)":
                updateNodeUtilities(node.id, { ...utils, naturalGas: { ...(utils.naturalGas || {}), consumption: newValue } }); break;
            case "Technical Gas Pressure (bar)":
                updateNodeUtilities(node.id, { ...utils, naturalGas: { ...(utils.naturalGas || {}), pressure: newValue } }); break;
            case "Cold (20-30°C) Water Amount (L/min)":
                updateNodeUtilities(node.id, { ...utils, coolingWater: { ...(utils.coolingWater || {}), flow: newValue } }); break;
            case "Cold (20-30°C) Water Circulation Pressure (bar)":
                updateNodeUtilities(node.id, { ...utils, coolingWater: { ...(utils.coolingWater || {}), pressure: newValue } }); break;
            case "Domestic Water Amount (m3/h)":
                updateNodeUtilities(node.id, { ...utils, mainWater: { ...(utils.mainWater || {}), flow: newValue } }); break;
            case "Foundation Type":
                updateNodeSpecification(node.id, { ...specs, infraFoundationType: newValue }); break;
            case "Minimum Floor Thickness":
                updateNodeSpecification(node.id, { ...specs, infraFloorThickness: newValue }); break;
            case "Concrete Type":
                updateNodeSpecification(node.id, { ...specs, infraConcreteType: newValue }); break;
            case "Anchoring":
                updateNodeSpecification(node.id, { ...specs, infraAnchoring: newValue }); break;
            case "Noise Level (dB)":
                updateNodeSpecification(node.id, { ...specs, infraNoiseLevel: newValue }); break;
            case "Target OEE (%)":
                updateNodeSpecification(node.id, { ...specs, processTargetOEE: newValue }); break;
            case "Cycle time (Averaged between 2 compliant parts) (s)":
                updateNodeSpecification(node.id, { ...specs, processCycleTime: newValue }); break;
            case "Part Loading Method":
                updateNodeSpecification(node.id, { ...specs, processLoadingMethod: newValue }); break;
            case "Part Unloading Method":
                updateNodeSpecification(node.id, { ...specs, processUnloadingMethod: newValue }); break;
            default:
                updateNodeSpecification(node.id, { ...specs, [specName]: newValue }); break;
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
                    {machines.length} makine · {SPEC_GROUPS.reduce((a, g) => a + g.specs.length, 0)} satır
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
                                            <div className="machine-id">{(m.data as any).machineType || ''}</div>
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
                                                    const val = getSpecValue(m, spec);
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
