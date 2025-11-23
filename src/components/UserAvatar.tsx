"use client";

import { useSession } from "next-auth/react";

interface UserAvatarProps {
  className?: string; // Permite customizar tamanho (w-10 h-10, w-20 h-20, etc)
  ring?: boolean;     // Opcional: adiciona borda de destaque
}

const UserAvatar = ({ className = "w-10 h-10", ring = false }: UserAvatarProps) => {
  const { data: session } = useSession();

  const user = session?.user;
  const image = user?.image;
  const name = user?.name || "Usuário";

  const getInitials = (fullName: string) => {
    const names = fullName.trim().split(" ");
    if (names.length === 0) return "U";
    const firstName = names[0];
    if (names.length === 1) return firstName.charAt(0).toUpperCase();
    const lastName = names[names.length - 1];
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  return (
    <div
      className={`relative rounded-full overflow-hidden border shrink-0 ${className} ${ring ? "ring-2 ring-blue-600 dark:ring-[#0E00D0]" : ""}`}
    >
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full bg-blue-600 dark:bg-[#0E00D0] flex items-center justify-center text-white font-bold select-none">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
