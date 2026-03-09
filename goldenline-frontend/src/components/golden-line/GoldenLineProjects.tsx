import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Trash2, ArrowRight, LayoutPanelTop, ChevronLeft, Package, LogOut } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

interface GoldenLineProject {
    id: string;
    name: string;
    createdAt: string;
}

const LIST_STORAGE_KEY = 'golden_line_projects_list';

export default function GoldenLineProjects() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<GoldenLineProject[]>([]);
    const [newProjectName, setNewProjectName] = useState('');

    const { user, logout } = useAuth();
    const isGoldenLineUser = user?.role?.toLowerCase() === 'goldenlineuser';

    useEffect(() => {
        const saved = localStorage.getItem(LIST_STORAGE_KEY);
        if (saved) {
            try {
                setProjects(JSON.parse(saved));
            } catch (e) {
                console.error('Error parsing projects list', e);
                setProjects([]);
            }
        }
    }, []);

    const saveProjects = (updated: GoldenLineProject[]) => {
        localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(updated));
        setProjects(updated);
    };

    const createProject = () => {
        if (!newProjectName.trim()) return;
        const newProject: GoldenLineProject = {
            id: uuidv4(),
            name: newProjectName.trim(),
            createdAt: new Date().toISOString()
        };
        saveProjects([newProject, ...projects]);
        setNewProjectName('');
    };

    const deleteProject = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Bu projeyi silmek istediğinizden emin misiniz? Tüm akış verileri silinecektir.')) {
            saveProjects(projects.filter(p => p.id !== id));
            localStorage.removeItem(`golden_line_project_${id}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Golden Line Modülleri</h1>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="gap-2 border-slate-200 hover:bg-slate-50 font-semibold"
                                    onClick={() => navigate('/golden-line/catalog')}
                                >
                                    <Package className="w-4 h-4 text-yellow-500" /> Makine Kataloğu
                                </Button>
                                <Button
                                    variant="outline"
                                    className="gap-2 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors font-semibold"
                                    onClick={logout}
                                >
                                    <LogOut className="w-4 h-4" /> Çıkış Yap
                                </Button>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-lg">
                            Bağımsız akış tasarımlarınızı yönetin. Her proje kendi yerel depolama alanına sahiptir.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 items-end bg-white p-8 rounded-xl border shadow-sm">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Yeni Tasarım Oluştur</label>
                        <Input
                            placeholder="Tasarım/Proje adını giriniz..."
                            value={newProjectName}
                            className="h-11"
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && createProject()}
                        />
                    </div>
                    <Button onClick={createProject} className="gap-2 px-8 h-11 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold">
                        <Plus className="w-4 h-4" /> Yeni Ekle
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Card
                            key={project.id}
                            className="group hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-yellow-400 bg-white"
                            onClick={() => navigate(`/golden-line/editor/${project.id}?name=${encodeURIComponent(project.name)}`)}
                        >
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600 group-hover:bg-yellow-100 transition-colors">
                                        <LayoutPanelTop className="w-8 h-8" />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => deleteProject(project.id, e)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <CardTitle className="mt-6 text-xl text-slate-800">{project.name}</CardTitle>
                                <CardDescription className="text-slate-500">
                                    {format(new Date(project.createdAt), 'dd MMMM yyyy HH:mm')}
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="pt-2 flex justify-end">
                                <div className="flex items-center text-sm font-bold text-yellow-600 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                    Tasarımı Düzenle <ArrowRight className="ml-2 w-4 h-4" />
                                </div>
                            </CardFooter>
                        </Card>
                    ))}

                    {projects.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl bg-white/50 border-slate-200">
                            <LayoutPanelTop className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700">Henüz Tasarım Yok</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                Yukarıdaki formu kullanarak ilk Golden Line akış tasarımınızı oluşturmaya başlayın.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
