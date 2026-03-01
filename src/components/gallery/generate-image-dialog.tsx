'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/storage';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import { Loader2, Image as ImageIcon, Sparkles, Download, Save } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface GenerateImageDialogProps {
    trigger?: React.ReactNode;
    projectId: string;
    characterId?: string; // If generating for a specific character
    initialPrompt?: string;
    onImageSaved?: (url: string) => void;
}

export function GenerateImageDialog({
    trigger,
    projectId,
    characterId,
    initialPrompt = '',
    onImageSaved,
}: GenerateImageDialogProps) {
    const [open, setOpen] = useState(false);
    const [prompt, setPrompt] = useState(initialPrompt);
    const [style, setStyle] = useState('cinematic');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    const handleGenerate = async () => {
        if (!prompt) return;

        setGenerating(true);
        setGeneratedImage(null);

        try {
            const res = await fetch('/api/ai/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, style, projectId }),
            });

            const data = await res.json();

            if (data.b64_json) {
                setGeneratedImage(`data:image/png;base64,${data.b64_json}`);
            } else if (data.url) {
                setGeneratedImage(data.url);
            }
        } catch (error) {
            console.error('Failed to generate:', error);
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!generatedImage) return;

        setSaving(true);
        try {
            // 1. Convert Base64 to Blob
            const res = await fetch(generatedImage);
            const blob = await res.blob();
            const file = new File([blob], `gen-${Date.now()}.png`, { type: 'image/png' });

            // 2. Upload to Storage
            const path = `${projectId}/${Date.now()}.png`;
            const publicUrl = await uploadImage(file, 'images', path);

            if (!publicUrl) throw new Error('Upload failed');

            // 3. Save to DB (images table)
            const supabase = createClient();
            const { error } = await supabase.from('images').insert({
                project_id: projectId,
                character_id: characterId || null,
                prompt_used: prompt,
                style,
                url: publicUrl,
            });

            if (error) throw error;

            // Update character profile image if applicable
            if (characterId) {
                const { error: charError } = await supabase
                    .from('characters')
                    .update({ image_url: publicUrl })
                    .eq('id', characterId);

                if (charError) console.error('Failed to update character profile:', charError);
            }

            if (onImageSaved) onImageSaved(publicUrl);
            setOpen(false);
            router.refresh(); // Refresh to show new image
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        Gerar Imagem
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-midnight-light border-boring border-opacity-20 text-foreground">
                <DialogHeader>
                    <DialogTitle>Gerar Ilustração por IA</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Prompt Input */}
                    <div className="space-y-2">
                        <Label>Prompt</Label>
                        <Textarea
                            placeholder="Descreva o personagem ou cena..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="bg-midnight-lighter border-none resize-none focus-visible:ring-burgundy"
                        />
                    </div>

                    {/* Style Selection */}
                    <div className="space-y-2">
                        <Label>Estilo</Label>
                        <Select value={style} onValueChange={setStyle}>
                            <SelectTrigger className="bg-midnight-lighter border-none">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-midnight-lighter border-burgundy/20">
                                <SelectItem value="cinematic">Cinemático</SelectItem>
                                <SelectItem value="anime">Anime / Ghibli</SelectItem>
                                <SelectItem value="oil-painting">Pintura a Óleo</SelectItem>
                                <SelectItem value="watercolor">Aquarela</SelectItem>
                                <SelectItem value="sketch">Esboço</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={generating || !prompt}
                        className="w-full bg-gradient-to-r from-burgundy to-purple-deep hover:opacity-90 transition-opacity"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sonhando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Gerar
                            </>
                        )}
                    </Button>

                    {/* Preview Area */}
                    {generatedImage && (
                        <div className="relative aspect-square rounded-lg overflow-hidden border border-border/50 group mt-4">
                            <Image
                                src={generatedImage}
                                alt="Generated preview"
                                fill
                                className="object-cover"
                            />
                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-green-600 hover:bg-green-700 text-white border-none"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Salvar
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
