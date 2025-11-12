import { Layoutt } from "@/components/layout/page";
import { Metadata } from "next";
import Head from "next/head";

type Params = {
    id: string;
};

type Post = {
    userId: number;
    id: number;
    title: string;
    body: string;
};







export async function generateStaticParams() {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts");
    const posts: Post[] = await res.json();

    return posts.map((post) => ({
        id: post.id.toString(),
    }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${params.id}`);
    const post: Post = await res.json();

    return {
        title: `Principia Matemática - ${post.title}`,
        description: post.body,
        openGraph: {
            title: post.title,
            description: post.body,
            url: `https://principia.com.br/blog/${params.id}`,
            images: [
                {
                    url: "https://metatags.io/images/meta-tags.png",
                    width: 1200,
                    height: 630,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.body,
            images: ["https://metatags.io/images/meta-tags.png"],
        },
    };
}


export default async function BlogItem({ params }: { params: Params }) {
    const res = await fetch(
        `https://jsonplaceholder.typicode.com/posts/${params.id}`,
        {
            next: { revalidate: 7200 }, // opcional: revalida a cada 2h
        }
    );
    const post: Post = await res.json();



    return (
        <Layoutt>
            <div>
                <Head>
                    <title>Principia Matemática - {post.title}</title>
                    <meta name="title" content={post.title} />
                    <meta name="description" content={post.body} />

                    <meta property="og:type" content="website" />
                    <meta property="og:url" content="https://metatags.io/" />
                    <meta property="og:title" content={post.title} />
                    <meta property="og:description" content={post.body} />
                    <meta property="og:image" content="https://metatags.io/images/meta-tags.png" />

                    <meta property="twitter:card" content="summary_large_image" />
                    <meta property="twitter:url" content="https://metatags.io/" />
                    <meta property="twitter:title" content={post.title} />
                    <meta property="twitter:description" content={post.body} />
                    <meta property="twitter:image" content="https://metatags.io/images/meta-tags.png" />
                </Head>
                <h1>Blog</h1>
                <h2>{post.title}</h2>
                <p>{post.body}</p>
            </div>
        </Layoutt>
    );
}
