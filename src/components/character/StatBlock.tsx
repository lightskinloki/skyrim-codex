import { Card } from "@/components/ui/card";
import { Stats } from "@/types/character";

interface StatBlockProps {
  stats: Stats;
  title?: string;
}

export function StatBlock({ stats, title = "Core Stats" }: StatBlockProps) {
  const statEntries = [
    { key: 'might', label: 'Might', value: stats.might },
    { key: 'agility', label: 'Agility', value: stats.agility },
    { key: 'magic', label: 'Magic', value: stats.magic },
    { key: 'guile', label: 'Guile', value: stats.guile }
  ];

  return (
    <Card className="p-4 bg-card-secondary">
      <h3 className="font-cinzel font-semibold text-primary mb-4">
        {title}
      </h3>
      
      <div className="space-y-3">
        {statEntries.map(({ key, label, value }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-xl font-bold text-primary">{value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}