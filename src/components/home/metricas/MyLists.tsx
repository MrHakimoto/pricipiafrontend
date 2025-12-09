// components/home/metricas/MyLists.tsx
'use client'

import { motion } from 'framer-motion'
import { ClipboardList, CircleQuestionMark, CheckCircle, XCircle } from 'lucide-react'
import type { ListasStats, ListaDetalhe } from '@/lib/dashboard/homeStats'

interface MyListsProps {
  dados: ListasStats
}

export default function MyLists({ dados }: MyListsProps) {
  const { listas_praticas, simulados_provas } = dados

  // Estatísticas totais
  const totalAcertosListas = listas_praticas.detalhes.reduce((acc, lista) => acc + lista.acertos, 0)
  const totalErrosListas = listas_praticas.detalhes.reduce((acc, lista) => acc + lista.erros, 0)
  const totalQuestoesListas = listas_praticas.detalhes.reduce((acc, lista) => acc + lista.total, 0)
  
  const totalAcertosSimulados = simulados_provas.detalhes.reduce((acc, simulado) => acc + simulado.acertos, 0)
  const totalErrosSimulados = simulados_provas.detalhes.reduce((acc, simulado) => acc + simulado.erros, 0)
  const totalQuestoesSimulados = simulados_provas.detalhes.reduce((acc, simulado) => acc + simulado.total, 0)

  const taxaAcertoListas = totalQuestoesListas > 0 ? ((totalAcertosListas / totalQuestoesListas) * 100).toFixed(0) : '0'
  const taxaErroListas = totalQuestoesListas > 0 ? ((totalErrosListas / totalQuestoesListas) * 100).toFixed(0) : '0'

  const taxaAcertoSimulados = totalQuestoesSimulados > 0 ? ((totalAcertosSimulados / totalQuestoesSimulados) * 100).toFixed(0) : '0'
  const taxaErroSimulados = totalQuestoesSimulados > 0 ? ((totalErrosSimulados / totalQuestoesSimulados) * 100).toFixed(0) : '0'

  // Calcular gráfico circular para listas
  const radius = 28.5
  const circumference = 2 * Math.PI * radius
  const acertosDashoffsetListas = totalQuestoesListas > 0 ? circumference - (totalAcertosListas / totalQuestoesListas) * circumference : circumference
  const errosDashoffsetListas = totalQuestoesListas > 0 ? circumference - (totalErrosListas / totalQuestoesListas) * circumference : circumference
  const rotationErrosListas = totalQuestoesListas > 0 ? (totalAcertosListas / totalQuestoesListas) * 360 : 0

  // Calcular gráfico circular para simulados
  const acertosDashoffsetSimulados = totalQuestoesSimulados > 0 ? circumference - (totalAcertosSimulados / totalQuestoesSimulados) * circumference : circumference
  const errosDashoffsetSimulados = totalQuestoesSimulados > 0 ? circumference - (totalErrosSimulados / totalQuestoesSimulados) * circumference : circumference
  const rotationErrosSimulados = totalQuestoesSimulados > 0 ? (totalAcertosSimulados / totalQuestoesSimulados) * 360 : 0

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex flex-col h-[500px]">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-xl">
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Minhas Listas</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Desempenho por tipo de lista</p>
          </div>
        </div>
        

      </div>

      {/* Estatísticas Gerais */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Listas Práticas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Listas Práticas</h3>
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full px-2 py-1 text-xs font-semibold">
                {listas_praticas.concluidas} concluída{listas_praticas.concluidas !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex flex-row gap-4 items-center">
              <div className="relative flex items-center justify-center">
                <svg style={{ width: '65px', height: '65px' }}>
                  <circle 
                    cy="32.5" 
                    cx="32.5" 
                    strokeWidth="8" 
                    fill="transparent" 
                    r={radius} 
                    className="stroke-transparent"
                  />
                  <circle 
                    cy="32.5" 
                    cx="32.5" 
                    strokeWidth="8" 
                    fill="transparent" 
                    r={radius} 
                    strokeDasharray={circumference}
                    strokeDashoffset={acertosDashoffsetListas}
                    className="stroke-green-500"
                    strokeLinecap="round"
                    transform="rotate(0, 32.5, 32.5)"
                  />
                  <circle 
                    cy="32.5" 
                    cx="32.5" 
                    strokeWidth="8" 
                    fill="transparent" 
                    r={radius} 
                    strokeDasharray={circumference}
                    strokeDashoffset={errosDashoffsetListas}
                    className="stroke-red-500"
                    strokeLinecap="round"
                    transform={`rotate(${rotationErrosListas}, 32.5, 32.5)`}
                  />
                </svg>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="font-bold text-gray-900 dark:text-white text-lg mb-1 leading-none">
                  {totalQuestoesListas} resposta{totalQuestoesListas !== 1 ? 's' : ''}
                </span>
                <span className="flex gap-1 items-center text-green-500 text-xs leading-none font-medium font-mono">
                  <CheckCircle className="size-3.5" />
                  <div>{taxaAcertoListas}%</div>
                </span>
                <span className="flex gap-1 items-center text-red-500 text-xs leading-none font-medium font-mono">
                  <XCircle className="size-3.5" />
                  <div>{taxaErroListas}%</div>
                </span>
              </div>
            </div>
          </div>

          {/* Simulados */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Simulados</h3>
              <span className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full px-2 py-1 text-xs font-semibold">
                {simulados_provas.concluidas} concluído{simulados_provas.concluidas !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex flex-row gap-4 items-center">
              <div className="relative flex items-center justify-center">
                <svg style={{ width: '65px', height: '65px' }}>
                  <circle 
                    cy="32.5" 
                    cx="32.5" 
                    strokeWidth="8" 
                    fill="transparent" 
                    r={radius} 
                    className="stroke-transparent"
                  />
                  <circle 
                    cy="32.5" 
                    cx="32.5" 
                    strokeWidth="8" 
                    fill="transparent" 
                    r={radius} 
                    strokeDasharray={circumference}
                    strokeDashoffset={acertosDashoffsetSimulados}
                    className="stroke-green-500"
                    strokeLinecap="round"
                    transform="rotate(0, 32.5, 32.5)"
                  />
                  <circle 
                    cy="32.5" 
                    cx="32.5" 
                    strokeWidth="8" 
                    fill="transparent" 
                    r={radius} 
                    strokeDasharray={circumference}
                    strokeDashoffset={errosDashoffsetSimulados}
                    className="stroke-red-500"
                    strokeLinecap="round"
                    transform={`rotate(${rotationErrosSimulados}, 32.5, 32.5)`}
                  />
                </svg>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="font-bold text-gray-900 dark:text-white text-lg mb-1 leading-none">
                  {totalQuestoesSimulados} resposta{totalQuestoesSimulados !== 1 ? 's' : ''}
                </span>
                <span className="flex gap-1 items-center text-green-500 text-xs leading-none font-medium font-mono">
                  <CheckCircle className="size-3.5" />
                  <div>{taxaAcertoSimulados}%</div>
                </span>
                <span className="flex gap-1 items-center text-red-500 text-xs leading-none font-medium font-mono">
                  <XCircle className="size-3.5" />
                  <div>{taxaErroSimulados}%</div>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes das Listas */}
      <div className="flex-1 overflow-y-auto">
        {listas_praticas.detalhes.length === 0 && simulados_provas.detalhes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma lista concluída</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Complete listas para ver estatísticas</p>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Listas Práticas */}
            {listas_praticas.detalhes.map((lista) => {
              const percentAcertos = lista.total > 0 ? (lista.acertos / lista.total) * 100 : 0
              const percentErros = lista.total > 0 ? (lista.erros / lista.total) * 100 : 0

              return (
                <div key={`lista-${lista.id}`} className="flex flex-row justify-between py-2.5 gap-4 min-h-[48px] border-t border-gray-200 dark:border-gray-700 first:border-t-0">
                  <div className="flex flex-row gap-2.5 items-center min-w-0">
                    <div className="w-5 h-5 rounded-[30%] shrink-0 border dark:border-gray-600 bg-gradient-to-br from-blue-400 to-blue-600" />
                    <div className="text-gray-900 dark:text-gray-200 align-middle truncate text-sm">
                      {lista.nome}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">
                      {lista.total} Questões
                    </span>
                    <div className="relative h-[5px] rounded-[1.5px] justify-between flex flex-row overflow-hidden bg-gray-200 dark:bg-gray-700 w-[90px] mt-1">
                      <div 
                        className="h-full rounded-[1.5px] transition-[width] ml-auto bg-green-500"
                        style={{ width: `${percentAcertos}%` }}
                      />
                      <div className="min-w-[3px] flex-1" />
                      <div 
                        className="h-full rounded-[1.5px] transition-[width] ml-auto bg-red-500"
                        style={{ width: `${percentErros}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Simulados */}
            {simulados_provas.detalhes.map((simulado) => {
              const percentAcertos = simulado.total > 0 ? (simulado.acertos / simulado.total) * 100 : 0
              const percentErros = simulado.total > 0 ? (simulado.erros / simulado.total) * 100 : 0

              return (
                <div key={`simulado-${simulado.id}`} className="flex flex-row justify-between py-2.5 gap-4 min-h-[48px] border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-row gap-2.5 items-center min-w-0">
                    <div className="w-5 h-5 rounded-[30%] shrink-0 border dark:border-gray-600 bg-gradient-to-br from-green-400 to-green-600" />
                    <div className="text-gray-900 dark:text-gray-200 align-middle truncate text-sm">
                      {simulado.nome}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">
                      {simulado.total} Questões
                    </span>
                    <div className="relative h-[5px] rounded-[1.5px] justify-between flex flex-row overflow-hidden bg-gray-200 dark:bg-gray-700 w-[90px] mt-1">
                      <div 
                        className="h-full rounded-[1.5px] transition-[width] ml-auto bg-green-500"
                        style={{ width: `${percentAcertos}%` }}
                      />
                      <div className="min-w-[3px] flex-1" />
                      <div 
                        className="h-full rounded-[1.5px] transition-[width] ml-auto bg-red-500"
                        style={{ width: `${percentErros}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}