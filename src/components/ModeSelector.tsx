import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sword, Shield, Users } from "lucide-react";

interface ModeSelectorProps {
  onSelectMode: (mode: 'player' | 'gm') => void;
}

const ENABLE_GM_MODE = true;

export function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-primary">
            Skyrim TTRPG
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose your role to begin
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Player Mode */}
          <Card 
            className="cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/50 hover:shadow-lg"
            onClick={() => onSelectMode('player')}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                <Sword className="w-8 h-8 text-blue-500" />
              </div>
              <CardTitle className="font-cinzel text-2xl">Player Mode</CardTitle>
              <CardDescription>
                Create and manage your character
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Create new characters</li>
                <li>• Manage stats, skills, and equipment</li>
                <li>• Track HP, FP, and abilities</li>
                <li>• Save and load characters</li>
              </ul>
              <Button className="mt-6 w-full" size="lg">
                Enter as Player
              </Button>
            </CardContent>
          </Card>

          {/* GM Mode */}
          {ENABLE_GM_MODE && (
            <Card 
              className="cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/50 hover:shadow-lg"
              onClick={() => onSelectMode('gm')}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-amber-500" />
                </div>
                <CardTitle className="font-cinzel text-2xl">GM Mode</CardTitle>
                <CardDescription>
                  Run combat encounters
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Manage combat encounters</li>
                  <li>• Track initiative and turns</li>
                  <li>• Add enemies from templates</li>
                  <li>• Apply damage, healing, and effects</li>
                </ul>
                <Button className="mt-6 w-full" variant="outline" size="lg">
                  <Shield className="w-4 h-4 mr-2" />
                  Enter as GM
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
