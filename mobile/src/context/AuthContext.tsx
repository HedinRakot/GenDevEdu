import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/expo';

import type { AuthContextType, TokenPair, User } from '@/types/auth';
import { queryClient } from '@/context/QueryProvider';
import { setApiTokenProvider } from '@/services/apiClient';
import { onForceLogout } from '@/services/authEvents';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapClerkUser(clerkUser: ReturnType<typeof useUser>['user']): User | null {
  if (!clerkUser) return null;
  const rawRole = clerkUser.publicMetadata?.role as string | undefined;
  const role: User['role'] =
    rawRole === 'instructor' ? 'instructor' : rawRole === 'admin' ? 'admin' : 'student';
  return {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
    name: clerkUser.fullName ?? clerkUser.primaryEmailAddress?.emailAddress ?? '',
    avatarUrl: clerkUser.imageUrl ?? undefined,
    role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, signOut, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();

  // Wire Clerk's session token into the Axios client
  useEffect(() => {
    setApiTokenProvider(() => getToken());
  }, [getToken]);

  // Hard-logout triggered by the Axios 401 interceptor
  const performLogout = useCallback(async () => {
    await signOut();
    queryClient.clear();
  }, [signOut]);

  useEffect(() => {
    return onForceLogout(() => {
      performLogout().catch((e) => console.error('[Auth] force logout failed', e));
    });
  }, [performLogout]);

  // login() is a no-op: LoginScreen calls Clerk's useSignIn() directly.
  const login = useCallback(async () => {}, []);
  const logout = performLogout;

  const user = useMemo(() => mapClerkUser(clerkUser), [clerkUser]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      tokens: null as unknown as TokenPair | null,
      isAuthenticated: isSignedIn ?? false,
      isLoading: !isLoaded,
      isAuthenticating: false,
      login,
      logout,
    }),
    [user, isSignedIn, isLoaded, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb eines <AuthProvider> verwendet werden.');
  return ctx;
}
