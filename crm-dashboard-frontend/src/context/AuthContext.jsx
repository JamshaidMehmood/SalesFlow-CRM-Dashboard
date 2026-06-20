import { createContext, useContext, useState, useEffect } from 'react';
import { authApi, twoFactorApi } from '../api';

const AuthContext = createContext(null);

function persistSession(user, token, onboarding) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  if (onboarding) {
    localStorage.setItem('onboarding', JSON.stringify(onboarding));
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [onboarding, setOnboarding] = useState(() => {
    const stored = localStorage.getItem('onboarding');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi
        .getProfile()
        .then((profile) => {
          const { onboarding: ob, ...userData } = profile;
          setUser(userData);
          if (ob) {
            setOnboarding(ob);
            localStorage.setItem('onboarding', JSON.stringify(ob));
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('onboarding');
          setUser(null);
          setOnboarding(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const result = await authApi.login(credentials);

    if (result.requires2FA) {
      return { requires2FA: true, tempToken: result.tempToken };
    }

    const { user: loggedInUser, token, onboarding: ob } = result;
    persistSession(loggedInUser, token, ob);
    setUser(loggedInUser);
    setOnboarding(ob || null);
    return { user: loggedInUser, onboarding: ob };
  };

  const loginWithGoogle = async (credential) => {
    const result = await authApi.googleLogin({ credential });

    if (result.requires2FA) {
      return { requires2FA: true, tempToken: result.tempToken };
    }

    const { user: loggedInUser, token, onboarding: ob } = result;
    persistSession(loggedInUser, token, ob);
    setUser(loggedInUser);
    setOnboarding(ob || null);
    return { user: loggedInUser, onboarding: ob };
  };

  const register = async (data) => {
    const { user: registeredUser, token, onboarding: ob } = await authApi.register(data);
    persistSession(registeredUser, token, ob);
    setUser(registeredUser);
    setOnboarding(ob || null);
    return registeredUser;
  };

  const verify2FA = async ({ tempToken, code, recoveryCode }) => {
    const result = await twoFactorApi.verifyLogin({ tempToken, code, recoveryCode });
    const { user: loggedInUser, token, onboarding: ob } = result;
    persistSession(loggedInUser, token, ob);
    setUser(loggedInUser);
    setOnboarding(ob || null);
    return loggedInUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('onboarding');
    setUser(null);
    setOnboarding(null);
  };

  const updateUser = (updated) => {
    const { onboarding: ob, ...userData } = updated;
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (ob) {
      setOnboarding(ob);
      localStorage.setItem('onboarding', JSON.stringify(ob));
    }
  };

  const updateOnboarding = (ob) => {
    setOnboarding(ob);
    if (ob) {
      localStorage.setItem('onboarding', JSON.stringify(ob));
    } else {
      localStorage.removeItem('onboarding');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        onboarding,
        loading,
        login,
        loginWithGoogle,
        register,
        verify2FA,
        logout,
        updateUser,
        setOnboarding: updateOnboarding,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
