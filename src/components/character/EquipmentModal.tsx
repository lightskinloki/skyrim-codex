import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Edit } from "lucide-react";
import { Equipment, Character } from "@/types/character";
import { useToast } from "@/hooks/use-toast";

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onUpdateCharacter: (character: Character) => void;
}

export function EquipmentModal({ isOpen, onClose, character, onUpdateCharacter }: EquipmentModalProps) {
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [newItem, setNewItem] = useState<Partial<Equipment>>({
    name: "",
    type: "weapon",
    damage: undefined,
    dr: undefined,
    description: ""
  });
  const { toast } = useToast();

  const handleAddItem = () => {
    if (!newItem.name?.trim()) return;

    const equipment: Equipment = {
      id: Date.now().toString(),
      name: newItem.name,
      type: newItem.type as Equipment['type'],
      damage: newItem.damage,
      dr: newItem.dr,
      description: newItem.description
    };

    const updatedCharacter = {
      ...character,
      equipment: [...character.equipment, equipment]
    };

    onUpdateCharacter(updatedCharacter);
    setNewItem({ name: "", type: "weapon", damage: undefined, dr: undefined, description: "" });
    
    toast({
      title: "Equipment Added",
      description: `${equipment.name} has been added to your equipment.`,
    });
  };

  const handleEditItem = (item: Equipment) => {
    const updatedCharacter = {
      ...character,
      equipment: character.equipment.map(eq => 
        eq.id === item.id ? item : eq
      )
    };

    onUpdateCharacter(updatedCharacter);
    setEditingItem(null);
    
    toast({
      title: "Equipment Updated",
      description: `${item.name} has been updated.`,
    });
  };

  const handleDeleteItem = (id: string) => {
    const updatedCharacter = {
      ...character,
      equipment: character.equipment.filter(eq => eq.id !== id)
    };

    onUpdateCharacter(updatedCharacter);
    
    toast({
      title: "Equipment Removed",
      description: "Equipment has been removed from your inventory.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Equipment Management</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Equipment */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Add New Equipment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="item-name">Name</Label>
                  <Input
                    id="item-name"
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Equipment name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="item-type">Type</Label>
                  <Select value={newItem.type} onValueChange={(value) => setNewItem(prev => ({ ...prev, type: value as Equipment['type'] }))}>
                    <SelectTrigger>
                      <SelectValue />
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
                      onChange={(e) => setNewItem(prev => ({ ...prev, damage: parseInt(e.target.value) || undefined }))}
                      placeholder="Damage value"
                    />
                  </div>
                )}
                
                {(newItem.type === "armor" || newItem.type === "shield") && (
                  <div>
                    <Label htmlFor="item-dr">Damage Reduction</Label>
                    <Input
                      id="item-dr"
                      type="number"
                      value={newItem.dr || ""}
                      onChange={(e) => setNewItem(prev => ({ ...prev, dr: parseInt(e.target.value) || undefined }))}
                      placeholder="DR value"
                    />
                  </div>
                )}
                
                <div className="flex items-end">
                  <Button onClick={handleAddItem} disabled={!newItem.name?.trim()}>
                    Add Equipment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Equipment */}
          <div>
            <h3 className="font-semibold mb-4">Current Equipment</h3>
            <div className="space-y-2">
              {character.equipment.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    {editingItem?.id === item.id ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={editingItem.name}
                            onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                          />
                        </div>
                        
                        <div>
                          <Label>Type</Label>
                          <Select 
                            value={editingItem.type} 
                            onValueChange={(value) => setEditingItem(prev => prev ? { ...prev, type: value as Equipment['type'] } : null)}
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
                        </div>
                        
                        {editingItem.type === "weapon" && (
                          <div>
                            <Label>Damage</Label>
                            <Input
                              type="number"
                              value={editingItem.damage || ""}
                              onChange={(e) => setEditingItem(prev => prev ? { ...prev, damage: parseInt(e.target.value) || undefined } : null)}
                            />
                          </div>
                        )}
                        
                        {(editingItem.type === "armor" || editingItem.type === "shield") && (
                          <div>
                            <Label>DR</Label>
                            <Input
                              type="number"
                              value={editingItem.dr || ""}
                              onChange={(e) => setEditingItem(prev => prev ? { ...prev, dr: parseInt(e.target.value) || undefined } : null)}
                            />
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleEditItem(editingItem)}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span className="capitalize">{item.type}</span>
                            {item.damage && <span>{item.damage} DMG</span>}
                            {item.dr && <span>{item.dr} DR</span>}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingItem(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {character.equipment.length === 0 && (
                <p className="text-muted-foreground italic text-center py-8">
                  No equipment currently equipped. Add some equipment above to get started.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}