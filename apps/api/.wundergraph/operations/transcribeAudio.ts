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
        // Check if user is authenticated and has valid ID
        if (!user?.customClaims?.id) {
            throw new AuthorizationError({
                message: "User not authenticated or missing ID.",
            });
        }

        // Check if user has required roles
        if (!user.roles?.includes("admin")) {
            throw new AuthorizationError({
                message: "User does not have required permissions.",
            });
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