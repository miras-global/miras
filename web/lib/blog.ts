import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

export type PostMeta = {
  slug: string;
  title: string;
  date?: string;
  description?: string;
  draft?: boolean;
};

export type Post = PostMeta & {
  contentHtml: string;
};

const postsDirectory = path.join(process.cwd(), 'content', 'blog');

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) return [];
  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''));
}

export function getAllPostsMeta(): PostMeta[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostMeta(slug))
    .filter((p): p is PostMeta => !!p)
    .sort((a, b) => {
      const da = a.date ? Date.parse(a.date) : 0;
      const db = b.date ? Date.parse(b.date) : 0;
      return db - da;
    });
  return posts;
}

export function getPostMeta(slug: string): PostMeta | null {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data } = matter(fileContents);
  const meta: PostMeta = {
    slug,
    title: (data.title as string) || slug,
    date: data.date as string | undefined,
    description: data.description as string | undefined,
    draft: Boolean(data.draft),
  };
  return meta;
}

export async function getPost(slug: string): Promise<Post | null> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { content, data } = matter(fileContents);

  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  const post: Post = {
    slug,
    title: (data.title as string) || slug,
    date: data.date as string | undefined,
    description: data.description as string | undefined,
    draft: Boolean(data.draft),
    contentHtml,
  };
  return post;
}
