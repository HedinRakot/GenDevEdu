import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bookmark,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Copy,
  Flame,
  GraduationCap,
  House,
  LayoutGrid,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Pencil,
  Play,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
  X,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';

/**
 * Zentrales Icon-System (Lucide Line-Icons, „Akademie"-Look).
 * Ersetzt Emoji app-weit. Screens/Navigation importieren NUR `Icon`, nie lucide
 * direkt – so bleibt das Icon-Set an einer Stelle austauschbar.
 */
const ICONS = {
  // Navigation
  dashboard: LayoutGrid,
  courses: BookOpen,
  chat: Bot,
  snippets: Bookmark,
  settings: Settings,
  home: House,
  users: Users,
  // Gamification / Status
  streak: Flame,
  challenge: Zap,
  logo: GraduationCap,
  certificate: Award,
  // Aktionen
  add: Plus,
  close: X,
  copy: Copy,
  edit: Pencil,
  delete: Trash2,
  search: Search,
  logout: LogOut,
  play: Play,
  mail: Mail,
  lock: Lock,
  clock: Clock,
  // Richtungen
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-down': ChevronDown,
  // Zustände
  check: Check,
  'check-circle': CheckCircle2,
  'x-circle': XCircle,
  circle: Circle,
  message: MessageSquare,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, color, strokeWidth = 1.75 }: IconProps) {
  const { colors } = useTheme();
  const LucideCmp = ICONS[name];
  return <LucideCmp size={size} color={color ?? colors.textPrimary} strokeWidth={strokeWidth} />;
}
