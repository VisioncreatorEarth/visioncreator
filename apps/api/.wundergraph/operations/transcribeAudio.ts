import { createOperation, AuthorizationError, z } from '../generated/wundergraph.factory';

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

        try {
            if (!context.openai) {
                throw new Error('OpenAI client not initialized');
            }

            // Convert base64 to File object
            const binaryData = Buffer.from(input.audioBase64.split(',')[1], 'base64');
            const audioBlob = new Blob([binaryData], { type: 'audio/webm' });
            const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

            // Use OpenAI Whisper API
            const transcript = await context.openai.audio.transcriptions.create({
                file: audioFile,
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
        }
    }
}); 