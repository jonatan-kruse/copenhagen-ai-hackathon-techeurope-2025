import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/ChatInterface";
import { FindMatchForm } from "@/components/FindMatchForm";
import { getOverview, type OverviewData } from "@/lib/api";
import { useEffect, useState } from "react";

type Mode = "assemble" | "find";

export function ChatPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [mode, setMode] = useState<Mode>("assemble");
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

  const handleComplete = (roles: any[]) => {
    navigate("/results", { state: { roles } });
  };

  const handleFindMatch = (description: string) => {
    navigate("/results", { state: { projectDescription: description } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 md:py-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2">
            <Card className="shadow-lg h-[600px] flex flex-col" style={{ backgroundColor: 'var(--card-primary)' }}>
              <CardHeader>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
                    <Button
                      variant={mode === "assemble" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMode("assemble")}
                      className="min-w-[140px]"
                    >
                      Assemble a Team
                    </Button>
                    <Button
                      variant={mode === "find" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMode("find")}
                      className="min-w-[140px]"
                    >
                      Find Match
                    </Button>
                  </div>
                  <CardTitle className="text-3xl md:text-4xl font-bold text-center">
                    {mode === "assemble" ? "Assemble Your Team" : "Find the Best Match"}
                  </CardTitle>
                  <p className="text-muted-foreground text-center mt-2">
                    {mode === "assemble"
                      ? "Chat with our AI assistant to find the perfect consultants for your project"
                      : "Enter a job description to find the best matching candidate for the role"}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                {mode === "assemble" ? (
                  <ChatInterface onComplete={handleComplete} />
                ) : (
                  <FindMatchForm onMatch={handleFindMatch} />
                )}
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

