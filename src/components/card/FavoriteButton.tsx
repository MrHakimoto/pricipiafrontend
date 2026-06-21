"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getFavoriteStatus,
  toggleFavorite,
  type FavoriteEntityType,
} from "@/lib/course/favorite";

interface FavoriteButtonProps {
  token?: string;
  entityType: FavoriteEntityType;
  entityId: number;
  initialFavorited?: boolean;
  label?: string;
  compact?: boolean;
}

export default function FavoriteButton({
  token,
  entityType,
  entityId,
  initialFavorited = false,
  label = "Salvar",
  compact = false,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const disabled = !token || loading || !entityId;

  const title = useMemo(() => {
    if (!token) return "Entre para salvar";
    return favorited ? "Remover dos favoritos" : "Salvar nos favoritos";
  }, [token, favorited]);

  useEffect(() => {
    let alive = true;

    async function loadStatus() {
      if (!token || !entityId) return;

      try {
        const response = await getFavoriteStatus(token, entityType, entityId);

        if (!alive) return;

        setFavorited(response.favorited);
      } catch (error) {
        console.error("Erro ao carregar status de favorito:", error);
      }
    }

    loadStatus();

    return () => {
      alive = false;
    };
  }, [token, entityType, entityId]);

  async function handleToggle() {
    if (disabled) return;

    const previousFavorited = favorited;
    const nextFavorited = !previousFavorited;

    setFavorited(nextFavorited);

    if (nextFavorited) {
      setBurstKey((key) => key + 1);
    }

    try {
      setLoading(true);

      const response = await toggleFavorite(token, {
        entity_type: entityType,
        entity_id: entityId,
      });

      setFavorited(response.favorited);
    } catch (error) {
      console.error("Erro ao alternar favorito:", error);

      setFavorited(previousFavorited);
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
      aria-pressed={favorited}
      whileTap={{ scale: disabled ? 1 : 0.92 }}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      className={` cursor-pointer
        relative inline-flex items-center justify-center overflow-hidden
        rounded-md border px-3 py-2 text-sm font-medium transition
        disabled:cursor-not-allowed disabled:opacity-50
        ${
          favorited
            ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-300 hover:bg-yellow-500/20"
            : "border-gray-600 bg-transparent text-gray-200 hover:bg-gray-700/30"
        }
        ${compact ? "h-8 w-9 px-0 py-0" : "gap-2"}
      `}
    >
      <AnimatePresence>
        {favorited && (
          <motion.span
            key={burstKey}
            initial={{ scale: 0.2, opacity: 0.45 }}
            animate={{ scale: 2.3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute h-8 w-8 rounded-full bg-yellow-400/30"
          />
        )}
      </AnimatePresence>

      <motion.span
        animate={
          favorited
            ? {
                scale: [1, 1.2, 1],
                rotate: [0, -6, 6, 0],
              }
            : {
                scale: 1,
                rotate: 0,
              }
        }
        transition={{ duration: 0.32 }}
        className="relative z-10 inline-flex"
      >
        <Bookmark
          size={16}
          className={favorited ? "text-yellow-300" : "text-current"}
          fill={favorited ? "currentColor" : "none"}
        />
      </motion.span>

      {!compact && (
        <span className="relative z-10">
          {favorited ? "Salvo" : label}
        </span>
      )}

      {loading && (
        <span className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden">
          <motion.span
            className="block h-full w-1/2 bg-yellow-300"
            animate={{ x: ["-100%", "220%"] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          />
        </span>
      )}
    </motion.button>
  );
}