import {
  Apple,
  Compass,
  Hash,
  Home,
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
  tree: TreePine,
  compass: Compass,
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
