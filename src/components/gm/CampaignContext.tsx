import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Campaign } from "@/types/campaign";
import { campaignStorage } from "@/utils/campaignStorage";

interface CampaignContextValue {
  campaign: Campaign;
  /** Update + persist in one step (mirrors how characters are saved). */
  update: (updater: (c: Campaign) => Campaign) => void;
  reload: () => void;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaign, setCampaign] = useState<Campaign>(() => campaignStorage.load());

  const update = useCallback((updater: (c: Campaign) => Campaign) => {
    setCampaign((prev) => {
      const next = updater(prev);
      campaignStorage.save(next);
      return next;
    });
  }, []);

  const reload = useCallback(() => setCampaign(campaignStorage.load()), []);

  return (
    <CampaignContext.Provider value={{ campaign, update, reload }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign(): CampaignContextValue {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error("useCampaign must be used within a CampaignProvider");
  return ctx;
}
