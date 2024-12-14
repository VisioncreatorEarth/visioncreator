import { env } from '$env/dynamic/private';
import jwt from 'jsonwebtoken';
import type { RequestEvent } from '@sveltejs/kit';

const { verify } = jwt;

export async function GET({ request }: RequestEvent) {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader) {
		console.error('No Authorization header provided');
		return new Response(JSON.stringify({ error: 'No Authorization header provided' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const token = authHeader.split(' ')[1];
	if (!token) {
		console.error('No JWT provided');
		return new Response(JSON.stringify({ error: 'No JWT provided' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const decoded = verify(token, env.SECRET_SUPABASE_JWT_SECRET) as jwt.JwtPayload;

		if (!decoded.sub) {
			console.error('Invalid JWT: Subject missing');
			return new Response(JSON.stringify({ error: 'Invalid JWT: Subject missing' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Initialize roles array from the token
		const roles = decoded.role ? [decoded.role as string] : [];

		// Check if the subject is one of the hardcoded admin IDs
		if (decoded.sub === '00000000-0000-0000-0000-000000000001') {
			roles.push('admin');
		}

		const user = {
			id: decoded.sub,
			name: (decoded.name as string) || 'Unknown',
			email: decoded.email as string,
			roles
		};


		return new Response(JSON.stringify(user), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.error('JWT verification error:', err);
		return new Response(JSON.stringify({ error: 'Invalid JWT' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}