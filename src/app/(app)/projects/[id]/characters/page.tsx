'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { GenerateImageDialog } from '@/components/gallery/generate-image-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    ArrowLeft,
    Users,
    Edit3,
    Trash2,
    UserCircle,
} from 'lucide-react';
import type { Character, CharacterRole } from '@/lib/database.types';

const roleColors: Record<string, string> = {
    protagonist: 'bg-burgundy/20 text-burgundy-light border-burgundy/30',
    antagonist: 'bg-red-900/30 text-red-400 border-red-500/30',
    love_interest: 'bg-pink-900/30 text-pink-400 border-pink-500/30',
    supporting: 'bg-purple-deep/30 text-purple-300 border-purple-500/30',
    mentor: 'bg-gold/20 text-gold border-gold/30',
    other: 'bg-muted text-muted-foreground',
};

const roles: { id: CharacterRole; label: string }[] = [
    { id: 'protagonist', label: 'Protagonista' },
    { id: 'antagonist', label: 'Antagonista' },
    { id: 'love_interest', label: 'Interesse Romântico' },
    { id: 'supporting', label: 'Coadjuvante' },
    { id: 'mentor', label: 'Mentor' },
    { id: 'other', label: 'Outro' },
];

const emptyCharacter = {
    name: '',
    age: '',
    personality: '',
    backstory: '',
    role: 'supporting' as CharacterRole,
    appearance: '',
    notes: '',
};

export default function CharactersPage() {
    const params = useParams();
    const projectId = params.id as string;
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Character | null>(null);
    const [form, setForm] = useState(emptyCharacter);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCharacters();
    }, [projectId]);

    const fetchCharacters = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('characters')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at');
        if (data) setCharacters(data);
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const supabase = createClient();

        if (editing) {
            const { data } = await supabase
                .from('characters')
                .update({ ...form })
                .eq('id', editing.id)
                .select()
                .single();
            if (data) {
                setCharacters((prev) => prev.map((c) => (c.id === data.id ? data : c)));
            }
        } else {
            const { data } = await supabase
                .from('characters')
                .insert({ ...form, project_id: projectId })
                .select()
                .single();
            if (data) {
                setCharacters((prev) => [...prev, data]);
            }
        }

        setDialogOpen(false);
        setEditing(null);
        setForm(emptyCharacter);
        setSaving(false);
    };

    const handleEdit = (character: Character) => {
        setEditing(character);
        setForm({
            name: character.name,
            age: character.age || '',
            personality: character.personality || '',
            backstory: character.backstory || '',
            role: character.role,
            appearance: character.appearance || '',
            notes: character.notes || '',
        });
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        const supabase = createClient();
        await supabase.from('characters').delete().eq('id', id);
        setCharacters((prev) => prev.filter((c) => c.id !== id));
    };

    const openNewDialog = () => {
        setEditing(null);
        setForm(emptyCharacter);
        setDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse max-w-4xl mx-auto">
                <div className="h-8 bg-muted/30 rounded-lg w-48" />
                <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-40 bg-muted/20 rounded-xl" />
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
                            <Users className="w-5 h-5 text-burgundy-light" />
                            Personagens
                        </h1>
                        <p className="text-sm text-muted-foreground">{characters.length} personagens</p>
                    </div>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={openNewDialog}
                            className="bg-burgundy-gradient hover:opacity-90 text-white gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar Personagem
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-strong border-burgundy/20 max-w-lg max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-foreground flex items-center gap-2">
                                <UserCircle className="w-5 h-5 text-burgundy-light" />
                                {editing ? 'Editar Personagem' : 'Novo Personagem'}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nome</Label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Nome do personagem"
                                        className="bg-midnight/50 border-burgundy/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Idade</Label>
                                    <Input
                                        value={form.age}
                                        onChange={(e) => setForm({ ...form, age: e.target.value })}
                                        placeholder="ex: 28"
                                        className="bg-midnight/50 border-burgundy/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Papel</Label>
                                <Select
                                    value={form.role}
                                    onValueChange={(v) => setForm({ ...form, role: v as CharacterRole })}
                                >
                                    <SelectTrigger className="bg-midnight/50 border-burgundy/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="glass-strong border-burgundy/20">
                                        {roles.map((r) => (
                                            <SelectItem key={r.id} value={r.id}>
                                                {r.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Personalidade</Label>
                                <Textarea
                                    value={form.personality}
                                    onChange={(e) => setForm({ ...form, personality: e.target.value })}
                                    placeholder="Descreva seus traços de personalidade..."
                                    className="bg-midnight/50 border-burgundy/20 min-h-[80px] resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Aparência</Label>
                                <Textarea
                                    value={form.appearance}
                                    onChange={(e) => setForm({ ...form, appearance: e.target.value })}
                                    placeholder="Descrição física..."
                                    className="bg-midnight/50 border-burgundy/20 min-h-[60px] resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>História de Fundo</Label>
                                <Textarea
                                    value={form.backstory}
                                    onChange={(e) => setForm({ ...form, backstory: e.target.value })}
                                    placeholder="Sua história e antecedentes..."
                                    className="bg-midnight/50 border-burgundy/20 min-h-[80px] resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Notas</Label>
                                <Textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Notas adicionais..."
                                    className="bg-midnight/50 border-burgundy/20 min-h-[60px] resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => setDialogOpen(false)}
                                    className="text-muted-foreground"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={!form.name.trim() || saving}
                                    className="bg-burgundy-gradient hover:opacity-90 text-white"
                                >
                                    {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Characters Grid */}
            {characters.length === 0 ? (
                <Card className="glass border-dashed border-burgundy/20">
                    <CardContent className="p-12 text-center">
                        <Users className="w-10 h-10 text-burgundy-light mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Dê vida aos seus personagens
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                            Crie perfis detalhados de personagens para manter a consistência em toda a sua história.
                        </p>
                        <Button
                            onClick={openNewDialog}
                            className="bg-burgundy-gradient hover:opacity-90 text-white gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Criar Primeiro Personagem
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
                    {characters.map((char) => (
                        <Card
                            key={char.id}
                            className="glass border-burgundy/10 hover:border-burgundy/25 transition-all group"
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="relative mb-3 aspect-square rounded-md overflow-hidden bg-muted/20 group/image">
                                        {char.image_url ? (
                                            <div
                                                className="w-full h-full bg-cover bg-center"
                                                style={{ backgroundImage: `url(${char.image_url})` }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/10">
                                                <UserCircle className="w-12 h-12 opacity-20" />
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity gap-2">
                                            <GenerateImageDialog
                                                projectId={projectId}
                                                characterId={char.id}
                                                initialPrompt={`${char.name}, ${char.role}, ${char.appearance || ''}`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-foreground text-lg">{char.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] capitalize ${roleColors[char.role] || ''}`}
                                            >
                                                {char.role.replace('_', ' ')}
                                            </Badge>
                                            {char.age && (
                                                <span className="text-xs text-muted-foreground">Idade: {char.age}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(char)}
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(char.id)}
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {char.personality && (
                                    <div className="mb-2">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Personalidade</p>
                                        <p className="text-xs text-foreground/80 line-clamp-2">{char.personality}</p>
                                    </div>
                                )}

                                {char.appearance && (
                                    <div className="mb-2">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Aparência</p>
                                        <p className="text-xs text-foreground/80 line-clamp-2">{char.appearance}</p>
                                    </div>
                                )}

                                {char.backstory && (
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">História de Fundo</p>
                                        <p className="text-xs text-foreground/80 line-clamp-2">{char.backstory}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
