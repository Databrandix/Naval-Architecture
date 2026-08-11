/**
 * Where each office sits in the building.
 *
 * The department's Layout Plan is a two-column table under a headed block —
 * office on the left, "Level: 01, Sonargaon University" over "Building: …" on
 * the right — and this follows it: the same two columns, the same wording in
 * the cells, the same order, so the page and the PDF beside it read as one
 * document. It is not a floor plan; the university supplies office names
 * against levels, and somebody arriving to find the Registrar wants the
 * level, not a drawing.
 *
 * The department's own rows are the one departure — marked, because on a
 * department's own site they are what most visitors came for. Nothing about
 * the content or the order changes with them.
 */

export type Office = {
  id: string;
  name: string;
  level: string;
  building: string;
  isDepartment: boolean;
};

export default function OfficeDirectory({
  offices,
  departmentName,
}: {
  offices: Office[];
  departmentName: string;
}) {
  if (offices.length === 0) return null;

  /* Every row in the source carries the same address; the document states it
     once in the heading, and so does this. */
  const addresses = [...new Set(offices.map((o) => o.building).filter(Boolean))];

  return (
    <section className="mx-auto max-w-6xl">
      <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">
        <header className="border-b border-gray-300 px-6 py-6 text-center">
          <h2 className="text-primary font-display text-xl font-bold md:text-2xl">
            Sonargaon University
          </h2>
          <p className="mt-1 text-[15px] text-gray-700">{departmentName}</p>
          {addresses.length === 1 && (
            <p className="mt-0.5 text-[13.5px] text-gray-500">{addresses[0]}-1215</p>
          )}
        </header>

        <div className="overflow-x-auto">
          {/* The office column takes all the slack (`w-full` on one cell of an
              auto-layout table), and the location column stays at the width of
              its own longest line. The space the card does not need therefore
              falls between the two columns, as a gutter, rather than trailing
              off the right of every row where it reads as a hole. */}
          <table className="w-full text-left align-top text-[15px]">
            <caption className="sr-only">
              Each office of Sonargaon University and the level it is on
            </caption>
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50 text-[13px] font-bold text-gray-700">
                <th scope="col" className="w-full px-5 py-3 md:px-8">
                  Name of the Office
                </th>
                <th scope="col" className="px-5 py-3 whitespace-nowrap md:px-8">
                  Specific Location of the Office
                </th>
              </tr>
            </thead>
            <tbody>
              {offices.map((office) => (
                <tr key={office.id} className="border-b border-gray-200 last:border-b-0">
                  <td className="px-5 py-3.5 align-top md:px-8">
                    <span
                      className={
                        office.isDepartment ? 'text-primary font-semibold' : 'text-gray-800'
                      }
                    >
                      {office.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 align-top whitespace-nowrap text-gray-700 md:px-8">
                    <span className="block">{office.level}, Sonargaon University</span>
                    {office.building && (
                      <span className="block text-[13.5px] text-gray-500">
                        Building: {office.building}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
