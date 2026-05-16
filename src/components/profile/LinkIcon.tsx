import {
  AtSign,
  BookOpen,
  Briefcase,
  Calendar,
  Camera,
  Code,
  Coffee,
  CreditCard,
  FileText,
  Gift,
  Globe,
  Hash,
  Headphones,
  Heart,
  Image as ImageIcon,
  Link as LinkIconBase,
  type LucideIcon,
  Mail,
  MapPin,
  MessageCircle,
  Music,
  Music2,
  Newspaper,
  Phone,
  Play,
  Podcast,
  Rss,
  Send,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Video,
} from "lucide-react";
import { isLinkIcon, type LinkIcon as LinkIconName } from "@/lib/links";

const ICONS: Record<LinkIconName, LucideIcon> = {
  link: LinkIconBase,
  globe: Globe,
  "at-sign": AtSign,
  hash: Hash,
  music: Music,
  "music-2": Music2,
  headphones: Headphones,
  podcast: Podcast,
  play: Play,
  video: Video,
  camera: Camera,
  image: ImageIcon,
  mail: Mail,
  phone: Phone,
  "message-circle": MessageCircle,
  send: Send,
  "shopping-bag": ShoppingBag,
  "shopping-cart": ShoppingCart,
  store: Store,
  "credit-card": CreditCard,
  calendar: Calendar,
  "map-pin": MapPin,
  "file-text": FileText,
  "book-open": BookOpen,
  newspaper: Newspaper,
  rss: Rss,
  heart: Heart,
  star: Star,
  coffee: Coffee,
  gift: Gift,
  briefcase: Briefcase,
  code: Code,
};

interface Props {
  name: string | null;
  className?: string;
  size?: number;
}

export function LinkIcon({ name, className, size = 18 }: Props) {
  const resolved = isLinkIcon(name) ? ICONS[name] : LinkIconBase;
  const Icon = resolved;
  return <Icon className={className} size={size} aria-hidden />;
}
