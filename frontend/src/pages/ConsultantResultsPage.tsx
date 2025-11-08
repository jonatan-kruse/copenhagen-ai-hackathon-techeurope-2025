import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { SkillTags } from "@/components/ui/SkillTags";
import { MatchScoreBadge } from "@/components/ui/MatchScoreBadge";
import { ConsultantCardSkeleton } from "@/components/ui/LoadingSkeleton";
import type { Consultant } from "@/types/consultant";
import type { ConsultantResultsState } from "@/types/navigation";
import { getResumeDownloadUrl, buildApiUrl, matchConsultantsByRoles, type RoleQuery, type RoleMatchResult } from "@/lib/api";
import { ArrowLeft, Loader2, FileText, Users, AlertCircle } from "lucide-react";

export function ConsultantResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ConsultantResultsState | null;
  const projectDescription = state?.projectDescription || "";
  const roles = state?.roles;
  
  const [roleResults, setRoleResults] = useState<RoleMatchResult[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRoleBased, setIsRoleBased] = useState(false);

  const handleBack = () => {
    navigate("/");
  };

  // Redirect to home if no data (direct navigation)
  useEffect(() => {
    if (!projectDescription && !roles) {
      navigate("/", { replace: true });
    }
  }, [projectDescription, roles, navigate]);

  // Fetch consultants from API
  useEffect(() => {
    if (!projectDescription && !roles) {
      return;
    }

    const fetchConsultants = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (roles && roles.length > 0) {
          // Role-based matching
          setIsRoleBased(true);
          const data = await matchConsultantsByRoles(roles);
          setRoleResults(data.roles || []);
        } else if (projectDescription) {
          // Legacy single query matching
          setIsRoleBased(false);
          const response = await fetch(buildApiUrl("/consultants/match"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ projectDescription }),
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch consultants: ${response.statusText}`);
          }

          const data = await response.json();
          setConsultants(data.consultants || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch consultants");
        console.error("Error fetching consultants:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultants();
  }, [projectDescription, roles]);

  const handleDownloadResume = (resumeId: string, consultantName: string) => {
    const url = getResumeDownloadUrl(resumeId);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${consultantName.replace(/\s+/g, "_")}_resume.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show nothing while redirecting
  if (!projectDescription && !roles) {
    return null;
  }

  return (
    <div className="w-full bg-background overflow-x-hidden">
      <div className="container mx-auto px-4 py-8 md:py-16 max-w-6xl">
        <div className="space-y-6">
          {/* Header with back button */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBack}
              aria-label="Go back to project description"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary">
                Matching Consultants
              </h1>
              <p className="text-muted-foreground mt-1">Find the perfect team for your project</p>
            </div>
          </div>

          {/* Project Description Display */}
          {projectDescription && !isRoleBased && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Your Project Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{projectDescription}</p>
              </CardContent>
            </Card>
          )}

          {/* Consultants List */}
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Loading consultants...</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <ConsultantCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            ) : error ? (
              <Card className="border border-destructive/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="text-destructive font-semibold">Error: {error}</p>
                  </div>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : isRoleBased ? (
              // Role-based results display
              roleResults.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center text-lg font-semibold">
                        No consultants found for the specified roles.
                      </p>
                      <p className="text-muted-foreground text-center text-sm mt-2">
                        Try adjusting your requirements or check back later.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-8">
                  {roleResults.map((roleResult, roleIndex) => (
                    <div key={roleIndex} className="space-y-4">
                      <Card className="border-l-2 border-l-primary">
                        <CardHeader>
                          <CardTitle className="text-2xl font-semibold">{roleResult.role.title}</CardTitle>
                          <CardDescription className="text-base mt-2 leading-relaxed">
                            {roleResult.role.description}
                          </CardDescription>
                          {roleResult.role.requiredSkills.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-2 text-muted-foreground">Required Skills:</p>
                              <SkillTags skills={roleResult.role.requiredSkills} />
                            </div>
                          )}
                        </CardHeader>
                      </Card>
                      {roleResult.consultants.length === 0 ? (
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex flex-col items-center justify-center py-8">
                              <Users className="h-10 w-10 text-muted-foreground mb-3" />
                              <p className="text-muted-foreground text-center font-semibold">
                                No matching consultants found for this role.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {roleResult.consultants.length} {roleResult.consultants.length === 1 ? "Candidate" : "Candidates"} Found
                          </h3>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {roleResult.consultants.map((consultant, index) => (
                              <Card key={consultant.id || `consultant-${roleIndex}-${index}`} className="transition-shadow hover:shadow-md">
                                <CardHeader>
                                  <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-xl font-semibold">{consultant.name}</CardTitle>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {consultant.resumeId && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => handleDownloadResume(consultant.resumeId!, consultant.name)}
                                          title="Download resume PDF"
                                          aria-label="Download resume PDF"
                                        >
                                          <FileText className="h-4 w-4 text-primary" />
                                        </Button>
                                      )}
                                      {consultant.matchScore !== undefined && (
                                        <MatchScoreBadge score={consultant.matchScore} />
                                      )}
                                    </div>
                                  </div>
                                  <CardDescription className="mt-2">
                                    <AvailabilityBadge availability={consultant.availability} variant="text" />
                                    {consultant.experience && (
                                      <span className="block mt-2 text-muted-foreground text-sm font-medium">
                                        {consultant.experience}
                                      </span>
                                    )}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-3">
                                    <div>
                                      <h3 className="text-sm font-medium mb-2 text-muted-foreground">Skills</h3>
                                      <SkillTags skills={consultant.skills} />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Legacy single query results
              consultants.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center text-lg font-semibold">
                        No consultants found.
                      </p>
                      <p className="text-muted-foreground text-center text-sm mt-2">
                        Try adjusting your project description or check back later.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <Users className="h-6 w-6" />
                      Found {consultants.length} {consultants.length === 1 ? "Consultant" : "Consultants"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Sorted by match score
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {consultants.map((consultant, index) => (
                      <Card key={consultant.id || `consultant-${index}`} className="transition-shadow hover:shadow-md">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-xl font-semibold">{consultant.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              {consultant.resumeId && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDownloadResume(consultant.resumeId!, consultant.name)}
                                  title="Download resume PDF"
                                  aria-label="Download resume PDF"
                                >
                                  <FileText className="h-4 w-4 text-primary" />
                                </Button>
                              )}
                              {consultant.matchScore !== undefined && (
                                <MatchScoreBadge score={consultant.matchScore} />
                              )}
                            </div>
                          </div>
                          <CardDescription>
                            <AvailabilityBadge availability={consultant.availability} variant="text" />
                            {consultant.experience && (
                              <span className="block mt-1 text-muted-foreground">
                                {consultant.experience}
                              </span>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <h3 className="text-sm font-medium mb-2">Skills</h3>
                              <SkillTags skills={consultant.skills} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

