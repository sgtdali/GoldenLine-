import React, { useMemo, useState } from 'react';
import { Download, Filter, Layers, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

type ProjectStatus = 'Planned' | 'InProgress' | 'Paused' | 'Blocked' | 'Completed';
type BlockerCategory = 'Utility' | 'Material' | 'Vendor' | 'HSE' | 'Foundation/Layout' | 'Other';

type Project = {
  id: string;
  code: string;
  name: string;
  status: ProjectStatus;
  targetStart: string;
  engineer?: string;
};

type Machine = {
  id: string;
  code: string;
  name: string;
  projectId: string;
  cellArea: string;
  status: ProjectStatus;
  progressPct: number;
  plannedDays?: number;
  actualDays?: number;
  blockersCount?: number;
};

type Blocker = {
  id: string;
  projectId: string;
  machineId?: string;
  title: string;
  category: BlockerCategory;
  isActive: boolean;
  ageDays: number;
  owner?: string;
};

type UtilityReadiness = {
  machineId: string;
  electrical: 'Ready' | 'NotReady' | 'Unknown';
  air: 'Ready' | 'NotReady' | 'Unknown';
  water: 'Ready' | 'NotReady' | 'Unknown';
  gas: 'Ready' | 'NotReady' | 'Unknown';
  exhaust: 'Ready' | 'NotReady' | 'Unknown';
  drainage: 'Ready' | 'NotReady' | 'Unknown';
};

const PROJECTS: Project[] = [
  { id: 'HF905BC', code: 'HF905BC', name: 'Hat A Revizyon', status: 'InProgress', targetStart: '2024-02-01', engineer: 'A. Yılmaz' },
  { id: 'HF906BC', code: 'HF906BC', name: 'Kesim Hattı Genişleme', status: 'InProgress', targetStart: '2024-03-05', engineer: 'S. Demir' },
  { id: 'HF906', code: 'HF906', name: 'Kalıp Yenileme', status: 'Paused', targetStart: '2024-01-10', engineer: 'Z. Kaya' },
  { id: 'HF903', code: 'HF903', name: 'Yeni Kurulum', status: 'Blocked', targetStart: '2024-04-01', engineer: 'N. Gül' },
  { id: 'HF908', code: 'HF908', name: 'Paketleme Hattı', status: 'Planned', targetStart: '2024-02-20', engineer: 'M. Erdem' },
];

const MACHINES: Machine[] = [
  { id: 'M-1', code: 'SAW116', name: 'High-Speed Precision Saw', projectId: 'HF906BC', cellArea: 'Line A - Cutting', status: 'InProgress', progressPct: 45, plannedDays: 12, actualDays: 5, blockersCount: 1 },
  { id: 'M-2', code: 'SAW117', name: 'Precision Saw', projectId: 'HF905BC', cellArea: 'Line A - Cutting', status: 'InProgress', progressPct: 62, plannedDays: 10, actualDays: 6, blockersCount: 0 },
  { id: 'M-3', code: 'SAW118', name: 'Packaging Saw', projectId: 'HF908', cellArea: 'Line B - Packaging', status: 'Planned', progressPct: 0, plannedDays: 8, actualDays: 0, blockersCount: 0 },
  { id: 'M-4', code: 'SAW119', name: 'High-Speed Saw', projectId: 'HF906', cellArea: 'Line C - Finishing', status: 'Paused', progressPct: 38, plannedDays: 9, actualDays: 4, blockersCount: 2 },
  { id: 'M-5', code: 'SAW120', name: 'Assembly Saw', projectId: 'HF903', cellArea: 'Line D - Assembly', status: 'Blocked', progressPct: 12, plannedDays: 11, actualDays: 2, blockersCount: 3 },
  { id: 'M-6', code: 'MILL201', name: 'Mill Station', projectId: 'HF906BC', cellArea: 'Line A - Cutting', status: 'InProgress', progressPct: 73, plannedDays: 7, actualDays: 6, blockersCount: 0 },
];

const BLOCKERS: Blocker[] = [
  { id: 'B-1', projectId: 'HF906BC', machineId: 'M-1', title: 'Hava hattı bağlantısı', category: 'Utility', isActive: true, ageDays: 4, owner: 'İ. Aksoy' },
  { id: 'B-2', projectId: 'HF903', machineId: 'M-5', title: 'Zemin iyileştirme', category: 'Foundation/Layout', isActive: true, ageDays: 9, owner: 'E. Topal' },
  { id: 'B-3', projectId: 'HF906', machineId: 'M-4', title: 'Vendor destek bekleniyor', category: 'Vendor', isActive: true, ageDays: 6, owner: 'S. Demir' },
  { id: 'B-4', projectId: 'HF903', machineId: 'M-5', title: 'Malzeme gecikmesi', category: 'Material', isActive: true, ageDays: 11, owner: 'A. Yılmaz' },
  { id: 'B-5', projectId: 'HF906', machineId: 'M-4', title: 'HSE onayı bekleniyor', category: 'HSE', isActive: false, ageDays: 12, owner: 'H. Kuru' },
];

const UTILITIES: UtilityReadiness[] = [
  { machineId: 'M-1', electrical: 'Ready', air: 'NotReady', water: 'Ready', gas: 'Unknown', exhaust: 'Ready', drainage: 'Ready' },
  { machineId: 'M-2', electrical: 'Ready', air: 'Ready', water: 'Ready', gas: 'Unknown', exhaust: 'Ready', drainage: 'Ready' },
  { machineId: 'M-4', electrical: 'Ready', air: 'NotReady', water: 'Unknown', gas: 'Unknown', exhaust: 'NotReady', drainage: 'Ready' },
  { machineId: 'M-5', electrical: 'NotReady', air: 'NotReady', water: 'Unknown', gas: 'Unknown', exhaust: 'Unknown', drainage: 'NotReady' },
];

const STATUS_LABELS: Record<ProjectStatus, string> = {
  Planned: 'Planlandı',
  InProgress: 'Devam',
  Paused: 'Durduruldu',
  Blocked: 'Bloke',
  Completed: 'Tamamlandı',
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  Planned: '#94a3b8',
  InProgress: '#0f172a',
  Paused: '#f59e0b',
  Blocked: '#ef4444',
  Completed: '#22c55e',
};

const BLOCKER_COLORS: Record<BlockerCategory, string> = {
  Utility: '#f59e0b',
  Material: '#f97316',
  Vendor: '#0f172a',
  HSE: '#ef4444',
  'Foundation/Layout': '#64748b',
  Other: '#94a3b8',
};

const BLOCKER_LABELS: Record<BlockerCategory, string> = {
  Utility: 'Utility',
  Material: 'Malzeme',
  Vendor: 'Vendor',
  HSE: 'HSE',
  'Foundation/Layout': 'Temel / Layout',
  Other: 'Diğer',
};

const DashboardPage: React.FC = () => {
  const [projectFilter, setProjectFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('7');

  const filteredProjects = useMemo(() => {
    if (projectFilter === 'all') return PROJECTS;
    return PROJECTS.filter(project => project.id === projectFilter);
  }, [projectFilter]);

  const filteredMachines = useMemo(() => {
    return MACHINES.filter(machine => {
      const matchProject = projectFilter === 'all' || machine.projectId === projectFilter;
      const matchArea = areaFilter === 'all' || machine.cellArea === areaFilter;
      const matchStatus = statusFilter === 'all' || machine.status === statusFilter;
      return matchProject && matchArea && matchStatus;
    });
  }, [projectFilter, areaFilter, statusFilter]);

  const filteredBlockers = useMemo(() => {
    return BLOCKERS.filter(blocker => {
      const matchProject = projectFilter === 'all' || blocker.projectId === projectFilter;
      return matchProject;
    });
  }, [projectFilter]);

  const projectOptions = useMemo(() => PROJECTS.map(project => ({ id: project.id, code: project.code })), []);

  const areaOptions = useMemo(() => {
    const areas = new Set(MACHINES.map(machine => machine.cellArea));
    return Array.from(areas);
  }, []);

  const statusOptions: ProjectStatus[] = ['Planned', 'InProgress', 'Paused', 'Blocked', 'Completed'];

  const kpis = useMemo(() => {
    const totalProjects = filteredProjects.length;
    const activeProjects = filteredProjects.filter(p => p.status === 'InProgress' || p.status === 'Paused' || p.status === 'Blocked').length;

    const totalMachines = filteredMachines.length;
    const activeMachines = filteredMachines.filter(m => m.status === 'InProgress' || m.status === 'Paused' || m.status === 'Blocked').length;

    const plannedWeights = filteredMachines.filter(m => typeof m.plannedDays === 'number' && m.plannedDays > 0);
    const weightedProgress = plannedWeights.length > 0
      ? Math.round(
          plannedWeights.reduce((sum, machine) => sum + (machine.progressPct * (machine.plannedDays || 0)), 0) /
            plannedWeights.reduce((sum, machine) => sum + (machine.plannedDays || 0), 0)
        )
      : Math.round(filteredMachines.reduce((sum, machine) => sum + machine.progressPct, 0) / (totalMachines || 1));

    const blockedCount = filteredMachines.filter(machine => machine.status === 'Blocked' || (machine.blockersCount || 0) > 0).length;

    const hasEffort = filteredMachines.some(machine => typeof machine.plannedDays === 'number' || typeof machine.actualDays === 'number');
    const plannedEffort = filteredMachines.reduce((sum, machine) => sum + (machine.plannedDays || 0), 0);
    const actualEffort = filteredMachines.reduce((sum, machine) => sum + (machine.actualDays || 0), 0);

    return {
      totalProjects,
      activeProjects,
      totalMachines,
      activeMachines,
      weightedProgress,
      blockedCount,
      hasEffort,
      plannedEffort,
      actualEffort,
    };
  }, [filteredProjects, filteredMachines]);

  const projectStatusDistribution = useMemo(() => {
    return statusOptions.map(status => ({
      label: STATUS_LABELS[status],
      value: filteredProjects.filter(project => project.status === status).length,
      color: STATUS_COLORS[status],
    }));
  }, [filteredProjects]);

  const blockerDistribution = useMemo(() => {
    const categories: BlockerCategory[] = ['Utility', 'Material', 'Vendor', 'HSE', 'Foundation/Layout', 'Other'];
    return categories.map(category => ({
      label: BLOCKER_LABELS[category],
      value: filteredBlockers.filter(blocker => blocker.category === category && blocker.isActive).length,
      color: BLOCKER_COLORS[category],
    }));
  }, [filteredBlockers]);

  const progressBuckets = useMemo(() => {
    const buckets = [
      { label: '0-25', range: [0, 25], count: 0 },
      { label: '25-50', range: [25, 50], count: 0 },
      { label: '50-75', range: [50, 75], count: 0 },
      { label: '75-100', range: [75, 101], count: 0 },
    ];

    filteredMachines.forEach(machine => {
      const bucket = buckets.find(b => machine.progressPct >= b.range[0] && machine.progressPct < b.range[1]);
      if (bucket) bucket.count += 1;
    });

    return buckets;
  }, [filteredMachines]);

  const topBlockers = useMemo(() => {
    return filteredBlockers
      .filter(blocker => blocker.isActive)
      .sort((a, b) => b.ageDays - a.ageDays)
      .slice(0, 10);
  }, [filteredBlockers]);

  const focusList = useMemo(() => {
    return filteredMachines
      .filter(machine => machine.status === 'InProgress' || machine.status === 'Blocked')
      .sort((a, b) => a.progressPct - b.progressPct)
      .slice(0, 7);
  }, [filteredMachines]);

  const renderDonut = (items: { label: string; value: number; color: string }[]) => {
    const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
    let current = 0;
    const gradient = items
      .map(item => {
        const start = (current / total) * 100;
        current += item.value;
        const end = (current / total) * 100;
        return `${item.color} ${start}% ${end}%`;
      })
      .join(', ');

    return {
      background: `conic-gradient(${gradient})`,
      total,
    };
  };

  const projectDonut = renderDonut(projectStatusDistribution);
  const blockerDonut = renderDonut(blockerDistribution);
  const maxBucket = Math.max(...progressBuckets.map(bucket => bucket.count), 1);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Saha Operasyon Gösterge Paneli</h1>
            <p className="mt-1 text-sm text-slate-600">
              Proje, makine ve engel durumlarının anlık özeti.
            </p>
          </div>
          <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
            <Download size={16} /> Dışa Aktar
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4 items-end">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400">Proje</label>
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              <option value="all">Tüm Projeler</option>
              {projectOptions.map(project => (
                <option key={project.id} value={project.id}>{project.code}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400">Hücre / Alan</label>
            <select
              value={areaFilter}
              onChange={(event) => setAreaFilter(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              <option value="all">Tüm Alanlar</option>
              {areaOptions.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400">Durum</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              <option value="all">Tüm Durumlar</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{STATUS_LABELS[status]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400">Zaman Aralığı</label>
            <select
              value={timeRange}
              onChange={(event) => setTimeRange(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              <option value="7">Son 7 Gün</option>
              <option value="30">Son 30 Gün</option>
              <option value="custom">Özel</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <KpiCard
          title="Aktif Proje"
          value={`${kpis.activeProjects} / ${kpis.totalProjects}`}
          subtitle="Devam eden toplam proje"
          icon={<Layers className="size-4 text-slate-600" />}
        />
        <KpiCard
          title="Aktif Makine"
          value={`${kpis.activeMachines} / ${kpis.totalMachines}`}
          subtitle="Devam eden toplam makine"
          icon={<Activity className="size-4 text-slate-600" />}
        />
        <KpiCard
          title="Genel İlerleme"
          value={`${kpis.weightedProgress}%`}
          subtitle="Plan günü ağırlıklı"
          icon={<TrendingUp className="size-4 text-emerald-600" />}
        />
        <KpiCard
          title="Bloke"
          value={`${kpis.blockedCount}`}
          subtitle="Bloke makine sayısı"
          icon={<AlertTriangle className="size-4 text-amber-600" />}
        />
        {kpis.hasEffort && (
          <KpiCard
            title="Bu Hafta Efor"
            value={`${kpis.actualEffort} / ${kpis.plannedEffort} gün`}
            subtitle="Gerçekleşen / plan"
            icon={<Filter className="size-4 text-slate-600" />}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-4 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Proje Durum Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProjects.length === 0 ? (
              <EmptyState text="Proje verisi bulunamadı." />
            ) : (
              <div className="flex flex-col gap-4">
                <div className="mx-auto h-40 w-40 rounded-full" style={{ background: projectDonut.background }} />
                <Legend items={projectStatusDistribution} total={projectDonut.total} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Engel Kategorileri</CardTitle>
          </CardHeader>
          <CardContent>
            {blockerDistribution.every(item => item.value === 0) ? (
              <EmptyState text="Aktif engel bulunamadı." />
            ) : (
              <div className="flex flex-col gap-4">
                <div className="mx-auto h-40 w-40 rounded-full" style={{ background: blockerDonut.background }} />
                <Legend items={blockerDistribution} total={blockerDonut.total} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Makine İlerleme Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMachines.length === 0 ? (
              <EmptyState text="Makine verisi bulunamadı." />
            ) : (
              <div className="space-y-3">
                {progressBuckets.map(bucket => (
                  <div key={bucket.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>{bucket.label}%</span>
                      <span>{bucket.count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-slate-900"
                        style={{ width: `${(bucket.count / maxBucket) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Aktif Engeller (İlk 10)</CardTitle>
          </CardHeader>
          <CardContent>
            {topBlockers.length === 0 ? (
              <EmptyState text="Aktif engel bulunamadı." />
            ) : (
              <div className="space-y-3">
                {topBlockers.map(blocker => {
                  const project = PROJECTS.find(p => p.id === blocker.projectId);
                  const machine = MACHINES.find(m => m.id === blocker.machineId);
                  return (
                    <div key={blocker.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-slate-900">{blocker.title}</div>
                        <div className="text-xs text-slate-600">
                          {project?.code} {machine?.code ? `· ${machine.code}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-slate-200 text-slate-600">
                          {blocker.ageDays} gün
                        </Badge>
                        <Badge variant="secondary" className="border-slate-200 text-slate-600">
                          {blocker.owner || 'Atanmadı'}
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 text-slate-600">
                          {BLOCKER_LABELS[blocker.category]}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Önümüzdeki 7 Gün Odağı</CardTitle>
          </CardHeader>
          <CardContent>
            {focusList.length === 0 ? (
              <EmptyState text="Odaklanacak makine bulunamadı." />
            ) : (
              <div className="space-y-3">
                {focusList.map(machine => {
                  const project = PROJECTS.find(p => p.id === machine.projectId);
                  return (
                    <div key={machine.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {machine.code} - {machine.name}
                        </div>
                        <div className="text-xs text-slate-600">
                          {project?.code} · {machine.cellArea}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-slate-900">{machine.progressPct}%</div>
                        <div className="text-[10px] text-slate-500">{STATUS_LABELS[machine.status]}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Utility Hazırlık Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          {UTILITIES.length === 0 ? (
            <EmptyState text="Utility durumu bulunamadı." />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {UTILITIES.map(item => {
                const machine = MACHINES.find(m => m.id === item.machineId);
                if (!machine) return null;
                return (
                  <div key={item.machineId} className="rounded-lg border border-slate-200 px-3 py-2">
                    <div className="text-xs font-semibold text-slate-900">{machine.code}</div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] uppercase text-slate-600">
                      <UtilityPill label="Elektrik" value={item.electrical} />
                      <UtilityPill label="Hava" value={item.air} />
                      <UtilityPill label="Su" value={item.water} />
                      <UtilityPill label="Gaz" value={item.gas} />
                      <UtilityPill label="Egzoz" value={item.exhaust} />
                      <UtilityPill label="Drenaj" value={item.drainage} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const KpiCard = ({ title, value, subtitle, icon }: { title: string; value: string; subtitle: string; icon: React.ReactNode }) => (
  <Card className="border-slate-200 lg:col-span-3">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-700">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
    </CardContent>
  </Card>
);

const Legend = ({ items, total }: { items: { label: string; value: number; color: string }[]; total: number }) => (
  <div className="space-y-2">
    {items.map(item => (
      <div key={item.label} className="flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </div>
        <span className="text-slate-500">{item.value} ({Math.round((item.value / total) * 100)}%)</span>
      </div>
    ))}
  </div>
);

const UtilityPill = ({ label, value }: { label: string; value: UtilityReadiness['electrical'] }) => {
  const tone =
    value === 'Ready'
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : value === 'NotReady'
      ? 'bg-rose-100 text-rose-700 border-rose-200'
      : 'bg-slate-100 text-slate-500 border-slate-200';
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${tone}`}>
      {label}
    </span>
  );
};

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
    {text}
  </div>
);

export default DashboardPage;