import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Search, LogIn, Mail, ArrowLeft, Calendar } from 'lucide-react';
import { getPostBySlug } from './blogIndex';

interface BlogPostPageProps {
  slug: string | null;
}

export default function BlogPostPage({ slug }: BlogPostPageProps) {
  const post = slug ? getPostBySlug(slug) : null;

  const handleSignIn = () => {
    window.location.hash = '#auth';
    window.location.reload();
  };

  // Set SEO meta tags
  useEffect(() => {
    if (post) {
      document.title = `${post.title} | LLM Navigator Blog`;

      // Set meta description
      let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', post.description || post.title);

      // Set canonical URL
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = `https://llmsearchinsight.com/blog/${post.slug}`;
    }

    return () => {
      // Reset title on unmount
      document.title = 'LLM Navigator';
    };
  }, [post]);

  if (!slug) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Missing post slug</h1>
          <a href="/blog" className="text-blue-400 hover:text-blue-300">← Back to Blog</a>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Post not found</h1>
          <p className="text-slate-400 mb-6">The blog post you're looking for doesn't exist.</p>
          <a href="/blog" className="text-blue-400 hover:text-blue-300">← Back to Blog</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Header */}
      <nav className="relative z-10 border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-white">LLM Navigator</h1>
              <p className="text-xs text-slate-400">Answer Engine Optimization</p>
            </div>
          </a>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-3">
            <a
              href="/blog"
              className="hidden sm:flex items-center space-x-2 px-4 py-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>Blog</span>
            </a>

            <a
              href="/free-report"
              className="hidden sm:flex items-center space-x-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              <span>Free Report</span>
            </a>

            <button
              onClick={() => {
                window.location.hash = '#contact';
              }}
              className="hidden sm:flex items-center space-x-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Contact</span>
            </button>

            <button
              onClick={handleSignIn}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all border border-slate-600"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <a
          href="/blog"
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Blog</span>
        </a>

        {/* Post Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {post.title}
          </h1>
          {post.date && (
            <div className="flex items-center space-x-2 text-slate-400">
              <Calendar className="w-4 h-4" />
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>
          )}
        </header>

        {/* Post Content */}
        <article className="prose prose-lg prose-invert max-w-none
          prose-headings:text-white
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:font-bold
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:font-semibold
          prose-p:text-slate-300 prose-p:leading-relaxed
          prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-a:no-underline
          prose-strong:text-white
          prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
          prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
          prose-li:text-slate-300 prose-li:my-2 prose-li:pl-2
          prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-400
          prose-code:text-blue-300 prose-code:bg-slate-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
          prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-lg
          prose-table:border-collapse
          prose-th:bg-slate-800 prose-th:text-white prose-th:font-semibold prose-th:px-4 prose-th:py-2 prose-th:border prose-th:border-slate-700
          prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-slate-700 prose-td:text-slate-300
          prose-hr:border-slate-700
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.markdown}</ReactMarkdown>
        </article>

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-slate-700">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">
              Want to see your AI visibility score?
            </h3>
            <p className="text-slate-400 mb-4">
              Get a free report showing how AI assistants currently perceive your brand.
            </p>
            <a
              href="/free-report"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span>Get Free Report</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center md:items-start space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Search className="w-4 h-4 text-white" />
                </div>
                <span className="text-slate-400 text-sm">© 2025 LLM Navigator</span>
              </div>
              <p className="text-slate-500 text-xs">LLM Navigator is an AI visibility platform created by Convologix.</p>
            </div>

            <div className="flex items-center space-x-6 text-slate-400 text-sm">
              <a href="/" className="hover:text-white transition-colors">
                Home
              </a>
              <a href="/blog" className="hover:text-white transition-colors">
                Blog
              </a>
              <a href="#pricing" onClick={(e) => { e.preventDefault(); window.location.hash = '#pricing'; }} className="hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#privacy" onClick={(e) => { e.preventDefault(); window.location.hash = '#privacy'; }} className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#terms" onClick={(e) => { e.preventDefault(); window.location.hash = '#terms'; }} className="hover:text-white transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
