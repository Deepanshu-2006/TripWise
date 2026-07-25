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

export async function deleteTrip(tripId) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('You must be signed in to delete a trip');
    }

    const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)
        .eq('user_id', userId); // Ensure they only delete their own trip

    if (error) {
        console.error("Supabase Error deleting trip:", error);
        throw new Error("Failed to delete trip");
    }

    return { success: true };
}

export async function getTripById(tripId) {
    const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

    if (error) {
        console.error("Supabase Error fetching trip by id:", error);
        return null;
    }

    return data;
}
