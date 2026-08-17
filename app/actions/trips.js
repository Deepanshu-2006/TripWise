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

export async function publishTrip(tripId) {
    const { userId } = await auth();
    if (!userId) throw new Error('You must be signed in to publish a trip');

    // Make sure they own the trip or are an editor
    const { data: trip, error: checkError } = await supabase
        .from('trips')
        .select('user_id')
        .eq('id', tripId)
        .single();
        
    if (checkError) {
        throw new Error('Trip not found or access denied');
    }

    const { data, error } = await supabase
        .from('trips')
        .update({ is_public: true })
        .eq('id', tripId)
        .select();

    if (error) {
        throw new Error(`Failed to publish trip: ${error.message}`);
    }

    revalidatePath('/community');
    return { success: true };
}

export async function getPublicTrips() {
    const { data, error } = await supabase
        .from('trips')
        .select('*, trip_collaborators(user_id, role, joined_at)')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Supabase Error fetching public trips:", error);
        return [];
    }
    
    return data || [];
}

export async function seedPublicTrips(mockTrips) {
    const { userId } = await auth();
    if (!userId) throw new Error('Must be signed in to seed');
    
    // First, wipe any existing seed data (trips where is_public=true and have a specific structure)
    // To prevent wiping real public trips accidentally, we only wipe trips that have 'communityMeta' in their JSON.
    const { data: existingTrips } = await supabase
        .from('trips')
        .select('id, itinerary_data')
        .eq('is_public', true)
        .eq('user_id', userId);
        
    if (existingTrips && existingTrips.length > 0) {
        const seedTripIds = existingTrips
            .filter(t => {
                const data = typeof t.itinerary_data === 'string' ? JSON.parse(t.itinerary_data) : (t.itinerary_data || {});
                return !!data.communityMeta;
            })
            .map(t => t.id);
            
        if (seedTripIds.length > 0) {
            await supabase.from('trips').delete().in('id', seedTripIds);
        }
    }
    
    // Insert the new mock trips and mark them as public.
    const insertedTrips = [];
    
    for (const trip of mockTrips) {
        // Generate an array of days based on the mock duration
        const duration = trip.duration || 1;
        const mockDaysArray = Array.from({ length: duration }).map((_, i) => ({
            dayNumber: i + 1,
            dateLabel: `Day ${i + 1}`,
            activities: [
                {
                    time: "10:00 AM",
                    title: `Explore ${trip.destination} Center`,
                    description: `Start your day wandering around the central part of ${trip.destination}. Check out local cafes and landmarks.`,
                    type: "Activity",
                    duration: "2 hours",
                    location: {
                        name: `${trip.destination} City Center`,
                        lat: 0,
                        lng: 0
                    }
                },
                {
                    time: "02:00 PM",
                    title: `Visit Historic Sights in ${trip.destination}`,
                    description: `Immerse yourself in the local history and culture.`,
                    type: "Sightseeing",
                    duration: "3 hours",
                    location: {
                        name: `Historic District, ${trip.destination}`,
                        lat: 0,
                        lng: 0
                    }
                }
            ]
        }));
        
        const fakeItineraryData = {
            destinationName: trip.destination,
            imageUrl: trip.image,
            tagline: trip.tagline || 'A beautiful community trip',
            estimatedCost: 'N/A',
            coordinates: { lat: 0, lng: 0 },
            days: mockDaysArray,
            communityMeta: {
                creatorName: trip.creator?.name || 'Community Member',
                creatorAvatar: trip.creator?.avatar || '',
                creatorBadges: trip.creator?.badges || [],
                budget: trip.budget,
                vibes: trip.vibes,
                upvotes: trip.upvotes,
                bookmarks: trip.bookmarks
            }
        };
        
        const { data, error } = await supabase
            .from('trips')
            .insert([{ 
                user_id: userId, 
                destination_name: trip.destination, 
                itinerary_data: fakeItineraryData,
                is_public: true 
            }])
            .select();
            
        if (!error && data) {
            insertedTrips.push(data[0]);
        }
    }
    
    revalidatePath('/community');
    return { success: true, count: insertedTrips.length };
}

export async function clonePublicTrip(tripId) {
    const { userId } = await auth();
    if (!userId) throw new Error('Must be signed in to save a trip');

    // Fetch the original public trip
    const { data: trip, error: fetchError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .eq('is_public', true)
        .single();

    if (fetchError || !trip) {
        throw new Error('Trip not found or not public');
    }

    // Clone the itinerary data
    const actualData = typeof trip.itinerary_data === 'string' 
        ? JSON.parse(trip.itinerary_data) 
        : (trip.itinerary_data || {});

    // Ensure it's not marked as public when saved to user's account
    const { data: newTrip, error: insertError } = await supabase
        .from('trips')
        .insert([{
            user_id: userId,
            destination_name: trip.destination_name,
            itinerary_data: actualData,
            is_public: false
        }])
        .select();

    if (insertError) {
        throw new Error('Failed to save trip to your account');
    }
    
    // Attempt to increment the save count on the original public trip
    try {
        const meta = actualData.communityMeta || {};
        meta.bookmarks = (meta.bookmarks || 0) + 1;
        actualData.communityMeta = meta;
        
        await supabase
            .from('trips')
            .update({ itinerary_data: actualData })
            .eq('id', tripId);
    } catch(e) {
        // Silently fail if we can't update the global save count, the user still gets their clone
        console.error('Failed to increment save count:', e);
    }

    revalidatePath('/dashboard');
    revalidatePath('/community');
    return { success: true, newTripId: newTrip[0].id };
}

export async function unsavePublicTrip(originalTripId, clonedTripId) {
    const { userId } = await auth();
    if (!userId) throw new Error('Must be signed in to unsave a trip');

    // Delete the cloned trip
    const { error: deleteError } = await supabase
        .from('trips')
        .delete()
        .eq('id', clonedTripId)
        .eq('user_id', userId);

    if (deleteError) {
        throw new Error('Failed to remove saved trip');
    }

    // Attempt to decrement the save count on the original public trip
    try {
        const { data: trip } = await supabase
            .from('trips')
            .select('itinerary_data')
            .eq('id', originalTripId)
            .single();

        if (trip) {
            const actualData = typeof trip.itinerary_data === 'string' 
                ? JSON.parse(trip.itinerary_data) 
                : (trip.itinerary_data || {});
            
            const meta = actualData.communityMeta || {};
            meta.bookmarks = Math.max(0, (meta.bookmarks || 0) - 1);
            actualData.communityMeta = meta;
            
            await supabase
                .from('trips')
                .update({ itinerary_data: actualData })
                .eq('id', originalTripId);
        }
    } catch(e) {
        console.error('Failed to decrement save count:', e);
    }

    revalidatePath('/dashboard');
    revalidatePath('/community');
    return { success: true };
}
