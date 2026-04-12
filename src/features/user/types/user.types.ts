export interface UserData {
    xp: number;
    streak: number;
    lastPlayed: string | null;
    lessonsCompleted: number;
}

export const INITIAL_USER_DATA: UserData = {
    xp: 0,
    streak: 0,
    lastPlayed: null,
    lessonsCompleted: 0,
};
