import { createOperation, z } from '../generated/wundergraph.factory';
import { writeFileSync, unlinkSync } from 'fs';
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

        // Return special response for non-admin users
        if (!user?.roles?.includes("admin")) {
            return {
                data: {
                    error: 'pioneer-list',
                    text: null
                }
            };
        }

        // Create a temporary file path
        const tempFilePath = join(tmpdir(), `audio-${Date.now()}.webm`);

        try {
            if (!context.openai) {
                throw new Error('OpenAI client not initialized');
            }

            // Convert base64 to buffer
            const binaryData = Buffer.from(input.audioBase64.split(',')[1], 'base64');

            // Write buffer to temporary file
            writeFileSync(tempFilePath, binaryData);

            // Use the OpenAI SDK with the file path
            const transcript = await context.openai.audio.transcriptions.create({
                file: await import('fs').then(fs => fs.createReadStream(tempFilePath)),
                model: 'whisper-1'
            });

            console.log('📝 Received transcript:', transcript.text);

            return {
                data: {
                    text: transcript.text
                }
            };

        } catch (error) {
            console.error('❌ Transcription error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to transcribe audio');
        } finally {
            // Clean up: delete the temporary file
            try {
                unlinkSync(tempFilePath);
            } catch (e) {
                console.error('Failed to delete temporary file:', e);
            }
        }
    }
}); 