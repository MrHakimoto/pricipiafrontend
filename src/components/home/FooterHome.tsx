

export const FooterHome = () => {
  // Cores especificadas
  const bgColor = '#1B1F27';
  const pinkColor = '#D0004C';

  return (
    // Container principal do footer com a cor de fundo
    <footer style={{ backgroundColor: bgColor }} className="text-gray-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">

        {/* Grade principal para as colunas */}
        {/* Layout responsivo:
          - 1 coluna em telas pequenas (mobile)
          - 2 colunas em telas médias (tablet)
          - 5 colunas em telas grandes (desktop) como na imagem
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 gap-y-10">

          {/* Coluna 1: Logo e Slogan */}
          {/* Usei col-span-2 no tablet para o logo ficar sozinho em uma linha */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            {/* ** IMPORTANTE **
              Substitua este 'div' pelo seu componente de Logo ou tag <img /> 
            */}
            <div className="  rounded-lg flex items-center justify-center">
              <img src={'/logo-principia-white.png'} alt="Logo" className="" />
            </div>


            <p className="text-sm text-white max-w-xs">
              Aqui você irá aprender matemática de verdade, sem decorar fórmulas.
            </p>
            <p className="text-xs text-white max-w-xs">
              Forjado sob o esplendor solar das terras norte-mineiras. E depois de muita luta!
            </p>
          </div>

          {/* Coluna 2: Cursos & Fórum */}
          <div className="space-y-8">
            <div>
              <h3 className="text-white font-bold mb-4">Cursos</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Princípios de Matemática Elementar</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Princípios de Matemática Básica</a></li>
              </ul>
            </div>
            <div>
              <a href="/forum" className="text-white font-bold hover:text-gray-300 transition-colors">Fórum</a>
            </div>
          </div>

          {/* Coluna 3: Exercícios */}
          <div>
            <h3 className="text-white font-bold mb-4">Exercícios</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Todas as questões</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Listas oficiais</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Provas famosas</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Minhas listas</a></li>
            </ul>
          </div>

          {/* Coluna 4: Navegação da Conta */}
          <div className="space-y-4">
            <a href="/perfil" className="text-white font-bold block hover:text-gray-300 transition-colors">Meu Perfil</a>
            <a href="/terms" className="text-white font-bold block hover:text-gray-300 transition-colors">Termos de Uso</a>
            <a href="/privacy" className="text-white font-bold block hover:text-gray-300 transition-colors">Política de Privacidade</a>
            <a href="https://wa.me/5531996745835" className="text-white font-bold block hover:text-gray-300 transition-colors">Suporte</a>
          </div>

          {/* Coluna 5: Redes Sociais */}
          <div>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://www.instagram.com/principia_matematica/"
                  className="flex items-center group text-white hover:text-gray-300 transition-colors"
                >
                  <p className="w-5 h-5 mr-3"><svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3h10zm-5 3.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm0 7.3A2.8 2.8 0 1 1 14.8 12 2.8 2.8 0 0 1 12 14.8zm4.8-8.6a1 1 0 1 1-1-1 1 1 0 0 1 1 1z" />
                  </svg> </p>
                  <span>@principia_matematica</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@principia_matematica"
                  className="flex items-center group text-white hover:text-gray-300 transition-colors"
                >
                  <p className="w-5 h-5 mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M23.498 6.186a3.01 3.01 0 0 0-2.112-2.133C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.386.553A3.01 3.01 0 0 0 .502 6.186 31.36 31.36 0 0 0 0 12a31.36 31.36 0 0 0 .502 5.814 3.01 3.01 0 0 0 2.112 2.133C4.495 20.5 12 20.5 12 20.5s7.505 0 9.386-.553a3.01 3.01 0 0 0 2.112-2.133A31.36 31.36 0 0 0 24 12a31.36 31.36 0 0 0-.502-5.814ZM9.75 15.568V8.432L15.818 12 9.75 15.568Z" />
                    </svg>


                  </p>
                  <span>Principia Matemática</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Linha de Copyright (separador) */}
        <div className="border-t border-gray-700 mt-12 pt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2025 Principia Matemática. Todos os direitos reservados.
          </p>
        </div>

      </div>
    </footer>
  );
};
