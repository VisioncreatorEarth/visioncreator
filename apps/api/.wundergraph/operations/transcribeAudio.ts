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

        // Create unique temp file path with explicit .webm extension
        const tempFile = join(tmpdir(), `audio-${Date.now()}-${Math.random().toString(36).slice(2)}.webm`);

        try {
            if (!context.openai) {
                throw new Error('OpenAI client not initialized');
            }

            // Clean the base64 string and convert to buffer
            const base64Data = input.audioBase64.replace(/^data:audio\/webm;base64,/, '');
            const binaryData = Buffer.from(base64Data, 'base64');

            // Write to temp file
            writeFileSync(tempFile, binaryData);

            // Create file stream for OpenAI with proper metadata
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

            // Use OpenAI's SDK with the enhanced file stream
            const transcript = await context.openai.audio.transcriptions.create({
                file: fileStream as any,
                model: 'whisper-1',
                response_format: 'json'
            });

            console.log('📝 Received transcript:', transcript.text);

            return {
                data: {
                    text: transcript.text
                }
            };

        } catch (error) {
            console.error('❌ Transcription error:', error);

            // Enhanced error handling
            const errorMessage = error instanceof Error ? error.message : 'Failed to transcribe audio';
            console.error('Detailed error:', {
                message: errorMessage,
                type: error instanceof Error ? error.constructor.name : typeof error,
                details: error
            });

            return {
                data: {
                    error: errorMessage,
                    text: null
                }
            };
        } finally {
            // Always clean up the temp file
            try {
                unlinkSync(tempFile);
                console.log('🧹 Cleaned up temporary file:', tempFile);
            } catch (e) {
                console.error('Failed to clean up temp file:', e);
            }
        }
    }
}); 