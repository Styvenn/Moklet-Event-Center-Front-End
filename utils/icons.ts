import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export function getCategoryIcon(name: string): IoniconsName {
  const lower = (name || '').toLowerCase();
  if (lower.includes('futsal') || lower.includes('bola') || lower.includes('football')) return 'football-outline';
  if (lower.includes('basket')) return 'basketball-outline';
  if (lower.includes('esport') || lower.includes('e-sport') || lower.includes('game') || lower.includes('mobile')) return 'game-controller-outline';
  if (lower.includes('tari') || lower.includes('musik') || lower.includes('seni') || lower.includes('band')) return 'musical-notes-outline';
  if (lower.includes('robot') || lower.includes('it') || lower.includes('koding') || lower.includes('web')) return 'hardware-chip-outline';
  if (lower.includes('voli')) return 'fitness-outline';
  if (lower.includes('lari') || lower.includes('atletik')) return 'walk-outline';
  if (lower.includes('tarik tambang')) return 'people-outline';
  if (lower.includes('badminton') || lower.includes('bulutangkis')) return 'tennisball-outline';
  return 'trophy-outline';
}

interface CategoryIconStyled {
  name: IoniconsName;
  bg: string;
  color: string;
}

export function getCategoryIconStyled(name: string): CategoryIconStyled {
  const lower = (name || '').toLowerCase();
  if (lower.includes('esport') || lower.includes('e-sport') || lower.includes('game') || lower.includes('mobile')) {
    return { name: 'game-controller', bg: '#FEF3C7', color: '#D97706' };
  }
  if (lower.includes('poster') || lower.includes('desain') || lower.includes('art') || lower.includes('lukis')) {
    return { name: 'color-palette', bg: '#FCE7F3', color: '#DB2777' };
  }
  if (lower.includes('basket')) {
    return { name: 'basketball', bg: '#FEE2E2', color: '#DC2626' };
  }
  if (lower.includes('musik') || lower.includes('band') || lower.includes('acoustic') || lower.includes('lagu') || lower.includes('tari')) {
    return { name: 'musical-notes', bg: '#FCE7F3', color: '#B81414' };
  }
  if (lower.includes('futsal') || lower.includes('bola')) {
    return { name: 'football', bg: '#DCFCE7', color: '#166534' };
  }
  if (lower.includes('robot') || lower.includes('it') || lower.includes('web')) {
    return { name: 'hardware-chip', bg: '#E0E7FF', color: '#4F46E5' };
  }
  return { name: 'trophy', bg: '#FEF3C7', color: '#D97706' };
}
