'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Chapter } from '@/lib/database.types';
import { revalidatePath } from 'next/cache';

export async function getChapters(projectId: string): Promise<Chapter[]> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('number', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function createChapter(
    chapter: Omit<Chapter, 'id' | 'created_at' | 'updated_at' | 'word_count'>
) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('chapters')
        .insert(chapter)
        .select()
        .single();

    if (error) throw error;
    revalidatePath(`/projects/${chapter.project_id}`);
    return data;
}

export async function updateChapter(
    id: string,
    projectId: string,
    updates: Partial<Omit<Chapter, 'id' | 'created_at'>>
) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('chapters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    revalidatePath(`/projects/${projectId}`);
    return data;
}

export async function deleteChapter(id: string, projectId: string) {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', id);

    if (error) throw error;
    revalidatePath(`/projects/${projectId}`);
}
