import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Project, Character, Chapter } from '@/lib/database.types';

export interface AIContext {
    systemPrompt: string;
    projectTitle: string;
}

export async function buildAIContext(projectId: string): Promise<AIContext> {
    const supabase = await createServerSupabaseClient();

    const [projectRes, charsRes, chaptersRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('characters').select('*').eq('project_id', projectId).order('created_at'),
        supabase
            .from('chapters')
            .select('number, title, summary')
            .eq('project_id', projectId)
            .order('number', { ascending: false })
            .limit(5),
    ]);

    const project: Project | null = projectRes.data;
    const characters: Character[] = charsRes.data || [];
    const recentChapters: Pick<Chapter, 'number' | 'title' | 'summary'>[] = chaptersRes.data || [];

    if (!project) {
        return {
            systemPrompt: 'You are a creative fiction writing assistant. Write in Portuguese (Brazil).',
            projectTitle: 'Unknown Project',
        };
    }

    let prompt = `You are Midnight AI, a Master Editor and Expert Creative Fiction Writer assisting with the novel "${project.title}".
Write in Portuguese (Brazil) unless the user explicitly asks for another language. Your goal is to help diagram the plot, develop three-dimensional characters, and write prose that is immersive, emotionally resonant, and structurally sound.

## Novel Architecture Context
- **Genre**: ${project.genre}
- **Tone**: ${project.tone || 'Not specified'}
- **Classification**: ${project.classification || 'Not specified'}
- **Target Audience**: ${project.target_audience || 'Not specified'}
- **Structure**: ${project.structure || 'Three acts (Setup, Confrontation, Resolution)'}`;

    if (project.summary) {
        prompt += `\n- **Synopsis/Core Concept**: ${project.summary}`;
    }

    if (characters.length > 0) {
        prompt += '\n\n## Characters (Maintain Consistency & Arcs)';
        for (const char of characters) {
            prompt += `\n\n### ${char.name} (${char.role.replace('_', ' ')})`;
            if (char.age) prompt += `\n- Age: ${char.age}`;
            if (char.personality) prompt += `\n- Personality & Flaws: ${char.personality}`;
            if (char.appearance) prompt += `\n- Visuals: ${char.appearance}`;
            if (char.backstory) prompt += `\n- Motivation/Backstory: ${char.backstory}`;
        }
    }

    if (recentChapters.length > 0) {
        prompt += '\n\n## Sequence of Events (Recent Chapters for Pacing and Continuity)';
        for (const ch of recentChapters.reverse()) {
            prompt += `\n- Ch. ${ch.number}${ch.title ? ` "${ch.title}"` : ''}${ch.summary ? `: ${ch.summary}` : ''}`;
        }
    }

    prompt += `\n\n## Master Editor Instructions (STRICT RULES)
1. **Show, Don't Tell**: Use sensory details (smell, sound, texture) and character reactions to reveal emotion and plot, avoiding dry exposition.
2. **Character Voice**: Ensure dialogue reflects the specific flaws, motivations, and backgrounds of each character. No two characters should sound identical.
3. **Pacing & Tension**: When writing or continuing scenes, build tension through subtext, deliberate pacing, and meaningful character choices. Ensure the scene has a clear goal and conflict.
4. **Seamless Continuity**: When continuing text, match the exact prose style and tone of the preceding paragraphs. Do NOT add meta-commentary (e.g., "Here is the continuation:") — just flow directly into the story.
5. **Structural Awareness**: Keep the overarching genre and tone in mind. Dark romance requires different pacing and vocabulary than lighthearted fantasy.
6. **Rewriting**: When asked to rewrite, elevate the syntax, eliminate clunky phrasing, and sharpen the emotional impact without altering the core narrative intent.`;

    return {
        systemPrompt: prompt,
        projectTitle: project.title,
    };
}
