// app/blog/page.tsx
import { Layoutt } from "@/components/layout/page";
import Head from "next/head";

type Post = {
    userId: number;
    id: number;
    title: string;
    body: string;
};

type Props = {
    name: string;
    posts: Post[];
};

async function getPosts(): Promise<Post[]> {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
        next: { revalidate: 7200 } // equivalente ao revalidate do getStaticProps
    });
    return res.json();
}

export default async function BlogPage() {
    const posts = await getPosts();
    const name = 'Bonieky';

    return (
        <Layoutt>
            <div>
                
                <h1>Blog ...</h1>
                <p>Blog de {name}</p>
                <ul>
                    {posts.map((post) => (
                        <li key={post.id}>
                            <a href={`/blog/${post.id}`}>{post.title}</a>
                        </li>
                    ))}
                </ul>
            </div>
        </Layoutt>
    );
}
