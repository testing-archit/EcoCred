import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'light';

    const stored = localStorage.getItem('ecocred_theme') as Theme;
    if (stored) return stored;

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const theme: Writable<Theme> = writable(getInitialTheme());

// Apply theme to document
if (typeof window !== 'undefined') {
    theme.subscribe(value => {
        document.documentElement.setAttribute('data-theme', value);
        localStorage.setItem('ecocred_theme', value);
    });
}

export const themeActions = {
    toggle: () => {
        theme.update(current => current === 'light' ? 'dark' : 'light');
    },

    set: (newTheme: Theme) => {
        theme.set(newTheme);
    }
};
