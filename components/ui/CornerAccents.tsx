/**
 * The four L-shaped brackets that frame buttons, cards and panels across the
 * site (~950 usages).
 *
 * All four are the same glyph; `.corner-accent:nth-of-type(n)` in globals.css
 * pins each to a corner and rotates it. They must therefore be direct
 * siblings, and the count and order must not change.
 *
 * `--inset` on the positioned ancestor controls how far they sit from the edge.
 */
export default function CornerAccents({
  className = "size-[9px] corner-accent duration-400 opacity-40",
}: {
  /** Applied to each of the four SVGs. Must include `corner-accent`. */
  className?: string;
}) {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <svg
          key={i}
          className={className}
          fill="none"
          height="10"
          viewBox="0 0 10 10"
          width="10"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M0.499951 0.199996L0.499952 9.2M0.199951 0.499995L9.19995 0.499995"
            stroke="currentColor"
          />
        </svg>
      ))}
    </>
  );
}
