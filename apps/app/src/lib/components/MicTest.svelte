<script>
  let isRunning = false;
  let stream = null;
  let errorMessage = '';

  async function startMic() {
    try {
      console.log('Starting microphone...');
      stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      isRunning = true;
      console.log('Microphone started successfully');
    } catch (error) {
      console.error('Microphone error:', error);
      errorMessage = 'Please allow microphone access to continue.';
      isRunning = false;
    }
  }

  function stopMic() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    isRunning = false;
    console.log('Microphone stopped');
  }
</script>

<div class="container">
  <div class="card">
    {#if errorMessage}
      <div class="error-message">
        {errorMessage}
      </div>
    {/if}

    <div class="button-container">
      {#if !isRunning}
        <button 
          on:click={startMic}
          class="start-button"
        >
          Start Microphone
        </button>
      {:else}
        <button 
          on:click={stopMic}
          class="stop-button"
        >
          Stop Microphone
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .container {
    padding: 20px;
    max-width: 600px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card {
    background-color: #2d2d2d;
    border-radius: 12px;
    padding: 24px;
    width: 100%;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .button-container {
    display: flex;
    justify-content: center;
    margin: 20px 0;
  }

  button {
    padding: 16px 32px;
    border-radius: 8px;
    border: none;
    font-size: 18px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 200px;
  }

  .start-button {
    background-color: #4CAF50;
    color: white;
  }

  .start-button:hover {
    background-color: #45a049;
    transform: translateY(-1px);
  }

  .stop-button {
    background-color: #f44336;
    color: white;
  }

  .stop-button:hover {
    background-color: #d32f2f;
    transform: translateY(-1px);
  }

  .error-message {
    color: #ff4444;
    text-align: center;
    margin-bottom: 20px;
    padding: 10px;
    border-radius: 8px;
    background-color: rgba(255, 68, 68, 0.1);
  }
</style>
