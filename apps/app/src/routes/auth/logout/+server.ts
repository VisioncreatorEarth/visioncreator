import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession();

    if (session) {
        const { error } = await supabase.auth.signOut();
        if (error) {
            return new Response(JSON.stringify({ success: false, message: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        throw redirect(303, '/');
    }

    return new Response(JSON.stringify({ success: false, message: 'No active session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
    });
}; 