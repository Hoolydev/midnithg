'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Download, FileText, BookOpen, Loader2 } from 'lucide-react';
import { generatePDF } from '@/lib/exports/pdf-generator';

interface ExportDialogProps {
    projectId: string;
    projectTitle: string;
}

export function ExportDialog({ projectId, projectTitle }: ExportDialogProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            await generatePDF(projectId, projectTitle);
        } catch (error) {
            console.error('Export failed:', error);
            // In a real app, show a toast here
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Exportar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-midnight-light border-boring/20">
                <DialogHeader>
                    <DialogTitle>Exportar Projeto</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2 hover:bg-burgundy/10 hover:border-burgundy/30"
                        onClick={handleExportPDF}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <FileText className="w-6 h-6 text-burgundy" />
                        )}
                        <span>Documento PDF</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2 hover:bg-burgundy/10 hover:border-burgundy/30 opacity-50 cursor-not-allowed"
                        disabled
                    >
                        <BookOpen className="w-6 h-6 text-burgundy" />
                        <span>Ebook ePub</span>
                        <span className="text-[10px] text-muted-foreground">(Em breve)</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
