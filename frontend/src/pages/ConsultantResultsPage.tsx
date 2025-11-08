import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Consultant } from "@/types/consultant";
import { getResumeDownloadUrl, buildApiUrl, matchConsultantsByRoles, type RoleQuery, type RoleMatchResult } from "@/lib/api";
import { ArrowLeft, Loader2, FileText } from "lucide-react";

function getAvailabilityColor(availability: Consultant["availability"]) {
  switch (availability) {
    case "available":
      return "text-green-600 dark:text-green-400";
    case "busy":
      return "text-yellow-600 dark:text-yellow-400";
    case "unavailable":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted-foreground";
  }
}

function getAvailabilityLabel(availability: Consultant["availability"]) {
  switch (availability) {
    case "available":
      return "Available";
    case "busy":
      return "Busy";
    case "unavailable":
      return "Unavailable";
    default:
      return "Unknown";
  }
}

export function ConsultantResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { projectDescription?: string; roles?: RoleQuery[] } | null;
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
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
            <h1 className="text-3xl md:text-4xl font-bold">Matching Consultants</h1>
          </div>

          {/* Project Description Display */}
          {projectDescription && !isRoleBased && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Your Project Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{projectDescription}</p>
              </CardContent>
            </Card>
          )}

          {/* Consultants List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading consultants...</span>
              </div>
            ) : error ? (
              <Card className="shadow-md border-destructive">
                <CardContent className="pt-6">
                  <p className="text-destructive">Error: {error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : isRoleBased ? (
              // Role-based results display
              roleResults.length === 0 ? (
                <Card className="shadow-md">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      No consultants found for the specified roles.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-8">
                  {roleResults.map((roleResult, roleIndex) => (
                    <div key={roleIndex} className="space-y-4">
                      <Card className="shadow-md border-l-4 border-l-primary">
                        <CardHeader>
                          <CardTitle className="text-2xl">{roleResult.role.title}</CardTitle>
                          <CardDescription className="text-base mt-2">
                            {roleResult.role.description}
                          </CardDescription>
                          {roleResult.role.requiredSkills.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-2">Required Skills:</p>
                              <div className="flex flex-wrap gap-2">
                                {roleResult.role.requiredSkills.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center rounded-md bg-primary/20 px-2 py-1 text-xs font-medium text-primary"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardHeader>
                      </Card>
                      {roleResult.consultants.length === 0 ? (
                        <Card>
                          <CardContent className="pt-6">
                            <p className="text-muted-foreground text-center py-4">
                              No matching consultants found for this role.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold">
                            {roleResult.consultants.length} {roleResult.consultants.length === 1 ? "Candidate" : "Candidates"} Found
                          </h3>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {roleResult.consultants.map((consultant, index) => (
                              <Card key={consultant.id || `consultant-${roleIndex}-${index}`} className="shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader>
                                  <div className="flex items-start justify-between">
                                    <CardTitle className="text-xl">{consultant.name}</CardTitle>
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
                                        <span className="text-sm font-semibold text-primary">
                                          {consultant.matchScore}% match
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <CardDescription>
                                    <span className={getAvailabilityColor(consultant.availability)}>
                                      {getAvailabilityLabel(consultant.availability)}
                                    </span>
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
                                      <div className="flex flex-wrap gap-2">
                                        {consultant.skills.map((skill, index) => (
                                          <span
                                            key={index}
                                            className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                                          >
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
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
                <Card className="shadow-md">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      No consultants found. Try adjusting your project description.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">
                      Found {consultants.length} {consultants.length === 1 ? "Consultant" : "Consultants"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Sorted by match score
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {consultants.map((consultant, index) => (
                      <Card key={consultant.id || `consultant-${index}`} className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-xl">{consultant.name}</CardTitle>
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
                                <span className="text-sm font-semibold text-primary">
                                  {consultant.matchScore}% match
                                </span>
                              )}
                            </div>
                          </div>
                          <CardDescription>
                            <span className={getAvailabilityColor(consultant.availability)}>
                              {getAvailabilityLabel(consultant.availability)}
                            </span>
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
                              <div className="flex flex-wrap gap-2">
                                {consultant.skills.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
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

