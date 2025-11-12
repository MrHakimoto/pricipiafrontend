export default function HomeSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="bg-[#2A2A2A] h-16 rounded-md"></div>

      {/* Continuar assistindo */}
      <div>
        <div className="h-6 w-48 bg-[#2A2A2A] rounded mb-4"></div>
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-64 h-36 bg-[#2A2A2A] rounded-md"></div>
          ))}
        </div>
      </div>

      {/* Cursos disponíveis */}
      <div>
        <div className="h-6 w-48 bg-[#2A2A2A] rounded mb-4"></div>
        <div className="flex gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="w-64 h-40 bg-[#2A2A2A] rounded-md"></div>
          ))}
        </div>
      </div>

      {/* Metas */}
      <div>
        <div className="h-6 w-48 bg-[#2A2A2A] rounded mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#2A2A2A] h-20 rounded-md"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
