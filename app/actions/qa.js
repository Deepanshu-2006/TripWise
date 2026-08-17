'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabase } from '../../lib/supabase';
import { revalidatePath } from 'next/cache';

export async function getQAThreads() {
  const { data: questions, error: qError } = await supabase
    .from('community_questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (qError) {
    console.error('Error fetching questions:', qError);
    return [];
  }

  const { data: replies, error: rError } = await supabase
    .from('community_replies')
    .select('*')
    .order('created_at', { ascending: true });

  if (rError) {
    console.error('Error fetching replies:', rError);
    return questions.map(q => ({ ...q, replies: [] }));
  }

  // Attach replies to questions
  const threads = questions.map(q => {
    return {
      ...q,
      replies: replies.filter(r => r.question_id === q.id)
    };
  });

  return threads;
}

export async function askQuestion(destination, questionText) {
  const { userId } = await auth();
  if (!userId) throw new Error('You must be signed in to ask a question');

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const username = user.username || user.firstName || 'Traveler';

  const { data, error } = await supabase
    .from('community_questions')
    .insert([{
      destination,
      question: questionText,
      asker_id: userId,
      asker_name: username
    }])
    .select();

  if (error) {
    console.error('Error adding question:', error);
    throw new Error(`Supabase Error: ${error.message || 'Failed to post question'}`);
  }

  revalidatePath('/community');
  return data[0];
}

export async function addReply(questionId, text) {
  const { userId } = await auth();
  if (!userId) throw new Error('You must be signed in to reply');

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const username = user.username || user.firstName || 'Traveler';

  const isVerified = user.publicMetadata?.isVerifiedLocal || false;

  const { data, error } = await supabase
    .from('community_replies')
    .insert([{
      question_id: questionId,
      author_id: userId,
      author_name: username,
      is_verified: isVerified,
      text
    }])
    .select();

  if (error) {
    console.error('Error adding reply:', error);
    throw new Error(`Supabase Error: ${error.message || 'Failed to post reply'}`);
  }

  revalidatePath('/community');
  return data[0];
}

export async function seedQA() {
  const { userId } = await auth();
  if (!userId) throw new Error('You must be signed in to seed data');

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const username = user.username || user.firstName || 'Traveler';

  const mockQuestions = [
    {
      destination: 'Kyoto',
      question: 'Are there any temples open late for evening photography that aren\'t overcrowded?',
      asker_id: userId,
      asker_name: 'lenscrafter9'
    },
    {
      destination: 'Rome',
      question: 'Where can I find the most authentic cacio e pepe away from the tourist traps?',
      asker_id: userId,
      asker_name: 'pasta_hunter'
    },
    {
      destination: 'Patagonia',
      question: 'Do I need to book campsites in Torres del Paine months in advance for the W Trek?',
      asker_id: userId,
      asker_name: 'hiker_dan'
    }
  ];

  // Insert questions
  const { data: qData, error: qError } = await supabase
    .from('community_questions')
    .insert(mockQuestions)
    .select();

  if (qError) {
    console.error('Error seeding questions:', qError);
    throw new Error(`Supabase Error: ${qError.message || 'Failed to seed questions'}`);
  }

  // Seed some replies for the first question
  const kyotoQId = qData.find(q => q.destination === 'Kyoto').id;
  await supabase.from('community_replies').insert([
    {
      question_id: kyotoQId,
      author_id: userId,
      author_name: 'Kenji S.',
      is_verified: true,
      text: 'Yes! Check out Kodai-ji during their illumination events. Yasaka Shrine is also open 24/7.'
    },
    {
      question_id: kyotoQId,
      author_id: userId,
      author_name: 'travelbug22',
      is_verified: false,
      text: 'Fushimi Inari is open 24 hours too, but go really late to avoid the crowds.'
    }
  ]);

  revalidatePath('/community');
  return true;
}
