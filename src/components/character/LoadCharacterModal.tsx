import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CharacterSummary } from "@/utils/characterStorage";
import { User, Star, Shield } from "lucide-react";

interface LoadCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: CharacterSummary[];
  onLoadCharacter: (characterId: string) => void;
}

export function LoadCharacterModal({ 
  isOpen, 
  onClose, 
  characters, 
  onLoadCharacter 
}: LoadCharacterModalProps) {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Novice': return 'bg-gray-500/20 text-gray-300';
      case 'Apprentice': return 'bg-green-500/20 text-green-300';
      case 'Adept': return 'bg-red-500/20 text-red-300';
      case 'Expert': return 'bg-purple-500/20 text-purple-300';
      case 'Master': return 'bg-orange-500/20 text-orange-300';
      case 'Legendary': return 'bg-primary/20 text-primary';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-cinzel text-primary">
            Load Character
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {characters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No saved characters found.</p>
            </div>
          ) : (
            characters.map((char) => (
              <Card key={char.id} className="p-4 bg-card-secondary hover:bg-muted/50 transition-colors">
                <Button
                  variant="ghost"
                  className="w-full h-auto p-0 justify-start"
                  onClick={() => onLoadCharacter(char.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      
                      <div className="text-left">
                        <h3 className="font-cinzel font-semibold text-lg">
                          {char.name}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Shield className="w-3 h-3 mr-1" />
                            {char.race}
                          </span>
                          <span>•</span>
                          <span className="flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            {char.standingStone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Badge className={getTierColor(char.level)}>
                      {char.level}
                    </Badge>
                  </div>
                </Button>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}