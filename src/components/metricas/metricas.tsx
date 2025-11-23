"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// --- Tipagens (TypeScript) ---

interface StatCardProps {
    title: string;
    value: string;
    secondaryText?: string;
    icon: React.FC<{ className?: string }>;
    colorClass: string;
    delay?: number;
}

interface MiniStatCardProps {
    title: string;
    value: string;
    secondaryText: string;
    colorClass: string;
    delay?: number;
}

interface SkillData {
    topic: string;
    percentage: number;
    description?: string;
}

interface TableRowData {
    item: string;
    rate: string;
}

interface RankingData {
    rank: number;
    name: string;
    difference: string;
    colorClass: string;
}

// --- Dados Mock ---

const dataProgresso = [
    { name: 'Seg', pontos: 130 },
    { name: 'Ter', pontos: 160 },
    { name: 'Qua', pontos: 240 },
    { name: 'Qui', pontos: 220 },
    { name: 'Sex', pontos: 270 },
    { name: 'Sáb', pontos: 300 },
    { name: 'Dom', pontos: 310 },
];

const strongPoints: SkillData[] = [
    { topic: 'Função afim', percentage: 90 },
    { topic: 'PA e PG', percentage: 85 },
    { topic: 'Trigonometria', percentage: 80 },
];

const weakPoints: SkillData[] = [
    { topic: 'Probabilidade', percentage: 45 },
    { topic: 'Geometria espacial', percentage: 40 },
    { topic: 'Análise combinatória', percentage: 35 },
];

const subjectRate: TableRowData[] = [
    { item: 'Função quadrática', rate: '80%' },
    { item: 'Logarítmos', rate: '72%' },
    { item: 'Polinômios', rate: '66%' },
    { item: 'Trigonometria', rate: '57%' },
];

const simulatedRate: TableRowData[] = [
    { item: 'Simulado 1', rate: '80%' },
    { item: 'Simulado 2', rate: '72%' },
    { item: 'Simulado 3', rate: '66%' },
    { item: 'Simulado 4', rate: '57%' },
];

const rankingGlobal: RankingData[] = [
    { rank: 1, name: 'Milton Junio', difference: '-15p', colorClass: 'text-red-500' },
    { rank: 2, name: 'Sofia Paiva', difference: '-15p', colorClass: 'text-red-500' },
    { rank: 3, name: 'Filipe Ozanam', difference: '+3p', colorClass: 'text-green-500' },
    { rank: 4, name: 'Thulio', difference: '+1p', colorClass: 'text-green-500' },
    { rank: 5, name: 'Arthur Miranda', difference: '-7p', colorClass: 'text-red-500' },
];

// --- Ícones ---

const PiIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-4h-2v-2h4v6zM7.5 7.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
    </svg>
);

const StarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 17.27l6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73-1.64 7.03z"/>
    </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
    </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
    </svg>
);

const BookOpenIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 4H7v16h14V4zm-2 2v12H9V6h10zm-6 3H9v2h4V9zm0 4H9v2h4v-2z"/>
    </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.62z"/>
    </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM5 7V6h14v1H5z"/>
    </svg>
);

const FilterIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
    </svg>
);

const ThumbsUpIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.43-.18-.83-.49-1.13L15.36 2 10.43 6.93c-.63.63-.92 1.43-.92 2.45v8.52c0 1.1.9 2 2 2h8.49c.88 0 1.6-.53 1.83-1.28l1.85-6.19c.2-.67.07-1.39-.33-1.95z"/>
    </svg>
);

const ThumbsDownIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.36 21l-4.93-4.93c-.63-.63-.92-1.43-.92-2.45V4.1c0-1.1.9-2 2-2h8.49c.88 0 1.6.53 1.83 1.28l1.85 6.19c.2.67.07 1.39-.33 1.95L22 13h-6.31l.95 4.57.03.32c0 .43-.18.83-.49 1.13L15.36 21zM1 13h4v8H1v-8z"/>
    </svg>
);

const ListIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zm0-8h14V7H7v2z"/>
    </svg>
);

const TrophyIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.5 6a3 3 0 00-3-3H5a3 3 0 00-3 3v8a3 3 0 003 3h4.5v3H12v-3h4.5a3 3 0 003-3V6zM5 5h13.5a1 1 0 011 1v.5a.5.5 0 01-.5.5h-15a.5.5 0 01-.5-.5V6a1 1 0 011-1zm14 8a1 1 0 01-1 1h-13a1 1 0 01-1-1v-4a1 1 0 011-1h13a1 1 0 011 1v4z"/>
    </svg>
);

// --- Componentes Reutilizáveis ---

// Card de Estatística Principal (Primeira Linha)
const StatCard: React.FC<StatCardProps> = ({ title, value, secondaryText, icon: Icon, colorClass, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay }}
            className="flex flex-col p-6 rounded-xl bg-[#1D2132] border border-transparent hover:border-indigo-600 transition duration-300 shadow-xl cursor-pointer"
        >
            <div className={`flex items-center text-sm font-semibold ${colorClass} mb-2`}>
                <Icon className={`w-5 h-5 mr-2 ${colorClass}`} />
                {title}
            </div>
            <div className="text-4xl font-extrabold text-white">
                {value}
            </div>
            {secondaryText && (
                <p className="text-sm font-light text-gray-400 mt-1">
                    {secondaryText}
                </p>
            )}
        </motion.div>
    );
};

// Card de Estatística Secundária (Terceira Linha)
const MiniStatCard: React.FC<MiniStatCardProps> = ({ title, value, secondaryText, colorClass, delay = 0 }) => {
    let IconComponent: React.FC<{ className?: string }>;
    let iconColorClass = 'text-indigo-400';

    if (title.includes('Aulas assistidas')) {
        IconComponent = BookOpenIcon;
        iconColorClass = 'text-indigo-400';
    } else if (title.includes('Tempo total')) {
        IconComponent = ClockIcon;
        iconColorClass = 'text-blue-400';
    } else if (title.includes('Sequência')) {
        IconComponent = CalendarIcon;
        iconColorClass = 'text-red-500';
    } else {
        IconComponent = StarIcon;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay }}
            className="flex flex-col p-6 rounded-xl bg-[#1D2132] border border-transparent hover:border-pink-600 transition duration-300 shadow-lg cursor-pointer"
        >
            <div className={`text-sm font-semibold text-gray-400 mb-2 flex items-center`}>
                <IconComponent className={`w-5 h-5 mr-2 ${iconColorClass}`} />
                {title}
            </div>
            <div className="text-3xl font-extrabold text-white">
                <span className={colorClass}>{value}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
                {secondaryText}
            </p>
        </motion.div>
    );
};

// Componente de Barra de Progresso customizada
const ProgressBar: React.FC<{ percentage: number, barColor: string, delay: number }> = ({ percentage, barColor, delay }) => {
    return (
        <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.0, delay: delay + 0.5, ease: "easeOut" }}
            className={`h-2 rounded-full ${barColor}`}
        />
    );
};

// Componente para listar Pontos Fortes/Fracos
const SkillSection: React.FC<{ title: string, data: SkillData[], icon: React.FC<{ className?: string }>, iconColor: string, isStrong: boolean }> = ({ title, data, icon: Icon, iconColor, isStrong }) => {
    return (
        <div className="flex flex-col p-6 rounded-xl bg-[#1D2132] shadow-lg h-full">
            <div className={`flex items-center text-lg font-semibold ${iconColor} mb-4`}>
                <Icon className={`w-5 h-5 mr-2 ${iconColor}`} />
                {title}
            </div>
            
            <div className="space-y-4 flex-grow">
                {data.map((item, index) => {
                    const barColor = isStrong ? 'bg-indigo-600' : 'bg-red-600';
                    const accentColor = isStrong ? 'text-indigo-400' : 'text-red-400';
                    const delay = index * 0.1;

                    return (
                        <motion.div
                            key={item.topic}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: delay }}
                            className="text-sm"
                        >
                            <div className="flex justify-between mb-1">
                                <span className="font-medium text-gray-200">{item.topic}</span>
                                <span className={`text-sm ${accentColor}`}>{item.percentage}% de acerto</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-700/70">
                                <ProgressBar percentage={item.percentage} barColor={barColor} delay={delay} />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

// Componente de Tabela de Taxa de Acerto/Simulados
const RateTable: React.FC<{ title: string, data: TableRowData[], icon: React.FC<{ className?: string }>, iconColor: string, delay: number }> = ({ title, data, icon: Icon, iconColor, delay }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay }}
            className="flex flex-col p-6 rounded-xl bg-[#1D2132] shadow-lg relative"
        >
            <div className={`flex items-center text-lg font-semibold ${iconColor} mb-4`}>
                <Icon className={`w-5 h-5 mr-2 ${iconColor}`} />
                {title}
            </div>
            
            <div className="space-y-3">
                <div className="grid grid-cols-2 text-sm font-bold text-gray-400 border-b border-slate-700 pb-2">
                    <span>{data.length > 4 ? 'Assunto' : 'Simulado'}</span>
                    <span className="text-right">Taxa de acerto</span>
                </div>
                {data.map((row, index) => (
                    <div key={index} className="grid grid-cols-2 text-gray-200 text-base py-1 border-b border-slate-800/50 last:border-b-0">
                        <span className='font-light'>{row.item}</span>
                        <span className="text-right font-medium text-indigo-400">{row.rate}</span>
                    </div>
                ))}
                <div className="absolute top-0 right-0 h-full w-0.5 bg-indigo-500 rounded-r-xl" />
            </div>
        </motion.div>
    );
};

// Componente de Ranking Global
const RankingList: React.FC<{ delay: number }> = ({ delay }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay }}
            className="flex flex-col p-6 rounded-xl bg-[#1D2132] shadow-lg"
        >
            <div className="flex items-center text-lg font-semibold text-indigo-400 mb-4">
                <TrophyIcon className='w-5 h-5 mr-2 text-indigo-400' />
                Ranking global
            </div>

            <ol className="space-y-3">
                {rankingGlobal.map((item) => (
                    <li key={item.rank} className="flex justify-between items-center text-gray-200">
                        <span className="font-light">
                            {item.rank}. <span className='font-medium'>{item.name}</span>
                        </span>
                        <span className={`text-sm ${item.colorClass} font-semibold`}>
                            {item.difference}
                        </span>
                    </li>
                ))}
            </ol>
        </motion.div>
    );
};

// --- Componente Principal da Dashboard de Estatísticas ---

const Dashboard: React.FC = () => {
    const [startDate, setStartDate] = useState('11/11/2025');
    const [endDate, setEndDate] = useState('15/11/2025');

    const topStats: StatCardProps[] = [
        {
            title: 'Total de pontos',
            value: '19π',
            secondaryText: '+5 nesta semana',
            icon: PiIcon,
            colorClass: 'text-indigo-400',
            delay: 0.0,
        },
        {
            title: 'Nível atual',
            value: 'Nível 7',
            secondaryText: '+11 pontos para o próximo nível',
            icon: StarIcon,
            colorClass: 'text-blue-400',
            delay: 0.1,
        },
        {
            title: 'Questões acertadas',
            value: '197',
            secondaryText: 'de 250 respondidas',
            icon: CheckCircleIcon,
            colorClass: 'text-green-500',
            delay: 0.2,
        },
        {
            title: 'Questões erradas',
            value: '53',
            secondaryText: 'de 250 respondidas',
            icon: XCircleIcon,
            colorClass: 'text-red-500',
            delay: 0.3,
        },
    ];

    const bottomStats: MiniStatCardProps[] = [
        {
            title: 'Aulas assistidas',
            value: '37 aulas',
            secondaryText: '(+50% assistidas)',
            colorClass: 'text-indigo-400',
            delay: 0.5,
        },
        {
            title: 'Tempo total de estudo',
            value: '17 dias',
            secondaryText: 'desde o início da jornada',
            colorClass: 'text-blue-400',
            delay: 0.6,
        },
        {
            title: 'Sequência de estudos',
            value: '11 dias',
            secondaryText: 'Maior sequência: 19 dias',
            colorClass: 'text-pink-500',
            delay: 0.7,
        },
    ];
    
    const chartVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.8 } },
    };
    
    const background_color = 'bg-[#0A0E18]';
    const card_background = 'bg-[#1D2132]';
    const filter_input_background = 'bg-[#1A1F2D]';

    return (
        <div className={`min-h-screen ${background_color} p-4 sm:p-8 lg:p-12 text-white font-sans`}>
            <header className="flex items-center mb-10">
                <h1 className="text-2xl sm:text-3xl font-bold">Minhas estatísticas</h1>
                <span className="ml-3 text-gray-500 cursor-pointer hover:text-white transition text-xl">?</span>
            </header>

            {/* 1. Grid de Estatísticas Principais (Top Stats) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {topStats.map((stat, index) => (
                    <StatCard key={index} {...stat} delay={stat.delay} />
                ))}
            </section>

            {/* 2. Filtro por Período */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className={`p-6 rounded-xl ${card_background} mb-10 shadow-lg`}
            >
                <div className="flex items-center text-lg font-semibold text-indigo-400 mb-4">
                    <FilterIcon className='w-5 h-5 mr-2 text-indigo-400' />
                    Filtrar por período
                </div>
                <p className="text-sm text-gray-400 mb-4">
                    Selecione um intervalo de dias para visualizar acertos, erros e taxa de acerto.
                </p>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className='relative'>
                        <input
                            type="text"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={`${filter_input_background} text-gray-200 border border-slate-700/60 rounded-md p-3 w-36 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150`}
                        />
                    </div>

                    <div className='relative'>
                        <input
                            type="text"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={`${filter_input_background} text-gray-200 border border-slate-700/60 rounded-md p-3 w-36 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150`}
                        />
                    </div>
                    
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-md shadow-md transition duration-200"
                        onClick={() => console.log('Filtrar aplicado')}
                    >
                        Filtrar
                    </motion.button>
                </div>
            </motion.section>

            {/* 3. Grid de Estatísticas Secundárias (Bottom Stats) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {bottomStats.map((stat, index) => (
                    <MiniStatCard key={index} {...stat} delay={stat.delay} />
                ))}
            </section>
            
            {/* 4. Gráfico de Progresso (Chart) */}
            <motion.section
                variants={chartVariants}
                initial="hidden"
                animate="visible"
                className={`p-6 rounded-xl ${card_background} shadow-2xl`}
            >
                <div className="flex items-center text-lg font-semibold text-indigo-400 mb-6">
                    <PiIcon className='w-5 h-5 mr-2 text-indigo-400' />
                    Progresso de Pontos π ao longo dos dias
                </div>

                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dataProgresso} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" /> 
                            <XAxis dataKey="name" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" domain={[0, 320]} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                                labelStyle={{ color: '#E5E7EB', fontWeight: 'bold' }}
                                formatter={(value: number, name: string) => [`${value} Pontos`, name]}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="pontos" 
                                stroke="#EC4899"
                                strokeWidth={3} 
                                dot={{ fill: '#EC4899', r: 6 }}
                                activeDot={{ fill: '#EC4899', r: 8, stroke: '#FFFFFF', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </motion.section>
        </div>
    );
};

// --- Componente Principal da Dashboard de Performance ---

const PerformanceDashboard: React.FC = () => {
    const background_color = 'bg-[#0A0E18]';

    return (
        <div className={`min-h-screen ${background_color} p-4 sm:p-8 lg:p-12 text-white font-sans`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                
                {/* 1. Pontos Fortes */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0 }}
                >
                    <SkillSection 
                        title="Pontos fortes"
                        data={strongPoints}
                        icon={ThumbsUpIcon}
                        iconColor="text-green-500"
                        isStrong={true}
                    />
                </motion.div>

                {/* 2. Pontos Fracos */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <SkillSection 
                        title="Pontos fracos"
                        data={weakPoints}
                        icon={ThumbsDownIcon}
                        iconColor="text-red-500"
                        isStrong={false}
                    />
                </motion.div>
            </div>

            {/* 3. Taxa de acerto por assunto (Linha Cheia) */}
            <RateTable 
                title="Taxa de acerto por assunto"
                data={subjectRate}
                icon={StarIcon}
                iconColor="text-blue-400"
                delay={0.2}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* 4. Simulados (2/3 da largura no desktop) */}
                <div className="lg:col-span-2 relative">
                    <RateTable 
                        title="Simulados"
                        data={simulatedRate}
                        icon={ListIcon}
                        iconColor="text-blue-400"
                        delay={0.3}
                    />
                </div>

                {/* 5. Ranking global (1/3 da largura no desktop) */}
                <div className="relative">
                    <RankingList delay={0.4} />
                </div>
            </div>
        </div>
    );
};

export { Dashboard, PerformanceDashboard };
export default Dashboard;