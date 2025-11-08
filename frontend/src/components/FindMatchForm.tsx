import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FindMatchFormProps {
  onMatch: (description: string) => void;
}

export function FindMatchForm({ onMatch }: FindMatchFormProps) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const characterCount = description.length;
  const maxCharacters = 5000;

  const handleSubmit = async () => {
    if (!description.trim() || characterCount > maxCharacters) return;
    
    setLoading(true);
    try {
      onMatch(description.trim());
    } catch (error) {
      console.error("Error submitting job description:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 space-y-4 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <label
            htmlFor="job-description"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 sr-only"
          >
            Job Description
          </label>
          <textarea
            id="job-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter the job description, role requirements, skills needed, and any other relevant details to find the best matching candidate..."
            className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/10 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
            aria-label="Job description input"
            maxLength={maxCharacters}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground mt-2 flex-shrink-0">
            <span>
              {characterCount} / {maxCharacters} characters
            </span>
            {characterCount > maxCharacters * 0.9 && (
              <span className="text-yellow-600 dark:text-yellow-400">
                Approaching limit
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="border-t p-4 flex-shrink-0">
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!description.trim() || characterCount > maxCharacters || loading}
            size="lg"
            className="min-w-[120px]"
          >
            {loading ? "Finding Match..." : "Find Match"}
          </Button>
        </div>
      </div>
    </div>
  );
}

