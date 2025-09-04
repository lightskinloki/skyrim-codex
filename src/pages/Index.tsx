import { useState, useEffect } from "react";
import { CharacterDashboard } from "@/components/character/CharacterDashboard";
import { WelcomeScreen } from "@/components/character/WelcomeScreen";
import { LoadCharacterModal } from "@/components/character/LoadCharacterModal";
import { Character } from "@/types/character";
import { characterStorage } from "@/utils/characterStorage";
import { sampleCharacter } from "@/data/sampleCharacter";

const Index = () => {
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showLoadModal, setShowLoadModal] = useState(false);

  useEffect(() => {
    // Check for existing characters and last loaded character
    const hasCharacters = characterStorage.hasCharacters();
    
    if (hasCharacters) {
      const lastLoadedId = characterStorage.getLastLoadedId();
      if (lastLoadedId) {
        const lastCharacter = characterStorage.getCharacter(lastLoadedId);
        if (lastCharacter) {
          setCurrentCharacter(lastCharacter);
          setShowWelcome(false);
          return;
        }
      }
    }
    
    // If no characters or no last loaded, show welcome screen
    setShowWelcome(true);
  }, []);

  const handleCreateNewCharacter = (newCharacter: Character) => {
    characterStorage.saveCharacter(newCharacter);
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

  const handleUpdateCharacter = (updatedCharacter: Character) => {
    characterStorage.saveCharacter(updatedCharacter);
    setCurrentCharacter(updatedCharacter);
  };

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

  if (!currentCharacter) {
    return <div>Loading...</div>;
  }

  return (
    <CharacterDashboard 
      character={currentCharacter} 
      onUpdateCharacter={handleUpdateCharacter}
    />
  );
};

export default Index;
