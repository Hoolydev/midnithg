'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Project } from '@/lib/database.types';
import { revalidatePath } from 'next/cache';

export async function getProjects(): Promise<Project[]> {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getProject(id: string): Promise<Project | null> {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) return null;
    return data;
}

export async function createProject(
    project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'word_count'>
) {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('projects')
        .insert({
            ...project,
            user_id: user.id,
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath('/dashboard');
    return data;
}

export async function updateProject(
    id: string,
    updates: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>
) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    revalidatePath('/dashboard');
    revalidatePath(`/projects/${id}`);
    return data;
}

export async function deleteProject(id: string) {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

    if (error) throw error;
    revalidatePath('/dashboard');
}
