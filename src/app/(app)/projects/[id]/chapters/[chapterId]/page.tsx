'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { TipTapEditor } from '@/components/editor/tiptap-editor';
import { AISidebar } from '@/components/editor/ai-sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft,
    Save,
    Check,
    Loader2,
    Sparkles,
    BarChart3,
} from 'lucide-react';
import type { Chapter, ChapterStatus } from '@/lib/database.types';

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

export default function ChapterEditorPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const chapterId = params.chapterId as string;

    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved');
    const [aiOpen, setAiOpen] = useState(false);

    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pendingSaveRef = useRef<{ content: string; wordCount: number; title: string } | null>(null);

    // Load chapter
    useEffect(() => {
        const load = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('chapters')
                .select('*')
                .eq('id', chapterId)
                .single();

            if (data) {
                setChapter(data);
                setTitle(data.title || `Capítulo ${data.number}`);
                setContent(data.content || '');
                setWordCount(data.word_count);
            }
            setLoading(false);
        };
        load();
    }, [chapterId]);

    // Save function
    const saveToDb = useCallback(async (saveData: { content: string; wordCount: number; title: string }) => {
        setSaveState('saving');
        const supabase = createClient();

        const updates: Record<string, unknown> = {
            content: saveData.content,
            word_count: saveData.wordCount,
            title: saveData.title,
        };

        // Auto set status to 'writing' if user has typed content
        if (saveData.wordCount > 0 && chapter?.status === 'draft') {
            updates.status = 'writing';
        }

        const { error } = await supabase
            .from('chapters')
            .update(updates)
            .eq('id', chapterId);

        if (!error) {
            setSaveState('saved');
        }
    }, [chapterId, chapter?.status]);

    // Debounced auto-save
    const scheduleAutoSave = useCallback((html: string, words: number) => {
        setContent(html);
        setWordCount(words);
        setSaveState('unsaved');

        pendingSaveRef.current = { content: html, wordCount: words, title };

        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        saveTimerRef.current = setTimeout(() => {
            if (pendingSaveRef.current) {
                saveToDb(pendingSaveRef.current);
            }
        }, 2000);
    }, [saveToDb, title]);

    // Title change with debounced save
    const handleTitleChange = useCallback((newTitle: string) => {
        setTitle(newTitle);
        setSaveState('unsaved');

        pendingSaveRef.current = { content, wordCount, title: newTitle };

        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        saveTimerRef.current = setTimeout(() => {
            if (pendingSaveRef.current) {
                saveToDb(pendingSaveRef.current);
            }
        }, 2000);
    }, [content, wordCount, saveToDb]);

    // Manual save
    const handleManualSave = useCallback(() => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }
        saveToDb({ content, wordCount, title });
    }, [content, wordCount, title, saveToDb]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
            // Save any pending changes on unmount
            if (pendingSaveRef.current) {
                const supabase = createClient();
                supabase
                    .from('chapters')
                    .update({
                        content: pendingSaveRef.current.content,
                        word_count: pendingSaveRef.current.wordCount,
                        title: pendingSaveRef.current.title,
                    })
                    .eq('id', chapterId)
                    .then(() => { });
            }
        };
    }, [chapterId]);

    // Insert AI-generated text
    const handleAIInsert = useCallback((text: string) => {
        const insertFn = (window as unknown as Record<string, unknown>).__tiptapInsert as ((t: string) => void) | undefined;
        if (insertFn) {
            insertFn(text);
        }
    }, []);

    // Keyboard shortcut: Ctrl+S
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleManualSave();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleManualSave]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-burgundy-light animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Carregando capítulo...</p>
                </div>
            </div>
        );
    }

    if (!chapter) {
        return (
            <div className="text-center py-16">
                <h2 className="text-xl font-semibold text-foreground">Capítulo não encontrado</h2>
                <Link href={`/projects/${projectId}/chapters`}>
                    <Button variant="ghost" className="mt-4 gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Capítulos
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-64px)] -m-6 overflow-hidden">
            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-midnight-lighter/30">
                    <div className="flex items-center gap-3">
                        <Link href={`/projects/${projectId}/chapters`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">
                                Cap. {String(chapter.number).padStart(2, '0')}
                            </span>
                            <Input
                                value={title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                className="h-8 border-none bg-transparent text-foreground font-semibold text-sm focus-visible:ring-0 focus-visible:ring-offset-0 px-1 w-auto min-w-[200px]"
                                placeholder="Título do capítulo..."
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Word Count */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            < BarChart3 className="w-3.5 h-3.5" />
                            <span className="tabular-nums">{wordCount.toLocaleString()} palavras</span>
                        </div>

                        {/* Status Badge */}
                        <Badge
                            variant="outline"
                            className={`text-[10px] capitalize ${statusColors[chapter.status]}`}
                        >
                            {statusTranslation[chapter.status] || chapter.status}
                        </Badge>

                        {/* Save State */}
                        <div className="flex items-center gap-1.5 text-xs">
                            {saveState === 'saving' && (
                                <>
                                    <Loader2 className="w-3 h-3 text-burgundy-light animate-spin" />
                                    <span className="text-muted-foreground">Salvando...</span>
                                </>
                            )}
                            {saveState === 'saved' && (
                                <>
                                    <Check className="w-3 h-3 text-green-400" />
                                    <span className="text-green-400/80">Salvo</span>
                                </>
                            )}
                            {saveState === 'unsaved' && (
                                <button
                                    onClick={handleManualSave}
                                    className="flex items-center gap-1 text-gold hover:text-gold-light transition-colors"
                                >
                                    <Save className="w-3 h-3" />
                                    <span>Não salvo</span>
                                </button>
                            )}
                        </div>

                        {/* AI Toggle */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAiOpen(!aiOpen)}
                            className={`h-8 gap-1.5 text-xs ${aiOpen
                                ? 'bg-burgundy/20 text-burgundy-light'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            AI
                        </Button>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto py-4 px-4">
                        <TipTapEditor
                            content={content}
                            onChange={scheduleAutoSave}
                        />
                    </div>
                </div>
            </div>

            {/* AI Sidebar */}
            {aiOpen && (
                <AISidebar
                    projectId={projectId}
                    chapterId={chapterId}
                    currentText={content}
                    onInsert={handleAIInsert}
                    isOpen={aiOpen}
                    onToggle={() => setAiOpen(false)}
                />
            )}
        </div>
    );
}
