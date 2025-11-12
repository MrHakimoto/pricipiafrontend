import { notFound } from "next/navigation";

interface ForumPageProps {
  params: Promise<{ slug: string }>; // ❌ Errado — o Next não manda Promise
}

// ✅ Corrigido
interface ForumPageParams {
  slug: string;
}

export default async function ForumPage({
  params,
}: {
  params: ForumPageParams;
}) {
  const post = await getPostData(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <p className="text-gray-700 leading-relaxed mb-8">{post.content}</p>

      <section>
        <h2 className="text-xl font-semibold mb-3">Comentários</h2>
        <div className="space-y-3">
          {post.comments.map((c) => (
            <div
              key={c.id}
              className="p-3 border rounded-xl bg-gray-50 shadow-sm"
            >
              <p className="font-medium">{c.author}</p>
              <p className="text-gray-600">{c.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

// Simula busca de dados (poderia vir da API Laravel)
async function getPostData(slug: string) {
  const fakePosts = {
    "primeiro-topico": {
      title: "Primeiro Tópico no Fórum",
      content:
        "Este é um exemplo de post carregado dinamicamente pelo slug. Aqui você pode renderizar o conteúdo do fórum.",
      comments: [
        { id: 1, author: "Carlos", text: "Muito bom!" },
        { id: 2, author: "Marina", text: "Acompanho o tópico." },
      ],
    },
    "duvida-sobre-laravel": {
      title: "Dúvida sobre Laravel",
      content:
        "Alguém sabe como configurar o cache de rota no Laravel com o Artisan?",
      comments: [
        { id: 1, author: "João", text: "Tenta usar `php artisan route:cache`" },
      ],
    },
  };

  return fakePosts[slug] || null;
}
