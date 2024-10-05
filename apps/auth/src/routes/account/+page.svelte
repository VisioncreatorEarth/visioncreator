<!-- src/routes/account/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import type { SubmitFunction } from "@sveltejs/kit";

  export let data;

  let { session } = data;
  $: ({ session } = data);

  let loading = false;

  const handleSignOut: SubmitFunction = () => {
    loading = true;
    return async ({ update }) => {
      loading = false;
      update();
    };
  };
</script>

<div class="form-widget">
  <div>
    <label for="email">Email</label>
    <input id="email" type="text" value={session.user.email} disabled />
  </div>

  <form method="post" action="?/signout" use:enhance={handleSignOut}>
    <div>
      <button class="button block" disabled={loading}>Sign Out</button>
    </div>
  </form>
</div>
