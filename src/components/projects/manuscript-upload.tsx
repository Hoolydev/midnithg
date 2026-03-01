'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ManuscriptUploadProps {
    onUploadSuccess: (content: string, fileName: string) => void;
}

export function ManuscriptUpload({ onUploadSuccess }: ManuscriptUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFile = async (file: File) => {
        if (!file) return;

        const allowedTypes = [
            'text/plain',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.docx')) {
            alert('Apenas arquivos .txt, .docx ou .pdf são permitidos.');
            return;
        }

        setIsProcessing(true);
        setFileName(file.name);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/manuscript/process', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                throw new Error('Falha ao processar o manuscrito');
            }

            const data = await res.json();
            onUploadSuccess(data.content, file.name);
        } catch (error) {
            console.error('Error processing manuscript:', error);
            alert('Erro ao processar o arquivo. Tente novamente.');
            setFileName(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center ${isDragging
                    ? 'border-burgundy bg-burgundy/5 scale-[1.02]'
                    : fileName
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-border/50 hover:border-burgundy/30 hover:bg-muted/30'
                }`}
        >
            {isProcessing ? (
                <div className="space-y-4">
                    <Loader2 className="w-10 h-10 text-burgundy-light animate-spin mx-auto" />
                    <p className="text-sm font-medium text-foreground">Processando seu manuscrito...</p>
                </div>
            ) : fileName ? (
                <div className="space-y-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                        <Check className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">{fileName}</p>
                        <p className="text-xs text-muted-foreground mt-1">Carregado com sucesso!</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFileName(null)}
                        className="text-muted-foreground hover:text-destructive"
                    >
                        <X className="w-3.5 h-3.5 mr-2" />
                        Remover
                    </Button>
                </div>
            ) : (
                <>
                    <div className="w-12 h-12 rounded-2xl bg-burgundy/10 flex items-center justify-center mb-4">
                        <Upload className="w-6 h-6 text-burgundy-light" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Importar Manuscrito</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mb-6">
                        Arraste seu arquivo ou clique para selecionar. Aceitamos .txt e .docx.
                    </p>
                    <input
                        type="file"
                        id="manuscript-upload"
                        className="hidden"
                        accept=".txt,.docx,.pdf"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFile(file);
                        }}
                    />
                    <Button
                        onClick={() => document.getElementById('manuscript-upload')?.click()}
                        variant="outline"
                        className="border-burgundy/20 hover:bg-burgundy/10 hover:text-burgundy-light"
                    >
                        Selecionar Arquivo
                    </Button>
                </>
            )}
        </div>
    );
}
