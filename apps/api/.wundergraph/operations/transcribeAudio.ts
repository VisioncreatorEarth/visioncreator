import { createOperation, z } from '../generated/wundergraph.factory';
import { writeFileSync, unlinkSync, createReadStream } from 'fs';
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

        // Create a temporary file path with explicit .webm extension
        const tempFilePath = join(tmpdir(), `audio-${Date.now()}.webm`);

        try {
            if (!context.openai) {
                throw new Error('OpenAI client not initialized');
            }

            // Convert base64 to buffer
            const binaryData = Buffer.from(input.audioBase64.split(',')[1], 'base64');

            // Write buffer to temporary file
            writeFileSync(tempFilePath, binaryData);

            // Create a read stream with explicit mime type
            const fileStream = createReadStream(tempFilePath);
            // Add necessary properties to the stream
            Object.assign(fileStream, {
                name: 'audio.webm',
                contentType: 'audio/webm'
            });

            // Use the OpenAI SDK with the enhanced file stream
            const transcript = await context.openai.audio.transcriptions.create({
                file: fileStream as any,
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