import React, { useMemo } from 'react';
import Prismic from '@prismicio/client';
import { GetStaticPaths, GetStaticProps } from 'next';
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';

import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div className={commonStyles.contentContainer}>Carregando...</div>
  }

  const minutes = useMemo(() => {
    const totalWord = post.data.content.reduce((acumulator, current) => {
      const wordsHeading = current.heading;
      const totalWordsHeading = wordsHeading.split(' ').length;

      const wordsBody = RichText.asText(current.body);
      const totalWordsBody = wordsBody.split(' ').length;

      return acumulator + totalWordsHeading + totalWordsBody;
    }, 0);

    return Math.round(totalWord / 200);
  }, []);

  return (
    <section className={styles.container}>
      <img src={post.data.banner.url} alt={post.data.title} />

      <article className={`${commonStyles.contentContainer} ${styles.post}`}>
        <h1>{post.data.title}</h1>

        <section className={commonStyles.info}>
          <div>
            <FiCalendar color="#BBBBBB" />
            <span>{post.first_publication_date}</span>
          </div>
          <div>
            <FiUser color="#BBBBBB" />
            <span>{post.data.author}</span>
          </div>
          <div>
            <FiClock color="#BBBBBB" />
            <span>{minutes} min</span>
          </div>
        </section>

        {post.data.content.map(content => (
          <section className={styles.content}>
            <h2>{content.heading}</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(content.body),
              }}
            />
          </section>
        ))}

      </article>
    </section>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title'],
    pageSize: 20,
  });

  const paths = posts.results.map((post) => {
    const slug = post.uid;
    return {
      params: { slug }
    }
  });

  return {
    paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  if (!response) return { notFound: true };

  const post = {
    first_publication_date: format(
      parseISO(response.last_publication_date),
      "dd MMM yyyy", {
      locale: ptBR,
    }),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content
    }
  };

  return {
    props: {
      post
    }
  }
};
