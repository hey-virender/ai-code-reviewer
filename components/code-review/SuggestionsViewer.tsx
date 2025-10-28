'use client';
import React, { useMemo, useState } from 'react';

type Issue = {
  id?: string;
  type?: string;
  description?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | string | null;
  lines?: number[] | null;
  suggested_fix?: string | null;
  patch?: string | null;
  confidence?: number | null;
};

type Review = {
  summary?: string | null;
  issues?: Issue[] | null;
  suggestions?: string[] | null;
  tests_to_add?: string[] | null;
  refactors?: string[] | null;
  score_overall?: number | null;
};

export default function SuggestionsViewer({
  review,
  raw,
  onCopyAll,
  onApplyPatch,
}: {
  review: Review | null;
  raw?: string | null;
  onCopyAll?: (payload: { review: Review; raw?: string | null }) => void;
  onApplyPatch?: (patchText: string) => void; // called when user wants to apply a patch to the editor
}) {
  // Defensive guard
  if (!review) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-md">
        <strong className="block text-lg">No review available</strong>
        <p className="mt-2 text-sm text-gray-600">Run a review first or re-open the previous review.</p>
      </div>
    );
  }

  const issues: Issue[] = Array.isArray(review.issues) ? review.issues : [];

  // UI state
  const [showRaw, setShowRaw] = useState(false);
  const [expanded, setExpanded] = useState<Record<string | number, boolean>>({});
  const [severityFilter, setSeverityFilter] = useState<'all' | string>('all');
  const [query, setQuery] = useState('');

  function prettyJSON(obj: any) {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }

  async function safeCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      // small, non-blocking success UI
      void notify('Copied to clipboard');
    } catch {
      void notify('Copy failed — your browser may block clipboard access');
    }
  }

  function notify(msg: string) {
    // Minimal unobtrusive toast (browser alert fallback)
    // Replace with your toast system if you have one
    try {
      const el = document.createElement('div');
      el.textContent = msg;
      el.className = 'fixed right-4 bottom-6 bg-black text-white px-3 py-2 rounded shadow';
      document.body.appendChild(el);
      setTimeout(() => {
        el.remove();
      }, 1400);
    } catch {
      // fallback
      // eslint-disable-next-line no-alert
      alert(msg);
    }
  }

  function severityClass(s?: string | null) {
    switch ((s ?? '').toLowerCase()) {
      case 'critical':
        return 'bg-red-700 text-white';
      case 'high':
        return 'bg-red-400 text-black';
      case 'medium':
        return 'bg-yellow-300 text-black';
      case 'low':
        return 'bg-green-300 text-black';
      default:
        return 'bg-gray-200 text-black';
    }
  }

  // Filtering & search
  const filtered = useMemo(() => {
    return issues.filter((it) => {
      if (severityFilter !== 'all' && (it.severity ?? 'unknown').toLowerCase() !== severityFilter.toLowerCase()) {
        return false;
      }
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (it.description ?? '').toLowerCase().includes(q) ||
        (it.suggested_fix ?? '').toLowerCase().includes(q) ||
        (it.patch ?? '').toLowerCase().includes(q) ||
        (it.type ?? '').toLowerCase().includes(q)
      );
    });
  }, [issues, severityFilter, query]);

  // Helpers: download json
  function downloadJSON(obj: any, filename = 'code-review.json') {
    const blob = new Blob([prettyJSON(obj)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // helper to extract inner code from fence-delimited patch
  function stripFences(s?: string | null) {
    if (!s) return '';
    return s.replace(/^```(?:[a-zA-Z0-9-]+)?\n?/, '').replace(/```$/, '').trim();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Review summary</h2>
          <p className="mt-1 text-sm text-gray-600 max-w-2xl">{review.summary ?? 'No summary provided.'}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-xs text-gray-500">Score</div>
            <div className="text-3xl font-extrabold">{review.score_overall ?? '—'}</div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                className="inline-flex items-center gap-2 border px-3 py-1 rounded text-sm hover:bg-gray-50"
                onClick={() => {
                  onCopyAll?.({ review, raw });
                  if (!onCopyAll) safeCopy(prettyJSON({ review, raw }));
                }}
                aria-label="Copy full review JSON"
              >
                Copy JSON
              </button>

              <button
                className="inline-flex items-center gap-2 border px-3 py-1 rounded text-sm hover:bg-gray-50"
                onClick={() => downloadJSON({ review, raw })}
                aria-label="Download review JSON"
              >
                Download JSON
              </button>
            </div>

            <button
              className="text-xs text-gray-600 underline hover:text-gray-800 self-start"
              onClick={() => setShowRaw((s) => !s)}
            >
              {showRaw ? 'Hide raw output' : 'Show raw output'}
            </button>
          </div>
        </div>
      </div>

      {/* Meta: suggestions/tests/refactors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Panel title="Suggestions" items={review.suggestions ?? []} emptyLabel="No suggestions" />
        <Panel title="Tests to add" items={review.tests_to_add ?? []} emptyLabel="No tests suggested" />
        <Panel title="Refactors" items={review.refactors ?? []} emptyLabel="No refactors suggested" />
      </div>

      {/* Controls: filter + search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Filter</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="border px-2 py-1 rounded text-sm"
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div className="text-sm text-gray-500 ml-3">{filtered.length} / {issues.length} issues</div>
        </div>

        <div className="flex items-center gap-2">
          <input
            placeholder="Search issues, fixes, or types..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border px-3 py-1 rounded text-sm w-64"
          />
          <button
            className="text-sm text-gray-500 underline"
            onClick={() => {
              setQuery('');
              setSeverityFilter('all');
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Issues list */}
      <div>
        <h3 className="text-lg font-medium mb-3">Issues</h3>
        {filtered.length === 0 ? (
          <div className="p-4 bg-gray-50 border rounded text-sm text-gray-600">No matching issues.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((issue, idx) => {
              const key = issue.id ?? idx;
              const isOpen = !!expanded[key];
              return (
                <div key={key} className="border rounded-md bg-white overflow-hidden shadow-sm">
                  <button
                    onClick={() => setExpanded((s) => ({ ...s, [key]: !s[key] }))}
                    className="w-full text-left px-4 py-3 flex items-start justify-between gap-4"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center justify-center w-10 h-8 rounded text-xs font-semibold ${severityClass(issue.severity)}`}>
                        {issue.severity ?? '—'}
                      </span>
                      <div>
                        <div className="font-medium text-sm">{issue.type ?? 'Issue'}</div>
                        <div className="text-xs text-gray-500">
                          {issue.description ? truncate(issue.description, 120) : 'No description'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-xs text-gray-500">Lines: {Array.isArray(issue.lines) && issue.lines.length ? issue.lines.join('-') : '—'}</div>
                      <div className="text-xs text-gray-500">Conf: {(issue.confidence ?? 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{isOpen ? '▲' : '▼'}</div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 space-y-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{issue.description ?? 'No description provided.'}</p>

                      {issue.suggested_fix && (
                        <div>
                          <div className="text-xs font-medium text-gray-600">Suggested fix</div>
                          <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{issue.suggested_fix}</div>
                        </div>
                      )}

                      {issue.patch && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-medium text-gray-600">Patch</div>
                            <div className="flex items-center gap-2">
                              <button
                                className="text-sm border px-2 py-1 rounded"
                                onClick={() => safeCopy(stripFences(issue.patch))}
                              >
                                Copy code
                              </button>

                              <button
                                className="text-sm border px-2 py-1 rounded"
                                onClick={() => downloadText(stripFences(issue.patch), `${issue.id ?? 'patch'}.txt`)}
                              >
                                Download
                              </button>

                              <button
                                className="text-sm border px-2 py-1 rounded"
                                onClick={() => {
                                  const text = stripFences(issue.patch);
                                  if (onApplyPatch) onApplyPatch(text);
                                  else {
                                    // default: copy and notify so user can paste into editor
                                    safeCopy(text);
                                    notify('Patch copied — paste it into your editor.');
                                  }
                                }}
                              >
                                Apply / Copy
                              </button>
                            </div>
                          </div>

                          <pre className="mt-2 overflow-auto rounded bg-gray-100 p-3 text-xs font-mono whitespace-pre">
                            {issue.patch}
                          </pre>
                        </div>
                      )}

                      <div className="flex gap-2 mt-2">
                        <button
                          className="text-xs text-gray-600 underline"
                          onClick={() => safeCopy(prettyJSON(issue))}
                        >
                          Copy issue JSON
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* raw output */}
      {showRaw && (
        <div>
          <h4 className="text-sm font-medium mb-2">Raw model output</h4>
          <pre className="rounded border bg-black text-white p-3 text-xs font-mono overflow-auto whitespace-pre">
            {raw ?? prettyJSON(review)}
          </pre>
        </div>
      )}
    </div>
  );

  // small helpers
  function truncate(s: string | undefined, n = 120) {
    if (!s) return '';
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  function downloadText(text: string, filename = 'file.txt') {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}

/* Small reusable Panel component placed below for compactness */
function Panel({ title, items, emptyLabel }: { title: string; items: string[]; emptyLabel?: string }) {
  return (
    <div className="border rounded-md p-3 bg-white">
      <h4 className="font-medium mb-2">{title}</h4>
      {Array.isArray(items) && items.length > 0 ? (
        <ul className="list-disc pl-5 text-sm space-y-1">
          {items.map((s, i) => (
            <li key={i} className="text-gray-700">{s}</li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500">{emptyLabel ?? '—'}</div>
      )}
    </div>
  );
}
