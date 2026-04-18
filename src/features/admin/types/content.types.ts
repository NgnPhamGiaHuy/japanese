export interface AdminDeck {
    id: string;
    ownerId: string;
    ownerName: string | null;
    ownerEmail: string | null;
    ownerAvatar: string | null;
    title: string;
    description: string;
    cardCount: number;
    createdAt: string | null;
    path: string;
    categories?: string[];
    themeColor?: string;
}

export interface PaginatedContent {
    items: AdminDeck[];
    nextPageToken: string | null;
    total: number;
}
