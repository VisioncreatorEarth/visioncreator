import { createOperation, z } from '../generated/wundergraph.factory';
export default createOperation.query({
  handler: async ({ context }) => {
    try {
      const response = await context.ultravox.getVoices();

      if (response.error) {
        throw new Error(response.error);
      }

      // Process and group voices by language
      const processVoice = (voice: any) => {
        const nameParts = voice.name.split('-');
        const language = nameParts.length > 1 ? nameParts[1] : 'Other';
        return {
          voiceId: voice.voiceId,
          name: voice.name,
          previewUrl: voice.previewUrl,
          language
        };
      };

      const voices = response.data?.results.map(processVoice) || [];

      // Sort by language and then by name
      voices.sort((a, b) => {
        if (a.language === b.language) {
          return a.name.localeCompare(b.name);
        }
        if (a.language === 'Other') return 1;
        if (b.language === 'Other') return -1;
        return a.language.localeCompare(b.language);
      });

      return { voices };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch voices: ${error.message}`);
      }
      throw new Error('Failed to fetch voices');
    }
  },
  response: z.object({
    voices: z.array(
      z.object({
        voiceId: z.string(),
        name: z.string(),
        previewUrl: z.string().nullable(),
        language: z.string()
      })
    )
  })
});