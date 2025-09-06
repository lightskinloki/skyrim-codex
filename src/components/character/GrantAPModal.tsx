import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GrantAPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrantAP: (amount: number) => void;
}

export function GrantAPModal({ isOpen, onClose, onGrantAP }: GrantAPModalProps) {
  const [apAmount, setApAmount] = useState<string>("1");

  const handleGrant = () => {
    const amount = parseInt(apAmount);
    if (amount > 0 && amount <= 100) {
      onGrantAP(amount);
      setApAmount("1");
      onClose();
    }
  };

  const handleCancel = () => {
    setApAmount("1");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-primary">
            Grant Advancement Points
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="ap-amount" className="text-sm font-medium">
              Amount of AP to grant (1-100):
            </Label>
            <Input
              id="ap-amount"
              type="number"
              min="1"
              max="100"
              value={apAmount}
              onChange={(e) => setApAmount(e.target.value)}
              className="mt-1"
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleGrant} 
              disabled={!apAmount || parseInt(apAmount) <= 0 || parseInt(apAmount) > 100}
            >
              Grant AP
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}