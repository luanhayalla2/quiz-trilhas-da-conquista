import { describe, expect, it } from "vitest";
import { QUESTIONS, CATEGORIES } from "@/lib/questions";
import { applyMatch, buildQuestions, classify, emptyProfile, levelFor, parseAnswer, parseStore, pointsFor, ranking, rewards, shuffle, type MatchRecord } from "@/lib/quiz";

const m = (o: Partial<MatchRecord> = {}): MatchRecord => ({ player: "Ana", category: "gamer", mode: "classico", correct: 10, total: 10, points: 150, maxStreak: 10, date: "", ...o });

describe("banco de perguntas", () => {
  it("cada categoria real tem 10+ perguntas com 4 alternativas", () => {
    for (const c of CATEGORIES.filter((c) => c.id !== "surpresa")) {
      const qs = QUESTIONS.filter((q) => q.category === c.id);
      expect(qs.length).toBeGreaterThanOrEqual(10);
      qs.forEach((q) => expect(q.options).toHaveLength(4));
    }
  });
  it("não há perguntas repetidas", () => {
    expect(new Set(QUESTIONS.map((q) => q.text)).size).toBe(QUESTIONS.length);
  });
});

describe("validação", () => {
  it("aceita maiúsculas e minúsculas", () => { expect(parseAnswer("b")).toBe("B"); expect(parseAnswer(" D ")).toBe("D"); });
  it("rejeita vazias e inválidas", () => { expect(parseAnswer("")).toBeNull(); expect(parseAnswer("E")).toBeNull(); expect(parseAnswer("ab")).toBeNull(); });
});

describe("pontuação e classificação", () => {
  it("pontos por dificuldade", () => {
    const q = QUESTIONS[0]!;
    expect(pointsFor({ ...q, difficulty: "facil" }, "classico")).toBe(10);
    expect(pointsFor({ ...q, difficulty: "medio" }, "classico")).toBe(20);
    expect(pointsFor({ ...q, difficulty: "dificil" }, "classico")).toBe(30);
    expect(pointsFor({ ...q, difficulty: "especialista" }, "classico")).toBe(50);
    expect(pointsFor({ ...q, difficulty: "dificil" }, "desafio")).toBe(60);
  });
  it("faixas de classificação", () => {
    expect(classify(30).title).toBe("Iniciante");
    expect(classify(31).title).toBe("Explorador");
    expect(classify(60).title).toBe("Explorador");
    expect(classify(61).title).toBe("Especialista");
    expect(classify(81).title).toBe("Mestre");
    expect(classify(99).title).toBe("Mestre");
    expect(classify(100).title).toBe("Lenda Suprema");
  });
});

describe("progressão", () => {
  it("XP, moedas e nível", () => {
    expect(rewards(150, 10, 6)).toEqual({ xp: 150, coins: 30 });
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(199).level).toBe(1);
    expect(levelFor(200).level).toBe(2);
  });
  it("aplica partida e desbloqueia conquistas", () => {
    const { profile, unlocked } = applyMatch(emptyProfile("Ana"), m());
    expect(profile.games).toBe(1);
    expect(profile.xp).toBe(150);
    expect(unlocked).toContain("primeira");
    expect(unlocked).toContain("perfeito");
    expect(applyMatch(profile, m()).unlocked).not.toContain("primeira");
  });
});

describe("embaralhamento e montagem", () => {
  it("embaralha sem perder itens", () => {
    const s = shuffle([1, 2, 3, 4, 5]);
    expect([...s].sort()).toEqual([1, 2, 3, 4, 5]);
  });
  it("clássico traz 10 da categoria", () => {
    const qs = buildQuestions("futebol", "classico");
    expect(qs).toHaveLength(10);
    qs.forEach((q) => expect(q.category).toBe("futebol"));
  });
});

describe("ranking e persistência", () => {
  it("ordena por pontos", () => {
    expect(ranking([m({ points: 10 }), m({ points: 90 })])[0]!.points).toBe(90);
  });
  it("tolera dados inválidos", () => {
    expect(parseStore("{lixo")).toEqual({ profiles: {}, history: [] });
    expect(parseStore(null).history).toEqual([]);
  });
});
