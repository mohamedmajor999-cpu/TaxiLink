import { useCallback, useEffect, useState } from 'react';
import { driverBlockService, type BlockedDriver } from '@taxilink/services';

export function useBlockedDriversScreen(userId: string | null) {
  const [list, setList] = useState<BlockedDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      setList(await driverBlockService.getBlockedList(userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger la liste.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function unblock(blockedId: string) {
    if (!userId) return;
    try {
      await driverBlockService.unblock(userId, blockedId);
      setList((prev) => prev.filter((b) => b.blockedId !== blockedId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de débloquer.');
    }
  }

  return { list, loading, error, unblock, refresh: load };
}
