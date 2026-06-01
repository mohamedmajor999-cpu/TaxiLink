// Types et constantes partages entre FiltersSheet et useDriverHomeFilters.
// Extraits ici pour permettre la suppression de DriverHomeFilterChips
// (composant deplace dans la BottomSheet V7 puis remplace par FiltersSheet).

export type HomeTypeFilter = 'ALL' | 'CPAM' | 'PRIVE';

export const HOME_TYPE_FILTERS: { key: HomeTypeFilter; label: string }[] = [
  { key: 'ALL', label: 'Tout' },
  { key: 'CPAM', label: 'Médical' },
  { key: 'PRIVE', label: 'Privé' },
];
