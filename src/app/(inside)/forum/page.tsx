"use client"
import { useState } from "react";

import messages from "@/store/messages";

const Forum = () => {
  const [showCard, setShowCard] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);

  return (
    <div className="min-h-screen bg-[#00091A] text-white font-sans relative">
      {/* Header */}
   

      {/* Título e descrição */}
      <div className="px-8 py-6 border-gray-700 bg-[#1B1F27]">
        <h1 className="text-lg font-bold">
          Fórum{" "}
          <span className="font-normal">
            | Explore as dúvidas das questões disponíveis no nosso banco de
            questões.
          </span>
        </h1>
      </div>

      {/* Main */}
      <div className="container mx-auto px-40">
        {/* ======== VISUALIZAÇÃO DETALHADA ======== */}
        {selectedMsg ? (
          <div className="p-6 space-y-4">
            {/* Botão voltar */}
            <button
              onClick={() => setSelectedMsg(null)}
              className="text-[#4A5260] text-md flex items-center gap-2 cursor-pointer"
            >
              <span className="flex items-center cursor-pointer hover:opacity-80">
                <svg
                  width="40" height="40" viewBox="0 0 53 57" fill="none"
                  xmlns="http://www.w3.org/2000/svg" 
                >
                  <rect width="53" height="57" rx="5" fill="#414957" />
                  <g clipPath="url(#clip0_653_132)">
                    <path d="M10.7452 27.145C10.2537 27.6372 9.97754 28.3044 9.97754 29C9.97754 29.6956 10.2537 30.3628 10.7452 30.855L20.6432 40.7583C21.1357 41.2507 21.8036 41.5273 22.5 41.5273C23.1964 41.5273 23.8643 41.2507 24.3567 40.7583C24.8492 40.2658 25.1258 39.5979 25.1258 38.9015C25.1258 38.2051 24.8492 37.5372 24.3567 37.0448L18.9387 31.625H39.125C39.8212 31.625 40.4888 31.3484 40.9811 30.8562C41.4734 30.3639 41.75 29.6962 41.75 29C41.75 28.3038 41.4734 27.6361 40.9811 27.1438C40.4888 26.6516 39.8212 26.375 39.125 26.375H18.9387L24.3567 20.957C24.6006 20.7132 24.794 20.4237 24.9259 20.1051C25.0579 19.7865 25.1258 19.4451 25.1258 19.1003C25.1258 18.7554 25.0579 18.414 24.9259 18.0954C24.794 17.7768 24.6006 17.4873 24.3567 17.2435C24.1129 16.9997 23.8234 16.8063 23.5048 16.6743C23.1863 16.5423 22.8448 16.4744 22.5 16.4744C22.1551 16.4744 21.8137 16.5423 21.4951 16.6743C21.1765 16.8063 20.8871 16.9997 20.6432 17.2435L10.7452 27.145Z" fill="#EEEEEE" />
                  </g>
                  <defs>
                    <clipPath id="clip0_653_132">
                      <rect width="42" height="42" fill="white" transform="matrix(0 -1 1 0 5 50)" />
                    </clipPath>
                  </defs>
                </svg>
              </span>
              Voltar
            </button>


            {/* Dúvida principal */}
            <div className="border border-[#2F3541] rounded-md p-4">
              {/* Cabeçalho (nome + data) */}
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm flex items-center gap-2">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 94 93"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2"
                      >
                        <path d="M94 46.5C94 20.8785 72.897 0 47 0C21.103 0 0 20.8785 0 46.5C0 59.985 5.875 72.1215 15.181 80.631C15.181 80.6775 15.181 80.6775 15.134 80.724C15.604 81.189 16.168 81.561 16.638 81.9795C16.92 82.212 17.155 82.4445 17.437 82.6305C18.283 83.328 19.223 83.979 20.116 84.63C20.445 84.8625 20.727 85.0485 21.056 85.281C21.949 85.8855 22.889 86.4435 23.876 86.955C24.205 87.141 24.581 87.3735 24.91 87.5595C25.85 88.071 26.837 88.536 27.871 88.9545C28.247 89.1405 28.623 89.3265 28.999 89.466C30.033 89.8845 31.067 90.2565 32.101 90.582C32.477 90.7215 32.853 90.861 33.229 90.954C34.357 91.2795 35.485 91.5585 36.613 91.8375C36.942 91.9305 37.271 92.0235 37.647 92.07C38.963 92.349 40.279 92.535 41.642 92.6745C41.83 92.6745 42.018 92.721 42.206 92.7675C43.804 92.907 45.402 93 47 93C48.598 93 50.196 92.907 51.747 92.7675C51.935 92.7675 52.123 92.721 52.311 92.6745C53.674 92.535 54.99 92.349 56.306 92.07C56.635 92.0235 56.964 91.884 57.34 91.8375C58.468 91.5585 59.643 91.326 60.724 90.954C61.1 90.8145 61.476 90.675 61.852 90.582C62.886 90.21 63.967 89.8845 64.954 89.466C65.33 89.3265 65.706 89.1405 66.082 88.9545C67.069 88.536 68.056 88.071 69.043 87.5595C69.419 87.3735 69.748 87.141 70.077 86.955C71.017 86.397 71.957 85.8855 72.897 85.281C73.226 85.095 73.508 84.8625 73.837 84.63C74.777 83.979 75.67 83.328 76.516 82.6305C76.798 82.398 77.033 82.1655 77.315 81.9795C77.832 81.561 78.349 81.1425 78.819 80.724C78.819 80.6775 78.819 80.6775 78.772 80.631C88.125 72.1215 94 59.985 94 46.5ZM70.218 69.6105C57.481 61.1475 36.613 61.1475 23.782 69.6105C21.714 70.959 20.022 72.54 18.612 74.2605C11.468 67.0995 7.05 57.288 7.05 46.5C7.05 24.6915 24.957 6.975 47 6.975C69.043 6.975 86.95 24.6915 86.95 46.5C86.95 57.288 82.532 67.0995 75.388 74.2605C74.025 72.54 72.286 70.959 70.218 69.6105Z" fill="#DBD9D9"/>
                        <path d="M47 22.923C37.271 22.923 29.375 30.735 29.375 40.3606C29.375 49.8001 36.848 57.4726 46.765 57.7516H47.188H47.517H47.611C57.105 57.4261 64.578 49.8001 64.625 40.3606C64.625 30.735 56.729 22.923 47 22.923Z" fill="#DBD9D9"/>
                      </svg>
                  {selectedMsg.name}
                </span>
                <span className="text-sm text-gray-400">
                  {selectedMsg.date} às {selectedMsg.hour}
                </span>
              </div>

              {/* Mensagem + bloco da questão (lado a lado) */}
              <div className="flex justify-between items-center">
                <p className="text-gray-200 text-sm">{selectedMsg.message}</p>

                <div className="bg-[#1B1F27] rounded-md px-3 py-4 flex items-center gap-2 text-xs text-gray-300 ml-4">
                  <span className="font-semibold text-white bg-[#00091A] px-2 py-1 rounded-md">
                    ID: {selectedMsg.idQuestao}
                  </span>
                  <span className="text-white">
                    {selectedMsg.conteudoQuestao}, {selectedMsg.provaQuestao},{" "}
                    {selectedMsg.anoQuestao}
                  </span>
                </div>
              </div>
            </div>

            {/* Respostas */}
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-white border-b border-white pb-2">Respostas</h3>

              {/* Não sei como ficaria a parte de receber as respostas entao nao ta completa */}
              {selectedMsg.respostas && selectedMsg.respostas.length > 0 ? (
                selectedMsg.respostas.map((resp) => (
                  <div
                    key={resp.id}
                    className="border border-[#2F3541] rounded-md p-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-sm">
                        {resp.name}
                      </span>
                      <span className="text-sm text-gray-400">
                        {resp.date} às {resp.hour}
                      </span>
                    </div>
                    <p className="text-gray-200 text-sm">{resp.message}</p>

                    {/* Comentários */}
                    {resp.comentarios && resp.comentarios.length > 0 && (
                      <div className="mt-4 border-t border-gray-700 pt-3 space-y-2">
                        {resp.comentarios.map((c) => (
                          <div
                            key={c.id}
                            className="text-sm text-gray-300 bg-[#1B1F27] rounded-md px-3 py-2"
                          >
                            <span className="font-semibold">{c.name}:</span>{" "}
                            {c.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">Nenhuma resposta ainda.</p>
              )}
            </div>

            {/* Campo adicionar resposta */}
            <div className="mt-6">
              <h4 className="text-white text-md font-bold mb-2">
                Adicionar uma resposta
              </h4>
              <textarea
                placeholder="Digite sua resposta..."
                className="w-full h-24 bg-[#00091A] border border-gray-600 rounded-md p-2 text-sm focus:outline-none mb-3 resize-none"
              />
              <button className="bg-[#0E00D0] hover:bg-blue-700 px-5 py-2 rounded-md font-medium text-sm cursor-pointer">
                + Enviar resposta
              </button>
            </div>
          </div>
        ) : (
          /* ======== LISTA DE DÚVIDAS ======== */
          <>
            {/* Barra de pesquisa */}
            <div className="px-6 py-4 space-y-2">
              <p>Pesquise as dúvidas existentes pelo ID da questão ou pelo nome:</p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar"
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-[#4A5260] focus:outline-none text-sm"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4A5260]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                  />
                </svg>
              </div>

              <div className="flex gap-2">
                <div className="px-4 py-2 border-gray-700 bg-[#1B1F27] flex-1 rounded-md flex justify-between items-center">
                  <h1 className="text-md font-bold">
                    <span className="font-normal">
                      Tem alguma dúvida em relação a alguma aula ou questão?
                    </span>
                  </h1>
                  <button
                    onClick={() => setShowCard(true)}
                    className="cursor-pointer bg-[#0E00D0] hover:bg-blue-700 px-4 py-2 rounded-md font-medium text-sm"
                  >
                    Postar dúvida
                  </button>
                </div>
              </div>
            </div>

            {/* Filtro */}
            <div className="px-6 py-2">
              <select className="text-sm border border-[#4A5260] px-3 py-1 rounded-md cursor-pointer hover:bg-[#1E293B]">
                <option>Mais recente</option>
                <option>Mais antigo</option>
              </select>
            </div>

            {/* Lista de mensagens */}
            <div className="px-6 py-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMsg(msg)}
                  className="border border-[#2F3541] rounded-md p-4 flex flex-col cursor-pointer hover:bg-[#0F172A] transition-colors duration-150"
                >
                  {/* Nome e foto */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold inline-flex items-center text-sm">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 94 93"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2"
                      >
                        <path d="M94 46.5C94 20.8785 72.897 0 47 0C21.103 0 0 20.8785 0 46.5C0 59.985 5.875 72.1215 15.181 80.631C15.181 80.6775 15.181 80.6775 15.134 80.724C15.604 81.189 16.168 81.561 16.638 81.9795C16.92 82.212 17.155 82.4445 17.437 82.6305C18.283 83.328 19.223 83.979 20.116 84.63C20.445 84.8625 20.727 85.0485 21.056 85.281C21.949 85.8855 22.889 86.4435 23.876 86.955C24.205 87.141 24.581 87.3735 24.91 87.5595C25.85 88.071 26.837 88.536 27.871 88.9545C28.247 89.1405 28.623 89.3265 28.999 89.466C30.033 89.8845 31.067 90.2565 32.101 90.582C32.477 90.7215 32.853 90.861 33.229 90.954C34.357 91.2795 35.485 91.5585 36.613 91.8375C36.942 91.9305 37.271 92.0235 37.647 92.07C38.963 92.349 40.279 92.535 41.642 92.6745C41.83 92.6745 42.018 92.721 42.206 92.7675C43.804 92.907 45.402 93 47 93C48.598 93 50.196 92.907 51.747 92.7675C51.935 92.7675 52.123 92.721 52.311 92.6745C53.674 92.535 54.99 92.349 56.306 92.07C56.635 92.0235 56.964 91.884 57.34 91.8375C58.468 91.5585 59.643 91.326 60.724 90.954C61.1 90.8145 61.476 90.675 61.852 90.582C62.886 90.21 63.967 89.8845 64.954 89.466C65.33 89.3265 65.706 89.1405 66.082 88.9545C67.069 88.536 68.056 88.071 69.043 87.5595C69.419 87.3735 69.748 87.141 70.077 86.955C71.017 86.397 71.957 85.8855 72.897 85.281C73.226 85.095 73.508 84.8625 73.837 84.63C74.777 83.979 75.67 83.328 76.516 82.6305C76.798 82.398 77.033 82.1655 77.315 81.9795C77.832 81.561 78.349 81.1425 78.819 80.724C78.819 80.6775 78.819 80.6775 78.772 80.631C88.125 72.1215 94 59.985 94 46.5ZM70.218 69.6105C57.481 61.1475 36.613 61.1475 23.782 69.6105C21.714 70.959 20.022 72.54 18.612 74.2605C11.468 67.0995 7.05 57.288 7.05 46.5C7.05 24.6915 24.957 6.975 47 6.975C69.043 6.975 86.95 24.6915 86.95 46.5C86.95 57.288 82.532 67.0995 75.388 74.2605C74.025 72.54 72.286 70.959 70.218 69.6105Z" fill="#DBD9D9"/>
                        <path d="M47 22.923C37.271 22.923 29.375 30.735 29.375 40.3606C29.375 49.8001 36.848 57.4726 46.765 57.7516H47.188H47.517H47.611C57.105 57.4261 64.578 49.8001 64.625 40.3606C64.625 30.735 56.729 22.923 47 22.923Z" fill="#DBD9D9"/>
                      </svg>
                      {msg.name}
                    </span>
                    <span className="text-sm text-gray-400">
                      {msg.date} às {msg.hour}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-gray-200 text-sm">{msg.message}</p>
                    <div className="bg-[#1B1F27] rounded-md px-3 py-4 flex items-center gap-2 text-xs text-gray-300">
                      <span className="font-semibold text-white bg-[#00091A] px-2 py-1 rounded-md">
                        ID: {msg.idQuestao}
                      </span>
                      <span className="text-white">
                        {msg.conteudoQuestao}, {msg.provaQuestao},{" "}
                        {msg.anoQuestao}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ===== Modal (Postar dúvida) ===== */}
      {showCard && (
        <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-50">
          <div className="bg-[#00091A] w-[600px] p-6 rounded-xl shadow-lg relative">
            <button
              onClick={() => setShowCard(false)}
              className="cursor-pointer absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-4">
              Digite o id ou nome da questão que você possui dúvida:
            </h2>

            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar"
                className="w-full pl-10 pr-4 py-2 rounded-md border border-[#4A5260] focus:outline-none text-sm"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4A5260]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                />
              </svg>
            </div>

            {/* Resultado simulado */}
            <div className="bg-[#00091A] rounded-md mb-4 mt-2 border border-[#1E2533]">
              <div className="flex items-center text-sm">
                <span className="font-semibold text-white bg-[#1F293C] px-3 py-1 rounded-tl-md">
                  M03072005
                </span>
                <span className="text-black bg-white flex-1 px-3 py-1 rounded-tr-md">
                  Matemática, Geometria Plana
                </span>
              </div>
              <div className="p-3">
                <p className="text-gray-200 text-sm">
                  O tipo de triângulo com vértices nos pontos A, B e C, no
                  momento em que o remador está nessa posição, é:
                </p>
              </div>
            </div>

            <h2 className="text-md font-semibold mb-2">Digite sua dúvida:</h2>
            <textarea
              placeholder="Digite sua dúvida..."
              className="w-full h-28 bg-[#00091A] border border-gray-600 rounded-md p-2 text-sm focus:outline-none mb-4 resize-none"
            />
            <button className="bg-[#0E00D0] cursor-pointer hover:bg-blue-700 px-5 py-2 rounded-md font-medium text-sm">
              Enviar dúvida
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;