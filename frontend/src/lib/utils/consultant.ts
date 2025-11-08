import type { Consultant } from "@/types/consultant";

export function getAvailabilityColor(availability: Consultant["availability"]): string {
  switch (availability) {
    case "available":
      return "text-green-600";
    case "busy":
      return "text-yellow-600";
    case "unavailable":
      return "text-red-600";
    default:
      return "text-muted-foreground";
  }
}

export function getAvailabilityLabel(availability: Consultant["availability"]): string {
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

export function getAvailabilityBadgeVariant(availability: Consultant["availability"]): "default" | "secondary" | "destructive" {
  switch (availability) {
    case "available":
      return "default";
    case "busy":
      return "secondary";
    case "unavailable":
      return "destructive";
    default:
      return "secondary";
  }
}

