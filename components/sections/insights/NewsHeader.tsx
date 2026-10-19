import Link from "next/link";

/**
 * /insights/news page header. The empty left column is the source markup's --
 * it reserves the width the /insights hero uses for its category list, keeping
 * both pages' headings on the same vertical line.
 */
export default function NewsHeader() {
  return (
    <div className="container flex items-center gap-[24px] pt-[160px] pb-[40px] md:pt-[220px]">
      <div className="hidden w-full max-w-[207px] md:block" />
      <div className="max-w-[1020px]">
        <Link
          className="p2-mono text-off-white/60 hover:text-off-white flex items-center gap-[10px]"
          href="/insights"
        >
          <span className="bg-neural-fog size-[10px] rounded-[3px]" />
          Back to Insights
        </Link>
        <h1 className="h3 text-neural-fog mt-[20px] uppercase md:mt-[24px]">Latest News</h1>
      </div>
    </div>
  );
}
