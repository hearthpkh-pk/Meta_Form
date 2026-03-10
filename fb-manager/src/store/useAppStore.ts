import { create } from 'zustand';
import { Account, Page, PageType } from '@/types';

// TODO: Replace with Real backend/Supabase API calls
const mockPages: Page[] = [];
const mockAccounts: Account[] = [];
const defaultPageTypes: PageType[] = ['Profile Page', 'Classic Page', 'Business', 'Group'];

interface AppState {
    accounts: Account[];
    pages: Page[];
    pageTypes: PageType[];

    // Actions
    setAccounts: (accounts: Account[]) => void;
    addAccount: (account: Account) => void;
    updateAccount: (id: string, updates: Partial<Account>) => void;
    removeAccount: (id: string) => void;

    setPages: (pages: Page[]) => void;
    addPage: (page: Page) => void;
    updatePage: (id: string, updates: Partial<Page>) => void;
    removePage: (id: string) => void;

    addPageType: (type: string) => void;
    removePageType: (type: string) => void;
    updatePageOrder: (pages: Page[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
    accounts: mockAccounts,
    pages: mockPages,
    pageTypes: defaultPageTypes,

    setAccounts: (accounts) => set({ accounts }),
    addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
    updateAccount: (id, updates) => set((state) => ({
        accounts: state.accounts.map(acc => acc.id === id ? { ...acc, ...updates } : acc)
    })),
    removeAccount: (id) => set((state) => ({
        accounts: state.accounts.filter(acc => acc.id !== id)
    })),

    setPages: (pages) => set({ pages }),
    addPage: (page) => set((state) => ({ pages: [...state.pages, page] })),
    updatePage: (id, updates) => set((state) => ({
        pages: state.pages.map(page => page.id === id ? { ...page, ...updates } : page)
    })),
    removePage: (id) => set((state) => ({
        pages: state.pages.filter(page => page.id !== id),
        // Cleanup reference in accounts
        accounts: state.accounts.map(acc => ({
            ...acc,
            pagesManaged: acc.pagesManaged.filter(pId => pId !== id)
        }))
    })),

    addPageType: (type) => set((state) => ({ pageTypes: [...state.pageTypes, type] })),
    removePageType: (type) => set((state) => ({ pageTypes: state.pageTypes.filter(t => t !== type) })),
    updatePageOrder: (pages) => set({ pages }),
}));
