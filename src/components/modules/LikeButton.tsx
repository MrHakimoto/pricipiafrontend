"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getLikeStatus, toggleLike } from "@/lib/course/like";

type LikeEntityType = "aula" | "duvida" | "comentario";

interface LikeButtonProps {
  token?: string;
  entityType: LikeEntityType;
  entityId: number;
  label?: string;
  compact?: boolean;
  initialLiked?: boolean;
  initialCount?: number;
}

export default function LikeButton({
  token,
  entityType,
  entityId,
  label = "Curtir",
  compact = false,
  initialLiked = false,
  initialCount = 0,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const disabled = !token || loading || !entityId;

  const title = useMemo(() => {
    if (!token) return "Entre para curtir";
    return liked ? "Remover curtida" : "Curtir";
  }, [token, liked]);

  useEffect(() => {
    let alive = true;

    async function loadStatus() {
      if (!token || !entityId) return;

      try {
        const status = await getLikeStatus(token, entityType, entityId);

        if (!alive) return;

        setLiked(status.liked);
        setLikesCount(status.likes_count);
      } catch (error) {
        console.error("Erro ao carregar status de curtida:", error);
      }
    }

    loadStatus();

    return () => {
      alive = false;
    };
  }, [token, entityType, entityId]);

  async function handleToggle() {
    if (disabled) return;

    const previousLiked = liked;
    const previousCount = likesCount;

    const nextLiked = !previousLiked;
    const nextCount = nextLiked
      ? previousCount + 1
      : Math.max(0, previousCount - 1);

    setLiked(nextLiked);
    setLikesCount(nextCount);

    if (nextLiked) {
      setBurstKey((key) => key + 1);
    }

    try {
      setLoading(true);

      const response = await toggleLike(token, {
        entity_type: entityType,
        entity_id: entityId,
      });

      setLiked(response.liked);
      setLikesCount(response.likes_count);
    } catch (error) {
      console.error("Erro ao alternar curtida:", error);

      setLiked(previousLiked);
      setLikesCount(previousCount);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      title={title}
      aria-pressed={liked}
      whileTap={{ scale: disabled ? 1 : 0.92 }}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      className={`cursor-pointer
        relative inline-flex items-center justify-center overflow-hidden
        rounded-md border px-3 py-2 text-sm font-medium transition
        disabled:cursor-not-allowed disabled:opacity-50
        ${
          liked
            ? "border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/20"
            : "border-gray-600 bg-transparent text-gray-200 hover:bg-gray-700/30"
        }
        ${compact ? "h-8 w-9 px-0 py-0" : "gap-2"}
      `}
    >
      <AnimatePresence>
        {liked && (
          <motion.span
            key={burstKey}
            initial={{ scale: 0.2, opacity: 0.5 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute h-8 w-8 rounded-full bg-rose-500/30"
          />
        )}
      </AnimatePresence>

      <motion.span
        animate={
          liked
            ? {
                scale: [1, 1.28, 1],
                rotate: [0, -8, 8, 0],
              }
            : {
                scale: 1,
                rotate: 0,
              }
        }
        transition={{ duration: 0.35 }}
        className="relative z-10 inline-flex"
      >
        <Heart
          size={16}
          className={liked ? "text-rose-400" : "text-current"}
          fill={liked ? "currentColor" : "none"}
        />
      </motion.span>

      {!compact && (
        <span className="relative z-10">
          {liked ? "Curtido" : label}
        </span>
      )}

      {likesCount > 0 && (
        <motion.span
          key={likesCount}
          initial={{ y: -4, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`
            relative z-10 text-xs
            ${liked ? "text-rose-200" : "text-gray-400"}
          `}
        >
          {likesCount}
        </motion.span>
      )}

      {loading && (
        <span className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden">
          <motion.span
            className="block h-full w-1/2 bg-rose-400"
            animate={{ x: ["-100%", "220%"] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          />
        </span>
      )}
    </motion.button>
  );
}