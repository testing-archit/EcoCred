<script lang="ts">
  import { contractService } from '$lib/services/contracts';
  import { walletService, type WalletState } from '$lib/services/wallet';
  import { onMount } from 'svelte';
  import { Plus, Hash } from 'lucide-svelte';

  let walletState = $state<WalletState>(walletService.getState());
  let counter = $state<number | null>(null);
  let isLoading = $state(false);
  let isIncrementing = $state(false);
  let incrementBy = $state<number>(1);
  let txHash = $state<string | null>(null);

  let unsubscribe: (() => void) | null = null;

  async function loadCounter() {
    if (!walletState.isConnected) return;
    isLoading = true;
    try {
      counter = await contractService.getCounter();
    } catch (err) {
      console.error(err);
    }
    isLoading = false;
  }

  async function doIncrement() {
    if (!walletState.isConnected) return;
    isIncrementing = true;
    try {
      txHash = await contractService.incrementCounter(incrementBy > 1 ? incrementBy : undefined);
      await loadCounter();
    } catch (err) {
      console.error(err);
    }
    isIncrementing = false;
  }

  onMount(() => {
    unsubscribe = walletService.subscribe((state) => {
      walletState = state;
      if (state.isConnected) {
        loadCounter();
      } else {
        counter = null;
      }
    });
    if (walletState.isConnected) {
      loadCounter();
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  });
</script>

<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-secondary-900">Counter</h1>
    <p class="text-secondary-600">Read and increment the on-chain counter</p>
  </div>

  {#if !walletState.isConnected}
    <div class="p-4 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg">
      Connect your wallet to interact with the contract.
    </div>
  {:else}
    <div class="card space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-secondary-600">Current value</p>
          <div class="flex items-center space-x-2">
            <Hash class="h-5 w-5 text-primary-600" />
            <p class="text-2xl font-semibold text-secondary-900">
              {#if isLoading}Loading...{:else}{counter}{/if}
            </p>
          </div>
        </div>
        <button class="btn-secondary" onclick={loadCounter} disabled={isLoading}>
          Refresh
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div class="md:col-span-2">
          <label for="incrementBy" class="block text-sm font-medium text-secondary-700 mb-2">Increment by</label>
          <input id="incrementBy" type="number" min="1" bind:value={incrementBy} class="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>
        <button class="btn-primary flex items-center justify-center" onclick={doIncrement} disabled={isIncrementing}>
          {#if isIncrementing}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Incrementing...
          {:else}
            <Plus class="h-4 w-4 mr-2" />
            Increment
          {/if}
        </button>
      </div>

      {#if txHash}
        <div class="text-xs text-secondary-600">
          Tx: <span class="font-mono">{txHash}</span>
        </div>
      {/if}
    </div>
  {/if}
</div>


