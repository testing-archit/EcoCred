
import { useNotifications } from '../contexts/NotificationContext';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

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

export function ToastNotifications() {
    const { notifications, removeNotification } = useNotifications();

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
            {notifications.map((notification) => {
                const Icon = icons[notification.type];
                return (
                    <div
                        key={notification.id}
                        className={cn(
                            "flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg animate-slide-in",
                            colors[notification.type]
                        )}
                        role="alert"
                    >
                        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="flex-1 text-sm font-medium">
                            {notification.message}
                        </p>
                        <button
                            onClick={() => removeNotification(notification.id)}
                            className="flex-shrink-0 hover:opacity-70 transition-opacity"
                            aria-label="Close notification"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
