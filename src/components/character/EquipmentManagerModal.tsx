import { useState, useMemo } from "react";
import { Character, Equipment } from "@/types/character";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, X, Edit2 } from "lucide-react";
import { allOfficialEquipment } from "@/data/equipment";

interface EquipmentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onUpdateCharacter: (character: Character) => void;
}

export function EquipmentManagerModal({ isOpen, onClose, character, onUpdateCharacter }: EquipmentManagerModalProps) {
  const { toast } = useToast();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<Equipment>>({
    name: "",
    type: "weapon",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter suggestions based on search query
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return allOfficialEquipment.filter(item =>
      item.name.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [searchQuery]);

  const handleSelectSuggestion = (item: typeof allOfficialEquipment[0]) => {
    setNewItem({
      name: item.name,
      type: item.type,
      damage: item.damage,
      dr: item.dr,
      description: item.description,
    });
    setSearchQuery(item.name);
    setShowSuggestions(false);
  };

  const handleAddItem = () => {
    if (!newItem.name) {
      toast({
        title: "Error",
        description: "Please enter an item name",
        variant: "destructive",
      });
      return;
    }

    const item: Equipment = {
      id: `item-${Date.now()}`,
      name: newItem.name,
      type: newItem.type || "weapon",
      damage: newItem.damage,
      dr: newItem.dr,
      description: newItem.description,
    };

    onUpdateCharacter({
      ...character,
      equipment: [...character.equipment, item],
    });

    setNewItem({ name: "", type: "weapon" });
    setSearchQuery("");
    toast({
      title: "Success",
      description: `${item.name} added to equipment`,
    });
  };

  const handleEditItem = (itemId: string, updates: Partial<Equipment>) => {
    const updatedEquipment = character.equipment.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    onUpdateCharacter({
      ...character,
      equipment: updatedEquipment,
    });
    setEditingItemId(null);
    toast({
      title: "Success",
      description: "Equipment updated",
    });
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedEquipment = character.equipment.filter(item => item.id !== itemId);
    onUpdateCharacter({
      ...character,
      equipment: updatedEquipment,
    });
    toast({
      title: "Success",
      description: "Equipment removed",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Equipment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Equipment Section */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Equipment
              </h3>
              
              <div className="grid gap-4">
                <div className="relative">
                  <Label htmlFor="item-name">Name</Label>
                  <Popover open={showSuggestions && suggestions.length > 0} onOpenChange={setShowSuggestions}>
                    <PopoverTrigger asChild>
                      <Input
                        id="item-name"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setNewItem({ ...newItem, name: e.target.value });
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Type to search official items or enter custom name..."
                        className="w-full"
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <div className="max-h-60 overflow-y-auto">
                        {suggestions.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSelectSuggestion(item)}
                            className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {item.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="item-type">Type</Label>
                  <Select
                    value={newItem.type}
                    onValueChange={(value: "weapon" | "armor" | "shield") =>
                      setNewItem({ ...newItem, type: value })
                    }
                  >
                    <SelectTrigger id="item-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weapon">Weapon</SelectItem>
                      <SelectItem value="armor">Armor</SelectItem>
                      <SelectItem value="shield">Shield</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newItem.type === "weapon" && (
                  <div>
                    <Label htmlFor="item-damage">Damage</Label>
                    <Input
                      id="item-damage"
                      type="number"
                      value={newItem.damage || ""}
                      onChange={(e) =>
                        setNewItem({ ...newItem, damage: parseInt(e.target.value) || undefined })
                      }
                      placeholder="Enter damage value"
                    />
                  </div>
                )}

                {(newItem.type === "armor" || newItem.type === "shield") && (
                  <div>
                    <Label htmlFor="item-dr">Damage Reduction (DR)</Label>
                    <Input
                      id="item-dr"
                      type="number"
                      value={newItem.dr || ""}
                      onChange={(e) =>
                        setNewItem({ ...newItem, dr: parseInt(e.target.value) || undefined })
                      }
                      placeholder="Enter DR value"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="item-description">Description</Label>
                  <Input
                    id="item-description"
                    value={newItem.description || ""}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Enter item description or properties"
                  />
                </div>

                <Button onClick={handleAddItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Equipment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Equipment Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Current Equipment</h3>
            <div className="grid gap-3">
              {character.equipment.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No equipment yet</p>
              ) : (
                character.equipment.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="pt-4">
                      {editingItemId === item.id ? (
                        <div className="space-y-3">
                          <Input
                            value={item.name}
                            onChange={(e) => handleEditItem(item.id, { name: e.target.value })}
                            placeholder="Name"
                          />
                          <Select
                            value={item.type}
                            onValueChange={(value: "weapon" | "armor" | "shield") =>
                              handleEditItem(item.id, { type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weapon">Weapon</SelectItem>
                              <SelectItem value="armor">Armor</SelectItem>
                              <SelectItem value="shield">Shield</SelectItem>
                            </SelectContent>
                          </Select>
                          {item.type === "weapon" && (
                            <Input
                              type="number"
                              value={item.damage || ""}
                              onChange={(e) =>
                                handleEditItem(item.id, {
                                  damage: parseInt(e.target.value) || undefined,
                                })
                              }
                              placeholder="Damage"
                            />
                          )}
                          {(item.type === "armor" || item.type === "shield") && (
                            <Input
                              type="number"
                              value={item.dr || ""}
                              onChange={(e) =>
                                handleEditItem(item.id, { dr: parseInt(e.target.value) || undefined })
                              }
                              placeholder="DR"
                            />
                          )}
                          <Input
                            value={item.description || ""}
                            onChange={(e) => handleEditItem(item.id, { description: e.target.value })}
                            placeholder="Description"
                          />
                          <div className="flex gap-2">
                            <Button onClick={() => setEditingItemId(null)} variant="outline" size="sm">
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{item.name}</h4>
                              <span className="text-xs px-2 py-1 bg-accent rounded-full capitalize">
                                {item.type}
                              </span>
                            </div>
                            <div className="flex gap-3 text-sm text-muted-foreground mb-1">
                              {item.type === "weapon" && item.damage && (
                                <span>Damage: {item.damage}</span>
                              )}
                              {(item.type === "armor" || item.type === "shield") && item.dr && (
                                <span>DR: {item.dr}</span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItemId(item.id)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
