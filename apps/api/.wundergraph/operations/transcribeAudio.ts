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

        // Return special response for non-admin users
        if (!user?.roles?.includes("admin")) {
            return {
                data: {
                    error: 'pioneer-list',
                    text: null
                }
            };
        }

        // Create unique temp file path
        const tempFile = join(tmpdir(), `audio-${Date.now()}-${Math.random().toString(36).slice(2)}.webm`);

        try {
            if (!context.openai) {
                throw new Error('OpenAI client not initialized');
            }

            // Convert base64 to buffer
            const binaryData = Buffer.from(input.audioBase64.split(',')[1], 'base64');

            // Write to temp file
            writeFileSync(tempFile, binaryData);

            // Create file stream for OpenAI
            const fileStream = createReadStream(tempFile);
            Object.assign(fileStream, {
                name: 'audio.webm',
                contentType: 'audio/webm',
                filepath: tempFile,
                fieldname: 'file'
            });

            // Log file details for debugging
            console.log('📁 File details:', {
                size: binaryData.length,
                path: tempFile,
                type: 'audio/webm'
            });

            // Use OpenAI's SDK with the file stream
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
            return {
                data: {
                    error: error instanceof Error ? error.message : 'Failed to transcribe audio',
                    text: null
                }
            };
        } finally {
            // Clean up temp file
            try {
                unlinkSync(tempFile);
                console.log('🧹 Cleaned up temporary file:', tempFile);
            } catch (e) {
                console.error('Failed to clean up temp file:', e);
            }
        }
    }
}); 