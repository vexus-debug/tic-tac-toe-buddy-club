import { LucideIcon, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ComingSoonCardProps {
  icon?: LucideIcon;
  title: string;
  description: string;
}

export function ComingSoonCard({ icon: Icon = Sparkles, title, description }: ComingSoonCardProps) {
  return (
    <Card className="glass-card border-dashed">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">Coming soon</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}