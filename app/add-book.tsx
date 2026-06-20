import React from 'react';
import { useRouter } from 'expo-router';

import { AddBookFlow } from '@/features/addBook/AddBookFlow';

/** Standalone "Add a book" modal, reachable from Today and the Library. */
export default function AddBookScreen() {
  const router = useRouter();
  return (
    <AddBookFlow
      onAdded={(destination) =>
        router.replace(destination === 'library' ? '/(tabs)/library' : '/(tabs)')
      }
    />
  );
}
