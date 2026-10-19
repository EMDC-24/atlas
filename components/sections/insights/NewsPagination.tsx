/**
 * Pager beneath the news grid.
 *
 * There is only ever one page of articles, so the source renders "Prev" and
 * "Next" as inert dimmed spans and the current page number framed by four
 * corner rules built from bordered 9px boxes.
 */
export default function NewsPagination() {
  return (
    <div className="container pb-[100px]">
      <div className="p2-mono text-neural-fog flex items-center justify-center">
        <span aria-hidden="true" className="mx-[16px] opacity-50">
          Prev
        </span>
        <span className="text-off-white flex size-[48px] flex-col items-center justify-center">
          <div className="mb-auto flex w-full justify-between">
            <div className="size-[9px] border-t border-l border-current" />
            <div className="size-[9px] border-t border-r border-current" />
          </div>
          1
          <div className="mt-auto flex w-full justify-between">
            <div className="size-[9px] border-b border-l border-current" />
            <div className="size-[9px] border-r border-b border-current" />
          </div>
        </span>
        <span aria-hidden="true" className="mx-[16px] opacity-50">
          Next
        </span>
      </div>
    </div>
  );
}
