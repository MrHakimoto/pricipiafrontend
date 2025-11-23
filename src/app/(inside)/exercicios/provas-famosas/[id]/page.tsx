// provas-famosas/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { NavigationProvider } from '@/contexts/NavigationContext';
import { QuestionsPanel } from '@/components/questions/QuestionsPanel';
import { NavigationSidebar } from '@/components/questions/NavigationSidebar';
import { ProvaTimer } from '@/components/timer/ProvaTimer';
import { useListaData } from '@/hooks/useListaData';
import { Loader2 } from 'lucide-react';

export default function ProvaFamosaList() {
  const params = useParams();
  const { data: session, status } = useSession();
  const listaId = params.id;
  const router = useRouter();

  if (!listaId) {
    return (
      <div className="min-h-screen bg-[#00091A] flex items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="text-xl mb-4">ID da prova não encontrado</div>
          <button
            onClick={() => router.push('/provas-famosas')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Voltar para Provas
          </button>
        </div>
      </div>
    );
  }

  const {
    questionsFormatted,
    listaInfo,
    resolucaoId,
    respostasSalvas,
    tentativaAtiva,
    isLoading,
    error,
    handleIniciarTentativa,
    handleFinalizarTentativa,
  } = useListaData(listaId);

  // Loading state
  if (isLoading || status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen bg-[#00091A]">
        <div className="text-center">
          <Loader2 className="animate-spin text-white mx-auto mb-4" size={48} />
          <p className="text-white text-lg">Carregando prova...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#00091A] flex items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="text-xl mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Se não há questões
  if (!questionsFormatted || questionsFormatted.length === 0) {
    return (
      <div className="min-h-screen bg-[#00091A] flex items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="text-xl mb-4">Nenhuma questão encontrada nesta prova</div>
          <p className="text-gray-400 mb-6">A prova pode estar vazia ou ocorreu um problema ao carregar as questões.</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const isSimuladoOuProva = listaInfo?.tipo && ['simulado', 'prova'].includes(listaInfo.tipo);

  return (
    <NavigationProvider
      questions={questionsFormatted}
      respostasSalvas={respostasSalvas}
      isSimuladoOuProva={!!isSimuladoOuProva}
    >
      <div className="flex flex-col h-[calc(100vh-145px)] bg-[#00091A] overflow-hidden">
        {/* Timer no topo */}
        {tentativaAtiva && (
          <ProvaTimer
            startedAt={tentativaAtiva.started_at}
            tempoEscolhido={tentativaAtiva.tempo_escolhido}
            isCompleted={tentativaAtiva.status === 'finalizado'}
          />
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Esquerda */}
          <div className="w-80 flex-shrink-0">
            <NavigationSidebar
              listaInfo={listaInfo ?? undefined}
              resolucaoId={resolucaoId}
              onFinalizarTentativa={handleFinalizarTentativa}
            />
          </div>

          {/* Painel de Questões (Direita) */}
          <QuestionsPanel
            className="flex-1 overflow-y-auto"
            questions={questionsFormatted}
            resolucaoId={resolucaoId}
            respostasSalvas={respostasSalvas}
            onIniciarTentativa={handleIniciarTentativa}
            listaId={listaInfo?.id}
            listaTipo={listaInfo?.tipo}
          />
        </div>

        {/* DEBUG - Apenas em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-3 right-3 bg-black/80 text-white p-3 rounded-md border border-gray-700 text-xs z-[1000] font-mono">
            <div className="font-bold mb-1">DEBUG PROVA FAMOSA:</div>
            <div>Questões: {questionsFormatted.length}</div>
            <div>Lista: {listaInfo?.nome}</div>
            <div>Tipo: {listaInfo?.tipo}</div>
            <div>Tentativa ID: {resolucaoId || 'Não iniciada'}</div>
            <div>Respostas: {Object.keys(respostasSalvas).length}</div>
            {tentativaAtiva && (
              <>
                <div>Status: {tentativaAtiva.status}</div>
                <div>Tempo: {tentativaAtiva.tempo_escolhido}min</div>
                <div>Iniciado: {new Date(tentativaAtiva.started_at).toLocaleTimeString()}</div>
              </>
            )}
          </div>
        )}
      </div>
    </NavigationProvider>
  );
}