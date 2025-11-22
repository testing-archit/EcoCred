<script lang="ts">
  import { notifications, notificationActions } from '../stores/notifications';
  import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-svelte';
  
  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle
  };
  
  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-200'
  };
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
  {#each $notifications as notification (notification.id)}
    <div
      class="flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg animate-slide-in {colors[notification.type]}"
      role="alert"
    >
      <svelte:component this={icons[notification.type]} class="w-5 h-5 flex-shrink-0 mt-0.5" />
      
      <p class="flex-1 text-sm font-medium">
        {notification.message}
      </p>
      
      <button
        onclick={() => notificationActions.remove(notification.id)}
        class="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  {/each}
</div>
