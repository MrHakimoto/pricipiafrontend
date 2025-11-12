import { Question } from "@/types/enem";

export const questions: Question[] = [
  {
    question:
      "Uma empresa vende garrafas de 1,5 litro de suco. Um cliente deseja comprar exatamente 9 litros. Quantas garrafas desse suco ele deverá adquirir?",
    options: [
      { letter: "A", text: "4" },
      { letter: "B", text: "5" },
      { letter: "C", text: "6" },
      { letter: "D", text: "7" },
      { letter: "E", text: "8" },
    ],
    answer: 2, // C - 6 garrafas
    id: 1,
  },
  {
    question:
      "O gráfico da função f(x) = ax + b intercepta o eixo y no ponto (0, 3) e passa pelo ponto (2, 7). Qual é o valor de a?",
    options: [
      { letter: "A", text: "1" },
      { letter: "B", text: "2" },
      { letter: "C", text: "3" },
      { letter: "D", text: "4" },
      { letter: "E", text: "5" },
    ],
    answer: 1, // B - a = 2
    id: 2,
  },
  {
    question:
      "Um reservatório com capacidade de 12.000 litros está com 75% de sua capacidade. Quantos litros faltam para enchê-lo?",
    options: [
      { letter: "A", text: "2000" },
      { letter: "B", text: "2500" },
      { letter: "C", text: "3000" },
      { letter: "D", text: "3500" },
      { letter: "E", text: "4000" },
    ],
    answer: 2, // C - 3000 litros
    id: 3,
  },
  {
    question:
      "O perímetro de um terreno retangular é 64 metros. Sabendo-se que seu comprimento é o dobro da largura, qual é a área desse terreno?",
    options: [
      { letter: "A", text: "128 m²" },
      { letter: "B", text: "192 m²" },
      { letter: "C", text: "256 m²" },
      { letter: "D", text: "384 m²" },
      { letter: "E", text: "512 m²" },
    ],
    answer: 2, // C - 256 m²
    id: 4,
  },
  {
    question:
      "Um estudante deseja saber quanto pagará por um produto com 20% de desconto. Se o preço original é R$ 150,00, qual será o preço com desconto?",
    options: [
      { letter: "A", text: "R$ 100,00" },
      { letter: "B", text: "R$ 110,00" },
      { letter: "C", text: "R$ 115,00" },
      { letter: "D", text: "R$ 120,00" },
      { letter: "E", text: "R$ 125,00" },
    ],
    answer: 3, // D - R$ 120,00
    id: 5,
  },
  {
  question: "Se um carro percorre 180 km em 3 horas, qual é a sua velocidade média?",
  options: [
    { letter: "A", text: "60 km/h" },
    { letter: "B", text: "70 km/h" },
    { letter: "C", text: "80 km/h" },
    { letter: "D", text: "90 km/h" },
    { letter: "E", text: "100 km/h" },
  ],
  answer: 0,
  id: 6,
},
{
  question: "Qual é a soma dos ângulos internos de um octógono?",
  options: [
    { letter: "A", text: "1080°" },
    { letter: "B", text: "1260°" },
    { letter: "C", text: "1440°" },
    { letter: "D", text: "1620°" },
    { letter: "E", text: "1800°" },
  ],
  answer: 2, // 180(n-2) = 180(8-2) = 1080°
  id: 7,
},
{
  question: "Qual é o número que, multiplicado por 5, resulta em 60?",
  options: [
    { letter: "A", text: "10" },
    { letter: "B", text: "11" },
    { letter: "C", text: "12" },
    { letter: "D", text: "13" },
    { letter: "E", text: "14" },
  ],
  answer: 2, // 12 × 5 = 60
  id: 8,
},
{
  question: "Se um trabalhador recebe R$ 1800 por 30 dias de trabalho, quanto ele recebe por dia?",
  options: [
    { letter: "A", text: "R$ 50,00" },
    { letter: "B", text: "R$ 55,00" },
    { letter: "C", text: "R$ 60,00" },
    { letter: "D", text: "R$ 65,00" },
    { letter: "E", text: "R$ 70,00" },
  ],
  answer: 2, // 1800 / 30 = 60
  id: 9,
},
{
  question: "Qual é a raiz quadrada de 225?",
  options: [
    { letter: "A", text: "13" },
    { letter: "B", text: "14" },
    { letter: "C", text: "15" },
    { letter: "D", text: "16" },
    { letter: "E", text: "17" },
  ],
  answer: 2, // √225 = 15
  id: 10,
},
];
