import { useState } from 'react';
import { decode } from 'base64-arraybuffer';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { documentService, getSupabaseClient, reportError } from '@taxilink/services';
import type { Document } from '@taxilink/supabase-types';

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const BUCKET = 'driver-documents';

const TYPE_TO_LABEL: Record<string, string> = {
  carte_grise: 'Carte grise',
  permis: 'Permis de conduire',
  carte_pro: 'Carte professionnelle',
  assurance: 'Assurance',
  convention_cpam: 'Convention CPAM',
};

function inferMimeFromExt(ext: string): string | null {
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  return null;
}

// Hook upload mobile : pick (PDF/JPG/PNG ≤ 10 Mo) → lit le fichier en base64
// via expo-file-system → decode en ArrayBuffer → upload bucket prive
// `driver-documents` → upsert ligne `driver_documents` (status='pending').
//
// Pourquoi base64 et pas `fetch(uri).arrayBuffer()` : sur Android RN le
// polyfill fetch retourne souvent un ArrayBuffer vide pour les `file://`
// URIs (cf. issues Supabase #1257, expo #18266). expo-file-system
// readAsStringAsync({ encoding: Base64 }) + base64-arraybuffer.decode est
// le pattern officiel recommande par Supabase pour RN.
export function useDocumentUpload(userId: string | null, docs: Document[], onUploaded: () => void) {
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pickAndUpload(type: string) {
    if (!userId) {
      setError('Session expirée — reconnecte-toi.');
      return;
    }
    setError(null);

    let result: DocumentPicker.DocumentPickerResult;
    try {
      result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_MIME,
        copyToCacheDirectory: true,
        multiple: false,
      });
    } catch (err) {
      reportError(err, { tags: { phase: 'mobile-doc-pick', type } });
      setError("Impossible d'ouvrir le sélecteur de fichier.");
      return;
    }
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;

    if (asset.size != null && asset.size > MAX_SIZE_BYTES) {
      setError('Fichier trop volumineux. Taille maximale : 10 Mo.');
      return;
    }
    const ext = (asset.name?.split('.').pop() ?? '').toLowerCase() || 'bin';
    // Sur Android, asset.mimeType peut etre undefined si le picker ne resout pas
    // le type — fallback sur l'extension.
    const mime = asset.mimeType ?? inferMimeFromExt(ext) ?? 'application/octet-stream';
    if (!ALLOWED_MIME.includes(mime)) {
      setError('Type de fichier non autorisé. Formats acceptés : PDF, JPG, PNG.');
      return;
    }

    setUploadingType(type);
    try {
      const path = `${userId}/${type}.${ext}`;

      // Si extension change (ex: pdf -> jpg), supprime l'ancien blob pour
      // eviter un orphelin (l'upsert n'ecrase que le path identique).
      const existing = docs.find((d) => d.type === type);
      const previousPath = existing?.file_url ?? null;
      const supabase = getSupabaseClient();
      if (previousPath && previousPath !== path) {
        await supabase.storage.from(BUCKET).remove([previousPath]).catch(() => {
          // tolerant : si l'ancien n'existe plus, pas grave
        });
      }

      // Lecture base64 + decode ArrayBuffer (cf. commentaire en tete).
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const arrayBuffer = decode(base64);

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, arrayBuffer, { contentType: mime, upsert: true });
      if (upErr) throw new Error(upErr.message);

      await documentService.upsertDocument({
        existingId: existing?.id,
        driverId: userId,
        type,
        label: TYPE_TO_LABEL[type] ?? type,
        filePath: path,
      });
      onUploaded();
    } catch (err) {
      reportError(err, { tags: { phase: 'mobile-doc-upload', type } });
      setError(err instanceof Error ? err.message : "Échec de l'upload");
    } finally {
      setUploadingType(null);
    }
  }

  return { uploadingType, error, pickAndUpload };
}
