import { cn } from "@/lib/utils";
import { getAvailabilityColor, getAvailabilityLabel, getAvailabilityBadgeVariant } from "@/lib/utils/consultant";
import type { Consultant } from "@/types/consultant";
import { Badge } from "./badge";

interface AvailabilityBadgeProps {
  availability: Consultant["availability"];
  variant?: "text" | "badge";
  className?: string;
}

export function AvailabilityBadge({ availability, variant = "badge", className }: AvailabilityBadgeProps) {
  if (variant === "text") {
    return (
      <span className={cn(getAvailabilityColor(availability), className)}>
        {getAvailabilityLabel(availability)}
      </span>
    );
  }

  return (
    <Badge variant={getAvailabilityBadgeVariant(availability)} className={className}>
      {getAvailabilityLabel(availability)}
    </Badge>
  );
}

