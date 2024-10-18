<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '@iconify/svelte';

  interface Transaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
  }

  let balance = 3245.67;
  let transactions: Transaction[] = [
    { id: 1, date: '2023-06-15', description: 'Salary Deposit', amount: 2500.00, type: 'credit' },
    { id: 2, date: '2023-06-14', description: 'Grocery Store', amount: 78.35, type: 'debit' },
    { id: 3, date: '2023-06-13', description: 'Electric Bill', amount: 120.50, type: 'debit' },
    { id: 4, date: '2023-06-12', description: 'Restaurant', amount: 45.80, type: 'debit' },
    { id: 5, date: '2023-06-10', description: 'Online Shopping', amount: 89.99, type: 'debit' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
</script>

<div class="w-full h-full bg-surface-900 text-white p-6 overflow-auto">
  <div class="max-w-3xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Account Balance</h1>
    
    <div class="bg-surface-800 rounded-lg p-6 mb-8">
      <p class="text-lg mb-2">Current Balance</p>
      <p class="text-4xl font-bold">{formatCurrency(balance)}</p>
    </div>
    
    <h2 class="text-2xl font-bold mb-4">Recent Transactions</h2>
    
    <div class="bg-surface-800 rounded-lg overflow-hidden">
      {#each transactions as transaction (transaction.id)}
        <div class="flex items-center justify-between p-4 border-b border-surface-700 last:border-b-0">
          <div class="flex items-center">
            <div class="bg-surface-700 rounded-full p-2 mr-4">
              <Icon icon={transaction.type === 'credit' ? 'mdi:arrow-down' : 'mdi:arrow-up'} class="w-6 h-6" />
            </div>
            <div>
              <p class="font-semibold">{transaction.description}</p>
              <p class="text-sm text-gray-400">{formatDate(transaction.date)}</p>
            </div>
          </div>
          <p class={transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'}>
            {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
          </p>
        </div>
      {/each}
    </div>
  </div>
</div>