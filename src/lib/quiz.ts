import { QUESTIONS, type CategoryId, type Difficulty, type Question } from "./questions";

export type Mode = "classico" | "sobrevivencia" | "desafio" | "aleatorio" | "duelo";
export type Letter = "A" | "B" | "C" | "D";

export const MODES: { id: Mode; name: string; icon: string; desc: string }[] = [
  { id: "classico", name: "Clássico", icon: "📘", desc: "Responda as 10 perguntas da categoria." },
  { id: "sobrevivencia", name: "Sobrevivência", icon: "❤️", desc: "Continue enquanto acertar. Um erro encerra." },
  { id: "desafio", name: "Desafio", icon: "🔥", desc: "Só as mais difíceis, pontuação em dobro." },
  { id: "aleatorio", name: "Aleatório", icon: "🎲", desc: "10 perguntas de todas as categorias." },
  { id: "duelo", name: "Duelo", icon: "⚔️", desc: "Dois jogadores alternam respostas." },
];

export const POINTS: Record<Difficulty, number> = { facil: 10, medio: 20, dificil: 30, especialista: 50 };
export const DIFF_LABEL: Record<Difficulty, string> = { facil: "Fácil", medio: "Médio", dificil: "Difícil", especialista: "Especialista" };

/** Aceita maiúsculas/minúsculas e espaços. Retorna null se inválida. */
export function parseAnswer(input: string | null | undefined): Letter | null {
  const v = (input ?? "").trim().toUpperCase();
  return v === "A" || v === "B" || v === "C" || v === "D" ? v : null;
}

export function pointsFor(q: Question, mode: Mode): number {
  return POINTS[q.difficulty] * (mode === "desafio" ? 2 : 1);
}

export function classify(percent: number): { title: string; message: string } {
  if (percent >= 100) return { title: "Lenda Suprema", message: "Perfeito! Nenhuma pergunta te derrubou." };
  if (percent > 80) return { title: "Mestre", message: "Domínio impressionante. Falta pouco para a perfeição!" };
  if (percent > 60) return { title: "Especialista", message: "Ótimo desempenho, você conhece bem o assunto." };
  if (percent > 30) return { title: "Explorador", message: "Bom caminho! Continue explorando o universo." };
  return { title: "Iniciante", message: "Todo mestre já foi iniciante. Tente de novo!" };
}

export function percentOf(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

export function shuffle<T>(list: readonly T[], rand: () => number = Math.random): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const DIFF_ORDER: Difficulty[] = ["facil", "medio", "dificil", "especialista"];

export function buildQuestions(category: CategoryId, mode: Mode, rand: () => number = Math.random): Question[] {
  const pool = mode === "aleatorio" || category === "surpresa" ? QUESTIONS : QUESTIONS.filter((q) => q.category === category);
  if (mode === "desafio") {
    const sorted = [...shuffle(pool, rand)].sort((a, b) => DIFF_ORDER.indexOf(b.difficulty) - DIFF_ORDER.indexOf(a.difficulty));
    return sorted.slice(0, category === "surpresa" ? 10 : 5);
  }
  if (mode === "sobrevivencia") return shuffle(pool, rand);
  return shuffle(pool, rand).slice(0, 10);
}

/** Recompensas documentadas: XP = pontos; moedas = 2 por acerto + 5 a cada 3 de sequência máxima. */
export function rewards(points: number, correct: number, maxStreak: number) {
  return { xp: points, coins: correct * 2 + Math.floor(maxStreak / 3) * 5 };
}

/** Nível = 1 + a cada 200 XP. */
export function levelFor(xp: number) {
  const level = Math.floor(xp / 200) + 1;
  return { level, current: xp % 200, next: 200 };
}

export interface MatchRecord {
  player: string;
  category: CategoryId;
  mode: Mode;
  correct: number;
  total: number;
  points: number;
  maxStreak: number;
  date: string;
}

export interface Profile {
  name: string;
  xp: number;
  coins: number;
  games: number;
  correct: number;
  answered: number;
  bestStreak: number;
  achievements: string[];
}

export const ACHIEVEMENTS: { id: string; name: string; desc: string; test: (p: Profile, m: MatchRecord) => boolean }[] = [
  { id: "primeira", name: "Primeiros Passos", desc: "Concluir a primeira partida", test: (p) => p.games >= 1 },
  { id: "perfeito", name: "Perfeição", desc: "Acertar 100% de uma partida", test: (_, m) => m.total > 0 && m.correct === m.total },
  { id: "sequencia5", name: "Em Chamas", desc: "Sequência de 5 acertos", test: (p) => p.bestStreak >= 5 },
  { id: "sobrevivente", name: "Sobrevivente", desc: "10 acertos no Sobrevivência", test: (_, m) => m.mode === "sobrevivencia" && m.correct >= 10 },
  { id: "veterano", name: "Veterano", desc: "Jogar 10 partidas", test: (p) => p.games >= 10 },
  { id: "nivel5", name: "Ascensão", desc: "Chegar ao nível 5", test: (p) => levelFor(p.xp).level >= 5 },
];

export function emptyProfile(name: string): Profile {
  return { name, xp: 0, coins: 0, games: 0, correct: 0, answered: 0, bestStreak: 0, achievements: [] };
}

/** Aplica uma partida ao perfil e retorna perfil atualizado + conquistas novas. */
export function applyMatch(profile: Profile, m: MatchRecord): { profile: Profile; unlocked: string[] } {
  const r = rewards(m.points, m.correct, m.maxStreak);
  const p: Profile = {
    ...profile,
    xp: profile.xp + r.xp,
    coins: profile.coins + r.coins,
    games: profile.games + 1,
    correct: profile.correct + m.correct,
    answered: profile.answered + m.total,
    bestStreak: Math.max(profile.bestStreak, m.maxStreak),
    achievements: [...profile.achievements],
  };
  const unlocked = ACHIEVEMENTS.filter((a) => !p.achievements.includes(a.id) && a.test(p, m)).map((a) => a.id);
  p.achievements.push(...unlocked);
  return { profile: p, unlocked };
}

export function ranking(history: MatchRecord[]): MatchRecord[] {
  return [...history].sort((a, b) => b.points - a.points || b.correct - a.correct).slice(0, 10);
}

// ---- Persistência (JSON no navegador) ----
const KEY = "dqu:v1";
export interface Store { profiles: Record<string, Profile>; history: MatchRecord[] }

export function parseStore(raw: string | null): Store {
  try {
    const d = raw ? JSON.parse(raw) : null;
    if (d && typeof d === "object" && d.profiles && Array.isArray(d.history)) return d as Store;
  } catch { /* dados inválidos: recomeça */ }
  return { profiles: {}, history: [] };
}
export const loadStore = (): Store => parseStore(typeof localStorage === "undefined" ? null : localStorage.getItem(KEY));
export const saveStore = (s: Store) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ } };
