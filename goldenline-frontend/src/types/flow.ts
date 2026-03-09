import type { Node, Edge } from '@xyflow/react';

// === FRONTEND TYPES (React Flow) ===

export type AppNodeData = {
  label: string;
  machineType?: string;
  completion?: number;
  department?: string;
  duration?: number | string;
  parentNodeId?: string | null;
  imagePath?: string | null;
  __isCritical?: boolean;
  groupDurationDays?: number;
  utilities?: {
    electrical?: { ups?: string; nominalPower?: string; voltageHzPhase?: string };
    air?: { consumption?: string; connectionType?: string; connectionSize?: string };
    naturalGas?: { consumption?: string; pressure?: string; connectionType?: string; connectionSize?: string };
    coolingWater?: { flow?: string; pressure?: string; circuitType?: string; inletTemp?: string; outletTemp?: string; connectionType?: string; connectionSize?: string };
    mainWater?: { flow?: string; connectionType?: string; connectionSize?: string };
  };
  specification?: {
    // Basic
    inletPartCode?: string;
    inletPartDescription?: string;
    exitPartCode?: string;
    exitPartDescription?: string;

    // Quality (Up to 5)
    quality?: Array<{ spec?: string; frequency?: string; method?: string }>;

    // Machine Details
    machineSubEquipments?: string;
    machineQuantity?: string;
    machineVoltage?: string;
    machineFrequency?: string;
    machineConnectedLoad?: string;
    machineDimensions?: string;
    machineTempRange?: string;
    machineHumidity?: string;
    machineCapacity1?: string;
    machineCapacity2?: string;
    machineOtherSpecs?: string;

    // Process
    processLoadingMethod?: string;
    processUnloadingMethod?: string;
    processParameters?: string;
    processCycleTime?: string;
    processTargetOEE?: string;
    processDieToolSpec?: string;
    processBestPractices?: string;

    // Consumables (Up to 4)
    consumables?: Array<{
      name?: string;
      unit?: string;
      firstFill?: string;
      consumption?: string;
      factors?: string;
      lifecycle?: string;
      storage?: string;
    }>;

    // Maintenance & Scrap
    maintenanceScrapHandling?: string;
    maintenanceScrapFrequency?: string;
    maintenanceScrapRecycling?: string;
    maintenanceSpareParts?: string;
    maintenanceCriticalSpares?: string;
    maintenanceDailyChecks?: string;
    maintenancePeriodic?: string;

    // Infrastructure & Environment
    infraManpower?: string;
    infraAirPressure?: string;
    infraAirConsumption?: string;
    infraGasType?: string;
    infraGasPressure?: string;
    infraGasConsumption?: string;
    infraWaterAmount?: string;
    infraWaterPressure?: string;
    infraDomesticWater?: string;
    infraFoundationType?: string;
    infraFloorThickness?: string;
    infraConcreteType?: string;
    infraAnchoring?: string;
    infraAdditionalFoundation?: string;
    infraNoiseLevel?: string;
    infraHealthSafety?: string;
    infraWasteType?: string;
    infraWasteTreatment?: string;
    infraVentilation?: string;
  };
};

export type AppNode = Node<AppNodeData, 'custom' | 'grup' | 'input' | 'output' | 'default'>;

export type AppEdge = Edge;

// === BACKEND TYPES (Veritabanı Modelleri) ===

export interface BackendNode {
  nodeID: string;
  projeID: number;
  tip: string;
  nodeAdi: string;
  x_Pozisyonu: number;
  y_Pozisyonu: number;
  parentNodeId: string | null;
  dataJson: string;
}

export interface BackendEdge {
  edgeID: string;
  projeID: number;
  kaynakNodeID: string;
  hedefNodeID: string;
  dataJson?: string | null;
}

export interface FlowDataResponse {
  nodes: BackendNode[];
  edges: BackendEdge[];
}

export interface FlowDataPayload {
  nodes: BackendNode[];
  edges: BackendEdge[];
}

// === TÜR DÖNÜŞÜM FONKSİYONLARI ===

const stripProjectPrefix = (value: string | null | undefined) =>
  value ? value.replace(/^\d+:/, '') : value;

const addProjectPrefix = (projectId: number, value: string | null | undefined) => {
  if (!value) return value ?? '';
  return value.startsWith(`${projectId}:`) ? value : `${projectId}:${value}`;
};

const normalizeLabel = (value: unknown) => {
  const raw = value === undefined || value === null ? '' : String(value);
  const MAX_LENGTH = 200;
  return raw.length > MAX_LENGTH ? raw.slice(0, MAX_LENGTH) : raw;
};

export const mapBackendNodeToFrontend = (beNode: BackendNode): AppNode => {
  let parsed: any = {};

  if (beNode.dataJson) {
    try {
      parsed = JSON.parse(beNode.dataJson);
    } catch (error) {
      console.warn(
        `Node ${beNode.nodeID} için DataJson parse edilemedi:`,
        beNode.dataJson,
        error
      );
      parsed = {};
    }
  }

  const parsedData =
    parsed && typeof parsed === 'object' && 'data' in parsed
      ? parsed.data ?? {}
      : parsed ?? {};

  const nodeData: AppNodeData = {
    ...(parsedData as AppNodeData),
    label: beNode.nodeAdi,
    parentNodeId: stripProjectPrefix(beNode.parentNodeId) ?? null,
  };

  const mappedNode: AppNode = {
    id: stripProjectPrefix(beNode.nodeID) ?? beNode.nodeID,
    type: beNode.tip || 'custom',
    position: {
      x: Number(beNode.x_Pozisyonu),
      y: Number(beNode.y_Pozisyonu),
    },
    data: nodeData,
  };

  const parentIdStripped = stripProjectPrefix(beNode.parentNodeId ?? undefined);
  (mappedNode as any).parentId = parentIdStripped ?? undefined;
  (mappedNode as any).parentNode = parentIdStripped ?? undefined;

  if (parsed && typeof parsed === 'object') {
    if (parsed.style) {
      const styleObject = parsed.style as Record<string, unknown>;
      mappedNode.style = { ...styleObject };
      const { width, height } = styleObject as { width?: number; height?: number };
      if (typeof width === 'number') {
        (mappedNode as any).width = width;
      }
      if (typeof height === 'number') {
        (mappedNode as any).height = height;
      }
    }
    if (parsed.className) {
      mappedNode.className = parsed.className;
    }
    if (parsed.draggable !== undefined) {
      mappedNode.draggable = parsed.draggable;
    }
    if (parsed.selectable !== undefined) {
      mappedNode.selectable = parsed.selectable;
    }
    if (parsed.extent) {
      (mappedNode as any).extent = parsed.extent;
    }
    if (parsed.hidden !== undefined) {
      (mappedNode as any).hidden = parsed.hidden;
    }
  }

  return mappedNode;
};

export const mapFrontendNodeToBackend = (feNode: AppNode, projeID: number): BackendNode => {
  const {
    label,
    parentNodeId: dataParentNodeId,
    imagePath,
    __isCritical: _isCriticalIgnored,
    ...restData
  } = feNode.data ?? {};
  const safeLabel = normalizeLabel(label);
  const parentNodeRaw =
    (feNode as any).parentId !== undefined
      ? (feNode as any).parentId
      : dataParentNodeId ?? null;
  const parentNodeId =
    parentNodeRaw !== null && parentNodeRaw !== undefined
      ? addProjectPrefix(projeID, String(parentNodeRaw))
      : null;

  const extras: Record<string, unknown> = {};
  const dataExtras: Record<string, unknown> = { ...restData };

  if (imagePath !== undefined) {
    dataExtras.imagePath = imagePath;
  }

  if (Object.keys(dataExtras).length > 0) {
    extras.data = dataExtras;
  }
  const styleExtras: Record<string, unknown> = feNode.style
    ? { ...feNode.style }
    : {};
  if (feNode.width !== undefined) {
    styleExtras.width = feNode.width;
  }
  if (feNode.height !== undefined) {
    styleExtras.height = feNode.height;
  }
  if (Object.keys(styleExtras).length > 0) {
    extras.style = styleExtras;
  }
  if (feNode.className) {
    extras.className = feNode.className;
  }
  if (feNode.draggable !== undefined) {
    extras.draggable = feNode.draggable;
  }
  if (feNode.selectable !== undefined) {
    extras.selectable = feNode.selectable;
  }
  if ((feNode as any).extent !== undefined) {
    extras.extent = (feNode as any).extent;
  }
  if ((feNode as any).hidden !== undefined) {
    extras.hidden = (feNode as any).hidden;
  }

  const dataJson =
    Object.keys(extras).length > 0 ? JSON.stringify(extras) : null;

  return {
    nodeID: addProjectPrefix(projeID, feNode.id),
    projeID,
    tip: feNode.type || 'custom',
    nodeAdi: safeLabel,
    x_Pozisyonu: feNode.position.x,
    y_Pozisyonu: feNode.position.y,
    parentNodeId,
    dataJson,
  };
};

export const mapBackendEdgeToFrontend = (beEdge: BackendEdge): AppEdge => {
  let extra: Partial<AppEdge> = {};
  if (beEdge.dataJson) {
    try {
      extra = JSON.parse(beEdge.dataJson);
    } catch (error) {
      console.warn(`Edge ${beEdge.edgeID} için DataJson parse edilemedi:`, beEdge.dataJson, error);
    }
  }

  const idWithoutPrefix = beEdge.edgeID.replace(/^\d+:/, '');

  return {
    id: idWithoutPrefix,
    source: stripProjectPrefix(beEdge.kaynakNodeID) ?? beEdge.kaynakNodeID,
    target: stripProjectPrefix(beEdge.hedefNodeID) ?? beEdge.hedefNodeID,
    ...extra,
  } as AppEdge;
};

export const mapFrontendEdgeToBackend = (feEdge: AppEdge, projeID: number): BackendEdge => {
  const extra: Record<string, unknown> = {};

  if (feEdge.type) extra.type = feEdge.type;
  if (feEdge.markerEnd) extra.markerEnd = feEdge.markerEnd;
  if (feEdge.markerStart) extra.markerStart = feEdge.markerStart;
  if (feEdge.style) extra.style = feEdge.style;
  if (feEdge.animated !== undefined) extra.animated = feEdge.animated;
  if (feEdge.label !== undefined) extra.label = feEdge.label;
  if (feEdge.data !== undefined) extra.data = feEdge.data;
  if (feEdge.sourceHandle !== undefined)
    extra.sourceHandle = feEdge.sourceHandle;
  if (feEdge.targetHandle !== undefined)
    extra.targetHandle = feEdge.targetHandle;
  if (feEdge.className) extra.className = feEdge.className;

  const serializedExtras = JSON.stringify(extra);
  const prefixedId = feEdge.id.startsWith(`${projeID}:`)
    ? feEdge.id
    : `${projeID}:${feEdge.id}`;
  const prefixedSource = feEdge.source
    ? addProjectPrefix(projeID, feEdge.source)
    : feEdge.source;
  const prefixedTarget = feEdge.target
    ? addProjectPrefix(projeID, feEdge.target)
    : feEdge.target;

  return {
    edgeID: prefixedId,
    projeID,
    kaynakNodeID: prefixedSource ?? '',
    hedefNodeID: prefixedTarget ?? '',
    dataJson: serializedExtras,
  };
};
