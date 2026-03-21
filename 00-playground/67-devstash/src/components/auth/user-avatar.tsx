import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  user: {
    name?: string | null;
    image?: string | null;
  };
  className?: string;
  size?: "default" | "sm" | "lg";
}

export function UserAvatar({ user, className, size }: UserAvatarProps) {
  const initials = user.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <Avatar className={className} size={size}>
      {user.image && (
        <AvatarImage src={user.image} alt={user.name || "User"} />
      )}
      <AvatarFallback className="bg-primary/10 text-primary font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
