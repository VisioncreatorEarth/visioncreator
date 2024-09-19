import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
const { verify } = jwt;

export async function GET({ request }) {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader) {
		throw error(401, 'No Authorization header provided.');
	}

	const token = authHeader.split(' ')[1];
	if (!token) {
		throw error(401, 'No JWT provided.');
	}

	try {
		const decoded = verify(token, env.SECRET_SUPABASE_JWT_SECRET);

		if (!decoded.sub) {
			throw error(401, 'Invalid JWT: Subject missing');
		}
		// Initialize roles array from the token
		const roles = decoded.role ? [decoded.role] : [];

		// Check if the subject is one of the hardcoded admin IDs
		if (['00000000-0000-0000-0000-000000000001'].includes(decoded.sub)) {
			roles.push('admin');
		}
		const user = {
			id: decoded.sub,
			name: decoded.name || 'Unknown',
			email: decoded.email,
			roles
		};

		console.log(user);

		return new Response(JSON.stringify(user), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.error('JWT verification error:', err);
		throw error(401, 'Invalid JWT');
	}
}
