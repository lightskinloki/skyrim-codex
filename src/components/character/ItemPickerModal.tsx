import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Minus, Package, Plus } from 'lucide-react';
import { HomebrewItem, InventoryItem } from '@/types/character';
import {
  ItemCustom,
  ItemGroup,
  ItemLeaf,
  ItemNode,
  RESTORE_LADDER,
  itemTree,
  printedItemNames,
  rankLabel,
} from '@/data/itemTree';
import { buildCustomItem, buildHomebrewItem, buildLeafItem, nameKey } from '@/utils/itemPicker';

/** Printed names are reserved so a custom item can never redefine one. */
const PRINTED_NAMES = new Set(printedItemNames().map(nameKey));

interface ItemPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Items already saved in "Your Homebrew". */
  homebrew: HomebrewItem[];
  onAdd: (item: InventoryItem, homebrew?: HomebrewItem) => void;
}

function homebrewGroup(entries: HomebrewItem[]): ItemGroup {
  return {
    type: 'group',
    id: 'homebrew',
    label: 'Your Homebrew',
    hint: `${entries.length} saved`,
    children: entries.map<ItemLeaf>(entry => ({
      type: 'item',
      id: `homebrew-${entry.id}`,
      label: entry.name,
      detail: entry.effect,
      values: {
        name: entry.name,
        kind: entry.kind,
        effect: entry.effect,
        restoreHp: entry.restoreHp,
        restoreFp: entry.restoreFp,
        homebrew: true,
      },
    })),
  };
}

function QuantityStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs text-muted-foreground">Quantity</Label>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={() => onChange(Math.max(1, value - 1))}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="text-sm font-medium min-w-[2rem] text-center">{value}</span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={() => onChange(Math.min(99, value + 1))}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function ItemPickerModal({ isOpen, onClose, homebrew, onAdd }: ItemPickerModalProps) {
  const [trail, setTrail] = useState<ItemGroup[]>([]);
  const [selected, setSelected] = useState<ItemLeaf | ItemCustom | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customName, setCustomName] = useState('');
  const [customValue, setCustomValue] = useState(1);
  const [customEffect, setCustomEffect] = useState('');
  const [saveForReuse, setSaveForReuse] = useState(true);

  const reset = () => {
    setTrail([]);
    setSelected(null);
    setQuantity(1);
    setCustomName('');
    setCustomValue(1);
    setCustomEffect('');
    setSaveForReuse(true);
  };

  // Every fresh open starts at the top of the tree.
  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const roots: ItemNode[] = homebrew.length ? [homebrewGroup(homebrew), ...itemTree] : itemTree;
  const current: ItemGroup | null = trail.length ? trail[trail.length - 1] : null;
  const options = current ? current.children : roots;

  const openGroup = (group: ItemGroup) => setTrail(prev => [...prev, group]);

  const openLeaf = (leaf: ItemLeaf) => {
    setSelected(leaf);
    setQuantity(1);
  };

  const openCustom = (node: ItemCustom) => {
    setSelected(node);
    setQuantity(1);
    setCustomName(node.baseName);
    setCustomValue(node.numeric?.defaultValue ?? 1);
    setCustomEffect(node.effectEditable ? node.effect : '');
    setSaveForReuse(true);
  };

  const select = (node: ItemNode) => {
    if (node.type === 'group') openGroup(node);
    else if (node.type === 'item') openLeaf(node);
    else openCustom(node);
  };

  const atRoot = trail.length === 0;

  const goBack = () => {
    if (selected) {
      setSelected(null);
      return;
    }
    setTrail(prev => prev.slice(0, -1));
  };

  const goToTrail = (index: number) => {
    setTrail(prev => prev.slice(0, index + 1));
    setSelected(null);
  };

  const goToRoot = () => {
    setTrail([]);
    setSelected(null);
  };

  const customEffectPreview =
    selected?.type === 'custom' && selected.numeric
      ? selected.effect.split('{value}').join(String(customValue))
      : '';

  const nameCollision = selected?.type === 'custom' && PRINTED_NAMES.has(nameKey(customName));

  const handleAdd = () => {
    if (!selected) return;

    if (selected.type === 'item') {
      onAdd(buildLeafItem(selected, quantity));
      handleClose();
      return;
    }

    const item = buildCustomItem(selected, {
      name: customName,
      value: customValue,
      effect: customEffect,
      quantity,
    });
    if (!item) return;

    onAdd(item, saveForReuse ? buildHomebrewItem(item) ?? undefined : undefined);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-primary flex items-center gap-2">
            <Package className="h-5 w-5" /> Add Item
          </DialogTitle>
          <DialogDescription>
            Follow the branches — the item arrives with its printed values attached.
          </DialogDescription>
        </DialogHeader>

        {/* Where you are in the tree */}
        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground -mt-1">
          <button type="button" onClick={goToRoot} className="hover:text-primary transition-colors">
            All Items
          </button>
          {trail.map((group, index) => (
            <span key={group.id} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              <button
                type="button"
                onClick={() => goToTrail(index)}
                className="hover:text-primary transition-colors"
              >
                {group.label}
              </button>
            </span>
          ))}
          {selected && (
            <span className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">
                {selected.type === 'item' ? selected.label : 'Custom item'}
              </span>
            </span>
          )}
        </div>

        <div className="max-h-[26rem] overflow-y-auto pr-1">
          {!selected && (
            <div className="space-y-1.5">
              {options.map(node => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => select(node)}
                  className="w-full text-left rounded-lg border border-border/70 bg-muted/40 hover:border-primary/60 hover:bg-muted px-3 py-2 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{node.label}</span>
                    {node.type === 'group' ? (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : node.type === 'custom' ? (
                      <Badge variant="outline" className="shrink-0 text-[10px] uppercase tracking-wide">
                        Build
                      </Badge>
                    ) : (
                      <Plus className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                    {node.type === 'group' ? node.hint ?? `${node.children.length} options` : node.detail}
                  </p>
                </button>
              ))}
            </div>
          )}

          {selected?.type === 'item' && (
            <div className="space-y-4 rounded-lg border border-primary/40 bg-primary/5 p-4">
              <div>
                <h3 className="font-medium">{selected.label}</h3>
                <p className="text-sm text-muted-foreground leading-snug">{selected.values.effect}</p>
              </div>
              <QuantityStepper value={quantity} onChange={setQuantity} />
              <Button className="w-full" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" /> Add to inventory
              </Button>
            </div>
          )}

          {selected?.type === 'custom' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="custom-item-name" className="text-xs text-muted-foreground">
                  Name
                </Label>
                <Input
                  id="custom-item-name"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="What is it called?"
                  autoFocus
                />
                {nameCollision && (
                  <p className="text-xs text-destructive">
                    That name belongs to a printed item — choose it from the tree instead.
                  </p>
                )}
              </div>

              {selected.numeric && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{selected.numeric.label}</Label>
                  {selected.numeric.useLadder && (
                    <div className="flex flex-wrap gap-1.5">
                      {RESTORE_LADDER.map(value => (
                        <Button
                          key={value}
                          size="sm"
                          variant={customValue === value ? 'default' : 'outline'}
                          className="h-7 px-2 text-xs"
                          onClick={() => setCustomValue(value)}
                        >
                          {rankLabel(value)} · {value}
                        </Button>
                      ))}
                    </div>
                  )}
                  <Input
                    type="number"
                    min={1}
                    value={customValue}
                    onChange={e => setCustomValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  />
                </div>
              )}

              {selected.numeric ? (
                <div className="rounded-md bg-muted px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Effect</p>
                  <p className="text-sm leading-snug">{customEffectPreview}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Label htmlFor="custom-item-effect" className="text-xs text-muted-foreground">
                    Effect
                  </Label>
                  <Textarea
                    id="custom-item-effect"
                    rows={2}
                    value={customEffect}
                    onChange={e => setCustomEffect(e.target.value)}
                    placeholder="What does it do?"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="save-homebrew"
                  checked={saveForReuse}
                  onCheckedChange={checked => setSaveForReuse(checked === true)}
                />
                <Label htmlFor="save-homebrew" className="text-xs font-normal text-muted-foreground">
                  Save for reuse in Your Homebrew
                </Label>
              </div>

              <QuantityStepper value={quantity} onChange={setQuantity} />

              <Button className="w-full" onClick={handleAdd} disabled={!customName.trim() || nameCollision}>
                <Plus className="h-4 w-4 mr-2" /> Add to inventory
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <Button variant="ghost" size="sm" onClick={goBack} disabled={atRoot && !selected}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <span className="text-xs text-muted-foreground">
            {selected
              ? 'Check the values, then add'
              : current
                ? `${options.length} option${options.length === 1 ? '' : 's'}`
                : 'Pick a category, or open Your Homebrew'}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
