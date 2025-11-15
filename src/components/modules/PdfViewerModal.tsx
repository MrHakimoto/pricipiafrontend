// Salve em /components/PdfViewerModal.tsx

import React, { useState } from 'react';
import { Download, X, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

// Interfaces para tipagem
interface FileItem {
  file_url: string;
  file_name: string;
}

interface PdfViewerModalProps {
  onClose: () => void;
  files?: FileItem[];
}

// --- Componente Principal ---
export default function PdfViewerModal({ onClose, files = [] }: PdfViewerModalProps) {
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);

  const currentFile: FileItem | undefined = files[currentFileIndex];
  const hasMultipleFiles: boolean = files.length > 1;
  const hasPreviousFile: boolean = currentFileIndex > 0;
  const hasNextFile: boolean = currentFileIndex < files.length - 1;

  const goToPreviousFile = (): void => {
    if (hasPreviousFile) {
      setCurrentFileIndex(currentFileIndex - 1);
    }
  };

  const goToNextFile = (): void => {
    if (hasNextFile) {
      setCurrentFileIndex(currentFileIndex + 1);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string): void => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = (): void => {
    files.forEach((file, index) => {
      setTimeout(() => {
        handleDownload(file.file_url, file.file_name);
      }, index * 100);
    });
  };

  // Se não há arquivos ou o arquivo atual é undefined, não renderiza
  if (!currentFile || files.length === 0) {
    return null;
  }

  return (
    // 1. Overlay (fundo escuro)
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      {/* 2. Conteúdo do Modal (Layout Principal) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-6xl h-[90vh] overflow-hidden rounded-lg bg-gray-900 shadow-2xl"
      >
        {/* Botão de Fechar flutuante */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 bg-black/50 rounded-full text-gray-400 hover:text-white hover:bg-black/70 transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* 3. Painel Esquerdo (Anexos / Download) */}
        <aside className="hidden w-80 flex-col text-white md:flex border-r border-gray-700">
          <div className="border-b border-gray-700 p-4">
            <h2 className="text-lg font-semibold text-gray-200">Anexos</h2>
            {hasMultipleFiles && (
              <p className="text-sm text-gray-400 mt-1">
                {files.length} arquivo{files.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          {/* Botão Download Todos */}
          {hasMultipleFiles && (
            <div className="p-4 border-b border-gray-700">
              <button
                onClick={handleDownloadAll}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md transition-colors cursor-pointer"
              >
                <Download size={16} />
                Baixar Todos ({files.length})
              </button>
            </div>
          )}

          {/* Lista de Arquivos */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {files.map((file: FileItem, index: number) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all ${
                    index === currentFileIndex
                      ? 'bg-blue-600 border border-blue-500'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  onClick={() => setCurrentFileIndex(index)}
                >
                  <FileText size={16} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {file.file_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Arquivo {index + 1} de {files.length}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file.file_url, file.file_name);
                    }}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Baixar este arquivo"
                  >
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* 4. Painel Direito (Visualizador de PDF) */}
        <main className="flex flex-1 flex-col bg-gray-50">
          {/* Header do Visualizador */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-800 truncate max-w-md">
                {currentFile.file_name}
              </h3>
              {hasMultipleFiles && (
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {currentFileIndex + 1} de {files.length}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Navegação entre Arquivos */}
              {hasMultipleFiles && (
                <div className="flex items-center gap-1 mr-4">
                  <button
                    onClick={goToPreviousFile}
                    disabled={!hasPreviousFile}
                    className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Arquivo anterior"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={goToNextFile}
                    disabled={!hasNextFile}
                    className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Próximo arquivo"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
              
              {/* Botão Download Individual */}
              <button
                onClick={() => handleDownload(currentFile.file_url, currentFile.file_name)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-md transition-colors cursor-pointer"
              >
                <Download size={16} />
                Baixar
              </button>
            </div>
          </div>

          {/* Visualizador de PDF */}
          <div className="flex-1">
            <iframe
              src={currentFile.file_url}
              className="w-full h-full"
              title={`Visualizador de ${currentFile.file_name}`}
            />
          </div>

          {/* Footer com Navegação Móvel */}
          {hasMultipleFiles && (
            <div className="md:hidden flex items-center justify-between p-4 bg-white border-t border-gray-200">
              <button
                onClick={goToPreviousFile}
                disabled={!hasPreviousFile}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              
              <span className="text-sm text-gray-500">
                {currentFileIndex + 1} / {files.length}
              </span>
              
              <button
                onClick={goToNextFile}
                disabled={!hasNextFile}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Próximo
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}