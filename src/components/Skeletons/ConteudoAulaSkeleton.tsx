const ConteudoAulaSkeleton = () => {
  return (
    // Wrapper principal
    <main className="p-8 max-w-7xl mx-auto animate-pulse">
      
      {/* Container Flex principal (Vídeo + Sidebar) */}
      {/* 'lg:flex-row' para lado a lado em telas grandes */}
      {/* 'flex-col' para empilhar em telas pequenas */}
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Coluna Esquerda (Vídeo e Controles) - 66% da largura */}
        <div className="w-full lg:w-2/3 space-y-4">
          
          {/* 1. Breadcrumb (PME | Frente: ...) */}
          <div className="h-5 w-96 max-w-full bg-gray-600 rounded" />

          {/* 2. Player de Vídeo (aspect-video é ótimo para isso) */}
          <div className="aspect-video w-full bg-gray-600 rounded-lg" />

          {/* 3. Barra de Ações (Estrelas, Favoritar, Próxima Aula...) */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 p-2 rounded-lg">
            {/* Ações da Esquerda (Estrelas, Favoritar, Anexo) */}
            <div className="flex gap-3">
              <div className="h-10 w-16 bg-gray-600 rounded" />
              <div className="h-10 w-16 bg-gray-600 rounded" />
              <div className="h-10 w-16 bg-gray-600 rounded" />
            </div>
            {/* Ações da Direita (Navegação) */}
            <div className="flex gap-3">
              <div className="h-8 w-28 bg-gray-600 rounded" />
              <div className="h-8 w-28 bg-gray-600 rounded" />
              <div className="h-8 w-28 bg-gray-600 rounded" />
            </div>
          </div>

          {/* 4. Tabs (Detalhes, Dúvidas) */}
          <div className="flex gap-6 border-gray-700 pt-4">
            <div className="h-6 w-24 bg-gray-600 rounded-t" />
            <div className="h-6 w-24 bg-gray-600 rounded-t opacity-70" />
          </div>

          {/* 5. Caixa de Texto (Detalhes) */}
          <div className="space-y-3 pt-2">
            <div className="h-4 w-full bg-gray-600 rounded" />
            <div className="h-4 w-full bg-gray-600 rounded" />
            <div className="h-4 w-3/4 bg-gray-600 rounded" />
          </div>

        </div>

        {/* Coluna Direita (Sidebar de Aulas) - 33% da largura */}
        <div className="w-full lg:w-1/3 space-y-4">
          
          {/* 1. Container da Sidebar (com fundo escuro) */}
          {/* Usei a cor de fundo do seu footer para consistência */}
          <div className="bg-[#1B1F27] rounded-lg p-4 space-y-3">
            
            {/* Cabeçalho da Sidebar ("Aulas | 4 aulas") */}
            <div className="flex justify-between items-center">
              <div className="h-6 w-20 bg-gray-600 rounded" />
              <div className="h-5 w-16 bg-gray-600 rounded" />
            </div>

            {/* Divisor */}
            <div className="h-px bg-gray-700" />

            {/* Lista de Aulas */}
            {/* Aula 1 (Ativa) */}
            <div className="h-10 w-full bg-gray-700 rounded p-2 flex items-center"/>
            {/* Aula 2 */}
            <div className="h-10 w-full rounded p-2 flex items-center">
              <div className="h-5 w-full bg-gray-600/70 rounded" />
            </div>
            {/* Aula 3 */}
            <div className="h-10 w-full rounded p-2 flex items-center">
              <div className="h-5 w-full bg-gray-600/70 rounded" />
            </div>
            {/* Aula 4 */}
            <div className="h-10 w-full rounded p-2 flex items-center">
              <div className="h-5 w-full bg-gray-600/70 rounded" />
            </div>
            {/* Lista de Exercícios */}
            <div className="h-10 w-full rounded p-2 flex items-center">
              <div className="h-5 w-full bg-gray-600/70 rounded" />
            </div>

          </div>
        </div>

      </div>
    </main>
  );
};

export default ConteudoAulaSkeleton