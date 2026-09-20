"use client";

import { PlacementModal } from "@/components/placement-modal";
import { SyncManager } from "@/components/sync-manager";

export function ClientInitializer() {
  return (
    <>
      <SyncManager />
      <PlacementModal />
    </>
  );
}
