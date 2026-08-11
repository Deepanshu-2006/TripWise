'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '../../lib/supabase';

export async function saveTrip(destinationName, itineraryData) {
    const { userId } = await auth();
    if (!userId) throw new Error('You must be signed in to save a trip');

    // 1. Insert Trip
    const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .insert([{ user_id: userId, destination_name: destinationName, itinerary_data: itineraryData }])
        .select();

    if (tripError) {
        console.error("Supabase Error saving trip:", tripError);
        throw new Error(`Failed to save trip to database: ${tripError.message || JSON.stringify(tripError)}`);
    }

    const tripId = tripData[0].id;

    // 2. Insert owner into collaborators table
    // Fails silently if table doesn't exist yet, to not break the app for users who haven't run the migration
    try {
        await supabase.from('trip_collaborators').insert([{
            trip_id: tripId,
            user_id: userId,
            role: 'owner'
        }]);
    } catch (e) {
        console.warn("Could not insert trip_collaborators. Have you run the SQL migration?");
    }

    revalidatePath('/ai-planner');
    return { success: true, trip: tripData[0] };
}

export async function updateTrip(tripId, destinationName, itineraryData) {
    const { userId } = await auth();
    if (!userId) throw new Error('You must be signed in to save a trip');

    // Ensure the user has permission to update. The RLS policies handle this, but we'll also just attempt the update.
    // If the user isn't the owner or an editor, RLS will block it or it won't find the row.
    const { data, error } = await supabase
        .from('trips')
        .update({ destination_name: destinationName, itinerary_data: itineraryData })
        .eq('id', tripId)
        .select();

    if (error) {
        console.error("Supabase Error updating trip:", error);
        throw new Error(`Failed to update trip: ${error.message || JSON.stringify(error)}`);
    }

    revalidatePath('/ai-planner');
    revalidatePath('/ai-planner/new');
    revalidatePath('/itinerary');
    return { success: true, trip: data[0] };
}

export async function getUserTrips() {
    const { userId } = await auth();
    if (!userId) return [];

    // Fetch owned trips
    const { data: ownedTrips, error: ownedError } = await supabase
        .from('trips')
        .select('*, trip_collaborators(user_id, role, joined_at)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (ownedError) console.error("Supabase Error fetching owned trips:", ownedError);
    console.log("getUserTrips for userId:", userId, "Owned:", ownedTrips?.length);

    // Fetch collaborated trips
    let collabTrips = [];
    const { data: collabRows, error: collabRowError } = await supabase
        .from('trip_collaborators')
        .select('trip_id')
        .eq('user_id', userId)
        .neq('role', 'owner'); // prevent duplicates if owner is in table

    if (!collabRowError && collabRows && collabRows.length > 0) {
        const collabTripIds = collabRows.map(r => r.trip_id);
        const { data: cTrips, error: cTripsError } = await supabase
            .from('trips')
            .select('*, trip_collaborators(user_id, role, joined_at)')
            .in('id', collabTripIds)
            .order('created_at', { ascending: false });
        
        if (!cTripsError && cTrips) {
            collabTrips = cTrips;
        }
    }

    const allTrips = [...(ownedTrips || []), ...collabTrips];
    
    // Sort by created_at descending
    allTrips.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Deduplicate just in case
    const uniqueTrips = Array.from(new Map(allTrips.map(item => [item.id, item])).values());
    
    return uniqueTrips;
}

export async function deleteTrip(tripId) {
    const { userId } = await auth();
    if (!userId) throw new Error('You must be signed in to delete a trip');

    // 1. Delete associated collaborator records first to avoid foreign key constraint violations
    try {
        const { error: collabError } = await supabase
            .from('trip_collaborators')
            .delete()
            .eq('trip_id', tripId);
        if (collabError) {
            console.warn("Notice deleting trip_collaborators:", collabError);
        }
    } catch (e) {
        console.warn("Could not delete from trip_collaborators:", e);
    }

    // 2. Delete trip from database
    const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId); 

    if (error) {
        console.error("Supabase Error deleting trip:", error);
        throw new Error(`Failed to delete trip: ${error.message || JSON.stringify(error)}`);
    }

    revalidatePath('/ai-planner');
    revalidatePath('/itinerary');
    return { success: true };
}

export async function getTripById(tripId) {
    const { data, error } = await supabase
        .from('trips')
        .select('*, trip_collaborators(user_id, role, joined_at)')
        .eq('id', tripId)
        .single();

    if (error) {
        console.error("Supabase Error fetching trip by id:", error);
        return null;
    }

    return data;
}

// --- COLLABORATION ACTIONS ---

export async function inviteCollaborator(tripId, targetUserId, role = 'editor') {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    
    // In a real app, verify `userId` is the owner before inserting.
    const { error } = await supabase
        .from('trip_collaborators')
        .insert([{ trip_id: tripId, user_id: targetUserId, role }]);
        
    if (error) throw new Error(error.message);
    revalidatePath('/ai-planner');
    return { success: true };
}

export async function updateCollaboratorRole(tripId, targetUserId, newRole) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    
    const { error } = await supabase
        .from('trip_collaborators')
        .update({ role: newRole })
        .eq('trip_id', tripId)
        .eq('user_id', targetUserId);
        
    if (error) throw new Error(error.message);
    revalidatePath('/ai-planner');
    return { success: true };
}

export async function removeCollaborator(tripId, targetUserId) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    
    const { error } = await supabase
        .from('trip_collaborators')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', targetUserId);
        
    if (error) throw new Error(error.message);
    revalidatePath('/ai-planner');
    return { success: true };
}

export async function leaveTrip(tripId) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    
    const { error } = await supabase
        .from('trip_collaborators')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', userId);
        
    if (error) throw new Error(error.message);
    revalidatePath('/ai-planner');
    return { success: true };
}

export async function getTripCollaborators(tripId) {
    const { data, error } = await supabase
        .from('trip_collaborators')
        .select('*')
        .eq('trip_id', tripId);

    if (error) {
        console.error("Supabase Error fetching trip collaborators:", error);
        return [];
    }
    
    if (!data || data.length === 0) return [];

    try {
        const userIds = data.map(c => c.user_id);
        const client = await clerkClient();
        const usersResponse = await client.users.getUserList({ userId: userIds });
        const users = usersResponse.data;

        return data.map(collab => {
            const clerkUser = users.find(u => u.id === collab.user_id);
            if (clerkUser) {
                return {
                    ...collab,
                    userId: collab.user_id,
                    name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : (clerkUser.username || null),
                    email: clerkUser.emailAddresses[0]?.emailAddress || null,
                    photoURL: clerkUser.imageUrl || null
                };
            }
            return {
                ...collab,
                userId: collab.user_id
            };
        });
    } catch (e) {
        console.error("Error fetching Clerk users for collaborators:", e);
        return data; // Fallback to raw DB data if Clerk fails
    }
}
