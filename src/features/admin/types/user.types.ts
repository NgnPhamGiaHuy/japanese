export interface AdminUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    disabled: boolean;
    isSuperAdmin: boolean;
    isAdmin: boolean;
    lastSignInTime: string | null;
    lastSeenAt: string | null;
    creationTime: string | null;
}

export interface PaginatedUsers {
    users: AdminUser[];
    nextPageToken: string | null;
    total: number;
}
