import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';

let openai: OpenAI | null = null;

if (dev && env.SECRET_OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: env.SECRET_OPENAI_API_KEY
    });
}

export async function POST({ request }) {
    console.log('Speech-to-text endpoint hit');

    if (!dev) {
        console.log('Not in dev mode');
        return json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
    }

    if (!openai) {
        console.log('OpenAI client not initialized');
        return json({ error: 'OpenAI client is not initialized' }, { status: 500 });
    }

    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            console.log('No audio file provided');
            return json({ error: 'No audio file provided' }, { status: 400 });
        }

        console.log('Audio file type:', audioFile.type);
        console.log('Audio file size:', audioFile.size);

        if (audioFile.size === 0) {
            return json({ error: 'Audio file is empty' }, { status: 400 });
        }

        const transcript = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1'
        });

        console.log('Received transcript:', transcript.text);
        return json({ text: transcript.text });
    } catch (error) {
        console.error('Error in speech-to-text:', error);
        return json({
            error: error instanceof Error ? error.message : 'Failed to transcribe audio'
        }, { status: 500 });
    }
}
