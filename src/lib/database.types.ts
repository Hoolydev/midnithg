// ============================================
// Midnight AI – Database Types
// These types mirror the Supabase schema.
// In production, generate with: npx supabase gen types typescript
// ============================================

export type Plan = 'free' | 'pro' | 'creator';
export type ProjectStatus = 'draft' | 'writing' | 'review' | 'complete';
export type ChapterStatus = 'draft' | 'writing' | 'review' | 'complete';
export type CharacterRole = 'protagonist' | 'antagonist' | 'love_interest' | 'supporting' | 'mentor' | 'other';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  genre: string;
  classification: string | null;
  target_audience: string | null;
  tone: string | null;
  structure: string | null;
  summary: string | null;
  cover_url: string | null;
  word_count: number;
  status: ProjectStatus;
  visibility: 'private' | 'public';
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  image_url: string | null;
  age: string | null;
  personality: string | null;
  backstory: string | null;
  role: CharacterRole;
  appearance: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  project_id: string;
  number: number;
  title: string | null;
  content: string | null;
  summary: string | null;
  word_count: number;
  status: ChapterStatus;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  project_id: string;
  chapter_id: string | null;
  description: string;
  timeline_position: number;
  created_at: string;
}

export interface Image {
  id: string;
  project_id: string;
  chapter_id: string | null;
  prompt_used: string;
  style: string | null;
  url: string;
  created_at: string;
}

export interface Embedding {
  id: string;
  project_id: string;
  chapter_id: string | null;
  content_chunk: string;
  embedding: number[];
  created_at: string;
}

export interface UserGoal {
  id: string;
  user_id: string;
  daily_word_count_goal: number;
  current_streak: number;
  last_wrote_date: string | null;
  created_at: string;
  updated_at: string;
}

// Database schema for Supabase client typing
export interface Database {
  public: {
    Tables: {
      user_goals: {
        Row: UserGoal;
        Insert: Omit<UserGoal, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<UserGoal, 'id' | 'created_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'word_count'> & { id?: string };
        Update: Partial<Omit<Project, 'id' | 'created_at'>>;
      };
      characters: {
        Row: Character;
        Insert: Omit<Character, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Character, 'id' | 'created_at'>>;
      };
      chapters: {
        Row: Chapter;
        Insert: Omit<Chapter, 'id' | 'created_at' | 'updated_at' | 'word_count'> & { id?: string };
        Update: Partial<Omit<Chapter, 'id' | 'created_at'>>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Event, 'id' | 'created_at'>>;
      };
      images: {
        Row: Image;
        Insert: Omit<Image, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Image, 'id' | 'created_at'>>;
      };
      embeddings: {
        Row: Embedding;
        Insert: Omit<Embedding, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Embedding, 'id' | 'created_at'>>;
      };
    };
  };
}
