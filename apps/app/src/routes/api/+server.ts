import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SECRET_ULTRAVOX_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
    try {
        let body;
        try {
            body = await request.json();
        } catch (e) {
            console.error('Failed to parse request body:', e);
            return new Response(JSON.stringify({
                error: 'Invalid JSON in request body'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        // Validate the chat_message_prompts
        if (!body?.chat_message_prompts || !Array.isArray(body.chat_message_prompts) || body.chat_message_prompts.length === 0) {
            return new Response(JSON.stringify({
                error: 'chat_message_prompts must contain at least 1 item'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        // Log API key presence and first few characters (safely)
        const apiKey = SECRET_ULTRAVOX_API_KEY || '';
        console.log('API Key starts with:', apiKey.substring(0, 8) + '...');
        
        // Prepare headers exactly as shown in documentation
        const headers = {
            'Content-Type': 'application/json',
            'X-API-Key': SECRET_ULTRAVOX_API_KEY
        };
        
        console.log('Request headers:', {
            ...headers,
            'X-API-Key': headers['X-API-Key'] ? 'Present (length: ' + headers['X-API-Key'].length + ')' : 'Missing'
        });

        // Make request to Ultravox API with minimal payload
        console.log('Making request to Ultravox API...');
        const ultravoxResponse = await fetch('https://api.ultravox.ai/api/calls', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                systemPrompt: "You are an expert on speech-to-speech communication.",
                temperature: 0.8
            })
        });

        // Log complete response for debugging
        const responseText = await ultravoxResponse.text();
        console.log('Ultravox API Response Status:', ultravoxResponse.status);
        console.log('Ultravox API Response Headers:', Object.fromEntries([...ultravoxResponse.headers]));
        console.log('Ultravox API Response Body:', responseText);

        if (!ultravoxResponse.ok) {
            // Try to get more information about the subscription status
            const checkResponse = await fetch('https://api.ultravox.ai/api/account', {
                method: 'GET',
                headers: {
                    'X-API-Key': SECRET_ULTRAVOX_API_KEY
                }
            });
            
            const accountInfo = await checkResponse.text();
            console.log('Account Status Response:', checkResponse.status);
            console.log('Account Info:', accountInfo);

            if (ultravoxResponse.status === 402) {
                throw new Error(`Subscription issue. Account status: ${accountInfo}`);
            }
            throw new Error(`Ultravox API error: ${ultravoxResponse.status} - ${responseText}`);
        }

        const ultravoxData = JSON.parse(responseText);
        
        if (!ultravoxData.joinUrl) {
            throw new Error('No joinUrl in Ultravox response');
        }

        return json({
            success: true,
            joinUrl: ultravoxData.joinUrl,
            message: 'Successfully created Ultravox call'
        });
    } catch (error) {
        console.error('Error processing request:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Internal server error'
        }), {
            status: error instanceof Error && error.message.includes('subscription') ? 402 : 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};
