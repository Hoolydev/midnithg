'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, ChevronRight, Menu, Moon, Sun } from 'lucide-react';

type Project = Database['public']['Tables']['projects']['Row'];
type Chapter = Database['public']['Tables']['chapters']['Row'];

export default function PublicReadPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [project, setProject] = useState<Project | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        fetchProject();
    }, [projectId]);

    const fetchProject = async () => {
        const supabase = createClient();

        // Fetch project
        const { data: proj, error: projError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (projError || !proj) {
            setLoading(false);
            return; // Handle 404 or private
        }

        setProject(proj);

        // Fetch chapters
        const { data: chaps } = await supabase
            .from('chapters')
            .select('*')
            .eq('project_id', projectId)
            .order('number');

        if (chaps) {
            setChapters(chaps);
            if (chaps.length > 0) setActiveChapter(chaps[0]);
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-paper text-ink flex items-center justify-center">
                <div className="animate-pulse space-y-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto" />
                    <div className="h-4 w-32 bg-gray-200 rounded mx-auto" />
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen flex items-center justify-center text-muted-foreground">
                Projeto não encontrado ou privado.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f5f2] text-[#2c2c2c] font-serif flex">
            {/* Sidebar Navigation */}
            <div
                className={`fixed inset-y-0 left-0 bg-[#f0ede9] border-r border-[#e5e0dc] transition-all duration-300 z-50 ${sidebarOpen ? 'w-80 translate-x-0' : 'w-80 -translate-x-full'
                    }`}
            >
                <div className="p-6 h-full flex flex-col">
                    <div className="mb-8">
                        {project.cover_url ? (
                            <img src={project.cover_url} alt={project.title} className="w-24 h-36 object-cover shadow-md mb-4 rounded-sm" />
                        ) : (
                            <div className="w-24 h-36 bg-[#e5e0dc] flex items-center justify-center mb-4 shadow-inner rounded-sm">
                                <BookOpen className="w-8 h-8 text-[#a8a4a0]" />
                            </div>
                        )}
                        <h1 className="font-bold text-xl leading-tight mb-2">{project.title}</h1>
                        <p className="text-sm text-[#666] italic">{project.genre}</p>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold text-[#888] uppercase tracking-widest mb-4">Sumário</p>
                        <ScrollArea className="h-[calc(100%-2rem)]">
                            <div className="space-y-1">
                                {chapters.map((chap) => (
                                    <button
                                        key={chap.id}
                                        onClick={() => setActiveChapter(chap)}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${activeChapter?.id === chap.id
                                            ? 'bg-white shadow-sm text-black font-medium'
                                            : 'text-[#666] hover:bg-white/50'
                                            }`}
                                    >
                                        <span className="mr-2 opacity-50">#{chap.number}</span>
                                        {chap.title || `Capítulo ${chap.number}`}
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* Toggle Button (Outside when closed) */}
                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="absolute top-4 -right-12 bg-[#f0ede9] p-2 rounded-r-md shadow-md border border-l-0 border-[#e5e0dc]"
                    >
                        <Menu className="w-5 h-5 text-[#666]" />
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
                {/* Top Bar */}
                <header className="sticky top-0 bg-[#f8f5f2]/95 backdrop-blur-sm border-b border-[#ece8e4] px-8 py-4 flex items-center justify-between z-40">
                    <div className="flex items-center gap-4">
                        {sidebarOpen && (
                            <button onClick={() => setSidebarOpen(false)} className="text-[#888] hover:text-[#444]">
                                <ChevronRight className="w-5 h-5 rotate-180" />
                            </button>
                        )}
                        <span className="text-sm font-medium text-[#888]">
                            {activeChapter?.title || `Capítulo ${activeChapter?.number}`}
                        </span>
                    </div>
                    <div className="text-xs text-[#aaa] font-sans">
                        Desenvolvido por Midnight AI
                    </div>
                </header>

                <main className="max-w-3xl mx-auto px-8 py-16">
                    {activeChapter ? (
                        <article className="prose prose-lg prose-stone mx-auto">
                            <h2 className="text-3xl font-bold text-center mb-12 font-serif text-[#1a1a1a]">
                                {activeChapter.title}
                            </h2>
                            <div
                                className="leading-relaxed text-lg"
                                dangerouslySetInnerHTML={{ __html: activeChapter.content || '' }}
                            />
                        </article>
                    ) : (
                        <div className="text-center text-[#888] py-20">
                            Selecione um capítulo para começar a ler.
                        </div>
                    )}

                    {/* Navigation Footer */}
                    {activeChapter && (
                        <div className="mt-20 pt-10 border-t border-[#ece8e4] flex justify-between">
                            <Button
                                variant="ghost"
                                disabled={activeChapter.number <= 1}
                                onClick={() => {
                                    const prev = chapters.find(c => c.number === activeChapter.number - 1);
                                    if (prev) setActiveChapter(prev);
                                }}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="ghost"
                                disabled={activeChapter.number >= chapters.length}
                                onClick={() => {
                                    const next = chapters.find(c => c.number === activeChapter.number + 1);
                                    if (next) setActiveChapter(next);
                                }}
                            >
                                Próximo Capítulo
                            </Button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
