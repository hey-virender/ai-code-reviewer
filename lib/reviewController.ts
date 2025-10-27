
import { GoogleGenAI } from "@google/genai";


const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';


const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY ?? undefined,
});


export function buildReviewPrompt({
  code,
  filename = 'unknown',
  diff,
  language = 'unknown',
  depth = 'moderate',
}: {
  code?: string;
  filename?: string;
  diff?: string;
  language?: string;
  depth?: 'quick' | 'moderate' | 'deep';
}) {
  const payload = diff ? `DIFF:\n${diff}` : `CODE:\n${code ?? ''}`;
  return `
You are a senior software engineer and code reviewer.

Output EXACTLY a single JSON object (no prose before/after) that conforms to the SCHEMA below.

SCHEMA:
{
  "summary": "short summary of main issues and overall quality",
  "issues": [
    {
      "id": "unique-id",
      "type": "bug|security|performance|style|readability|test|arch|other",
      "description": "explain the issue and why it's a problem",
      "severity": "low|medium|high|critical",
      "lines": [startLine, endLine], 
      "suggested_fix": "short steps or code snippet",
      "patch": "optional full replacement/patch (include code fences if needed)",
      "confidence": 0.0
    }
  ],
  "suggestions": ["high-level improvement 1", "improvement 2"],
  "tests_to_add": ["unit test idea 1", "integration test idea 2"],
  "refactors": ["module-level refactor suggestion"],
  "score_overall": 0
}

INSTRUCTIONS:
- Use the text under CODE_START to analyze. If diff is provided prefer diff.
- Put line numbers relative to the given file/diff.
- Keep each issue precise. Provide confidence (0.0 - 1.0).
- If you cannot follow instructions, return {"error":"explain why"}.

CODE_START
Filename: ${filename}
Language: ${language}
Depth: ${depth}
${payload}
CODE_END
`;
}

export  function extractJson(text: string) {
  if (!text) return null;
  
  try {
    return JSON.parse(text);
  } catch {}
  // find first "{" and last "}" and try parsing the substring
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    const candidate = text.slice(first, last + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }
  // fallback: try to fix common trailing commas or single quotes (best-effort)
  let cleaned = text.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  cleaned = cleaned.replace(/(['"])?([a-z0-9_]+)(['"])?:/gi, '"$2":'); // naive key quoting
  cleaned = cleaned.replace(/'/g, '"');
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
}

export async function reviewCode({
  code,
  filename,
  diff,
  language,
  depth = 'moderate',
}: {
  code?: string;
  filename?: string;
  diff?: string;
  language?: string;
  depth?: 'quick' | 'moderate' | 'deep';
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set on the server.');
  }

  const prompt = buildReviewPrompt({ code, filename, diff, language, depth });

  // Call the SDK - adjust call if your SDK version differs
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        text: prompt,
      },
    ],
  });

  // Extract text from common SDK shapes
  // (SDKs differ; adapt if your installed version returns different fields)
  let rawText = '';
  try {
    // common shapes:
    // response.text
    // response.output_text / response.candidates[0].content.parts[0].text
    rawText =
      (response as any)?.text ??
      (response as any)?.output_text ??
      (response as any)?.candidates?.[0]?.content?.parts?.[0]?.text ??
      (response as any)?.candidates?.[0]?.message?.content?.[0]?.text ??
      '';
  } catch (e) {
    rawText = '';
  }

  const parsed = extractJson(rawText);

  return { raw: rawText, parsed };
}