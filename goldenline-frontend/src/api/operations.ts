import { bridge } from './bridge';

export type PersonCapacityDay = {
  date: string;
  projectName: string | null;
  load: number;
};

export type PersonCapacityRow = {
  personnelId: number;
  personName: string;
  department?: string | null;
  days: PersonCapacityDay[];
};

export type MachineReservation = {
  machineReservationId: number;
  machineName: string;
  projectName: string;
  location?: string | null;
  startDate: string;
  endDate: string;
};

export type ScenarioRequest = {
  projectName: string;
  shiftDays: number;
};

export type ScenarioResult = {
  projectName: string;
  shiftDays: number;
  impactedPeople: number;
  impactedMachines: number;
  overloadDays: number;
};

export type SummaryMetric = {
  label: string;
  value: string;
};

export type ProjectPeople = {
  project: string;
  people: number;
};

export type ProjectKpi = {
  projectName: string;
  peopleCount: number;
  machinesCount: number;
};

export type ManagementOverview = {
  metrics: SummaryMetric[];
  peoplePerProject: ProjectPeople[];
  topProjects: ProjectKpi[];
};

export const fetchPeopleCapacity = async (startDate?: string, endDate?: string) => {
  return bridge.fetchPeopleCapacity(startDate, endDate);
};

export const fetchMachineReservations = async (machineName?: string) => {
  return bridge.fetchMachineReservations(machineName);
};

export const calculateScenario = async (payload: ScenarioRequest) => {
  return bridge.calculateScenario(payload);
};

export const fetchManagementOverview = async () => {
  return bridge.getManagementOverview();
};
