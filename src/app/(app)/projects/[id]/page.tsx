'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExportDialog } from '@/components/projects/export-dialog';
import { PublishSettings } from '@/components/projects/publish-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    BookOpen,
    Users,
    FileText,
    Clock,
    Sparkles,
    Plus,
    Settings,
    BarChart3,
    Target,
    Palette,
    ArrowLeft,
    Check,
    X,
} from 'lucide-react';
import type { Project, Character, Chapter, Event } from '@/lib/database.types';

const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    writing: 'bg-burgundy/20 text-burgundy-light border-burgundy/30',
    review: 'bg-purple-deep/30 text-purple-300 border-purple-500/30',
    complete: 'bg-green-900/30 text-green-400 border-green-500/30',
};

const genres = [
    'Dark Romance',
    'Romance',
    'Fantasia',
    'Suspense',
    'Thriller',
    'Terror',
    'Ficção Científica',
    'Drama',
    'Mistério',
    'Não-Ficção',
    'Outro',
];

const tones = [
    { id: 'dark', label: '🌙 Sombrio e Intenso' },
    { id: 'romantic', label: '💕 Romântico e Apaixonado' },
    { id: 'suspenseful', label: '🔍 Suspense' },
    { id: 'humorous', label: '😄 Leve e Humorístico' },
    { id: 'lyrical', label: '✨ Lírico e Poético' },
    { id: 'gritty', label: '⚡ Cru e Realista' },
];

const statusTranslation: Record<string, string> = {
    draft: 'rascunho',
    writing: 'escrevendo',
    review: 'revisão',
    complete: 'concluído',
};

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const [project, setProject] = useState<Project | null>(null);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditingGenre, setIsEditingGenre] = useState(false);
    const [isEditingTone, setIsEditingTone] = useState(false);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();

            const [projectRes, charsRes, chaptersRes, eventsRes] = await Promise.all([
                supabase.from('projects').select('*').eq('id', projectId).single(),
                supabase.from('characters').select('*').eq('project_id', projectId).order('created_at'),
                supabase.from('chapters').select('*').eq('project_id', projectId).order('number'),
                supabase.from('events').select('*').eq('project_id', projectId).order('timeline_position'),
            ]);

            if (projectRes.data) setProject(projectRes.data);
            if (charsRes.data) setCharacters(charsRes.data);
            if (chaptersRes.data) setChapters(chaptersRes.data);
            if (eventsRes.data) setEvents(eventsRes.data);
            setLoading(false);
        };
        fetchData();
    }, [projectId]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse max-w-6xl mx-auto">
                <div className="h-8 bg-muted/30 rounded-lg w-48" />
                <div className="h-32 bg-muted/20 rounded-xl" />
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-muted/20 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-16">
                <h2 className="text-xl font-semibold text-foreground">Projeto não encontrado</h2>
                <Link href="/dashboard">
                    <Button variant="ghost" className="mt-4 gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar ao Painel
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                    Painel
                </Link>
                <span>/</span>
                <span className="text-foreground">{project.title}</span>
            </div>

            {/* Project Header */}
            <div className="glass-strong rounded-2xl p-6 glow-burgundy">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
                            <Badge variant="outline" className={`capitalize ${statusColors[project.status]}`}>
                                {statusTranslation[project.status] || project.status}
                            </Badge>
                        </div>
                        {project.summary && (
                            <p className="text-sm text-muted-foreground max-w-2xl line-clamp-2">
                                {project.summary}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <ExportDialog projectId={project.id} projectTitle={project.title} />
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                            <Settings className="w-4 h-4" />
                            Configurações
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 group relative">
                    <Target className="w-4 h-4 text-burgundy-light" />
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Gênero</p>
                        {isEditingGenre ? (
                            <div className="flex items-center gap-1 mt-1">
                                <Select value={editValue} onValueChange={setEditValue}>
                                    <SelectTrigger className="h-7 py-0 px-2 text-xs bg-midnight/50 border-burgundy/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="glass-strong border-burgundy/20 text-xs">
                                        {genres.map((g) => (
                                            <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-400" onClick={async () => {
                                    const supabase = createClient();
                                    await supabase.from('projects').update({ genre: editValue }).eq('id', projectId);
                                    setProject({ ...project!, genre: editValue });
                                    setIsEditingGenre(false);
                                }}>
                                    <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => setIsEditingGenre(false)}>
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        ) : (
                            <p
                                className="text-sm font-medium text-foreground capitalize cursor-pointer hover:text-burgundy-light transition-colors"
                                onClick={() => {
                                    setEditValue(project.genre);
                                    setIsEditingGenre(true);
                                }}
                            >
                                {project.genre}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 group relative">
                    <Palette className="w-4 h-4 text-purple-400" />
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Tom</p>
                        {isEditingTone ? (
                            <div className="space-y-2 mt-2">
                                <div className="grid grid-cols-2 gap-2">
                                    {tones.map((t) => {
                                        const selectedTones = editValue ? editValue.split(',') : [];
                                        const isSelected = selectedTones.includes(t.id);
                                        return (
                                            <button
                                                key={t.id}
                                                className={`text-[10px] p-2 rounded-lg border transition-all ${isSelected ? 'bg-burgundy/20 border-burgundy/40 text-burgundy-light' : 'bg-midnight/50 border-border/50 text-muted-foreground'}`}
                                                onClick={() => {
                                                    let newTones;
                                                    if (isSelected) {
                                                        newTones = selectedTones.filter(id => id !== t.id);
                                                    } else {
                                                        newTones = [...selectedTones, t.id];
                                                    }
                                                    setEditValue(newTones.join(','));
                                                }}
                                            >
                                                {t.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center gap-1 justify-end">
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-400" onClick={async () => {
                                        const supabase = createClient();
                                        await supabase.from('projects').update({ tone: editValue }).eq('id', projectId);
                                        setProject({ ...project!, tone: editValue });
                                        setIsEditingTone(false);
                                    }}>
                                        <Check className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => setIsEditingTone(false)}>
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p
                                className="text-sm font-medium text-foreground capitalize cursor-pointer hover:text-burgundy-light transition-colors"
                                onClick={() => {
                                    setEditValue(project.tone || 'dark');
                                    setIsEditingTone(true);
                                }}
                            >
                                {project.tone ? project.tone.split(',').map(id => tones.find(t => t.id === id)?.label.split(' ')[1] || id).join(', ') : 'Não definido'}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gold" />
                    <div>
                        <p className="text-xs text-muted-foreground">Capítulos</p>
                        <p className="text-sm font-medium text-foreground">{chapters.length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-green-400" />
                    <div>
                        <p className="text-xs text-muted-foreground">Palavras</p>
                        <p className="text-sm font-medium text-foreground">
                            {project.word_count.toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <div>
                        <p className="text-xs text-muted-foreground">Personagens</p>
                        <p className="text-sm font-medium text-foreground">{characters.length}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="chapters" className="space-y-4">
                <TabsList className="bg-midnight-lighter border border-border/50 flex-wrap h-auto">
                    <TabsTrigger value="chapters" className="gap-2 data-[state=active]:bg-burgundy/20 data-[state=active]:text-burgundy-light">
                        <FileText className="w-3.5 h-3.5" />
                        Capítulos
                    </TabsTrigger>
                    <TabsTrigger value="characters" className="gap-2 data-[state=active]:bg-burgundy/20 data-[state=active]:text-burgundy-light">
                        <Users className="w-3.5 h-3.5" />
                        Personagens
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="gap-2 data-[state=active]:bg-burgundy/20 data-[state=active]:text-burgundy-light">
                        <Clock className="w-3.5 h-3.5" />
                        Linha do Tempo
                    </TabsTrigger>
                </TabsList>

                {/* Chapters Tab */}
                <TabsContent value="chapters" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-foreground">Capítulos</h2>
                        <Link href={`/projects/${projectId}/chapters`}>
                            <Button size="sm" className="bg-burgundy-gradient hover:opacity-90 text-white gap-2">
                                <Plus className="w-3.5 h-3.5" />
                                Adicionar Capítulo
                            </Button>
                        </Link>
                    </div>

                    {chapters.length === 0 ? (
                        <Card className="glass border-dashed border-burgundy/20">
                            <CardContent className="p-8 text-center">
                                <BookOpen className="w-8 h-8 text-burgundy-light mx-auto mb-3" />
                                <h3 className="font-semibold text-foreground mb-1">Nenhum capítulo ainda</h3>
                                <p className="text-sm text-muted-foreground">
                                    Comece a escrever sua história adicionando o primeiro capítulo.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {chapters.map((chapter) => (
                                <Card key={chapter.id} onClick={() => router.push(`/projects/${projectId}/chapters/${chapter.id}`)} className="glass border-burgundy/10 hover:border-burgundy/25 transition-all cursor-pointer group">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-mono text-muted-foreground w-8">
                                                {String(chapter.number).padStart(2, '0')}
                                            </span>
                                            <div>
                                                <h3 className="font-medium text-foreground group-hover:text-burgundy-light transition-colors">
                                                    {chapter.title || `Capítulo ${chapter.number}`}
                                                </h3>
                                                {chapter.summary && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                        {chapter.summary}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-muted-foreground">
                                                {chapter.word_count.toLocaleString()} palavras
                                            </span>
                                            <Badge variant="outline" className={`text-[10px] ${statusColors[chapter.status]}`}>
                                                {statusTranslation[chapter.status] || chapter.status}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Characters Tab */}
                <TabsContent value="characters" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-foreground">Personagens</h2>
                        <Link href={`/projects/${projectId}/characters`}>
                            <Button size="sm" className="bg-burgundy-gradient hover:opacity-90 text-white gap-2">
                                <Plus className="w-3.5 h-3.5" />
                                Adicionar Personagem
                            </Button>
                        </Link>
                    </div>

                    {characters.length === 0 ? (
                        <Card className="glass border-dashed border-burgundy/20">
                            <CardContent className="p-8 text-center">
                                <Users className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                                <h3 className="font-semibold text-foreground mb-1">Nenhum personagem ainda</h3>
                                <p className="text-sm text-muted-foreground">
                                    Dê vida à sua história criando personagens.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {characters.map((char) => (
                                <Card key={char.id} className="glass border-burgundy/10 hover:border-burgundy/25 transition-all">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-semibold text-foreground">{char.name}</h3>
                                                <Badge variant="outline" className="text-[10px] capitalize mt-1 bg-purple-deep/20 text-purple-300 border-purple-500/30">
                                                    {char.role.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            {char.age && (
                                                <span className="text-xs text-muted-foreground">Idade: {char.age}</span>
                                            )}
                                        </div>
                                        {char.personality && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                                                {char.personality}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Timeline Tab */}
                <TabsContent value="timeline" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-foreground">Linha do Tempo</h2>
                        <Button size="sm" className="bg-burgundy-gradient hover:opacity-90 text-white gap-2">
                            <Plus className="w-3.5 h-3.5" />
                            Adicionar Evento
                        </Button>
                    </div>

                    {events.length === 0 ? (
                        <Card className="glass border-dashed border-burgundy/20">
                            <CardContent className="p-8 text-center">
                                <Clock className="w-8 h-8 text-gold mx-auto mb-3" />
                                <h3 className="font-semibold text-foreground mb-1">Nenhum evento ainda</h3>
                                <p className="text-sm text-muted-foreground">
                                    Acompanhe os principais eventos na linha do tempo da sua história.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="relative pl-6 space-y-4">
                            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-burgundy/20" />
                            {events.map((event) => (
                                <div key={event.id} className="relative">
                                    <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-burgundy border-2 border-background" />
                                    <Card className="glass border-burgundy/10 ml-2">
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Sparkles className="w-3 h-3 text-gold" />
                                                <span className="text-xs text-muted-foreground">
                                                    Posição {event.timeline_position}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground">{event.description}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div >
    );
}
