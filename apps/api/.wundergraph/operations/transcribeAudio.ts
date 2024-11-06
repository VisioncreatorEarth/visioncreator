import { createOperation, z } from '../generated/wundergraph.factory';
import { writeFileSync, createReadStream, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export default createOperation.mutation({
    input: z.object({
        audioBase64: z.string()
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated", "admin"],
    },
    handler: async ({ user, input, context }) => {
        console.log('🎤 Transcription API called');
        let tempFile: string | null = null;

        try {
            if (!context.openai) {
                throw new Error('OpenAI client not initialized');
            }

            // Handle both data URL and raw base64
            let binaryData: Buffer;
            if (input.audioBase64.startsWith('data:')) {
                binaryData = Buffer.from(input.audioBase64.split(',')[1], 'base64');
            } else {
                binaryData = Buffer.from(input.audioBase64, 'base64');
            }

            // Validate audio data
            if (binaryData.length < 100) {
                throw new Error('Audio data too small');
            }

            // Always use .webm for consistency
            tempFile = join(tmpdir(), `audio-${Date.now()}.webm`);
            writeFileSync(tempFile, binaryData);

            console.log('📁 Processing audio file:', {
                size: binaryData.length,
                path: tempFile
            });

            // Create file stream
            const fileStream = createReadStream(tempFile);
            Object.assign(fileStream, {
                name: 'audio.webm',
                contentType: 'audio/webm',
            });

            // Transcribe
            const transcript = await context.openai.audio.transcriptions.create({
                file: fileStream as any,
                model: 'whisper-1',
            });

            return { data: { text: transcript.text } };

        } catch (error) {
            console.error('❌ Transcription error:', error);
            return {
                data: {
                    error: error instanceof Error ? error.message : 'Transcription failed',
                    text: null
                }
            };
        } finally {
            if (tempFile) {
                try {
                    unlinkSync(tempFile);
                } catch (e) {
                    console.error('Cleanup error:', e);
                }
            }
        }
    }
}); 