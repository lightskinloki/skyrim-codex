import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BookText } from "lucide-react";

interface SessionNotesProps {
  characterId: string;
}

export function SessionNotes({ characterId }: SessionNotesProps) {
  const [notes, setNotes] = useState<string>("");
  const storageKey = `skyrimTTRPG_notes_${characterId}`;

  // Load existing notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(storageKey);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [storageKey]);

  // Auto-save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem(storageKey, notes);
  }, [notes, storageKey]);

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
