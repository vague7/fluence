'use client';

import { useEffect } from 'react';
import { syncUserWithDatabase } from '@/app/actions/user-sync';
import { useRouter } from 'next/navigation';

export default function UserSyncWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Run the sync operation when the component mounts
    const syncUser = async () => {
      try {
        await syncUserWithDatabase();
        // Refresh the page data to ensure it has the latest user info
        router.refresh();
      } catch (error) {
        console.error('Failed to sync user:', error);
        // Optionally handle errors (e.g., show a notification)
      }
    };

    syncUser();
  }, [router]);

  return <>{children}</>;
}