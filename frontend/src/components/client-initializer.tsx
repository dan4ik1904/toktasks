"use client";

import { PlacementModal } from "@/components/placement-modal";
import { SyncManager } from "@/components/sync-manager";
import { useStore } from "@/store/use-store";

export function ClientInitializer() {
  // Тест жёстко привязан к аккаунту: смена TG id пересоздаёт модалку
  // с чистого листа (иначе новый аккаунт продолжает чужой прогресс теста).
  const tgId = useStore((s) => s.tgId);
  return (
    <>
      <SyncManager />
      <PlacementModal key={tgId} />
    </>
  );
}
