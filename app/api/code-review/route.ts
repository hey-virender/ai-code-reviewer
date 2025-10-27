// app/api/code-review/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { reviewCode } from '@/lib/reviewController';

export async function POST(req: NextRequest) {
  try {
    

    const body = await req.json();
    console.log('Request body:', body);

    const { code, filename, diff, language, depth } = body ;
    console.log('Received code review request:', { code,filename, diff, language, depth });

    // Validation
    if (!code ) {
      return NextResponse.json({ error: 'Request must include code or diff' }, { status: 400 });
    }
    // size guard - protect your model costs and latency
    const size = (code?.length ?? diff?.length ?? 0);
    const MAX = Number(process.env.REVIEW_MAX_CHARS ?? 500000); // default 500k chars
    if (size > MAX) {
      return NextResponse.json({ error: 'Payload too large. Send a smaller file or a diff.' }, { status: 413 });
    }

    // call shared controller (which calls Gemini)
    const result = await reviewCode({ code, filename, diff, language, depth });

    // If model couldn't output valid JSON, surface raw text with hint
    if (!result.parsed) {
      return NextResponse.json({
        error: 'model_output_parse_failed',
        raw: result.raw,
        message:
          'The model did not return valid JSON. Try reducing depth, or the server may post-process the raw output.',
      }, { status: 502 });
    }

    return NextResponse.json({ ok: true, review: result.parsed, raw: result.raw });
  } catch (err: any) {
    console.error('code-review error:', err);
    return NextResponse.json({ error: err?.message ?? 'unknown_error' }, { status: 500 });
  }
}
