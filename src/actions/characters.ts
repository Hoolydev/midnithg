'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Character } from '@/lib/database.types';
import { revalidatePath } from 'next/cache';

export async function getCharacters(projectId: string): Promise<Character[]> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function createCharacter(
    character: Omit<Character, 'id' | 'created_at' | 'updated_at'>
) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('characters')
        .insert(character)
        .select()
        .single();

    if (error) throw error;
    revalidatePath(`/projects/${character.project_id}`);
    return data;
}

export async function updateCharacter(
    id: string,
    projectId: string,
    updates: Partial<Omit<Character, 'id' | 'created_at'>>
) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    revalidatePath(`/projects/${projectId}`);
    return data;
}

export async function deleteCharacter(id: string, projectId: string) {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id);

    if (error) throw error;
    revalidatePath(`/projects/${projectId}`);
}
