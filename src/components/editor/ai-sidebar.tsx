'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Sparkles,
    PenLine,
    MessageSquare,
    Palette,
    RefreshCw,
    Send,
    Copy,
    Plus,
    X,
    Loader2,
    ChevronRight,
    ChevronLeft,
    Wand2,
    Image as ImageIcon,
} from 'lucide-react';
import { GenerateImageDialog } from '@/components/gallery/generate-image-dialog';

interface AISidebarProps {
    projectId: string;
    currentText: string;
    selectedText?: string;
    onInsert: (text: string) => void;
    isOpen: boolean;
    onToggle: () => void;
}

type AIMode = 'continue' | 'rewrite' | 'dialogue' | 'describe' | 'freeform';

const quickActions: { mode: AIMode; label: string; icon: React.FC<{ className?: string }>; description: string }[] = [
    { mode: 'continue', label: 'Continuar Escrevendo', icon: PenLine, description: 'Continue de onde parou' },
    { mode: 'dialogue', label: 'Escrever Diálogo', icon: MessageSquare, description: 'Gere diálogos entre personagens' },
    { mode: 'describe', label: 'Descrever Cena', icon: Palette, description: 'Crie descrições vívidas' },
    { mode: 'rewrite', label: 'Reescrever', icon: RefreshCw, description: 'Melhore o texto selecionado' },
];

export function AISidebar({
    projectId,
    currentText,
    selectedText,
    onInsert,
    isOpen,
    onToggle,
}: AISidebarProps) {
    const [freeformPrompt, setFreeformPrompt] = useState('');
    const [generatedText, setGeneratedText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const outputRef = useRef<HTMLDivElement>(null);

    const handleGenerate = async (mode: AIMode, prompt?: string) => {
        if (isGenerating) {
            abortRef.current?.abort();
            setIsGenerating(false);
            return;
        }

        setIsGenerating(true);
        setGeneratedText('');
        setError(null);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    mode,
                    prompt: prompt || freeformPrompt || '',
                    currentText,
                    selectedText,
                }),
                signal: controller.signal,
            });

            if (!res.ok) {
                const errData = await res.json();
                setError(errData.error || 'Erro ao gerar texto');
                setIsGenerating(false);
                return;
            }

            const reader = res.body?.getReader();
            if (!reader) {
                setError('Erro de streaming');
                setIsGenerating(false);
                return;
            }

            const decoder = new TextDecoder();
            let accumulated = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulated += chunk;
                setGeneratedText(accumulated);

                // Auto-scroll output
                if (outputRef.current) {
                    outputRef.current.scrollTop = outputRef.current.scrollHeight;
                }
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                setError('Erro de conexão com a API');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedText);
    };

    const handleInsert = () => {
        onInsert(generatedText);
        setGeneratedText('');
    };

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1 px-2 py-4 bg-burgundy/20 border border-burgundy/30 border-r-0 rounded-l-xl text-burgundy-light hover:bg-burgundy/30 transition-all"
            >
                <Sparkles className="w-4 h-4" />
                <ChevronLeft className="w-3 h-3" />
            </button>
        );
    }

    return (
        <div className="w-[380px] shrink-0 h-full border-l border-border/50 bg-midnight-light/80 backdrop-blur-xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span className="text-sm font-semibold text-foreground">Assistente de IA</span>
                    <Badge variant="outline" className="text-[9px] bg-burgundy/10 text-burgundy-light border-burgundy/30">
                        Grok
                    </Badge>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-3 border-b border-border/30 space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ações Rápidas</p>
                <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.mode}
                                onClick={() => handleGenerate(action.mode)}
                                disabled={isGenerating}
                                className="flex flex-col items-start gap-1 p-2.5 rounded-lg border border-border/30 bg-midnight/50 hover:border-burgundy/30 hover:bg-burgundy/5 transition-all text-left group disabled:opacity-50"
                            >
                                <Icon className="w-3.5 h-3.5 text-burgundy-light group-hover:text-burgundy-light" />
                                <span className="text-xs font-medium text-foreground">{action.label}</span>
                                <span className="text-[10px] text-muted-foreground leading-tight">{action.description}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Freeform Prompt */}
            <div className="px-4 py-3 border-b border-border/30">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Prompt Livre</p>
                <div className="relative">
                    <textarea
                        value={freeformPrompt}
                        onChange={(e) => setFreeformPrompt(e.target.value)}
                        placeholder="Ex: Escreva uma cena de tensão entre..."
                        rows={3}
                        className="w-full rounded-lg border border-border/30 bg-midnight/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-burgundy/40 resize-none"
                    />
                    <Button
                        onClick={() => handleGenerate('freeform')}
                        disabled={!freeformPrompt.trim() || isGenerating}
                        size="sm"
                        className="absolute bottom-2 right-2 h-7 bg-burgundy-gradient hover:opacity-90 text-white gap-1 px-2.5"
                    >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    </Button>
                </div>
            </div>

            {/* Output */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {error && (
                    <div className="mx-4 mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30">
                        <p className="text-xs text-destructive">{error}</p>
                    </div>
                )}

                {(generatedText || isGenerating) && (
                    <div className="flex-1 flex flex-col px-4 py-3 overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                {isGenerating ? 'Gerando...' : 'Resultado'}
                            </p>
                            {isGenerating && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => abortRef.current?.abort()}
                                    className="h-6 text-[10px] text-destructive hover:text-destructive"
                                >
                                    <X className="w-3 h-3 mr-1" />
                                    Parar
                                </Button>
                            )}
                        </div>

                        <div
                            ref={outputRef}
                            className="flex-1 overflow-y-auto rounded-lg border border-border/30 bg-midnight/50 p-3"
                        >
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                {generatedText}
                                {isGenerating && <span className="ai-cursor">▊</span>}
                            </p>
                        </div>

                        {generatedText && !isGenerating && (
                            <div className="flex gap-2 mt-3">
                                <Button
                                    onClick={handleInsert}
                                    size="sm"
                                    className="flex-1 bg-burgundy-gradient hover:opacity-90 text-white gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Inserir no Editor
                                </Button>
                                <Button
                                    onClick={handleCopy}
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 border-border/50 text-muted-foreground hover:text-foreground"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    Copiar
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {!generatedText && !isGenerating && !error && (
                    <div className="flex-1 flex items-center justify-center px-4">
                        <Card className="glass border-dashed border-burgundy/15 w-full">
                            <CardContent className="p-6 text-center space-y-4">
                                <Sparkles className="w-8 h-8 text-burgundy-light/50 mx-auto mb-3" />
                                {/* Visuals Section */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visuals</h4>
                                    <GenerateImageDialog
                                        projectId={projectId}
                                        initialPrompt={currentText ? (currentText.length > 200 ? currentText.substring(0, 200) + '...' : currentText) : ''}
                                        onImageSaved={(url) => onInsert(`<img src="${url}" alt="AI Illustration" class="rounded-lg my-4 max-w-full" />`)}
                                        trigger={
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start gap-2 h-auto py-2 border-burgundy/20 hover:bg-burgundy/10 hover:text-burgundy-light"
                                            >
                                                <ImageIcon className="w-4 h-4 text-burgundy" />
                                                <div className="flex flex-col items-start text-left">
                                                    <span className="text-sm font-medium">Desenhar Cena</span>
                                                    <span className="text-[10px] text-muted-foreground">Gerar ilustração para o contexto</span>
                                                </div>
                                            </Button>
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        Use uma ação rápida ou escreva um prompt para gerar texto com IA.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
