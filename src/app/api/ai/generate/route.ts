import { NextRequest, NextResponse } from 'next/server';
import { buildAIContext } from '@/lib/ai-context';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_MODEL = process.env.GROK_MODEL || 'grok-4';

interface GenerateRequest {
    projectId: string;
    mode: 'continue' | 'rewrite' | 'dialogue' | 'describe' | 'freeform';
    prompt: string;
    currentText?: string;
    selectedText?: string;
}

function buildUserPrompt(req: GenerateRequest): string {
    switch (req.mode) {
        case 'continue':
            return `Continue writing from where this text ends. Write 2-3 paragraphs that flow naturally:\n\n---\n${req.currentText?.slice(-2000) || ''}\n---`;

        case 'rewrite':
            return `Rewrite the following text, improving the prose while keeping the same narrative intent:\n\n---\n${req.selectedText || req.currentText?.slice(-1000) || ''}\n---`;

        case 'dialogue':
            return `Write a dialogue scene that fits naturally here. Make character voices distinct:\n\n${req.prompt}\n\nContext of what was written so far:\n---\n${req.currentText?.slice(-1500) || ''}\n---`;

        case 'describe':
            return `Write a vivid scene description with rich sensory details:\n\n${req.prompt}\n\nContext of what was written so far:\n---\n${req.currentText?.slice(-1500) || ''}\n---`;

        case 'freeform':
        default:
            return `${req.prompt}\n\nContext of what was written so far:\n---\n${req.currentText?.slice(-2000) || ''}\n---`;
    }
}

export async function POST(request: NextRequest) {
    const apiKey = process.env.GROK_API_KEY;

    if (!apiKey || apiKey === 'your-grok-api-key-here') {
        return NextResponse.json(
            { error: 'Grok API key not configured. Add GROK_API_KEY to .env.local' },
            { status: 500 }
        );
    }

    try {
        const body: GenerateRequest = await request.json();
        const { projectId } = body;

        if (!projectId) {
            return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
        }

        const { systemPrompt } = await buildAIContext(projectId);
        const userPrompt = buildUserPrompt(body);

        const response = await fetch(GROK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: GROK_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                stream: true,
                temperature: 0.8,
                max_tokens: 2000,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Grok API error:', response.status, errText);
            return NextResponse.json(
                { error: `Grok API error: ${response.status}` },
                { status: response.status }
            );
        }

        // Stream the response through
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader();
                if (!reader) {
                    controller.close();
                    return;
                }

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);
                                if (data === '[DONE]') continue;

                                try {
                                    const parsed = JSON.parse(data);
                                    const content = parsed.choices?.[0]?.delta?.content;
                                    if (content) {
                                        controller.enqueue(encoder.encode(content));
                                    }
                                } catch {
                                    // skip malformed JSON chunks
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error('Stream error:', err);
                } finally {
                    controller.close();
                    reader.releaseLock();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Transfer-Encoding': 'chunked',
            },
        });
    } catch (error) {
        console.error('AI generate error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
