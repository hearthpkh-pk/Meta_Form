export type PageType = 'Profile Page' | 'Classic Page' | 'Business' | 'Group' | string;

export type Status = 'Active' | 'Rest' | 'Warning' | 'Restricted' | 'Error';

export interface Account {
    id: string;
    uid: string;
    mail: string;
    password?: string;
    passmail?: string;
    twoPin?: string;
    url?: string;
    pagesManaged: string[]; // Array of Page IDs
    status: Status;
    showPassword?: boolean; // Client-side state only
}

export interface Page {
    id: string;
    name: string;
    type: PageType;
    url: string;
    status: Status;
    comment: string;
    order: number;
}
