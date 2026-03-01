import { jsPDF } from 'jspdf';
import { createClient } from '@/lib/supabase/client';

export async function generatePDF(projectId: string, title: string) {
    const supabase = createClient();

    // 1. Fetch all chapters
    const { data: chapters, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('number', { ascending: true });

    if (error || !chapters) throw new Error('Failed to fetch chapters');

    // 2. Initialize PDF
    const doc = new jsPDF();
    let yPos = 20;

    // Title Page
    doc.setFontSize(24);
    doc.text(title, 105, 100, { align: 'center' });
    doc.addPage();

    // Content
    doc.setFontSize(12);

    for (const chapter of chapters) {
        // Chapter Title
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(`Chapter ${chapter.number}: ${chapter.title || ''}`, 20, yPos);
        yPos += 15;

        doc.setFont('helvetica', 'normal');

        // Simple text splitting (in a real app, uses HTML splitting or more complex logic)
        // For MVP, stripping HTML tags or using simple text
        const text = chapter.content?.replace(/<[^>]+>/g, '') || '';
        const lines = doc.splitTextToSize(text, 170);

        for (const line of lines) {
            if (yPos > 280) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(line, 20, yPos);
            yPos += 7;
        }

        // Add some space between chapters or page break
        doc.addPage();
        yPos = 20;
    }

    doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
}
