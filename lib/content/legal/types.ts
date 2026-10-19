/** One entry in a legal page's table of contents. */
export interface LegalTocEntry {
  /** Matches the `id` on the corresponding heading in `html`, in document order. */
  id: string;
  label: string;
}

/**
 * A legal page's copy, as it came out of the CMS.
 *
 * `toc` is empty on pages whose body has no headings (Terms and Conditions,
 * Whistleblower Protection Statement) -- the original omits the whole nav
 * there rather than rendering an empty one.
 */
export interface LegalContent {
  title: string;
  toc: LegalTocEntry[];
  /** Rich text, rendered as HTML inside `.prose--rich`. */
  html: string;
}
