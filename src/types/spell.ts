export interface Spell {
  name: string;
  school: string;
  tier: 'Novice' | 'Apprentice' | 'Adept' | 'Expert' | 'Master';
  fpCost: number;
  description: string;
}