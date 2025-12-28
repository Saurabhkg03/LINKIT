export interface ThemeStyles {
    background: string;
    text: string;
    description: string;
    border: string;
    accent: string;
    iconBg: string;
}

export interface LinkItem {
    id: string;
    type: "link" | "stack" | "vault";
    title: string;
    url?: string;
    domain?: string;
    image?: string | null;
    icon?: string | null;
    tags?: string[];
    // Deprecated: gradient
    theme?: ThemeStyles; // Now optional to handle legacy or missing data
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
    theme?: ThemeStyles;
    tags?: string[];
}
