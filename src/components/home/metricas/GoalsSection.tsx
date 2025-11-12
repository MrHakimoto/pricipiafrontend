'use client'

export default function GoalsSection() {
  return (
    <div className="bg-[#111827] border border-gray-700 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Minhas metas</h2>
      <div className="flex items-center justify-between">
        <div className="flex-1 bg-gray-900 rounded-xl p-4 text-center mx-2">
          <p className="text-gray-400 text-sm">Dias de estudo seguidos</p>
          <p className="text-4xl font-light mt-2">19</p>
        </div>
      </div>
    </div>
  )
}
