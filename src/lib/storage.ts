import { createClient } from '@/lib/supabase/client';

export async function uploadImage(
    file: File | Blob,
    bucket: string,
    path: string
): Promise<string | null> {
    const supabase = createClient();

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            upsert: true,
        });

    if (error) {
        console.error('Error uploading image:', error);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

    return publicUrl;
}

export async function deleteImage(bucket: string, path: string): Promise<boolean> {
    const supabase = createClient();

    const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

    if (error) {
        console.error('Error deleting image:', error);
        return false;
    }

    return true;
}
