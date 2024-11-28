<script>
  import { onMount } from 'svelte';
  
  let permissionStatus = 'unknown'; // 'unknown', 'granted', 'denied', 'error'
  let errorMessage = '';
  let loading = false;
  let isIOS = false;

  onMount(() => {
    checkPlatform();
  });

  function checkPlatform() {
    const ua = window.navigator.userAgent.toLowerCase();
    isIOS = /iphone|ipad|ipod/.test(ua) && /safari|crios/.test(ua);
    console.log('Platform check - isIOS Safari:', isIOS);
  }

  async function requestMicrophonePermission() {
    console.log('Starting permission request...');
    loading = true;
    errorMessage = '';
    
    try {
      // iOS Safari specific handling
      if (isIOS) {
        console.log('iOS Safari detected, using specific handling');
        // Ensure window.navigator is accessed in the click handler
        if (!window.navigator) {
          throw new Error('Navigator API not available');
        }
      }

      console.log('Requesting microphone permission...');
      const stream = await navigator.mediaDevices?.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      console.log('Permission granted! Stream:', stream);
      permissionStatus = 'granted';

      // Immediately stop the stream since we only want to test permissions
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track.label);
      });

    } catch (error) {
      console.error('Permission request failed:', error);
      permissionStatus = 'error';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access was denied. Please allow access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (!navigator.mediaDevices) {
        errorMessage = 'Please ensure you are using HTTPS or localhost for microphone access.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
    } finally {
      loading = false;
    }
  }
</script>

<div class="container">
  <div class="card">
    <h2>Microphone Permission Test</h2>
    
    <div class="status-box">
      {#if loading}
        <div class="skeleton-loader">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
        </div>
      {:else}
        <p>Current Status: <span class="status-text">{permissionStatus}</span></p>
        {#if errorMessage}
          <p class="error">{errorMessage}</p>
        {/if}
      {/if}
    </div>

    <button 
      on:click={requestMicrophonePermission}
      class="permission-button"
      disabled={loading}
    >
      {#if loading}
        Requesting...
      {:else}
        Request Microphone Permission
      {/if}
    </button>

    {#if isIOS}
      <p class="ios-note">Note: iOS may require additional permissions in Settings.</p>
    {/if}
  </div>
</div>

<style>
  :global(body) {
    background-color: #1a1a1a;
    color: #ffffff;
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
  }

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

  h2 {
    margin-top: 0;
    color: #ffffff;
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .status-box {
    margin: 20px 0;
    padding: 15px;
    border-radius: 8px;
    background-color: #363636;
    min-height: 80px;
  }

  .status-text {
    color: #4CAF50;
    font-weight: 500;
  }

  .error {
    color: #ff4444;
    margin-top: 10px;
  }

  .permission-button {
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    background-color: #4CAF50;
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
  }

  .permission-button:hover {
    background-color: #45a049;
    transform: translateY(-1px);
  }

  .permission-button:disabled {
    background-color: #666666;
    cursor: not-allowed;
    transform: none;
  }

  .skeleton-loader {
    animation: pulse 1.5s infinite;
  }

  .skeleton-line {
    height: 20px;
    background-color: #404040;
    border-radius: 4px;
    margin-bottom: 10px;
  }

  @keyframes pulse {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 0.8;
    }
    100% {
      opacity: 0.6;
    }
  }

  .ios-note {
    margin-top: 16px;
    color: #888888;
    font-size: 0.9rem;
    text-align: center;
  }
</style>
