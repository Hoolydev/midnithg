import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// This route handles image generation requests
// It attempts to use the configured AI provider (Grok/xAI or compatible)
export async function POST(req: Request) {
    try {
        const { prompt, width = 1024, height = 1024, style = 'cinematic', projectId } = await req.json();

        if (!process.env.GROK_API_KEY) {
            return NextResponse.json(
                { error: 'API key not configured' },
                { status: 500 }
            );
        }

        // Initialize OpenAI client pointing to xAI
        const client = new OpenAI({
            apiKey: process.env.GROK_API_KEY,
            baseURL: 'https://api.x.ai/v1',
        });

        // 1. Fetch Project Details for Tone and Genre Integration
        let projectContext = '';
        if (projectId) {
            const supabase = await createServerSupabaseClient();
            const { data: project } = await supabase
                .from('projects')
                .select('genre, tone')
                .eq('id', projectId)
                .single();

            if (project) {
                projectContext = `The image belongs to a ${project.genre} story with a ${project.tone || 'neutral'} tone. Make sure the lighting, composition, and mood perfectly reflect this. `;
            }
        }

        // 2. Enhance prompt based on style and project context
        let enhancedPrompt = `${projectContext}Subject: ${prompt}. `;

        // Strict rendering rules
        enhancedPrompt += `Focus on high-quality framing, coherent character anatomy, and cohesive color grading. `;

        switch (style) {
            case 'cinematic':
                enhancedPrompt += `Style: Cinematic lighting, 8k resolution, highly detailed, dramatic atmosphere, beautifully composed movie still, volumetric fog, rim lighting.`;
                break;
            case 'anime':
                enhancedPrompt += `Style: High-budget Anime style, Studio Ghibli or Makoto Shinkai inspired, vibrant colors, detailed line art, gorgeous background painting.`;
                break;
            case 'oil-painting':
                enhancedPrompt += `Style: Fine art oil painting, impasto brush strokes, classical composition, museum masterpiece.`;
                break;
            case 'watercolor':
                enhancedPrompt += `Style: Ethereal watercolor, soft blooming edges, dreamy aesthetic, washed colors, artistic expression.`;
                break;
            case 'sketch':
                enhancedPrompt += `Style: Detailed graphite pencil sketch, expressive charcoal, moody shadows, intricate hatching.`;
                break;
        }

        console.log('Generating image with prompt:', enhancedPrompt);

        // Attempt generation
        try {
            const response = await client.images.generate({
                model: 'grok-2-image',
                prompt: enhancedPrompt,
                n: 1,
                size: '1024x1024',
                response_format: 'b64_json',
            });

            if (!response.data || !response.data[0]) {
                throw new Error('No image data received from API');
            }
            const imagedata = response.data[0].b64_json;
            return NextResponse.json({ b64_json: imagedata });

        } catch (apiError) {
            console.warn('AI Image Gen failed, falling back to placeholder (Development Mode)', apiError);

            // Fallback for demo/dev: Return a placeholder image
            // In a real prod environment we would throw the error, but for this MVP phase 
            // we want to ensure the UI works even if xAI access is limited.

            // We use placehold.co or just return a mock URL.
            // Actually, we can't return b64 from placehold.co easily without fetching it.
            // Let's return a dummy B64 or a direct URL if the frontend handles it.
            // But our upload logic expects B64 usually to save to storage.

            // Let's fetch a placeholder and convert to B64
            const mockRes = await fetch(`https://placehold.co/${width}x${height}/2a0a18/FFF.png?text=${encodeURIComponent(style)}`);
            const arrayBuffer = await mockRes.arrayBuffer();
            const b64 = Buffer.from(arrayBuffer).toString('base64');

            return NextResponse.json({ b64_json: b64, isMock: true });
        }

    } catch (error) {
        console.error('Image generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate image' },
            { status: 500 }
        );
    }
}
