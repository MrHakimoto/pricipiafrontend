// components/modules/CommentCard.tsx
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCircle,
  MoreVertical,
  Edit,
  Trash2,
  Reply,
  ThumbsUp,
} from "lucide-react";
import type { ContentComment } from "@/lib/course/comments";
import { toggleLike } from "@/lib/course/like";
import { AnimatedRoleName } from "@/components/user/AnimatedRoleName";
import { getLevelTitle } from "@/lib/gamification/levels";

interface CommentCardProps {
  comment: ContentComment & {
    likes_count?: number;
    liked_by_me?: boolean;
  };
  token?: string;
  onReply: (commentId: number) => void;
  onEdit: (commentId: number, newBody: string) => void;
  onDelete: (commentId: number) => void;
  currentUserId?: number | null;
  replyingTo: number | null;
  replyText: string;
  setReplyText: (text: string) => void;
  onSubmitReply: (parentId: number) => void;
  level?: number;
}

function CommentLikeButton({
  token,
  commentId,
  initialLiked = false,
  initialCount = 0,
}: {
  token?: string;
  commentId: number;
  initialLiked?: boolean;
  initialCount?: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const disabled = !token || loading || !commentId;

  const title = useMemo(() => {
    if (!token) return "Entre para curtir";
    return liked ? "Remover curtida" : "Curtir comentário";
  }, [token, liked]);

  async function handleToggleLike() {
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
        entity_type: "comentario",
        entity_id: commentId,
      });

      setLiked(response.liked);
      setLikesCount(response.likes_count);
    } catch (error) {
      console.error("Erro ao curtir comentário:", error);

      setLiked(previousLiked);
      setLikesCount(previousCount);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleToggleLike}
      disabled={disabled}
      title={title}
      aria-pressed={liked}
      whileTap={{ scale: disabled ? 1 : 0.92 }}
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      className={`
        relative inline-flex items-center gap-1.5 overflow-hidden rounded-md px-2 py-1
        text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50
        ${
          liked
            ? "bg-[#0E00D0]/15 text-blue-300 ring-1 ring-[#0E00D0]/40"
            : "text-gray-400 hover:bg-gray-800/70 hover:text-gray-200"
        }
      `}
    >
      <AnimatePresence>
        {liked && (
          <motion.span
            key={burstKey}
            initial={{ scale: 0.2, opacity: 0.45 }}
            animate={{ scale: 2.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute left-2 h-7 w-7 rounded-full bg-blue-500/30"
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

      <span className="relative z-10">{liked ? "Curtido" : "Curtir"}</span>

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

export default function CommentCard({
  comment,
  token,
  onReply,
  onEdit,
  onDelete,
  currentUserId,
  replyingTo,
  replyText,
  setReplyText,
  onSubmitReply,
  level = 0,
}: CommentCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);

  const isOwnComment = Number(currentUserId) === Number(comment.user_id);
  const maxLevel = 3;

  const author = comment.author;
  const authorRoles = author?.roles ?? [];
  const authorPrimaryRole = authorRoles[0] ?? null;
  const authorLevel = author?.gamification?.current_level ?? 1;
  const authorLevelTitle = getLevelTitle(authorLevel);

  const handleEdit = () => {
    if (editText.trim() && editText !== comment.body) {
      onEdit(comment.id, editText.trim());
    }

    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(comment.body);
    setIsEditing(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "há poucos minutos";

    if (diffInHours < 24) {
      return `há ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);

    return `há ${diffInDays} dia${diffInDays > 1 ? "s" : ""}`;
  };

  return (
    <div className={level > 0 ? "ml-8 border-l-2 border-gray-700 pl-4" : ""}>
      <motion.div
        className="mb-4 flex w-full space-x-3 rounded-lg bg-zinc-900 p-4 text-gray-200 shadow-md"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex-shrink-0">
          {author?.avatar ? (
            <img
              src={author.avatar}
              alt={author.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <UserCircle strokeWidth={1} className="h-10 w-10 text-gray-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <AnimatedRoleName
                name={author?.name ?? "Usuário"}
                roles={authorRoles}
                role={authorPrimaryRole}
                level={authorLevel}
                levelTitle={authorLevelTitle}
                nameClassName="text-sm"
              />

              {isOwnComment && (
                <span className="rounded-full bg-blue-600 px-2 py-1 text-xs text-white">
                  Você
                </span>
              )}

              <span className="text-xs text-gray-500">
                {formatTimeAgo(comment.created_at)}
              </span>
            </div>

            {isOwnComment && (
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowOptions((current) => !current)}
                  className="cursor-pointer rounded p-1 transition hover:bg-gray-800"
                  aria-label="Opções do comentário"
                >
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </button>

                {showOptions && (
                  <div className="absolute right-0 top-6 z-10 min-w-28 rounded-md border border-gray-700 bg-gray-800 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                        setShowOptions(false);
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-700"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onDelete(comment.id);
                        setShowOptions(false);
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-md border border-gray-700 bg-[#00091A] p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleEdit}
                  disabled={!editText.trim()}
                  className="cursor-pointer rounded-md bg-[#0E00D0] px-4 py-2 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Salvar
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="cursor-pointer rounded-md bg-gray-600 px-4 py-2 font-semibold text-white transition hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
              {comment.body}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
            <CommentLikeButton
              token={token}
              commentId={comment.id}
              initialLiked={Boolean(comment.liked_by_me)}
              initialCount={comment.likes_count ?? 0}
            />

            {level < maxLevel && (
              <motion.button
                type="button"
                onClick={() => onReply(comment.id)}
                className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-gray-400 transition hover:bg-gray-800/70 hover:text-gray-200"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
              >
                <Reply className="h-4 w-4" />
                Responder
              </motion.button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div className="mt-4 space-y-3">
              <textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Digite sua resposta..."
                rows={3}
                className="w-full resize-none rounded-md border border-gray-700 bg-[#00091A] p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSubmitReply(comment.id)}
                  disabled={!replyText.trim()}
                  className="cursor-pointer rounded-md bg-[#0E00D0] px-4 py-2 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Responder
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReplyText("");
                    onReply(0);
                  }}
                  className="cursor-pointer rounded-md bg-gray-600 px-4 py-2 font-semibold text-white transition hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              token={token}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              currentUserId={currentUserId}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={onSubmitReply}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}