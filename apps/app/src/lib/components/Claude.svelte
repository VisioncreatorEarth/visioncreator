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

<div class="w-full h-full flex items-center justify-center bg-surface-50-900-token">
  <div class="card p-4 w-full h-full max-w-2xl shadow-xl flex flex-col">
    <header class="card-header">
      <h2 class="h2 mb-4">Einkaufsliste</h2>
    </header>
    
    <section class="p-4 flex-grow overflow-y-auto">
      <div class="relative mb-4">
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
          <div class="card absolute z-10 w-full mt-1 max-h-48 overflow-y-auto">
            {#each filteredItems as item}
              <button
                class="w-full p-2 text-left hover:bg-surface-hover-token flex items-center"
                on:click={() => addItem(item.name, item.icon)}
              >
                <Icon icon={item.icon} class="w-5 h-5 mr-2" />
                {item.name}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        {#each $shoppingList as item (item.id)}
          <button
            on:click={() => removeItem(item.id)}
            class="flex flex-col items-center justify-center p-4 bg-surface-200-700-token rounded-lg hover:bg-surface-300-600-token transition-colors duration-200"
          >
            <Icon icon={item.icon} class="w-16 h-16 mb-2" />
            <span class="text-sm text-center">{item.name}</span>
          </button>
        {/each}
      </div>

      {#if $shoppingList.length === 0}
        <p class="text-center text-surface-500">Ihre Einkaufsliste ist leer.</p>
      {/if}
    </section>
  </div>
</div>