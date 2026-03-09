import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, user, isAuthenticating, authError, isAuthReady } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await login(username.trim(), password);
  };

  if (isAuthReady && user) {
    return <Navigate to="/golden-line" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-inventory-bg px-4 py-12 font-inventory">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-inventory ring-1 ring-inventory-border-subtle"
      >
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-inventory-text-main">GoldenLine Giris</h2>
          <p className="mt-2 text-sm text-inventory-text-muted">
            Hesabiniza erisim icin bilgilerinizi girin.
          </p>
        </div>

        {authError && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            role="alert"
          >
            {authError}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-inventory-text-main">
              Kullanici Adi
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              className="w-full rounded-lg border border-inventory-border-subtle bg-white px-3 py-3 text-inventory-text-main shadow-sm outline-none transition focus:border-inventory-primary focus:ring-2 focus:ring-inventory-primary/70"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-inventory-text-main">
              Sifre
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-inventory-border-subtle bg-white px-3 py-3 text-inventory-text-main shadow-sm outline-none transition focus:border-inventory-primary focus:ring-2 focus:ring-inventory-primary/70"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isAuthenticating}
          className="w-full rounded-lg bg-inventory-primary py-3 text-sm font-semibold text-white transition hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-inventory-primary disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:opacity-70"
        >
          {isAuthenticating ? 'Giris yapiliyor...' : 'Giris Yap'}
        </button>
      </form>
    </div>
  );
};

export default Login;

