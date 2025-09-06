import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, AlertTriangle } from "lucide-react";

interface FPSpendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionName: string;
  fpCost: number;
  currentFP: number;
}

export function FPSpendModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  actionName, 
  fpCost, 
  currentFP 
}: FPSpendModalProps) {
  const [error, setError] = useState<string | null>(null);
  const canAfford = currentFP >= fpCost;

  const handleConfirm = () => {
    if (!canAfford) {
      setError("Not enough Focus Points!");
      return;
    }
    
    setError(null);
    onConfirm();
    onClose();
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-fatigue" />
            Spend Focus Points
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-lg">
              <span className="font-semibold">{actionName}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              This will cost <span className="font-bold text-fatigue">{fpCost} FP</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Current FP: {currentFP} / Remaining after: {currentFP - fpCost}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!canAfford}
            className="bg-fatigue hover:bg-fatigue/80"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}