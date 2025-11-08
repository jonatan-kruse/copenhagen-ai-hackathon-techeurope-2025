import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOverview, type OverviewData } from "@/lib/api";

export function ProjectDescriptionPage() {
  const [description, setDescription] = useState("");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await getOverview();
        setOverview(data);
      } catch (error) {
        console.error("Failed to fetch overview:", error);
        setOverview({ cvCount: 0, uniqueSkillsCount: 0, topSkills: [] });
      }
    };
    fetchOverview();
  }, []);

  const handlePost = () => {
    if (description.trim()) {
      navigate("/results", { state: { projectDescription: description } });
    }
  };

  const characterCount = description.length;
  const maxCharacters = 5000;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 md:py-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 items-stretch">
          <div className="lg:col-span-2">
            <Card className="shadow-lg h-full flex flex-col" style={{ backgroundColor: 'var(--card-primary)' }}>
              <CardHeader>
                <CardTitle className="text-3xl md:text-4xl font-bold text-center">
                  Describe Your Project
                </CardTitle>
                <p className="text-muted-foreground text-center mt-2">
                  Enter the details of your project to find matching consultants
                </p>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-2 flex-1 flex flex-col">
                  <label
                    htmlFor="project-description"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 sr-only"
                  >
                    Project Description
                  </label>
                  <textarea
                    id="project-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your project requirements, skills needed, timeline, and any other relevant details..."
                    className="flex min-h-[300px] md:min-h-[400px] w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/10 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y flex-1"
                    aria-label="Project description input"
                    maxLength={maxCharacters}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handlePost();
                      }
                    }}
                  />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
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
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={handlePost}
                    disabled={!description.trim() || characterCount > maxCharacters}
                    size="lg"
                    className="min-w-[120px]"
                    aria-label="Post project description"
                  >
                    Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="shadow-lg h-full flex flex-col" style={{ backgroundColor: 'var(--card-secondary)' }}>
              <CardHeader>
                <CardTitle className="text-xl">Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 flex-1">
                <div>
                  <p className="text-sm text-muted-foreground">Total CVs</p>
                  <p className="text-2xl font-bold">
                    {overview?.cvCount ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Top 10 Skills</p>
                  {overview?.topSkills && overview.topSkills.length > 0 ? (
                    <div className="space-y-2">
                      {overview.topSkills.map((skillCount, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{skillCount.skill}</span>
                          <span className="text-sm text-muted-foreground">
                            {skillCount.count} {skillCount.count === 1 ? "person" : "people"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

