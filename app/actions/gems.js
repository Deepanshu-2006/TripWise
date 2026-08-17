'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '../../lib/supabase';

export async function getGems() {
  const { data, error } = await supabase
    .from('community_gems')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching gems:', error);
    return [];
  }
  return data;
}

export async function submitGem(location, description, imageUrl, height) {
  const { userId } = await auth();
  if (!userId) throw new Error('You must be signed in to post a gem');

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const username = user.username || user.firstName || 'Explorer';

  const { data, error } = await supabase
    .from('community_gems')
    .insert([{
      location,
      description,
      image_url: imageUrl,
      height,
      submitter_id: userId,
      submitter_name: username,
      upvotes: 1
    }])
    .select();

  if (error) {
    console.error('Error adding gem:', error);
    throw new Error(`Supabase Error: ${error.message || 'Failed to post gem'}`);
  }

  revalidatePath('/community');
  return data[0];
}

export async function upvoteGem(gemId, incrementBy) {
  const { data: currentData, error: readError } = await supabase
    .from('community_gems')
    .select('upvotes')
    .eq('id', gemId)
    .single();
    
  if (readError) {
    console.error('Error reading upvotes:', readError);
    return false;
  }
  
  const { error: updateError } = await supabase
    .from('community_gems')
    .update({ upvotes: currentData.upvotes + incrementBy })
    .eq('id', gemId);
    
  if (updateError) {
    console.error('Error updating upvotes:', updateError);
    return false;
  }
  
  return true;
}

export async function seedGems() {
  const { userId } = await auth();
  if (!userId) throw new Error('You must be signed in to seed data');

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const username = user.username || user.firstName || 'Traveler';

  const mockGems = [
    {
      image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
      description: 'A tiny basement speakeasy serving the best natural wines.',
      location: 'Shibuya, Tokyo',
      submitter_id: userId,
      submitter_name: 'wanderlust99',
      upvotes: 124,
      height: 'h-64',
    },
    {
      image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
      description: 'Family-run trattoria tucked away in a quiet alley.',
      location: 'Trastevere, Rome',
      submitter_id: userId,
      submitter_name: 'pasta_lover',
      upvotes: 89,
      height: 'h-80',
    },
    {
      image_url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&auto=format&fit=crop&q=80',
      description: 'Secret sunset viewing spot with panoramic city views.',
      location: 'Montmartre, Paris',
      submitter_id: userId,
      submitter_name: 'sunset_chaser',
      upvotes: 210,
      height: 'h-72',
    },
    {
      image_url: 'https://images.unsplash.com/photo-1473081556163-2a17de81fc97?w=600&auto=format&fit=crop&q=80',
      description: 'Abandoned botanical garden reclaimed by nature.',
      location: 'Sintra, Portugal',
      submitter_id: userId,
      submitter_name: 'green_explorer',
      upvotes: 342,
      height: 'h-96',
    },
    {
      image_url: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&auto=format&fit=crop&q=80',
      description: 'Underground indie bookstore with rare first editions.',
      location: 'Brooklyn, NY',
      submitter_id: userId,
      submitter_name: 'bookworm_travels',
      upvotes: 56,
      height: 'h-64',
    }
  ];

  const { error: gError } = await supabase
    .from('community_gems')
    .insert(mockGems);

  if (gError) {
    console.error('Error seeding gems:', gError);
    throw new Error(`Supabase Error: ${gError.message || 'Failed to seed gems'}`);
  }

  revalidatePath('/community');
  return true;
}
