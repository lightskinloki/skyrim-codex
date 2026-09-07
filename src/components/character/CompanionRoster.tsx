// Player-facing roster of companion & summon cards. Seeds from the default
// companion sheets on first run, persists edits (HP/FP/ability uses) to
// localStorage, and lets a player spin up a new summon card on the fly for
// anything conjured mid-session that isn't pre-seeded.
import { useState, useEffect } from "react";
import { Companion } from "@/types/companion";
import { companionStorage } from "@/utils/companionStorage";
import { defaultCompanions } from "@/data/companions";
import { CompanionCard } from "./CompanionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Users } from "lucide-react";

export function CompanionRoster() {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [showNewSummon, setShowNewSummon] = useState(false);
  const [newSummonName, setNewSummonName] = useState("");
  const [newSummonHp, setNewSummonHp] = useState("10");
  const [newSummonFp, setNewSummonFp] = useState("0");
  const [newSummonedBy, setNewSummonedBy] = useState("");
  const [newDuration, setNewDuration] = useState("");

  useEffect(() => {
    setCompanions(companionStorage.ensureSeeded(defaultCompanions));
  }, []);

  const updateCompanion = (updated: Companion) => {
    companionStorage.save(updated);
    setCompanions((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const removeCompanion = (id: string) => {
    companionStorage.delete(id);
    setCompanions((prev) => prev.filter((c) => c.id !== id));
  };

  const clearSummons = () => {
    companionStorage.clearSummons();
    setCompanions((prev) => prev.filter((c) => c.kind !== 'summon'));
  };

  const addSummon = () => {
    if (!newSummonName.trim()) return;
    const hp = parseInt(newSummonHp) || 1;
    const fp = parseInt(newSummonFp) || 0;
    const summon: Companion = {
      id: `summon_${Date.now()}`,
      name: newSummonName.trim(),
      kind: 'summon',
      tier: 'Summon',
      resources: { hp: { current: hp, max: hp }, fp: { current: fp, max: fp }, dr: 0 },
      abilities: [],
      equipment: [],
      summonedBy: newSummonedBy.trim() || undefined,
      duration: newDuration.trim() || undefined,
      notes: 'Added at the table — fill in abilities/equipment as needed.',
    };
    companionStorage.save(summon);
    setCompanions((prev) => [...prev, summon]);
    setShowNewSummon(false);
    setNewSummonName(""); setNewSummonHp("10"); setNewSummonFp("0"); setNewSummonedBy(""); setNewDuration("");
  };

  const activeCompanions = companions.filter((c) => c.kind === 'companion');
  const activeSummons = companions.filter((c) => c.kind === 'summon');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-2xl font-bold text-primary flex items-center gap-2">
          <Users className="h-5 w-5" /> Companions & Summons
        </h2>
        <div className="flex gap-2">
          {activeSummons.length > 0 && (
            <Button size="sm" variant="outline" onClick={clearSummons}>Clear all summons</Button>
          )}
          <Button size="sm" onClick={() => setShowNewSummon(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Summon
          </Button>
        </div>
      </div>

      {activeCompanions.length === 0 && activeSummons.length === 0 && (
        <p className="text-sm text-muted-foreground">No companions loaded yet.</p>
      )}

      {activeCompanions.length > 0 && (
        <div className="space-y-3">
          {activeCompanions.map((c) => (
            <CompanionCard key={c.id} companion={c} onUpdate={updateCompanion} onRemove={removeCompanion} />
          ))}
        </div>
      )}

      {activeSummons.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">ACTIVE SUMMONS</h3>
          {activeSummons.map((c) => (
            <CompanionCard key={c.id} companion={c} onUpdate={updateCompanion} onRemove={removeCompanion} />
          ))}
        </div>
      )}

      <Dialog open={showNewSummon} onOpenChange={setShowNewSummon}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a Summon</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={newSummonName} onChange={(e) => setNewSummonName(e.target.value)} placeholder="e.g. Dremora Lord" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>HP</Label>
                <Input type="number" value={newSummonHp} onChange={(e) => setNewSummonHp(e.target.value)} />
              </div>
              <div>
                <Label>FP</Label>
                <Input type="number" value={newSummonFp} onChange={(e) => setNewSummonFp(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Summoned by</Label>
              <Input value={newSummonedBy} onChange={(e) => setNewSummonedBy(e.target.value)} placeholder="e.g. Nora" />
            </div>
            <div>
              <Label>Duration</Label>
              <Input value={newDuration} onChange={(e) => setNewDuration(e.target.value)} placeholder="e.g. until dismissed / 1 hour" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewSummon(false)}>Cancel</Button>
            <Button onClick={addSummon}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
