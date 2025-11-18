export default function TermsPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }} className="text-black dark:text-white dark:bg-black">
    
      <h1>Termos de Uso</h1>
      <p>Última atualização: {new Date().getFullYear()}</p>

      <p>
        Ao acessar e utilizar a plataforma <strong>Principia Matemática</strong> (“nós”, “nosso”,
        “a Plataforma”), você concorda com estes Termos de Uso. Caso não concorde com qualquer
        parte destes termos, recomendamos que não utilize nossos serviços.
      </p>

      <h2>1. Sobre a Plataforma</h2>
      <p>
        A Plataforma disponibiliza aulas, banco de questões, simulados, materiais de estudo e
        ferramentas educacionais voltadas para concursos, vestibulares e preparação acadêmica.
      </p>

      <h2>2. Cadastro e Conta do Usuário</h2>
      <ul>
        <li>O usuário deve fornecer informações verdadeiras no momento do cadastro.</li>
        <li>O usuário é responsável pela segurança e confidencialidade de sua senha.</li>
        <li>
          Podemos suspender ou encerrar contas que apresentem uso indevido, suspeita de fraude
          ou violação dos Termos.
        </li>
      </ul>

      <h2>3. Uso Permitido</h2>
      <p>É estritamente proibido:</p>
      <ul>
        <li>Compartilhar sua conta com terceiros.</li>
        <li>Copiar, redistribuir ou comercializar conteúdos da Plataforma.</li>
        <li>Realizar engenharia reversa, ataques, automações ou manipulação do sistema.</li>
        <li>Usar bots, scripts ou qualquer automação para responder questões.</li>
      </ul>

      <h2>4. Envios de E-mail</h2>
      <p>
        A Plataforma envia e-mails estritamente transacionais, incluindo:
      </p>
      <ul>
        <li>Confirmação de cadastro</li>
        <li>Recuperação de senha</li>
        <li>Alertas de login</li>
        <li>Notificações de atividade</li>
      </ul>
      <p>
        Não enviamos e-mails promocionais sem consentimento. O usuário pode desativar
        comunicações não essenciais quando desejar.
      </p>

      <h2>5. Pagamentos e Assinaturas</h2>
      <p>
        Pagamentos são processados por provedores externos (como Hotmart). Ao adquirir um plano,
        o usuário concorda com as políticas de pagamento, renovação e reembolso da Hotmart.
      </p>

      <h2>6. Responsabilidades do Usuário</h2>
      <ul>
        <li>Utilizar a plataforma apenas para fins educacionais.</li>
        <li>Não violar direitos autorais ou de propriedade intelectual.</li>
        <li>Reportar imediatamente qualquer uso indevido da conta.</li>
      </ul>

      <h2>7. Responsabilidades da Plataforma</h2>
      <p>
        A Plataforma oferece conteúdos e ferramentas conforme disponibilizados, mas não garante
        aprovação em provas, concursos ou resultados específicos.
      </p>

      <h2>8. Suspensão e Encerramento</h2>
      <p>
        Podemos, a nosso critério, suspender temporariamente ou encerrar definitivamente contas
        que violem estes Termos ou comprometam a segurança do sistema.
      </p>

      <h2>9. Propriedade Intelectual</h2>
      <p>
        Todo o conteúdo disponibilizado — incluindo vídeos, PDF, questões, textos, imagens e 
        materiais autorais — pertence à Principia Matemática ou seus licenciadores.
        Qualquer reprodução não autorizada é proibida.
      </p>

      <h2>10. Modificações nos Termos</h2>
      <p>
        Podemos atualizar estes Termos de Uso periodicamente. Alterações passam a valer após sua
        publicação nesta página.
      </p>

      <h2>11. Contato</h2>
      <p>
        Para dúvidas sobre estes Termos de Uso, entre em contato:<br />
        <strong>contato@principiamatematica.com</strong>
      </p>
    </div>
  );
}
