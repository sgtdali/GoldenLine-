import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  fetchDailyStatuses,
  fetchPersonnelDetail,
  fetchPersonnelList,
  fetchPersonnelReportOverview,
} from '../api/personnel';
import type {
  DailyStatusQuery,
  DailyStatusRecord,
  PersonnelDetail,
  PersonnelListQuery,
  PersonnelReportOverview,
  PersonnelReportQuery,
  PersonnelSummary,
} from '../types/personnel';

type AsyncState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export const usePersonnelList = (query: PersonnelListQuery): AsyncState<PersonnelSummary[]> => {
  const [state, setState] = useState<Omit<AsyncState<PersonnelSummary[]>, 'reload'>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const data = await fetchPersonnelList(query);
      setState({ data, isLoading: false, error: null });
    } catch (error: unknown) {
      console.error('Failed to load personnel list', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Personel listesi yuklenirken sorun olustu.',
      }));
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
};

export const usePersonnelDetail = (personnelId: number | null): AsyncState<PersonnelDetail | null> => {
  const [state, setState] = useState<Omit<AsyncState<PersonnelDetail | null>, 'reload'>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const load = useCallback(async () => {
    if (!personnelId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const data = await fetchPersonnelDetail(personnelId);
      setState({ data, isLoading: false, error: null });
    } catch (error: unknown) {
      console.error('Failed to load personnel detail', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Personel bilgisi yuklenemedi.',
      }));
    }
  }, [personnelId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
};

export const useDailyStatuses = (query: DailyStatusQuery | null): AsyncState<DailyStatusRecord[]> => {
  const [state, setState] = useState<Omit<AsyncState<DailyStatusRecord[]>, 'reload'>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const load = useCallback(async () => {
    if (!query) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const data = await fetchDailyStatuses(query);
      setState({ data, isLoading: false, error: null });
    } catch (error: unknown) {
      console.error('Failed to load daily statuses', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Gunluk durumlar getirilemedi.',
      }));
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
};

export const usePersonnelReports = (query: PersonnelReportQuery): AsyncState<PersonnelReportOverview> => {
  const [state, setState] = useState<Omit<AsyncState<PersonnelReportOverview>, 'reload'>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const data = await fetchPersonnelReportOverview(query);
      setState({ data, isLoading: false, error: null });
    } catch (error: unknown) {
      console.error('Failed to load personnel reports', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Raporlar yuklenemedi.',
      }));
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
};
