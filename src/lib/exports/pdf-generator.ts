import { jsPDF } from 'jspdf';
import { createClient } from '@/lib/supabase/client';

interface ChapterData {
    number: number;
    title: string | null;
    content: string | null;
}

function stripHtml(html: string): string {
    // Replace block tags with newlines for paragraph separation
    let text = html.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/h[1-6]>/gi, '\n\n');
    text = text.replace(/<\/blockquote>/gi, '\n');
    text = text.replace(/<\/li>/gi, '\n');
    // Strip remaining tags
    text = text.replace(/<[^>]+>/g, '');
    // Normalize whitespace within lines but preserve paragraph breaks
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
}

function classifyChapter(chapter: ChapterData): 'prologue' | 'epilogue' | 'chapter' {
    const title = (chapter.title || '').toLowerCase().trim();
    if (title.includes('prólogo') || title.includes('prologo') || title === 'prologue') return 'prologue';
    if (title.includes('epílogo') || title.includes('epilogo') || title === 'epilogue') return 'epilogue';
    return 'chapter';
}

function addPageNumber(doc: jsPDF, pageNum: number) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(String(pageNum), pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.setTextColor(0, 0, 0);
}

export async function generatePDF(projectId: string, title: string) {
    const supabase = createClient();

    // Fetch project metadata
    const { data: project } = await supabase
        .from('projects')
        .select('genre, tone, summary')
        .eq('id', projectId)
        .single();

    // Fetch all chapters ordered by number
    const { data: chapters, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('number', { ascending: true });

    if (error || !chapters) throw new Error('Failed to fetch chapters');

    // Classify and sort chapters: prologue first, then numbered chapters, then epilogue
    const prologues: ChapterData[] = [];
    const mainChapters: ChapterData[] = [];
    const epilogues: ChapterData[] = [];

    for (const ch of chapters) {
        const type = classifyChapter(ch);
        if (type === 'prologue') prologues.push(ch);
        else if (type === 'epilogue') epilogues.push(ch);
        else mainChapters.push(ch);
    }

    const orderedChapters = [...prologues, ...mainChapters, ...epilogues];

    // Initialize PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let pageNum = 0;

    // ==================
    // Cover Page
    // ==================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text(title, pageWidth / 2, 100, { align: 'center' });

    if (project?.genre) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(14);
        doc.setTextColor(120, 120, 120);
        doc.text(project.genre, pageWidth / 2, 115, { align: 'center' });
        doc.setTextColor(0, 0, 0);
    }

    if (project?.summary) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const summaryLines = doc.splitTextToSize(project.summary, 130);
        doc.text(summaryLines, pageWidth / 2, 135, { align: 'center' });
        doc.setTextColor(0, 0, 0);
    }

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(60, 155, pageWidth - 60, 155);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Gerado com Midnight AI', pageWidth / 2, 280, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // ==================
    // Content Pages
    // ==================
    for (const chapter of orderedChapters) {
        doc.addPage();
        pageNum++;
        let yPos = 30;

        // Chapter heading
        const type = classifyChapter(chapter);
        let heading = '';

        if (type === 'prologue') {
            heading = chapter.title || 'Prólogo';
        } else if (type === 'epilogue') {
            heading = chapter.title || 'Epílogo';
        } else {
            heading = `Capítulo ${chapter.number}`;
            if (chapter.title) heading += ` — ${chapter.title}`;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(heading, pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;

        // Decorative line under heading
        doc.setDrawColor(180, 180, 180);
        doc.line(60, yPos, pageWidth - 60, yPos);
        yPos += 15;

        // Chapter body
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);

        const text = stripHtml(chapter.content || '');
        if (!text) continue;

        const paragraphs = text.split('\n\n').filter(Boolean);

        for (const paragraph of paragraphs) {
            const lines = doc.splitTextToSize(paragraph.trim(), 160);

            for (const line of lines) {
                if (yPos > 275) {
                    addPageNumber(doc, pageNum);
                    doc.addPage();
                    pageNum++;
                    yPos = 25;
                }
                doc.text(line, 25, yPos);
                yPos += 6.5;
            }
            yPos += 4; // Paragraph spacing
        }

        addPageNumber(doc, pageNum);
    }

    doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
}

