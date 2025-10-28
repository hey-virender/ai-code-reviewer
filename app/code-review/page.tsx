"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import axios from "axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Editor, OnChange } from "@monaco-editor/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const page = () => {
  const router = useRouter();
  const [code, setCode] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [depth, setDepth] = useState<string>("moderate");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    try {
      setIsLoading(true);
      event.preventDefault();

      const response = await axios.post("/api/code-review", {
        code,
        filename,
        language,
        depth,
      });

      console.log(response.data);
      localStorage.setItem(
        "latestReview",
        JSON.stringify({
          review: response.data.review,
          raw: response.data.raw,
        }),
      );
      router.push("/suggestions");
    } catch (error) {
      console.error("Error submitting code for review:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="px-4">
      <h1 className="text-lg font-semibold">Review Your Code</h1>

      <section>
        <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
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
          </div>
          <div>
            <Label className="py-4" htmlFor="language">
              Programming Language (optional):
            </Label>
            <Select onValueChange={(value) => setLanguage(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="py-4" htmlFor="depth">
              Review Depth:
            </Label>
            <Select value={depth} onValueChange={(e) => setDepth(e)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Depth" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shallow">Shallow</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="deep">Deep</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3 border-1 rounded-lg p-2">
            <Label className="py-4" htmlFor="code">
              Paste your code here:
            </Label>
            <Editor
              className="h-44 border rounded-md"
              value={code}
              onChange={(value: string | undefined) => setCode(value || "")}
              language={language}
            />
          </div>

          
          
          

          <Button className="my-4 px-5" type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Submit for Review"
            )}
          </Button>
        </form>
      </section>
    </main>
  );
};

export default page;
