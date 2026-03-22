'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Settings,
    User,
    Sparkles,
    Save,
    Check,
    Loader2,
} from 'lucide-react';
import type { Profile } from '@/lib/database.types';

export default function SettingsPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [fullName, setFullName] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setProfile(data);
                    setFullName(data.full_name || '');
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        setSaved(false);

        const supabase = createClient();
        const { error } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', profile.id);

        if (!error) {
            setProfile({ ...profile, full_name: fullName });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
        setSaving(false);
    };

    const planLabels: Record<string, string> = {
        free: 'Gratuito',
        pro: 'Pro',
        creator: 'Creator',
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse max-w-2xl mx-auto">
                <div className="h-8 bg-muted/30 rounded-lg w-48" />
                <div className="h-48 bg-muted/20 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Settings className="w-6 h-6 text-burgundy-light" />
                    Configurações
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Gerencie seu perfil e preferências
                </p>
            </div>

            {/* Profile Card */}
            <Card className="glass border-burgundy/10">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4 text-burgundy-light" />
                        Perfil
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nome Completo</Label>
                        <Input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Seu nome..."
                            className="bg-midnight/50 border-border/50"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Plano:</span>
                            <Badge variant="outline" className="bg-burgundy/10 text-burgundy-light border-burgundy/30">
                                {planLabels[profile?.plan || 'free'] || profile?.plan}
                            </Badge>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            size="sm"
                            className="bg-burgundy-gradient hover:opacity-90 text-white gap-2"
                        >
                            {saving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : saved ? (
                                <Check className="w-3.5 h-3.5" />
                            ) : (
                                <Save className="w-3.5 h-3.5" />
                            )}
                            {saved ? 'Salvo!' : 'Salvar'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Plan Card */}
            <Card className="glass border-burgundy/10">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-gold" />
                        Plano & Créditos
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-midnight/30 border border-border/50">
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                {planLabels[profile?.plan || 'free'] || profile?.plan}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {profile?.credits || 0} créditos restantes
                            </p>
                        </div>
                        <Button
                            size="sm"
                            className="bg-burgundy-gradient hover:opacity-90 text-white gap-2"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Upgrade
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
