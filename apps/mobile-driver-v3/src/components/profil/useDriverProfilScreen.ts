import { useCallback, useEffect, useMemo, useState } from 'react';
import { documentService, driverService, missionQueries, profileService, reportError, userPrefsService } from '@taxilink/services';
import type { Document, Mission } from '@taxilink/supabase-types';

const DEPT_TO_CITY: Record<string, string> = {
  '13': 'Marseille',
  '75': 'Paris',
  '69': 'Lyon',
  '31': 'Toulouse',
  '06': 'Nice',
  '33': 'Bordeaux',
  '44': 'Nantes',
  '67': 'Strasbourg',
  '34': 'Montpellier',
  '59': 'Lille',
  '35': 'Rennes',
};

const MANDATORY_DOC_TYPES = ['carte_grise', 'permis', 'carte_pro', 'assurance'] as const;
const EXPIRING_THRESHOLD_DAYS = 30;

type DocumentStatus = 'valid' | 'expiring' | 'expired' | 'pending' | 'invalid' | 'missing';

function computeDocStatus(doc: Document | null): DocumentStatus {
  if (!doc) return 'missing';
  const status = (doc.status ?? '').toLowerCase();
  if (status === 'invalid' || status === 'rejected') return 'invalid';
  if (status === 'pending') return 'pending';
  if (!doc.expiry_date) return 'valid';
  const expiry = new Date(doc.expiry_date).getTime();
  const now = Date.now();
  if (expiry <= now) return 'expired';
  const daysLeft = Math.floor((expiry - now) / 86_400_000);
  if (daysLeft <= EXPIRING_THRESHOLD_DAYS) return 'expiring';
  return 'valid';
}

interface ProfilData {
  fullName: string;
  initials: string;
  email: string;
  phone: string;
  proNumber: string | null;
  monthlyRevenue: number;
  courseCount: number;
  documentsWarning: string | null;
  departements: string[];
  city: string | null;
  mainDepartement: string | null;
}

const EMPTY: ProfilData = {
  fullName: 'Chauffeur',
  initials: '··',
  email: '',
  phone: '',
  proNumber: null,
  monthlyRevenue: 0,
  courseCount: 0,
  documentsWarning: null,
  departements: [],
  city: null,
  mainDepartement: null,
};

export function useDriverProfilScreen(userId: string | null, userEmail: string | null) {
  const [profile, setProfile] = useState<{ first_name: string | null; last_name: string | null; phone: string | null } | null>(null);
  const [proNumber, setProNumber] = useState<string | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [agenda, setAgenda] = useState<Mission[]>([]);
  const [doneRecent, setDoneRecent] = useState<Mission[]>([]);
  const [depts, setDepts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [p, d, docList, agendaList, doneList, deptList] = await Promise.all([
        profileService.getProfile(userId).catch(() => null),
        driverService.getDriver(userId).catch(() => null),
        documentService.getDocuments(userId).catch(() => [] as Document[]),
        missionQueries.getAgenda(userId).catch(() => [] as Mission[]),
        missionQueries.getDoneByDriver(userId, 200).catch(() => [] as Mission[]),
        userPrefsService.getDeptPreferences().catch(() => [] as string[]),
      ]);
      if (p) setProfile({ first_name: p.first_name, last_name: p.last_name, phone: p.phone });
      setProNumber(d?.pro_number ?? null);
      setDocs(docList);
      setAgenda(agendaList);
      setDoneRecent(doneList);
      setDepts(deptList);
    } catch (err) {
      reportError(err, { tags: { phase: 'profil-fetch' } });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const data = useMemo<ProfilData>(() => {
    if (!userId) return EMPTY;
    const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() || 'Chauffeur';
    const initials =
      fullName === 'Chauffeur'
        ? '··'
        : fullName
            .split(' ')
            .map((p) => p[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase();

    // Revenus + nombre de courses du mois courant : ACCEPTED/IN_PROGRESS de l'agenda
    // + courses TERMINEES (doneRecent) tombant dans le mois en cours.
    const now = new Date();
    const inMonth = [...agenda, ...doneRecent].filter((m) => {
      const d = new Date(m.completed_at ?? m.scheduled_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const monthlyRevenue = inMonth.reduce((s, m) => s + Number(m.price_eur ?? 0), 0);
    const courseCount = inMonth.length;

    const byType = new Map(docs.map((d) => [d.type, d]));
    const toRenew = MANDATORY_DOC_TYPES.filter((t) => {
      const status = computeDocStatus(byType.get(t) ?? null);
      return status === 'expiring' || status === 'expired' || status === 'missing' || status === 'invalid';
    }).length;
    const documentsWarning = toRenew > 0 ? `${toRenew} document${toRenew > 1 ? 's' : ''} à renouveler` : null;

    const mainDepartement = depts[0] ?? null;
    const city = mainDepartement ? DEPT_TO_CITY[mainDepartement] ?? null : null;

    return {
      fullName,
      initials,
      email: userEmail ?? '',
      phone: profile?.phone ?? '',
      proNumber,
      monthlyRevenue,
      courseCount,
      documentsWarning,
      departements: depts,
      city,
      mainDepartement,
    };
  }, [userId, userEmail, profile, proNumber, docs, agenda, doneRecent, depts]);

  return { ...data, loading, refresh: fetchAll };
}
