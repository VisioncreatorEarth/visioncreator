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

            // Log input details
            console.log('📥 Input base64 details:', {
                length: input.audioBase64.length,
                startsWith: input.audioBase64.substring(0, 50),
                containsHeader: input.audioBase64.includes('data:audio/'),
                mimeType: input.audioBase64.match(/^data:([^;]+);/)?.[1] || 'unknown'
            });

            // Convert base64 to buffer
            const binaryData = Buffer.from(input.audioBase64.split(',')[1], 'base64');

            // Log binary data details
            console.log('📦 Binary data details:', {
                length: binaryData.length,
                firstBytes: binaryData.slice(0, 16).toString('hex'),
                lastBytes: binaryData.slice(-16).toString('hex')
            });

            // Write to temp file
            writeFileSync(tempFile, binaryData);

            // Log file stats
            const stats = statSync(tempFile);
            console.log('📁 File details:', {
                size: stats.size,
                path: tempFile,
                type: 'audio/webm',
                exists: true,
                permissions: stats.mode,
                created: stats.birthtime
            });

            // Create file stream for OpenAI
            const fileStream = createReadStream(tempFile);
            Object.assign(fileStream, {
                name: 'audio.webm',
                contentType: 'audio/webm',
                filepath: tempFile,
                fieldname: 'file'
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
            // Enhanced error logging
            if (error instanceof Error) {
                console.error('Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                    cause: error.cause
                });
            }
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