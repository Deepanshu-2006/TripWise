'use server';

import { auth } from '@clerk/nextjs/server';
import { supabase } from '../../lib/supabase';

export async function saveTrip(destinationName, itineraryData) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('You must be signed in to save a trip');
    }

    const { data, error } = await supabase
        .from('trips')
        .insert([
            {
                user_id: userId,
                destination_name: destinationName,
                itinerary_data: itineraryData,
            }
        ])
        .select();

    if (error) {
        console.error("Supabase Error saving trip:", error);
        throw new Error(`Failed to save trip to database: ${error.message || JSON.stringify(error)}`);
    }

    return { success: true, trip: data[0] };
}

export async function getUserTrips() {
    const { userId } = await auth();

    if (!userId) {
        return [];
    }

    const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Supabase Error fetching trips:", error);
        return [];
    }

    return data;
}
