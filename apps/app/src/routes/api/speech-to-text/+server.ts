import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import { json } from '@sveltejs/kit';

const openai = new OpenAI({
    apiKey: env.SECRET_OPENAI_API_KEY
});

export async function POST({ request }) {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
        return json({ error: 'No audio file provided' }, { status: 400 });
    }

    try {
        const transcript = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
        });

        return json({ text: transcript.text });
    } catch (error) {
        console.error('Error in speech-to-text:', error);
        return json({ error: 'Failed to transcribe audio' }, { status: 500 });
    }
}
