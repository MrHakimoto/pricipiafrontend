"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp } from "lucide-react";
import { toggleLike } from "@/lib/course/like";

type ForumLikeType = "duvida" | "resposta_forum";

interface ForumLikeButtonProps {
  token?: string;
  entityType: ForumLikeType;
  entityId: number;
  initialLiked?: boolean;
  initialCount?: number;
  compact?: boolean;
}

export default function ForumLikeButton({
  token,
  entityType,
  entityId,
  initialLiked = false,
  initialCount = 0,
  compact = false,
}: ForumLikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const disabled = !token || loading || !entityId;

  const title = useMemo(() => {
    if (!token) return "Entre para curtir";
    return liked ? "Remover curtida" : "Curtir";
  }, [token, liked]);

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
      console.error("Erro ao curtir fórum:", error);

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
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      className={`
        relative inline-flex items-center justify-center gap-1.5 overflow-hidden
        rounded-xl border px-3 py-2 text-xs font-bold transition
        disabled:cursor-not-allowed disabled:opacity-50
        ${
          liked
            ? "border-blue-500/40 bg-blue-500/15 text-blue-200"
            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
        }
        ${compact ? "h-9 px-2" : ""}
      `}
    >
      <AnimatePresence>
        {liked && (
          <motion.span
            key={burstKey}
            initial={{ scale: 0.2, opacity: 0.45 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute h-8 w-8 rounded-full bg-blue-500/30"
          />
        )}
      </AnimatePresence>

      <motion.span
        animate={
          liked
            ? {
                scale: [1, 1.25, 1],
                rotate: [0, -8, 8, 0],
              }
            : {
                scale: 1,
                rotate: 0,
              }
        }
        transition={{ duration: 0.32 }}
        className="relative z-10 inline-flex"
      >
        <ThumbsUp
          className="h-4 w-4"
          fill={liked ? "currentColor" : "none"}
        />
      </motion.span>

      {!compact && (
        <span className="relative z-10">
          {liked ? "Curtido" : "Curtir"}
        </span>
      )}

      {likesCount > 0 && (
        <motion.span
          key={likesCount}
          initial={{ y: -3, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 text-[11px] opacity-80"
        >
          {likesCount}
        </motion.span>
      )}

      {loading && (
        <span className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden">
          <motion.span
            className="block h-full w-1/2 bg-blue-400"
            animate={{ x: ["-100%", "220%"] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          />
        </span>
      )}
    </motion.button>
  );
}