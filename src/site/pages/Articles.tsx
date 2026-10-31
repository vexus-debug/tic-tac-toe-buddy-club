import HeroBackdrop from "@/site/components/HeroBackdrop";
import { useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Search } from "lucide-react";
import Layout from "@/site/components/Layout";
import {
  articleCategories,
  formatArticleDate,
  getCategory,
  sortedArticles,
  type Article,
} from "@/site/data/articles";
import { cn } from "@/lib/utils";
import { usePublishedArticles } from "@/site/data/usePublishedArticles";

const Meta = ({ article }: { article: Article }) => (
  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
    <span className="text-primary">{getCategory(article.category)?.name}</span>
    <span className="mx-2">·</span>
    {article.readMinutes} min read
  </p>
);

const ArticleCard = ({ article }: { article: Article }) => (
  <Link to={`/articles/${article.slug}`} className="group flex flex-col">
    <div className="aspect-[16/10] overflow-hidden rounded-md border border-border/70 bg-muted">
      {article.cover && (
        <img src={article.cover} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      )}
    </div>
    <div className="mt-4">
      <Meta article={article} />
      <h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight group-hover:text-primary">{article.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
      <p className="mt-3 text-xs text-muted-foreground">
        {article.author.name} · {formatArticleDate(article.publishedAt)}
      </p>
    </div>
  </Link>
);

const Articles = () => {
  const { category: categoryParam } = useParams();
  const category = getCategory(categoryParam);
  const [query, setQuery] = useState("");

  const { articles: all } = usePublishedArticles();
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      (a) =>
        (!category || a.category === category.slug) &&
        (!q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)),
    );
  }, [all, category, query]);

  if (categoryParam && !category) return <Navigate to="/articles" replace />;

  const showLead = !query && filtered.length > 0;
  const lead = showLead ? filtered.find((a) => a.featured) ?? filtered[0] : undefined;
  const rest = filtered.filter((a) => a !== lead);

  const pill = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
      active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
    );

  return (
    <Layout>
      <section className="relative overflow-hidden bg-[hsl(var(--medical-blue-dark))] pb-16 pt-32 md:pb-20 md:pt-40">
        <HeroBackdrop />
        <div className="container relative z-10 max-w-6xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/50">Clinexus Articles</p>
          <div className="mt-4 grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-end">
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
              {category ? category.name : <>Notes on running a <em className="font-serif font-normal">better</em> clinic</>}
            </h1>
            <p className="text-base leading-relaxed text-white/60">
              {category?.description ??
                "Practical writing on practice management, patient marketing and the specialties we serve: dental, eye care and laboratory."}
            </p>
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="container flex max-w-6xl items-center gap-4 py-3">
          <nav className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 [scrollbar-width:none]" aria-label="Article categories">
            <Link to="/articles" className={pill(!category)}>All</Link>
            {articleCategories.map((c) => (
              <Link key={c.slug} to={`/articles/category/${c.slug}`} className={pill(category?.slug === c.slug)}>
                {c.name}
              </Link>
            ))}
          </nav>
          <label className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles"
              className="h-9 w-56 rounded-full border border-border bg-transparent pl-9 pr-3 text-sm outline-none focus:border-foreground/40"
            />
          </label>
        </div>
      </div>

      <section className="py-12 md:py-16">
        <div className="container max-w-6xl">
          {lead && (
            <Link to={`/articles/${lead.slug}`} className="group mb-16 grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-center">
              <div className="aspect-[16/10] overflow-hidden rounded-md border border-border/70 bg-muted">
                {lead.cover && <img src={lead.cover} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />}
              </div>
              <div>
                <Meta article={lead} />
                <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight md:text-4xl group-hover:text-primary">{lead.title}</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">{lead.excerpt}</p>
                <p className="mt-5 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{lead.author.name}</span>, {lead.author.role} · {formatArticleDate(lead.publishedAt)}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          )}

          {rest.length > 0 && (
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((a) => <ArticleCard key={a.slug} article={a} />)}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="rounded-md border border-dashed border-border px-6 py-16 text-center">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {query ? "No matches" : "Coming soon"}
              </p>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                {query
                  ? `Nothing matches "${query}" yet. Try another word.`
                  : `We're writing the first ${category ? category.name.toLowerCase() : ""} articles. Check back shortly.`}
              </p>
            </div>
          )}

          {!category && (
            <div className="mt-20 grid gap-px overflow-hidden rounded-md border border-border/70 bg-border/70 md:grid-cols-3">
              {articleCategories.map((c) => {
                const count = all.filter((a) => a.category === c.slug).length;
                return (
                  <Link key={c.slug} to={`/articles/category/${c.slug}`} className="group bg-card p-6 transition-colors hover:bg-muted/40">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {c.group} · {count} {count === 1 ? "article" : "articles"}
                    </p>
                    <h3 className="mt-2 flex items-center justify-between font-semibold">
                      {c.name}
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Articles;
