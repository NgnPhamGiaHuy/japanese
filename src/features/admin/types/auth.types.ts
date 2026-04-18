export type AdminRole = "superadmin" | "admin";

export interface CallerContext {
    uid: string;
    role: AdminRole;
}
