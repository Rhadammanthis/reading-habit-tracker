import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/auth/AuthProvider';
import { fetchProfile, updateProfile } from '@/services/profiles';
import { Profile } from '@/types/models';
import { queryKeys } from './queryKeys';

export function useProfile() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: queryKeys.profile(userId ?? 'anon'),
    queryFn: () => fetchProfile(userId as string),
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Profile>) => updateProfile(userId as string, patch),
    onMutate: async (patch) => {
      const key = queryKeys.profile(userId ?? 'anon');
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Profile>(key);
      if (previous) qc.setQueryData<Profile>(key, { ...previous, ...patch });
      return { previous };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.profile(userId ?? 'anon'), ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(userId ?? 'anon') });
    },
  });
}
