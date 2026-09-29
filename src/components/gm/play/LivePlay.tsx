// Pillar 3 — Live Play: walk a module's scenes in the interactive-runsheet
// format (RunsheetView), the in-app equivalent of the HTML console runsheet.
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCampaign } from "../CampaignContext";
import { RunsheetView } from "../runsheet/RunsheetView";

interface LivePlayProps {
  onDeployEncounter: (enemyIds: string[]) => void;
}

export function LivePlay({ onDeployEncounter }: LivePlayProps) {
  const { campaign } = useCampaign();
  const { toast } = useToast();
  const [moduleId, setModuleId] = useState<string | null>(campaign.modules[0]?.id ?? null);
  const [sceneIndex, setSceneIndex] = useState(0);

  const module = campaign.modules.find((m) => m.id === moduleId) ?? campaign.modules[0] ?? null;

  function deploy(enemyIds: string[]) {
    if (enemyIds.length === 0) return;
    onDeployEncounter(enemyIds);
    toast({ title: "Encounter deployed", description: `${enemyIds.length} enemies sent to the Combat tracker.` });
  }

  if (campaign.modules.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        No modules yet. Build one in <span className="font-semibold">The Forge</span>, then run it here.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {campaign.modules.length > 1 && (
        <Card className="p-2">
          <select
            value={module?.id ?? ""}
            onChange={(e) => { setModuleId(e.target.value); setSceneIndex(0); }}
            className="bg-background border rounded px-2 py-1 text-sm"
          >
            {campaign.modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Card>
      )}
      {module && (
        <RunsheetView
          module={module}
          sceneIndex={Math.min(sceneIndex, module.scenes.length - 1)}
          onSceneIndex={(i) => setSceneIndex(Math.max(0, Math.min(module.scenes.length - 1, i)))}
          deployEnemies={deploy}
        />
      )}
    </div>
  );
}
