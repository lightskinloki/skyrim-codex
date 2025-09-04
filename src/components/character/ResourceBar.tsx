import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Minus, Plus } from "lucide-react";

interface ResourceBarProps {
  label: string;
  current: number;
  max: number;
  type: 'health' | 'fatigue';
  onAdjust: (amount: number) => void;
}

export function ResourceBar({ label, current, max, type, onAdjust }: ResourceBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const colorClass = type === 'health' ? 'bg-health' : 'bg-fatigue';
  
  return (
    <Card className="p-4 bg-card-secondary">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-cinzel font-semibold text-primary">{label}</h3>
          <span className="text-lg font-bold">
            {current} / {max}
          </span>
        </div>
        
        <div className="relative h-6 bg-muted rounded-md overflow-hidden shadow-inner">
          <div 
            className={`h-full ${colorClass} transition-smooth shadow-md`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAdjust(-1)}
            disabled={current <= 0}
            className="flex-1"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAdjust(1)}
            disabled={current >= max}
            className="flex-1"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}