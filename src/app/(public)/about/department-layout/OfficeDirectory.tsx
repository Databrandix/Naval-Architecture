import { Building2, MapPin } from 'lucide-react';

/**
 * Where each office sits in the building.
 *
 * A directory, not a floor plan: the university supplies office names against
 * levels, and somebody arriving to find the Registrar wants the level, not a
 * drawing to download. The department's own offices lead, because that is what
 * a student on this page is usually looking for.
 */

export type Office = {
  id: string;
  name: string;
  level: string;
  building: string;
  isDepartment: boolean;
};

function OfficeRow({ office }: { office: Office }) {
  return (
    <tr className="border-t border-gray-100">
      <td className="px-5 py-3.5">
        <span className={office.isDepartment ? 'font-semibold text-primary' : 'text-gray-800'}>
          {office.name}
        </span>
      </td>
      <td className="px-5 py-3.5 text-right whitespace-nowrap">
        <span className="bg-primary/5 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold">
          <MapPin size={12} aria-hidden />
          {office.level}
        </span>
      </td>
    </tr>
  );
}

export default function OfficeDirectory({ offices }: { offices: Office[] }) {
  if (offices.length === 0) return null;

  const departmental = offices.filter((o) => o.isDepartment);
  const rest = offices.filter((o) => !o.isDepartment);

  /* Every row in the source carries the same address, so it is stated once
     above the table instead of twenty-two times inside it. */
  const buildings = [...new Set(offices.map((o) => o.building).filter(Boolean))];

  return (
    <section className="mx-auto max-w-4xl">
      <header className="mb-8 text-center">
        <h2 className="text-primary font-display text-xl font-bold md:text-2xl">
          Where to find each office
        </h2>
        {buildings.length === 1 && (
          <p className="mt-2 inline-flex items-center gap-2 text-[14px] text-gray-600">
            <Building2 size={15} className="text-accent" aria-hidden />
            {buildings[0]}
          </p>
        )}
      </header>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-[15px]">
          <caption className="sr-only">Offices and the level each is on</caption>
          <thead>
            <tr className="bg-gray-50 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
              <th scope="col" className="px-5 py-3">Office</th>
              <th scope="col" className="px-5 py-3 text-right">Level</th>
            </tr>
          </thead>

          {departmental.length > 0 && (
            <tbody>
              <tr className="bg-accent/5">
                <th
                  scope="colgroup"
                  colSpan={2}
                  className="text-accent px-5 py-2 text-left text-[11px] font-bold tracking-wider uppercase"
                >
                  This department
                </th>
              </tr>
              {departmental.map((office) => (
                <OfficeRow key={office.id} office={office} />
              ))}
            </tbody>
          )}

          <tbody>
            {departmental.length > 0 && (
              <tr className="bg-gray-50/70">
                <th
                  scope="colgroup"
                  colSpan={2}
                  className="px-5 py-2 text-left text-[11px] font-bold tracking-wider text-gray-500 uppercase"
                >
                  University offices
                </th>
              </tr>
            )}
            {rest.map((office) => (
              <OfficeRow key={office.id} office={office} />
            ))}
          </tbody>
        </table>
      </div>

      {buildings.length > 1 && (
        <p className="mt-4 text-center text-[13px] text-gray-500">
          Offices are spread across {buildings.length} buildings — the address is listed with each.
        </p>
      )}
    </section>
  );
}
