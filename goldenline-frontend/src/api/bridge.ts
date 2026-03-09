import apiClient, { API_BASE_URL } from '../apiConfig';
import type { FlowDataPayload } from '../types/flow';

type BackendBridge = {
  LoginAsync: (requestJson: string) => Promise<string>;
  RegisterAsync: (requestJson: string) => Promise<string>;
  GetUsersAsync: () => Promise<string>;
  DeleteUserAsync: (id: number) => Promise<string>;
  UpdateUserRoleAsync: (id: number, requestJson: string) => Promise<string>;
  ResetUserPasswordAsync: (id: number, requestJson: string) => Promise<string>;
  GetAssignmentsAsync: (personnelId?: number | null, itemId?: number | null, activeOnly?: boolean) => Promise<string>;
  GetMovementsAsync: (itemId?: number | null, personnelId?: number | null, take?: number) => Promise<string>;
  GetLocationsAsync: () => Promise<string>;
  GetScrapLossReportAsync: (filtersJson: string) => Promise<string>;
  GetStockOverviewAsync: (locationId?: number | null, search?: string | null) => Promise<string>;
  GetCriticalStockAsync: (locationId?: number | null, search?: string | null) => Promise<string>;
  GetActiveAssignmentsAsync: (
    itemId?: number | null,
    personnelId?: number | null,
    aging?: string | null,
    assignedFromIso?: string | null,
    assignedToIso?: string | null,
  ) => Promise<string>;
  CreateInventoryCountSessionAsync: (requestJson: string) => Promise<string>;
  GetInventoryCountSessionsAsync: () => Promise<string>;
  GetInventoryCountSessionAsync: (sessionId: number) => Promise<string>;
  UpdateCountLineAsync: (sessionId: number, lineId: number, requestJson: string) => Promise<string>;
  FinalizeCountSessionAsync: (sessionId: number) => Promise<string>;
  DeleteCountSessionAsync: (sessionId: number) => Promise<string>;
  GetInventoryMovementReportAsync: (filtersJson: string) => Promise<string>;
  AssignToPersonnelAsync: (requestJson: string) => Promise<string>;
  ReturnFromPersonnelAsync: (requestJson: string) => Promise<string>;
  ScrapAsync: (requestJson: string) => Promise<string>;
  LostAsync: (requestJson: string) => Promise<string>;
  BackfillLocationStocksAsync: () => Promise<string>;
  GetEquipmentItemsAsync: () => Promise<string>;
  GetEquipmentItemAsync: (id: number) => Promise<string>;
  CreateEquipmentItemAsync: (requestJson: string) => Promise<string>;
  UpdateEquipmentItemAsync: (id: number, requestJson: string) => Promise<string>;
  DeleteEquipmentItemAsync: (id: number) => Promise<string>;
  ImportEquipmentCsvAsync: (csvContent: string) => Promise<string>;
  GetEquipmentImageAsync: (sku: string) => Promise<string>;
  GetLocationCatalogAsync: () => Promise<string>;
  CreateLocationAsync: (requestJson: string) => Promise<string>;
  UpdateLocationAsync: (id: number, requestJson: string) => Promise<string>;
  DeleteLocationAsync: (id: number) => Promise<string>;
  GetSuppliersAsync: (includeInactive: boolean) => Promise<string>;
  CreateSupplierAsync: (requestJson: string) => Promise<string>;
  UpdateSupplierAsync: (id: number, requestJson: string) => Promise<string>;
  DeleteSupplierAsync: (id: number) => Promise<string>;
  GetProjectsAsync: () => Promise<string>;
  GetProjectAsync: (id: number) => Promise<string>;
  CreateProjectAsync: (requestJson: string, actor?: string | null) => Promise<string>;
  DeleteProjectAsync: (id: number) => Promise<string>;
  GetShipmentsAsync: () => Promise<string>;
  CreateShipmentAsync: (requestJson: string) => Promise<string>;
  UpdateShipmentAsync: (id: number, requestJson: string) => Promise<string>;
  GetLogisticsStateAsync: () => Promise<string>;
  CreateLogisticsProductAsync: (requestJson: string) => Promise<string>;
  CreateLogisticsProductsAsync: (requestJson: string) => Promise<string>;
  UpdateLogisticsProductAsync: (id: string, requestJson: string) => Promise<string>;
  DeleteLogisticsProductAsync: (id: string) => Promise<string>;
  CreateLogisticsCrateAsync: (requestJson: string) => Promise<string>;
  UpdateLogisticsCrateAsync: (id: string, requestJson: string) => Promise<string>;
  DeleteLogisticsCrateAsync: (id: string) => Promise<string>;
  CreateLogisticsContainerAsync: (requestJson: string) => Promise<string>;
  DeleteLogisticsContainerAsync: (id: string) => Promise<string>;
  GetFlowAsync: (projectId: number, parentNodeId?: string | null) => Promise<string>;
  SaveFlowAsync: (projectId: number, flowDataJson: string, actor?: string | null) => Promise<string>;
  UploadNodeImageAsync: (requestJson: string) => Promise<string>;
  UploadShipmentCratePhotosAsync: (requestJson: string) => Promise<string>;
  DeleteShipmentCratePhotosAsync: (requestJson: string) => Promise<string>;
  GetShipmentCratePhotoAsync: (requestJson: string) => Promise<string>;
  GetPeopleCapacityAsync: (startDateIso?: string | null, endDateIso?: string | null) => Promise<string>;
  GetMachineReservationsAsync: (machineName?: string | null) => Promise<string>;
  CalculateScenarioAsync: (requestJson: string) => Promise<string>;
  GetPersonnelAsync: (queryJson: string) => Promise<string>;
  GetPersonnelDetailAsync: (id: number) => Promise<string>;
  CreatePersonnelAsync: (requestJson: string) => Promise<string>;
  BulkCreatePersonnelAsync: (requestJson: string) => Promise<string>;
  UpdatePersonnelAsync: (id: number, requestJson: string) => Promise<string>;
  DeletePersonnelAsync: (id: number) => Promise<string>;
  GetDailyStatusesAsync: (queryJson: string) => Promise<string>;
  BulkUpsertDailyStatusesAsync: (requestJson: string) => Promise<string>;
  CreateDailyStatusAsync: (requestJson: string) => Promise<string>;
  UpdateDailyStatusAsync: (id: number, requestJson: string) => Promise<string>;
  DeleteDailyStatusAsync: (id: number) => Promise<string>;
  GetPersonnelReportOverviewAsync: (queryJson: string) => Promise<string>;
  GetManagementOverviewAsync: () => Promise<string>;
  ExportMsProjectAsync: (projectId: number) => Promise<string>;
  ImportMsProjectAsync: (projectId: number, xmlContent: string) => Promise<string>;
};

const isDev = process.env.NODE_ENV === 'development';

const getBackend = (): BackendBridge | null =>
  (window as unknown as { chrome?: { webview?: { hostObjects?: { backend?: BackendBridge } } } })
    ?.chrome?.webview?.hostObjects?.backend ?? null;

export const isBridgeAvailable = () => Boolean(getBackend());

const parseJson = <T>(value: unknown): T => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return {} as T;
    }
    return JSON.parse(trimmed) as T;
  }
  return value as T;
};

const callBackend = async <T>(
  method: keyof BackendBridge,
  args: unknown[],
  fallback?: () => Promise<T>,
): Promise<T> => {
  const backend = getBackend();
  const target = backend?.[method] as ((...args: unknown[]) => Promise<string>) | undefined;
  if (backend && typeof target === 'function') {
    const result = await target(...args);
    return parseJson<T>(result);
  }

  if (fallback && isDev) {
    console.warn(`[bridge] Native backend unavailable for ${String(method)}. Using HTTP fallback.`);
    return fallback();
  }

  throw new Error('Native bridge is unavailable. Run inside the desktop app.');
};

type ShipmentCratePhoto = {
  fileName: string;
  base64Data: string;
  contentType: string;
};

type LogisticsProductPayload = {
  id: string;
  name: string;
  dimensions: { length: number; width: number; height: number };
  weight: number;
  color?: string;
  projectId: number;
  lineProjectId?: number | null;
};

export const bridge = {
  login: (payload: { kullaniciAdi: string; sifre: string }) =>
    callBackend('LoginAsync', [JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.post('/api/auth/login', payload);
      return response.data;
    }),

  register: (payload: { kullaniciAdi: string; sifre: string }) =>
    callBackend('RegisterAsync', [JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.post('/api/auth/register', payload);
      return response.data;
    }),

  getUsers: () =>
    callBackend('GetUsersAsync', [], async () => {
      const response = await apiClient.get('/api/auth/users');
      return response.data;
    }),

  deleteUser: (userId: number) =>
    callBackend('DeleteUserAsync', [userId], async () => {
      const response = await apiClient.delete(`/api/auth/users/${userId}`);
      return response.data;
    }),

  updateUserRole: (userId: number, payload: { rol: string }) =>
    callBackend('UpdateUserRoleAsync', [userId, JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.put(`/api/auth/users/${userId}/role`, payload);
      return response.data;
    }),

  resetUserPassword: (userId: number, payload: { yeniSifre: string }) =>
    callBackend('ResetUserPasswordAsync', [userId, JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.put(`/api/auth/users/${userId}/password`, payload);
      return response.data;
    }),

  getAssignments: (params: { personnelId?: number; itemId?: number; activeOnly?: boolean }) =>
    callBackend(
      'GetAssignmentsAsync',
      [params.personnelId ?? null, params.itemId ?? null, params.activeOnly ?? true],
      async () => {
        const response = await apiClient.get('/api/inventory/assignments', { params });
        return response.data;
      },
    ),

  getMovements: (params: { itemId?: number; personnelId?: number; take?: number }) =>
    callBackend(
      'GetMovementsAsync',
      [params.itemId ?? null, params.personnelId ?? null, params.take ?? 200],
      async () => {
        const response = await apiClient.get('/api/inventory/movements', { params });
        return response.data;
      },
    ),

  getLocations: () =>
    callBackend('GetLocationsAsync', [], async () => {
      const response = await apiClient.get('/api/inventory/locations');
      return response.data;
    }),

  getScrapLossReport: (filters: {
    startDate?: string;
    endDate?: string;
    movementType?: string;
    itemId?: number | string;
    personnelId?: number | string;
  }) =>
    callBackend(
      'GetScrapLossReportAsync',
      [JSON.stringify(filters ?? {})],
      async () => {
        const response = await apiClient.get('/api/inventory/scrap-loss', { params: filters });
        return response.data;
      },
    ),

  getStockOverview: (params: { locationId?: number; search?: string }) =>
    callBackend(
      'GetStockOverviewAsync',
      [params.locationId ?? null, params.search ?? null],
      async () => {
        const response = await apiClient.get('/api/inventory/reports/stock-overview', { params });
        return response.data;
      },
    ),

  getCriticalStock: (params: { locationId?: number; search?: string }) =>
    callBackend(
      'GetCriticalStockAsync',
      [params.locationId ?? null, params.search ?? null],
      async () => {
        const response = await apiClient.get('/api/inventory/reports/critical-stock', { params });
        return response.data;
      },
    ),

  getActiveAssignments: (params: {
    itemId?: number;
    personnelId?: number;
    aging?: string;
    assignedFrom?: string;
    assignedTo?: string;
  }) =>
    callBackend(
      'GetActiveAssignmentsAsync',
      [
        params.itemId ?? null,
        params.personnelId ?? null,
        params.aging ?? null,
        params.assignedFrom ?? null,
        params.assignedTo ?? null,
      ],
      async () => {
        const response = await apiClient.get('/api/inventory/reports/active-assignments', {
          params,
        });
        return response.data;
      },
    ),

  createInventoryCountSession: (request: { name: string; locationId?: number; createdBy?: string }) =>
    callBackend(
      'CreateInventoryCountSessionAsync',
      [JSON.stringify(request ?? {})],
      async () => {
        const response = await apiClient.post('/api/inventory/count-sessions', request);
        return response.data;
      },
    ),

  getInventoryCountSessions: () =>
    callBackend('GetInventoryCountSessionsAsync', [], async () => {
      const response = await apiClient.get('/api/inventory/count-sessions');
      return response.data;
    }),

  getInventoryCountSession: (sessionId: number) =>
    callBackend('GetInventoryCountSessionAsync', [sessionId], async () => {
      const response = await apiClient.get(`/api/inventory/count-sessions/${sessionId}`);
      return response.data;
    }),

  updateInventoryCountLine: (sessionId: number, lineId: number, request: { countedQuantity: number | null }) =>
    callBackend(
      'UpdateCountLineAsync',
      [sessionId, lineId, JSON.stringify(request ?? {})],
      async () => {
        const response = await apiClient.put(`/api/inventory/count-sessions/${sessionId}/lines/${lineId}`, request);
        return response.data;
      },
    ),

  finalizeInventoryCountSession: (sessionId: number) =>
    callBackend('FinalizeCountSessionAsync', [sessionId], async () => {
      const response = await apiClient.post(`/api/inventory/count-sessions/${sessionId}/finalize`);
      return response.data;
    }),

  deleteInventoryCountSession: (sessionId: number) =>
    callBackend('DeleteCountSessionAsync', [sessionId], async () => {
      const response = await apiClient.delete(`/api/inventory/count-sessions/${sessionId}`);
      return response.data;
    }),

  getMovementReport: (filters: {
    startDate?: string;
    endDate?: string;
    movementTypes?: string;
    itemId?: number;
    personnelId?: number;
  }) =>
    callBackend(
      'GetInventoryMovementReportAsync',
      [JSON.stringify(filters ?? {})],
      async () => {
        const response = await apiClient.get('/api/inventory/movements/report', { params: filters });
        return response.data;
      },
    ),

  assignToPersonnel: (request: {
    itemId: number;
    personnelId: number;
    quantity: number;
    note?: string;
    performedBy?: string;
    locationId?: number;
  }) =>
    callBackend(
      'AssignToPersonnelAsync',
      [JSON.stringify(request ?? {})],
      async () => {
        const response = await apiClient.post('/api/inventory/out', request);
        return response.data;
      },
    ),

  returnFromPersonnel: (request: {
    itemId: number;
    personnelId: number;
    quantity: number;
    note?: string;
    performedBy?: string;
    locationId?: number;
  }) =>
    callBackend(
      'ReturnFromPersonnelAsync',
      [JSON.stringify(request ?? {})],
      async () => {
        const response = await apiClient.post('/api/inventory/in', request);
        return response.data;
      },
    ),

  scrap: (request: {
    itemId: number;
    personnelId?: number;
    quantity: number;
    reason?: string;
    performedBy?: string;
    locationId?: number;
  }) =>
    callBackend(
      'ScrapAsync',
      [JSON.stringify(request ?? {})],
      async () => {
        const response = await apiClient.post('/api/inventory/scrap', request);
        return response.data;
      },
    ),

  lost: (request: {
    itemId: number;
    personnelId?: number;
    quantity: number;
    reason?: string;
    performedBy?: string;
    locationId?: number;
  }) =>
    callBackend(
      'LostAsync',
      [JSON.stringify(request ?? {})],
      async () => {
        const response = await apiClient.post('/api/inventory/lost', request);
        return response.data;
      },
    ),

  backfillLocationStocks: () =>
    callBackend('BackfillLocationStocksAsync', [], async () => {
      const response = await apiClient.post('/api/inventory/maintenance/backfill-location-stocks');
      return response.data;
    }),

  getEquipmentItems: () =>
    callBackend('GetEquipmentItemsAsync', [], async () => {
      const response = await apiClient.get('/api/equipmentitems');
      return response.data;
    }),

  getEquipmentItem: (id: number) =>
    callBackend('GetEquipmentItemAsync', [id], async () => {
      const response = await apiClient.get(`/api/equipmentitems/${id}`);
      return response.data;
    }),

  createEquipmentItem: (payload: Record<string, unknown>) =>
    callBackend('CreateEquipmentItemAsync', [JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.post('/api/equipmentitems', payload);
      return response.data;
    }),

  updateEquipmentItem: (id: number, payload: Record<string, unknown>) =>
    callBackend('UpdateEquipmentItemAsync', [id, JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.put(`/api/equipmentitems/${id}`, payload);
      return response.data;
    }),

  deleteEquipmentItem: (id: number) =>
    callBackend('DeleteEquipmentItemAsync', [id], async () => {
      const response = await apiClient.delete(`/api/equipmentitems/${id}`);
      return response.data;
    }),

  importEquipmentCsv: (csvContent: string) =>
    callBackend('ImportEquipmentCsvAsync', [csvContent ?? ''], async () => {
      const formData = new FormData();
      formData.append('file', new Blob([csvContent ?? ''], { type: 'text/csv' }), 'import.csv');
      const response = await apiClient.post('/api/equipmentitems/import-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }),

  getEquipmentImage: (sku: string) =>
    callBackend('GetEquipmentImageAsync', [sku ?? ''], async () => {
      const normalized = API_BASE_URL.replace(/\/+$/, '');
      return { dataUrl: `${normalized}/api/EquipmentImages/${encodeURIComponent(sku ?? '')}` };
    }),

  getLocationCatalog: () =>
    callBackend('GetLocationCatalogAsync', [], async () => {
      const response = await apiClient.get('/api/locations');
      return response.data;
    }),

  createLocation: (payload: { code: string; name?: string | null; description?: string | null }) =>
    callBackend('CreateLocationAsync', [JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.post('/api/locations', payload);
      return response.data;
    }),

  updateLocation: (id: number, payload: { code: string; name?: string | null; description?: string | null }) =>
    callBackend('UpdateLocationAsync', [id, JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.put(`/api/locations/${id}`, payload);
      return response.data;
    }),

  deleteLocation: (id: number) =>
    callBackend('DeleteLocationAsync', [id], async () => {
      const response = await apiClient.delete(`/api/locations/${id}`);
      return response.data;
    }),

  getSuppliers: (includeInactive = false) =>
    callBackend('GetSuppliersAsync', [includeInactive], async () => {
      const response = await apiClient.get('/api/suppliers', { params: { includeInactive } });
      return response.data;
    }),

  createSupplier: (payload: Record<string, unknown>) =>
    callBackend('CreateSupplierAsync', [JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.post('/api/suppliers', payload);
      return response.data;
    }),

  updateSupplier: (supplierId: number, payload: Record<string, unknown>) =>
    callBackend('UpdateSupplierAsync', [supplierId, JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.put(`/api/suppliers/${supplierId}`, payload);
      return response.data;
    }),

  deleteSupplier: (supplierId: number) =>
    callBackend('DeleteSupplierAsync', [supplierId], async () => {
      const response = await apiClient.delete(`/api/suppliers/${supplierId}`);
      return response.data;
    }),

  getProjects: () =>
    callBackend('GetProjectsAsync', [], async () => {
      const response = await apiClient.get('/api/projects');
      return response.data;
    }),

  createProject: (payload: { projeAdi: string; projectType?: string; parentProjectId?: number | null }, actor?: string) =>
    callBackend('CreateProjectAsync', [JSON.stringify(payload ?? {}), actor ?? null], async () => {
      const response = await apiClient.post('/api/projects', payload);
      return response.data;
    }),

  deleteProject: (projectId: number) =>
    callBackend('DeleteProjectAsync', [projectId], async () => {
      const response = await apiClient.delete(`/api/projects/${projectId}`);
      return response.data;
    }),

  getShipments: () =>
    callBackend('GetShipmentsAsync', [], async () => {
      const response = await apiClient.get('/api/shipments');
      return response.data;
    }),

  createShipment: (payload: {
    name: string;
    code?: string | null;
    destination: string;
    status: string;
    shipmentType: string;
    projectId: number;
  }) =>
    callBackend('CreateShipmentAsync', [JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.post('/api/shipments', payload);
      return response.data;
    }),

  updateShipment: (id: number, payload: Partial<{
    name: string;
    code: string | null;
    destination: string;
    status: string;
    shipmentType: string;
    projectId: number;
  }>) =>
    callBackend('UpdateShipmentAsync', [id, JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.put(`/api/shipments/${id}`, payload);
      return response.data;
    }),

  getLogisticsState: () =>
    callBackend('GetLogisticsStateAsync', [], async () => {
      const response = await apiClient.get('/api/logistics/state');
      return response.data;
    }),

  createLogisticsProduct: (payload: LogisticsProductPayload) =>
    callBackend('CreateLogisticsProductAsync', [JSON.stringify(payload ?? {})]),

  createLogisticsProducts: (payload: LogisticsProductPayload[]) =>
    callBackend('CreateLogisticsProductsAsync', [JSON.stringify(payload ?? [])]),

  updateLogisticsProduct: (id: string, payload: LogisticsProductPayload) =>
    callBackend('UpdateLogisticsProductAsync', [id, JSON.stringify(payload ?? {})]),

  deleteLogisticsProduct: (id: string) =>
    callBackend('DeleteLogisticsProductAsync', [id]),

  createLogisticsCrate: (payload: Record<string, unknown>) =>
    callBackend('CreateLogisticsCrateAsync', [JSON.stringify(payload ?? {})]),

  updateLogisticsCrate: (id: string, payload: Record<string, unknown>) =>
    callBackend('UpdateLogisticsCrateAsync', [id, JSON.stringify(payload ?? {})]),

  deleteLogisticsCrate: (id: string) =>
    callBackend('DeleteLogisticsCrateAsync', [id]),

  createLogisticsContainer: (payload: Record<string, unknown>) =>
    callBackend('CreateLogisticsContainerAsync', [JSON.stringify(payload ?? {})]),

  deleteLogisticsContainer: (id: string) =>
    callBackend('DeleteLogisticsContainerAsync', [id]),

  getFlow: (projectId: number, parentNodeId?: string | null) =>
    callBackend(
      'GetFlowAsync',
      [projectId, parentNodeId ?? null],
      async () => {
        const response = await apiClient.get(`/api/flow/${projectId}`, {
          params: parentNodeId ? { parentNodeId } : undefined,
        });
        return response.data;
      },
    ),

  saveFlow: (projectId: number, payload: FlowDataPayload, actor?: string) =>
    callBackend(
      'SaveFlowAsync',
      [projectId, JSON.stringify(payload ?? {}), actor ?? null],
      async () => {
        const response = await apiClient.post(`/api/flow/${projectId}`, payload);
        return response.data;
      },
    ),

  uploadNodeImage: (payload: { fileName: string; base64Data: string }) =>
    callBackend('UploadNodeImageAsync', [JSON.stringify(payload ?? {})], async () => {
      const formData = new FormData();
      const blob = await (await fetch(payload.base64Data)).blob();
      formData.append('file', blob, payload.fileName);
      const response = await apiClient.post('/api/media/node-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }),

  uploadShipmentCratePhotos: (payload: {
    projectName: string;
    crateName: string;
    files: Array<{ fileName: string; base64Data: string }>;
  }) =>
    callBackend('UploadShipmentCratePhotosAsync', [JSON.stringify(payload ?? {})]),

  deleteShipmentCratePhotos: (payload: { projectName: string; crateName: string }) =>
    callBackend('DeleteShipmentCratePhotosAsync', [JSON.stringify(payload ?? {})]),

  getShipmentCratePhoto: (payload: { projectName: string; crateName: string }) =>
    callBackend<ShipmentCratePhoto>(
      'GetShipmentCratePhotoAsync',
      [JSON.stringify(payload ?? {})],
    ),

  fetchPeopleCapacity: (startDate?: string, endDate?: string) =>
    callBackend(
      'GetPeopleCapacityAsync',
      [startDate ?? null, endDate ?? null],
      async () => {
        const response = await apiClient.get('/api/capacity/people', {
          params: { startDate, endDate },
        });
        return response.data;
      },
    ),

  fetchMachineReservations: (machineName?: string) =>
    callBackend(
      'GetMachineReservationsAsync',
      [machineName ?? null],
      async () => {
        const response = await apiClient.get('/api/capacity/machines', { params: { machineName } });
        return response.data;
      },
    ),

  calculateScenario: (payload: { projectName: string; shiftDays: number }) =>
    callBackend('CalculateScenarioAsync', [JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.post('/api/capacity/scenario', payload);
      return response.data;
    }),

  getPersonnel: (query: Record<string, unknown> = {}) =>
    callBackend('GetPersonnelAsync', [JSON.stringify(query ?? {})], async () => {
      const response = await apiClient.get(`/api/personnel`, { params: query });
      return response.data;
    }),

  getPersonnelDetail: (personnelId: number) =>
    callBackend('GetPersonnelDetailAsync', [personnelId], async () => {
      const response = await apiClient.get(`/api/personnel/${personnelId}`);
      return response.data;
    }),

  createPersonnel: (payload: Record<string, unknown>) =>
    callBackend('CreatePersonnelAsync', [JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.post('/api/personnel', payload);
      return response.data;
    }),

  bulkCreatePersonnel: (payloads: Record<string, unknown>[]) =>
    callBackend('BulkCreatePersonnelAsync', [JSON.stringify(payloads ?? [])], async () => {
      const response = await apiClient.post('/api/personnel/bulk', payloads);
      return response.data;
    }),

  updatePersonnel: (personnelId: number, payload: Record<string, unknown>) =>
    callBackend('UpdatePersonnelAsync', [personnelId, JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.put(`/api/personnel/${personnelId}`, payload);
      return response.data;
    }),

  deletePersonnel: (personnelId: number) =>
    callBackend('DeletePersonnelAsync', [personnelId], async () => {
      const response = await apiClient.delete(`/api/personnel/${personnelId}`);
      return response.data;
    }),

  getDailyStatuses: (query: Record<string, unknown> = {}) =>
    callBackend('GetDailyStatusesAsync', [JSON.stringify(query ?? {})], async () => {
      const response = await apiClient.get(`/api/personnel/statuses`, { params: query });
      return response.data;
    }),

  bulkUpsertDailyStatuses: (payload: Record<string, unknown>) =>
    callBackend('BulkUpsertDailyStatusesAsync', [JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.post('/api/personnel/statuses/bulk', payload);
      return response.data;
    }),

  createDailyStatus: (payload: Record<string, unknown>) =>
    callBackend('CreateDailyStatusAsync', [JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.post('/api/personnel/statuses', payload);
      return response.data;
    }),

  updateDailyStatus: (dailyStatusId: number, payload: Record<string, unknown>) =>
    callBackend('UpdateDailyStatusAsync', [dailyStatusId, JSON.stringify(payload ?? {})], async () => {
      const response = await apiClient.put(`/api/personnel/statuses/${dailyStatusId}`, payload);
      return response.data;
    }),

  deleteDailyStatus: (dailyStatusId: number) =>
    callBackend('DeleteDailyStatusAsync', [dailyStatusId], async () => {
      const response = await apiClient.delete(`/api/personnel/statuses/${dailyStatusId}`);
      return response.data;
    }),

  getPersonnelReportOverview: (query: Record<string, unknown> = {}) =>
    callBackend('GetPersonnelReportOverviewAsync', [JSON.stringify(query ?? {})], async () => {
      const response = await apiClient.get(`/api/personnel/reports/overview`, { params: query });
      return response.data;
    }),

  getManagementOverview: () =>
    callBackend('GetManagementOverviewAsync', [], async () => {
      const response = await apiClient.get('/api/reports/management');
      return response.data;
    }),

  exportMsProject: (projectId: number) =>
    callBackend('ExportMsProjectAsync', [projectId], async () => {
      const response = await apiClient.get(`/api/export/msproject/${projectId}`);
      return response.data;
    }),

  importMsProject: (projectId: number, xmlContent: string) =>
    callBackend('ImportMsProjectAsync', [projectId, xmlContent], async () => {
      const formData = new FormData();
      formData.append('file', new Blob([xmlContent], { type: 'application/xml' }), 'import.xml');
      const response = await apiClient.post(`/api/import/msproject/${projectId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }),
};
