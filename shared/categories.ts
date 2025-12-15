import { 
  FileSignature, Shield, FileQuestion,
  Landmark, Briefcase, Building2, Stethoscope, Home, Car, 
  GraduationCap, Baby, PiggyBank, ShoppingBag, Plane, Euro,
  type LucideIcon
} from "lucide-react";

export interface CategoryConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  badgeColor: string;
  borderColor: string;
}

export const categoryConfig: Record<string, CategoryConfig> = {
  'Finanzen & Banken': { 
    icon: Landmark, 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    badgeColor: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  'Versicherungen': { 
    icon: Shield, 
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    badgeColor: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800'
  },
  'Steuern & Buchhaltung': { 
    icon: Euro, 
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    badgeColor: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  'Arbeit & Gehalt': { 
    icon: Briefcase, 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    badgeColor: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  'Verträge & Abos': { 
    icon: FileSignature, 
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    badgeColor: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-200 dark:border-indigo-800'
  },
  'Behörden & Amtliches': { 
    icon: Building2, 
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-900',
    badgeColor: 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400',
    borderColor: 'border-slate-200 dark:border-slate-700'
  },
  'Gesundheit & Arzt': { 
    icon: Stethoscope, 
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950',
    badgeColor: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  'Wohnen & Immobilien': { 
    icon: Home, 
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    badgeColor: 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  'Auto & Mobilität': { 
    icon: Car, 
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950',
    badgeColor: 'bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400',
    borderColor: 'border-cyan-200 dark:border-cyan-800'
  },
  'Schule & Ausbildung': { 
    icon: GraduationCap, 
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950',
    badgeColor: 'bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400',
    borderColor: 'border-violet-200 dark:border-violet-800'
  },
  'Familie & Kinder': { 
    icon: Baby, 
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-950',
    badgeColor: 'bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400',
    borderColor: 'border-pink-200 dark:border-pink-800'
  },
  'Rente & Vorsorge': { 
    icon: PiggyBank, 
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950',
    badgeColor: 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400',
    borderColor: 'border-teal-200 dark:border-teal-800'
  },
  'Einkäufe & Online-Bestellungen': { 
    icon: ShoppingBag, 
    color: 'text-lime-600 dark:text-lime-400',
    bgColor: 'bg-lime-50 dark:bg-lime-950',
    badgeColor: 'bg-lime-50 dark:bg-lime-950 text-lime-600 dark:text-lime-400',
    borderColor: 'border-lime-200 dark:border-lime-800'
  },
  'Reisen & Freizeit': { 
    icon: Plane, 
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-50 dark:bg-sky-950',
    badgeColor: 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400',
    borderColor: 'border-sky-200 dark:border-sky-800'
  },
  'Sonstiges / Privat': { 
    icon: FileQuestion, 
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    badgeColor: 'bg-muted text-muted-foreground',
    borderColor: 'border-border'
  },
};

export const allCategories = Object.keys(categoryConfig);

export function getCategoryConfig(category: string): CategoryConfig {
  return categoryConfig[category] || categoryConfig['Sonstiges / Privat'];
}

export function getCategoryBadgeClasses(category: string): string {
  const config = getCategoryConfig(category);
  return `${config.badgeColor} ${config.borderColor}`;
}

export function getCategoryBorderColor(category: string): string {
  const borderMap: Record<string, string> = {
    'Finanzen & Banken': 'border-l-blue-500',
    'Versicherungen': 'border-l-emerald-500',
    'Steuern & Buchhaltung': 'border-l-amber-500',
    'Arbeit & Gehalt': 'border-l-purple-500',
    'Verträge & Abos': 'border-l-indigo-500',
    'Behörden & Amtliches': 'border-l-slate-500',
    'Gesundheit & Arzt': 'border-l-red-500',
    'Wohnen & Immobilien': 'border-l-orange-500',
    'Auto & Mobilität': 'border-l-cyan-500',
    'Schule & Ausbildung': 'border-l-violet-500',
    'Familie & Kinder': 'border-l-pink-500',
    'Rente & Vorsorge': 'border-l-teal-500',
    'Einkäufe & Online-Bestellungen': 'border-l-lime-500',
    'Reisen & Freizeit': 'border-l-sky-500',
    'Sonstiges / Privat': 'border-l-gray-400',
  };
  return borderMap[category] || 'border-l-gray-400';
}
