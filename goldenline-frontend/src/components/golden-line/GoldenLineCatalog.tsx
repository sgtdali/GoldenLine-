import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Plus, Trash2, Search, Zap, Wind,
    ChevronLeft, Package, Pencil, LogOut
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Settings2, BarChart3, FlaskConical, Wrench, Building2, ClipboardList } from 'lucide-react';

interface MachineCatalogItem {
    id: string;
    name: string; // "Testere", "Torna" vb.
    vendor: string; // "Kasto", "Mazak" vb.
    model: string; // "X-200", "VTC-800" vb.
    description: string;
    category: string;
    utilities: {
        electrical: { ups: string; nominalPower: string; voltageHzPhase: string };
        air: { consumption: string; connectionType: string; connectionSize: string };
        naturalGas: { consumption: string; pressure: string; connectionType: string; connectionSize: string };
        coolingWater: { flow: string; pressure: string; circuitType: string; inletTemp: string; outletTemp: string; connectionType: string; connectionSize: string };
        mainWater: { flow: string; connectionType: string; connectionSize: string };
    };
    specification?: {
        inletPartCode?: string;
        inletPartDescription?: string;
        exitPartCode?: string;
        exitPartDescription?: string;
        quality?: Array<{ spec?: string; frequency?: string; method?: string }>;
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
        processLoadingMethod?: string;
        processUnloadingMethod?: string;
        processParameters?: string;
        processCycleTime?: string;
        processTargetOEE?: string;
        processDieToolSpec?: string;
        processBestPractices?: string;
        consumables?: Array<{
            name?: string;
            unit?: string;
            firstFill?: string;
            consumption?: string;
            factors?: string;
            lifecycle?: string;
            storage?: string;
        }>;
        maintenanceScrapHandling?: string;
        maintenanceScrapFrequency?: string;
        maintenanceScrapRecycling?: string;
        maintenanceSpareParts?: string;
        maintenanceCriticalSpares?: string;
        maintenanceDailyChecks?: string;
        maintenancePeriodic?: string;
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
}

interface ConsumableLibraryItem {
    id: string;
    category: string; // "Hidrolik Yağlar", "Gresler", "Soğutma Sıvıları" vb.
    name: string; // "VG 46", "EP 2" vb.
    unit: string; // "Litre", "Kg", "Adet"
}

const CATALOG_STORAGE_KEY = 'golden_line_machine_catalog_v2';
const CONSUMABLES_STORAGE_KEY = 'golden_line_consumables_library_v1';

interface GoldenLineCatalogProps {
    isEmbedded?: boolean;
    onItemDragStart?: (event: React.DragEvent, nodeType: string, label: string, catalogData: MachineCatalogItem) => void;
    onItemSelect?: (item: MachineCatalogItem) => void;
}

export default function GoldenLineCatalog({ isEmbedded, onItemDragStart, onItemSelect }: GoldenLineCatalogProps) {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [catalog, setCatalog] = useState<MachineCatalogItem[]>([]);
    const [consumableLibrary, setConsumableLibrary] = useState<ConsumableLibraryItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isConsumableDialogOpen, setIsConsumableDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingConsumableId, setEditingConsumableId] = useState<string | null>(null);
    const [activeCatalogTab, setActiveCatalogTab] = useState<'machines' | 'consumables'>('machines');

    const [newConsumable, setNewConsumable] = useState<Partial<ConsumableLibraryItem>>({
        category: '',
        name: '',
        unit: 'Litre'
    });

    const initialData: MachineCatalogItem[] = [
        {
            id: '1',
            name: 'CNC Torna Tezgahı',
            vendor: 'Mazak',
            model: 'QT-200 L',
            description: 'Yüksek hassasiyetli evrensel CNC torna.',
            category: 'İşleme',
            utilities: {
                electrical: { ups: 'Var', nominalPower: '15kW', voltageHzPhase: '380V/50Hz/3P' },
                air: { consumption: '100 lt/dk', connectionType: 'Pnömatik Jack', connectionSize: '1/2"' },
                naturalGas: { consumption: '-', pressure: '-', connectionType: '-', connectionSize: '-' },
                coolingWater: { flow: '10 lt/dk', pressure: '4 Bar', circuitType: 'Kapalı Devre', inletTemp: '20°C', outletTemp: '25°C', connectionType: 'Hortum Reakor', connectionSize: '3/4"' },
                mainWater: { flow: '-', connectionType: '-', connectionSize: '-' }
            }
        },
        {
            id: '2',
            name: 'CNC Torna Tezgahı',
            vendor: 'DMG Mori',
            model: 'NLX 2500',
            description: 'Yüksek rijitlikte torna merkezi.',
            category: 'İşleme',
            utilities: {
                electrical: { ups: 'Var', nominalPower: '18.5kW', voltageHzPhase: '400V/50Hz/3P' },
                air: { consumption: '120 lt/dk', connectionType: 'Pnömatik Jack', connectionSize: '1/2"' },
                naturalGas: { consumption: '-', pressure: '-', connectionType: '-', connectionSize: '-' },
                coolingWater: { flow: '12 lt/dk', pressure: '5 Bar', circuitType: 'Açık Devre', inletTemp: '18°C', outletTemp: '24°C', connectionType: 'Hortum Reakor', connectionSize: '3/4"' },
                mainWater: { flow: '-', connectionType: '-', connectionSize: '-' }
            }
        },
        {
            id: '3',
            name: 'Şerit Testere',
            vendor: 'Kasto',
            model: 'Kastowin A 4.6',
            description: 'Tam otomatik yüksek performanslı şerit testere.',
            category: 'Kesme',
            utilities: {
                electrical: { ups: 'Yok', nominalPower: '4kW', voltageHzPhase: '380V/50Hz/3P' },
                air: { consumption: '20 lt/dk', connectionType: 'Hızlı Kaplin', connectionSize: '1/4"' },
                naturalGas: { consumption: '-', pressure: '-', connectionType: '-', connectionSize: '-' },
                coolingWater: { flow: '5 lt/dk', pressure: '2 Bar', circuitType: '-', inletTemp: '-', outletTemp: '-', connectionType: '-', connectionSize: '-' },
                mainWater: { flow: '-', connectionType: '-', connectionSize: '-' }
            }
        }
    ];

    const emptyItem: Partial<MachineCatalogItem> = {
        name: '',
        vendor: '',
        model: '',
        description: '',
        category: 'Genel',
        utilities: {
            electrical: { ups: '', nominalPower: '', voltageHzPhase: '' },
            air: { consumption: '', connectionType: '', connectionSize: '' },
            naturalGas: { consumption: '', pressure: '', connectionType: '', connectionSize: '' },
            coolingWater: { flow: '', pressure: '', circuitType: '', inletTemp: '', outletTemp: '', connectionType: '', connectionSize: '' },
            mainWater: { flow: '', connectionType: '', connectionSize: '' }
        },
        specification: {
            inletPartCode: '', inletPartDescription: '', exitPartCode: '', exitPartDescription: '',
            quality: Array(3).fill({ spec: '', frequency: '', method: '' }),
            machineSubEquipments: '', machineQuantity: '', machineVoltage: '', machineFrequency: '',
            machineConnectedLoad: '', machineDimensions: '', machineTempRange: '', machineHumidity: '',
            machineCapacity1: '', machineCapacity2: '', machineOtherSpecs: '',
            processLoadingMethod: '', processUnloadingMethod: '', processParameters: '',
            processCycleTime: '', processTargetOEE: '', processDieToolSpec: '', processBestPractices: '',
            consumables: [],
            maintenanceScrapHandling: '', maintenanceScrapFrequency: '', maintenanceScrapRecycling: '',
            maintenanceSpareParts: '', maintenanceCriticalSpares: '', maintenanceDailyChecks: '', maintenancePeriodic: '',
            infraManpower: '', infraAirPressure: '', infraAirConsumption: '', infraGasType: '', infraGasPressure: '',
            infraGasConsumption: '', infraWaterAmount: '', infraWaterPressure: '', infraDomesticWater: '',
            infraFoundationType: '', infraFloorThickness: '', infraConcreteType: '', infraAnchoring: '',
            infraAdditionalFoundation: '', infraNoiseLevel: '', infraHealthSafety: '', infraWasteType: '',
            infraWasteTreatment: '', infraVentilation: ''
        }
    };

    useEffect(() => {
        const savedCatalog = localStorage.getItem(CATALOG_STORAGE_KEY);
        if (savedCatalog) {
            setCatalog(JSON.parse(savedCatalog));
        } else {
            setCatalog(initialData);
        }

        const savedConsumables = localStorage.getItem(CONSUMABLES_STORAGE_KEY);
        const defaultConsumables: ConsumableLibraryItem[] = [
            { id: 'c1', category: 'Hidrolik Yağlar', name: 'Shell Tellus S2 V 46', unit: 'Litre' },
            { id: 'c2', category: 'Hidrolik Yağlar', name: 'Mobil DTE 25', unit: 'Litre' },
            { id: 'c3', category: 'Gresler', name: 'Skf LGMT 3', unit: 'Kg' },
            { id: 'c4', category: 'Soğutma Sıvıları', name: 'Blaser B-Cool 655', unit: 'Litre' },
        ];

        if (savedConsumables) {
            setConsumableLibrary(JSON.parse(savedConsumables));
        } else {
            setConsumableLibrary(defaultConsumables);
            localStorage.setItem(CONSUMABLES_STORAGE_KEY, JSON.stringify(defaultConsumables));
        }
    }, [initialData]);

    useEffect(() => {
        localStorage.setItem(CONSUMABLES_STORAGE_KEY, JSON.stringify(consumableLibrary));
    }, [consumableLibrary]);

    const [newItem, setNewItem] = useState<Partial<MachineCatalogItem>>({
        name: '',
        vendor: '',
        model: '',
        description: '',
        category: 'Genel',
        utilities: {
            electrical: { ups: '', nominalPower: '', voltageHzPhase: '' },
            air: { consumption: '', connectionType: '', connectionSize: '' },
            naturalGas: { consumption: '', pressure: '', connectionType: '', connectionSize: '' },
            coolingWater: { flow: '', pressure: '', circuitType: '', inletTemp: '', outletTemp: '', connectionType: '', connectionSize: '' },
            mainWater: { flow: '', connectionType: '', connectionSize: '' }
        },
        specification: {
            inletPartCode: '', inletPartDescription: '', exitPartCode: '', exitPartDescription: '',
            quality: Array(3).fill({ spec: '', frequency: '', method: '' }),
            machineSubEquipments: '', machineQuantity: '', machineVoltage: '', machineFrequency: '',
            machineConnectedLoad: '', machineDimensions: '', machineTempRange: '', machineHumidity: '',
            machineCapacity1: '', machineCapacity2: '', machineOtherSpecs: '',
            processLoadingMethod: '', processUnloadingMethod: '', processParameters: '',
            processCycleTime: '', processTargetOEE: '', processDieToolSpec: '', processBestPractices: '',
            consumables: Array(2).fill({ name: '', firstFill: '', consumption: '', factors: '', lifecycle: '', storage: '' }),
            maintenanceScrapHandling: '', maintenanceScrapFrequency: '', maintenanceScrapRecycling: '',
            maintenanceSpareParts: '', maintenanceCriticalSpares: '', maintenanceDailyChecks: '', maintenancePeriodic: '',
            infraManpower: '', infraAirPressure: '', infraAirConsumption: '', infraGasType: '', infraGasPressure: '',
            infraGasConsumption: '', infraWaterAmount: '', infraWaterPressure: '', infraDomesticWater: '',
            infraFoundationType: '', infraFloorThickness: '', infraConcreteType: '', infraAnchoring: '',
            infraAdditionalFoundation: '', infraNoiseLevel: '', infraHealthSafety: '', infraWasteType: '',
            infraWasteTreatment: '', infraVentilation: ''
        }
    });

    const resetForm = () => {
        setNewItem(emptyItem);
        setEditingId(null);
        setNewConsumable({
            category: '',
            name: '',
            unit: 'Litre'
        });
        setEditingConsumableId(null);
    };

    const handleSaveConsumable = () => {
        if (!newConsumable.name || !newConsumable.category) {
            toast.error("Lütfen tüm alanları doldurun");
            return;
        }

        if (editingConsumableId) {
            setConsumableLibrary(prev => prev.map(c =>
                c.id === editingConsumableId ? { ...c, ...newConsumable } as ConsumableLibraryItem : c
            ));
            toast.success("Sarf malzemesi güncellendi");
        } else {
            const item: ConsumableLibraryItem = {
                id: crypto.randomUUID(),
                category: newConsumable.category!,
                name: newConsumable.name!,
                unit: newConsumable.unit || 'Litre'
            };
            setConsumableLibrary(prev => [...prev, item]);
            toast.success("Yeni sarf malzemesi eklendi");
        }
        setIsConsumableDialogOpen(false);
        resetForm();
    };

    const startEditConsumable = (item: ConsumableLibraryItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setNewConsumable(item);
        setEditingConsumableId(item.id);
        setIsConsumableDialogOpen(true);
    };

    const deleteConsumable = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Bu sarf malzemesini kütüphaneden silmek istediğinize emin misiniz?')) {
            setConsumableLibrary(prev => prev.filter(c => c.id !== id));
            toast.success("Sarf malzemesi silindi");
        }
    };

    const handleSave = () => {
        if (!newItem.name || !newItem.vendor || !newItem.model) {
            toast.error('İsim, Tedarikçi ve Model alanları zorunludur.');
            return;
        }

        let updatedCatalog: MachineCatalogItem[];

        if (editingId) {
            updatedCatalog = catalog.map(item =>
                item.id === editingId ? { ...newItem, id: editingId } as MachineCatalogItem : item
            );
            toast.success('Makine varyantı güncellendi.');
        } else {
            const itemToAdd = { ...newItem, id: crypto.randomUUID() } as MachineCatalogItem;
            updatedCatalog = [...catalog, itemToAdd];
            toast.success('Makine varyantı kataloğa eklendi.');
        }

        setCatalog(updatedCatalog);
        localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(updatedCatalog));
        setIsAddDialogOpen(false);
        resetForm();
    };

    const startEdit = (item: MachineCatalogItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setNewItem(item);
        setEditingId(item.id);
        setIsAddDialogOpen(true);
    };

    const deleteVariant = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Bu varyantı katalogdan silmek istediğinize emin misiniz?')) {
            const updated = catalog.filter(i => i.id !== id);
            setCatalog(updated);
            localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(updated));
            toast.success('Varyant silindi.');
        }
    };

    const sortedCatalog = useMemo(() => {
        return [...catalog]
            .filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.category.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [catalog, searchTerm]);
    return (
        <div className={`min-h-screen ${isEmbedded ? 'bg-transparent overflow-y-auto' : 'bg-[#f8fafc]'}`}>
            {/* Header Section - Hide if embedded */}
            {!isEmbedded && (
                <div className="bg-white border-b px-8 py-6 sticky top-0 z-10 shadow-sm">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate('/golden-line')}
                                className="rounded-full hover:bg-slate-100"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <Package className="w-6 h-6 text-yellow-500" />
                                    Varlık & Sarf Kataloğu
                                </h1>
                                <div className="flex gap-4 mt-1">
                                    <button
                                        onClick={() => setActiveCatalogTab('machines')}
                                        className={`text-sm font-bold transition-colors ${activeCatalogTab === 'machines' ? 'text-yellow-600 border-b-2 border-yellow-500' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Makine Modelleri
                                    </button>
                                    <button
                                        onClick={() => setActiveCatalogTab('consumables')}
                                        className={`text-sm font-bold transition-colors ${activeCatalogTab === 'consumables' ? 'text-yellow-600 border-b-2 border-yellow-500' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Sarf Malzeme Kütüphanesi
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Makine, marka veya model ara..."
                                    className="pl-10 w-80 h-10 border-slate-200 focus:ring-yellow-500/20 focus:border-yellow-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Dialog open={activeCatalogTab === 'machines' ? isAddDialogOpen : isConsumableDialogOpen} onOpenChange={(open) => {
                                if (!open) resetForm();
                                if (activeCatalogTab === 'machines') setIsAddDialogOpen(open);
                                else setIsConsumableDialogOpen(open);
                            }}>
                                <DialogTrigger asChild>
                                    <Button
                                        className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/20"
                                        onClick={() => {
                                            resetForm();
                                            if (activeCatalogTab === 'machines') setIsAddDialogOpen(true);
                                            else setIsConsumableDialogOpen(true);
                                        }}
                                    >
                                        <Plus className="w-4 h-4" />
                                        {activeCatalogTab === 'machines' ? 'Yeni Model Ekle' : 'Yeni Sarf Ekle'}
                                    </Button>
                                </DialogTrigger>

                                {activeCatalogTab === 'consumables' && (
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>{editingConsumableId ? 'Sarf Malzemesini Düzenle' : 'Yeni Sarf Malzemesi Ekle'}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Kategori</Label>
                                                <select
                                                    className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                                    value={newConsumable.category}
                                                    onChange={e => setNewConsumable({ ...newConsumable, category: e.target.value })}
                                                >
                                                    <option value="">Kategori Seçin...</option>
                                                    <option value="Hidrolik Yağlar">Hidrolik Yağlar</option>
                                                    <option value="Gresler">Gresler</option>
                                                    <option value="Soğutma Sıvıları">Soğutma Sıvıları</option>
                                                    <option value="Kesme Takımları">Kesme Takımları</option>
                                                    <option value="Filtreler">Filtreler</option>
                                                    <option value="Diğer">Diğer</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Sarf Adı / Tip</Label>
                                                <Input placeholder="Örn: VG 46 veya Shell Tellus" value={newConsumable.name} onChange={e => setNewConsumable({ ...newConsumable, name: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Birim</Label>
                                                <select
                                                    className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                                    value={newConsumable.unit}
                                                    onChange={e => setNewConsumable({ ...newConsumable, unit: e.target.value })}
                                                >
                                                    <option value="Litre">Litre</option>
                                                    <option value="Kg">Kg</option>
                                                    <option value="Adet">Adet</option>
                                                    <option value="Metre">Metre</option>
                                                </select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsConsumableDialogOpen(false)}>İptal</Button>
                                            <Button onClick={handleSaveConsumable} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold">
                                                {editingConsumableId ? 'Güncelle' : 'Kütüphaneye Ekle'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                )}

                                {activeCatalogTab === 'machines' && (
                                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>
                                                {editingId ? 'Makine Varyantını Düzenle' : 'Kataloğa Yeni Makine Varyantı Ekle'}
                                            </DialogTitle>
                                        </DialogHeader>

                                        <Tabs defaultValue="basic" className="w-full">
                                            <TabsList className="grid w-full grid-cols-4 mb-4">
                                                <TabsTrigger value="basic">Genel & Kalite</TabsTrigger>
                                                <TabsTrigger value="machine">Makine & Süreç</TabsTrigger>
                                                <TabsTrigger value="utilities">Utility & Altyapı</TabsTrigger>
                                                <TabsTrigger value="others">Sarf & Bakım</TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="basic" className="space-y-4">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>İsim (Fonksiyon)</Label>
                                                        <Input placeholder="Örn: Testere" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Tedarikçi (Marka)</Label>
                                                        <Input placeholder="Örn: Kasto" value={newItem.vendor} onChange={e => setNewItem({ ...newItem, vendor: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Model No</Label>
                                                        <Input placeholder="Örn: X-200" value={newItem.model} onChange={e => setNewItem({ ...newItem, model: e.target.value })} />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                                    <div className="space-y-2">
                                                        <Label>Inlet Part Code / Desc</Label>
                                                        <div className="flex gap-2">
                                                            <Input placeholder="Code" value={newItem.specification?.inletPartCode} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, inletPartCode: e.target.value } })} />
                                                            <Input placeholder="Desc" value={newItem.specification?.inletPartDescription} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, inletPartDescription: e.target.value } })} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Exit Part Code / Desc</Label>
                                                        <div className="flex gap-2">
                                                            <Input placeholder="Code" value={newItem.specification?.exitPartCode} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, exitPartCode: e.target.value } })} />
                                                            <Input placeholder="Desc" value={newItem.specification?.exitPartDescription} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, exitPartDescription: e.target.value } })} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 border-t pt-4">
                                                    <Label className="text-yellow-600 font-bold flex items-center gap-2">
                                                        <BarChart3 className="w-4 h-4" /> Kalite Kontrol Parametreleri
                                                    </Label>
                                                    <div className="grid grid-cols-1 gap-2 bg-slate-50 p-3 rounded-lg border">
                                                        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                                            <span>Spesifikasyon</span>
                                                            <span>Frekans</span>
                                                            <span>Metot</span>
                                                        </div>
                                                        {[0, 1, 2].map(idx => (
                                                            <div key={idx} className="grid grid-cols-3 gap-2">
                                                                <Input className="h-8 text-sm" placeholder="Örn: Uzunluk" value={newItem.specification?.quality?.[idx]?.spec} onChange={e => {
                                                                    const q = [...(newItem.specification?.quality || [])];
                                                                    q[idx] = { ...q[idx], spec: e.target.value };
                                                                    setNewItem({ ...newItem, specification: { ...newItem.specification!, quality: q } });
                                                                }} />
                                                                <Input className="h-8 text-sm" placeholder="Örn: 1/10" value={newItem.specification?.quality?.[idx]?.frequency} onChange={e => {
                                                                    const q = [...(newItem.specification?.quality || [])];
                                                                    q[idx] = { ...q[idx], frequency: e.target.value };
                                                                    setNewItem({ ...newItem, specification: { ...newItem.specification!, quality: q } });
                                                                }} />
                                                                <Input className="h-8 text-sm" placeholder="Örn: Kumpas" value={newItem.specification?.quality?.[idx]?.method} onChange={e => {
                                                                    const q = [...(newItem.specification?.quality || [])];
                                                                    q[idx] = { ...q[idx], method: e.target.value };
                                                                    setNewItem({ ...newItem, specification: { ...newItem.specification!, quality: q } });
                                                                }} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="machine" className="space-y-4">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Alt Donanımlar</Label>
                                                        <Input placeholder="Örn: Konveyör" value={newItem.specification?.machineSubEquipments} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, machineSubEquipments: e.target.value } })} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Adet</Label>
                                                        <Input type="number" value={newItem.specification?.machineQuantity} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, machineQuantity: e.target.value } })} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Ölçüler (UxGxY)</Label>
                                                        <Input placeholder="2000x1200x1800" value={newItem.specification?.machineDimensions} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, machineDimensions: e.target.value } })} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                                    <div className="space-y-3">
                                                        <Label className="text-blue-600 font-bold flex items-center gap-2"><Settings2 className="w-4 h-4" /> Makine Detay</Label>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            <Input placeholder="Voltaj (V)" value={newItem.specification?.machineVoltage} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, machineVoltage: e.target.value } })} />
                                                            <Input placeholder="Bağlı Yük (kW)" value={newItem.specification?.machineConnectedLoad} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, machineConnectedLoad: e.target.value } })} />
                                                            <Input placeholder="Kapasite 1" value={newItem.specification?.machineCapacity1} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, machineCapacity1: e.target.value } })} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <Label className="text-green-600 font-bold flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Süreç Detay</Label>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            <Input placeholder="Yükleme Metodu" value={newItem.specification?.processLoadingMethod} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, processLoadingMethod: e.target.value } })} />
                                                            <Input placeholder="Cycle Time" value={newItem.specification?.processCycleTime} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, processCycleTime: e.target.value } })} />
                                                            <Input placeholder="Hedef OEE" value={newItem.specification?.processTargetOEE} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, processTargetOEE: e.target.value } })} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="utilities" className="space-y-4">
                                                <Accordion type="multiple" className="w-full">
                                                    <AccordionItem value="electrical">
                                                        <AccordionTrigger className="text-xs font-bold py-2">ELEKTRİK & HAVA</AccordionTrigger>
                                                        <AccordionContent className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px]">Elektrik (V/Hz/P)</Label>
                                                                <Input className="h-8" value={newItem.utilities?.electrical.voltageHzPhase} onChange={e => setNewItem({ ...newItem, utilities: { ...newItem.utilities!, electrical: { ...newItem.utilities!.electrical, voltageHzPhase: e.target.value } } })} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px]">Hava Tüketimi</Label>
                                                                <Input className="h-8" value={newItem.utilities?.air.consumption} onChange={e => setNewItem({ ...newItem, utilities: { ...newItem.utilities!, air: { ...newItem.utilities!.air, consumption: e.target.value } } })} />
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                    <AccordionItem value="water">
                                                        <AccordionTrigger className="text-xs font-bold py-2">SU & GAZ</AccordionTrigger>
                                                        <AccordionContent className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px]">Soğutma Suyu Debi</Label>
                                                                <Input className="h-8" value={newItem.utilities?.coolingWater.flow} onChange={e => setNewItem({ ...newItem, utilities: { ...newItem.utilities!, coolingWater: { ...newItem.utilities!.coolingWater, flow: e.target.value } } })} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px]">Doğalgaz Basınç</Label>
                                                                <Input className="h-8" value={newItem.utilities?.naturalGas.pressure} onChange={e => setNewItem({ ...newItem, utilities: { ...newItem.utilities!, naturalGas: { ...newItem.utilities!.naturalGas, pressure: e.target.value } } })} />
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                    <AccordionItem value="foundation">
                                                        <AccordionTrigger className="text-xs font-bold py-2">ALTYAPI & TEMEL</AccordionTrigger>
                                                        <AccordionContent className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px]">Zemin Kalınlığı</Label>
                                                                <Input className="h-8" value={newItem.specification?.infraFloorThickness} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, infraFloorThickness: e.target.value } })} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px]">Temel Tipi</Label>
                                                                <Input className="h-8" value={newItem.specification?.infraFoundationType} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, infraFoundationType: e.target.value } })} />
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            </TabsContent>

                                            <TabsContent value="others" className="space-y-4">
                                                <div className="space-y-3">
                                                    <Label className="text-amber-600 font-bold flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Sabit Sarf Malzemeleri</Label>
                                                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
                                                        <p className="text-[11px] text-slate-500 mb-2 italic">Kütüphaneden sarf seçip bu makine varyantı için varsayılan tüketim miktarı belirleyin.</p>

                                                        <div className="space-y-3">
                                                            {(newItem.specification?.consumables || []).map((c: any, idx: number) => (
                                                                <div key={idx} className="flex gap-2 items-end bg-white p-3 rounded border shadow-sm group">
                                                                    <div className="flex-[2] space-y-1">
                                                                        <Label className="text-[10px]">Sarf Kütüphanesi</Label>
                                                                        <select
                                                                            className="w-full h-8 px-2 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-yellow-500"
                                                                            value={c.name}
                                                                            onChange={e => {
                                                                                const selected = consumableLibrary.find(cl => cl.name === e.target.value);
                                                                                const newList = [...(newItem.specification?.consumables || [])];
                                                                                newList[idx] = { ...newList[idx], name: e.target.value, unit: selected?.unit };
                                                                                setNewItem({ ...newItem, specification: { ...newItem.specification!, consumables: newList } });
                                                                            }}
                                                                        >
                                                                            <option value="">Sarf Seçin...</option>
                                                                            {Array.from(new Set(consumableLibrary.map(cl => cl.category))).map(cat => (
                                                                                <optgroup key={cat} label={cat}>
                                                                                    {consumableLibrary.filter(cl => cl.category === cat).map(cl => (
                                                                                        <option key={cl.id} value={cl.name}>{cl.name} ({cl.unit})</option>
                                                                                    ))}
                                                                                </optgroup>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div className="flex-1 space-y-1">
                                                                        <Label className="text-[10px]">Doldurma / Tüketim</Label>
                                                                        <Input className="h-8 text-xs" placeholder="Örn: 200 L" value={c.consumption} onChange={e => {
                                                                            const newList = [...(newItem.specification?.consumables || [])];
                                                                            newList[idx] = { ...newList[idx], consumption: e.target.value };
                                                                            setNewItem({ ...newItem, specification: { ...newItem.specification!, consumables: newList } });
                                                                        }} />
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 text-slate-300 hover:text-red-500"
                                                                        onClick={() => {
                                                                            const newList = [...(newItem.specification?.consumables || [])];
                                                                            newList.splice(idx, 1);
                                                                            setNewItem({ ...newItem, specification: { ...newItem.specification!, consumables: newList } });
                                                                        }}
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                            ))}

                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full border-dashed text-slate-500 h-8 gap-1 hover:bg-slate-100"
                                                                onClick={() => {
                                                                    const newList = [...(newItem.specification?.consumables || [])];
                                                                    newList.push({ name: '', consumption: '' });
                                                                    setNewItem({ ...newItem, specification: { ...newItem.specification!, consumables: newList } });
                                                                }}
                                                            >
                                                                <Plus className="w-3 h-3" /> Listeye Sarf Ekle
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-3 border-t pt-4">
                                                    <Label className="text-slate-600 font-bold flex items-center gap-2"><Wrench className="w-4 h-4" /> Bakım & Yedek Parça</Label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px]">Yedek Parça Listesi</Label>
                                                            <Input className="h-8" value={newItem.specification?.maintenanceSpareParts} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, maintenanceSpareParts: e.target.value } })} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px]">Periyodik Bakım</Label>
                                                            <Input className="h-8" value={newItem.specification?.maintenancePeriodic} onChange={e => setNewItem({ ...newItem, specification: { ...newItem.specification!, maintenancePeriodic: e.target.value } })} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        </Tabs>

                                        <DialogFooter className="mt-6 border-t pt-4">
                                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>İptal</Button>
                                            <Button onClick={handleSave} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold">
                                                {editingId ? 'Değişiklikleri Kaydet' : 'Tedarikçi Modelini Kaydet'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                )}
                            </Dialog>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className={isEmbedded ? 'p-2' : 'p-8 max-w-7xl mx-auto'}>
                {isEmbedded && (
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Katalogda ara..."
                                className="pl-10 w-full h-9 text-xs border-slate-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                )}
                <div className={`bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden ${isEmbedded ? 'max-h-[60vh] overflow-y-auto' : ''}`}>
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="pl-6 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Makine Tipi</TableHead>
                                <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Tedarikçi</TableHead>
                                <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Model</TableHead>
                                <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider text-center">Güç</TableHead>
                                <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider text-center">Hava</TableHead>
                                {!isEmbedded && <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Kategori</TableHead>}
                                <TableHead className="pr-6 text-right font-bold text-slate-500 text-[11px] uppercase tracking-wider">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeCatalogTab === 'machines' ? (
                                sortedCatalog.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        className={`group hover:bg-yellow-50/30 border-slate-50 transition-colors ${isEmbedded ? 'cursor-pointer' : ''}`}
                                        draggable={isEmbedded}
                                        onClick={() => {
                                            if (isEmbedded && onItemSelect) {
                                                onItemSelect(item);
                                            }
                                        }}
                                        onDragStart={(e) => {
                                            if (isEmbedded && onItemDragStart) {
                                                onItemDragStart(e, 'custom', `${item.vendor} ${item.model}`, item);
                                            }
                                        }}
                                    >
                                        <TableCell className="pl-6 py-3">
                                            <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-600 italic text-sm">
                                            {item.vendor}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-800 text-sm">{item.model}</TableCell>
                                        <TableCell className="text-center py-3">
                                            <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700 text-[10px] font-bold border border-yellow-100">
                                                {item.utilities.electrical.nominalPower || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center py-3">
                                            <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                                                {item.utilities.air.consumption || '-'}
                                            </div>
                                        </TableCell>
                                        {!isEmbedded && (
                                            <TableCell>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                                    {item.category}
                                                </span>
                                            </TableCell>
                                        )}
                                        <TableCell className="pr-6 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!isEmbedded ? (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50"
                                                            onClick={(e) => startEdit(item, e)}
                                                            title="Düzenle"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                            onClick={(e) => deleteVariant(item.id, e)}
                                                            title="Sil"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <div className="text-[10px] font-bold text-yellow-600 uppercase">Sürükle Ekle</div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                consumableLibrary
                                    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.category.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((item) => (
                                        <TableRow key={item.id} className="group hover:bg-emerald-50/30 border-slate-50 transition-colors">
                                            <TableCell className="pl-6 py-3">
                                                <span className="font-bold text-slate-900 text-sm">{item.category}</span>
                                            </TableCell>
                                            <TableCell colSpan={2} className="font-semibold text-slate-600 text-sm">
                                                {item.name}
                                            </TableCell>
                                            <TableCell className="text-center py-3">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                                    {item.unit}
                                                </span>
                                            </TableCell>
                                            <TableCell className="pr-6 text-right" colSpan={3}>
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                                        onClick={(e) => startEditConsumable(item, e)}
                                                        title="Düzenle"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                        onClick={(e) => deleteConsumable(item.id, e)}
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>

                    {sortedCatalog.length === 0 && (
                        <div className="py-20 text-center bg-white">
                            <Package className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-800">Hiçbir Kayıt Bulunmuyor</h3>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
