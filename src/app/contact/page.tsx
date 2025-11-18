export default function ContactPage() {
    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }} className="text-black dark:text-white dark:bg-black">

            <h1>Contato</h1>
            <p>Última atualização: {new Date().getFullYear()}</p>

            <p>
                Se você precisa de suporte, tem dúvidas sobre sua conta ou deseja entrar
                em contato conosco por qualquer motivo, utilize um dos canais abaixo.
            </p>

            <h2>E-mail de Suporte</h2>
            <p>
                Envie sua mensagem para:<br />
                <strong>
                    <a href="mailto:contato@principiamatematica.com">
                        contato@principiamatematica.com
                    </a>
                </strong>
            </p>

            <h2>WhatsApp</h2>
            <p>
                Clique abaixo para falar diretamente com nosso atendimento:<br />
                <strong>
                    <a
                        href="https://wa.me/5531996745835"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        +55 (31) 99674-5835
                    </a>
                </strong>
            </p>

            <h2>Horário de Atendimento</h2>
            <p>
                Segunda a Sexta-feira — 08h às 18h<br />
                (Horário de Brasília)
            </p>

            <h2>Outras Informações</h2>
            <p>
                Para dúvidas gerais, informações sobre a plataforma, planos ou questões
                técnicas, nossa equipe responderá o mais rápido possível.
            </p>
        </div>
    );
}
