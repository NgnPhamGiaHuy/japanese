import { Trophy } from "lucide-react";

interface UserAvatarProps {
    src?: string | null;
    active: boolean;
    activeColor?: string;
    size?: number;
}

/**
 * UserAvatar Component
 *
 * Renders a circular user profile image with an active state.
 * Falls back to a Trophy icon if no image is provided.
 */
export const UserAvatar = ({
    src,
    active,
    activeColor = "text-[#1cb0f6]",
    size = 26,
}: UserAvatarProps) => {
    const avatarSize = size - 2;

    if (!src) {
        return (
            <Trophy
                size={size}
                strokeWidth={active ? 2.5 : 2}
                className={active ? activeColor : "text-[#afafaf]"}
            />
        );
    }

    return (
        <div
            className={`overflow-hidden rounded-full border-2 transition-all duration-150 ${
                active
                    ? `${activeColor} scale-110 border-current shadow-sm`
                    : "border-transparent opacity-80 grayscale-[40%]"
            }`}
            style={{ width: avatarSize, height: avatarSize }}
        >
            <img src={src} alt="User" className="h-full w-full object-cover" />
        </div>
    );
};

export default UserAvatar;
