// components/modules/CommentCard.tsx
'use client';

import { motion } from 'framer-motion';
import { UserCircle, MoreVertical, Edit, Trash2, Reply } from 'lucide-react';
import { useState } from 'react';
import type { ContentComment } from '@/lib/course/comments';

interface CommentCardProps {
  comment: ContentComment;
  onReply: (commentId: number) => void;
  onEdit: (commentId: number, newBody: string) => void;
  onDelete: (commentId: number) => void;
  currentUserId?: number;
  replyingTo: number | null;
  replyText: string;
  setReplyText: (text: string) => void;
  onSubmitReply: (parentId: number) => void;
  level?: number;
}

export default function CommentCard({ 
  comment, 
  onReply, 
  onEdit, 
  onDelete, 
  currentUserId,
  replyingTo,
  replyText,
  setReplyText,
  onSubmitReply,
  level = 0 
}: CommentCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);

  const isOwnComment = currentUserId === comment.user_id;
  const maxLevel = 3; // Máximo de níveis de resposta

  const handleEdit = () => {
    if (editText.trim() && editText !== comment.body) {
      onEdit(comment.id, editText);
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
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'há poucos minutos';
    if (diffInHours < 24) return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
  };

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-gray-700 pl-4' : ''}`}>
      {/* Container principal com animação */}
      <motion.div
        className="flex w-full space-x-3 rounded-lg bg-zinc-900 p-4 text-gray-200 shadow-md mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Coluna do Avatar */}
        <div className="flex-shrink-0">
          {comment.author.avatar ? (
            <img 
              src={comment.author.avatar} 
              alt={comment.author.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <UserCircle strokeWidth={1} className="h-10 w-10 text-gray-500" />
          )}
        </div>

        {/* Coluna do Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Header: Nome e Timestamp */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-x-2">
              <span className="font-semibold text-white">{comment.author.name}</span>
              {isOwnComment && (
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                  Você
                </span>
              )}
              <span className="text-xs text-gray-500">
                {formatTimeAgo(comment.created_at)}
              </span>
            </div>

            {/* Menu de Opções */}
            {isOwnComment && (
              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-1 hover:bg-gray-800 rounded transition cursor-pointer"
                >
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </button>

                {showOptions && (
                  <div className="absolute right-0 top-6 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowOptions(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700 w-full text-left cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        onDelete(comment.id);
                        setShowOptions(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700 text-red-400 w-full text-left cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Corpo do Comentário */}
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-md bg-[#00091A] border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  disabled={!editText.trim()}
                  className="px-4 py-2 bg-[#0E00D0] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-md cursor-pointer transition"
                >
                  Salvar
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-md cursor-pointer transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {comment.body}
            </p>
          )}

          {/* Ações: Responder */}
          <div className="mt-3 flex items-center space-x-5 text-sm text-gray-400">
            {/* Botão Responder */}
            {level < maxLevel && (
              <motion.button
                onClick={() => onReply(comment.id)}
                className="font-semibold text-red-500 hover:text-red-400 cursor-pointer flex items-center gap-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Reply className="h-4 w-4" />
                RESPONDER
              </motion.button>
            )}
          </div>

          {/* Campo de Resposta */}
          {replyingTo === comment.id && (
            <div className="mt-4 space-y-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Digite sua resposta..."
                rows={3}
                className="w-full p-3 rounded-md bg-[#00091A] border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onSubmitReply(comment.id)}
                  disabled={!replyText.trim()}
                  className="px-4 py-2 bg-[#0E00D0] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-md cursor-pointer transition"
                >
                  Responder
                </button>
                <button
                  onClick={() => {
                    setReplyText('');
                    onReply(0);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-md cursor-pointer transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Respostas aninhadas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
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