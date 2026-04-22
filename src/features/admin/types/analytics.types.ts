export interface AdminStats {
    totalUsers: number;
    activeUsersToday: number;
    totalFlashcards: number;
    totalSessions: number;
    errorRate: number;
    activeAdmins: number;
    activeSuperAdmins: number;
}

export interface GrowthPoint {
    date: string;
    newUsers: number;
    totalUsers: number;
}

export interface ActivityPoint {
    date: string;
    dau: number;
    wau: number;
}

export interface EngagementPoint {
    feature: string;
    count: number;
    percentage: number;
}

export interface RetentionPoint {
    day: number;
    rate: number;
}

export interface RolePoint {
    name: string;
    value: number;
}

/** One bucket in the log-volume-over-time chart (grouped by day). */
export interface LogVolumePoint {
    date: string;
    total: number;
    AUTH: number;
    ADMIN_ACTION: number;
    USER_ACTION: number;
    CONTENT: number;
    SYSTEM: number;
    ERROR: number;
}

/** One slice in the log-by-level breakdown. */
export interface LogLevelPoint {
    level: string;
    count: number;
}

/** Top N most frequent actions. */
export interface TopActionPoint {
    action: string;
    count: number;
}

export interface AnalyticsData {
    growth: GrowthPoint[];
    activity: ActivityPoint[];
    engagement: EngagementPoint[];
    retention: RetentionPoint[];
    roles: RolePoint[];
    content: RolePoint[];
    errorTrends: { date: string; errors: number }[];
    timeRange: "7d" | "30d" | "90d";
    /** Log-derived charts — computed from system_logs already fetched */
    logVolume: LogVolumePoint[];
    logsByLevel: LogLevelPoint[];
    topActions: TopActionPoint[];
}

export interface DailyAnalyticsSnapshot {
    date: string;
    newUsers: number;
    activeUsers: number;
    sessions: number;
    errors: number;
    flashcardsCreated: number;
    featureUsage: Record<string, number>;
}
