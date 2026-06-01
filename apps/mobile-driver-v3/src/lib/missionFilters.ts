// Constantes de filtrage des missions, partagées pour éviter la divergence (audit
// M-05 : le toggle « Urgent » utilisait 120 min sur la Carte et 10 min sur l'onglet
// Disponibles → incohérence visible pour le chauffeur).

/**
 * Toggle « Urgent » : une mission est urgente si elle démarre dans ≤ ce délai.
 * Aligné sur la version Carte / web (≤ 2h). À NE PAS confondre avec le seuil de
 * COLORATION du délai (URGENT_THRESHOLD_MIN = 10 min, usage purement visuel dans
 * MissionsCarousel) — ce sont deux concepts distincts.
 */
export const URGENT_FILTER_MIN = 120;
