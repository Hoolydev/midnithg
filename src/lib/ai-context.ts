import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Project, Character, Chapter, Event } from '@/lib/database.types';

export interface AIContext {
    systemPrompt: string;
    projectTitle: string;
}

export async function buildAIContext(projectId: string, chapterId?: string): Promise<AIContext> {
    const supabase = await createServerSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queries: PromiseLike<any>[] = [
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('characters').select('*').eq('project_id', projectId).order('created_at'),
        supabase
            .from('chapters')
            .select('id, number, title, summary')
            .eq('project_id', projectId)
            .order('number', { ascending: true }),
        supabase
            .from('events')
            .select('description, timeline_position')
            .eq('project_id', projectId)
            .order('timeline_position', { ascending: true }),
    ];

    // Load full content of the active chapter for deep context
    if (chapterId) {
        queries.push(
            supabase.from('chapters').select('number, title, content').eq('id', chapterId).single()
        );
    }

    const results = await Promise.all(queries);

    const project: Project | null = results[0].data;
    const characters: Character[] = results[1].data || [];
    const allChapters: Pick<Chapter, 'id' | 'number' | 'title' | 'summary'>[] = results[2].data || [];
    const events: Pick<Event, 'description' | 'timeline_position'>[] = results[3].data || [];
    const currentChapter: Pick<Chapter, 'number' | 'title' | 'content'> | null = chapterId ? results[4]?.data : null;

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

    // Full chapter timeline — ALL chapters for continuous memory
    if (allChapters.length > 0) {
        prompt += '\n\n## Complete Story Arc (ALL Chapters — Maintain Continuity)';
        for (const ch of allChapters) {
            const isCurrent = chapterId && ch.id === chapterId;
            prompt += `\n- Ch. ${ch.number}${ch.title ? ` "${ch.title}"` : ''}${ch.summary ? `: ${ch.summary}` : ''}${isCurrent ? ' ← CURRENT CHAPTER (you are writing here)' : ''}`;
        }
    }

    // Timeline events for narrative coherence
    if (events.length > 0) {
        prompt += '\n\n## Timeline Events (Key Plot Points)';
        for (const ev of events) {
            prompt += `\n- [Position ${ev.timeline_position}]: ${ev.description}`;
        }
    }

    // Include current chapter content for deep context
    if (currentChapter?.content) {
        const plainText = currentChapter.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        // Send last 4000 chars of current chapter for context without overwhelming the token limit
        const contextSlice = plainText.length > 4000 ? plainText.slice(-4000) : plainText;
        prompt += `\n\n## Current Chapter Content (Ch. ${currentChapter.number}${currentChapter.title ? ` "${currentChapter.title}"` : ''})
The following is the text written so far in the chapter you are assisting with. Use this to maintain perfect continuity:
---
${contextSlice}
---`;
    }

    prompt += `\n\n## Master Editor Instructions (STRICT RULES)
1. **Show, Don't Tell**: Use sensory details (smell, sound, texture) and character reactions to reveal emotion and plot, avoiding dry exposition.
2. **Character Voice**: Ensure dialogue reflects the specific flaws, motivations, and backgrounds of each character. No two characters should sound identical.
3. **Pacing & Tension**: When writing or continuing scenes, build tension through subtext, deliberate pacing, and meaningful character choices. Ensure the scene has a clear goal and conflict.
4. **Seamless Continuity**: When continuing text, match the exact prose style and tone of the preceding paragraphs. Do NOT add meta-commentary (e.g., "Here is the continuation:") — just flow directly into the story.
5. **Structural Awareness**: Keep the overarching genre and tone in mind. Dark romance requires different pacing and vocabulary than lighthearted fantasy.
6. **Rewriting**: When asked to rewrite, elevate the syntax, eliminate clunky phrasing, and sharpen the emotional impact without altering the core narrative intent.
7. **First-Person Mastery**: If the narrative is in first person, ALWAYS maintain the specific narrator's internal voice. Show their unique thought patterns, physical sensations, emotional reactions, and biases. Never break POV — the reader should feel they ARE the narrator.
8. **Controlled Output**: Write ONLY what was requested. Do NOT advance the plot beyond the current scene or reveal future events. Respect the author's pacing.
9. **Memory Consistency**: NEVER contradict established facts from previous chapters. Character appearances, relationships, settings, and plot events must remain consistent throughout.`;

    return {
        systemPrompt: prompt,
        projectTitle: project.title,
    };
}

