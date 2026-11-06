import Link from 'next/link';

import { register } from '../../lib/actions';
import { safeRedirectPath } from '../../lib/auth';

const ERROR_MESSAGES: Record<string, string> = {
  'email-taken': 'Ya existe una cuenta con ese email.',
  invalid: 'Revisa los datos del formulario.',
};

export default async function RegisterPage({
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
        Crear cuenta
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

      <form action={register} className="mt-6 grid gap-4">
        <input
          type="hidden"
          name="next"
          value={safeNext}
        />

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Nombre
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </label>

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
            autoComplete="new-password"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </label>

        <button
          type="submit"
          className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
        >
          Crear cuenta
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        ¿Ya tienes cuenta?{' '}
        <Link
          href={`/login?next=${encodeURIComponent(safeNext)}`}
          className="font-medium text-emerald-700 hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}