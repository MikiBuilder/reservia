import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { logout } from '../lib/actions';
import { getSession } from '../lib/session';

import './globals.css';

export const metadata: Metadata = {
  title: 'Reservia',
  description:
    'Reserva de espacios profesionales: salas, despachos y puestos de coworking.',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getSession();

  return (
    <html lang="es">
      <body className="bg-white text-slate-900 antialiased">
        <header className="border-b border-slate-200">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-widest text-emerald-700"
            >
              Reservia
            </Link>

            <nav className="flex items-center gap-4 text-sm">
              {session === null ? (
                <Link
                  href="/login"
                  className="font-medium text-emerald-700 hover:underline"
                >
                  Iniciar sesión
                </Link>
              ) : (
                <>
                  <span className="text-slate-600">
                    {session.user.name}
                  </span>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      Salir
                    </button>
                  </form>
                </>
              )}
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}