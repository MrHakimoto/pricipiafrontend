export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }} className="text-black dark:text-white dark:bg-black">
      <h1>Política de Privacidade</h1>
      <p>Última atualização: {new Date().getFullYear()}</p>

      <p>
        Esta Política de Privacidade explica como a plataforma <strong>Principia Matemática</strong>
        (“nós”, “nosso”, “a Plataforma”) coleta, utiliza e protege suas informações pessoais
        ao utilizar nosso site, aplicativos e serviços educacionais.
      </p>

      <h2>1. Informações que Coletamos</h2>
      <p>Coletamos os seguintes tipos de dados:</p>
      <ul>
        <li>
          <strong>Informações da conta:</strong> nome, e-mail, senha.
        </li>
        <li>
          <strong>Dados de atividade:</strong> módulos concluídos, tentativas de questões, pontuações.
        </li>
        <li>
          <strong>Informações do dispositivo:</strong> endereço IP, tipo de navegador, logs de uso.
        </li>
        <li>
          <strong>Dados de comunicação:</strong> mensagens de suporte, dados de entrega de e-mails.
        </li>
      </ul>

      <h2>2. Como Utilizamos Suas Informações</h2>
      <p>Seus dados são utilizados exclusivamente para operar e melhorar a Plataforma:</p>
      <ul>
        <li>Gerenciar sua conta e autenticação.</li>
        <li>Enviar e-mails de login, recuperação de senha e verificação.</li>
        <li>Entregar o conteúdo dos cursos e acompanhar seu desempenho.</li>
        <li>Prevenir fraudes e monitorar a segurança do sistema.</li>
        <li>Melhorar a experiência do usuário e as funcionalidades da plataforma.</li>
      </ul>

      <h2>3. Envio de E-mails</h2>
      <p>
        Enviamos apenas e-mails transacionais, como confirmações de conta,
        alertas de login, redefinição de senha e notificações de atividade.
        Você pode optar por não receber comunicações não essenciais a qualquer momento.
      </p>

      <h2>4. Cookies & Rastreamento</h2>
      <p>
        Utilizamos cookies para manter sua sessão, garantir a segurança de acesso
        e melhorar a usabilidade. Cookies podem armazenar identificadores de sessão
        e dados analíticos.
      </p>

      <h2>5. Proteção de Dados</h2>
      <p>
        Todas as informações pessoais são armazenadas com segurança e nunca são vendidas
        ou compartilhadas com terceiros, exceto quando necessário para operar serviços
        essenciais (ex.: análises, entrega de e-mails).
      </p>

      <h2>6. Serviços Terceiros</h2>
      <p>Podemos utilizar provedores externos, como:</p>
      <ul>
        <li>Amazon Web Services (hospedagem e envio de e-mails)</li>
        <li>Vercel (infraestrutura do frontend)</li>
        <li>Serviços de análise e monitoramento</li>
      </ul>

      <h2>7. Seus Direitos</h2>
      <p>
        Você pode solicitar acesso, correção ou exclusão dos seus dados pessoais a qualquer
        momento, entrando em contato através de{" "}
        <strong>contato@principiamatematica.com</strong>.
      </p>

      <h2>8. Contato</h2>
      <p>
        Caso tenha dúvidas sobre esta Política de Privacidade, entre em contato:<br />
        <strong>contato@principiamatematica.com</strong>
      </p>
    </div>
  );
}
