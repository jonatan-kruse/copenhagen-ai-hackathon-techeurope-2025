import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "./skeleton";

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex justify-start">
          <Card className="max-w-[80%] bg-muted">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

export function ConsultantCardSkeleton() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-4 w-24 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewSkeleton() {
  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-6 flex-1">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div>
          <Skeleton className="h-4 w-32 mb-3" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

