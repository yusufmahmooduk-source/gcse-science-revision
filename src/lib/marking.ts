import type { Question } from "./types";

/** Parses a student's numeric answer. Accepts 4.5, 4,500, 4.5e-3, 4.5 x 10^-3, 4.5×10-3, 4.5 × 10⁻³ and trailing units. */
export function parseNumber(input: string): number | null {
  const sup: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+" };
  let s = input.trim().replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, (c) => sup[c]).replace(/−/g, "-");
  // thousands separators: 4,600,000 or 4 600 000
  while (/\d[, ]\d{3}(?!\d)/.test(s)) s = s.replace(/(\d)[, ](\d{3})(?!\d)/, "$1$2");
  const sci = s.match(/^([-+]?\d*\.?\d+)\s*(?:x|×|\*)\s*10\s*\^?\s*\(?([-+]?\d+)\)?/i);
  if (sci) return parseFloat(sci[1]) * Math.pow(10, parseInt(sci[2], 10));
  const plain = s.match(/^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)/i);
  if (plain) return parseFloat(plain[1]);
  return null;
}

export function markNumeric(q: Question, input: string): { correct: boolean; value: number | null } {
  const v = parseNumber(input);
  if (v === null || q.numericAnswer === undefined) return { correct: false, value: v };
  const target = q.numericAnswer;
  const tol = Math.max(q.tolerance ?? 0.01, 1e-9);
  const close = (a: number, b: number) => (b === 0 ? Math.abs(a) < 1e-9 : Math.abs(a - b) / Math.abs(b) <= tol + 1e-12);
  // also accept the answer correctly rounded to 2 or 3 significant figures, as an examiner would
  const rounded = [2, 3].map((sf) => (target === 0 ? 0 : parseFloat(target.toPrecision(sf))));
  const correct = close(v, target) || rounded.some((r) => Math.abs(v - r) <= Math.abs(r) * 1e-9);
  return { correct, value: v };
}

/** Suggests a mark for a short answer by spotting key words. The student confirms the final mark. */
export function suggestShort(q: Question, input: string): { hits: string[]; suggested: number } {
  const text = input.toLowerCase();
  const hits = (q.acceptedAnswers ?? []).filter((a) => {
    const words = a.toLowerCase().split(/[\s/]+/).filter((w) => w.length > 3);
    if (!words.length) return text.includes(a.toLowerCase());
    return words.every((w) => text.includes(w.replace(/s$/, "")));
  });
  return { hits, suggested: Math.min(q.marks, hits.length) };
}

export function formatNumber(n: number): string {
  if (n !== 0 && (Math.abs(n) < 0.001 || Math.abs(n) >= 1e6)) {
    const [m, e] = n.toExponential(3).split("e");
    return `${parseFloat(m)} × 10^${parseInt(e, 10)}`;
  }
  return String(parseFloat(n.toPrecision(6)));
}
