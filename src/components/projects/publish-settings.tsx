'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import { Globe, Lock, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PublishSettingsProps {
    projectId: string;
    initialVisibility: 'private' | 'public';
    initialPublishedAt: string | null;
}

export function PublishSettings({ projectId, initialVisibility, initialPublishedAt }: PublishSettingsProps) {
    const [visibility, setVisibility] = useState(initialVisibility);
    const [publishedAt, setPublishedAt] = useState(initialPublishedAt);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const handleToggle = async (checked: boolean) => {
        setLoading(true);
        const newVisibility = checked ? 'public' : 'private';
        const supabase = createClient();

        const updates: any = { visibility: newVisibility };
        if (newVisibility === 'public' && !publishedAt) {
            updates.published_at = new Date().toISOString();
        }

        const { error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', projectId);

        if (!error) {
            setVisibility(newVisibility);
            if (updates.published_at) setPublishedAt(updates.published_at);
            router.refresh();
        } else {
            console.error('Failed to update visibility', error);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={`gap-2 ${visibility === 'public' ? 'text-green-400 border-green-500/30' : ''}`}>
                    {visibility === 'public' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {visibility === 'public' ? 'Publicado' : 'Privado'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-midnight-light border-boring/20">
                <DialogHeader>
                    <DialogTitle>Configurações de Publicação</DialogTitle>
                    <DialogDescription>
                        Controle a visibilidade do seu projeto na rede Midnight AI.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex items-center justify-between space-x-4 rounded-lg border border-border/50 p-4 bg-midnight/30">
                        <div className="space-y-0.5">
                            <Label className="text-base">Visibilidade Pública</Label>
                            <p className="text-sm text-muted-foreground">
                                Permite que qualquer pessoa com o link leia sua história.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                            <Switch
                                checked={visibility === 'public'}
                                onCheckedChange={handleToggle}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {visibility === 'public' && (
                        <div className="space-y-2">
                            <Label>Link Público</Label>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <code className="flex-1 rounded bg-muted/20 px-3 py-2 text-sm text-muted-foreground font-mono break-all sm:truncate">
                                    {typeof window !== 'undefined' ? window.location.origin : ''}/read/{projectId}
                                </code>
                                <Button size="sm" variant="secondary" asChild className="shrink-0 w-full sm:w-auto">
                                    <Link href={`/read/${projectId}`} target="_blank">
                                        <ExternalLink className="w-4 h-4 mr-2 sm:mr-0" />
                                        <span className="sm:hidden">Abrir Link</span>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
