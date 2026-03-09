import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { bridge } from '../api/bridge';
import {
  AUTH_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  UNAUTHORIZED_EVENT,
} from '../constants/auth';

type AuthUser = {
  username: string;
  userId: number;
  token: string;
  role: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticating: boolean;
  authError: string | null;
  isAuthReady: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
};

type AuthResponse = {
  token: string;
  kullaniciAdi: string;
  userID: number;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

const decodeRoleFromToken = (token: string): string | null => {
  try {
    const [, payloadSegment] = token.split('.');
    if (!payloadSegment) {
      return null;
    }
    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = window.atob(padded);
    const payload = JSON.parse(decoded) as Record<string, unknown>;
    const directRole = payload.role;
    const claimRole = payload[ROLE_CLAIM];

    if (typeof directRole === 'string') {
      return directRole;
    }
    if (typeof claimRole === 'string') {
      return claimRole;
    }
    return null;
  } catch {
    return null;
  }
};

const buildAuthUser = (data: {
  username: unknown;
  userId: unknown;
  token: string;
  role?: unknown;
}): AuthUser => {
  const roleFromToken = decodeRoleFromToken(data.token) ?? 'User';
  return {
    username: typeof data.username === 'string' ? data.username : '',
    userId: typeof data.userId === 'number' ? data.userId : Number(data.userId ?? 0),
    token: data.token,
    role: typeof data.role === 'string' && data.role.length > 0 ? data.role : roleFromToken,
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const persisted = localStorage.getItem(AUTH_STORAGE_KEY);
    if (persisted) {
      try {
        const raw = JSON.parse(persisted) as Partial<AuthUser>;
        if (!raw?.token) {
          throw new Error('Missing token');
        }
        const normalized = buildAuthUser(raw as { username: unknown; userId: unknown; token: string; role?: unknown });
        setUser(normalized);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
        localStorage.setItem(TOKEN_STORAGE_KEY, normalized.token);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
    setIsAuthReady(true);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setAuthError('Oturumunuz sona erdi. Lutfen tekrar giris yapin.');
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setIsAuthReady(true);
      navigate('/', { replace: true });
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [navigate]);

  const login = useCallback(
    async (username: string, password: string) => {
      setIsAuthenticating(true);
      setAuthError(null);

      try {
        const response = await bridge.login({
          kullaniciAdi: username,
          sifre: password,
        });

        const authData: AuthUser = {
          username: response.kullaniciAdi,
          userId: response.userID,
          token: response.token,
          role: decodeRoleFromToken(response.token) ?? 'User',
        };

        setUser(authData);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        localStorage.setItem(TOKEN_STORAGE_KEY, authData.token);
        const targetPath = '/golden-line';
        navigate(targetPath, { replace: true });
      } catch (error: unknown) {
        const fallback = 'Giris basarisiz. Lutfen bilgilerinizi kontrol edin.';
        const message = error instanceof Error ? error.message : null;
        setAuthError(message ?? fallback);
        setUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } finally {
        setIsAuthenticating(false);
        setIsAuthReady(true);
      }
    },
    [navigate],
  );

  const hasRole = useCallback((role: string) => {
    if (!user?.role) {
      return false;
    }
    return user.role.toLowerCase() === role.toLowerCase();
  }, [user]);

  const hasAnyRole = useCallback((roles: string[]) => roles.some((role) => hasRole(role)), [hasRole]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    navigate('/', { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticating,
      authError,
      isAuthReady,
      login,
      logout,
      hasRole,
      hasAnyRole,
    }),
    [authError, hasAnyRole, hasRole, isAuthReady, isAuthenticating, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
