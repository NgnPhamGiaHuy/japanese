export interface AdminStats {
    totalUsers: number;
    activeUsersToday: number;
    totalFlashcards: number;
    totalSessions: number;
    errorRate: number; // percentage
    activeAdmins: number;
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
    day: number; // 0, 1, 7, 30
    rate: number; // percentage
}

export interface RolePoint {
    name: string;
    value: number;
}

export interface AnalyticsData {
    growth: GrowthPoint[];
    activity: ActivityPoint[];
    engagement: EngagementPoint[];
    retention: RetentionPoint[];
    roles: RolePoint[];
    errorTrends: { date: string; errors: number }[];
    timeRange: "7d" | "30d" | "90d";
}

export interface DailyAnalyticsSnapshot {
    date: string; // ISO yyyy-mm-dd
    newUsers: number;
    activeUsers: number;
    sessions: number;
    errors: number;
    flashcardsCreated: number;
    featureUsage: Record<string, number>;
}
