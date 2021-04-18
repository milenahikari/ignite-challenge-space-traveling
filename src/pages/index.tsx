import { GetStaticProps } from 'next';
import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import Head from 'next/head';
import { FiCalendar, FiUser } from "react-icons/fi";

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

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
  return (
    <>
      <Head>
        <title>Home | Space Travelling</title>
      </Head>

      <main className={styles.contentContainer}>
        {postsPagination?.results?.map(post => (
          <section className={styles.post}>
            <Link href={`/post/${post.uid}`}>
              <a key={post.uid} >
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>

                <div className={styles.info}>
                  <div>
                    <FiCalendar color="#BBBBBB" />
                    <span>{post.first_publication_date}</span>
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
    pageSize: 20,
  });

  const posts = postsResponse.results.map(post => ({
    uid: post.slugs[0],
    first_publication_date: format(
      parseISO(post.last_publication_date),
      "dd MMM yyyy", {
      locale: ptBR,
    }),
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  return {
    props: {
      postsPagination: {
        next_page: '1',
        results: posts
      }
    }
  }
};
