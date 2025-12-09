// components/home/metricas/MetricsSection.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, LayoutList, Folders, Calendar, CircleQuestionMark, SquareCheckBig, SquareX, ArrowRight } from 'lucide-react'
import type { QuestoesStats, EvolucaoSemanal, AssuntoStats } from '@/lib/dashboard/homeStats'

interface MetricsSectionProps {
  dados: QuestoesStats
}

type TabType = 'assuntos' | 'topicos' | 'semana'

export default function MetricsSection({ dados }: MetricsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('semana')
  const [semanas, setSemanas] = useState<EvolucaoSemanal[]>([])

  // Gerar semanas (passadas, atual e futuras)
  useEffect(() => {
    // Após gerar todas as semanas, inverta a ordem
    const gerarSemanas = () => {
      const semanasGeradas: EvolucaoSemanal[] = []
      const hoje = new Date()

      // Gerar semanas passadas em ordem crescente (1 a 15)
      for (let i = 1; i <= 15; i++) {
        const dataInicio = new Date(hoje)
        dataInicio.setDate(hoje.getDate() - (i * 7) - hoje.getDay() + 1)

        const dataFim = new Date(dataInicio)
        dataFim.setDate(dataInicio.getDate() + 6)

        semanasGeradas.push({
          periodo: `${formatarData(dataInicio)} - ${formatarData(dataFim)}`,
          total: 0,
          acertos: 0,
          erros: 0
        })
      }

      // Adicionar semana atual
      const inicioAtual = new Date(hoje)
      inicioAtual.setDate(hoje.getDate() - hoje.getDay() + 1)
      const fimAtual = new Date(inicioAtual)
      fimAtual.setDate(inicioAtual.getDate() + 6)

      semanasGeradas.push({
        periodo: `${formatarData(inicioAtual)} - ${formatarData(fimAtual)}`,
        total: 0,
        acertos: 0,
        erros: 0
      })

      // Adicionar semanas futuras
      for (let i = 1; i <= 2; i++) {
        const dataInicio = new Date(inicioAtual)
        dataInicio.setDate(inicioAtual.getDate() + (i * 7))

        const dataFim = new Date(dataInicio)
        dataFim.setDate(dataInicio.getDate() + 6)

        semanasGeradas.push({
          periodo: `${formatarData(dataInicio)} - ${formatarData(dataFim)}`,
          total: 0,
          acertos: 0,
          erros: 0
        })
      }

      // Aqui está o segredo: REVERTA a ordem do array
      // Para: [mais recente ... mais antigo]
      const semanasEmOrdem = semanasGeradas.reverse()

      // Mesclar com dados reais
      return semanasEmOrdem.map(semana => {
        const dadoReal = dados.evolucao_semanal.find(s => s.periodo === semana.periodo)
        return dadoReal ? { ...semana, ...dadoReal } : semana
      })
    }
    setSemanas(gerarSemanas())
  }, [dados.evolucao_semanal])

  const formatarData = (data: Date): string => {
    return `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}`
  }

  const getDiaSemana = (dataStr: string): string => {
    const [dia, mes] = dataStr.split('/').map(Number)
    const hoje = new Date()
    const data = new Date(hoje.getFullYear(), mes - 1, dia)
    const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
    return dias[data.getDay()]
  }

  const tabs = [
    { id: 'assuntos' as TabType, label: 'Por Assunto', icon: LayoutList },
    { id: 'topicos' as TabType, label: 'Por Tópicos', icon: Folders },
    { id: 'semana' as TabType, label: 'Por Semana', icon: Calendar },
  ]

  // Estatísticas gerais
  const { total, acertos, erros } = dados.geral
  const taxaAcerto = total > 0 ? ((acertos / total) * 100).toFixed(0) : 0
  const taxaErro = total > 0 ? ((erros / total) * 100).toFixed(0) : 0

  // Calcular o gráfico circular
  const radius = 28.5
  const circumference = 2 * Math.PI * radius
  const acertosDashoffset = total > 0 ? circumference - (acertos / total) * circumference : circumference
  const errosDashoffset = total > 0 ? circumference - (erros / total) * circumference : circumference
  const rotationErros = total > 0 ? (acertos / total) * 360 : 0

  // Encontrar índice da semana atual
  const encontrarIndiceSemanaAtual = () => {
    const hoje = new Date()
    const inicioAtual = new Date(hoje)
    inicioAtual.setDate(hoje.getDate() - hoje.getDay() + 1)
    const periodoAtual = `${formatarData(inicioAtual)} - ${formatarData(new Date(inicioAtual.getTime() + 6 * 24 * 60 * 60 * 1000))}`

    return semanas.findIndex(s => s.periodo === periodoAtual)
  }

  const indiceSemanaAtual = encontrarIndiceSemanaAtual()

  const renderConteudoAssuntos = () => {
    if (!dados.por_assunto || dados.por_assunto.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <LayoutList className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum dado por assunto disponível</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Complete listas para ver estatísticas</p>
        </div>
      )
    }

    return (
      <div className="space-y-0">
        {dados.por_assunto.map((assunto: AssuntoStats, index: number) => {
          const totalAssunto = assunto.total || (assunto.acertos + assunto.erros)
          const percentAcertos = totalAssunto > 0 ? (assunto.acertos / totalAssunto) * 100 : 0
          const percentErros = totalAssunto > 0 ? (assunto.erros / totalAssunto) * 100 : 0

          return (
            <div key={index} className="flex flex-row justify-between py-2.5 gap-4 min-h-[48px] border-t border-gray-200 dark:border-gray-700 first:border-t-0">
              <div className="flex flex-row gap-2.5 items-center min-w-0">
                <div className="w-5 h-5 rounded-[30%] shrink-0 border dark:border-gray-600" style={{
                  borderColor: `rgb(255, ${100 + index * 20}, ${50 + index * 10})`,
                  background: `radial-gradient(circle, rgba(255, ${150 + index * 10}, ${100 + index * 5}, 0.3) 0%, rgba(255, ${100 + index * 20}, ${50 + index * 10}, 1) 50%, rgba(255, ${50 + index * 10}, ${20 + index * 5}, 0.8) 100%)`
                }} />
                <div className="text-gray-900 dark:text-gray-200 align-middle truncate text-sm">
                  {assunto.assunto}
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">
                  {totalAssunto} Respostas
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
    )
  }

  const renderConteudoTopicos = () => {
    if (!dados.topicos_mais_errados || dados.topicos_mais_errados.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Folders className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum tópico com dados disponível</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Continue praticando para ver estatísticas</p>
        </div>
      )
    }

    return (
      <div className="space-y-0">
        {dados.topicos_mais_errados.map((topico, index) => (
          <div key={index} className="flex flex-row justify-between py-2.5 gap-4 min-h-[48px] border-t border-gray-200 dark:border-gray-700 first:border-t-0">
            <div className="flex flex-row gap-2.5 items-center min-w-0">
              <div className="w-5 h-5 rounded-[30%] shrink-0 border dark:border-gray-600" style={{
                borderColor: '#C6005C',
                background: 'radial-gradient(circle, rgba(198, 0, 92, 0.3) 0%, rgba(198, 0, 92, 1) 50%, rgba(198, 0, 92, 0.8) 100%)'
              }} />
              <div className="text-gray-900 dark:text-gray-200 align-middle truncate text-sm">
                {topico.topico}
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">
                {topico.erros} Erro{topico.erros !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderConteudoSemana = () => {
    return (
      <div className="space-y-0">
        {semanas.map((semana, index) => {
          const [dataInicioStr, dataFimStr] = semana.periodo.split(' - ')
          const temDados = semana.total > 0
          const percentAcertos = semana.total > 0 ? (semana.acertos / semana.total) * 100 : 0
          const percentErros = semana.total > 0 ? (semana.erros / semana.total) * 100 : 0
          const isCurrentWeek = index === indiceSemanaAtual

          return (
            <div
              key={index}
              className={`
                flex flex-row justify-between py-1.5 gap-4 min-h-[48px] 
                border-t border-gray-200 dark:border-gray-700 first:border-t-0
                ${!temDados ? 'opacity-50' : ''}
                ${isCurrentWeek ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
              `}
            >
              <div className="flex flex-row gap-2.5 items-center min-w-0 text-gray-900 dark:text-gray-200 text-[13px]">
                <div className="flex flex-col leading-none">
                  <span className="font-mono">{dataInicioStr}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{getDiaSemana(dataInicioStr)}</span>
                </div>
                <ArrowRight className="size-4 text-gray-500 dark:text-gray-400" />
                <div className="flex flex-col leading-none">
                  <span className="font-mono">{dataFimStr}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{getDiaSemana(dataFimStr)}</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className={`text-gray-600 dark:text-gray-400 font-semibold text-sm ${!temDados ? 'opacity-50' : ''}`}>
                  {temDados ? `${semana.total} Resposta${semana.total !== 1 ? 's' : ''}` : '0 Respostas'}
                </span>
                <div className="relative h-[5px] rounded-[1.5px] justify-between flex flex-row overflow-hidden bg-gray-200 dark:bg-gray-700 w-[90px] mt-1">
                  {temDados ? (
                    <>
                      <div
                        className="h-full rounded-[1.5px] transition-[width] ml-auto bg-green-500"
                        style={{ width: `${percentAcertos}%` }}
                      />
                      <div className="min-w-[3px] flex-1" />
                      <div
                        className="h-full rounded-[1.5px] transition-[width] ml-auto bg-red-500"
                        style={{ width: `${percentErros}%` }}
                      />
                    </>
                  ) : (
                    <div className="h-full rounded-[1.5px] transition-[width] ml-auto bg-gray-300 dark:bg-gray-600" style={{ width: '100%' }} />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex flex-col h-[500px]">
      {/* Cabeçalho com estatísticas gerais */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500 rounded-xl">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Métricas de Performance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Seu desempenho geral</p>
          </div>
        </div>

      </div>

      {/* Estatísticas Gerais */}
      <div className="mb-6">
        <div className="flex flex-row gap-4 items-center flex-1">
          <div className="relative flex items-center justify-center">
            <svg style={{ width: '65px', height: '65px' }}>
              <circle
                cy="32.5"
                cx="32.5"
                strokeWidth="8"
                fill="transparent"
                r="28.5"
                className="stroke-transparent"
              />
              <circle
                cy="32.5"
                cx="32.5"
                strokeWidth="8"
                fill="transparent"
                r="28.5"
                strokeDasharray={circumference}
                strokeDashoffset={acertosDashoffset}
                className="stroke-green-500"
                strokeLinecap="round"
                transform="rotate(0, 32.5, 32.5)"
              />
              <circle
                cy="32.5"
                cx="32.5"
                strokeWidth="8"
                fill="transparent"
                r="28.5"
                strokeDasharray={circumference}
                strokeDashoffset={errosDashoffset}
                className="stroke-red-500"
                strokeLinecap="round"
                transform={`rotate(${rotationErros}, 32.5, 32.5)`}
              />
            </svg>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-bold text-gray-900 dark:text-white text-lg mb-1 leading-none">
              {total} resposta{total !== 1 ? 's' : ''}
            </span>
            <span className="flex gap-1 items-center text-green-500 text-xs leading-none font-medium font-mono">
              <SquareCheckBig className="size-3.5" />
              <div>{taxaAcerto}%</div>
            </span>
            <span className="flex gap-1 items-center text-red-500 text-xs leading-none font-medium font-mono">
              <SquareX className="size-3.5" />
              <div>{taxaErro}%</div>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative ${isActive
                  ? 'text-[#C6005C] dark:text-[#C6005C]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C6005C] dark:bg-[#C6005C]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Conteúdo da Tab Ativa */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'assuntos' && renderConteudoAssuntos()}
        {activeTab === 'topicos' && renderConteudoTopicos()}
        {activeTab === 'semana' && renderConteudoSemana()}
      </div>
    </div>
  )
}