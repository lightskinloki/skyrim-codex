import { useState } from "react";
import { CharacterDashboard } from "@/components/character/CharacterDashboard";
import { WelcomeScreen } from "@/components/character/WelcomeScreen";
import { LoadCharacterModal } from "@/components/character/LoadCharacterModal";
import { ModeSelector } from "@/components/ModeSelector";
import { GMDashboard } from "@/components/gm/GMDashboard";
import { Character } from "@/types/character";
import { characterStorage } from "@/utils/characterStorage";
import { useToast } from "@/hooks/use-toast";

// A scanned QR link (`/?join=CODE`) goes straight to Player Mode and joins the
// table once a character is loaded. The code is taken out of the address bar so
// a later reload doesn't rejoin without the player asking.
function takeJoinCode(): string | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('join');
  if (code) {
    params.delete('join');
    const rest = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''));
  }
  return code;
}

const Index = () => {
  const [joinCode] = useState(takeJoinCode);
  const [appMode, setAppMode] = useState<'select' | 'player' | 'gm'>(joinCode ? 'player' : 'select');
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const { toast } = useToast();

  const handleCreateNewCharacter = (newCharacter: Character) => {
    const result = characterStorage.saveCharacter(newCharacter);
    if (!result.success) {
      toast({
        title: "Save Failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }
    setCurrentCharacter(newCharacter);
    setShowWelcome(false);
  };

  const handleLoadCharacter = () => {
    setShowLoadModal(true);
  };

  const handleSelectCharacter = (characterId: string) => {
    const character = characterStorage.getCharacter(characterId);
    if (character) {
      setCurrentCharacter(character);
      setShowWelcome(false);
      setShowLoadModal(false);
    }
  };

  const handleCreateNewFromDashboard = () => {
    setCurrentCharacter(null);
    setShowWelcome(true);
  };

  const handleEndSession = () => {
    setCurrentCharacter(null);
    setShowWelcome(false);
    setAppMode('select');
  };

  const handleUpdateCharacter = (updatedCharacter: Character) => {
    const result = characterStorage.saveCharacter(updatedCharacter);
    if (!result.success) {
      toast({
        title: "Save Failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }
    setCurrentCharacter(updatedCharacter);
  };

  // 1. Mode selection screen
  if (appMode === 'select') {
    return <ModeSelector onSelectMode={setAppMode} />;
  }

  // 2. GM Mode
  if (appMode === 'gm') {
    return <GMDashboard onExit={() => setAppMode('select')} />;
  }

  // 3. Player Mode - Welcome screen
  if (showWelcome) {
    return (
      <>
        <WelcomeScreen
          onCreateNew={handleCreateNewCharacter}
          onLoadCharacter={handleLoadCharacter}
          hasExistingCharacters={characterStorage.hasCharacters()}
        />
        <LoadCharacterModal
          isOpen={showLoadModal}
          onClose={() => setShowLoadModal(false)}
          characters={characterStorage.getCharacterSummaries()}
          onLoadCharacter={handleSelectCharacter}
        />
      </>
    );
  }

  // 4. Player Mode - Character dashboard
  if (!currentCharacter) {
    return <div>Loading...</div>;
  }

  return (
    <CharacterDashboard
      character={currentCharacter}
      onUpdateCharacter={handleUpdateCharacter}
      onCreateNewCharacter={handleCreateNewFromDashboard}
      onEndSession={handleEndSession}
      joinCode={joinCode}
    />
  );
};

export default Index;
