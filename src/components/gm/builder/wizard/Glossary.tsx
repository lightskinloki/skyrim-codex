// "What do these words mean?" — always one click away in the wizard header.
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { BookOpen } from "lucide-react";
import { GLOSSARY } from "./copy";

export function Glossary() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost"><BookOpen className="h-4 w-4 mr-1" /> What do these words mean?</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Words you'll see here</DialogTitle>
          <DialogDescription>You don't need to know any of these ahead of time. This is just a quick reference.</DialogDescription>
        </DialogHeader>
        <dl className="space-y-3">
          {GLOSSARY.map((g) => (
            <div key={g.term}>
              <dt className="text-sm font-semibold">{g.term}</dt>
              <dd className="text-sm text-muted-foreground">{g.meaning}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
