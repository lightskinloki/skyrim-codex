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

  const parsedAmount = parseInt(apAmount);
  const isValid = !isNaN(parsedAmount) && parsedAmount >= 1 && parsedAmount <= 100;

  const handleSubmit = (sign: 1 | -1) => {
    if (!isValid) return;
    onGrantAP(parsedAmount * sign);
    setApAmount("1");
    onClose();
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
            Manage Advancement Points
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="ap-amount" className="text-sm font-medium">
              Amount (1–100):
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
              variant="outline"
              onClick={() => handleSubmit(-1)}
              disabled={!isValid}
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              Subtract AP
            </Button>
            <Button onClick={() => handleSubmit(1)} disabled={!isValid}>
              Grant AP
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
