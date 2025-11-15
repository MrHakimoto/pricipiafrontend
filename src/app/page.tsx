"use client";

import Image from "next/image";
import styles from "./page.module.css";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para a página de login
    router.push("/login");
  }, [router]);
  return (

    <div className={styles.page}>
      <Head>
        <title>Principia Matemática - Área de testes</title>
        <meta name="title" content="Principia Matemática - Área de testes" />
        <meta name="description" content="Essa é a descrição do meu site.
(Enem 2022) Um pedreiro tem uma mulher chata" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://metatags.io/" />
        <meta property="og:title" content="Principia Matemática - Área de testes" />
        <meta property="og:description" content="Essa é a descrição do meu site.
(Enem 2022) Um pedreiro tem uma mulher chata" />
        <meta property="og:image" content="https://metatags.io/images/meta-tags.png" />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://metatags.io/" />
        <meta property="twitter:title" content="Principia Matemática - Área de testes" />
        <meta property="twitter:description" content="Essa é a descrição do meu site.
(Enem 2022) Um pedreiro tem uma mulher chata" />
        <meta property="twitter:image" content="https://metatags.io/images/meta-tags.png" />

      </Head>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol>
          <div className="bg-red-500 text-white p-4">
            Tailwind está funcionando?
          </div>
          <li>
            Get started by editing <code>src/app/page.tsx</code>.
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>
        <div className="min-h-screen bg-yellow-100 flex items-center justify-center">
          <h1 className="text-5xl font-bold text-red-600 bg-red my-5">Tailwind Funcionando?</h1>
          <div className="bg-red-500 text-white p-4">
            Tailwind está funcionando?
          </div>
          <p>ghj</p>
        </div>
        <p>fgdfg</p>
      </main>
    </div>
  );
}
