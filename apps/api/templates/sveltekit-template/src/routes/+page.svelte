<script lang="ts">
  let greeting: string = "Hello World!";
</script>

<main>
  <h1>{greeting}</h1>
  <p>Welcome to the SvelteKit template</p>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
  }

  h1 {
    color: #ff3e00;
    font-size: 4em;
    margin: 0;
  }

  p {
    color: #333;
    font-size: 1.5em;
  }
</style>
