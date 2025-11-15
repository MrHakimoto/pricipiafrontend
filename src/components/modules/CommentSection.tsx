// components/modules/CommentSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import CommentCard from './CommentCard';
import { getLessonComments, postLessonComment, updateLessonComment, deleteLessonComment } from '@/lib/course/comments';
import type { ContentComment } from '@/lib/course/comments';

interface CommentSectionProps {
  courseContentId: number;
}

export default function CommentSection({ courseContentId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  // Cast session para acessar laravelToken
  const sessionAny = session as any;

  // Carregar comentários
  useEffect(() => {
    loadComments();
  }, [courseContentId]);

  const loadComments = async () => {
    if (!sessionAny?.laravelToken) return;
    
    try {
      setLoading(true);
      const commentsData = await getLessonComments(sessionAny.laravelToken, courseContentId);
      setComments(commentsData.data);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !sessionAny?.laravelToken) return;

    try {
      setSubmitting(true);
      await postLessonComment(sessionAny.laravelToken, courseContentId, newComment);
      setNewComment('');
      await loadComments(); // Recarrega os comentários
    } catch (error) {
      console.error('Erro ao criar comentário:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: number) => {
    if (!replyText.trim() || !sessionAny?.laravelToken) return;

    try {
      setSubmitting(true);
      await postLessonComment(sessionAny.laravelToken, courseContentId, replyText, parentId);
      setReplyText('');
      setReplyingTo(null);
      await loadComments(); // Recarrega os comentários
    } catch (error) {
      console.error('Erro ao criar resposta:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: number, newBody: string) => {
    if (!sessionAny?.laravelToken) return;

    try {
      await updateLessonComment(sessionAny.laravelToken, commentId, newBody);
      await loadComments(); // Recarrega os comentários
    } catch (error) {
      console.error('Erro ao editar comentário:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!sessionAny?.laravelToken) return;

    try {
      await deleteLessonComment(sessionAny.laravelToken, commentId);
      await loadComments(); // Recarrega os comentários
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex space-x-3 rounded-lg bg-zinc-900 p-4">
            <div className="h-10 w-10 rounded-full bg-gray-700 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-1/4 animate-pulse" />
              <div className="h-3 bg-gray-700 rounded w-full animate-pulse" />
              <div className="h-3 bg-gray-700 rounded w-3/4 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campo para novo comentário */}
      <div className="bg-zinc-900 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Deixe seu comentário</h3>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Digite aqui seu comentário..."
          rows={4}
          className="w-full p-3 rounded-md bg-[#00091A] border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
            className="px-6 py-2 bg-[#0E00D0] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-md cursor-pointer transition"
          >
            {submitting ? 'Publicando...' : 'Publicar comentário'}
          </button>
        </div>
      </div>

      {/* Lista de comentários */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onReply={setReplyingTo}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              currentUserId={sessionAny?.user?.id}
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