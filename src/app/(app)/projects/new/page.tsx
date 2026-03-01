'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    BookOpen,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Check,
    FileText,
} from 'lucide-react';
import { ManuscriptUpload } from '@/components/projects/manuscript-upload';

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

const classifications = [
    { id: 'adult', label: 'Adulto 18+', description: 'Conteúdo maduro' },
    { id: 'young_adult', label: 'Jovem Adulto', description: '14–17 anos' },
    { id: 'general', label: 'Geral', description: 'Todos os públicos' },
];

const tones = [
    { id: 'dark', label: '🌙 Sombrio e Intenso' },
    { id: 'romantic', label: '💕 Romântico e Apaixonado' },
    { id: 'suspenseful', label: '🔍 Suspense' },
    { id: 'humorous', label: '😄 Leve e Humorístico' },
    { id: 'lyrical', label: '✨ Lírico e Poético' },
    { id: 'gritty', label: '⚡ Cru e Realista' },
];

const structures = [
    {
        id: 'three_acts',
        label: 'Estrutura de Três Atos',
        description: 'Introdução → Confronto → Resolução',
    },
    {
        id: 'heros_journey',
        label: 'Jornada do Herói',
        description: '12 estágios de transformação',
    },
    {
        id: 'free_form',
        label: 'Forma Livre',
        description: 'Sem estrutura predefinida',
    },
    {
        id: 'seven_point',
        label: 'Estrutura de Sete Pontos',
        description: 'Do Gancho à Resolução em 7 pontos',
    },
];

const creationModes = [
    { id: 'scratch', label: 'Começar do Zero', description: 'Crie seu projeto passo a passo', icon: BookOpen },
    { id: 'import', label: 'Importar Manuscrito', description: 'Traga sua obra já iniciada', icon: FileText },
];

export default function NewProjectPage() {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        genre: 'Dark Romance',
        classification: 'adult',
        target_audience: '',
        tone: 'dark',
        structure: 'three_acts',
        summary: '',
        manuscriptContent: '',
    });
    const [creationMode, setCreationMode] = useState<'scratch' | 'import' | null>(null);
    const router = useRouter();

    const steps = [
        { title: 'Título e Gênero', subtitle: 'Nomeie sua obra-prima' },
        { title: 'Público e Tom', subtitle: 'Defina o clima' },
        { title: 'Estrutura', subtitle: 'Escolha seu framework' },
        { title: 'Resumo', subtitle: 'Descreva sua visão' },
    ];

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            const { manuscriptContent, ...projectData } = formData;
            const { data, error } = await supabase
                .from('projects')
                .insert({
                    ...projectData,
                    user_id: user.id,
                    status: 'draft',
                })
                .select()
                .single();

            if (error) throw error;

            // If there is manuscript content, create a first chapter with it
            if (manuscriptContent) {
                await supabase.from('chapters').insert({
                    project_id: data.id,
                    number: 1,
                    title: 'Manuscrito Importado',
                    content: manuscriptContent,
                    status: 'writing',
                });
            }

            router.push(`/projects/${data.id}`);
        } catch (err) {
            console.error('Failed to create project:', err);
            alert('Erro ao criar projeto. Por favor, tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 0:
                return formData.title.trim().length > 0;
            case 1:
                return true;
            case 2:
                return true;
            case 3:
                return true;
            default:
                return false;
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex p-3 rounded-2xl bg-burgundy/15 mb-4 glow-burgundy">
                    <BookOpen className="w-6 h-6 text-burgundy-light" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Criar Novo Projeto</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {creationMode ? steps[step].subtitle : 'Como você deseja começar?'}
                </p>
            </div>

            {!creationMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
                    {creationModes.map((mode) => {
                        const Icon = mode.icon;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => setCreationMode(mode.id as 'scratch' | 'import')}
                                className="glass-strong p-8 rounded-2xl border border-burgundy/10 hover:border-burgundy/30 hover:glow-burgundy transition-all text-center space-y-4 group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-burgundy/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                    <Icon className="w-6 h-6 text-burgundy-light" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground">{mode.label}</h3>
                                    <p className="text-sm text-muted-foreground">{mode.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <>
                    {/* Progress */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {steps.map((s, i) => (
                            <div key={s.title} className="flex items-center gap-2">
                                <button
                                    onClick={() => i < step && setStep(i)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${i < step
                                        ? 'bg-burgundy text-white'
                                        : i === step
                                            ? 'bg-burgundy/20 text-burgundy-light border border-burgundy/40'
                                            : 'bg-muted text-muted-foreground'
                                        }`}
                                >
                                    {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                                </button>
                                {i < steps.length - 1 && (
                                    <div
                                        className={`w-12 h-0.5 transition-colors duration-300 ${i < step ? 'bg-burgundy' : 'bg-muted'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="glass-strong rounded-2xl p-8 glow-burgundy animate-fade-in-up">
                        {step === 0 && (
                            <div className="space-y-6">
                                {creationMode === 'import' && !formData.manuscriptContent && (
                                    <div className="mb-6">
                                        <ManuscriptUpload
                                            onUploadSuccess={(content: string, fileName: string) => {
                                                setFormData({
                                                    ...formData,
                                                    manuscriptContent: content,
                                                    title: fileName.split('.')[0]
                                                });
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>Título do Livro</Label>
                                    <Input
                                        placeholder="Digite o título do seu livro..."
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData({ ...formData, title: e.target.value })
                                        }
                                        className="bg-midnight/50 border-burgundy/20 focus:border-burgundy/50 h-12 text-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gênero</Label>
                                    <Select
                                        value={formData.genre}
                                        onValueChange={(v) =>
                                            setFormData({ ...formData, genre: v })
                                        }
                                    >
                                        <SelectTrigger className="bg-midnight/50 border-burgundy/20 h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="glass-strong border-burgundy/20">
                                            {genres.map((g) => (
                                                <SelectItem key={g} value={g}>
                                                    {g}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label>Classificação</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {classifications.map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() =>
                                                    setFormData({ ...formData, classification: c.id })
                                                }
                                                className={`p-3 rounded-xl border text-left transition-all duration-300 ${formData.classification === c.id
                                                    ? 'border-burgundy/40 bg-burgundy/10'
                                                    : 'border-border/50 hover:border-border'
                                                    }`}
                                            >
                                                <p className="text-sm font-semibold text-foreground">
                                                    {c.label}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                    {c.description}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Público-Alvo</Label>
                                    <Input
                                        placeholder="ex: Mulheres 18-35 que amam romance sombrio"
                                        value={formData.target_audience}
                                        onChange={(e) =>
                                            setFormData({ ...formData, target_audience: e.target.value })
                                        }
                                        className="bg-midnight/50 border-burgundy/20 focus:border-burgundy/50"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label>Tom Narrativo</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {tones.map((t) => {
                                            const selectedTones = formData.tone ? formData.tone.split(',') : [];
                                            const isSelected = selectedTones.includes(t.id);

                                            return (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => {
                                                        let newTones;
                                                        if (isSelected) {
                                                            newTones = selectedTones.filter(id => id !== t.id);
                                                        } else {
                                                            newTones = [...selectedTones, t.id];
                                                        }
                                                        setFormData({ ...formData, tone: newTones.join(',') });
                                                    }}
                                                    className={`p-3 rounded-xl border text-left transition-all duration-300 ${isSelected
                                                        ? 'border-burgundy/40 bg-burgundy/10'
                                                        : 'border-border/50 hover:border-border'
                                                        }`}
                                                >
                                                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <Label>Estrutura da História</Label>
                                <div className="space-y-3">
                                    {structures.map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() =>
                                                setFormData({ ...formData, structure: s.id })
                                            }
                                            className={`w-full p-4 rounded-xl border text-left transition-all duration-300 ${formData.structure === s.id
                                                ? 'border-burgundy/40 bg-burgundy/10 glow-burgundy'
                                                : 'border-border/50 hover:border-border'
                                                }`}
                                        >
                                            <p className="text-sm font-semibold text-foreground">
                                                {s.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {s.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Resumo do Projeto</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Descreva a trama central da sua história. Isso ajuda a IA a entender sua visão.
                                    </p>
                                    <Textarea
                                        placeholder="Uma história de amor sombria ambientada em uma cidade distópica onde..."
                                        value={formData.summary}
                                        onChange={(e) =>
                                            setFormData({ ...formData, summary: e.target.value })
                                        }
                                        className="bg-midnight/50 border-burgundy/20 focus:border-burgundy/50 min-h-[160px] resize-none"
                                    />
                                </div>

                                {/* Summary Card */}
                                <div className="p-4 rounded-xl bg-midnight/50 border border-border/50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-4 h-4 text-gold" />
                                        <span className="text-sm font-semibold text-gold">Visão Geral do Projeto</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Título:</span>{' '}
                                            <span className="text-foreground font-medium">{formData.title}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Gênero:</span>{' '}
                                            <span className="text-foreground font-medium">{formData.genre}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Tom:</span>{' '}
                                            <span className="text-foreground font-medium capitalize">
                                                {formData.tone ? formData.tone.split(',').map(id => tones.find(t => t.id === id)?.label.split(' ')[1]).join(', ') : 'Nenhum'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Estrutura:</span>{' '}
                                            <span className="text-foreground font-medium">
                                                {structures.find((s) => s.id === formData.structure)?.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    if (step === 0) {
                                        setCreationMode(null);
                                    } else {
                                        setStep(step - 1);
                                    }
                                }}
                                className="gap-2 text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </Button>

                            {step < steps.length - 1 ? (
                                <Button
                                    onClick={() => setStep(step + 1)}
                                    disabled={!canProceed()}
                                    className="bg-burgundy-gradient hover:opacity-90 text-white gap-2"
                                >
                                    Próximo
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="bg-burgundy-gradient hover:opacity-90 text-white gap-2 shadow-lg shadow-burgundy/20"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Criando...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Criar Projeto
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
