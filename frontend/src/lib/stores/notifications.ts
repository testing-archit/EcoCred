import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    duration?: number;
}

export const notifications: Writable<Notification[]> = writable([]);

let notificationId = 0;

export const notificationActions = {
    add: (type: NotificationType, message: string, duration: number = 5000) => {
        const id = `notification-${notificationId++}`;
        const notification: Notification = { id, type, message, duration };

        notifications.update(n => [...n, notification]);

        if (duration > 0) {
            setTimeout(() => {
                notificationActions.remove(id);
            }, duration);
        }

        return id;
    },

    remove: (id: string) => {
        notifications.update(n => n.filter(notification => notification.id !== id));
    },

    success: (message: string, duration?: number) => {
        return notificationActions.add('success', message, duration);
    },

    error: (message: string, duration?: number) => {
        return notificationActions.add('error', message, duration);
    },

    info: (message: string, duration?: number) => {
        return notificationActions.add('info', message, duration);
    },

    warning: (message: string, duration?: number) => {
        return notificationActions.add('warning', message, duration);
    }
};
