import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'Reservia',
  description:
    'Reserva de espacios profesionales: salas, despachos y puestos de coworking.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body className="bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}