import Link from 'next/link';

import { login } from '../../lib/actions';
import { safeRedirectPath } from '../../lib/auth';

const ERROR_MESSAGES: Record<string, string> = {
  credentials: 'Email o contraseña incorrectos.',
  inactive:
    'La cuenta no está activa. Contacta con el administrador.',
  invalid: 'Faltan datos para iniciar sesión.',
  'login-required':
    'Necesitas iniciar sesión para reservar.',
  'session-expired':
    'Tu sesión ha caducado. Vuelve a iniciar sesión.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
}) {
  const { error, next } = await searchParams;
  const safeNext = safeRedirectPath(next) ?? '/';

  return (
    <main className="mx-auto w-full max-w-md px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        Iniciar sesión
      </h1>

      {error !== undefined &&
      ERROR_MESSAGES[error] !== undefined ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {ERROR_MESSAGES[error]}
        </p>
      ) : null}

      <form action={login} className="mt-6 grid gap-4">
        <input
          type="hidden"
          name="next"
          value={safeNext}
        />

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Contraseña
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </label>

        <button
          type="submit"
          className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
        >
          Iniciar sesión
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        ¿Todavía no tienes cuenta?{' '}
        <Link
          href={`/register?next=${encodeURIComponent(safeNext)}`}
          className="font-medium text-emerald-700 hover:underline"
        >
          Regístrate
        </Link>
      </p>
    </main>
  );
}