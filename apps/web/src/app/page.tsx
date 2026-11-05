import { listResources } from '../lib/resources';

export default async function HomePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="border-b border-slate-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
          Reservia
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Espacios profesionales para tu día a día
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Salas, despachos y puestos de coworking con
          disponibilidad real y reservas sin conflictos.
        </p>
      </header>

      <section
        aria-labelledby="catalog-title"
        className="mt-10"
      >
        <h2
          id="catalog-title"
          className="text-xl font-semibold text-slate-900"
        >
          Espacios disponibles
        </h2>
        <ResourceCatalog />
      </section>
    </main>
  );
}

async function ResourceCatalog() {
  try {
    const resources = await listResources();

    if (resources.length === 0) {
      return (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-600">
          No hay espacios publicados todavía.
        </p>
      );
    }

    return (
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {resources.map((resource) => (
          <li
            key={resource.id}
            className="rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <h3 className="text-lg font-medium text-slate-900">
              {resource.name}
            </h3>
            <p className="mt-2 text-slate-600">
              {resource.description}
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Capacidad para {resource.capacity} personas
            </p>
          </li>
        ))}
      </ul>
    );
  } catch {
    return (
      <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-10 text-center text-red-700">
        No se han podido cargar los espacios. Comprueba que la
        API esté en marcha en el puerto 3000.
      </p>
    );
  }
}