import React, { useState } from "react";
import type { AppNode } from "../types/flow";
import { uploadNodeImage, resolveMediaUrl } from "../api/media";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import GoldenLineCatalog from "./golden-line/GoldenLineCatalog";
import { BookOpen, Settings2, BarChart3, FlaskConical, Wrench, Building2, ClipboardList, Plus, Trash2, Lock, Save } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";


type Props = {
  selectedNode: AppNode | null;
  predecessors: AppNode[];
  successors: AppNode[];
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeMachineType?: (nodeId: string, machineType: string) => void;
  updateNodeDepartment: (nodeId: string, department: string) => void;
  updateNodeCompletion: (nodeId: string, completion: number) => void;
  updateNodeDuration: (nodeId: string, duration: number) => void;
  updateNodeImage: (nodeId: string, imagePath: string | null) => void;
  updateNodeUtilities?: (nodeId: string, utilities: any) => void;
  updateNodeSpecification?: (nodeId: string, specification: any) => void;
  updateNodeQuality?: (nodeId: string, quality: any) => void;
  style?: React.CSSProperties;
  isSimpleMode?: boolean;
};

export default function InspectorPanel({
  selectedNode,
  predecessors,
  successors,
  updateNodeLabel,
  updateNodeMachineType,
  updateNodeDepartment,
  updateNodeCompletion,
  updateNodeDuration,
  updateNodeImage,
  updateNodeUtilities,
  updateNodeSpecification,
  updateNodeQuality,
  style,
  isSimpleMode = false,
}: Props) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Utilities state
  const [utilityState, setUtilityState] = useState({
    electrical: {
      ups: "",
      nominalPower: "",
      voltageHzPhase: "",
    },
    air: {
      consumption: "",
      connectionType: "",
      connectionSize: "",
    },
    naturalGas: {
      consumption: "",
      pressure: "",
      connectionType: "",
      connectionSize: "",
    },
    coolingWater: {
      flow: "",
      pressure: "",
      circuitType: "",
      inletTemp: "",
      outletTemp: "",
      connectionType: "",
      connectionSize: "",
    },
    mainWater: {
      flow: "",
      connectionType: "",
      connectionSize: "",
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCatalogDialogOpen, setIsCatalogDialogOpen] = useState(false);
  const [isSpecificationDialogOpen, setIsSpecificationDialogOpen] = useState(false);
  const [isQualityDialogOpen, setIsQualityDialogOpen] = useState(false);
  const [specificationState, setSpecificationState] = useState<any>({});
  const [qualityState, setQualityState] = useState<any[]>([]);
  
  // Save to Catalog state
  const [isSaveCatalogDialogOpen, setIsSaveCatalogDialogOpen] = useState(false);
  const [catalogVendor, setCatalogVendor] = useState("");
  const [catalogModel, setCatalogModel] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("Genel");

  const handleCatalogSelect = (item: any) => {
    if (selectedNode) {
      updateNodeLabel(selectedNode.id, `${item.vendor} ${item.model}`);
      if (updateNodeMachineType) {
        updateNodeMachineType(selectedNode.id, item.name || '');
      }
      if (updateNodeUtilities) {
        updateNodeUtilities(selectedNode.id, item.utilities);
      }
      if (updateNodeSpecification) {
        // Tag catalog consumables as fixed
        const taggedSpecification = { ...item.specification };
        if (taggedSpecification.consumables) {
          taggedSpecification.consumables = taggedSpecification.consumables.map((c: any) => ({
            ...c,
            isFixed: true
          }));
        }
        updateNodeSpecification(selectedNode.id, taggedSpecification);
      }
      if (updateNodeSpecification) {
        // Quality data is stored separately now
        (selectedNode.data as any).quality = item.quality || [];
      }
      setIsCatalogDialogOpen(false);
    }
  };

  // Sync Utility state when dialog opens
  React.useEffect(() => {
    if (selectedNode && isDialogOpen) {
      const utils = (selectedNode.data as any)?.utilities || {};
      setUtilityState({
        electrical: {
          ups: utils.electrical?.ups || "",
          nominalPower: utils.electrical?.nominalPower || "",
          voltageHzPhase: utils.electrical?.voltageHzPhase || "",
        },
        air: {
          consumption: utils.air?.consumption || "",
          connectionType: utils.air?.connectionType || "",
          connectionSize: utils.air?.connectionSize || "",
        },
        naturalGas: {
          consumption: utils.naturalGas?.consumption || "",
          pressure: utils.naturalGas?.pressure || "",
          connectionType: utils.naturalGas?.connectionType || "",
          connectionSize: utils.naturalGas?.connectionSize || "",
        },
        coolingWater: {
          flow: utils.coolingWater?.flow || "",
          pressure: utils.coolingWater?.pressure || "",
          circuitType: utils.coolingWater?.circuitType || "",
          inletTemp: utils.coolingWater?.inletTemp || "",
          outletTemp: utils.coolingWater?.outletTemp || "",
          connectionType: utils.coolingWater?.connectionType || "",
          connectionSize: utils.coolingWater?.connectionSize || "",
        },
        mainWater: {
          flow: utils.mainWater?.flow || "",
          connectionType: utils.mainWater?.connectionType || "",
          connectionSize: utils.mainWater?.connectionSize || "",
        },
      });
    }
  }, [selectedNode, isDialogOpen]);

  // Sync Specification state when dialog opens
  React.useEffect(() => {
    if (selectedNode && isSpecificationDialogOpen) {
      const originalSpec = (selectedNode.data as any)?.specification || {};
      // Deep clone to ensure local state is completely fresh and React detects the change
      setSpecificationState(JSON.parse(JSON.stringify(originalSpec)));
    }
  }, [selectedNode, isSpecificationDialogOpen]);

  // Sync Quality state when dialog opens
  React.useEffect(() => {
    if (selectedNode && isQualityDialogOpen) {
      const originalQuality = (selectedNode.data as any)?.quality || [];
      setQualityState(JSON.parse(JSON.stringify(originalQuality)));
    }
  }, [selectedNode, isQualityDialogOpen]);

  const handleSaveSpecification = () => {
    if (selectedNode && updateNodeSpecification) {
      updateNodeSpecification(selectedNode.id, specificationState);
      setIsSpecificationDialogOpen(false);
    }
  };

  const handleSaveUtilities = () => {
    if (selectedNode && updateNodeUtilities) {
      updateNodeUtilities(selectedNode.id, utilityState);
      setIsDialogOpen(false);
    }
  };

  const handleSaveQuality = () => {
    if (selectedNode && updateNodeQuality) {
      updateNodeQuality(selectedNode.id, qualityState);
      setIsQualityDialogOpen(false);
    }
  };

  const handleSaveToCatalog = () => {
    if (!selectedNode) return;
    if (!catalogVendor || !catalogModel) {
      toast.error("Lütfen Marka ve Model bilgilerini doldurun");
      return;
    }

    const CATALOG_STORAGE_KEY = 'golden_line_machine_catalog_v2';
    const savedCatalog = localStorage.getItem(CATALOG_STORAGE_KEY);
    let catalog = savedCatalog ? JSON.parse(savedCatalog) : [];

    const data = selectedNode.data as any;
    const newItem = {
      id: crypto.randomUUID(),
      name: data.machineType || data.label || "İsimsiz Makine",
      vendor: catalogVendor,
      model: catalogModel,
      description: data.description || "",
      category: catalogCategory,
      utilities: data.utilities || {},
      specification: data.specification || {},
      quality: data.quality || []
    };

    catalog.push(newItem);
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog));
    
    toast.success(`${catalogVendor} ${catalogModel} başarıyla kataloğa eklendi`);
    setIsSaveCatalogDialogOpen(false);
  };


  const nodeLabel =
    (selectedNode?.data as any)?.label !== undefined
      ? (selectedNode?.data as any)?.label
      : "";

  const imagePath = (selectedNode?.data as any)?.imagePath ?? null;
  const imageUrl = resolveMediaUrl(imagePath);

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!selectedNode) {
      return;
    }
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setImageError(null);
    setIsUploadingImage(true);
    try {
      const response = await uploadNodeImage(file);
      updateNodeImage(selectedNode.id, response.relativePath);
    } catch (error) {
      console.error("Node resmi yuklenemedi:", error);
      setImageError("Resim yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleRemoveImage = () => {
    if (!selectedNode) {
      return;
    }
    updateNodeImage(selectedNode.id, null);
  };

  return (
    <aside className="inspector-panel" style={style}>
      {!selectedNode ? (
        <>
          <h3>Detaylar</h3>
          <p>Bir dugum secin ve detaylarini goruntuleyin.</p>
        </>
      ) : (
        <>
          {!isSimpleMode && <h3>Dugum Detaylari</h3>}
          {isSimpleMode && (
            <div className="form-group">
              <label htmlFor="machineType">Makine Tipi</label>
              <input
                type="text"
                id="machineType"
                value={(selectedNode?.data as any)?.machineType || ""}
                onChange={(e) => updateNodeMachineType?.(selectedNode.id, e.target.value)}
                className="inspector-input"
                placeholder="Örn: CNC Torna"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="label">{isSimpleMode ? "Isim" : "Etiket (Montaj adi)"}</label>
            <input
              type="text"
              id="label"
              value={nodeLabel}
              onChange={(e) => updateNodeLabel(selectedNode.id, e.target.value)}
              className="inspector-input"
            />
          </div>

          {isSimpleMode && (
            <div className="form-group">
              <Dialog open={isCatalogDialogOpen} onOpenChange={setIsCatalogDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-2 bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 font-semibold mb-2">
                    <BookOpen className="w-4 h-4" /> Katalogdan Seç
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                  <DialogHeader className="p-6 border-b bg-yellow-50/30">
                    <DialogTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-yellow-500" />
                      Makine Kataloğundan Seç
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto">
                    <GoldenLineCatalog isEmbedded={true} onItemSelect={handleCatalogSelect} />
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isSaveCatalogDialogOpen} onOpenChange={setIsSaveCatalogDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-semibold mb-4"
                    onClick={() => {
                      setCatalogVendor("");
                      setCatalogModel("");
                      setCatalogCategory("Genel");
                    }}
                  >
                    <Save className="w-4 h-4" /> Kataloğa Kaydet
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-emerald-700">
                      <Save className="w-5 h-5" />
                      Makineyi Kataloğa Ekle
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Marka / Tedarikçi</Label>
                      <Input 
                        placeholder="Örn: Mazak, Kasto" 
                        value={catalogVendor} 
                        onChange={e => setCatalogVendor(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Model No</Label>
                      <Input 
                        placeholder="Örn: X-200, VTC-800" 
                        value={catalogModel} 
                        onChange={e => setCatalogModel(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Kategori</Label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={catalogCategory}
                        onChange={e => setCatalogCategory(e.target.value)}
                      >
                        <option value="Genel">Genel</option>
                        <option value="İşleme">İşleme</option>
                        <option value="Kesme">Kesme</option>
                        <option value="Montaj">Montaj</option>
                        <option value="Test">Test</option>
                        <option value="Lojistik">Lojistik</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      Bu işlem, mevcut makinenin tüm teknik verilerini (Utilities, Spesifikasyonlar, QC) kataloğa kopyalar.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSaveCatalogDialogOpen(false)}>İptal</Button>
                    <Button onClick={handleSaveToCatalog} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                      Kataloğa Kaydet
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {selectedNode.type !== "grup" && !isSimpleMode && (
            <>
              <div className="form-group">
                <label htmlFor="department">Departman</label>
                <select
                  id="department"
                  value={(selectedNode.data as any)?.department ?? ""}
                  onChange={(e) =>
                    updateNodeDepartment(selectedNode.id, e.target.value)
                  }
                  className="inspector-input"
                >
                  <option value="">Departman seciniz...</option>
                  <option value="Mekanik">Mekanik</option>
                  <option value="Elektrik">Elektrik</option>
                  <option value="Akışkan">Akışkan</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="duration">Sure (gun)</label>
                <input
                  type="number"
                  id="duration"
                  min="0"
                  value={(selectedNode.data as any)?.duration ?? 0}
                  onChange={(e) =>
                    updateNodeDuration(
                      selectedNode.id,
                      parseFloat(e.target.value)
                    )
                  }
                  className="inspector-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="completion">Tamamlanma (%)</label>
                <input
                  type="number"
                  id="completion"
                  min="0"
                  max="100"
                  value={(selectedNode.data as any)?.completion ?? 0}
                  onChange={(e) =>
                    updateNodeCompletion(
                      selectedNode.id,
                      parseInt(e.target.value, 10)
                    )
                  }
                  className="inspector-input"
                />
              </div>
            </>
          )}

          {selectedNode.type !== "grup" && (
            <>

              <div className="form-group">
                <label htmlFor="node-image">Resim</label>
                {imageUrl && (
                  <div className="inspector-image-preview">
                    <img src={imageUrl} alt="Node" />
                    <button
                      type="button"
                      className="inspector-button"
                      onClick={handleRemoveImage}
                    >
                      Resmi Kaldir
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  id="node-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isUploadingImage}
                />
                {isUploadingImage && (
                  <div className="inspector-image-status">Yukleniyor...</div>
                )}
                {imageError && (
                  <div className="inspector-image-error">{imageError}</div>
                )}
              </div>

              <div className="form-group">
                <label>Oncekiler</label>
                <ul className="dependency-list">
                  {predecessors.length > 0 ? (
                    predecessors.map((node) => (
                      <li key={node.id}>
                        {(node.data as any)?.label ?? node.id}
                      </li>
                    ))
                  ) : (
                    <li className="empty">Oncek bulunmuyor</li>
                  )}
                </ul>
              </div>

              <div className="form-group">
                <label>Sonrakiler</label>
                <ul className="dependency-list">
                  {successors.length > 0 ? (
                    successors.map((node) => (
                      <li key={node.id}>
                        {(node.data as any)?.label ?? node.id}
                      </li>
                    ))
                  ) : (
                    <li className="empty">Sonraki bulunmuyor</li>
                  )}
                </ul>
              </div>

              {isSimpleMode && (
                <div className="form-group pt-4 border-t mt-4 space-y-2">
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full bg-slate-50 hover:bg-slate-100">
                        Utilities
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Utilities - {nodeLabel}</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-6 py-4 px-1 pr-4">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm border-b pb-2">Elektrik</h4>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">UPS</Label>
                            <Input className="h-8 text-xs" value={utilityState.electrical.ups} onChange={(e) => setUtilityState(prev => ({ ...prev, electrical: { ...prev.electrical, ups: e.target.value } }))} />
                          </div>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Nominal Güç</Label>
                            <Input className="h-8 text-xs" value={utilityState.electrical.nominalPower} onChange={(e) => setUtilityState(prev => ({ ...prev, electrical: { ...prev.electrical, nominalPower: e.target.value } }))} />
                          </div>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Voltage&Hz&Phase</Label>
                            <Input className="h-8 text-xs" value={utilityState.electrical.voltageHzPhase} onChange={(e) => setUtilityState(prev => ({ ...prev, electrical: { ...prev.electrical, voltageHzPhase: e.target.value } }))} />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm border-b pb-2">Hava</h4>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Tüketim</Label>
                            <Input className="h-8 text-xs" value={utilityState.air.consumption} onChange={(e) => setUtilityState(prev => ({ ...prev, air: { ...prev.air, consumption: e.target.value } }))} />
                          </div>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Bağlantı Tipi</Label>
                            <Input className="h-8 text-xs" value={utilityState.air.connectionType} onChange={(e) => setUtilityState(prev => ({ ...prev, air: { ...prev.air, connectionType: e.target.value } }))} />
                          </div>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Eleman Ölçüleri</Label>
                            <Input className="h-8 text-xs" value={utilityState.air.connectionSize} onChange={(e) => setUtilityState(prev => ({ ...prev, air: { ...prev.air, connectionSize: e.target.value } }))} />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm border-b pb-2">Doğalgaz</h4>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Tüketim</Label>
                            <Input className="h-8 text-xs" value={utilityState.naturalGas.consumption} onChange={(e) => setUtilityState(prev => ({ ...prev, naturalGas: { ...prev.naturalGas, consumption: e.target.value } }))} />
                          </div>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Basınç</Label>
                            <Input className="h-8 text-xs" value={utilityState.naturalGas.pressure} onChange={(e) => setUtilityState(prev => ({ ...prev, naturalGas: { ...prev.naturalGas, pressure: e.target.value } }))} />
                          </div>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Bağlantı Tipi</Label>
                            <Input className="h-8 text-xs" value={utilityState.naturalGas.connectionType} onChange={(e) => setUtilityState(prev => ({ ...prev, naturalGas: { ...prev.naturalGas, connectionType: e.target.value } }))} />
                          </div>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Eleman Ölçüleri</Label>
                            <Input className="h-8 text-xs" value={utilityState.naturalGas.connectionSize} onChange={(e) => setUtilityState(prev => ({ ...prev, naturalGas: { ...prev.naturalGas, connectionSize: e.target.value } }))} />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm border-b pb-2">Soğutma Suyu</h4>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Debi</Label>
                            <Input className="h-8 text-xs" value={utilityState.coolingWater.flow} onChange={(e) => setUtilityState(prev => ({ ...prev, coolingWater: { ...prev.coolingWater, flow: e.target.value } }))} />
                          </div>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Basınç</Label>
                            <Input className="h-8 text-xs" value={utilityState.coolingWater.pressure} onChange={(e) => setUtilityState(prev => ({ ...prev, coolingWater: { ...prev.coolingWater, pressure: e.target.value } }))} />
                          </div>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Devre Tipi</Label>
                            <Input className="h-8 text-xs" value={utilityState.coolingWater.circuitType} onChange={(e) => setUtilityState(prev => ({ ...prev, coolingWater: { ...prev.coolingWater, circuitType: e.target.value } }))} />
                          </div>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Giriş Sıcaklığı</Label>
                            <Input className="h-8 text-xs" value={utilityState.coolingWater.inletTemp} onChange={(e) => setUtilityState(prev => ({ ...prev, coolingWater: { ...prev.coolingWater, inletTemp: e.target.value } }))} />
                          </div>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Çıkış Sıcaklığı</Label>
                            <Input className="h-8 text-xs" value={utilityState.coolingWater.outletTemp} onChange={(e) => setUtilityState(prev => ({ ...prev, coolingWater: { ...prev.coolingWater, outletTemp: e.target.value } }))} />
                          </div>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Bağlantı Tipi</Label>
                            <Input className="h-8 text-xs" value={utilityState.coolingWater.connectionType} onChange={(e) => setUtilityState(prev => ({ ...prev, coolingWater: { ...prev.coolingWater, connectionType: e.target.value } }))} />
                          </div>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Eleman Ölçüleri</Label>
                            <Input className="h-8 text-xs" value={utilityState.coolingWater.connectionSize} onChange={(e) => setUtilityState(prev => ({ ...prev, coolingWater: { ...prev.coolingWater, connectionSize: e.target.value } }))} />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm border-b pb-2">Şebeke Suyu</h4>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Debi</Label>
                            <Input className="h-8 text-xs" value={utilityState.mainWater.flow} onChange={(e) => setUtilityState(prev => ({ ...prev, mainWater: { ...prev.mainWater, flow: e.target.value } }))} />
                          </div>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Bağlantı Tipi</Label>
                            <Input className="h-8 text-xs" value={utilityState.mainWater.connectionType} onChange={(e) => setUtilityState(prev => ({ ...prev, mainWater: { ...prev.mainWater, connectionType: e.target.value } }))} />
                          </div>
                          <div className="flex items-center gap-4 pl-2">
                            <Label className="min-w-[140px] text-xs">Eleman Ölçüleri</Label>
                            <Input className="h-8 text-xs" value={utilityState.mainWater.connectionSize} onChange={(e) => setUtilityState(prev => ({ ...prev, mainWater: { ...prev.mainWater, connectionSize: e.target.value } }))} />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSaveUtilities}>Kaydet</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isSpecificationDialogOpen} onOpenChange={setIsSpecificationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full bg-slate-50 hover:bg-slate-100">
                        Line Specification
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Line Specification - {nodeLabel}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Inlet Part Code</Label>
                            <Input value={specificationState.inletPartCode || ''} onChange={e => setSpecificationState({ ...specificationState, inletPartCode: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Exit Part Code</Label>
                            <Input value={specificationState.exitPartCode || ''} onChange={e => setSpecificationState({ ...specificationState, exitPartCode: e.target.value })} />
                          </div>
                        </div>

                        <Accordion type="multiple" defaultValue={['process']} className="w-full">

                          <AccordionItem value="process">
                            <AccordionTrigger className="text-sm font-bold">MAKİNE & PROSES</AccordionTrigger>
                            <AccordionContent className="grid grid-cols-2 gap-4">
                              <div className="space-y-2"><Label>Alt Donanımlar</Label><Input value={specificationState.machineSubEquipments || ''} onChange={e => setSpecificationState({ ...specificationState, machineSubEquipments: e.target.value })} /></div>
                              <div className="space-y-2"><Label>Çevrim Süresi</Label><Input value={specificationState.processCycleTime || ''} onChange={e => setSpecificationState({ ...specificationState, processCycleTime: e.target.value })} /></div>
                              <div className="space-y-2"><Label>Yükleme Metodu</Label><Input value={specificationState.processLoadingMethod || ''} onChange={e => setSpecificationState({ ...specificationState, processLoadingMethod: e.target.value })} /></div>
                              <div className="space-y-2"><Label>Hedef OEE</Label><Input value={specificationState.processTargetOEE || ''} onChange={e => setSpecificationState({ ...specificationState, processTargetOEE: e.target.value })} /></div>
                              <div className="space-y-2"><Label>Makine Ölçüleri</Label><Input value={specificationState.machineDimensions || ''} onChange={e => setSpecificationState({ ...specificationState, machineDimensions: e.target.value })} /></div>
                              <div className="space-y-2"><Label>Adet</Label><Input value={specificationState.machineQuantity || ''} onChange={e => setSpecificationState({ ...specificationState, machineQuantity: e.target.value })} /></div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="infra">
                            <AccordionTrigger className="text-sm font-bold">ALTYAPI & ÇEVRE</AccordionTrigger>
                            <AccordionContent className="grid grid-cols-2 gap-4">
                              <div className="space-y-2"><Label>Temel Tipi</Label><Input value={specificationState.infraFoundationType || ''} onChange={e => setSpecificationState({ ...specificationState, infraFoundationType: e.target.value })} /></div>
                              <div className="space-y-2"><Label>Zemin Kalınlığı</Label><Input value={specificationState.infraFloorThickness || ''} onChange={e => setSpecificationState({ ...specificationState, infraFloorThickness: e.target.value })} /></div>
                              <div className="space-y-2"><Label>Gürültü Seviyesi</Label><Input value={specificationState.infraNoiseLevel || ''} onChange={e => setSpecificationState({ ...specificationState, infraNoiseLevel: e.target.value })} /></div>
                              <div className="space-y-2"><Label>Atık Tipi</Label><Input value={specificationState.infraWasteType || ''} onChange={e => setSpecificationState({ ...specificationState, infraWasteType: e.target.value })} /></div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="maintenance">
                            <AccordionTrigger className="text-sm font-bold">BAKIM & YEDEK PARÇA</AccordionTrigger>
                            <AccordionContent className="grid grid-cols-2 gap-4">
                              <div className="space-y-2"><Label>Periyodik Bakım</Label><Input value={specificationState.maintenancePeriodic || ''} onChange={e => setSpecificationState({ ...specificationState, maintenancePeriodic: e.target.value })} /></div>
                              <div className="space-y-2"><Label>Kritik Yedek Parça</Label><Input value={specificationState.maintenanceCriticalSpares || ''} onChange={e => setSpecificationState({ ...specificationState, maintenanceCriticalSpares: e.target.value })} /></div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="consumables">
                            <div className="flex justify-between items-center pr-4">
                              <AccordionTrigger className="text-sm font-bold">SARF MALZEMELERİ</AccordionTrigger>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 gap-1 text-emerald-600 hover:bg-emerald-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const c = [...(specificationState.consumables || [])];
                                  c.push({ name: '', unit: '', consumption: '', isFixed: false });
                                  setSpecificationState({ ...specificationState, consumables: c });
                                }}
                              >
                                <Plus className="w-3 h-3" /> Ekle
                              </Button>
                            </div>
                            <AccordionContent className="space-y-4">
                              {(!specificationState.consumables || specificationState.consumables.length === 0) ? (
                                <div className="text-center py-4 text-slate-400 text-xs border border-dashed rounded italic">
                                  Henüz sarf malzemesi girilmedi.
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {/* Sabit Sarflar (Katalogdan Geldi) */}
                                  {specificationState.consumables.some((c: any) => c.isFixed) && (
                                    <div className="space-y-2">
                                      <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Demirbaş / Katalog Sarfları</Label>
                                      {specificationState.consumables.map((item: any, idx: number) => {
                                        if (!item.isFixed) return null;
                                        return (
                                          <div key={idx} className="flex gap-2 items-end bg-slate-50/50 p-2 rounded">
                                            <div className="flex-1 space-y-1">
                                              <Label className="text-[10px]">Sarf Adı</Label>
                                              <div className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-white border text-xs text-slate-500">
                                                <Lock className="w-3 h-3 text-slate-300" />
                                                {item.name} {item.unit ? `(${item.unit})` : ''}
                                              </div>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                              <Label className="text-[10px]">Tüketim</Label>
                                              <Input className="h-8 text-xs bg-white" value={item.consumption || ''} onChange={e => {
                                                const c = [...specificationState.consumables];
                                                c[idx] = { ...c[idx], consumption: e.target.value };
                                                setSpecificationState({ ...specificationState, consumables: c });
                                              }} />
                                            </div>
                                            <div className="w-8" /> {/* Spacer for alignment with trash button */}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Projeye Özel Sarflar */}
                                  <div className="space-y-2">
                                    {specificationState.consumables.some((c: any) => !c.isFixed) && (
                                      <Label className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Operasyonel / Proje Sarfları</Label>
                                    )}
                                    {specificationState.consumables.map((item: any, idx: number) => {
                                      if (item.isFixed) return null;
                                      return (
                                        <div key={idx} className="flex gap-2 items-end group">
                                          <div className="flex-1 space-y-1">
                                            <Label className="text-[10px]">Sarf Adı</Label>
                                            <Input className="h-8 text-xs" placeholder="Örn: Testere Bıçağı" value={item.name || ''} onChange={e => {
                                              const c = [...specificationState.consumables];
                                              c[idx] = { ...c[idx], name: e.target.value };
                                              setSpecificationState({ ...specificationState, consumables: c });
                                            }} />
                                          </div>
                                          <div className="w-20 space-y-1">
                                            <Label className="text-[10px]">Birim</Label>
                                            <Input className="h-8 text-xs" placeholder="Adet, L.." value={item.unit || ''} onChange={e => {
                                              const c = [...specificationState.consumables];
                                              c[idx] = { ...c[idx], unit: e.target.value };
                                              setSpecificationState({ ...specificationState, consumables: c });
                                            }} />
                                          </div>
                                          <div className="flex-1 space-y-1">
                                            <Label className="text-[10px]">Tüketim</Label>
                                            <Input className="h-8 text-xs" placeholder="Örn: 1 adet/shift" value={item.consumption || ''} onChange={e => {
                                              const c = [...specificationState.consumables];
                                              c[idx] = { ...c[idx], consumption: e.target.value };
                                              setSpecificationState({ ...specificationState, consumables: c });
                                            }} />
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 text-slate-300 hover:text-red-500"
                                            onClick={() => {
                                              const c = [...specificationState.consumables];
                                              c.splice(idx, 1);
                                              setSpecificationState({ ...specificationState, consumables: c });
                                            }}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSpecificationDialogOpen(false)}>İptal</Button>
                        <Button onClick={handleSaveSpecification} className="bg-yellow-500 hover:bg-yellow-600 text-white">Kaydet</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isQualityDialogOpen} onOpenChange={setIsQualityDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full bg-slate-50 hover:bg-slate-100">
                        Quality Control
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden">
                      <DialogHeader className="p-6 border-b shrink-0">
                        <DialogTitle>Quality Control - {nodeLabel}</DialogTitle>
                      </DialogHeader>

                      <div className="flex-1 overflow-hidden flex flex-col p-6">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                          <span className="text-sm text-slate-500">Kalite kontrol adımları parça bazlı ölçü ve kontrolleri içerir.</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => setQualityState([...qualityState, { spec: '', frequency: '', method: '' }])}
                          >
                            <Plus className="w-4 h-4" /> Yeni Adım Ekle
                          </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                          {qualityState.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400">
                              <FlaskConical className="w-10 h-10 mb-2 opacity-20" />
                              <p className="text-sm">Henüz kalite kontrol adımı eklenmedi.</p>
                            </div>
                          ) : (
                            qualityState.map((item, idx) => (
                              <div key={idx} className="flex gap-3 items-end border-b pb-4 last:border-0 group">
                                <div className="flex-1 space-y-1">
                                  <Label className="text-xs">Spesifikasyon</Label>
                                  <Input className="h-9" placeholder="Örn: Boy ölçümü" value={item.spec || ''} onChange={e => {
                                    const q = [...qualityState];
                                    q[idx] = { ...q[idx], spec: e.target.value };
                                    setQualityState(q);
                                  }} />
                                </div>
                                <div className="flex-1 space-y-1">
                                  <Label className="text-xs">Frekans</Label>
                                  <Input className="h-9" placeholder="Örn: 1/10 parça" value={item.frequency || ''} onChange={e => {
                                    const q = [...qualityState];
                                    q[idx] = { ...q[idx], frequency: e.target.value };
                                    setQualityState(q);
                                  }} />
                                </div>
                                <div className="flex-1 space-y-1">
                                  <Label className="text-xs">Metot</Label>
                                  <Input className="h-9" placeholder="Örn: Kumpas" value={item.method || ''} onChange={e => {
                                    const q = [...qualityState];
                                    q[idx] = { ...q[idx], method: e.target.value };
                                    setQualityState(q);
                                  }} />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-slate-400 hover:text-red-500 transition-colors"
                                  onClick={() => {
                                    const q = [...qualityState];
                                    q.splice(idx, 1);
                                    setQualityState(q);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <DialogFooter className="p-6 border-t bg-slate-50/50 shrink-0">
                        <Button variant="outline" onClick={() => setIsQualityDialogOpen(false)}>İptal</Button>
                        <Button onClick={handleSaveQuality} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]">Kaydet</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </>
          )}
        </>
      )}
    </aside>
  );
}
