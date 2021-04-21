import { useState } from 'react';
import { GetStaticProps } from 'next';
import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import Head from 'next/head';

import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser } from "react-icons/fi";

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [pagination, setPagination] = useState<string | null>(postsPagination.next_page);

  const handlePagination = async () => {
    const response = await fetch(pagination);
    const { results } = await response.json();

    const newPosts = results.map((post) => {
      return {
        uid: post?.uid,
        first_publication_date: format(
          parseISO(post?.first_publication_date),
          "dd MMM yyyy", {
          locale: ptBR,
        }),
        data: {
          title: post?.data?.title,
          subtitle: post?.data?.subtitle,
          author: post?.data?.author,
        }
      }
    });

    const postsFormatted = [...posts, ...newPosts];
    setPosts(postsFormatted);
    setPagination(results.next_page);
  }

  return (
    <>
      <Head>
        <title>Home | Space Travelling</title>
      </Head>

      <Header />
      <main className={commonStyles.contentContainer}>
        {posts.map(post => (
          <section key={post.uid} className={styles.post}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>

                <div className={commonStyles.info}>
                  <div>
                    <FiCalendar color="#BBBBBB" />
                    <span>{format(
                      parseISO(post.first_publication_date),
                      "dd MMM yyyy", {
                      locale: ptBR,
                    })}</span>
                  </div>
                  <div>
                    <FiUser color="#BBBBBB" />
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          </section>
        ))}

        {pagination &&
          <button
            onClick={() => handlePagination()}
            type="button">
            Carregar mais posts
          </button>
        }
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 2,
  });

  const posts = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts
      }
    },
    revalidate: 60 * 60 // 1 hora
  }
};
