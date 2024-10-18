import { json } from '@sveltejs/kit';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST({ request }) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return json({ error: 'No audio file provided' }, { status: 400 });
        }

        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
        });

        return json({ transcription: transcription.text });
    } catch (error) {
        console.error('Error transcribing audio:', error);
        return json({ error: 'Error transcribing audio' }, { status: 500 });
    }
}
