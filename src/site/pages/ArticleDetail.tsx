import HeroBackdrop from "@/site/components/HeroBackdrop";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/site/components/Layout";
import { formatArticleDate, getArticle, getCategory, type ArticleBlock } from "@/site/data/articles";
import { usePublishedArticles } from "@/site/data/usePublishedArticles";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const Cta = ({ compact }: { compact?: boolean }) => (
  <aside className={`not-prose rounded-lg border border-primary/30 bg-primary/10 ${compact ? "my-10 p-5" : "mt-14 p-7"}`}>
    <p className={`font-semibold text-foreground ${compact ? "text-lg" : "text-2xl"}`}>
      {compact ? "Want this running in your clinic this week?" : "Ready to run a calmer, more profitable clinic?"}
    </p>
    <p className="mt-2 text-muted-foreground">
      {compact
        ? "Clinexus handles appointments, records, billing and stock in one place."
        : "Join clinics using Clinexus to manage patients, payments, labs and staff — set up in minutes."}
    </p>
    <div className="mt-4 flex flex-wrap gap-3">
      <a href="/app/signup" className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Start free</a>
      {!compact && <Link to="/contact" className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">Talk to us</Link>}
    </div>
  </aside>
);

const Block = ({ block }: { block: ArticleBlock }) => {
  switch (block.type) {
    case "h2":
      return <h2 id={slugify(block.text)} className="mt-12 scroll-mt-28 text-2xl font-semibold tracking-tight">{block.text}</h2>;
    case "h3":
      return <h3 className="mt-8 text-lg font-semibold">{block.text}</h3>;
    case "list":
      return <ul className="mt-5 list-disc space-y-2 pl-5">{block.items.map((i) => <li key={i}>{i}</li>)}</ul>;
    case "quote":
      return (
        <blockquote className="my-10 border-l-2 border-primary pl-6 font-serif text-2xl italic leading-snug text-foreground">
          {block.text}
          {block.cite && <cite className="mt-3 block font-sans text-sm not-italic text-muted-foreground">{block.cite}</cite>}
        </blockquote>
      );
    case "tip":
      return (
        <aside className="my-8 rounded-md border border-primary/30 bg-primary/5 p-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-primary">{block.title ?? "In practice"}</p>
          <p className="mt-2 text-foreground">{block.text}</p>
        </aside>
      );
    case "image":
      return (
        <figure className="my-10">
          <img src={block.src} alt={block.alt} loading="lazy" className="w-full rounded-md border border-border/70" />
          {block.caption && <figcaption className="mt-2 text-sm text-muted-foreground">{block.caption}</figcaption>}
        </figure>
      );
    default:
      return <p className="mt-5">{block.text}</p>;
  }
};

const ArticleDetail = () => {
  const { slug } = useParams();
  const { articles: all, loaded } = usePublishedArticles();
  const article = getArticle(slug) ?? all.find((a) => a.slug === slug);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? Math.min(1, window.scrollY / h) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (article) document.title = `${article.title} | Clinexus Articles`;
  }, [article]);

  if (!article) return loaded ? <Navigate to="/articles" replace /> : <Layout><div className="min-h-screen" /></Layout>;
  const category = getCategory(article.category);
  const toc = article.body.filter((b): b is Extract<ArticleBlock, { type: "h2" }> => b.type === "h2");
  const related = all
    .filter((a) => a.slug !== article.slug)
    .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category))
    .slice(0, 3);

  return (
    <Layout>
      <div className="fixed left-0 top-0 z-50 h-0.5 bg-primary" style={{ width: `${progress * 100}%` }} />
      <article className="pb-20">
        <div className="relative overflow-hidden bg-[hsl(var(--medical-blue-dark))] pb-16 pt-32 md:pb-20 md:pt-40">
        <HeroBackdrop />
        <header className="container relative z-10 max-w-3xl">
          <Link to="/articles" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All articles
          </Link>
          <p className="mt-8 text-[0.7rem] font-semibold uppercase tracking-[0.14em]">
            <Link to={`/articles/category/${article.category}`} className="text-primary">{category?.name}</Link>
            <span className="mx-2 text-white/40">·</span>
            <span className="text-white/50">{article.readMinutes} min read</span>
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-5xl">{article.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-white/60">{article.excerpt}</p>
          <p className="mt-6 border-t border-white/10 pt-4 text-sm text-white/50">
            <span className="font-medium text-white">{article.author.name}</span>, {article.author.role} · {formatArticleDate(article.publishedAt)}
          </p>
        </header>
        </div>

        {article.cover && (
          <div className="container mt-10 max-w-5xl">
            <img src={article.cover} alt="" className="aspect-[16/8] w-full rounded-md border border-border/70 object-cover" />
          </div>
        )}

        <div className="container mt-12 grid max-w-5xl gap-12 lg:grid-cols-[1fr_200px]">
          <div className="max-w-[68ch] text-[1.05rem] leading-[1.75] text-foreground/85">
            {article.body.map((b, i) => (
              <div key={i}>
                {b.type === "h2" && i > 0 && b === toc[Math.floor(toc.length / 2)] && <Cta compact />}
                <Block block={b} />
              </div>
            ))}
            <Cta />
          </div>
          {toc.length > 1 && (
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">On this page</p>
                <ul className="mt-3 space-y-2 border-l border-border pl-4 text-sm">
                  {toc.map((h) => (
                    <li key={h.text}><a href={`#${slugify(h.text)}`} className="text-muted-foreground hover:text-foreground">{h.text}</a></li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-border/70 py-16">
          <div className="container max-w-5xl">
            <h2 className="text-xl font-semibold tracking-tight">Keep reading</h2>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {related.map((a) => (
                <Link key={a.slug} to={`/articles/${a.slug}`} className="group">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-primary">{getCategory(a.category)?.name}</p>
                  <h3 className="mt-2 font-semibold leading-snug group-hover:text-primary">{a.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">{a.readMinutes} min read</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default ArticleDetail;
