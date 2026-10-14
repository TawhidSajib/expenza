import React from 'react';
import {
  Utensils,
  Coffee,
  ShoppingCart,
  Home,
  Car,
  Plane,
  Zap,
  Tv,
  Smartphone,
  HeartPulse,
  GraduationCap,
  Briefcase,
  Dumbbell,
  Music,
  Film,
  Gift,
  Tag,
  Sparkles,
  Shield,
  Laptop,
  Fuel,
  ShoppingBag,
  Flame,
  Shirt,
  Baby,
  Smile,
  LucideIcon
} from 'lucide-react';

export interface IconOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORY_ICONS: IconOption[] = [
  { id: 'Utensils', label: 'Food & Dining', icon: Utensils },
  { id: 'Coffee', label: 'Cafe & Drinks', icon: Coffee },
  { id: 'ShoppingCart', label: 'Groceries', icon: ShoppingCart },
  { id: 'ShoppingBag', label: 'Shopping', icon: ShoppingBag },
  { id: 'Home', label: 'Housing & Rent', icon: Home },
  { id: 'Car', label: 'Transport & Cab', icon: Car },
  { id: 'Fuel', label: 'Fuel & Gas', icon: Fuel },
  { id: 'Plane', label: 'Travel & Trips', icon: Plane },
  { id: 'Zap', label: 'Utilities & Bills', icon: Zap },
  { id: 'Smartphone', label: 'Phone & Internet', icon: Smartphone },
  { id: 'Laptop', label: 'Electronics & Software', icon: Laptop },
  { id: 'Tv', label: 'Subscriptions', icon: Tv },
  { id: 'Film', label: 'Entertainment', icon: Film },
  { id: 'Music', label: 'Music & Audio', icon: Music },
  { id: 'Dumbbell', label: 'Gym & Fitness', icon: Dumbbell },
  { id: 'HeartPulse', label: 'Health & Medical', icon: HeartPulse },
  { id: 'GraduationCap', label: 'Education & Courses', icon: GraduationCap },
  { id: 'Briefcase', label: 'Work & Business', icon: Briefcase },
  { id: 'Shirt', label: 'Apparel & Clothing', icon: Shirt },
  { id: 'Baby', label: 'Family & Kids', icon: Baby },
  { id: 'Gift', label: 'Gifts & Charity', icon: Gift },
  { id: 'Flame', label: 'Personal Care', icon: Flame },
  { id: 'Sparkles', label: 'Luxury & Lifestyle', icon: Sparkles },
  { id: 'Smile', label: 'Leisure', icon: Smile },
  { id: 'Shield', label: 'Insurance & Security', icon: Shield },
  { id: 'Tag', label: 'Miscellaneous', icon: Tag },
];

export const CATEGORY_COLOR_PALETTE = [
  { id: 'neon-green', name: 'Neon Green', hex: '#00FF66', border: 'border-[#00FF66]', text: 'text-[#00FF66]', bg: 'bg-[#00FF66]/10' },
  { id: 'electric-lime', name: 'Electric Lime', hex: '#84CC16', border: 'border-lime-500', text: 'text-lime-400', bg: 'bg-lime-500/10' },
  { id: 'cyan', name: 'Cyan Glow', hex: '#06B6D4', border: 'border-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 'sky', name: 'Sky Blue', hex: '#38BDF8', border: 'border-sky-400', text: 'text-sky-400', bg: 'bg-sky-500/10' },
  { id: 'yellow', name: 'Neon Amber', hex: '#FACC15', border: 'border-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 'orange', name: 'Vivid Orange', hex: '#FB923C', border: 'border-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/10' },
  { id: 'pink', name: 'Hot Pink', hex: '#F43F5E', border: 'border-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10' },
  { id: 'purple', name: 'Cyber Purple', hex: '#A855F7', border: 'border-purple-500', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'emerald', name: 'Deep Emerald', hex: '#10B981', border: 'border-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
];

export const getCategoryIconComponent = (iconId: string): LucideIcon => {
  const found = CATEGORY_ICONS.find((item) => item.id === iconId);
  return found ? found.icon : Tag;
};
