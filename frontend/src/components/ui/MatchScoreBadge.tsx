import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface MatchScoreBadgeProps {
  score: number;
  className?: string;
  showLabel?: boolean;
}

export function MatchScoreBadge({ score, className, showLabel = true }: MatchScoreBadgeProps) {
  const getVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const getColorClass = (score: number): string => {
    if (score >= 80) return "bg-green-500/20 text-green-700 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
    return "bg-red-500/20 text-red-700 border-red-500/30";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge
        variant="outline"
        className={cn("font-medium", getColorClass(score))}
      >
        {score}%
      </Badge>
      {showLabel && (
        <span className="text-sm text-muted-foreground">match</span>
      )}
    </div>
  );
}

