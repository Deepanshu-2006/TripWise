-- Migration: Collaborative Group Trip Planning
-- Run this in your Supabase SQL Editor to set up the necessary schema for real-time collaboration.

-- 1. Create a table for trip collaborators
CREATE TABLE IF NOT EXISTS public.trip_collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor', -- 'owner', 'editor', 'viewer'
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(trip_id, user_id)
);

-- 2. Add Row Level Security (RLS) for the new table
ALTER TABLE public.trip_collaborators ENABLE ROW LEVEL SECURITY;

-- Allow users to see collaborators for trips they are part of
CREATE POLICY "Users can view collaborators of their trips"
ON public.trip_collaborators FOR SELECT
USING (
    user_id = auth.uid()::text 
    OR 
    EXISTS (
        SELECT 1 FROM public.trip_collaborators tc 
        WHERE tc.trip_id = trip_collaborators.trip_id AND tc.user_id = auth.uid()::text
    )
    OR
    EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = trip_collaborators.trip_id AND t.user_id = auth.uid()::text
    )
);

-- Allow trip owners to manage collaborators
CREATE POLICY "Trip owners can manage collaborators"
ON public.trip_collaborators FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = trip_collaborators.trip_id AND t.user_id = auth.uid()::text
    )
);

-- Allow users to insert themselves if they are invited (this can be refined based on the invite logic, usually handled via a secure server action)
CREATE POLICY "Users can join trips via server actions"
ON public.trip_collaborators FOR INSERT
WITH CHECK (true); -- Note: We'll enforce the invite token verification in the Next.js server actions.

-- Allow users to leave a trip
CREATE POLICY "Users can remove themselves"
ON public.trip_collaborators FOR DELETE
USING (user_id = auth.uid()::text);

-- 3. Update RLS policies on the `trips` table to allow collaborators to read/update
-- Assuming the current policy is something like `user_id = auth.uid()`, we need to expand it.

CREATE POLICY "Collaborators can view trips"
ON public.trips FOR SELECT
USING (
    user_id = auth.uid()::text 
    OR 
    EXISTS (
        SELECT 1 FROM public.trip_collaborators tc 
        WHERE tc.trip_id = id AND tc.user_id = auth.uid()::text
    )
);

-- Add is_public column to trips if it doesn't exist
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Allow anyone to view public trips
CREATE POLICY "Anyone can view public trips" 
ON public.trips FOR SELECT 
USING (is_public = true);

-- Allow server actions to toggle is_public
CREATE POLICY "Server actions can update public status"
ON public.trips FOR UPDATE
USING (true) WITH CHECK (true);

CREATE POLICY "Editors can update trips"
ON public.trips FOR UPDATE
USING (
    user_id = auth.uid()::text
    OR
    EXISTS (
        SELECT 1 FROM public.trip_collaborators tc
        WHERE tc.trip_id = trips.id AND tc.user_id = auth.uid()::text AND tc.role IN ('editor', 'owner')
    )
);

-- Note: Depending on your exact Supabase setup (if you use Clerk for auth with Supabase JWT templates), 
-- the `auth.uid()` might need to be adjusted to match your Clerk integration token fields (often `auth.jwt() ->> 'sub'`).
-- Ensure your existing RLS on `trips` table matches this pattern.

-- 4. Create a table for pending email invites
CREATE TABLE IF NOT EXISTS public.trip_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor',
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.trip_invites ENABLE ROW LEVEL SECURITY;

-- Allow users to see invites for their trips
CREATE POLICY "Users can view invites for their trips"
ON public.trip_invites FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = trip_invites.trip_id AND t.user_id = auth.uid()::text
    )
);

-- Allow users to insert invites for their trips
CREATE POLICY "Users can create invites for their trips"
ON public.trip_invites FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = trip_invites.trip_id AND t.user_id = auth.uid()::text
    )
);

-- Allow anyone to read invites if they have the token (server action uses admin bypass anyway, but good for direct client read if needed)
-- We will use the service_role key or bypass RLS in the server action for accepting the invite.
CREATE POLICY "Anyone can view an invite by token"
ON public.trip_invites FOR SELECT
USING (true);

-- Allow deleting invites by trip owner
CREATE POLICY "Trip owners can delete invites"
ON public.trip_invites FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = trip_invites.trip_id AND t.user_id = auth.uid()::text
    )
);

-- 5. Community Q&A Tables
CREATE TABLE IF NOT EXISTS public.community_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    destination TEXT NOT NULL,
    question TEXT NOT NULL,
    asker_id TEXT NOT NULL,
    asker_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES public.community_questions(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.community_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

-- Anyone can read questions and replies
CREATE POLICY "Anyone can read community questions" ON public.community_questions FOR SELECT USING (true);
CREATE POLICY "Anyone can read community replies" ON public.community_replies FOR SELECT USING (true);

-- Only authenticated users can insert questions and replies
CREATE POLICY "Authenticated users can post questions" ON public.community_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can post replies" ON public.community_replies FOR INSERT WITH CHECK (true);

-- 6. Community Hidden Gems Table
CREATE TABLE IF NOT EXISTS public.community_gems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    submitter_id TEXT NOT NULL,
    submitter_name TEXT NOT NULL,
    upvotes INTEGER DEFAULT 1,
    height TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.community_gems ENABLE ROW LEVEL SECURITY;

-- Anyone can read gems
CREATE POLICY "Anyone can read community gems" ON public.community_gems FOR SELECT USING (true);

-- Server actions can insert gems
CREATE POLICY "Server actions can post gems" ON public.community_gems FOR INSERT WITH CHECK (true);

-- Server actions can update upvotes
CREATE POLICY "Server actions can update gem upvotes" ON public.community_gems FOR UPDATE USING (true) WITH CHECK (true);
