import { useState } from "react";
import { CharacterDashboard } from "@/components/character/CharacterDashboard";
import { Character } from "@/types/character";
import { sampleCharacter } from "@/data/sampleCharacter";

const Index = () => {
  const [character, setCharacter] = useState<Character>(sampleCharacter);

  const handleUpdateCharacter = (updatedCharacter: Character) => {
    setCharacter(updatedCharacter);
  };

  return (
    <CharacterDashboard 
      character={character} 
      onUpdateCharacter={handleUpdateCharacter}
    />
  );
};

export default Index;
