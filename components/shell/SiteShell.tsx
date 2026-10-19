"use client";

import ContactModal from "./ContactModal";
import DragCursor from "./DragCursor";
import Footer from "./Footer";
import Header from "./Header";
import Loader from "./Loader";
import SmoothScroll from "./SmoothScroll";
import ViewCursor from "./ViewCursor";

/**
 * Assembles the persistent chrome around every page.
 *
 * The nesting mirrors the original exactly, and the order matters:
 *
 *   cursors                 outside #smooth-wrapper, so ScrollSmoother's
 *                           transform never displaces them
 *   #smooth-wrapper
 *     skip link, header,    inside the wrapper but OUTSIDE #smooth-content,
 *     loader                so they stay fixed while content scrolls
 *     #smooth-content
 *       main#main           the only element ScrollSmoother transforms
 *
 * Moving the header inside #smooth-content would make it scroll away with the
 * page instead of staying pinned.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DragCursor />
      <ViewCursor />

      <SmoothScroll>
        <a className="skip-link" href="#main">
          Skip to content
        </a>

        <Header />

        <ContactModal />

        <Loader />

        <div id="smooth-content">
          <main id="main" tabIndex={-1}>
            {children}
          </main>

          {/* Sibling of <main>, inside #smooth-content -- matching the original,
              so the footer scrolls with the content rather than staying fixed. */}
          <Footer />
        </div>
      </SmoothScroll>
    </>
  );
}
