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

            // Log input details (safely)
            console.log('📥 Input base64 details:', {
                length: input.audioBase64.length,
                startsWith: input.audioBase64.substring(0, 50) + '...',
                containsHeader: input.audioBase64.startsWith('data:'),
                mimeType: input.audioBase64.match(/^data:([^;]+);/)?.[1] || 'no mime type'
            });

            // Handle both data URL and raw base64
            let binaryData: Buffer;
            if (input.audioBase64.startsWith('data:')) {
                const base64Data = input.audioBase64.split(',')[1];
                binaryData = Buffer.from(base64Data, 'base64');
                console.log('📦 Decoded from data URL, binary length:', binaryData.length);
            } else {
                binaryData = Buffer.from(input.audioBase64, 'base64');
                console.log('📦 Decoded from raw base64, binary length:', binaryData.length);
            }

            // Log binary data details
            console.log('📦 Binary data details:', {
                length: binaryData.length,
                firstBytes: binaryData.slice(0, 16).toString('hex'),
                lastBytes: binaryData.slice(-16).toString('hex')
            });

            // Validate audio data
            if (binaryData.length < 100) {
                throw new Error('Audio data too small');
            }

            // Always use .mp4 for consistency
            tempFile = join(tmpdir(), `audio-${Date.now()}.mp4`);
            writeFileSync(tempFile, binaryData);

            // Log file details
            const stats = statSync(tempFile);
            console.log('📁 File details:', {
                size: stats.size,
                path: tempFile,
                type: 'audio/mp4',
                extension: 'mp4',
                exists: true,
                permissions: stats.mode,
                created: stats.birthtime
            });

            // Create file stream with detailed logging
            const fileStream = createReadStream(tempFile);
            Object.assign(fileStream, {
                name: 'audio.mp4',
                contentType: 'audio/mp4',
            });
            console.log('📤 Created file stream with metadata:', {
                name: 'audio.mp4',
                contentType: 'audio/mp4',
                path: tempFile
            });

            // Log OpenAI request
            console.log('🤖 Calling OpenAI transcription API...');
            const transcript = await context.openai.audio.transcriptions.create({
                file: fileStream as any,
                model: 'whisper-1',
            });

            console.log('📝 Received transcript:', transcript.text);
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