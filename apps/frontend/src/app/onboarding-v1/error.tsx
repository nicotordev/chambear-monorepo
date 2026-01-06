"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="w-full min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-destructive/20 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl text-destructive">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>
            We encountered an error while loading your profile. This might be
            due to a temporary connection issue.
          </p>
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-2 bg-slate-950 text-slate-50 text-xs rounded text-left overflow-auto max-h-40 font-mono">
              {error.message}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center pt-2">
          <Button onClick={() => reset()} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
