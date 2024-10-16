<script lang="ts">
  import { writable } from 'svelte/store';

  interface ShoppingItem {
    id: number;
    name: string;
    icon: string;
  }

  const preselectedItems = [
    { name: 'Apfel', icon: 'mdi:fruit-apple' },
    { name: 'Banane', icon: 'mdi:fruit-banana' },
    { name: 'Brot', icon: 'mdi:bread-slice' },
    { name: 'Karotte', icon: 'mdi:carrot' },
    { name: 'Käse', icon: 'mdi:cheese' },
    { name: 'Ei', icon: 'mdi:egg' },
    { name: 'Fisch', icon: 'mdi:fish' },
    { name: 'Milch', icon: 'mdi:bottle-soda' },
    { name: 'Tomate', icon: 'mdi:fruit-tomato' },
    { name: 'Hühnchen', icon: 'mdi:food-drumstick' },
    { name: 'Kartoffel', icon: 'mdi:potato' },
    { name: 'Zwiebel', icon: 'mdi:onion' },
    { name: 'Knoblauch', icon: 'mdi:garlic' },
    { name: 'Küchentücher', icon: 'mdi:paper-roll' },
    { name: 'Toilettenpapier', icon: 'mdi:toilet-paper' },
    { name: 'Shampoo', icon: 'mdi:shampoo' },
    { name: 'Zahnpasta', icon: 'mdi:toothpaste' },
    { name: 'Kaffeebohnen', icon: 'mdi:coffee' },
    { name: 'Tee', icon: 'mdi:tea' },
    { name: 'Wein', icon: 'mdi:wine' },
  ];

  const shoppingList = writable<ShoppingItem[]>([]);

  let newItemName = '';
  let showDropdown = false;

  function addItem(name: string, icon: string = '') {
    if (name.trim()) {
      shoppingList.update(items => [
        ...items,
        {
          id: Date.now(),
          name: name.trim(),
          icon: icon
        }
      ]);
      newItemName = '';
      showDropdown = false;
    }
  }

  function removeItem(id: number) {
    shoppingList.update(items => items.filter(item => item.id !== id));
  }

  $: filteredItems = preselectedItems.filter(item => 
    item.name.toLowerCase().includes(newItemName.toLowerCase())
  );
</script>

<div class="w-full h-full flex flex-col bg-surface-50-900-token relative">
  <div class="card p-4 w-full flex-grow overflow-y-auto">
    <header class="card-header">
      <h2 class="h2 mb-4">Einkaufsliste</h2>
    </header>
    
    <section class="flex-grow">
      <div class="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-4 mb-4">
        {#each $shoppingList as item (item.id)}
          <button
            on:click={() => removeItem(item.id)}
            class="aspect-square flex flex-col items-center justify-center p-2 bg-surface-200-700-token rounded-lg hover:bg-surface-300-600-token transition-colors duration-200"
          >
            <Icon icon={item.icon} class="w-1/2 h-1/2 mb-2" />
            <span class="text-xs text-center overflow-hidden text-ellipsis">{item.name}</span>
          </button>
        {/each}
      </div>

      {#if $shoppingList.length === 0}
        <p class="text-center text-surface-500">Ihre Einkaufsliste ist leer.</p>
      {/if}
    </section>
  </div>

  <div class="p-4 bg-surface-100-800-token relative z-30">
    <div class="relative">
      <div class="input-group input-group-divider grid-cols-[1fr_auto]">
        <input
          bind:value={newItemName}
          on:focus={() => showDropdown = true}
          on:blur={() => setTimeout(() => showDropdown = false, 200)}
          placeholder="Neuer Artikel"
          class="input"
        />
        <button on:click={() => addItem(newItemName)} class="btn variant-filled-primary">+</button>
      </div>
      {#if showDropdown && filteredItems.length > 0}
        <div class="card absolute bottom-full left-0 right-0 z-20 w-full mb-2 max-h-64 overflow-y-auto grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2 p-2 bg-surface-100-800-token">
          {#each filteredItems as item}
            <button
              class="aspect-square flex flex-col items-center justify-center p-2 bg-surface-200-700-token rounded-lg hover:bg-surface-300-600-token transition-colors duration-200"
              on:click={() => addItem(item.name, item.icon)}
            >
              <Icon icon={item.icon} class="w-1/2 h-1/2 mb-1" />
              <span class="text-xs text-center overflow-hidden text-ellipsis">{item.name}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  {#if showDropdown}
    <div class="absolute inset-0 bg-black/30 backdrop-blur-sm z-10" on:click={() => showDropdown = false}></div>
  {/if}
</div>