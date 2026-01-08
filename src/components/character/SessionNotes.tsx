import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BookText } from "lucide-react";
import { characterStorage } from "@/lib/characterStorage";

interface SessionNotesProps {
  characterId: string;
}

export function SessionNotes({ characterId }: SessionNotesProps) {
  const [notes, setNotes] = useState<string>("");

  // Load notes from the character object
  useEffect(() => {
    const character = characterStorage.getCharacter(characterId);
    if (character?.notes) {
      setNotes(character.notes);
    }
  }, [characterId]);

  // Auto-save notes to the character object
  useEffect(() => {
    const character = characterStorage.getCharacter(characterId);
    if (character) {
      const updatedCharacter = {
        ...character,
        notes: notes
      };
      characterStorage.saveCharacter(updatedCharacter);
    }
  }, [notes, characterId]);

  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(event.target.value);
  };

  return (
    <Card className="p-6 bg-card-secondary">
      <h3 className="font-cinzel font-semibold text-primary mb-4 flex items-center">
        <BookText className="w-5 h-5 mr-2" />
        Session Notes
      </h3>
      
      <div className="space-y-3">
        <Textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Write your session notes here..."
          className="min-h-[120px] bg-muted border-muted-foreground/20 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary resize-none"
        />
        
        <p className="text-xs text-muted-foreground italic">
          Notes are saved automatically as you type.
        </p>
      </div>
    </Card>
  );
}
