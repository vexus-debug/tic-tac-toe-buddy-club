import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Send, Loader2, FileText, Wand2, ImageIcon, Trash2, Eye, Plus, X, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { articleCategories, type ArticleBlock } from "@/site/data/articles";
import { brainstormBlog, extractBrief, generateArticleDraft, regenerateCover } from "@/lib/blogAi.functions";

type Msg = { role: "user" | "assistant"; content: string };
type Row = {
  id: string; slug: string; title: string; excerpt: string; category: string; body: ArticleBlock[];
  cover_url: string | null; read_minutes: number; status: string; published_at: string | null; created_at: string;
};

const CHAT_KEY = "clinexus-blog-studio-chat";
const token = async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Please sign in again");
  return data.session.access_token;
};
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

function Autopilot() {
  const qc = useQueryClient();
  const { data: s } = useQuery({
    queryKey: ["blog-autopilot"],
    queryFn: async () => (await (supabase as any).from("blog_autopilot").select("*").eq("id", 1).maybeSingle()).data,
  });
  if (!s) return null;
  const url = `${window.location.origin}/api/public/blog-autopilot?secret=${s.cron_token}`;
  const save = async (patch: Record<string, unknown>) => {
    const { error } = await (supabase as any).from("blog_autopilot").update(patch).eq("id", 1);
    if (error) toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["blog-autopilot"] });
  };
  return (
    <Card>
      <CardContent className="space-y-3 p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold">Daily autopilot {s.enabled ? <Badge>On</Badge> : <Badge variant="secondary">Off</Badge>}</p>
            <p className="text-muted-foreground">Writes and publishes one article per category every day, with photos.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => save({ enabled: !s.enabled })}>{s.enabled ? "Turn off" : "Turn on"}</Button>
        </div>
        {s.paused_reason && (
          <div className="flex items-center justify-between gap-2 rounded-md bg-destructive/10 p-2 text-destructive">
            <span>Paused: {s.paused_reason}</span>
            <Button size="sm" variant="outline" onClick={() => save({ paused_reason: null })}>Resume</Button>
          </div>
        )}
        {s.last_run_at && <p className="text-muted-foreground">Last run {format(new Date(s.last_run_at), "PPp")}: {s.last_result}</p>}
        <div>
          <Label>Scheduler link — set a free scheduler (e.g. cron-job.org) to open this every hour</Label>
          <div className="mt-1 flex gap-2">
            <Input readOnly value={url} className="font-mono text-xs" />
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(url); toast({ title: "Copied" }); }}>Copy</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminArticles() {
  const [tab, setTab] = useState("studio");
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Blog Studio</h1>
        <p className="text-sm text-muted-foreground">Brainstorm ideas with Clinexus AI, generate drafts with cover images, review and publish.</p>
      </div>
      <Autopilot />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="studio">Idea chat</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
        </TabsList>
        <TabsContent value="studio" className="mt-4">
          <Studio onGenerated={(id) => { setTab("articles"); setEditing(id); }} />
        </TabsContent>
        <TabsContent value="articles" className="mt-4">
          <ArticleList onEdit={setEditing} />
        </TabsContent>
      </Tabs>
      {editing && <Editor id={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function Studio({ onGenerated }: { onGenerated: (id: string) => void }) {
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [brief, setBrief] = useState("");
  const [category, setCategory] = useState<string>("auto");
  const [preparing, setPreparing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { const s = localStorage.getItem(CHAT_KEY); if (s) setMessages(JSON.parse(s)); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next); setInput(""); setThinking(true);
    try {
      const res = await brainstormBlog({ data: { token: await token(), messages: next.slice(-40) } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch (e) {
      toast({ title: "AI couldn't reply", description: errMsg(e), variant: "destructive" });
    } finally { setThinking(false); }
  };

  const openBrief = async () => {
    setBriefOpen(true);
    if (!messages.length) { setBrief(""); return; }
    setPreparing(true);
    try {
      const res = await extractBrief({ data: { token: await token(), messages: messages.slice(-40) } });
      setBrief(res.brief);
    } catch (e) {
      toast({ title: "Couldn't summarise the idea", description: errMsg(e), variant: "destructive" });
    } finally { setPreparing(false); }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await generateArticleDraft({
        data: { token: await token(), brief, category: category === "auto" ? null : (category as any) },
      });
      toast({ title: "Draft ready", description: res.coverFailed ? "The cover image couldn't be made — you can retry it in the editor." : "Review it before publishing." });
      qc.invalidateQueries({ queryKey: ["blog-articles"] });
      setBriefOpen(false);
      onGenerated(res.id);
    } catch (e) {
      toast({ title: "Generation failed", description: errMsg(e), variant: "destructive" });
    } finally { setGenerating(false); }
  };

  return (
    <Card>
      <CardContent className="flex h-[70dvh] flex-col p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium"><PenLine className="h-4 w-4 text-primary" /> Clinexus content strategist</div>
          <div className="flex gap-2">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setMessages([])}>New chat</Button>
            )}
            <Button size="sm" onClick={openBrief} disabled={thinking}><Wand2 className="mr-1.5 h-4 w-4" /> Generate draft</Button>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="mx-auto max-w-md pt-10 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Start with a direction</p>
              <p className="mt-1">Try: "Give me 5 article ideas for eye clinic owners in Lagos" or "Let's plan a post on reducing dental no-shows".</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
              <div className={m.role === "user"
                ? "max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground"
                : "max-w-[90%] whitespace-pre-wrap text-sm leading-relaxed text-foreground"}>
                {m.content}
              </div>
            </div>
          ))}
          {thinking && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</div>}
          <div ref={endRef} />
        </div>
        <div className="flex gap-2 border-t p-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Discuss blog ideas…"
            className="min-h-[44px] resize-none text-base md:text-sm"
            rows={1}
          />
          <Button onClick={send} disabled={!input.trim() || thinking} size="icon" className="h-11 w-11 shrink-0" aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      <Dialog open={briefOpen} onOpenChange={(o) => !generating && setBriefOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Generate article draft</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Agreed brief</Label>
              {preparing ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Summarising your chat…</div>
              ) : (
                <Textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={6} className="mt-2" placeholder="Describe the article you want…" />
              )}
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Let AI choose</SelectItem>
                  {articleCategories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {generating && <p className="text-sm text-muted-foreground">Writing the article and creating a cover image — this can take a minute or two.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBriefOpen(false)} disabled={generating}>Cancel</Button>
            <Button onClick={generate} disabled={generating || preparing || brief.trim().length < 10}>
              {generating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Wand2 className="mr-1.5 h-4 w-4" />}
              {generating ? "Generating…" : "Generate draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ArticleList({ onEdit }: { onEdit: (id: string) => void }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["blog-articles"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("blog_articles")
        .select("id,slug,title,excerpt,category,cover_url,status,published_at,created_at,read_minutes")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Row[];
    },
  });
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data.length) return (
    <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
      <FileText className="mx-auto mb-2 h-6 w-6" /> No AI articles yet. Use the idea chat to create your first draft.
    </CardContent></Card>
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((a) => (
        <button key={a.id} onClick={() => onEdit(a.id)} className="overflow-hidden rounded-lg border bg-card text-left transition-colors hover:border-primary/50">
          <div className="aspect-[16/9] bg-muted">
            {a.cover_url ? <img src={a.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" /> :
              <div className="flex h-full items-center justify-center text-muted-foreground"><ImageIcon className="h-6 w-6" /></div>}
          </div>
          <div className="space-y-2 p-4">
            <div className="flex items-center gap-2">
              <Badge variant={a.status === "published" ? "default" : "secondary"}>{a.status === "published" ? "Published" : "Draft"}</Badge>
              <span className="text-xs text-muted-foreground">{articleCategories.find((c) => c.slug === a.category)?.name}</span>
            </div>
            <p className="line-clamp-2 font-semibold leading-snug">{a.title}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "d MMM yyyy")} · {a.read_minutes} min read</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function Editor({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [a, setA] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgBusy, setImgBusy] = useState(false);

  useEffect(() => {
    (supabase as any).from("blog_articles").select("*").eq("id", id).single().then(({ data }: any) => {
      setA(data); setImgPrompt(data ? `Cover for an article titled "${data.title}"` : "");
    });
  }, [id]);

  const setBlock = (i: number, b: ArticleBlock) => a && setA({ ...a, body: a.body.map((x, j) => (j === i ? b : x)) });
  const removeBlock = (i: number) => a && setA({ ...a, body: a.body.filter((_, j) => j !== i) });
  const addBlock = () => a && setA({ ...a, body: [...a.body, { type: "p", text: "" }] });

  const save = async (status?: "draft" | "published") => {
    if (!a) return;
    setSaving(true);
    const words = a.body.map((b: any) => (b.items ? b.items.join(" ") : b.text ?? "")).join(" ").split(/\s+/).length;
    const patch: any = {
      title: a.title, excerpt: a.excerpt, category: a.category, body: a.body,
      read_minutes: Math.max(2, Math.round(words / 220)),
    };
    if (status) {
      patch.status = status;
      if (status === "published" && !a.published_at) patch.published_at = new Date().toISOString();
    }
    const { error } = await (supabase as any).from("blog_articles").update(patch).eq("id", a.id);
    setSaving(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    toast({ title: status === "published" ? "Published to the blog" : status === "draft" ? "Moved back to draft" : "Saved" });
    qc.invalidateQueries({ queryKey: ["blog-articles"] });
    setA({ ...a, ...patch });
  };

  const remove = async () => {
    if (!a || !confirm("Delete this article permanently?")) return;
    await (supabase as any).from("blog_articles").delete().eq("id", a.id);
    qc.invalidateQueries({ queryKey: ["blog-articles"] });
    onClose();
  };

  const newCover = async () => {
    if (!a) return;
    setImgBusy(true);
    try {
      const res = await regenerateCover({ data: { token: await token(), id: a.id, prompt: imgPrompt } });
      setA({ ...a, cover_url: res.coverUrl });
      qc.invalidateQueries({ queryKey: ["blog-articles"] });
    } catch (e) {
      toast({ title: "Image failed", description: errMsg(e), variant: "destructive" });
    } finally { setImgBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Review article {a && <Badge variant={a.status === "published" ? "default" : "secondary"}>{a.status === "published" ? "Published" : "Draft"}</Badge>}
          </DialogTitle>
        </DialogHeader>
        {!a ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="aspect-[16/8] overflow-hidden rounded-md border bg-muted">
                {a.cover_url ? <img src={a.cover_url} alt="" className="h-full w-full object-cover" /> :
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No cover yet</div>}
              </div>
              <div className="flex gap-2">
                <Input value={imgPrompt} onChange={(e) => setImgPrompt(e.target.value)} placeholder="Describe the cover image" />
                <Button variant="outline" onClick={newCover} disabled={imgBusy || imgPrompt.trim().length < 5} className="shrink-0">
                  {imgBusy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-1.5 h-4 w-4" />} New image
                </Button>
              </div>
            </div>
            <div><Label>Title</Label><Input className="mt-1.5" value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} /></div>
            <div><Label>Excerpt</Label><Textarea className="mt-1.5" rows={2} value={a.excerpt} onChange={(e) => setA({ ...a, excerpt: e.target.value })} /></div>
            <div>
              <Label>Category</Label>
              <Select value={a.category} onValueChange={(v) => setA({ ...a, category: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{articleCategories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Content</Label>
              {a.body.map((b, i) => (
                <div key={i} className="rounded-md border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Select value={b.type} onValueChange={(t) => setBlock(i, t === "list"
                      ? { type: "list", items: "items" in b ? b.items : [("text" in b ? b.text : "")] }
                      : { type: t as any, text: "items" in b ? b.items.join("\n") : ("text" in b ? b.text : "") } as ArticleBlock)}>
                      <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="p">Paragraph</SelectItem>
                        <SelectItem value="h2">Heading</SelectItem>
                        <SelectItem value="h3">Subheading</SelectItem>
                        <SelectItem value="list">Bullet list</SelectItem>
                        <SelectItem value="tip">Tip box</SelectItem>
                        <SelectItem value="quote">Quote</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeBlock(i)} aria-label="Remove block"><X className="h-4 w-4" /></Button>
                  </div>
                  {b.type === "list" ? (
                    <Textarea rows={Math.max(3, b.items.length)} value={b.items.join("\n")} placeholder="One item per line"
                      onChange={(e) => setBlock(i, { type: "list", items: e.target.value.split("\n") })} />
                  ) : "text" in b ? (
                    <Textarea rows={b.type === "p" ? 4 : 1} value={b.text}
                      onChange={(e) => setBlock(i, { ...b, text: e.target.value } as ArticleBlock)} />
                  ) : null}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addBlock}><Plus className="mr-1.5 h-4 w-4" /> Add block</Button>
            </div>
          </div>
        )}
        {a && (
          <DialogFooter className="flex-wrap gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button variant="ghost" className="text-destructive" onClick={remove}><Trash2 className="mr-1.5 h-4 w-4" /> Delete</Button>
              {a.status === "published" && (
                <Button variant="ghost" asChild><a href={`/articles/${a.slug}`} target="_blank" rel="noreferrer"><Eye className="mr-1.5 h-4 w-4" /> View live</a></Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => save()} disabled={saving}>Save</Button>
              {a.status === "published"
                ? <Button variant="outline" onClick={() => save("draft")} disabled={saving}>Unpublish</Button>
                : <Button onClick={() => save("published")} disabled={saving}>Publish</Button>}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
