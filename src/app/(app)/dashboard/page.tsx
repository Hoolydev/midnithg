'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatsCards } from '@/components/dashboard/stats-cards';
import {
    Plus,
    BookOpen,
    PenLine,
    BarChart3,
    Sparkles,
    Clock,
    MoreVertical,
    Trash2,
    Edit3,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Project, Profile } from '@/lib/database.types';

const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    writing: 'bg-burgundy/20 text-burgundy-light border-burgundy/30',
    review: 'bg-purple-deep/30 text-purple-300 border-purple-500/30',
    complete: 'bg-green-900/30 text-green-400 border-green-500/30',
};

const statusTranslation: Record<string, string> = {
    draft: 'rascunho',
    writing: 'escrevendo',
    review: 'revisão',
    complete: 'concluído',
};

const genreEmojis: Record<string, string> = {
    romance: '💕',
    'dark romance': '🖤',
    fantasy: '🐉',
    fantasia: '🐉',
    suspense: '🔍',
    thriller: '🔪',
    horror: '👻',
    terror: '👻',
    'sci-fi': '🚀',
    'ficção científica': '🚀',
    drama: '🎭',
    mystery: '🕵️',
    mistério: '🕵️',
    other: '📚',
    outro: '📚',
};

export default function DashboardPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                const [projectsRes, profileRes] = await Promise.all([
                    supabase
                        .from('projects')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('updated_at', { ascending: false }),
                    supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single(),
                ]);

                if (projectsRes.data) setProjects(projectsRes.data);
                if (profileRes.data) setProfile(profileRes.data);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza de que deseja deletar este projeto permanentemente?')) return;
        const supabase = createClient();
        await supabase.from('projects').delete().eq('id', id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
    };

    const totalWords = projects.reduce((sum, p) => sum + p.word_count, 0);
    const activeProjects = projects.filter((p) => p.status !== 'complete').length;

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-muted/30 rounded-lg w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-28 bg-muted/20 rounded-xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 bg-muted/20 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Bem-vindo de volta
                        {profile?.full_name && (
                            <span className="text-burgundy-light">, {profile.full_name.split(' ')[0]}</span>
                        )}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Seu estúdio de escrita o aguarda
                    </p>
                </div>
                <Link href="/projects/new">
                    <Button className="bg-burgundy-gradient hover:opacity-90 text-white gap-2 shadow-lg shadow-burgundy/20">
                        <Plus className="w-4 h-4" />
                        Novo Projeto
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <StatsCards />

            {/* Projects Grid */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    Seus Projetos
                </h2>
                {projects.length === 0 ? (
                    <Card className="glass border-dashed border-burgundy/20">
                        <CardContent className="p-12 text-center">
                            <div className="inline-flex p-4 rounded-2xl bg-burgundy/10 mb-4">
                                <BookOpen className="w-8 h-8 text-burgundy-light" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Sua história começa aqui
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                                Crie seu primeiro projeto e deixe o Midnight AI ajudar você a criar uma narrativa cativante.
                            </p>
                            <Link href="/projects/new">
                                <Button className="bg-burgundy-gradient hover:opacity-90 text-white gap-2">
                                    <Plus className="w-4 h-4" />
                                    Criar Primeiro Projeto
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                        {projects.map((project) => (
                            <Link key={project.id} href={`/projects/${project.id}`}>
                                <Card className="glass border-burgundy/10 hover:border-burgundy/30 hover:glow-burgundy transition-all duration-500 cursor-pointer group h-full overflow-hidden relative">
                                    {project.cover_url && (
                                        <div 
                                            className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity bg-cover bg-center -z-0"
                                            style={{ backgroundImage: `url(${project.cover_url})` }}
                                        />
                                    )}
                                    <CardContent className="p-5 flex flex-col h-full relative z-10">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">
                                                    {genreEmojis[project.genre.toLowerCase()] || '📚'}
                                                </span>
                                                <div>
                                                    <h3 className="font-semibold text-foreground group-hover:text-burgundy-light transition-colors line-clamp-1">
                                                        {project.title}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground capitalize">
                                                        {project.genre}
                                                    </p>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    onClick={(e) => e.preventDefault()}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-muted"
                                                >
                                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="glass-strong border-burgundy/20"
                                                >
                                                    <DropdownMenuItem className="gap-2 cursor-pointer">
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleDelete(project.id);
                                                        }}
                                                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {project.summary && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
                                                {project.summary}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] capitalize ${statusColors[project.status] || ''}`}
                                                >
                                                    {statusTranslation[project.status] || project.status}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {project.word_count.toLocaleString()} palavras
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                {new Date(project.updated_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
