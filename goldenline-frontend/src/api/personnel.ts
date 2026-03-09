import { bridge } from './bridge';
import type {
  DailyStatusPayload,
  DailyStatusBulkPayload,
  DailyStatusQuery,
  DailyStatusRecord,
  DepartmentCapacityPoint,
  DepartmentLeaveBreakdown,
  MonthlyTrendPoint,
  PersonnelDetail,
  PersonnelListQuery,
  PersonnelReportOverview,
  PersonnelReportQuery,
  PersonnelSummary,
  PersonnelSummaryMetrics,
  PersonnelRequestPayload,
  ProjectAssignmentAggregate,
} from '../types/personnel';

export const fetchPersonnelList = async (query: PersonnelListQuery = {}) => {
  return bridge.getPersonnel(query as Record<string, unknown>);
};

export const fetchPersonnelDetail = async (personnelId: number) => {
  return bridge.getPersonnelDetail(personnelId);
};

export const createPersonnel = async (payload: PersonnelRequestPayload) => {
  return bridge.createPersonnel(payload as unknown as Record<string, unknown>);
};

export const bulkCreatePersonnel = async (payloads: PersonnelRequestPayload[]) => {
  return bridge.bulkCreatePersonnel(payloads as unknown as Record<string, unknown>[]);
};

export const updatePersonnel = async (personnelId: number, payload: PersonnelRequestPayload) => {
  await bridge.updatePersonnel(personnelId, payload as unknown as Record<string, unknown>);
};

export const deletePersonnel = async (personnelId: number) => {
  await bridge.deletePersonnel(personnelId);
};

export const fetchDailyStatuses = async (query: DailyStatusQuery = {}) => {
  return bridge.getDailyStatuses(query as Record<string, unknown>);
};

export const bulkUpsertDailyStatuses = async (payload: DailyStatusBulkPayload) => {
  return bridge.bulkUpsertDailyStatuses(payload as unknown as Record<string, unknown>);
};

export const createDailyStatus = async (payload: DailyStatusPayload) => {
  return bridge.createDailyStatus(payload as unknown as Record<string, unknown>);
};

export const updateDailyStatus = async (dailyStatusId: number, payload: DailyStatusPayload) => {
  await bridge.updateDailyStatus(dailyStatusId, payload as unknown as Record<string, unknown>);
};

export const deleteDailyStatus = async (dailyStatusId: number) => {
  await bridge.deleteDailyStatus(dailyStatusId);
};

export const fetchPersonnelReportOverview = async (query: PersonnelReportQuery = {}) => {
  return bridge.getPersonnelReportOverview(query as Record<string, unknown>);
};

export type {
  PersonnelSummary,
  PersonnelDetail,
  PersonnelSummaryMetrics,
  DailyStatusRecord,
  DepartmentLeaveBreakdown,
  ProjectAssignmentAggregate,
  MonthlyTrendPoint,
  DepartmentCapacityPoint,
};
