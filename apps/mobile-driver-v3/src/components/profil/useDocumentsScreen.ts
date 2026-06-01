import { useCallback, useEffect, useMemo, useState } from 'react';
import { documentService } from '@taxilink/services';
import type { Document } from '@taxilink/supabase-types';

export type DocumentStatus = 'valid' | 'expiring' | 'expired' | 'pending' | 'invalid' | 'missing';

export interface DocumentSlot {
  type: string;
  label: string;
  optional?: boolean;
  cta?: string;
}

const EXPIRING_THRESHOLD_DAYS = 30;
const ALERT_THRESHOLD_DAYS = 30;

export const MANDATORY_DOCS: DocumentSlot[] = [
  { type: 'carte_grise', label: 'Carte grise' },
  { type: 'permis', label: 'Permis de conduire' },
  { type: 'carte_pro', label: 'Carte professionnelle' },
  { type: 'assurance', label: 'Assurance' },
];

export const OPTIONAL_DOCS: DocumentSlot[] = [
  { type: 'convention_cpam', label: 'Convention CPAM', optional: true, cta: 'Ajouter pour courses CPAM' },
];

export interface DocumentRowData {
  type: string;
  label: string;
  status: DocumentStatus;
  expiryLabel: string | null;
  daysLeft: number | null;
  cta?: string;
}

export interface DocumentExpiryAlert {
  docLabel: string;
  daysLeft: number;
}

function computeStatus(doc: Document | null): DocumentStatus {
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

function daysUntilExpiry(doc: Document | null): number | null {
  if (!doc?.expiry_date) return null;
  const ms = new Date(doc.expiry_date).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

function formatExpiry(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${m}/${d.getFullYear()}`;
}

function buildRow(slot: DocumentSlot, doc: Document | null): DocumentRowData {
  const status = computeStatus(doc);
  return {
    type: slot.type,
    label: slot.label,
    status,
    expiryLabel: doc?.expiry_date ? formatExpiry(doc.expiry_date) : null,
    daysLeft: daysUntilExpiry(doc),
    cta: slot.cta,
  };
}

export function useDocumentsScreen(userId: string | null) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const d = await documentService.getDocuments(userId);
      setDocs(d);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const computed = useMemo(() => {
    const byType = new Map(docs.map((d) => [d.type, d]));
    const mandatory = MANDATORY_DOCS.map((s) => buildRow(s, byType.get(s.type) ?? null));
    const optional = OPTIONAL_DOCS.map((s) => buildRow(s, byType.get(s.type) ?? null));
    const all = [...mandatory, ...optional];
    const validCount = all.filter((r) => r.status === 'valid').length;
    const totalCount = all.length;
    const expiring = mandatory
      .filter(
        (r) => r.status === 'expiring' && r.daysLeft !== null && r.daysLeft <= ALERT_THRESHOLD_DAYS,
      )
      .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))[0];
    const earliestExpiringAlert: DocumentExpiryAlert | null =
      expiring && expiring.daysLeft !== null
        ? { docLabel: expiring.label.toLowerCase(), daysLeft: expiring.daysLeft }
        : null;
    return { mandatory, optional, validCount, totalCount, earliestExpiringAlert };
  }, [docs]);

  return { loading, error, docs, refresh, ...computed };
}
