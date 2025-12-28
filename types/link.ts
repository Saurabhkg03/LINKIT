export interface LinkItem {
    id: string;
    type: "link" | "stack" | "vault";
    title: string;
    url?: string;
    domain?: string;
    image?: string | null;
    icon?: string | null;
    tags?: string[];
    gradient?: string;
    description?: string;
    count?: number;

    // Status flags
    isFavorite?: boolean;
    isArchived?: boolean;
    isTrash?: boolean;
    isPrivate?: boolean;

    createdAt?: any;
}

export interface PreviewData {
    title?: string;
    description?: string;
    image?: string | null;
    icon?: string | null;
    domain?: string;
    gradient?: string;
    tags?: string[];
}
