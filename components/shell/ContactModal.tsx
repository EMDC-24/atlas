"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollSmoother } from "gsap/ScrollSmoother";

import Button from "@/components/ui/Button";

/**
 * Full-height contact panel that wipes in from the left edge.
 *
 * Opened by dispatching `contact-modal:open` on window with the target anchor
 * as `detail` (Header, Footer and several sections do this). The original
 * matched that string case-insensitively against every radio value and
 * pre-selected the hit, so `detail: "#segment"` could deep-link a segment --
 * that behaviour is preserved below.
 *
 * Alpine drove this with `x-show` + `x-trap.noscroll.noautofocus`. Here the
 * markup stays mounted and the transitions run off class swaps, which keeps the
 * leave transition playable; `inert` stands in for `display: none` so the form
 * controls leave the tab order while the panel is closed.
 *
 * IMPORTANT: the form is presentational only. It was a Craft/Formie form and
 * that backend no longer exists, so submission is suppressed. The `fui-*`
 * classes are kept verbatim because the original stylesheet keys off them.
 */

const TITLE = "Talk to the Atlas team.";
const WORDS = TITLE.split(" ");

/** Original: `rectangleAfterWordIndex: parseInt(2 - 1)` -- the image follows "to". */
const RECTANGLE_AFTER_WORD_INDEX = 1;

const RADIO_OPTIONS = ["Founder", "Investor", "Partner", "Journalist", "Other"] as const;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[16px]"
      fill="none"
      height="18"
      viewBox="0 0 17 18"
      width="17"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.01445e-07 14.8696C2.61347e-07 14.1844 0.555462 13.6289 1.24066 13.6289L2.30231 13.6289C2.98751 13.6289 3.54297 13.0734 3.54297 12.3882L3.54297 11.5024C3.54297 10.8172 4.09843 10.2617 4.78363 10.2617L5.22809 10.2617C5.91329 10.2617 6.46875 9.70626 6.46875 9.02106L6.46875 7.95745C6.46875 7.27226 7.02421 6.7168 7.70941 6.7168L8.18708 6.7168C8.87227 6.7168 9.42774 6.16133 9.42774 5.47614L9.42774 4.71331C9.42774 4.02812 9.9832 3.47266 10.6684 3.47266L11.484 3.47266C12.1691 3.47266 12.7246 2.91719 12.7246 2.232L12.7246 1.24066C12.7246 0.555462 13.2801 -2.61347e-07 13.9653 -2.01445e-07L15.0289 -1.08462e-07C15.7141 -4.856e-08 16.2695 0.555462 16.2695 1.24066L16.2695 2.30426C16.2695 2.98946 15.7141 3.54492 15.0289 3.54492L14.2133 3.54492C13.5281 3.54492 12.9727 4.10038 12.9727 4.78558L12.9727 5.77692C12.9727 6.46212 12.4172 7.01758 11.732 7.01758L11.2543 7.01758C10.5691 7.01758 10.0137 7.57304 10.0137 8.25824L10.0137 9.02106C10.0137 9.70626 9.45821 10.2617 8.77301 10.2617L8.32855 10.2617C7.64335 10.2617 7.08789 10.8172 7.08789 11.5024L7.08789 12.566C7.08789 13.2512 6.53243 13.8066 5.84723 13.8066L4.78558 13.8066C4.10038 13.8066 3.54492 14.3621 3.54492 15.0473L3.54492 15.9332C3.54492 16.6184 2.98946 17.1738 2.30426 17.1738L1.24066 17.1738C0.555462 17.1738 4.856e-08 16.6184 1.08462e-07 15.9332L2.01445e-07 14.8696ZM2.97656 4.78558C2.97656 4.10038 2.4211 3.54492 1.7359 3.54492L1.24066 3.54492C0.555463 3.54492 1.24004e-06 2.98946 1.29994e-06 2.30426L1.39292e-06 1.24066C1.45282e-06 0.55546 0.555463 -1.37377e-06 1.24066 -1.31387e-06L2.30426 -1.22088e-06C2.98946 -1.16098e-06 3.54492 0.555461 3.54492 1.24066L3.54492 1.89606C3.54492 2.58126 4.10038 3.13672 4.78558 3.13672L5.28083 3.13672C5.96602 3.13672 6.52149 3.69218 6.52149 4.37738L6.52149 5.44098C6.52149 6.12618 5.96602 6.68164 5.28083 6.68164L4.21722 6.68164C3.53203 6.68164 2.97656 6.12618 2.97656 5.44098L2.97656 4.78558ZM12.7246 15.4379C12.7246 14.7527 12.1691 14.1973 11.484 14.1973L10.9868 14.1973C10.3016 14.1973 9.74609 13.6418 9.74609 12.9566L9.74609 11.893C9.74609 11.2078 10.3016 10.6523 10.9868 10.6523L12.0504 10.6523C12.7356 10.6523 13.291 11.2078 13.291 11.893L13.291 12.3882C13.291 13.0734 13.8465 13.6289 14.5317 13.6289L15.0289 13.6289C15.7141 13.6289 16.2695 14.1844 16.2695 14.8696L16.2695 15.9332C16.2695 16.6184 15.7141 17.1738 15.0289 17.1738L13.9653 17.1738C13.2801 17.1738 12.7246 16.6184 12.7246 15.9332L12.7246 15.4379Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function ContactModal() {
  const [open, setOpen] = useState(false);
  const [segment, setSegment] = useState<string>(RADIO_OPTIONS[0]);

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;

      // The dispatcher passes an anchor such as "#contact". If it happens to
      // name one of the radio values, pre-select it -- otherwise the default
      // ("Founder") stands, exactly as the Alpine handler behaved.
      if (typeof detail === "string") {
        const wanted = detail.toLowerCase().trim();
        const match = RADIO_OPTIONS.find((v) => v.toLowerCase().trim() === wanted);
        if (match) setSegment(match);
      }

      setOpen(true);
    };

    window.addEventListener("contact-modal:open", onOpen);
    return () => window.removeEventListener("contact-modal:open", onOpen);
  }, []);

  // Freeze smooth scrolling and the page behind the panel.
  useEffect(() => {
    ScrollSmoother.get()?.paused(open);
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Escape closes; Tab is contained inside the panel. Focus is never stolen on
  // open, matching x-trap's `.noautofocus` -- so a Tab arriving from outside is
  // redirected to the first (or last) control instead.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (!panel.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  return (
    <div
      aria-describedby="contact-modal-description"
      aria-labelledby="contact-modal-title"
      aria-modal="true"
      className={[
        "bg-rich-carbon/40 fixed inset-0 z-50 flex backdrop-blur-[10px] transition-opacity duration-400",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
      inert={!open}
      onClick={close}
      ref={rootRef}
      role="dialog"
    >
      <div
        className={[
          "bg-neural-fog text-rich-carbon modal--scrollbar relative isolate h-full w-full max-w-[700px] overflow-y-auto px-[16px] pt-[32px] md:rounded-r-[20px] md:p-[40px] md:pb-0 transition-[clip-path] ease-(--easing) duration-400",
          open ? "delay-100 [clip-path:inset(0_0_0_0)]" : "[clip-path:inset(0_100%_0_0)]",
        ].join(" ")}
        // `rtl` here / `ltr` on the child moves the scrollbar to the left edge.
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        ref={panelRef}
      >
        <div dir="ltr">
          <button
            aria-label="Close"
            className="text-rich-carbon/60 hover:text-rich-carbon absolute top-[16px] right-[16px] transition-colors md:top-[24px] md:right-[24px]"
            onClick={close}
            type="button"
          >
            <CloseIcon />
          </button>

          <div className="flex h-full flex-col justify-between gap-[32px] md:gap-[40px]">
            <h2
              className="h2 flex flex-wrap gap-x-[0.3ch] uppercase [&>span>span]:inline-block"
              id="contact-modal-title"
            >
              {WORDS.map((word, index) => (
                <span className="contents" key={index}>
                  <span>{word}</span>
                  {index === RECTANGLE_AFTER_WORD_INDEX && (
                    <div
                      className="-mt-[0.075ch] h-[1.5ch] w-[4ch] shrink-0 bg-cover"
                      style={{
                        backgroundImage: "url('/images/transforms/contact-image.jpg')",
                        backgroundPosition: "50% 50%",
                      }}
                    />
                  )}
                </span>
              ))}
            </h2>

            <div className="fui-i">
              {/* Presentational only -- the Craft/Formie endpoint is gone, so the
                  submit is swallowed. Native `required` still drives the
                  browser's validation UI. */}
              <form
                acceptCharset="utf-8"
                className="fui-form fui-labels-above-input"
                data-form-handle="contact"
                data-form-submit-action="message"
                data-form-submit-method="ajax"
                data-loading-indicator="spinner"
                id="fui-contact-enqeff"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="fui-form-container">
                  <div
                    className="fui-page"
                    data-fui-page=""
                    data-id="1"
                    data-index="0"
                    id="fui-contact-enqeff-p-1"
                  >
                    <div className="fui-page-container">
                      <div className="fui-row fui-page-row" data-fui-field-count="1">
                        <div
                          className="fui-field fui-type-radio fui-label-above-input fui-subfield-label-above-input fui-instructions-above-input fui-field-required fui-page-field"
                          data-field-handle="imA"
                          data-field-type="radio"
                          data-validation="required"
                        >
                          <fieldset
                            aria-describedby="fui-contact-enqeff-fields-imA-instructions"
                            className="fui-fieldset fui-layout-horizontal"
                          >
                            <legend className="fui-legend" data-field-label="">
                              I&apos;m a
                              <span aria-hidden="true" className="fui-required">
                                *
                              </span>
                            </legend>
                            <div
                              className="fui-instructions"
                              id="fui-contact-enqeff-fields-imA-instructions"
                            >
                              <p>[select one]</p>
                            </div>
                            <div className="fui-input-wrapper">
                              <div className="fui-layout-wrap">
                                {RADIO_OPTIONS.map((value, index) => {
                                  // Formie's id scheme: `<slug>-<index>`.
                                  const slug = `${value.toLowerCase()}-${index}`;
                                  const id = `fui-contact-enqeff-fields-imA-${slug}`;

                                  return (
                                    <div className="fui-radio" key={value}>
                                      <input
                                        checked={segment === value}
                                        className="fui-input fui-radio-input"
                                        data-fui-id={`contact-imA-${slug}`}
                                        id={id}
                                        name="fields[imA]"
                                        onChange={() => setSegment(value)}
                                        required
                                        type="radio"
                                        value={value}
                                      />
                                      <label className="fui-radio-label" htmlFor={id}>
                                        {value}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </fieldset>
                        </div>
                      </div>

                      <div className="fui-row fui-page-row" data-fui-field-count="1">
                        <div
                          className="fui-field fui-type-group fui-label-above-input fui-subfield-label-above-input fui-instructions-above-input fui-page-field"
                          data-field-handle="aboutYou"
                          data-field-type="group"
                        >
                          <fieldset className="fui-fieldset">
                            <legend className="fui-legend" data-field-label="">
                              About you
                            </legend>
                            <div className="fui-input-wrapper">
                              <div className="fui-group">
                                <div className="fui-field-rows">
                                  <div className="fui-row" data-fui-field-count="2">
                                    <div
                                      className="fui-field fui-type-single-line-text fui-label-above-input fui-subfield-label-above-input fui-instructions-above-input fui-field-required fui-group-first-name"
                                      data-field-handle="aboutYou.firstName"
                                      data-field-type="single-line-text"
                                      data-validation="required"
                                    >
                                      <div className="fui-field-container">
                                        <label
                                          className="fui-label"
                                          data-field-label=""
                                          htmlFor="fui-contact-enqeff-fields-aboutYou-firstName"
                                        >
                                          First name
                                          <span aria-hidden="true" className="fui-required">
                                            *
                                          </span>
                                        </label>
                                        <div className="fui-input-wrapper">
                                          <input
                                            className="fui-input"
                                            data-fui-id="contact-aboutYou-firstName"
                                            id="fui-contact-enqeff-fields-aboutYou-firstName"
                                            name="fields[aboutYou][firstName]"
                                            placeholder="First name"
                                            required
                                            type="text"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    <div
                                      className="fui-field fui-type-single-line-text fui-label-above-input fui-subfield-label-above-input fui-instructions-above-input fui-field-required fui-group-last-name"
                                      data-field-handle="aboutYou.lastName"
                                      data-field-type="single-line-text"
                                      data-validation="required"
                                    >
                                      <div className="fui-field-container">
                                        <label
                                          className="fui-label"
                                          data-field-label=""
                                          htmlFor="fui-contact-enqeff-fields-aboutYou-lastName"
                                        >
                                          Last name
                                          <span aria-hidden="true" className="fui-required">
                                            *
                                          </span>
                                        </label>
                                        <div className="fui-input-wrapper">
                                          <input
                                            className="fui-input"
                                            data-fui-id="contact-aboutYou-lastName"
                                            id="fui-contact-enqeff-fields-aboutYou-lastName"
                                            name="fields[aboutYou][lastName]"
                                            placeholder="Last name"
                                            required
                                            type="text"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="fui-row" data-fui-field-count="2">
                                    <div
                                      className="fui-field fui-type-email fui-label-above-input fui-subfield-label-above-input fui-instructions-above-input fui-field-required fui-group-email-address"
                                      data-field-handle="aboutYou.emailAddress"
                                      data-field-type="email"
                                      data-validation="required|email"
                                    >
                                      <div className="fui-field-container">
                                        <label
                                          className="fui-label"
                                          data-field-label=""
                                          htmlFor="fui-contact-enqeff-fields-aboutYou-emailAddress"
                                        >
                                          Email
                                          <span aria-hidden="true" className="fui-required">
                                            *
                                          </span>
                                        </label>
                                        <div className="fui-input-wrapper">
                                          <input
                                            autoComplete="email"
                                            className="fui-input"
                                            data-fui-id="contact-aboutYou-emailAddress"
                                            id="fui-contact-enqeff-fields-aboutYou-emailAddress"
                                            name="fields[aboutYou][emailAddress]"
                                            placeholder="Email"
                                            required
                                            type="email"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    <div
                                      className="fui-field fui-type-phone fui-label-above-input fui-subfield-label-above-input fui-instructions-above-input fui-field-required fui-group-phone"
                                      data-field-handle="aboutYou.phone"
                                      data-field-type="phone"
                                      data-validation="required"
                                    >
                                      <div className="fui-field-container">
                                        <label
                                          className="fui-label"
                                          data-field-label=""
                                          htmlFor="fui-contact-enqeff-fields-aboutYou-phone"
                                        >
                                          Phone
                                          <span aria-hidden="true" className="fui-required">
                                            *
                                          </span>
                                        </label>
                                        <div className="fui-input-wrapper">
                                          <input
                                            autoComplete="tel"
                                            className="fui-input"
                                            data-fui-id="contact-aboutYou-phone-number"
                                            id="fui-contact-enqeff-fields-aboutYou-phone"
                                            name="fields[aboutYou][phone][number]"
                                            placeholder="Phone"
                                            required
                                            type="tel"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </fieldset>
                        </div>
                      </div>

                      <div className="fui-row fui-page-row" data-fui-field-count="1">
                        <div
                          className="fui-field fui-type-group fui-label-above-input fui-subfield-label-above-input fui-instructions-above-input fui-page-field"
                          data-field-handle="business"
                          data-field-type="group"
                        >
                          <fieldset className="fui-fieldset">
                            <legend className="fui-legend" data-field-label="">
                              Your business
                            </legend>
                            <div className="fui-input-wrapper">
                              <div className="fui-group">
                                <div className="fui-field-rows">
                                  <div className="fui-row" data-fui-field-count="1">
                                    <div
                                      className="fui-field fui-type-single-line-text fui-label-above-input fui-subfield-label-above-input fui-instructions-above-input fui-field-required fui-group-business-name"
                                      data-field-handle="business.businessName"
                                      data-field-type="single-line-text"
                                      data-validation="required"
                                      style={{ gridColumn: "span 2" }}
                                    >
                                      <div className="fui-field-container">
                                        <label
                                          className="fui-label"
                                          data-field-label=""
                                          htmlFor="fui-contact-enqeff-fields-business-businessName"
                                        >
                                          Business name
                                          <span aria-hidden="true" className="fui-required">
                                            *
                                          </span>
                                        </label>
                                        <div className="fui-input-wrapper">
                                          <input
                                            className="fui-input"
                                            data-fui-id="contact-business-businessName"
                                            id="fui-contact-enqeff-fields-business-businessName"
                                            name="fields[business][businessName]"
                                            placeholder="Business name"
                                            required
                                            type="text"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="fui-row" data-fui-field-count="1">
                                    <div
                                      className="fui-field fui-type-single-line-text fui-label-above-input fui-subfield-label-above-input fui-instructions-above-input fui-field-required fui-group-type-of-business"
                                      data-field-handle="business.typeOfBusiness"
                                      data-field-type="single-line-text"
                                      data-validation="required"
                                      style={{ gridColumn: "span 2" }}
                                    >
                                      <div className="fui-field-container">
                                        <label
                                          className="fui-label"
                                          data-field-label=""
                                          htmlFor="fui-contact-enqeff-fields-business-typeOfBusiness"
                                        >
                                          Type of business
                                          <span aria-hidden="true" className="fui-required">
                                            *
                                          </span>
                                        </label>
                                        <div className="fui-input-wrapper">
                                          <input
                                            className="fui-input"
                                            data-fui-id="contact-business-typeOfBusiness"
                                            id="fui-contact-enqeff-fields-business-typeOfBusiness"
                                            name="fields[business][typeOfBusiness]"
                                            placeholder="Type of business"
                                            required
                                            type="text"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="fui-row" data-fui-field-count="1">
                                    <div
                                      className="fui-field fui-type-multi-line-text fui-label-above-input fui-subfield-label-above-input fui-instructions-above-input fui-group-message"
                                      data-field-handle="business.message"
                                      data-field-type="multi-line-text"
                                      style={{ gridColumn: "span 2" }}
                                    >
                                      <div className="fui-field-container">
                                        <label
                                          className="fui-label"
                                          data-field-label=""
                                          htmlFor="fui-contact-enqeff-fields-business-message"
                                        >
                                          Message
                                        </label>
                                        <div className="fui-input-wrapper">
                                          <textarea
                                            className="fui-input"
                                            data-fui-id="contact-business-message"
                                            id="fui-contact-enqeff-fields-business-message"
                                            name="fields[business][message]"
                                            placeholder="Message (Optional)"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </fieldset>
                        </div>
                      </div>

                      <div className="fui-row fui-page-row" data-fui-field-count="1">
                        <div
                          className="fui-field fui-type-agree fui-label-hidden fui-subfield-label-hidden fui-instructions-above-input fui-field-required fui-page-field"
                          data-field-handle="privacyConsent"
                          data-field-type="agree"
                          data-validation="required"
                        >
                          <fieldset className="fui-fieldset">
                            <legend className="fui-legend" data-field-label="" data-fui-sr-only="">
                              Privacy Consent
                              <span aria-hidden="true" className="fui-required">
                                *
                              </span>
                            </legend>
                            <div className="fui-input-wrapper">
                              <div className="fui-checkbox">
                                <input
                                  className="fui-input fui-checkbox-input"
                                  data-fui-id="contact-privacyConsent"
                                  data-fui-input-type="agree"
                                  id="fui-contact-enqeff-fields-privacyConsent"
                                  name="fields[privacyConsent]"
                                  required
                                  type="checkbox"
                                  value="1"
                                />
                                <label
                                  className="fui-checkbox-label"
                                  htmlFor="fui-contact-enqeff-fields-privacyConsent"
                                >
                                  By checking this box I agree to the{" "}
                                  <a
                                    href="/legal/privacy-policy"
                                    rel="noopener noreferrer nofollow"
                                    target="_blank"
                                  >
                                    privacy policy
                                  </a>
                                </label>
                              </div>
                            </div>
                          </fieldset>
                        </div>
                      </div>
                    </div>

                    <Button className="mt-[32px] w-full md:w-auto" theme="dark">
                      Send message
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
