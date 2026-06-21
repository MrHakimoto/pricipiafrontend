// components/modules/CommentSection.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import CommentCard from "./CommentCard";
import {
  getLessonComments,
  postLessonComment,
  updateLessonComment,
  deleteLessonComment,
} from "@/lib/course/comments";
import type { ContentComment } from "@/lib/course/comments";

interface CommentSectionProps {
  courseContentId: number;
}

export default function CommentSection({
  courseContentId,
}: CommentSectionProps) {
  const { data: session, status } = useSession();

  const [comments, setComments] = useState<ContentComment[]>([]);
  const [loading, setLoading] = useState(true);

  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const sessionAny = session as any;
  const token = sessionAny?.laravelToken as string | undefined;
  const currentUserId = sessionAny?.user?.id
    ? Number(sessionAny.user.id)
    : null;

  const loadComments = useCallback(async () => {
    if (!token || !courseContentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const commentsData = await getLessonComments(token, courseContentId);

      setComments(Array.isArray(commentsData.data) ? commentsData.data : []);
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [token, courseContentId]);

  useEffect(() => {
    if (status === "loading") return;

    loadComments();
  }, [status, loadComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !token || submitting) return;

    try {
      setSubmitting(true);

      await postLessonComment(token, courseContentId, newComment.trim());

      setNewComment("");

      await loadComments();
    } catch (error) {
      console.error("Erro ao criar comentário:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: number) => {
    if (!replyText.trim() || !token || submitting) return;

    try {
      setSubmitting(true);

      await postLessonComment(
        token,
        courseContentId,
        replyText.trim(),
        parentId,
      );

      setReplyText("");
      setReplyingTo(null);

      await loadComments();
    } catch (error) {
      console.error("Erro ao criar resposta:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: number, newBody: string) => {
    if (!token || !newBody.trim()) return;

    try {
      await updateLessonComment(token, commentId, newBody.trim());

      await loadComments();
    } catch (error) {
      console.error("Erro ao editar comentário:", error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!token) return;

    try {
      await deleteLessonComment(token, commentId);

      await loadComments();
    } catch (error) {
      console.error("Erro ao excluir comentário:", error);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex space-x-3 rounded-lg bg-zinc-900 p-4">
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-700" />

            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/4 animate-pulse rounded bg-gray-700" />
              <div className="h-3 w-full animate-pulse rounded bg-gray-700" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!token) {
    return (
      <div className="rounded-lg border border-gray-800 bg-zinc-900 p-4 text-center text-sm text-gray-400">
        Faça login para visualizar e participar dos comentários.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-zinc-900 p-4">
        <h3 className="mb-3 font-semibold text-white">Deixe seu comentário</h3>

        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Digite aqui seu comentário..."
          rows={4}
          className="w-full resize-none rounded-md border border-gray-700 bg-[#00091A] p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />

        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
            className="cursor-pointer rounded-md bg-[#0E00D0] px-6 py-2 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Publicando..." : "Publicar comentário"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              token={token}
              onReply={setReplyingTo}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              currentUserId={currentUserId}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={handleSubmitReply}
            />
          ))
        )}
      </div>
    </div>
  );
}