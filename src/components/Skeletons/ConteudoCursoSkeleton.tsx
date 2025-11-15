const ConteudoCursoSkeleton = () => {
  return (
    // Wrapper principal - usei max-w-5xl para centralizar mais
    <main className="p-8 max-w-5xl mx-auto space-y-8 animate-pulse">
      
      {/* 1. Cabeçalho (Título e Subtítulo) */}
      <section className="text-center space-y-3">
        {/* Título "Princípios de Matemática Elementar" */}
        <div className="h-8 w-96 max-w-full bg-gray-600 rounded mx-auto" />
        {/* Subtítulo "4 Frentes | 48 Módulos" */}
        <div className="h-5 w-56 bg-gray-600 rounded mx-auto" />
      </section>

      {/* 2. Tabs (Conteúdo, Cronograma) */}
      <section className="flex justify-center items-center gap-6">
        {/* Tab "Conteúdo" */}
        <div className="h-6 w-32 bg-gray-600 rounded" />
        {/* Tab "Cronograma" */}
        <div className="h-6 w-32 bg-gray-600 rounded opacity-70" />
      </section>

      {/* 3. Lista de "Acordeões" (Frentes) */}
      {/* Simula o container que agrupa os acordeões.
        Usei uma cor de fundo um pouco mais escura/transparente
        para diferenciar dos placeholders normais.
      */}
      <section className="border border-gray-700/50 rounded-lg p-4 space-y-4">
        
        <div className="rounded-lg p-3 space-y-3">

        {/* Acordeão 1 */}
        <div className="h-14 w-full bg-gray-700/80 rounded-lg" />
        
        {/* Acordeão 2 */}
        <div className="h-14 w-full bg-gray-700/80 rounded-lg" />
        
        {/* Acordeão 3 */}
        <div className="h-14 w-full bg-gray-700/80 rounded-lg" />
        
        {/* Acordeão 4 */}
        <div className="h-14 w-full bg-gray-700/80 rounded-lg" />
        </div>

      </section>

    </main>
  );
};

export default ConteudoCursoSkeleton;