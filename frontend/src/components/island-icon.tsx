import {
  Apple,
  Building2,
  Clock,
  Compass,
  Hash,
  Home,
  Palette,
  PawPrint,
  TreePine,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { Island } from "@/data/islands";

const ICONS: Record<Island["icon"], LucideIcon> = {
  wave: Waves,
  hash: Hash,
  home: Home,
  apple: Apple,
  paw: PawPrint,
  building: Building2,
  tree: TreePine,
  compass: Compass,
  palette: Palette,
  clock: Clock,
};

export function IslandIcon({
  icon,
  className,
}: {
  icon: Island["icon"];
  className?: string;
}) {
  const Icon = ICONS[icon];
  return <Icon className={className} aria-hidden />;
}
