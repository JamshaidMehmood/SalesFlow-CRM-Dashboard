import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { authApi } from '../api';

const GoogleAuthContext = createContext({
  googleEnabled: false,
  googleClientId: null,
  loading: true,
});

export function GoogleAuthProvider({ children }) {
  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || null;
  const [apiClientId, setApiClientId] = useState(null);
  const [loading, setLoading] = useState(!envClientId);

  useEffect(() => {
    if (envClientId) return undefined;

    let cancelled = false;

    authApi
      .getConfig()
      .then((data) => {
        if (!cancelled && data.googleClientId) {
          setApiClientId(data.googleClientId);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [envClientId]);

  const googleClientId = envClientId || apiClientId;
  const value = useMemo(
    () => ({
      googleEnabled: Boolean(googleClientId),
      googleClientId,
      loading: envClientId ? false : loading,
    }),
    [googleClientId, envClientId, loading]
  );

  if (googleClientId) {
    return (
      <GoogleAuthContext.Provider value={value}>
        <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider>
      </GoogleAuthContext.Provider>
    );
  }

  return <GoogleAuthContext.Provider value={value}>{children}</GoogleAuthContext.Provider>;
}

export function useGoogleAuth() {
  return useContext(GoogleAuthContext);
}
