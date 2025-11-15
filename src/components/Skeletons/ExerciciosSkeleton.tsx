const ExerciciosSkeleton = () => {
  return (
    // Wrapper principal
    <div>
      {/* Header (parte cinza) */}
      <div className="relative px-8 py-14 border-gray-700 bg-[#1B1F27]">
        <div className="h-7 w-[720px] bg-gray-700 rounded animate-pulse" />

        {/*Tabs de Navegação */}
        <section className="flex items-center absolute bottom-0 gap-8 border-gray-700">
          {/* Tab 1 (Ativa) */}
          <div className="h-6 w-32 bg-gray-600 rounded-t" />
          {/* Tab 2 */}
          <div className="h-6 w-32 bg-gray-600 rounded-t opacity-70" />
          {/* Tab 3 */}
          <div className="h-6 w-32 bg-gray-600 rounded-t opacity-70" />
          {/* Tab 4 */}
          <div className="h-6 w-32 bg-gray-600 rounded-t opacity-70" />
        </section>

      </div>

      <main className="p-8 max-w-7xl mx-auto space-y-8 animate-pulse">

        {/* Container de Filtros */}
        <section className="bg-[#1B1F27] rounded-lg p-6">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-1">
            {/* Filtro 1 */}
            <div className="space-y-2">
              <div className="h-3 w-12 bg-gray-600 rounded" /> {/* Label */}
              <div className="h-11 w-1/2 bg-gray-700/80 rounded" />{" "}
              {/* Input */}
            </div>

            {/* Filtro 2 */}
            <div className="space-y-2">
              <div className="h-3 w-16 bg-gray-600 rounded" /> {/* Label */}
              <div className="h-11 w-1/2 bg-gray-700/80 rounded" />{" "}
              {/* Input */}
            </div>

            {/* Filtro 3 */}
            <div className="space-y-2">
              <div className="h-3 w-14 bg-gray-600 rounded" /> {/* Label */}
              <div className="h-11 w-1/2 bg-gray-700/80 rounded" />{" "}
              {/* Input */}
            </div>

            {/* Filtro 4 */}
            <div className="space-y-2 relative">
              <div className="h-3 w-14 bg-gray-600 rounded" /> {/* Label */}
              <div className="absolute h-29 w-3/4 bg-gray-700/80 rounded" />{" "}
              {/* Input */}
            </div>

            {/* Filtro 5: */}
            <div className="space-y-2">
              <div className="h-3 w-12 bg-gray-600 rounded" /> {/* Label */}
              <div className="h-11 w-1/2 bg-gray-700/80 rounded" />{" "}
              {/* Input */}
            </div>

            {/* Filtro 6 */}
            <div className="space-y-2">
              <div className="h-4 w-8 bg-gray-600 rounded" /> {/* Label */}
              <div className="h-11 w-1/2 bg-gray-700/80 rounded" />{" "}
              {/* Input */}
            </div>

            {/* Filtro 7 */}
            <div className="space-y-2">
              <div className="h-4 w-8 bg-gray-600 rounded" /> {/* Label */}
              <div className="h-11 w-1/2 bg-gray-700/80 rounded" />{" "}
              {/* Input */}
            </div>


            {/* Espaçador e Botão Buscar */}
            {/* md:col-start-3 para alinhar à direita no desktop */}
            <div className="md:col-start-1 flex justify-start items-start mt-4">
              <div className="h-8 w-20 bg-gray-600 rounded" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ExerciciosSkeleton;