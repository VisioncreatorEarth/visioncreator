<script lang="ts">
  import { onMount } from "svelte";

  let isRecording = false;
  let transcription = "";
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];

  const store = createComposerStore({
    id: "whisper-transcription",
    data: { transcription: "" },
  });

  onMount(() => {
    return () => {
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
    };
  });

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        await sendAudioToServer(audioBlob);
      };

      mediaRecorder.start();
      isRecording = true;
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }

  function stopRecording() {
    if (mediaRecorder) {
      mediaRecorder.stop();
      isRecording = false;
    }
  }

  async function sendAudioToServer(audioBlob: Blob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        transcription = result.transcription;
        store.update((state) => ({ ...state, transcription }));
      } else {
        console.error("Error transcribing audio:", await response.text());
      }
    } catch (error) {
      console.error("Error sending audio to server:", error);
    }
  }
</script>

<div
  class="flex flex-col items-center p-4 space-y-4 rounded-lg bg-surface-100-800-token"
>
  <h2 class="text-2xl font-bold">Whisper Transcription</h2>
  <button
    class="btn variant-filled-primary"
    on:click={isRecording ? stopRecording : startRecording}
  >
    {isRecording ? "Stop Recording" : "Start Recording"}
  </button>
  <div class="w-full max-w-lg">
    <textarea
      class="w-full h-32 p-2 textarea bg-surface-200-700-token"
      placeholder="Transcription will appear here..."
      bind:value={transcription}
      readonly
    />
  </div>
</div>
