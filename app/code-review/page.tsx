"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { useState } from "react";

const page = () => {
  const [code, setCode] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [depth, setDepth] = useState<string>("moderate");
  const [reviewResult, setReviewResult] = useState<any>();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const response = await axios.post("/api/code-review", {
      code,
      filename,
      language,
      depth,
    });

    console.log(response.data);
    setReviewResult(JSON.stringify(response.data.review, null, 2));
  };

  return (
    <main className="px-4">
      <h1 className="text-lg font-semibold">Review Your Code</h1>
      <div className="flex">
        <section className="w-1/2 pr-4">
          <form onSubmit={handleSubmit}>
            <Label className="py-4" htmlFor="code">
              Paste your code here:
            </Label>
            <Textarea
              id="code"
              className="h-44"
              placeholder="Your code..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <div>
              <Label className="py-4" htmlFor="filename">
                Filename (optional):
              </Label>
              <Input
                id="filename"
                placeholder="e.g., app.js"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
              />
              <Label className="py-4" htmlFor="language">
                Programming Language (optional):
              </Label>
              <Input
                id="language"
                placeholder="e.g., JavaScript"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              />
              <Label className="py-4" htmlFor="depth">
                Review Depth:
              </Label>
              <select
                id="depth"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
              >
                <option value="shallow">Shallow</option>
                <option value="moderate">Moderate</option>
                <option value="deep">Deep</option>
              </select>
            </div>
            <Button className="my-4" type="submit">
              Submit for Review
            </Button>
          </form>
        </section>
        <section className="w-1/2 pl-4">
          <h2 className="text-md font-semibold py-4">Review Results:</h2>
          <div className="mt-2 p-4 border border-gray-300 rounded-md bg-gray-50">
            <section>
              <h3>Issues Identified:</h3>
              <pre>{reviewResult.issues}</pre>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
};

export default page;
