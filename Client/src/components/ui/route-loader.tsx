import { Loader2 } from "lucide-react";

export default function RouteLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full py-16 gap-3">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin" />
        <Loader2 className="w-5 h-5 text-indigo-600 animate-pulse absolute" />
      </div>
      <p className="text-xs font-medium text-muted-foreground animate-pulse tracking-wide">
        Loading TaxGenie Module...
      </p>
    </div>
  );
}
