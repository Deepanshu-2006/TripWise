'use server';

import { supabase } from '../../lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTripInvite(tripId, email, role = 'editor') {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    
    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    
    // 1. Save invite in Supabase
    const { error: dbError } = await supabase
        .from('trip_invites')
        .insert([{ trip_id: tripId, email, role, token }]);
        
    if (dbError) {
        console.error("Error creating invite:", dbError);
        throw new Error('Failed to create invite in database');
    }
    
    // 2. Send email via Resend
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`;
    
    try {
        await resend.emails.send({
            from: 'TripWise <onboarding@resend.dev>', // Using default test email for resend
            to: email,
            subject: 'You have been invited to collaborate on a trip!',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>You're Invited to TripWise</title>
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 40px 0; margin: 0;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                        
                        <!-- Header Image or Gradient -->
                        <div style="background: linear-gradient(135deg, #FF6B2C 0%, #FFA842 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px; font-family: Georgia, serif;">TripWise</h1>
                            <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 8px; margin-bottom: 0;">Your Next Adventure Awaits</p>
                        </div>
                        
                        <!-- Body -->
                        <div style="padding: 40px 30px;">
                            <h2 style="color: #111827; font-size: 24px; margin-top: 0; margin-bottom: 16px;">You've been invited! ✈️</h2>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
                                Someone has invited you to collaborate on a trip itinerary as an <strong>${role}</strong>. Join the workspace to view the map, explore activities, and help plan the perfect journey together.
                            </p>
                            
                            <div style="text-align: center; margin: 40px 0;">
                                <a href="${inviteLink}" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 16px 32px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 12px;">
                                    View Trip Itinerary
                                </a>
                            </div>
                            
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                            
                            <p style="color: #9ca3af; font-size: 14px; margin-bottom: 8px;">If the button above doesn't work, copy and paste this link into your browser:</p>
                            <p style="color: #6b7280; font-size: 14px; word-break: break-all; margin-top: 0;">
                                <a href="${inviteLink}" style="color: #FF6B2C; text-decoration: underline;">${inviteLink}</a>
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center;">
                            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                                © 2026 TripWise AI Planner. All rights reserved.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
    } catch (emailError) {
        console.error("Error sending email:", emailError);
        throw new Error('Failed to send email');
    }

    return { success: true, token };
}

export async function generateTripInviteLink(tripId, role = 'editor') {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    
    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Save invite in Supabase (email is optional/null for link-based invites)
    const { error: dbError } = await supabase
        .from('trip_invites')
        .insert([{ trip_id: tripId, email: 'link-invite', role, token }]);
        
    if (dbError) {
        console.error("Error creating invite:", dbError);
        throw new Error('Failed to create invite link');
    }
    
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`;
    return { success: true, inviteLink };
}

export async function acceptTripInvite(token) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    
    // 1. Fetch invite
    const { data: invite, error: fetchError } = await supabase
        .from('trip_invites')
        .select('*')
        .eq('token', token)
        .single();
        
    if (fetchError || !invite) {
        throw new Error('Invalid or expired invite token');
    }
    
    if (new Date(invite.expires_at) < new Date()) {
        throw new Error('Invite has expired');
    }

    // 2. Add user to collaborators
    const { error: insertError } = await supabase
        .from('trip_collaborators')
        .insert([{ 
            trip_id: invite.trip_id, 
            user_id: userId, 
            role: invite.role 
        }]);
        
    if (insertError && insertError.code !== '23505') { 
        console.error("Error adding collaborator:", insertError);
        throw new Error('Failed to join trip');
    }

    // 3. Delete invite token (Using RPC or ignoring error if RLS blocks it)
    await supabase
        .from('trip_invites')
        .delete()
        .eq('id', invite.id);

    revalidatePath('/ai-planner');
    
    return { success: true, tripId: invite.trip_id };
}
