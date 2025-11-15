const ConteudoSkeleton = () => {

  return (
    // Wrapper principal com padding, margem e animação
    <div>
        
        {/* 1. Cabeçalho da Seção (Título e Subtítulo) */}
        <section>
            <div className="px-8 py-6 border-gray-700 bg-[#1B1F27]">
                <div className="h-6 w-[720px] bg-gray-700 rounded animate-pulse" />
            </div>
        </section>

        <main className="p-8 max-w-7xl mx-auto space-y-8 animate-pulse">

        {/* 2. Grade de Cursos */}
        <section>
            {/* Usamos uma grade responsiva para os cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
            
            {/* Card Skeleton (Repetido 8 vezes)
                Usamos [...Array(8)] para criar um array de 8 posições e mapeá-lo
            */}
            {[...Array(8)].map((_, index) => (
                <div key={index}>
                {/* Thumbnail do Card */}
                <div className="h-48 w-full bg-gray-600 rounded-lg" />
                </div>
            ))}

            </div>
        </section>

        </main>
    </div>
  );
};

export default ConteudoSkeleton;