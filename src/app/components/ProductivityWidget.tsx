import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { LucideIcon } from "lucide-react";

interface ProductivityWidgetProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export function ProductivityWidget({ title, value, icon: Icon, trend, color = "text-primary" }: ProductivityWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`size-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
