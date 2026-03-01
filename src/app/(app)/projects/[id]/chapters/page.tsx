'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Plus,
    ArrowLeft,
    FileText,
    GripVertical,
    Trash2,
    Edit3,
    PenLine,
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

export default function ChaptersPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchChapters();
    }, [projectId]);

    const fetchChapters = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('chapters')
            .select('*')
            .eq('project_id', projectId)
            .order('number');
        if (data) setChapters(data);
        setLoading(false);
    };

    const handleCreate = async () => {
        setSaving(true);
        const supabase = createClient();
        const nextNumber = chapters.length > 0 ? Math.max(...chapters.map((c) => c.number)) + 1 : 1;

        const { data } = await supabase
            .from('chapters')
            .insert({
                project_id: projectId,
                number: nextNumber,
                title: newTitle || `Capítulo ${nextNumber}`,
                status: 'draft' as ChapterStatus,
                content: '',
            })
            .select()
            .single();

        if (data) {
            setChapters((prev) => [...prev, data]);
        }

        setDialogOpen(false);
        setNewTitle('');
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        const supabase = createClient();
        await supabase.from('chapters').delete().eq('id', id);
        setChapters((prev) => prev.filter((c) => c.id !== id));
    };

    const totalWords = chapters.reduce((sum, c) => sum + c.word_count, 0);

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse max-w-4xl mx-auto">
                <div className="h-8 bg-muted/30 rounded-lg w-48" />
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-muted/20 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href={`/projects/${projectId}`}>
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <FileText className="w-5 h-5 text-burgundy-light" />
                            Capítulos
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {chapters.length} capítulos · {totalWords.toLocaleString()} palavras
                        </p>
                    </div>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-burgundy-gradient hover:opacity-90 text-white gap-2">
                            <Plus className="w-4 h-4" />
                            Adicionar Capítulo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-strong border-burgundy/20 max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="text-foreground flex items-center gap-2">
                                <PenLine className="w-5 h-5 text-burgundy-light" />
                                Novo Capítulo
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Título do Capítulo (opcional)</Label>
                                <Input
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder={`Capítulo ${chapters.length + 1}`}
                                    className="bg-midnight/50 border-burgundy/20"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setDialogOpen(false)}
                                    className="text-muted-foreground"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={saving}
                                    className="bg-burgundy-gradient hover:opacity-90 text-white"
                                >
                                    {saving ? 'Criando...' : 'Criar'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Chapters List */}
            {chapters.length === 0 ? (
                <Card className="glass border-dashed border-burgundy/20">
                    <CardContent className="p-12 text-center">
                        <FileText className="w-10 h-10 text-burgundy-light mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Comece seu primeiro capítulo
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                            Comece a escrever sua história. A IA irá ajudá-lo ao longo do caminho.
                        </p>
                        <Button
                            onClick={() => setDialogOpen(true)}
                            className="bg-burgundy-gradient hover:opacity-90 text-white gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Criar Capítulo 1
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2 stagger-children">
                    {chapters.map((chapter) => (
                        <Card
                            key={chapter.id}
                            onClick={() => router.push(`/projects/${projectId}/chapters/${chapter.id}`)}
                            className="glass border-burgundy/10 hover:border-burgundy/25 transition-all group cursor-pointer"
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="w-4 h-4" />
                                </div>

                                <span className="text-base font-mono text-muted-foreground w-10 shrink-0">
                                    {String(chapter.number).padStart(2, '0')}
                                </span>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-foreground group-hover:text-burgundy-light transition-colors">
                                        {chapter.title || `Capítulo ${chapter.number}`}
                                    </h3>
                                    {chapter.summary && (
                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                            {chapter.summary}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {chapter.word_count.toLocaleString()} palavras
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] capitalize ${statusColors[chapter.status]}`}
                                    >
                                        {statusTranslation[chapter.status] || chapter.status}
                                    </Badge>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); router.push(`/projects/${projectId}/chapters/${chapter.id}`); }}
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(chapter.id)}
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
