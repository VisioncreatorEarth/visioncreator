import { createOperation, z } from '../generated/wundergraph.factory';
import { writeFileSync, createReadStream, unlinkSync, statSync } from 'fs';
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
                const base64Data = input.audioBase64.split(',')[1];
                binaryData = Buffer.from(base64Data, 'base64');
            } else {
                binaryData = Buffer.from(input.audioBase64, 'base64');
            }


            // Validate audio data
            if (binaryData.length < 100) {
                throw new Error('Audio data too small');
            }

            // Always use .mp4 for consistency
            tempFile = join(tmpdir(), `audio-${Date.now()}.mp4`);
            writeFileSync(tempFile, binaryData);

            // Log file details
            const stats = statSync(tempFile);

            // Create file stream with detailed logging
            const fileStream = createReadStream(tempFile);
            Object.assign(fileStream, {
                name: 'audio.mp4',
                contentType: 'audio/mp4',
            });


            // Log OpenAI request
            const transcript = await context.openai.audio.transcriptions.create({
                file: fileStream as any,
                model: 'whisper-1',
            });

            return { data: { text: transcript.text } };

        } catch (error) {
            console.error('❌ Transcription error:', error);
            // Detailed error logging
            console.error('Error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                type: typeof error,
                details: error
            });
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
                    console.log('🧹 Cleaned up temporary file:', tempFile);
                } catch (e) {
                    console.error('Cleanup error:', e);
                }
            }
        }
    }
}); 