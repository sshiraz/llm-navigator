export type BlogPostMeta = {
  slug: string;
  title: string;
  date?: string;
  description?: string;
};

export type BlogPost = BlogPostMeta & {
  markdown: string;
};

// Parse simple YAML frontmatter
function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  if (!raw.startsWith('---')) return { meta: {}, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { meta: {}, body: raw };

  const fmBlock = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).trimStart();

  const meta: Record<string, string> = {};
  for (const line of fmBlock.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    // Strip surrounding quotes if present
    value = value.replace(/^["'](.*)["']$/, '$1');
    meta[key] = value;
  }
  return { meta, body };
}

// Load all markdown at build time via Vite
const modules = import.meta.glob('../../content/blog/*.md', { as: 'raw', eager: true }) as Record<string, string>;

export const BLOG_POSTS: BlogPost[] = Object.entries(modules)
  .map(([path, raw]) => {
    const slug = path.split('/').pop()!.replace('.md', '');
    const { meta, body } = parseFrontmatter(raw);
    return {
      slug,
      title: meta.title || slug.replace(/-/g, ' '),
      date: meta.date,
      description: meta.description,
      markdown: body,
    };
  })
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
