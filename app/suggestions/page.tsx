"use client";
import React, { useEffect, useState } from "react";
import SuggestionsViewer from "@/components/code-review/SuggestionsViewer";
import { useRouter } from "next/navigation";

export default function SuggestionsPage() {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<{ review: any; raw?: string } | null>(
    null,
  );
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("latestReview");
      if (!raw) {
        setPayload(null);
      } else {
        const parsed = JSON.parse(raw);
        setPayload(parsed);
      }
    } catch (e) {
      console.error("failed to read latestReview", e);
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // optional: allow user to go back to editor
  function goBack() {
    router.push("/code-review");
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Review Suggestions</h1>
        <div className="flex gap-2">
          <button className="border px-3 py-1 rounded" onClick={goBack}>
            Back to editor
          </button>
          <button
            className="border px-3 py-1 rounded"
            onClick={() => {
              localStorage.removeItem("latestReview");
              setPayload(null);
            }}
          >
            Clear saved review
          </button>
        </div>
      </div>

      {payload?.review ? (
        <SuggestionsViewer review={payload.review} raw={payload.raw} />
      ) : (
        <div className="p-4 bg-yellow-50 border rounded">
          <p className="font-medium">No review found.</p>
          <p className="text-sm text-gray-600">
            Run a review from the editor first. The result will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
