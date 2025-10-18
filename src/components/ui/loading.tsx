import { Loader2 } from "lucide-react";

interface LoadingProps {
  title?: string;
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Loading({
  title = "Loading...",
  message,
  size = "lg",
  className = "",
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={`container mx-auto px-4 py-8 ${className}`}>
      <div className="text-center py-12">
        <Loader2
          className={`${sizeClasses[size]} text-muted-foreground mx-auto mb-4 animate-spin`}
        />
        <h2 className={`${textSizeClasses[size]} font-bold mb-4`}>{title}</h2>
        {message && <p className="text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}

// Inline loading component for buttons and smaller areas
interface InlineLoadingProps {
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function InlineLoading({
  size = "sm",
  className = "",
}: InlineLoadingProps) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-6 w-6",
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin ${className}`} />
  );
}

// Page loading component (full screen)
interface PageLoadingProps {
  title?: string;
  message?: string;
}

export function PageLoading({
  title = "Loading...",
  message,
}: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        {message && <p className="text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
