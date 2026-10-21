import { useEffect, useState } from "react";
import { base44 } from "../api/base44Client";

// Public data for the landing page: the live rate card (public read) and counts-only stats (a service-role function).
// Each has its own loading and failure state; neither is ever faked.
function useLoad(fn) {
  const [state, setState] = useState({ status: "loading", data: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setState((s) => ({ status: "loading", data: s.data }));
    fn().then(
      (data) => live && setState({ status: "ready", data }),
      () => live && setState({ status: "error", data: null }),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  return { ...state, retry: () => setTick((t) => t + 1) };
}

export const useRateCard = () => useLoad(async () => (await base44.entities.RateCard.list())[0] ?? null);

export const useMaker = () => useLoad(async () => (await base44.entities.Maker.list())[0] ?? null);

export const useStats = () =>
  useLoad(async () => {
    const res = await base44.functions.invoke("publicStats", {});
    return res.data ?? res;
  });

// The real agent's WhatsApp link, from the SDK. If it cannot be built the button says so instead of linking nowhere.
export function whatsappUrl() {
  try {
    return base44.agents.getWhatsAppConnectURL("inspo_desk") || null;
  } catch {
    return null;
  }
}
