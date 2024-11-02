<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import Icon from '@iconify/svelte';

  interface Transaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    type: 'deposit' | 'withdrawal';
    category: string;
  }

  const balance = writable(5000);
  const transactions = writable<Transaction[]>([]);
  const filteredTransactions = writable<Transaction[]>([]);
  const activeCategory = writable<string | null>(null);

  const categories = [
    { name: 'Einkommen', icon: 'mdi:cash-plus' },
    { name: 'Ausgaben', icon: 'mdi:cash-minus' },
    { name: 'Sparen', icon: 'mdi:piggy-bank' },
    { name: 'Investitionen', icon: 'mdi:chart-line' },
    { name: 'Sonstiges', icon: 'mdi:dots-horizontal' },
  ];

  function generateRandomTransactions(): Transaction[] {
    const descriptions = ['Gehalt', 'Supermarkt', 'Sparkonto', 'Aktienhandel', 'Online-Kauf'];
    const types: ('deposit' | 'withdrawal')[] = ['deposit', 'withdrawal'];
    
    return Array.from({ length: 20 }, (_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      const category = type === 'deposit' ? categories[0] : categories[Math.floor(Math.random() * (categories.length - 1)) + 1];
      
      return {
        id: i + 1,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        amount: Math.floor(Math.random() * 500) + 10,
        type: type,
        category: category.name
      };
    });
  }

  onMount(() => {
    const generatedTransactions = generateRandomTransactions();
    transactions.set(generatedTransactions);
    filteredTransactions.set(generatedTransactions);
  });

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  }

  function filterTransactions(category: string | null) {
    activeCategory.set(category);
    if (category === null) {
      filteredTransactions.set($transactions);
    } else {
      filteredTransactions.set($transactions.filter(t => t.category === category));
    }
  }
</script>

<div class="w-full h-full bg-surface-900 text-white p-6 overflow-auto">
  <h1 class="text-3xl font-bold mb-6">Mein Bankkonto</h1>
  
  <div class="bg-surface-700 rounded-lg p-6 mb-6">
    <h2 class="text-xl font-semibold mb-2">Kontostand</h2>
    <p class="text-4xl font-bold">{formatCurrency($balance)}</p>
  </div>

  <div class="mb-6">
    <h2 class="text-xl font-semibold mb-4">Kategorien</h2>
    <div class="flex flex-wrap gap-2">
      <button
        class="px-4 py-2 rounded-full bg-surface-600 hover:bg-surface-500 transition-colors duration-200 flex items-center"
        class:bg-primary-500={$activeCategory === null}
        on:click={() => filterTransactions(null)}
      >
        <Icon icon="mdi:filter-off" class="mr-2" />
        Alle anzeigen
      </button>
      {#each categories as category}
        <button
          class="px-4 py-2 rounded-full bg-surface-600 hover:bg-surface-500 transition-colors duration-200 flex items-center"
          class:bg-primary-500={$activeCategory === category.name}
          on:click={() => filterTransactions(category.name)}
        >
          <Icon icon={category.icon} class="mr-2" />
          {category.name}
        </button>
      {/each}
    </div>
  </div>

  <div class="bg-surface-700 rounded-lg p-6">
    <h2 class="text-xl font-semibold mb-4">Transaktionen</h2>
    <ul class="space-y-4">
      {#each $filteredTransactions as transaction (transaction.id)}
        <li class="flex justify-between items-center bg-surface-600 p-4 rounded-lg">
          <div>
            <p class="font-semibold">{transaction.description}</p>
            <p class="text-sm text-gray-300">{transaction.date}</p>
            <p class="text-sm text-gray-400">{transaction.category}</p>
          </div>
          <div class="flex items-center">
            {#if transaction.type === 'deposit'}
              <Icon icon="mdi:arrow-down-bold" class="text-green-500 mr-2" />
              <span class="text-green-500">{formatCurrency(transaction.amount)}</span>
            {:else}
              <Icon icon="mdi:arrow-up-bold" class="text-red-500 mr-2" />
              <span class="text-red-500">-{formatCurrency(transaction.amount)}</span>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  </div>
</div>