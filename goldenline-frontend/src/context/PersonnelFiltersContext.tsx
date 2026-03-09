import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';
import type { PersonnelStatusType } from '../types/personnel';

type PersonnelFilterState = {
  startDate: string;
  endDate: string;
  department?: string;
  project?: string;
  location?: string;
  search?: string;
  statusTypes: PersonnelStatusType[];
  selectedPersonnelIds: number[];
};

type PersonnelFilterAction =
  | { type: 'setDateRange'; payload: { startDate: string; endDate: string } }
  | { type: 'setDepartment'; payload?: string }
  | { type: 'setProject'; payload?: string }
  | { type: 'setLocation'; payload?: string }
  | { type: 'setSearch'; payload?: string }
  | { type: 'setStatusTypes'; payload: PersonnelStatusType[] }
  | { type: 'setSelectedPersonnel'; payload: number[] }
  | { type: 'resetFilters'; payload?: Partial<PersonnelFilterState> };

type PersonnelFilterContextValue = {
  filters: PersonnelFilterState;
  setDateRange: (startDate: string, endDate: string) => void;
  setDepartment: (department?: string) => void;
  setProject: (project?: string) => void;
  setLocation: (location?: string) => void;
  setSearch: (search?: string) => void;
  setStatusTypes: (statusTypes: PersonnelStatusType[]) => void;
  setSelectedPersonnel: (ids: number[]) => void;
  resetFilters: (overrides?: Partial<PersonnelFilterState>) => void;
};

const buildInitialState = (): PersonnelFilterState => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    department: undefined,
    project: undefined,
    location: undefined,
    search: undefined,
    statusTypes: [],
    selectedPersonnelIds: [],
  };
};

const PersonnelFilterContext = createContext<PersonnelFilterContextValue | undefined>(undefined);

const reducer = (state: PersonnelFilterState, action: PersonnelFilterAction): PersonnelFilterState => {
  switch (action.type) {
    case 'setDateRange':
      return { ...state, ...action.payload };
    case 'setDepartment':
      return { ...state, department: action.payload };
    case 'setProject':
      return { ...state, project: action.payload };
    case 'setLocation':
      return { ...state, location: action.payload };
    case 'setSearch':
      return { ...state, search: action.payload };
    case 'setStatusTypes':
      return { ...state, statusTypes: action.payload };
    case 'setSelectedPersonnel':
      return { ...state, selectedPersonnelIds: action.payload };
    case 'resetFilters':
      return { ...buildInitialState(), ...(action.payload ?? {}) };
    default:
      return state;
  }
};

export const PersonnelFilterProvider = ({ children }: { children: React.ReactNode }) => {
  const [filters, dispatch] = useReducer(reducer, undefined, buildInitialState);

  const setDateRange = useCallback((startDate: string, endDate: string) => {
    dispatch({ type: 'setDateRange', payload: { startDate, endDate } });
  }, []);

  const setDepartment = useCallback((department?: string) => {
    dispatch({ type: 'setDepartment', payload: department });
  }, []);

  const setProject = useCallback((project?: string) => {
    dispatch({ type: 'setProject', payload: project });
  }, []);

  const setLocation = useCallback((location?: string) => {
    dispatch({ type: 'setLocation', payload: location });
  }, []);

  const setSearch = useCallback((search?: string) => {
    dispatch({ type: 'setSearch', payload: search });
  }, []);

  const setStatusTypes = useCallback((statusTypes: PersonnelStatusType[]) => {
    dispatch({ type: 'setStatusTypes', payload: statusTypes });
  }, []);

  const setSelectedPersonnel = useCallback((ids: number[]) => {
    dispatch({ type: 'setSelectedPersonnel', payload: ids });
  }, []);

  const resetFilters = useCallback((overrides?: Partial<PersonnelFilterState>) => {
    dispatch({ type: 'resetFilters', payload: overrides });
  }, []);

  const value = useMemo(
    () => ({
      filters,
      setDateRange,
      setDepartment,
      setProject,
      setLocation,
      setSearch,
      setStatusTypes,
      setSelectedPersonnel,
      resetFilters,
    }),
    [
      filters,
      resetFilters,
      setDateRange,
      setDepartment,
      setLocation,
      setProject,
      setSearch,
      setSelectedPersonnel,
      setStatusTypes,
    ],
  );

  return (
    <PersonnelFilterContext.Provider value={value}>
      {children}
    </PersonnelFilterContext.Provider>
  );
};

export const usePersonnelFilters = () => {
  const ctx = useContext(PersonnelFilterContext);
  if (!ctx) {
    throw new Error('usePersonnelFilters must be used within PersonnelFilterProvider');
  }
  return ctx;
};
