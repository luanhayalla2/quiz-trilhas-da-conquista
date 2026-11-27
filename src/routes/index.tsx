import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { generateQuiz } from "@/lib/ai-quiz.functions";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, type CategoryId, type Question } from "@/lib/questions";
import {
  ACHIEVEMENTS, DIFF_LABEL, MODES, applyMatch, buildQuestions, classify, emptyProfile, levelFor,
  loadStore, parseAnswer, percentOf, pointsFor, ranking, rewards, saveStore,
  type Letter, type MatchRecord, type Mode, type Store,
} from "@/lib/quiz";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dart Quiz Universe — Conhecimento é poder" },
      { name: "description", content: "Quiz com 8 categorias, 5 modos de jogo, XP, moedas, conquistas e ranking." },
      { property: "og:title", content: "Dart Quiz Universe" },
      { property: "og:description", content: "Conhecimento é poder. Cada pergunta é um novo desafio!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Screen = "menu" | "play" | "result" | "ranking";
interface Game {
  mode: Mode; category: CategoryId; players: string[]; questions: Question[];
  index: number; scores: { correct: number; points: number; streak: number; maxStreak: number }[];
  feedback: { chosen: Letter; ok: boolean } | null; over: boolean; ai: boolean;
}

const track = (e: string, p: Record<string, unknown>) => window.__lovableEvents?.track?.(e, p);
const gameProps = (g: Game) => ({ mode: g.mode, category: g.ai ? "ia" : g.mode === "aleatorio" ? "aleatorio" : g.category });
interface Outcome { records: MatchRecord[]; unlocked: Record<string, string[]> }

const LETTERS: Letter[] = ["A", "B", "C", "D"];

function Index() {
  const [store, setStore] = useState<Store>({ profiles: {}, history: [] });
  useEffect(() => setStore(loadStore()), []);
  const [screen, setScreen] = useState<Screen>("menu");
  const [name, setName] = useState("");
  const [name2, setName2] = useState("");
  const [mode, setMode] = useState<Mode>("classico");
  const [category, setCategory] = useState<CategoryId>("gamer");
  const [game, setGame] = useState<Game | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [err, setErr] = useState("");
  const [typed, setTyped] = useState("");

  const [theme, setTheme] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const genQuiz = useServerFn(generateQuiz);

  const begin = (questions: Question[], ai: boolean) => {
    const players = [name.trim(), ...(mode === "duelo" ? [name2.trim()] : [])];
    const g: Game = {
      mode, category, players, questions, index: 0,
      scores: players.map(() => ({ correct: 0, points: 0, streak: 0, maxStreak: 0 })), feedback: null, over: false, ai,
    };
    setGame(g); setScreen("play");
    track("project.match_started", { ...gameProps(g), players_count: players.length, questions_count: questions.length });
  };

  const startAi = async () => {
    if (!name.trim() || (mode === "duelo" && !name2.trim())) return setErr("> ERRO: informe o nome do jogador.");
    if (theme.trim().length < 2) return setErr("> ERRO: informe um tema com ao menos 2 letras.");
    setErr(""); setAiLoading(true);
    try {
      const r = await genQuiz({ data: { theme } });
      if (r.error || !r.questions.length) return setErr("> " + (r.error ?? "Falha ao gerar."));
      begin(r.questions, true);
    } catch { setErr("> Não foi possível gerar o quiz."); } finally { setAiLoading(false); }
  };

  const goMenu = () => {
    if (screen === "play" && game) track("project.match_abandoned", { ...gameProps(game), answered: game.index + (game.feedback ? 1 : 0) });
    setScreen("menu");
  };

  useEffect(() => {
    if (screen !== "play" || !game) return;
    const h = () => track("project.match_abandoned", { ...gameProps(game), answered: game.index + (game.feedback ? 1 : 0) });
    window.addEventListener("pagehide", h);
    return () => window.removeEventListener("pagehide", h);
  }, [screen, game]);

  const start = () => {
    const players = [name.trim(), ...(mode === "duelo" ? [name2.trim()] : [])];
    if (players.some((p) => !p)) return setErr("> ERRO: informe o nome do jogador.");
    setErr("");
    begin(buildQuestions(category, mode), false);
  };

  const answer = (raw: string) => {
    if (!game || game.feedback) return;
    const letter = parseAnswer(raw);
    if (!letter) return setErr("> Resposta inválida. Digite A, B, C ou D.");
    setErr(""); setTyped("");
    const q = game.questions[game.index]!;
    const pi = game.mode === "duelo" ? game.index % 2 : 0;
    const ok = letter === q.answer;
    const scores = game.scores.map((s, i) => {
      if (i !== pi) return s;
      const streak = ok ? s.streak + 1 : 0;
      return { correct: s.correct + (ok ? 1 : 0), points: s.points + (ok ? pointsFor(q, game.mode) : 0), streak, maxStreak: Math.max(s.maxStreak, streak) };
    });
    setGame({ ...game, scores, feedback: { chosen: letter, ok }, over: game.mode === "sobrevivencia" && !ok });
  };

  const next = () => {
    if (!game) return;
    const last = game.over || game.index + 1 >= game.questions.length;
    if (!last) return setGame({ ...game, index: game.index + 1, feedback: null });
    finish(game);
  };

  const finish = (g: Game) => {
    const answered = g.index + 1;
    const date = new Date().toISOString();
    const s: Store = { profiles: { ...store.profiles }, history: [...store.history] };
    const records: MatchRecord[] = []; const unlocked: Record<string, string[]> = {};
    g.players.forEach((p, i) => {
      const sc = g.scores[i]!;
      const total = g.mode === "duelo" ? Math.ceil((answered - i) / 2) : answered;
      const rec: MatchRecord = { player: p, category: g.category, mode: g.mode, correct: sc.correct, total, points: sc.points, maxStreak: sc.maxStreak, date };
      const key = p.toLowerCase();
      const r = applyMatch(s.profiles[key] ?? emptyProfile(p), rec);
      s.profiles[key] = r.profile; s.history.unshift(rec); records.push(rec); unlocked[p] = r.unlocked;
    });
    s.history = s.history.slice(0, 100);
    records.forEach((rec, i) => track("project.match_completed", { ...gameProps(g), player_slot: i + 1, correct: rec.correct, wrong: rec.total - rec.correct, total: rec.total, points: rec.points, max_streak: rec.maxStreak }));
    setStore(s); saveStore(s); setOutcome({ records, unlocked }); setScreen("result");
  };

  useEffect(() => {
    if (screen !== "play") return;
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (game?.feedback && e.key === "Enter") return next();
      if (/^[a-dA-D]$/.test(e.key)) answer(e.key);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const profile = store.profiles[name.trim().toLowerCase()];

  return (
    <main className="crt min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6 border-b border-border pb-4">
          <button onClick={goMenu} className="text-left">
            <h1 className="font-display text-5xl leading-none text-primary glow-text sm:text-6xl">DART QUIZ UNIVERSE</h1>
          </button>
          <p className="mt-1 text-sm text-secondary">"Conhecimento é poder. Cada pergunta é um novo desafio!"</p>
        </header>

        {screen === "menu" && (
          <section className="rise space-y-6">
            <Panel title="1. Identificação">
              <label className="block text-sm text-muted-foreground">$ nome do jogador</label>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="Digite seu nome"
                className="mt-1 w-full border border-input bg-muted px-3 py-2 text-primary outline-none focus:border-primary" />
              {mode === "duelo" && (
                <input value={name2} onChange={(e) => setName2(e.target.value)} maxLength={20} placeholder="Nome do jogador 2"
                  className="mt-2 w-full border border-input bg-muted px-3 py-2 text-accent outline-none focus:border-accent" />
              )}
              {profile && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Nível {levelFor(profile.xp).level} · {profile.xp} XP · 🪙 {profile.coins} · {profile.games} partidas
                </p>
              )}
            </Panel>

            <Panel title="2. Modo de jogo">
              <div className="grid gap-2 sm:grid-cols-2">
                {MODES.map((m) => (
                  <Choice key={m.id} active={mode === m.id} onClick={() => setMode(m.id)}>
                    <span className="font-semibold">{m.icon} {m.name}</span>
                    <span className="block text-xs text-muted-foreground">{m.desc}</span>
                  </Choice>
                ))}
              </div>
            </Panel>

            {mode !== "aleatorio" && (
              <Panel title="3. Categoria">
                <div className="grid gap-2 sm:grid-cols-2">
                  {CATEGORIES.map((c) => (
                    <Choice key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                      <span className="font-semibold">{c.icon} {c.name}</span>
                      <span className="block text-xs text-muted-foreground">{c.tagline}</span>
                    </Choice>
                  ))}
                </div>
              </Panel>
            )}

            <Panel title="✨ Quiz personalizado com IA">
              <label className="block text-sm text-muted-foreground">$ tema ou interesse (usa o modo escolhido acima)</label>
              <div className="mt-1 flex flex-wrap gap-2">
                <input value={theme} onChange={(e) => setTheme(e.target.value)} maxLength={80} placeholder="Ex.: Pokémon, Egito Antigo, Fórmula 1"
                  className="min-w-0 flex-1 border border-input bg-muted px-3 py-2 text-primary outline-none focus:border-primary" />
                <button onClick={startAi} disabled={aiLoading} className="border border-accent px-4 py-2 text-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-50">
                  {aiLoading ? "Gerando..." : "Gerar e jogar"}
                </button>
              </div>
            </Panel>

            {err && <p className="text-destructive">{err}</p>}
            <div className="flex flex-wrap gap-3">
              <button onClick={start} className="bg-primary px-6 py-3 font-bold text-primary-foreground shadow-glow hover:brightness-110">▶ INICIAR</button>
              <button onClick={() => setScreen("ranking")} className="border border-secondary px-6 py-3 text-secondary hover:bg-secondary hover:text-secondary-foreground">🏆 Ranking e estatísticas</button>
            </div>
          </section>
        )}

        {screen === "play" && game && (() => {
          const q = game.questions[game.index]!;
          const pi = game.mode === "duelo" ? game.index % 2 : 0;
          const cat = CATEGORIES.find((c) => c.id === q.category)!;
          return (
            <section key={game.index} className="rise space-y-4">
              <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                <span>{MODES.find((m) => m.id === game.mode)!.name} · {game.ai ? "✨ IA" : `${cat.icon} ${cat.name}`} · {DIFF_LABEL[q.difficulty]} (+{pointsFor(q, game.mode)})</span>
                <span>Pergunta {game.index + 1}{game.mode === "sobrevivencia" ? "" : `/${game.questions.length}`}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {game.players.map((p, i) => (
                  <div key={p + i} className={`border px-3 py-1 text-sm ${i === pi ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
                    {p}: {game.scores[i]!.points} pts · 🔥{game.scores[i]!.streak}
                  </div>
                ))}
              </div>
              {game.mode === "duelo" && <p className="text-accent">Vez de {game.players[pi]}</p>}
              <h2 className="text-xl font-semibold leading-snug">{q.text}</h2>
              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const L = LETTERS[i]!;
                  const fb = game.feedback;
                  const cls = !fb ? "border-border hover:border-primary hover:text-primary"
                    : L === q.answer ? "border-primary bg-primary text-primary-foreground"
                    : L === fb.chosen ? "border-destructive bg-destructive text-destructive-foreground" : "border-border opacity-50";
                  return (
                    <button key={L} disabled={!!fb} onClick={() => answer(L)} className={`flex w-full gap-3 border px-4 py-3 text-left transition ${cls}`}>
                      <span className="font-bold">[{L}]</span><span>{opt}</span>
                    </button>
                  );
                })}
              </div>
              {!game.feedback ? (
                <form onSubmit={(e) => { e.preventDefault(); answer(typed); }} className="flex items-center gap-2 text-sm">
                  <span className="text-primary">&gt;</span>
                  <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="ou digite a letra e Enter"
                    className="flex-1 border-b border-input bg-transparent py-1 outline-none focus:border-primary" />
                </form>
              ) : (
                <div className="space-y-3">
                  <p className={game.feedback.ok ? "text-primary" : "text-destructive"}>
                    {game.feedback.ok ? "✔ Correto!" : `✘ Errado! A resposta correta era ${q.answer}) ${q.options[LETTERS.indexOf(q.answer)]}`}
                  </p>
                  <button onClick={next} className="bg-primary px-5 py-2 font-bold text-primary-foreground">
                    {game.over || game.index + 1 >= game.questions.length ? "Ver resultado" : "Próxima ↵"}
                  </button>
                </div>
              )}
              {err && <p className="text-destructive">{err}</p>}
            </section>
          );
        })()}

        {screen === "result" && outcome && (
          <section className="rise space-y-4">
            {outcome.records.length > 1 && (() => {
              const [a, b] = outcome.records;
              const w = a!.points === b!.points ? "Empate!" : `${(a!.points > b!.points ? a : b)!.player} venceu o duelo!`;
              return <p className="font-display text-4xl text-secondary">⚔ {w}</p>;
            })()}
            {outcome.records.map((r) => {
              const pct = percentOf(r.correct, r.total);
              const c = classify(pct);
              const rw = rewards(r.points, r.correct, r.maxStreak);
              const pr = store.profiles[r.player.toLowerCase()]!;
              return (
                <Panel key={r.player} title={`Resultado de ${r.player}`}>
                  <p className="font-display text-4xl text-primary glow-text">{c.title}</p>
                  <p className="text-muted-foreground">{c.message}</p>
                  <ul className="mt-3 grid grid-cols-2 gap-1 text-sm sm:grid-cols-3">
                    <li>✔ Acertos: {r.correct}</li><li>✘ Erros: {r.total - r.correct}</li><li>📊 {pct}%</li>
                    <li>⭐ Pontos: {r.points}</li><li>🔥 Sequência: {r.maxStreak}</li><li>+{rw.xp} XP · +{rw.coins} 🪙</li>
                  </ul>
                  <p className="mt-2 text-xs text-accent">Nível {levelFor(pr.xp).level} — {levelFor(pr.xp).current}/200 XP</p>
                  {outcome.unlocked[r.player]!.map((id) => (
                    <p key={id} className="mt-1 text-secondary">🏅 Conquista: {ACHIEVEMENTS.find((a) => a.id === id)!.name}</p>
                  ))}
                </Panel>
              );
            })}
            <div className="flex gap-3">
              <button onClick={start} className="bg-primary px-5 py-2 font-bold text-primary-foreground">Jogar de novo</button>
              <button onClick={() => setScreen("menu")} className="border border-border px-5 py-2">Menu</button>
            </div>
          </section>
        )}

        {screen === "ranking" && <RankingView store={store} />}
      </div>
    </main>
  );
}

function RankingView({ store }: { store: Store }) {
  const top = useMemo(() => ranking(store.history), [store]);
  const profiles = Object.values(store.profiles).sort((a, b) => b.xp - a.xp);
  return (
    <section className="rise space-y-6">
      <Panel title="🏆 Ranking (melhores partidas)">
        {top.length === 0 ? <p className="text-muted-foreground">Nenhuma partida ainda.</p> : (
          <ol className="space-y-1 text-sm">
            {top.map((r, i) => (
              <li key={i} className="flex justify-between gap-2"><span>{String(i + 1).padStart(2, "0")}. {r.player} <span className="text-muted-foreground">· {MODES.find((m) => m.id === r.mode)?.name} · {CATEGORIES.find((c) => c.id === r.category)?.name}</span></span><span className="text-primary">{r.points} pts</span></li>
            ))}
          </ol>
        )}
      </Panel>
      <Panel title="📈 Estatísticas dos jogadores">
        {profiles.length === 0 ? <p className="text-muted-foreground">Sem jogadores.</p> : profiles.map((p) => (
          <div key={p.name} className="border-b border-border py-2 text-sm last:border-0">
            <p className="font-semibold text-primary">{p.name} — Nível {levelFor(p.xp).level}</p>
            <p className="text-muted-foreground">{p.xp} XP · 🪙 {p.coins} · {p.games} partidas · {percentOf(p.correct, p.answered)}% de acerto · melhor sequência {p.bestStreak}</p>
            <p className="text-xs text-secondary">{p.achievements.map((id) => "🏅 " + ACHIEVEMENTS.find((a) => a.id === id)?.name).join("  ") || "Sem conquistas"}</p>
          </div>
        ))}
      </Panel>
      <Panel title="🕘 Histórico">
        {store.history.slice(0, 15).map((r, i) => (
          <p key={i} className="text-sm text-muted-foreground">{new Date(r.date).toLocaleString("pt-BR")} — {r.player}: {r.correct}/{r.total}, {r.points} pts</p>
        ))}
      </Panel>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-card p-4">
      <p className="mb-3 text-xs uppercase tracking-widest text-secondary">┌─ {title}</p>
      {children}
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`border px-3 py-2 text-left transition ${active ? "border-primary bg-muted text-primary shadow-glow" : "border-border hover:border-primary"}`}>
      {children}
    </button>
  );
}
