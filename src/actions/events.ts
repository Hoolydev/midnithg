'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Event } from '@/lib/database.types';
import { revalidatePath } from 'next/cache';

export async function getEvents(projectId: string): Promise<Event[]> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('project_id', projectId)
        .order('timeline_position', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function createEvent(
    event: Omit<Event, 'id' | 'created_at'>
) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('events')
        .insert(event)
        .select()
        .single();

    if (error) throw error;
    revalidatePath(`/projects/${event.project_id}`);
    return data;
}

export async function updateEvent(
    id: string,
    projectId: string,
    updates: Partial<Omit<Event, 'id' | 'created_at'>>
) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    revalidatePath(`/projects/${projectId}`);
    return data;
}

export async function deleteEvent(id: string, projectId: string) {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

    if (error) throw error;
    revalidatePath(`/projects/${projectId}`);
}
