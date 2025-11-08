import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/ChatInterface";
import { FindMatchForm } from "@/components/FindMatchForm";
import { OverviewSkeleton } from "@/components/ui/LoadingSkeleton";
import { getOverview, type OverviewData } from "@/lib/api";
import { useEffect, useState } from "react";
import { Users, Search } from "lucide-react";

type Mode = "assemble" | "find";

export function ChatPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [mode, setMode] = useState<Mode>("assemble");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOverview = async () => {
      setLoadingOverview(true);
      try {
        const data = await getOverview();
        setOverview(data);
      } catch (error) {
        console.error("Failed to fetch overview:", error);
        setOverview({ cvCount: 0, uniqueSkillsCount: 0, topSkills: [] });
      } finally {
        setLoadingOverview(false);
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
    <div className="w-full bg-background overflow-x-hidden">
      <div className="container mx-auto px-4 py-8 md:py-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col bg-card-primary">
              <CardHeader>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-md border border-border/50">
                    <Button
                      variant={mode === "assemble" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMode("assemble")}
                      className="min-w-[140px]"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Assemble a Team
                    </Button>
                    <Button
                      variant={mode === "find" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMode("find")}
                      className="min-w-[140px]"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Find Match
                    </Button>
                  </div>
                  <CardTitle className="text-3xl md:text-4xl font-semibold text-center text-primary">
                    {mode === "assemble" ? "Assemble Your Team" : "Find the Best Match"}
                  </CardTitle>
                  <p className="text-muted-foreground text-center mt-2 max-w-md">
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
            {loadingOverview ? (
              <OverviewSkeleton />
            ) : (
              <Card className="h-full flex flex-col bg-card-secondary">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  <div className="p-4 rounded-md bg-primary/10 border border-primary/30">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total CVs</p>
                    <p className="text-3xl font-semibold text-primary">
                      {overview?.cvCount ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Top 10 Skills</p>
                    {overview?.topSkills && overview.topSkills.length > 0 ? (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {overview.topSkills.map((skillCount, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 rounded-md border border-border/50 hover:bg-accent/20 hover:border-accent/50 transition-colors"
                          >
                            <span className="text-sm font-medium">{skillCount.skill}</span>
                            <span className="text-sm text-muted-foreground">
                              {skillCount.count} {skillCount.count === 1 ? "person" : "people"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No skills available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

