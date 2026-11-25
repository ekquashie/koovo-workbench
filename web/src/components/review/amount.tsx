/**
 * Shows the API's 2 d.p. string as-is (no float parsing). Missing is shown
 * as a dash with a screen-reader label, so it is never mistaken for 0.00.
 * Negatives are not coloured: a negative credit is normal, and problems are
 * signalled by the validation badge, not the number. slate-600 keeps the
 * dash readable on hovered/selected rows too.
 */
export const Amount = ({ value }: { value: string | null }) =>
  value === null ? (
    <span className="text-slate-600">
      <span aria-hidden>—</span>
      <span className="sr-only">missing</span>
    </span>
  ) : (
    <span>{value}</span>
  );
