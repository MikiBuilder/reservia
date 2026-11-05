import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  getResource,
  getResourceAvailability,
} from '../../../lib/resources';
import {
  addDays,
  dayLabel,
  formatDate,
  formatSlotRange,
  WEEKDAYS,
} from '../../../lib/schedule';

export default async function ResourceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date } = await searchParams;

  const resource = await getResource(id);

  if (!resource) {
    notFound();
  }

  const availability = await getResourceAvailability(
    id,
    date,
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <nav>
        <Link
          href="/"
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          Volver al catálogo
        </Link>
      </nav>

      <header className="mt-6 border-b border-slate-200 pb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {resource.name}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600">
          {resource.description}
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Capacidad para {resource.capacity} personas
        </p>
      </header>

      <section
        aria-labelledby="hours-title"
        className="mt-10"
      >
        <h2
          id="hours-title"
          className="text-xl font-semibold text-slate-900"
        >
          Horario semanal
        </h2>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          {WEEKDAYS.map((day) => {
            const hours = availability.businessHours.find(
              (item) => item.day === day,
            );

            return (
              <div
                key={day}
                className="flex items-baseline justify-between border-b border-slate-100 py-2 text-sm"
              >
                <dt className="font-medium text-slate-700">
                  {dayLabel(day)}
                </dt>
                <dd className="text-slate-600">
                  {hours
                    ? `${hours.opensAt} - ${hours.closesAt}`
                    : 'Cerrado'}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section
        aria-labelledby="slots-title"
        className="mt-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2
            id="slots-title"
            className="text-xl font-semibold text-slate-900"
          >
            Huecos libres
          </h2>
          <nav className="flex gap-4 text-sm font-medium">
            <Link
              href={`/resources/${id}?date=${addDays(availability.date, -1)}`}
              className="text-emerald-700 hover:underline"
            >
              Día anterior
            </Link>
            <Link
              href={`/resources/${id}?date=${addDays(availability.date, 1)}`}
              className="text-emerald-700 hover:underline"
            >
              Día siguiente
            </Link>
          </nav>
        </div>

        <p className="mt-2 text-sm text-slate-600">
          {formatDate(availability.date)}
        </p>

        {availability.availableSlots.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-600">
            No hay huecos libres para este día.
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-3">
            {availability.availableSlots.map((slot) => (
              <li
                key={slot.startsAt}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800"
              >
                {formatSlotRange(slot)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}