import { useEffect, useState } from 'react';
import { publicRequest, subscribePublicChanges } from '@/messaging/public-client';
import type { ApiStatus } from './api-provider';

export function useApiStatus() {
  const [status, setStatus] = useState<ApiStatus | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      void publicRequest<ApiStatus>({ type: 'public:api-status' })
        .then((value) => {
          if (active) setStatus(value);
        })
        .catch(() => {
          if (active)
            setStatus({ connected: false, configuration: null, remembered: false });
        });
    };
    refresh();
    const unsubscribe = subscribePublicChanges(refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  return status;
}
