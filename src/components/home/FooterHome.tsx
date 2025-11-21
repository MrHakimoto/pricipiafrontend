

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
            <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                <img src={'/logo.jpg'} alt="Logo" className="" />
            </div>
            
            <h2 className="text-white font-bold text-xl uppercase">
              Principia<br/>Matemática
            </h2>
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
              <a href="#" className="text-white font-bold hover:text-gray-300 transition-colors">Fórum</a>
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
            <a href="#" className="text-white font-bold block hover:text-gray-300 transition-colors">Meu Perfil</a>
            <a href="#" className="text-white font-bold block hover:text-gray-300 transition-colors">Termos de Uso</a>
            <a href="#" className="text-white font-bold block hover:text-gray-300 transition-colors">Política de Privacidade</a>
            <a href="#" className="text-white font-bold block hover:text-gray-300 transition-colors">Suporte</a>
          </div>

          {/* Coluna 5: Redes Sociais */}
          <div>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#" 
                  className="flex items-center group text-white hover:text-gray-300 transition-colors"
                >
                  <p className="w-5 h-5 mr-3">insta:</p>
                  <span>@principia_matematica</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="flex items-center group text-white hover:text-gray-300 transition-colors"
                >
                  <p className="w-5 h-5 mr-3">yt:</p>
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
