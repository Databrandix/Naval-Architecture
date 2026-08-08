import type { Metadata } from 'next';
import { getDepartmentIdentity } from '@/lib/identity';

/**
 * Page titles and descriptions that name the department.
 *
 * Every public page had its department written into the file — "Laboratory
 * Facility — Department of Electrical and Electronics Engineering" and
 * seventy-odd more like it. A copy of this codebase therefore announced
 * somebody else's department in search results and in every shared link,
 * which is the kind of mistake nobody sees while looking at the page itself.
 *
 * The name now comes from the department identity row, so it is correct on the
 * day a new department site is set up rather than on the day somebody
 * remembers to grep for it.
 *
 * Usage, in place of `export const metadata`:
 *
 *   export async function generateMetadata() {
 *     return departmentMetadata({
 *       title: 'Laboratory Facility',
 *       description: 'Hands-on laboratories of the {department} …',
 *     });
 *   }
 *
 * `{department}` in the description is replaced with the department's name.
 *
 * The title is passed through untouched: the root layout's title template
 * already appends "— Sonargaon University <department>", and appending the
 * name here as well produced it twice in one title bar.
 */
export async function departmentMetadata({
  title,
  description,
}: {
  title: string;
  description: string;
}): Promise<Metadata> {
  const dept = await getDepartmentIdentity();

  return {
    title,
    description: description.replaceAll('{department}', dept.name),
  };
}
