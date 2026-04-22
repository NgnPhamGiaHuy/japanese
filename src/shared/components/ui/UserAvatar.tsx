import { Trophy } from "lucide-react";

/** Attributes for rendering a UserAvatar. */
interface UserAvatarProps {
    /** Optional URL for the user's profile image. */
    src?: string | null;
    /** Whether the user is currently in an active state. */
    active: boolean;
    /** Tailwind text color class for the active indicator. */
    activeColor?: string;
    /** Diameter of the avatar in pixels. */
    size?: number;
}

/**
 * Circular user profile image with activity status.
 *
 * @remarks
 * Renders a high-quality profile image or falls back to a Trophy icon if no image
 * is available. Features smooth scaling and color transitions for active states.
 *
 * @example
 * <UserAvatar src={user.image} active={user.isOnline} size={40} />
 */
const UserAvatar = ({
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
