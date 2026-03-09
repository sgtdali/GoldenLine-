export type PersonnelStatusType =
  | 'Normal'
  | 'AnnualLeave'
  | 'ExcuseLeave'
  | 'SickLeave'
  | 'AdministrativeLeave'
  | 'Assignment';

export type PersonnelEmploymentStatus = 'Active' | 'Inactive' | string;

export interface PersonnelSummaryMetrics {
  annualLeaveDays: number;
  assignmentDays: number;
  sickLeaveDays: number;
  availableDays: number;
}

export interface PersonnelAssignmentPreview {
  projectName?: string | null;
  projectCode?: string | null;
  location?: string | null;
  date?: string | null;
}

export interface PersonnelSummary {
  personnelId: number;
  fullName: string;
  department?: string | null;
  role?: string | null;
  teamOrProject?: string | null;
  employmentStatus: PersonnelEmploymentStatus;
  primaryLocation?: string | null;
  currentProject?: string | null;
  skills?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  metrics?: PersonnelSummaryMetrics;
  latestAssignment?: PersonnelAssignmentPreview | null;
}

export interface PersonnelDetail extends PersonnelSummary {
  recentAssignments: PersonnelAssignmentPreview[];
}

export interface PersonnelRequestPayload {
  fullName: string;
  department?: string | null;
  role?: string | null;
  teamOrProject?: string | null;
  employmentStatus?: PersonnelEmploymentStatus;
  skills?: string | null;
  notes?: string | null;
  primaryLocation?: string | null;
  currentProject?: string | null;
}

export interface PersonnelCsvRecord {
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  employmentStatus: PersonnelEmploymentStatus;
}

export interface DailyStatusRecord {
  dailyStatusId: number;
  date: string;
  personnelId: number;
  personnelName?: string | null;
  department?: string | null;
  statusType: PersonnelStatusType;
  projectCode?: string | null;
  projectName?: string | null;
  location?: string | null;
  note?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

export interface DailyStatusBulkPayload {
  personnelIds: number[];
  startDate: string;
  endDate: string;
  statusType: PersonnelStatusType;
  projectCode?: string | null;
  projectName?: string | null;
  location?: string | null;
  note?: string | null;
  actor?: string | null;
}

export interface DailyStatusPayload {
  personnelId: number;
  date: string;
  statusType: PersonnelStatusType;
  projectCode?: string | null;
  projectName?: string | null;
  location?: string | null;
  note?: string | null;
  actor?: string | null;
}

export interface PersonnelReportOverview {
  rangeStart: string;
  rangeEnd: string;
  departmentLeave: DepartmentLeaveBreakdown[];
  projectAssignments: ProjectAssignmentAggregate[];
  monthlyTrends: MonthlyTrendPoint[];
  capacity: DepartmentCapacityPoint[];
}

export interface DepartmentLeaveBreakdown {
  department: string;
  annualLeaveDays: number;
  excuseLeaveDays: number;
  sickLeaveDays: number;
  administrativeLeaveDays: number;
  totalLeaveDays: number;
}

export interface ProjectAssignmentAggregate {
  projectCode?: string | null;
  projectName?: string | null;
  location?: string | null;
  assignmentDays: number;
}

export interface MonthlyTrendPoint {
  monthKey: string;
  monthStart: string;
  totalCapacityDays: number;
  annualLeaveDays: number;
  administrativeDays: number;
  sickLeaveDays: number;
  assignmentDays: number;
  availableDays: number;
}

export interface DepartmentCapacityPoint {
  department: string;
  headcount: number;
  occupiedDays: number;
  availableDays: number;
}

export interface PersonnelListQuery {
  department?: string;
  employmentStatus?: string;
  search?: string;
  includeMetrics?: boolean;
  metricsStartDate?: string;
  metricsEndDate?: string;
}

export interface DailyStatusQuery {
  startDate?: string;
  endDate?: string;
  department?: string;
  project?: string;
  location?: string;
  search?: string;
  personnelIds?: number[];
  statusTypes?: PersonnelStatusType[];
}

export interface PersonnelReportQuery {
  startDate?: string;
  endDate?: string;
}

export const PERSONNEL_STATUS_LABELS: Record<PersonnelStatusType, string> = {
  Normal: 'Normal',
  AnnualLeave: 'Yillik Izin',
  ExcuseLeave: 'Mazeret Izni',
  SickLeave: 'Hastalik',
  AdministrativeLeave: 'Idari Izin',
  Assignment: 'Gorevlendirme',
};

export const PERSONNEL_STATUS_COLORS: Record<PersonnelStatusType, string> = {
  Normal: '#E2E8F0',
  AnnualLeave: '#FACC15',
  ExcuseLeave: '#F97316',
  SickLeave: '#EF4444',
  AdministrativeLeave: '#6366F1',
  Assignment: '#94A3B8',
};

export const PERSONNEL_STATUS_OPTIONS: Array<{ value: PersonnelStatusType; label: string }> =
  (Object.keys(PERSONNEL_STATUS_LABELS) as PersonnelStatusType[]).map((value) => ({
    value,
    label: PERSONNEL_STATUS_LABELS[value],
  }));
