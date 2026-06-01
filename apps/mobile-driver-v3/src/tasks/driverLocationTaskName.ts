// Nom unique de la tâche TaskManager, isolé dans un module SANS dépendance afin
// d'être importable sans créer de cycle. `driverLocationTask.ts` importe `initApp`
// (depuis lib/init), et `lib/init` a besoin de ce nom pour couper le tracking au
// logout (audit H-04) : importer directement driverLocationTask depuis init créerait
// un cycle init ↔ driverLocationTask. Ce module neutre brise le cycle.
//
// Ne JAMAIS changer ce nom sans gérer la migration : une tâche enregistrée sous
// l'ancien nom continuerait à tourner en background sur les appareils déjà installés.
export const DRIVER_LOCATION_TASK = 'taxilink-driver-location-tracking';
