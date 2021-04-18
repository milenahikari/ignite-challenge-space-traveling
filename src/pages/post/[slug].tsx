import React from 'react';
import Prismic from '@prismicio/client';
import { GetStaticPaths, GetStaticProps } from 'next';
import { getPrismicClient } from '../../services/prismic';

import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';

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
            <span>4 min</span>
          </div>
        </section>
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
      content: response.data.content.map(section => ({
        heading: section.heading,
        body: RichText.asText(section.body)
      }))
    }
  };

  return {
    props: {
      post
    }
  }
};
