import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sortedArticles, type Article } from "@/site/data/articles";

let cache: Article[] | null = null;

const toArticle = (r: any): Article => ({
  slug: r.slug,
  title: r.title,
  excerpt: r.excerpt ?? "",
  category: r.category,
  publishedAt: r.published_at ?? r.created_at,
  readMinutes: r.read_minutes ?? 5,
  author: { name: "Clinexus Team", role: "Editorial" },
  cover: r.cover_url ?? undefined,
  body: Array.isArray(r.body) ? r.body : [],
});

/** Static articles merged with published AI articles, newest first. */
export function usePublishedArticles() {
  const [list, setList] = useState<Article[]>(() => cache ?? sortedArticles());
  const [loaded, setLoaded] = useState(!!cache);
  useEffect(() => {
    if (cache) return;
    (supabase as any)
      .from("blog_articles")
      .select("*")
      .eq("status", "published")
      .then(({ data }: any) => {
        const dynamic = (data ?? []).map(toArticle);
        const slugs = new Set(dynamic.map((a: Article) => a.slug));
        cache = [...dynamic, ...sortedArticles().filter((a) => !slugs.has(a.slug))].sort((a, b) =>
          b.publishedAt.localeCompare(a.publishedAt),
        );
        setList(cache);
        setLoaded(true);
      });
  }, []);
  return { articles: list, loaded };
}
