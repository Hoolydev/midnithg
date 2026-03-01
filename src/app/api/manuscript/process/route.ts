import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let content = '';

        if (file.name.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer });
            content = result.value;
        } else if (file.name.endsWith('.txt')) {
            content = buffer.toString('utf-8');
        } else {
            // For now, only support txt and docx. pdf-parse can be tricky in some environments.
            return NextResponse.json({ error: 'Formato de arquivo não suportado. Use .txt ou .docx.' }, { status: 400 });
        }

        return NextResponse.json({ content });
    } catch (error) {
        console.error('Error in manuscript process route:', error);
        return NextResponse.json({ error: 'Erro ao processar o arquivo' }, { status: 500 });
    }
}
