// sss-customer-calculator.js — auto-generated from customer-calculator.html
// =============================================================
// Renders the customer-facing Superior Stain Solutions estimate
// calculator as a Custom Element (<sss-customer-calculator>) inside
// a Shadow DOM. Anonymous + public — no auth gate, no dashboard.
// Submits to /_functions/submitCustomerEstimate which creates a
// Jobber Request + Draft Quote.
//
// To rebuild after editing customer-calculator.html, run:
//   python3 build-customer-element.py
// =============================================================
(function () {
  if (window.customElements && customElements.get('sss-customer-calculator')) return;

  // Lazy-load jsPDF once for the whole page.
  function loadJsPDF() {
    if (window.jspdf) return Promise.resolve();
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = resolve;
      s.onerror = resolve;  // continue without PDF capability
      document.head.appendChild(s);
    });
  }

  const STYLE = ":host { display: block; width: 100%; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a2540; line-height: 1.5; -webkit-font-smoothing: antialiased; }\n:host {\n    --navy: #1a2540; --navy-light: #2d3d5f;\n    --green: #2d6e4e; --green-light: #5a8d68; --green-pale: #e8f3eb;\n    --gold: #c89b3c; --gold-pale: #fef9ed;\n    --coral: #c84d3a; --coral-pale: #fde0d8;\n    --slate: #5a6378; --cream: #f7f5f1;\n    --paper: #ffffff; --line: #ece9e3; --line-soft: #f0ede7;\n    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);\n    --shadow-md: 0 4px 12px rgba(0,0,0,0.08);\n    --shadow-lg: 0 12px 32px rgba(0,0,0,0.12);\n    --radius: 12px; --radius-lg: 16px;\n  }\n  * { box-sizing: border-box; margin: 0; padding: 0; }\n  :host {\n    font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n    background: var(--cream); color: var(--navy); line-height: 1.5;\n    -webkit-font-smoothing: antialiased;\n  }\n  /* Auto-resize iframe model: the calculator grows to fit its content and\n     the parent Wix page handles scrolling. Works consistently across phone,\n     tablet, and desktop without per-device tuning \u2014 at the cost of being\n     unable to pin elements (steps bar, sidebar) to the user's viewport. */\n  :host { overflow: visible; }\n  button { font-family: inherit; cursor: pointer; border: none; background: none; }\n  /* Block iOS double-tap-zoom on all interactive surfaces. `manipulation`\n     still allows scroll/pan gestures but prevents the browser from\n     interpreting two taps as a zoom-in, which is another way users can\n     get accidentally zoomed-in without an obvious way to zoom back out. */\n  button, .selectable-card, .tier-card, .condition-card, .product-choice-card,\n  .color-swatch, .toggle-row, .radio-row, .wood-age-btn,\n  .progress-step, .project-bubble, .draft-card,\n  .mini-tier-row, .mini-toggle { touch-action: manipulation; }\n  /* Allow native browser scroll. Iframe touch-capture on iOS still\n     sometimes \"catches\" on cards but at least normal scrolling works. */\n  :host, :host * { touch-action: pan-y; }\n  .progress { touch-action: pan-x !important; }\n  input, textarea, select { touch-action: auto !important; }\n\n  /* Remove the iOS tap-highlight blue flash on every interactive element \u2014\n     it lingers briefly on touchstart and can make scroll feel \"stuck\"\n     because the visual feedback fires before the drag is interpreted. */\n  * { -webkit-tap-highlight-color: transparent; }\n\n  /* Disable accidental text selection on drag everywhere EXCEPT inputs.\n     On iOS, a finger drag across card text sometimes triggers the system's\n     text-selection mode instead of scrolling \u2014 disabling user-select on\n     non-input surfaces forces the gesture to be interpreted as scroll. */\n  :host { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }\n  input, textarea, [contenteditable] { -webkit-user-select: text; user-select: text; }\n  input, select { font-family: inherit; font-size: inherit; }\n\n  /* Disable hover-state transforms on touch-primary devices. On tablets the\n     browser briefly applies :hover when a finger lands on a card, then the\n     transform shifts the element under the finger and can confuse the scroll\n     gesture. (hover:none) targets touch-primary devices that don't truly hover. */\n  @media (hover: none), (pointer: coarse) {\n    .selectable-card:hover,\n    .tier-card:hover,\n    .condition-card:hover,\n    .product-choice-card:hover,\n    .color-swatch:hover,\n    .toggle-row:hover,\n    .radio-row:hover,\n    .wood-age-btn:hover,\n    .project-bubble:hover,\n    .draft-card:hover,\n    .mini-tier-row:hover,\n    .mini-toggle:hover { transform: none !important; box-shadow: var(--shadow-sm) !important; }\n  }\n\n  .app {\n    min-height: 100vh; display: flex; flex-direction: column;\n    /* Defensive: never let the app extend wider than the viewport so\n       horizontal scroll can't happen when the tablet flips orientation.\n       Individual wide elements (progress bar, side tracker) get their\n       own horizontal-scroll containers below. */\n    max-width: 100vw;\n    overflow-x: hidden;\n  }\n\n  /* HEADER \u2014 scrolls away so the step nav (below) can pin to the top.\n     Wraps on narrow screens so the right-side pills (quote ID, save\n     status, Jobber, totals) flow onto a second row instead of running\n     off the edge when iPad is rotated to portrait. */\n  .app-header {\n    background: var(--paper); border-bottom: 1px solid var(--line);\n    padding: 14px 28px; display: flex; align-items: center; gap: 20px;\n    box-shadow: var(--shadow-sm);\n    flex-wrap: wrap;\n    row-gap: 10px;\n  }\n  .brand-mark { display: flex; align-items: center; gap: 10px; min-width: 0; }\n  .brand-mark .logo {\n    width: 40px; height: 40px;\n    background: transparent url('https://static.wixstatic.com/media/6616da_4aa22f2adc3c42938a4f5ec0b8d67969~mv2.png') center / contain no-repeat;\n    flex-shrink: 0;\n    /* Keep the SS text content for screen readers but visually replace it\n       with the brush image. No green square \u2014 brush sits on whatever\n       header background color is behind it. */\n    text-indent: -9999px;\n    overflow: hidden;\n  }\n  .brand-mark .name {\n    font-weight: 700; font-size: 14px; color: var(--navy);\n    min-width: 0;\n  }\n  .brand-mark .sub { font-size: 11px; color: var(--slate); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }\n  .header-right { margin-left: auto; display: flex; align-items: center; gap: 14px; }\n  .quote-id-tag { font-size: 12px; color: var(--slate); }\n  .quote-id-tag span { font-family: ui-monospace, monospace; color: var(--navy); font-weight: 600; }\n  .total-pill {\n    background: var(--green); color: white;\n    padding: 8px 16px; border-radius: 100px;\n    display: flex; flex-direction: column; align-items: flex-start;\n    min-width: 110px; transition: transform 0.3s, background 0.3s;\n  }\n  .total-pill .lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.85; font-weight: 700; line-height: 1; }\n  .total-pill .amt { font-size: 17px; font-weight: 800; line-height: 1.1; margin-top: 2px; }\n  .total-pill.pulse { animation: pulse 0.6s; }\n  .total-pill.secondary { background: var(--paper); color: var(--navy); border: 1.5px solid var(--line); padding: 7px 14px; }\n  .total-pill.secondary .lbl { color: var(--slate); }\n  @keyframes pulse {\n    0%, 100% { transform: scale(1); }\n    50% { transform: scale(1.06); background: var(--green-light); }\n  }\n\n  /* PROJECT BUBBLES \u2014 multi-project navigator above the step progress bar */\n  .project-bubbles {\n    background: var(--cream); padding: 10px 28px;\n    border-bottom: 1px solid var(--line);\n    display: flex; gap: 10px; align-items: center; overflow-x: auto;\n  }\n  .project-bubbles-label {\n    font-size: 11px; font-weight: 700; color: var(--slate);\n    text-transform: uppercase; letter-spacing: 0.08em;\n    margin-right: 6px; flex-shrink: 0;\n  }\n  .project-bubble {\n    display: inline-flex; align-items: center; gap: 8px;\n    padding: 8px 14px; background: var(--paper);\n    border: 2px solid var(--line); border-radius: 100px;\n    font-size: 13px; font-weight: 600; color: var(--navy);\n    cursor: pointer; transition: all 0.15s;\n    flex-shrink: 0; white-space: nowrap;\n  }\n  .project-bubble:hover { border-color: var(--green-light); }\n  .project-bubble.active {\n    background: var(--navy); color: white; border-color: var(--navy);\n    box-shadow: 0 2px 8px rgba(26, 37, 64, 0.2);\n  }\n  .project-bubble .pb-ico { font-size: 16px; }\n  .project-bubble .pb-price { font-size: 11px; opacity: 0.75; }\n  .project-bubble.add-new {\n    background: transparent; border-style: dashed; color: var(--green);\n    font-weight: 700;\n  }\n  .project-bubble.add-new:hover { background: var(--green-pale); border-color: var(--green); }\n\n  /* PROGRESS \u2014 sticks to the top of the iframe viewport so the customer\n     always sees which step they're on as the body scrolls underneath. */\n  .progress {\n    background: var(--paper); padding: 14px 28px;\n    border-bottom: 1px solid var(--line);\n    display: flex; gap: 6px; overflow-x: auto;\n    position: sticky; top: 0; z-index: 80;\n    box-shadow: var(--shadow-sm);\n    /* Smooth scroll for the auto-scroll-to-active animation + finger swipe\n       support on mobile. Scrollbar visually hidden on mobile but the bar\n       remains scrollable. */\n    scroll-behavior: smooth;\n    -webkit-overflow-scrolling: touch;\n    scrollbar-width: thin;\n  }\n  .progress::-webkit-scrollbar { height: 4px; }\n  .progress::-webkit-scrollbar-thumb { background: var(--line); border-radius: 2px; }\n  .progress-step {\n    /* Default desktop / iPad-landscape: steps flex-grow to fill the bar\n       so the strip spans full width. min-width keeps labels readable.\n       Narrow viewports (iPad portrait, phones) override below to\n       flex: 0 0 auto so the bar scrolls horizontally instead of\n       cramming everything together. */\n    flex: 1 1 auto; min-width: 90px;\n    padding: 8px 10px; background: var(--line-soft); border-radius: 8px;\n    font-size: 11px; font-weight: 600; color: var(--slate);\n    text-align: center; transition: background 0.18s, color 0.18s, border-color 0.18s, opacity 0.18s;\n    cursor: not-allowed; user-select: none; border: 2px solid transparent;\n    opacity: 0.55;\n    white-space: nowrap;\n  }\n  .progress-step.reachable { cursor: pointer; opacity: 1; }\n  .progress-step.reachable:hover { background: var(--line); }\n  .progress-step .step-num { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2px; opacity: 0.7; }\n  .progress-step.active { background: var(--navy); color: white; border-color: var(--navy); opacity: 1; cursor: pointer; }\n  .progress-step.done { background: var(--green-pale); color: var(--green); border-color: var(--green); opacity: 1; cursor: pointer; }\n  .progress-step.done::before { content: \"\u2713 \"; }\n  .progress-step.skipped {\n    background: var(--line-soft); color: var(--slate);\n    opacity: 0.55; cursor: not-allowed; text-decoration: line-through;\n  }\n\n  /* Generous side padding on stage-wrap = there's always a finger-width strip\n     of empty space on the left and right where a touch drag definitely\n     scrolls the page instead of landing on a card. */\n  .stage-wrap { flex: 1; padding: 32px 44px 60px; max-width: 1400px; margin: 0 auto; width: 100%; }\n  .stage { display: none; animation: fadeUp 0.4s cubic-bezier(0.4, 0, 0.2, 1); }\n  .stage.visible { display: block; }\n  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }\n  .stage-title { color: var(--green); font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6px; }\n  .stage h1 { font-size: 30px; font-weight: 700; color: var(--navy); margin-bottom: 8px; letter-spacing: -0.5px; }\n  .stage .lead { color: var(--slate); font-size: 15px; margin-bottom: 28px; max-width: 720px; }\n\n  /* CARDS */\n  /* Gap bumped from 14px to 22px \u2014 every gap pixel is a \"scroll-safe\" zone\n     between cards where a finger drag isn't on a card and definitely passes\n     through to the parent Wix page for scrolling. Has been the most effective\n     iframe-scroll improvement we've tried. */\n  .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 22px; margin-bottom: 28px; }\n  .card-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }\n  .card-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }\n  .card-grid.cols-4 { grid-template-columns: repeat(4, 1fr); }\n  .card-grid.cols-5 { grid-template-columns: repeat(5, 1fr); }\n  @media (max-width: 1100px) { .card-grid.cols-5, .card-grid.cols-4 { grid-template-columns: repeat(2, 1fr); } }\n  @media (max-width: 760px) { .card-grid.cols-3, .card-grid.cols-2, .card-grid.cols-4, .card-grid.cols-5 { grid-template-columns: 1fr; } }\n\n  .selectable-card {\n    background: var(--paper); border: 2px solid var(--line);\n    border-radius: var(--radius); text-align: left;\n    transition: all 0.2s; position: relative; overflow: hidden; padding: 0;\n    /* Flex column so the image stays a fixed size at the top and the\n       body fills any extra height the grid stretches the card to \u2014\n       prevents the \"white bar\" effect on shorter cards. */\n    display: flex; flex-direction: column;\n  }\n  .selectable-card .card-image { flex: 0 0 auto; }\n  .selectable-card .card-body { flex: 1 1 auto; display: flex; flex-direction: column; }\n  .selectable-card:hover { border-color: var(--green-light); transform: translateY(-2px); box-shadow: var(--shadow-md); }\n  .selectable-card.selected { border-color: var(--green); box-shadow: 0 0 0 4px rgba(45, 110, 78, 0.12); }\n  .selectable-card.selected::after {\n    content: \"\u2713\"; position: absolute; top: 12px; right: 12px;\n    width: 28px; height: 28px; background: var(--green); color: white;\n    border-radius: 50%; display: flex; align-items: center; justify-content: center;\n    font-weight: 700; font-size: 14px; z-index: 2;\n    box-shadow: 0 2px 8px rgba(0,0,0,0.2);\n  }\n\n  .card-image {\n    width: 100%; height: 220px;\n    background-size: cover; background-position: center center;\n    background-color: var(--line-soft);\n    background-repeat: no-repeat;\n    border-bottom: 1px solid var(--line);\n    position: relative;\n  }\n  .card-image::after {\n    content: ''; position: absolute; inset: 0;\n    background: linear-gradient(180deg, transparent 75%, rgba(0,0,0,0.12));\n  }\n  .selectable-card.selected .card-image {\n    box-shadow: inset 0 0 0 3px var(--green-pale);\n  }\n  .card-body { padding: 18px 22px 22px; }\n  .card-body .title { font-size: 19px; font-weight: 700; color: var(--navy); margin-bottom: 6px; }\n  .card-body .desc { font-size: 14px; color: var(--slate); line-height: 1.5; }\n  .card-body .badge {\n    display: inline-block; margin-top: 10px;\n    padding: 3px 8px; background: var(--green-pale); color: var(--green);\n    font-size: 10px; font-weight: 700; letter-spacing: 0.06em;\n    text-transform: uppercase; border-radius: 4px;\n    /* .card-body is a flex column with default align-items:stretch, which\n       would otherwise stretch this inline-block to fill the full card\n       width. align-self:flex-start keeps it sized to its content only. */\n    align-self: flex-start;\n  }\n  /* \"Coming Soon\" badge variant \u2014 soft slate instead of brand-green so\n     it doesn't compete for attention with the real selectable cards. */\n  .card-body .badge.coming-soon-badge {\n    background: var(--line-soft); color: var(--slate);\n  }\n\n  /* Disabled / coming-soon selectable cards \u2014 visually faded, no hover\n     lift, not-allowed cursor. Click is short-circuited in JS so nothing\n     happens if the user taps it. */\n  .selectable-card.coming-soon {\n    opacity: 0.55;\n    cursor: not-allowed;\n    filter: grayscale(0.6);\n  }\n  .selectable-card.coming-soon:hover {\n    border-color: var(--line);\n    transform: none;\n    box-shadow: none;\n  }\n  .selectable-card.coming-soon .card-image::after {\n    background: linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(0,0,0,0.18));\n  }\n\n  /* TIER CARDS */\n  .tier-card {\n    background: var(--paper); border: 2px solid var(--line);\n    border-radius: var(--radius-lg); padding: 24px; text-align: left;\n    transition: all 0.25s; display: flex; flex-direction: column; position: relative;\n  }\n  .tier-card:hover { border-color: var(--green-light); transform: translateY(-4px); box-shadow: var(--shadow-lg); }\n  .tier-card.selected { border-color: var(--green); box-shadow: 0 0 0 4px rgba(45, 110, 78, 0.12), var(--shadow-md); }\n  .tier-card.recommended { border-color: var(--gold); background: linear-gradient(180deg, var(--gold-pale) 0%, var(--paper) 60%); }\n  .tier-card.recommended.selected { border-color: var(--green); }\n  .tier-card .reco-flag {\n    position: absolute; top: -10px; left: 20px;\n    background: var(--gold); color: white;\n    font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 100px;\n    letter-spacing: 0.1em; text-transform: uppercase;\n  }\n  .tier-card .tier-name { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--slate); margin-bottom: 4px; }\n  .tier-card .tier-product { font-size: 18px; font-weight: 700; color: var(--navy); margin-bottom: 8px; line-height: 1.25; }\n  .tier-card .tier-tagline { font-size: 12px; color: var(--slate); font-style: italic; margin-bottom: 10px; min-height: 32px; }\n  .tier-card .tier-price { font-size: 30px; font-weight: 800; color: var(--green); margin: 8px 0 2px; letter-spacing: -0.5px; }\n  .tier-card .tier-cost-per-year { font-size: 12px; color: var(--slate); font-weight: 500; }\n  .tier-card .tier-life {\n    font-size: 12px; color: var(--gold); font-weight: 700;\n    margin: 8px 0 14px; text-transform: uppercase; letter-spacing: 0.06em;\n    padding: 6px 10px; background: var(--gold-pale); border-radius: 6px; display: inline-block;\n    cursor: help; position: relative;\n  }\n  .tier-card .tier-life::after {\n    content: ' \u24d8'; font-size: 10px; opacity: 0.7;\n  }\n  /* Tooltip on hover/focus over the lifespan badge */\n  .tier-life-tooltip {\n    position: absolute; bottom: calc(100% + 8px); left: 50%;\n    transform: translateX(-50%);\n    background: var(--navy); color: white;\n    padding: 10px 14px; border-radius: 8px;\n    font-size: 12px; font-weight: 500; line-height: 1.5;\n    letter-spacing: 0; text-transform: none;\n    width: 280px; max-width: 90vw;\n    box-shadow: 0 8px 24px rgba(0,0,0,0.25);\n    opacity: 0; pointer-events: none;\n    transition: opacity 0.18s, transform 0.18s;\n    z-index: 50; text-align: left;\n  }\n  .tier-life-tooltip::after {\n    content: ''; position: absolute; top: 100%; left: 50%;\n    transform: translateX(-50%);\n    border: 6px solid transparent; border-top-color: var(--navy);\n  }\n  .tier-card .tier-life:hover .tier-life-tooltip,\n  .tier-card .tier-life:focus-within .tier-life-tooltip {\n    opacity: 1; transform: translateX(-50%) translateY(-2px);\n  }\n  .tier-card .tier-pros { list-style: none; margin: 0 0 12px; }\n  .tier-card .tier-pros li { font-size: 13px; color: var(--navy); padding: 5px 0 5px 22px; position: relative; }\n  .tier-card .tier-pros li::before { content: \"\u2713\"; position: absolute; left: 0; color: var(--green); font-weight: 700; }\n  .tier-card .tier-pros li.standout { font-weight: 700; color: var(--gold); }\n  .tier-card .tier-pros li.standout::before { color: var(--gold); content: \"\u2605\"; }\n  .tier-card .tier-cons { list-style: none; margin: 8px 0 0; padding-top: 10px; border-top: 1px dashed var(--line); }\n  .tier-card .tier-cons li { font-size: 12px; color: var(--slate); padding: 4px 0 4px 22px; position: relative; }\n  .tier-card .tier-cons li::before { content: \"\u2014\"; position: absolute; left: 4px; color: var(--slate); }\n  .tier-card .best-for {\n    margin-top: auto; padding-top: 12px; border-top: 1px solid var(--line);\n    font-size: 12px; color: var(--slate);\n  }\n  .tier-card .best-for strong { color: var(--navy); display: block; margin-bottom: 2px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }\n  /* What's Included footer on tier cards */\n  .tier-card .whats-included {\n    margin: 12px 0 0; padding: 12px;\n    background: var(--green-pale); border-radius: 8px;\n    border: 1px solid rgba(45, 110, 78, 0.2);\n  }\n  .tier-card .whats-included-label {\n    font-size: 10px; font-weight: 700;\n    color: var(--green); text-transform: uppercase;\n    letter-spacing: 0.1em; margin-bottom: 6px;\n  }\n  .tier-card .whats-included ul { list-style: none; margin: 0; padding: 0; }\n  .tier-card .whats-included li {\n    font-size: 12px; color: #1f4d36;\n    line-height: 1.5; padding: 2px 0;\n  }\n  /* Risk reversal box on Review screen */\n  .risk-reversal-box {\n    background: linear-gradient(135deg, var(--green-pale) 0%, #f0f7f3 100%);\n    border: 1px solid var(--green);\n    border-radius: var(--radius);\n    padding: 18px 22px; margin-top: 18px;\n  }\n  .risk-reversal-box h4 {\n    color: var(--green); font-size: 13px; font-weight: 700;\n    text-transform: uppercase; letter-spacing: 0.08em;\n    margin-bottom: 8px;\n  }\n  .risk-reversal-box ul { list-style: none; margin: 0; padding: 0; }\n  .risk-reversal-box li {\n    font-size: 13px; color: #1f4d36; line-height: 1.6;\n    padding: 3px 0; padding-left: 22px; position: relative;\n  }\n  .risk-reversal-box li::before {\n    content: \"\u2713\"; position: absolute; left: 0; top: 3px;\n    color: var(--green); font-weight: 800; font-size: 14px;\n  }\n  /* Side-tracker notes section \u2014 compact by default, expands on focus/use */\n  .side-tracker-notes {\n    padding: 8px 14px 10px; border-top: 1px solid var(--line);\n    background: var(--cream);\n  }\n  .side-tracker-notes label {\n    display: block; color: var(--slate); font-size: 11px;\n    font-weight: 700; margin-bottom: 4px;\n    text-transform: uppercase; letter-spacing: 0.06em;\n  }\n  .side-tracker-notes textarea {\n    width: 100%; min-height: 30px; height: 30px; resize: none;\n    background: var(--paper); color: var(--navy);\n    border: 1.5px solid var(--line); border-radius: 6px;\n    padding: 6px 10px; font-size: 12px; line-height: 1.4;\n    font-family: inherit;\n    transition: height 0.18s ease, box-shadow 0.15s, border-color 0.15s;\n    overflow: hidden;\n  }\n  .side-tracker-notes textarea::placeholder { color: var(--slate); opacity: 0.65; }\n  /* Grow when focused so the user has typing room. Also grow when the\n     textarea has content (the .has-content class is toggled by JS so the\n     expanded height persists after blur if notes were entered). */\n  .side-tracker-notes textarea:focus,\n  .side-tracker-notes textarea.has-content {\n    min-height: 96px; height: 96px;\n    outline: none; border-color: var(--green);\n    box-shadow: 0 0 0 3px rgba(45, 110, 78, 0.2);\n    resize: vertical;\n    overflow: auto;\n  }\n  /* \"Save & Exit\" button in side-tracker footer \u2014 compact so it doesn't crowd the total */\n  .btn-save-exit {\n    padding: 6px 12px;\n    background: rgba(200, 155, 60, 0.2); color: var(--gold);\n    border: 1px solid var(--gold);\n    border-radius: 7px;\n    font-weight: 600; font-size: 12px; cursor: pointer;\n    transition: all 0.15s; white-space: nowrap;\n  }\n  .btn-save-exit:hover {\n    background: var(--gold); color: white;\n  }\n\n  /* Notes panel on Review screen */\n  .review-notes-box {\n    margin-top: 18px; padding: 16px 20px;\n    background: var(--cream); border-left: 4px solid var(--gold);\n    border-radius: 8px;\n  }\n  .review-notes-box h4 {\n    font-size: 12px; color: var(--gold); font-weight: 700;\n    text-transform: uppercase; letter-spacing: 0.08em;\n    margin-bottom: 6px;\n  }\n  .review-notes-box p {\n    font-size: 14px; color: var(--navy); line-height: 1.55;\n    white-space: pre-wrap; /* preserve customer's line breaks */\n  }\n\n  /* DIY cost comparison on Review */\n  .diy-comparison {\n    margin-top: 16px;\n    padding: 18px 22px;\n    background: var(--paper);\n    border: 1px dashed var(--slate);\n    border-radius: var(--radius);\n  }\n  .diy-comparison h4 {\n    font-size: 13px; color: var(--slate);\n    text-transform: uppercase; letter-spacing: 0.08em;\n    font-weight: 700; margin-bottom: 4px;\n  }\n  .diy-comparison .diy-blurb {\n    font-size: 13px; color: var(--slate); margin-bottom: 14px;\n  }\n  .diy-comparison .diy-row {\n    display: flex; justify-content: space-between;\n    padding: 8px 0; border-bottom: 1px dashed var(--line);\n    font-size: 13px; color: var(--navy);\n  }\n  .diy-comparison .diy-row.diy-total {\n    border-bottom: none; padding-top: 10px; margin-top: 4px;\n    font-weight: 700; font-size: 15px;\n    border-top: 2px solid var(--navy);\n  }\n  .diy-comparison .diy-conclusion {\n    margin-top: 14px; padding: 12px 14px;\n    background: var(--gold-pale); border-radius: 8px;\n    font-size: 13px; color: #5a4a1f; line-height: 1.55;\n  }\n  .diy-comparison .diy-conclusion strong { color: var(--navy); }\n\n  /* Quote expiration banner */\n  .quote-expiry-banner {\n    background: var(--navy); color: white;\n    padding: 12px 18px; border-radius: 8px;\n    margin-bottom: 16px; display: flex; align-items: center;\n    gap: 12px; font-size: 13px;\n  }\n  .quote-expiry-banner .icon { font-size: 18px; }\n  .quote-expiry-banner strong { color: var(--gold); }\n  /* Stackable discount checkbox + summary line */\n  .radio-row .dot-outer.square {\n    border-radius: 5px;\n  }\n  .radio-row .dot-outer.square::after {\n    content: '\u2713'; width: auto; height: auto; background: transparent;\n    color: white; font-size: 14px; font-weight: 800; line-height: 1;\n    border-radius: 0;\n  }\n  .radio-row.checked .dot-outer.square {\n    background: var(--green); border-color: var(--green);\n  }\n  .discount-sum-line {\n    display: flex; justify-content: space-between; align-items: center;\n    background: var(--navy); color: white;\n    padding: 16px 20px; border-radius: 12px; margin-top: 14px;\n    font-size: 14px;\n  }\n  .discount-sum-line strong { display: block; margin-bottom: 2px; }\n  .discount-sum-line #discountSumText { font-size: 12px; opacity: 0.85; }\n  .discount-sum-rate {\n    color: var(--gold); font-size: 22px; font-weight: 800;\n    letter-spacing: -0.5px;\n  }\n\n  /* Grouped color sections */\n  .color-group { margin-bottom: 28px; }\n  .color-group-label {\n    font-size: 14px; font-weight: 700; color: var(--navy);\n    text-transform: uppercase; letter-spacing: 0.08em;\n    margin-bottom: 12px; padding-bottom: 6px;\n    border-bottom: 1px solid var(--line);\n  }\n  .color-group-label small {\n    font-weight: 500; color: var(--slate);\n    text-transform: none; letter-spacing: 0; font-size: 12px;\n  }\n  .color-swatch.custom-swatch .chip {\n    background-image: linear-gradient(135deg, transparent 0%, transparent 45%, var(--gold) 45%, var(--gold) 55%, transparent 55%) !important;\n    background-color: var(--cream) !important;\n    border: 2px dashed var(--gold) !important;\n  }\n  .custom-color-entry {\n    display: none; padding: 18px; margin-top: 14px;\n    background: var(--gold-pale);\n    border: 2px solid var(--gold); border-radius: 12px;\n  }\n  .custom-color-entry.visible { display: block; }\n\n  /* LARGER add-on cards \u2014 easier to see product images */\n  .toggle-row .addon-img {\n    width: 96px !important; height: 96px !important;\n    border-radius: 12px;\n  }\n  .addon-section .toggle-row {\n    padding: 16px 18px;\n    gap: 14px;\n    min-height: 116px;\n  }\n  .toggle-row .addon-desc .ad-name { font-size: 16px; font-weight: 700; }\n  .toggle-row .addon-desc .ad-sub { font-size: 13px; margin-top: 4px; line-height: 1.5; }\n  .toggle-row .price { font-size: 15px; }\n  /* Single-column for the stain-product-upgrades section so the images get even more room */\n  .addon-section:first-of-type .addon-grid {\n    grid-template-columns: 1fr;\n  }\n\n  /* Confetti animation overlay */\n  .confetti-piece {\n    position: fixed; width: 10px; height: 14px;\n    pointer-events: none; z-index: 999;\n    animation: confetti-fall 1.6s ease-out forwards;\n  }\n  @keyframes confetti-fall {\n    0% { transform: translateY(0) rotate(0); opacity: 1; }\n    100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }\n  }\n\n  /* Bigger bundle savings celebration */\n  .bundle-savings-pill {\n    display: inline-flex; align-items: center; gap: 8px;\n    background: linear-gradient(135deg, var(--green) 0%, var(--green-light) 100%);\n    color: white; padding: 10px 18px;\n    border-radius: 100px; font-weight: 700; font-size: 15px;\n    margin-bottom: 16px;\n    box-shadow: 0 4px 12px rgba(45, 110, 78, 0.3);\n    animation: bundle-celebrate 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);\n  }\n  @keyframes bundle-celebrate {\n    0% { transform: scale(0.5); opacity: 0; }\n    60% { transform: scale(1.1); }\n    100% { transform: scale(1); opacity: 1; }\n  }\n  .tier-card.disabled {\n    opacity: 0.5; cursor: not-allowed; background: var(--line-soft);\n    filter: grayscale(70%);\n  }\n  .tier-card.disabled:hover { transform: none; box-shadow: none; border-color: var(--line); }\n\n  /* PRODUCT CHOICE CARDS */\n  .product-choice-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }\n  @media (max-width: 980px) { .product-choice-grid { grid-template-columns: 1fr; } }\n  .product-choice-card {\n    background: var(--paper); border: 2px solid var(--line);\n    border-radius: var(--radius); padding: 0;\n    cursor: pointer; transition: all 0.2s;\n    position: relative; text-align: left;\n    display: flex; flex-direction: column;\n    overflow: hidden;\n  }\n  .product-choice-card:hover { border-color: var(--green-light); transform: translateY(-2px); box-shadow: var(--shadow-md); }\n  .product-choice-card.selected { border-color: var(--green); box-shadow: 0 0 0 4px rgba(45, 110, 78, 0.12); }\n  .product-choice-card.selected::after {\n    content: \"\u2713\"; position: absolute; top: 12px; right: 12px;\n    width: 28px; height: 28px; background: var(--green); color: white;\n    border-radius: 50%; display: flex; align-items: center; justify-content: center;\n    font-weight: 700; font-size: 14px; z-index: 2;\n    box-shadow: 0 2px 8px rgba(0,0,0,0.2);\n  }\n  .product-choice-card.recommended { border-color: var(--gold); }\n  .product-choice-card.recommended.selected { border-color: var(--green); }\n  .product-choice-card .reco-flag {\n    position: absolute; top: 12px; left: 12px;\n    background: var(--gold); color: white;\n    font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 100px;\n    letter-spacing: 0.1em; text-transform: uppercase; z-index: 2;\n    box-shadow: 0 2px 8px rgba(0,0,0,0.2);\n  }\n  .product-choice-card .prod-image {\n    width: 100%; height: 200px;\n    background-size: cover; background-position: center 50%;\n    background-color: var(--line-soft); border-bottom: 1px solid var(--line);\n    background-repeat: no-repeat;\n    position: relative;\n  }\n  /* HOA image is wide-angle of rooftops with lots of sky \u2014 anchor to bottom so the houses show */\n  .product-choice-card[data-product=\"hoa\"] .prod-image { background-position: center 85%; }\n  .product-choice-card .prod-image::after {\n    content: ''; position: absolute; inset: 0;\n    background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.2));\n  }\n  .product-choice-card .prod-body { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 6px; flex: 1; }\n  .product-choice-card .icon { font-size: 24px; }\n  .product-choice-card .h { font-size: 18px; font-weight: 700; color: var(--navy); }\n  .product-choice-card .d { font-size: 13px; color: var(--slate); line-height: 1.5; }\n  .product-choice-card .pros { font-size: 12px; color: var(--green); font-weight: 600; margin-top: auto; padding-top: 6px; }\n  /* Pros / cons bullet lists inside product family cards */\n  .product-choice-card .prod-pros, .product-choice-card .prod-cons {\n    list-style: none; margin: 8px 0 0; padding: 0;\n  }\n  .product-choice-card .prod-pros li {\n    font-size: 12.5px; color: var(--navy); line-height: 1.45;\n    padding: 4px 0 4px 20px; position: relative;\n  }\n  .product-choice-card .prod-pros li::before {\n    content: \"\u2713\"; position: absolute; left: 2px; top: 4px;\n    color: var(--green); font-weight: 700; font-size: 13px;\n  }\n  .product-choice-card .prod-cons {\n    margin-top: 8px; padding-top: 8px;\n    border-top: 1px dashed var(--line);\n  }\n  .product-choice-card .prod-cons li {\n    font-size: 12px; color: var(--slate); line-height: 1.45;\n    padding: 3px 0 3px 20px; position: relative;\n  }\n  .product-choice-card .prod-cons li::before {\n    content: \"\u2014\"; position: absolute; left: 6px; top: 3px;\n    color: var(--slate); font-weight: 700;\n  }\n  .product-choice-card .prod-recommend-note {\n    /* margin-top:auto pushes this box to the bottom of the flex column so all\n       three product cards have their \"When to pick this\" boxes aligned on the\n       same baseline regardless of how long the pros/cons lists are. */\n    margin-top: auto; padding: 10px 12px;\n    background: var(--cream); border-left: 3px solid var(--gold);\n    border-radius: 6px;\n    font-size: 12px; line-height: 1.5; color: var(--navy);\n  }\n  /* Ensure the pros/cons block leaves room above the bottom-pinned note */\n  .product-choice-card .prod-cons { margin-bottom: 8px; }\n  .product-choice-card .prod-recommend-note strong {\n    color: var(--gold); display: block; margin-bottom: 2px;\n    font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em;\n  }\n  .product-choice-card.recommended .prod-recommend-note {\n    background: var(--gold-pale);\n  }\n\n  /* COLOR SWATCHES \u2014 now with images */\n  .color-grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));\n    gap: 14px; margin-bottom: 24px;\n  }\n  .color-swatch {\n    background: var(--paper); border: 3px solid var(--line);\n    border-radius: var(--radius); padding: 10px;\n    cursor: pointer; transition: all 0.18s;\n    text-align: center; user-select: none;\n  }\n  .color-swatch:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--green-light); }\n  .color-swatch.selected { border-color: var(--green); box-shadow: 0 0 0 4px rgba(45, 110, 78, 0.15); }\n  .color-swatch .chip {\n    width: 100%; aspect-ratio: 1 / 1; border-radius: 8px;\n    border: 1px solid rgba(0,0,0,0.12);\n    background-size: cover; background-position: center;\n    background-color: var(--line-soft);\n    margin-bottom: 8px;\n  }\n  /* Hex fallback (used when no image URL) */\n  .color-swatch .chip.hex-only {\n    box-shadow: inset 0 -8px 12px rgba(0,0,0,0.15), inset 0 8px 12px rgba(255,255,255,0.08);\n  }\n  .color-swatch .name { font-size: 13px; font-weight: 700; color: var(--navy); line-height: 1.2; }\n  .color-swatch .code { font-size: 10px; color: var(--slate); margin-top: 2px; font-family: ui-monospace, monospace; }\n\n  /* FORMS */\n  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }\n  @media (max-width: 760px) { .form-grid { grid-template-columns: 1fr; } }\n  .form-grid.full { grid-template-columns: 1fr; }\n  .field label { display: block; font-size: 12px; font-weight: 700; color: var(--slate); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }\n  .field input, .field select, .field textarea {\n    width: 100%; background: var(--paper);\n    border: 2px solid var(--line); border-radius: 10px;\n    padding: 12px 14px; font-size: 15px; color: var(--navy);\n    transition: border-color 0.15s, box-shadow 0.15s;\n  }\n  .field textarea { min-height: 70px; resize: vertical; font-family: inherit; }\n  .field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: var(--green); box-shadow: 0 0 0 3px rgba(45, 110, 78, 0.12); }\n  .field .hint { font-size: 12px; color: var(--slate); margin-top: 4px; }\n  .field .err { font-size: 12px; color: var(--coral); margin-top: 4px; font-weight: 600; display: none; }\n  .field.invalid input, .field.invalid select {\n    border-color: var(--coral) !important;\n    background: var(--coral-pale) !important;\n    box-shadow: 0 0 0 3px rgba(200, 77, 58, 0.18);\n    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97);\n  }\n  .field.invalid .err {\n    display: block; color: var(--coral); font-weight: 700;\n    font-size: 12px; margin-top: 6px;\n  }\n  .field.invalid label { color: var(--coral); }\n  @keyframes shake {\n    0%, 100% { transform: translateX(0); }\n    20%, 60% { transform: translateX(-6px); }\n    40%, 80% { transform: translateX(6px); }\n  }\n\n  /* TOGGLES */\n  .toggle-row {\n    display: flex; align-items: center; gap: 12px;\n    padding: 12px 14px; background: var(--paper);\n    border: 2px solid var(--line); border-radius: 10px;\n    cursor: pointer; transition: all 0.15s; margin-bottom: 8px; user-select: none;\n  }\n  .toggle-row:hover { border-color: var(--green-light); }\n  .toggle-row.checked { background: var(--green-pale); border-color: var(--green); }\n  .toggle-row .box {\n    width: 20px; height: 20px; border: 2px solid var(--line); border-radius: 5px;\n    background: var(--paper); flex-shrink: 0;\n    display: flex; align-items: center; justify-content: center;\n    color: white; font-weight: 700; font-size: 12px; transition: all 0.15s;\n  }\n  .toggle-row.checked .box { background: var(--green); border-color: var(--green); }\n  .toggle-row.checked .box::after { content: \"\u2713\"; }\n  .toggle-row .name { flex: 1; font-size: 14px; font-weight: 600; color: var(--navy); }\n  .toggle-row .name .restr { font-size: 10px; color: var(--coral); font-weight: 700; text-transform: uppercase; margin-left: 6px; letter-spacing: 0.05em; }\n  .toggle-row .price { color: var(--green); font-weight: 700; font-size: 14px; white-space: nowrap; }\n  .toggle-row .qty-input { width: 70px; padding: 4px 6px; font-size: 12px; border: 1px solid var(--line); border-radius: 6px; margin-right: 8px; }\n\n  /* RADIO ROW (for discounts \u2014 single-select) */\n  .radio-row {\n    display: flex; align-items: center; gap: 14px;\n    padding: 12px 16px 12px 12px; background: var(--paper);\n    border: 2px solid var(--line); border-radius: 12px;\n    cursor: pointer; transition: all 0.15s; margin-bottom: 10px;\n  }\n  .radio-row:hover { border-color: var(--green-light); transform: translateY(-1px); }\n  .radio-row.checked { background: var(--green-pale); border-color: var(--green); }\n  .radio-row .disc-img {\n    width: 76px; height: 76px; border-radius: 10px;\n    background-size: cover; background-position: center;\n    background-color: var(--line-soft);\n    flex-shrink: 0; border: 1px solid var(--line);\n  }\n  .radio-row.no-img { padding-left: 16px; }\n  .radio-row .dot-outer {\n    width: 22px; height: 22px; border: 2px solid var(--line); border-radius: 50%;\n    flex-shrink: 0; display: flex; align-items: center; justify-content: center;\n    transition: all 0.15s;\n  }\n  .radio-row.checked .dot-outer { border-color: var(--green); }\n  .radio-row .dot-outer::after {\n    content: ''; width: 10px; height: 10px; border-radius: 50%;\n    background: var(--green); opacity: 0; transition: opacity 0.15s;\n  }\n  .radio-row.checked .dot-outer::after { opacity: 1; }\n  .radio-row .label { flex: 1; }\n  .radio-row .label .head { font-size: 14px; font-weight: 700; color: var(--navy); }\n  .radio-row .label .sub { font-size: 12px; color: var(--slate); margin-top: 2px; line-height: 1.4; }\n  .radio-row .value { color: var(--green); font-weight: 700; font-size: 16px; white-space: nowrap; }\n  /* Informational rows (e.g. cash payment) \u2014 neutral palette so it doesn't read as a percentage discount */\n  .radio-row.informational .value { color: var(--navy); font-size: 13px; }\n  .radio-row.informational.checked { background: var(--cream); border-color: var(--navy); }\n  .radio-row.informational.checked .dot-outer.square { background: var(--navy); border-color: var(--navy); }\n\n  /* INFO PANELS */\n  .info-panel { background: var(--paper); border: 2px solid var(--line); border-radius: var(--radius-lg); padding: 22px; margin-bottom: 20px; }\n  .info-panel.highlighted { border-color: var(--gold); background: linear-gradient(180deg, var(--gold-pale) 0%, var(--paper) 50%); }\n  .info-panel.previous { border-color: #3a7095; background: linear-gradient(180deg, #e6f0f7 0%, var(--paper) 50%); }\n  .info-panel h3 { font-size: 15px; color: var(--navy); margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }\n  .info-panel .panel-hint { font-size: 13px; color: var(--slate); margin-bottom: 16px; }\n\n  /* RECOMMENDATION BANNER */\n  .reco-banner {\n    background: linear-gradient(135deg, var(--gold-pale) 0%, #fff7e0 100%);\n    border-left: 4px solid var(--gold);\n    border-radius: var(--radius); padding: 14px 18px;\n    margin-bottom: 20px; display: flex; align-items: flex-start; gap: 12px;\n  }\n  .reco-banner .reco-ico { font-size: 20px; flex-shrink: 0; }\n  .reco-banner .reco-content { flex: 1; font-size: 13px; color: #5a4a1f; line-height: 1.5; }\n  .reco-banner .reco-content strong { color: var(--navy); display: block; margin-bottom: 2px; }\n\n  /* TIP BOXES (employee-facing scripts) */\n  .tip-box {\n    background: linear-gradient(135deg, #fff 0%, #f7fbf8 100%);\n    border-left: 4px solid var(--green);\n    border-radius: 10px;\n    padding: 14px 16px; margin-bottom: 16px;\n    font-size: 13px; line-height: 1.55;\n    display: flex; gap: 12px; align-items: flex-start;\n  }\n  .tip-box .tip-ico { font-size: 18px; flex-shrink: 0; line-height: 1.3; }\n  .tip-box .tip-body { flex: 1; color: var(--navy); }\n  .tip-box .tip-body strong { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--green); margin-bottom: 4px; }\n  .tip-box .tip-body em { font-style: italic; color: var(--slate); }\n  /* (Script tip variant removed \u2014 all tips are now customer-facing facts) */\n\n  /* Wood-age 3-button selector on Step 3 */\n  .wood-age-buttons {\n    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;\n  }\n  @media (max-width: 760px) { .wood-age-buttons { grid-template-columns: 1fr; } }\n  .wood-age-btn {\n    display: flex; align-items: center; gap: 12px;\n    padding: 14px 16px; background: var(--paper);\n    border: 2px solid var(--line); border-radius: 12px;\n    cursor: pointer; transition: all 0.15s;\n    text-align: left;\n  }\n  .wood-age-btn:hover { border-color: var(--green-light); transform: translateY(-1px); }\n  .wood-age-btn.selected {\n    border-color: var(--green); background: var(--green-pale);\n    box-shadow: 0 0 0 3px rgba(45, 110, 78, 0.15);\n  }\n  .wood-age-btn .wa-ico { font-size: 28px; flex-shrink: 0; }\n  .wood-age-btn .wa-label { font-size: 14px; font-weight: 700; color: var(--navy); line-height: 1.25; }\n  .wood-age-btn .wa-label small { display: block; font-weight: 500; color: var(--slate); margin-top: 2px; font-size: 11px; }\n  .wood-age-btn.selected .wa-label small { color: var(--green); }\n\n  /* Disabled condition cards (gated by wood age) */\n  .condition-card.locked {\n    opacity: 0.45; cursor: not-allowed; filter: grayscale(70%);\n    pointer-events: none;\n  }\n  .condition-card.locked .reco-flag,\n  .condition-card.locked.recommended { background: var(--line-soft); border-color: var(--line); }\n  .condition-card .locked-badge {\n    position: absolute; top: 12px; left: 12px;\n    background: var(--slate); color: white; z-index: 2;\n    font-size: 10px; font-weight: 700; padding: 4px 10px;\n    border-radius: 100px; letter-spacing: 0.08em; text-transform: uppercase;\n    box-shadow: 0 2px 6px rgba(0,0,0,0.2);\n  }\n\n  /* MEASUREMENTS */\n  /* Prominent help card on Step 3 (Measurements). Customer-only build:\n     this is the panic button for anyone who's not sure how to measure. */\n  .cust-measure-help-card {\n    display: flex; align-items: center; gap: 12px;\n    width: 100%;\n    background: #fff5e6;\n    border: 1.5px solid #f1d68e;\n    border-radius: 12px;\n    padding: 14px 16px;\n    margin: 0 0 18px;\n    cursor: pointer;\n    text-align: left;\n    transition: transform 0.12s, border-color 0.12s, box-shadow 0.12s;\n    -webkit-tap-highlight-color: transparent;\n  }\n  .cust-measure-help-card:hover {\n    border-color: #d4a72c;\n    transform: translateY(-1px);\n    box-shadow: 0 4px 12px rgba(212, 167, 44, 0.18);\n  }\n  .cust-measure-help-ico {\n    font-size: 28px; line-height: 1; flex-shrink: 0;\n  }\n  .cust-measure-help-text { flex: 1; min-width: 0; }\n  .cust-measure-help-text strong {\n    display: block; color: #6b4d00; font-weight: 800; font-size: 15px;\n    margin-bottom: 2px;\n  }\n  .cust-measure-help-text span {\n    display: block; color: #8a6515; font-size: 13px; line-height: 1.45;\n  }\n  .cust-measure-help-arr {\n    color: #a66400; font-size: 20px; font-weight: 700;\n    flex-shrink: 0; transition: transform 0.12s;\n  }\n  .cust-measure-help-card:hover .cust-measure-help-arr {\n    transform: translateX(3px);\n  }\n\n  .measure-section { background: var(--paper); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); margin-bottom: 16px; }\n  .measure-section h3 { font-size: 16px; color: var(--navy); margin-bottom: 4px; }\n  .measure-section .section-hint { font-size: 13px; color: var(--slate); margin-bottom: 16px; }\n\n  /* REFERENCE PHOTOS \u2014 grid of square thumbs with a Remove overlay.\n     Lives on the Measurements step. Each card stays a stable 100\u00d7100\n     so the layout doesn't reflow as photos finish uploading. */\n  .photos-section { margin-top: 16px; }\n  .photo-upload-grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));\n    gap: 10px;\n    margin-bottom: 12px;\n  }\n  .photo-upload-grid:empty { display: none; }\n  .photo-card {\n    position: relative;\n    aspect-ratio: 1 / 1;\n    background: var(--line-soft);\n    border: 1px solid var(--line);\n    border-radius: 10px;\n    overflow: hidden;\n  }\n  .photo-card img {\n    width: 100%; height: 100%; object-fit: cover;\n    display: block;\n  }\n  .photo-card .photo-remove {\n    position: absolute; top: 4px; right: 4px;\n    background: rgba(26, 37, 64, 0.85); color: white;\n    width: 26px; height: 26px; border-radius: 999px;\n    display: flex; align-items: center; justify-content: center;\n    font-size: 14px; font-weight: 700;\n    cursor: pointer; user-select: none;\n    border: none;\n    -webkit-tap-highlight-color: transparent;\n  }\n  .photo-card.uploading::after {\n    content: 'Uploading\u2026';\n    position: absolute; inset: 0;\n    display: flex; align-items: center; justify-content: center;\n    background: rgba(0,0,0,0.5); color: white;\n    font-size: 11px; font-weight: 600;\n  }\n  .photo-card.failed::after {\n    content: '\u26a0 Upload failed';\n    position: absolute; inset: 0;\n    display: flex; align-items: center; justify-content: center;\n    background: rgba(193, 74, 74, 0.78); color: white;\n    font-size: 11px; font-weight: 600;\n    text-align: center; padding: 6px;\n  }\n  .photo-add-btn { display: inline-flex; align-items: center; gap: 6px; }\n  @media (max-width: 640px) {\n    .photo-upload-grid { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px; }\n  }\n\n  /* ALERTS */\n  .alert { padding: 14px 18px; border-radius: 10px; font-size: 13px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 12px; }\n  .alert .ico { font-size: 18px; line-height: 1.2; flex-shrink: 0; }\n  .alert.info { background: #e6f0f7; border-left: 4px solid #3a7095; color: #234862; }\n  .alert.warn { background: var(--gold-pale); border-left: 4px solid var(--gold); color: #5a4a1f; }\n  .alert.success { background: var(--green-pale); border-left: 4px solid var(--green); color: #1f4d36; }\n  .alert.error { background: var(--coral-pale); border-left: 4px solid var(--coral); color: #5a2519; }\n  .alert strong { display: block; margin-bottom: 2px; }\n\n  /* CONDITION CARDS \u2014 image-based */\n  .condition-card {\n    background: var(--paper); border: 2px solid var(--line);\n    border-radius: var(--radius);\n    cursor: pointer; transition: all 0.2s;\n    text-align: left; display: flex; flex-direction: column;\n    padding: 0; overflow: hidden;\n    position: relative;\n  }\n  .condition-card:hover { border-color: var(--green-light); transform: translateY(-2px); box-shadow: var(--shadow-md); }\n  .condition-card.selected { border-color: var(--green); box-shadow: 0 0 0 4px rgba(45, 110, 78, 0.12); }\n  .condition-card.selected::after {\n    content: \"\u2713\"; position: absolute; top: 10px; right: 10px;\n    width: 26px; height: 26px; background: var(--green); color: white;\n    border-radius: 50%; display: flex; align-items: center; justify-content: center;\n    font-weight: 700; font-size: 13px; z-index: 2;\n    box-shadow: 0 2px 8px rgba(0,0,0,0.2);\n  }\n  .condition-card .card-image { height: 130px; }\n  .condition-card .cond-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; flex: 1; }\n  .condition-card .cond-name { font-size: 15px; font-weight: 700; color: var(--navy); }\n  .condition-card .cond-prep { color: var(--slate); font-size: 12px; line-height: 1.45; }\n  .condition-card .cond-add {\n    font-size: 15px; color: var(--coral); font-weight: 700;\n    padding-top: 10px; border-top: 1px dashed var(--line);\n  }\n  /* Footer wrapper that keeps the timing badge + the prep cost line glued\n     to the bottom of every condition card, so all three cards line up\n     uniformly even when their bullet lists are different lengths. */\n  .condition-card .cond-card-footer {\n    margin-top: auto;\n    display: flex; flex-direction: column; gap: 8px;\n    width: 100%;\n  }\n  .condition-card.selected .cond-add { color: var(--green); }\n  .condition-card.recommended {\n    border-color: var(--gold);\n    background: linear-gradient(180deg, var(--gold-pale) 0%, var(--paper) 25%);\n  }\n  .condition-card.recommended .reco-flag {\n    position: absolute; top: 12px; left: 12px;\n    background: var(--gold); color: white;\n    font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 100px;\n    letter-spacing: 0.1em; text-transform: uppercase;\n    z-index: 2; box-shadow: 0 2px 8px rgba(0,0,0,0.2);\n  }\n  .condition-card.recommended.selected { border-color: var(--green); }\n\n  /* Bullet point sections inside condition cards */\n  .cond-bullets-group { margin-top: 10px; }\n  .cond-bullets-label {\n    font-size: 10px; font-weight: 700; color: var(--slate);\n    text-transform: uppercase; letter-spacing: 0.08em;\n    margin-bottom: 4px;\n  }\n  .cond-bullets { list-style: none; margin: 0 0 6px 0; padding: 0; }\n  .cond-bullets li {\n    font-size: 12px; color: var(--navy); line-height: 1.4;\n    padding: 3px 0 3px 18px; position: relative;\n  }\n  .cond-bullets li::before {\n    content: \"\u2022\"; position: absolute; left: 4px; color: var(--green); font-weight: 700;\n  }\n  .cond-bullets.process li::before { content: \"\u2192\"; color: var(--gold); font-size: 11px; }\n  .cond-timing {\n    font-size: 11px; color: var(--gold); font-weight: 700;\n    background: var(--gold-pale); padding: 4px 8px;\n    border-radius: 6px; margin-top: 8px;\n    display: inline-block; text-transform: uppercase; letter-spacing: 0.04em;\n  }\n\n  /* Service-includes section \u2014 checkmarked-by-default, never billable, never togglable */\n  .service-includes-section { background: linear-gradient(180deg, var(--green-pale) 0%, var(--paper) 80%); border: 1px solid rgba(45, 110, 78, 0.25); }\n  .service-includes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }\n  @media (max-width: 760px) { .service-includes-grid { grid-template-columns: 1fr; } }\n  .service-include-row {\n    display: flex; align-items: center; gap: 12px;\n    padding: 12px 14px; background: var(--paper);\n    border: 1.5px solid rgba(45, 110, 78, 0.25);\n    border-radius: 10px;\n  }\n  .service-include-row .check {\n    width: 28px; height: 28px; flex-shrink: 0;\n    background: var(--green); color: white;\n    border-radius: 50%;\n    display: flex; align-items: center; justify-content: center;\n    font-weight: 800; font-size: 14px;\n  }\n  .service-include-row .addon-desc { flex: 1; }\n  .service-include-row .addon-desc .ad-name { font-size: 14px; font-weight: 700; color: var(--navy); }\n  .service-include-row .addon-desc .ad-sub { font-size: 12px; color: var(--slate); margin-top: 2px; line-height: 1.45; }\n  .service-include-row .price { color: var(--green); font-weight: 700; font-size: 12px; letter-spacing: 0.06em; }\n\n  /* ADD-ONS */\n  .addon-section { background: var(--paper); border-radius: var(--radius); padding: 18px 20px; margin-bottom: 14px; box-shadow: var(--shadow-sm); }\n  .addon-section h4 { font-size: 14px; color: var(--navy); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; }\n  .addon-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }\n  @media (max-width: 760px) { .addon-grid { grid-template-columns: 1fr; } }\n  .toggle-row .addon-img {\n    width: 44px; height: 44px; border-radius: 8px;\n    background-size: cover; background-position: center;\n    background-color: var(--line-soft); flex-shrink: 0;\n    border: 1px solid var(--line);\n  }\n  .toggle-row .addon-desc {\n    flex: 1; display: flex; flex-direction: column;\n  }\n  .toggle-row .addon-desc .ad-name { font-size: 14px; font-weight: 600; color: var(--navy); }\n  .toggle-row .addon-desc .ad-sub { font-size: 11px; color: var(--slate); margin-top: 2px; line-height: 1.4; }\n  .toggle-row .addon-desc .ad-name .restr { font-size: 10px; color: var(--coral); font-weight: 700; text-transform: uppercase; margin-left: 6px; letter-spacing: 0.05em; }\n  /* Custom addon button */\n  .custom-add-btn {\n    background: var(--navy); color: white;\n    padding: 6px 12px; border-radius: 6px;\n    font-size: 12px; font-weight: 600;\n  }\n  .custom-add-btn:hover { background: var(--navy-light); }\n  .custom-add-form {\n    background: var(--cream); padding: 14px;\n    border-radius: 10px; margin-top: 12px;\n    border: 1px dashed var(--slate);\n  }\n  .custom-add-form .form-row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 8px; align-items: end; }\n  @media (max-width: 760px) { .custom-add-form .form-row { grid-template-columns: 1fr; } }\n  .custom-add-form input, .custom-add-form select {\n    width: 100%; padding: 8px 10px; border: 1px solid var(--line); border-radius: 6px;\n    font-size: 13px; background: white;\n  }\n  .custom-add-form label { font-size: 11px; color: var(--slate); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; display: block; }\n  .custom-add-form .btn-save { background: var(--green); color: white; padding: 8px 14px; border-radius: 6px; font-weight: 600; font-size: 13px; }\n  .custom-add-form .btn-cancel { background: transparent; color: var(--slate); padding: 8px 8px; font-size: 13px; }\n  .custom-item-row {\n    display: flex; align-items: center; gap: 12px;\n    padding: 10px 14px; background: #fff7e6;\n    border: 1.5px dashed var(--gold); border-radius: 10px;\n    margin-bottom: 6px;\n  }\n  .custom-item-row .name { flex: 1; font-size: 14px; font-weight: 600; color: var(--navy); }\n  .custom-item-row .price { color: var(--green); font-weight: 700; font-size: 14px; margin-right: 8px; }\n  .custom-item-row .remove-btn { color: var(--coral); font-size: 18px; padding: 2px 8px; }\n  .employee-badge {\n    display: inline-block;\n    /* Match the size & shape of the adjacent \"+ Add Custom Item\" button\n       but with a warm coral palette so it reads as \"internal/heads-up\"\n       rather than another action button. */\n    background: var(--coral-pale); color: var(--coral);\n    border: 1px solid var(--coral);\n    padding: 6px 12px; border-radius: 6px;\n    font-size: 12px; font-weight: 700;\n    letter-spacing: 0.06em; text-transform: uppercase;\n    line-height: 1;\n  }\n\n  /* STAGE NAV */\n  .stage-nav { display: flex; gap: 12px; margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--line); }\n  .btn { padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 700; transition: all 0.15s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }\n  .btn:hover, .btn:focus, .btn:visited { text-decoration: none; }\n  .btn-primary { background: var(--green); color: white; }\n  .btn-primary:hover { background: var(--green-light); transform: translateY(-1px); box-shadow: var(--shadow-md); }\n  .btn-primary:disabled { background: var(--line); color: var(--slate); cursor: not-allowed; transform: none; box-shadow: none; }\n  .btn-secondary { background: transparent; color: var(--navy); border: 2px solid var(--line); }\n  .btn-secondary:hover { border-color: var(--navy); background: var(--paper); }\n  .btn-ghost { background: transparent; color: var(--slate); }\n  .btn-ghost:hover { color: var(--navy); }\n  .btn .arr-l { margin-right: -2px; }\n  .btn .arr-r { margin-left: -2px; }\n\n  /* BUNDLE */\n  .saved-projects { background: var(--paper); border-radius: var(--radius); padding: 18px 20px; margin-bottom: 18px; border: 1px solid var(--line); }\n  .bundle-stack-title { font-size: 12px; color: var(--slate); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; margin-bottom: 8px; }\n  .saved-project-row { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px dashed var(--line); gap: 10px; }\n  .saved-project-row:last-child { border-bottom: none; }\n  .saved-project-row .ico { font-size: 22px; }\n  .saved-project-row .meta { flex: 1; padding-left: 4px; }\n  .saved-project-row .meta .nm { font-weight: 700; color: var(--navy); font-size: 14px; }\n  .saved-project-row .meta .det { font-size: 12px; color: var(--slate); margin-top: 2px; }\n  .saved-project-row .amt { color: var(--green); font-weight: 700; font-size: 16px; margin-right: 6px; }\n  .saved-project-row .row-actions { display: flex; gap: 6px; }\n  .saved-project-row .row-actions button { padding: 6px 12px; border-radius: 7px; font-size: 12px; font-weight: 600; transition: all 0.12s; }\n  .saved-project-row .row-actions .edit-btn { background: var(--navy); color: white; }\n  .saved-project-row .row-actions .edit-btn:hover { background: var(--navy-light); }\n  .saved-project-row .row-actions .remove-btn { background: transparent; color: var(--coral); border: 1px solid var(--coral); }\n  .saved-project-row .row-actions .remove-btn:hover { background: var(--coral-pale); }\n\n  /* FINAL BREAKDOWN */\n  .final-grid { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }\n  @media (max-width: 980px) { .final-grid { grid-template-columns: 1fr; } }\n  .final-main { background: var(--paper); border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-md); }\n  .final-main h3 { font-size: 14px; color: var(--green); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 16px; }\n  .breakdown-line { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed var(--line); gap: 12px; }\n  .breakdown-line:last-child { border-bottom: none; }\n  .breakdown-line .desc { font-size: 14px; color: var(--navy); font-weight: 500; }\n  .breakdown-line .desc small { display: block; font-size: 12px; color: var(--slate); font-weight: 400; margin-top: 2px; }\n  .breakdown-line .val { font-weight: 700; color: var(--navy); white-space: nowrap; }\n  .breakdown-line.discount .val { color: var(--green); }\n  .breakdown-line.minimum { background: var(--gold-pale); margin: 4px -12px; padding: 10px 12px; border-radius: 6px; border: none; }\n  .breakdown-line.minimum .desc { color: #5a4a1f; }\n  .breakdown-line.minimum .val { color: var(--gold); }\n  .breakdown-section { margin-bottom: 18px; padding-bottom: 12px; border-bottom: 2px solid var(--line); }\n  .breakdown-section h4 { font-size: 12px; color: var(--slate); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; margin-bottom: 6px; }\n  .breakdown-section:last-child { border-bottom: none; }\n\n  .color-pill { display: inline-flex; align-items: center; gap: 8px; background: var(--cream); padding: 4px 10px; border-radius: 100px; font-size: 12px; font-weight: 600; color: var(--navy); margin-top: 4px; }\n  .color-pill .dot { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.15); background-size: cover; background-position: center; }\n  .color-pill.hoa { background: var(--gold-pale); color: #5a4a1f; }\n  .color-pill.hoa .dot { background: var(--gold); border-color: #8e6e26; }\n\n  .grand-total { margin-top: 12px; padding: 18px 20px; background: var(--navy); border-radius: var(--radius); color: white; display: flex; justify-content: space-between; align-items: center; }\n  .grand-total .label { font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; opacity: 0.85; max-width: 50%; }\n  .grand-total .amount { font-size: 32px; font-weight: 800; letter-spacing: -0.5px; display: block; }\n  .grand-total .grand-total-amount-block { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }\n  .grand-total .grand-total-savings {\n    display: block; font-size: 12px; color: var(--gold);\n    font-weight: 600; margin-top: 4px; letter-spacing: 0;\n    text-transform: none;\n  }\n  /* Math walk-through \u2014 explicit calculation lines above Grand Total */\n  .math-walk {\n    margin-top: 14px; padding: 14px 18px;\n    background: var(--cream); border: 1px solid var(--line);\n    border-radius: 10px;\n  }\n  .math-walk h4 {\n    font-size: 11px; color: var(--slate);\n    text-transform: uppercase; letter-spacing: 0.08em;\n    font-weight: 700; margin-bottom: 10px;\n  }\n  .math-walk-row {\n    display: flex; justify-content: space-between;\n    padding: 5px 0; font-size: 13px; color: var(--navy);\n  }\n  .math-walk-row.math-walk-subtotal {\n    border-top: 1px solid var(--line); margin-top: 4px; padding-top: 8px;\n    font-weight: 700;\n  }\n  .math-walk-row.math-walk-discount {\n    color: var(--green); font-weight: 600;\n  }\n  .math-walk-row.math-walk-total-savings {\n    border-top: 1px dashed var(--line); margin-top: 4px; padding-top: 8px;\n    color: var(--green); font-weight: 800; font-size: 14px;\n  }\n  /* Collapse-project button on the active breakdown header */\n  .breakdown-header-row {\n    display: flex; justify-content: space-between; align-items: center;\n    gap: 12px; margin-bottom: 16px;\n  }\n  .breakdown-header-row h3 {\n    flex: 1; min-width: 0;\n  }\n  .btn-collapse-project {\n    background: transparent; color: var(--slate);\n    border: 1px solid var(--line); border-radius: 7px;\n    padding: 6px 12px; font-size: 12px; font-weight: 600;\n    cursor: pointer; transition: all 0.15s;\n    white-space: nowrap; flex-shrink: 0;\n  }\n  .btn-collapse-project:hover {\n    border-color: var(--navy); color: var(--navy);\n    background: var(--cream);\n  }\n\n  /* Project Total \u2014 sits in the middle of the breakdown; less prominent than the bottom Grand Total */\n  .project-total {\n    margin-top: 12px; padding: 14px 18px;\n    background: var(--cream); border: 1.5px solid var(--navy);\n    border-radius: 10px; color: var(--navy);\n    display: flex; justify-content: space-between; align-items: center;\n  }\n  .project-total .label {\n    font-size: 12px; text-transform: uppercase;\n    letter-spacing: 0.1em; font-weight: 700; color: var(--slate);\n  }\n  .project-total .amount {\n    font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: var(--navy);\n  }\n  /* DIY per-project breakdown (when multiple projects in the quote) */\n  .diy-project-list {\n    background: var(--cream); border-radius: 8px;\n    padding: 10px 14px; margin-bottom: 12px;\n    border: 1px dashed var(--line);\n  }\n  .diy-project-item {\n    display: flex; justify-content: space-between;\n    padding: 5px 0; font-size: 12px; color: var(--slate);\n    border-bottom: 1px dashed rgba(0,0,0,0.06);\n  }\n  .diy-project-item:last-child { border-bottom: none; }\n\n  .final-side { background: var(--paper); border-radius: var(--radius-lg); padding: 22px; box-shadow: var(--shadow-md); position: sticky; top: 90px; }\n  .final-side h3 { font-size: 14px; color: var(--navy); margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--line); }\n  /* Collapsible Adjust & Recalculate panel \u2014 full-width header acts as the\n     toggle button. On mobile this defaults collapsed; on desktop it defaults\n     expanded. The state persists across re-renders. */\n  .edit-panel-toggle {\n    width: 100%; display: flex; justify-content: space-between; align-items: center;\n    background: transparent; border: none; padding: 0; margin-bottom: 14px;\n    padding-bottom: 8px; border-bottom: 1px solid var(--line);\n    cursor: pointer; user-select: none;\n  }\n  .edit-panel-toggle h3 {\n    margin: 0; padding: 0; border: none;\n    font-size: 14px; color: var(--navy);\n  }\n  .edit-panel-arrow {\n    font-size: 14px; color: var(--slate);\n    transition: transform 0.2s ease;\n  }\n  .edit-panel-collapsed .edit-panel-toggle { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }\n  .edit-panel-collapsed .edit-panel-arrow { transform: rotate(-90deg); }\n  .edit-panel-collapsed .edit-panel-body { display: none; }\n  .side-section { margin-bottom: 18px; }\n  .side-section h4 { font-size: 11px; color: var(--slate); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; font-weight: 700; }\n  .mini-tier-row { padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; cursor: pointer; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; transition: all 0.15s; font-size: 13px; }\n  .mini-tier-row:hover { border-color: var(--green-light); }\n  .mini-tier-row.active { border-color: var(--green); background: var(--green-pale); font-weight: 700; }\n  .mini-tier-row .label { font-weight: 600; color: var(--navy); }\n  .mini-tier-row .price { color: var(--green); font-weight: 700; }\n\n  .mini-toggle { display: flex; align-items: center; gap: 8px; padding: 6px 10px; cursor: pointer; border-radius: 6px; transition: background 0.12s; font-size: 13px; }\n  .mini-toggle:hover { background: var(--line-soft); }\n  .mini-toggle.checked { background: var(--green-pale); color: var(--green); }\n  .mini-toggle .check { width: 16px; height: 16px; border: 1.5px solid var(--line); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; }\n  .mini-toggle.checked .check { background: var(--green); border-color: var(--green); }\n  .mini-toggle.checked .check::after { content: \"\u2713\"; }\n  .mini-toggle .name { flex: 1; }\n  .mini-toggle .price { color: var(--green); font-weight: 600; font-size: 12px; }\n  .mini-toggle .mini-qty-input {\n    width: 48px; padding: 3px 6px; font-size: 12px;\n    border: 1px solid var(--line); border-radius: 4px;\n    text-align: center; margin-right: 6px;\n    background: white;\n  }\n  .mini-toggle .mini-qty-input:focus { outline: none; border-color: var(--green); }\n\n  .payment-pill { display: inline-flex; align-items: center; gap: 6px; background: var(--gold-pale); color: #5a4a1f; padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; margin-left: 8px; }\n\n  .action-bar { margin-top: 28px; padding: 24px; background: var(--paper); border-radius: var(--radius-lg); display: flex; gap: 12px; box-shadow: var(--shadow-md); flex-wrap: wrap; justify-content: space-between; align-items: center; }\n  .action-bar .left { display: flex; gap: 8px; flex-wrap: wrap; }\n  .action-bar .right { display: flex; gap: 10px; flex-wrap: wrap; }\n\n  .success-screen { text-align: center; padding: 48px 24px; background: var(--paper); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); }\n  .jobber-push-row {\n    display: flex; align-items: flex-start; gap: 10px;\n    padding: 12px 16px; border-radius: 10px;\n    font-size: 14px; text-align: left;\n  }\n  .jobber-push-row.pending { background: #fff5e6; color: #6b5d2a; }\n  .jobber-push-row.success { background: #e6f5ec; color: #2d6e4e; }\n  .jobber-push-row.error   { background: var(--coral-pale); color: var(--coral); }\n  .jobber-push-row .ico { font-size: 18px; flex-shrink: 0; }\n  /* Diagnostic <pre> blocks inside the error row \u2014 wrap long lines\n     (Jobber's encoded IDs are 50+ chars and were causing horizontal\n     overflow) and constrain height with vertical scroll. */\n  .jobber-push-row .err-pre {\n    margin: 6px 0 0;\n    padding: 8px 10px;\n    background: #fff;\n    color: var(--navy);\n    border-radius: 6px;\n    font-size: 11px; line-height: 1.4;\n    white-space: pre-wrap;\n    word-break: break-word;\n    overflow-wrap: anywhere;\n    max-height: 200px;\n    overflow-y: auto;\n    text-align: left;\n    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;\n  }\n  .jobber-push-row details summary { color: inherit; }\n  .success-icon { width: 72px; height: 72px; background: var(--green); border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-size: 36px; margin: 0 auto 20px; animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }\n  @keyframes pop { 0% { transform: scale(0); } 100% { transform: scale(1); } }\n\n  /* Project-switch dialog action row */\n  .project-switch-actions {\n    padding: 14px 20px 18px;\n    display: flex; flex-wrap: wrap; gap: 8px;\n    justify-content: flex-end;\n    border-top: 1px solid var(--line);\n  }\n  .project-switch-actions .btn { min-height: 44px; padding: 10px 16px; font-size: 14px; }\n  @media (max-width: 640px) {\n    .project-switch-actions { flex-direction: column-reverse; }\n    .project-switch-actions .btn { width: 100%; }\n  }\n\n  /* Read-only view (finished/archived/trashed) */\n  .view-actions { display: flex; gap: 10px; flex-wrap: wrap; margin: 18px 0 24px; }\n  .view-summary { background: var(--paper); border: 1.5px solid var(--line); border-radius: 12px; padding: 22px; }\n  .view-summary h3 { font-size: 13px; font-weight: 700; color: var(--slate); text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 10px; }\n  .view-summary h3:not(:first-child) { margin-top: 22px; }\n  .view-summary .vs-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--line); font-size: 14px; }\n  .view-summary .vs-row:last-of-type { border-bottom: none; }\n  .view-summary .vs-row .lbl { color: var(--slate); }\n  .view-summary .vs-row .val { color: var(--navy); font-weight: 600; text-align: right; }\n  .view-summary .vs-proj { padding: 12px 14px; background: #fafaf7; border-radius: 8px; margin-bottom: 10px; }\n  .view-summary .vs-proj-head { display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; color: var(--navy); margin-bottom: 6px; }\n  .view-summary .vs-proj-meta { font-size: 12px; color: var(--slate); }\n  /* Jobber status block inside the read-only summary */\n  .view-summary .vs-jobber {\n    margin: 16px 0 0; padding: 14px 16px;\n    border-radius: 10px;\n    display: flex; flex-wrap: wrap; gap: 10px;\n    align-items: center; justify-content: space-between;\n  }\n  .view-summary .vs-jobber.success { background: #e6f5ec; color: #2d6e4e; }\n  .view-summary .vs-jobber.error   { background: var(--coral-pale); color: var(--coral); }\n  .view-summary .vs-jobber.pending { background: #fff5e6; color: #6b5d2a; }\n  .view-summary .vs-jobber-status { display: flex; align-items: center; gap: 8px; font-size: 14px; flex: 1; min-width: 200px; }\n  .view-summary .vs-jobber-status .ico { font-size: 18px; }\n  .view-summary .vs-jobber-btn { font-size: 13px; padding: 8px 14px; min-height: 38px; }\n  @media (max-width: 640px) {\n    .view-summary .vs-jobber { flex-direction: column; align-items: stretch; }\n    .view-summary .vs-jobber-btn { width: 100%; }\n  }\n\n  .view-summary .vs-total { margin-top: 18px; padding-top: 16px; border-top: 2px solid var(--green); display: flex; justify-content: space-between; align-items: center; }\n  .view-summary .vs-total .lbl { font-size: 14px; color: var(--slate); text-transform: uppercase; letter-spacing: 0.06em; }\n  .view-summary .vs-total .val { font-size: 24px; font-weight: 800; color: var(--green); }\n  .view-status-pill { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-left: 10px; }\n  .view-status-pill.finished { background: #e6f5ec; color: #2d6e4e; }\n  .view-status-pill.archived { background: #f0ece0; color: #6b5d2a; }\n  .view-status-pill.trashed  { background: var(--coral-pale); color: var(--coral); }\n  @media (max-width: 640px) {\n    .view-actions .btn { flex: 1; min-height: 44px; font-size: 13px; }\n    .view-summary { padding: 16px 14px; }\n    .view-summary .vs-row { font-size: 13px; }\n    .view-summary .vs-total .val { font-size: 20px; }\n  }\n\n  .editing-banner { background: var(--gold-pale); border-left: 4px solid var(--gold); padding: 10px 16px; border-radius: 8px; font-size: 13px; color: #5a4a1f; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }\n  .editing-banner strong { color: var(--navy); }\n  .editing-banner button { font-size: 12px; padding: 4px 10px; border-radius: 6px; background: var(--navy); color: white; font-weight: 600; }\n  /* Cancel-add button inside the \"Adding another project\" banner */\n  .btn-cancel-add {\n    margin-left: auto; padding: 8px 14px;\n    background: var(--paper); color: var(--navy);\n    border: 1.5px solid var(--navy); border-radius: 8px;\n    font-size: 12px; font-weight: 700; cursor: pointer;\n    transition: all 0.15s; white-space: nowrap;\n  }\n  .btn-cancel-add:hover { background: var(--navy); color: white; }\n\n  @media print { .app-header, .progress, .stage-nav, .action-bar, .final-side, .side-tracker, .side-tracker-tab, .info-dialog { display: none !important; } }\n\n  /* ---- Customer search on Step 1 (Jobber type-ahead) ---- */\n  .cust-search {\n    position: relative;\n    margin: 0 0 20px;\n    padding: 14px 16px;\n    background: #f0f5f1;\n    border: 1.5px solid #d2e6d6;\n    border-radius: 12px;\n  }\n  .cust-search-label {\n    display: block; font-size: 12px; font-weight: 700;\n    color: var(--green); text-transform: uppercase;\n    letter-spacing: 0.06em; margin-bottom: 8px;\n  }\n  .cust-search input {\n    width: 100%; padding: 12px 14px;\n    border: 1.5px solid var(--line); border-radius: 10px;\n    font-size: 16px;\n    background: var(--paper); color: var(--navy);\n    -webkit-appearance: none;\n    transition: border-color 0.12s;\n  }\n  .cust-search input:focus { outline: none; border-color: var(--green); }\n  .cust-search-results {\n    position: absolute; left: 16px; right: 16px; top: 100%;\n    background: var(--paper); border: 1.5px solid var(--line);\n    border-radius: 10px; box-shadow: var(--shadow-lg);\n    margin-top: 4px;\n    max-height: 320px; overflow-y: auto;\n    z-index: 20;\n  }\n  .cust-result {\n    padding: 10px 14px; border-bottom: 1px solid var(--line);\n    cursor: pointer; transition: background 0.12s;\n    -webkit-tap-highlight-color: transparent;\n  }\n  .cust-result:last-child { border-bottom: none; }\n  .cust-result:hover, .cust-result.kbd-active { background: #eaf3ec; }\n  .cust-result .cr-name { font-size: 14px; font-weight: 700; color: var(--navy); }\n  .cust-result .cr-meta {\n    font-size: 12px; color: var(--slate); margin-top: 2px;\n    display: flex; gap: 8px; flex-wrap: wrap;\n  }\n  .cust-result .cr-meta .sep { opacity: 0.5; }\n  .cust-search-empty, .cust-search-loading {\n    padding: 12px 14px; font-size: 13px; color: var(--slate);\n    text-align: center; font-style: italic;\n  }\n  .cust-search-picked {\n    margin-top: 8px;\n    padding: 8px 12px;\n    background: #e6f5ec; color: #2d6e4e;\n    border-radius: 8px; font-size: 13px;\n    display: flex; align-items: center; justify-content: space-between;\n    gap: 10px;\n  }\n  .cust-search-picked .pck-clear {\n    background: transparent; border: none; color: var(--coral);\n    font-size: 12px; font-weight: 700; cursor: pointer;\n    text-decoration: underline;\n    -webkit-tap-highlight-color: transparent;\n  }\n  @media (max-width: 640px) {\n    .cust-search { padding: 12px; }\n    .cust-search input { font-size: 16px; }\n    .cust-search-results { left: 12px; right: 12px; max-height: 280px; }\n    .cust-result { padding: 12px; }\n  }\n\n  /* DASHBOARD */\n  .dashboard-actions {\n    display: flex; gap: 12px; flex-wrap: wrap;\n    margin-bottom: 24px; padding-bottom: 24px;\n    border-bottom: 1px solid var(--line);\n  }\n  .draft-card {\n    display: flex; align-items: center; gap: 16px;\n    padding: 18px 22px; background: var(--paper);\n    border: 1.5px solid var(--line); border-radius: 12px;\n    margin-bottom: 12px; transition: all 0.15s;\n  }\n  .draft-card:hover { border-color: var(--green-light); transform: translateY(-1px); box-shadow: var(--shadow-md); }\n  .draft-card-main { flex: 1; }\n  .draft-customer { font-size: 16px; font-weight: 700; color: var(--navy); margin-bottom: 4px; }\n  .draft-meta {\n    display: flex; gap: 6px; flex-wrap: wrap; align-items: center;\n    font-size: 12px; color: var(--slate);\n  }\n  .quote-id-mono { font-family: ui-monospace, monospace; color: var(--navy); font-weight: 600; }\n  .draft-running-total {\n    color: var(--green); font-weight: 700; font-size: 14px; margin-top: 6px;\n  }\n  .draft-card-actions { display: flex; gap: 8px; align-items: center; }\n  .btn-ghost-danger {\n    background: transparent; color: var(--coral);\n    border: 1px solid var(--coral); padding: 10px 12px;\n    border-radius: 8px; font-size: 14px; cursor: pointer;\n    transition: all 0.12s;\n  }\n  .btn-ghost-danger:hover { background: var(--coral-pale); }\n  .empty-drafts {\n    text-align: center; padding: 48px 24px;\n    background: var(--paper); border-radius: 12px;\n    border: 1px dashed var(--line); margin-top: 16px;\n  }\n  .empty-drafts .empty-icon { font-size: 48px; opacity: 0.5; margin-bottom: 12px; }\n  .empty-drafts h3 { color: var(--navy); margin-bottom: 6px; }\n  .empty-drafts p { color: var(--slate); font-size: 14px; max-width: 400px; margin: 0 auto; }\n\n  /* ---- Recent Jobber Requests panel ---- */\n  .req-panel {\n    background: #fff8eb;\n    border: 1.5px solid #f1d68e;\n    border-radius: 12px;\n    margin: 0 0 18px;\n    overflow: hidden;\n  }\n  .req-panel summary {\n    list-style: none; cursor: pointer;\n    padding: 14px 16px;\n    display: flex; align-items: center; gap: 10px;\n    user-select: none; -webkit-tap-highlight-color: transparent;\n    min-height: 48px;\n  }\n  .req-panel summary::-webkit-details-marker { display: none; }\n  .req-panel summary .chev {\n    font-size: 12px; color: #a66400; transition: transform 0.15s;\n    width: 14px; text-align: center;\n  }\n  .req-panel[open] summary .chev { transform: rotate(90deg); }\n  .req-panel .rp-title {\n    flex: 1;\n    font-size: 13px; font-weight: 700; color: #a66400;\n    text-transform: uppercase; letter-spacing: 0.06em;\n  }\n  .req-panel summary .folder-count {\n    background: #f1d68e; color: #6b4d00;\n    padding: 2px 10px; border-radius: 999px;\n    font-size: 12px; font-weight: 700;\n  }\n  .req-panel-toolbar { padding: 0 12px 10px; }\n  .req-panel-toolbar input[type=\"search\"] {\n    width: 100%; box-sizing: border-box;\n    padding: 10px 14px; min-height: 40px;\n    background: var(--paper);\n    border: 1.5px solid #f1d68e; border-radius: 8px;\n    font-size: 14px; color: var(--navy);\n    -webkit-appearance: none;\n  }\n  .req-panel-toolbar input[type=\"search\"]:focus {\n    outline: none; border-color: #d4a72c;\n    box-shadow: 0 0 0 3px rgba(212, 167, 44, 0.18);\n  }\n  .req-panel-body { padding: 0 12px 12px; max-height: 460px; overflow-y: auto; }\n  .req-card {\n    display: flex; align-items: center; gap: 12px;\n    padding: 14px;\n    background: var(--paper);\n    border: 1px solid #f1d68e; border-radius: 10px;\n    margin-bottom: 8px;\n    transition: border-color 0.12s, transform 0.12s;\n    -webkit-tap-highlight-color: transparent;\n  }\n  .req-card:hover { border-color: #d4a72c; }\n  .req-card-main { flex: 1; min-width: 0; }\n  .req-card-cust { font-size: 15px; font-weight: 700; color: var(--navy); margin-bottom: 3px; word-break: break-word; }\n  .req-card-title { font-size: 13px; color: var(--navy); margin-bottom: 4px; }\n  .req-card-meta {\n    display: flex; gap: 6px; flex-wrap: wrap; align-items: center;\n    font-size: 12px; color: var(--slate);\n  }\n  .req-card-meta .sep { opacity: 0.5; }\n  .req-card-status {\n    display: inline-block; padding: 1px 8px; border-radius: 999px;\n    font-size: 10px; font-weight: 700; text-transform: uppercase;\n    letter-spacing: 0.04em;\n    background: #fff5e6; color: #a66400;\n  }\n  .req-card-actions { display: flex; gap: 6px; flex-shrink: 0; }\n  .req-card-actions .btn { padding: 8px 14px; font-size: 13px; min-height: 36px; }\n  .req-empty, .req-error {\n    padding: 14px; color: var(--slate); font-size: 13px;\n    text-align: center; font-style: italic;\n  }\n  .req-error { color: var(--coral); }\n  @media (max-width: 640px) {\n    .req-card { flex-direction: column; align-items: stretch; }\n    .req-card-actions { justify-content: stretch; }\n    .req-card-actions .btn { flex: 1; min-height: 42px; }\n    .req-panel summary { padding: 12px; min-height: 52px; }\n  }\n\n  /* ---- NEW DASHBOARD CHROME ---- */\n  .dash-stats {\n    display: flex; gap: 12px; flex-wrap: wrap;\n    margin: 12px 0 18px;\n  }\n  .stat-card {\n    flex: 1 1 140px; min-width: 140px;\n    background: var(--paper); border: 1.5px solid var(--line);\n    border-radius: 12px; padding: 14px 16px;\n  }\n  .stat-card .stat-num { font-size: 22px; font-weight: 800; color: var(--navy); line-height: 1.1; }\n  .stat-card .stat-sub { font-size: 12px; color: var(--slate); margin-top: 4px; }\n  .stat-card .stat-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--slate); margin-top: 8px; }\n\n  .dash-toolbar {\n    display: flex; gap: 12px; flex-wrap: wrap; align-items: center;\n    margin-bottom: 18px; padding-bottom: 18px;\n    border-bottom: 1px solid var(--line);\n  }\n  .dash-search {\n    flex: 1; min-width: 220px; position: relative;\n  }\n  .dash-search input {\n    width: 100%; padding: 12px 14px 12px 42px;\n    border: 1.5px solid var(--line); border-radius: 10px;\n    font-size: 16px; /* 16px on mobile to prevent iOS autozoom */\n    background: var(--paper); color: var(--navy);\n    transition: border-color 0.12s;\n    -webkit-appearance: none;\n  }\n  .dash-search input::placeholder {\n    color: var(--slate); opacity: 0.6;\n  }\n  .dash-search input:focus { outline: none; border-color: var(--green); }\n  .dash-search::before {\n    content: '\ud83d\udd0e'; position: absolute; left: 14px; top: 50%;\n    transform: translateY(-50%); font-size: 13px; opacity: 0.55;\n    pointer-events: none;\n  }\n\n  .recent-strip { margin: 8px 0 24px; }\n  .recent-strip h3,\n  .folder summary .folder-label {\n    font-size: 13px; font-weight: 700; color: var(--slate);\n    text-transform: uppercase; letter-spacing: 0.08em;\n  }\n  .recent-strip h3 { margin: 0 0 10px; }\n\n  .folder {\n    background: var(--paper); border: 1.5px solid var(--line);\n    border-radius: 12px; margin-bottom: 10px;\n    overflow: hidden;\n  }\n  .folder summary {\n    list-style: none; cursor: pointer;\n    padding: 14px 16px; display: flex; align-items: center; gap: 10px;\n    user-select: none; -webkit-tap-highlight-color: transparent;\n    min-height: 48px;\n  }\n  .folder summary::-webkit-details-marker { display: none; }\n  .folder summary .chev {\n    font-size: 12px; color: var(--slate); transition: transform 0.15s;\n    width: 14px; text-align: center;\n  }\n  .folder[open] summary .chev { transform: rotate(90deg); }\n  .folder summary .folder-icon { font-size: 18px; }\n  .folder summary .folder-label { flex: 1; }\n  .folder summary .folder-count {\n    background: var(--line-soft); color: var(--navy);\n    padding: 2px 10px; border-radius: 999px;\n    font-size: 12px; font-weight: 700;\n  }\n  .folder-body { padding: 0 12px 12px; }\n  .folder-empty {\n    padding: 14px 4px; color: var(--slate); font-size: 13px;\n    text-align: center;\n  }\n\n  /* Dashboard title row \u2014 pairs the welcome copy with a compact\n     cluster of utility buttons (Refresh, Select, Pricing). These are\n     intentionally low-contrast icon+label pills so they don't compete\n     with Start-New-Quote in the primary toolbar below. */\n  .dash-title-row {\n    display: flex; align-items: flex-start; justify-content: space-between;\n    gap: 16px; flex-wrap: wrap;\n    margin-bottom: 4px;\n  }\n  .dash-title-row > div:first-child { flex: 1; min-width: 240px; }\n  .dash-utility {\n    display: flex; gap: 6px; flex-wrap: wrap;\n    padding-top: 6px;\n  }\n  .dash-util-btn {\n    display: inline-flex; align-items: center; gap: 6px;\n    padding: 8px 12px; min-height: 38px;\n    background: var(--paper); color: var(--slate);\n    border: 1px solid var(--line); border-radius: 999px;\n    font-size: 12px; font-weight: 600;\n    cursor: pointer; transition: background 0.12s, color 0.12s, border-color 0.12s;\n    -webkit-tap-highlight-color: transparent;\n  }\n  .dash-util-btn:hover { background: var(--line-soft); color: var(--navy); border-color: var(--navy); }\n  .dash-util-btn .ico { font-size: 14px; line-height: 1; }\n  .dash-util-btn.active {\n    background: var(--navy); color: white; border-color: var(--navy);\n  }\n  @media (max-width: 640px) {\n    .dash-utility { width: 100%; justify-content: flex-end; }\n    .dash-util-btn .lbl { display: none; }\n    .dash-util-btn { padding: 8px 10px; min-width: 40px; justify-content: center; }\n    .dash-util-btn .ico { font-size: 16px; }\n  }\n\n  /* Bulk-select toggle + action bar.\n     When bulkMode is on, the dashboard's data-bulk attribute flips\n     and every .qrow shifts to expose its leading checkbox. */\n  #bulkSelectToggle.active {\n    background: var(--navy); color: white; border-color: var(--navy);\n  }\n  .bulk-action-bar {\n    position: sticky; top: 0; z-index: 30;\n    margin: 0 0 14px;\n    padding: 12px 14px;\n    background: var(--navy); color: white;\n    border-radius: 10px;\n    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;\n    box-shadow: var(--shadow-md);\n  }\n  .bulk-action-bar .bulk-count {\n    font-weight: 700; font-size: 14px;\n    padding: 4px 10px; background: rgba(255,255,255,0.18);\n    border-radius: 999px;\n  }\n  .bulk-action-bar .bulk-actions { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; justify-content: flex-end; }\n  .bulk-action-bar .btn {\n    padding: 7px 14px; font-size: 12px; min-height: 36px;\n    background: rgba(255,255,255,0.15); color: white;\n    border: 1px solid rgba(255,255,255,0.35);\n  }\n  .bulk-action-bar .btn:hover { background: rgba(255,255,255,0.28); }\n  .bulk-action-bar .btn-danger {\n    background: var(--coral); color: white; border-color: var(--coral);\n  }\n  .bulk-action-bar .btn-danger:hover { background: #c14a4a; }\n  .qrow-checkbox {\n    display: none;\n    width: 22px; height: 22px;\n    flex-shrink: 0; cursor: pointer;\n  }\n  #dashContent.bulk-mode .qrow-checkbox { display: block; }\n  #dashContent.bulk-mode .qrow.selected {\n    border-color: var(--navy);\n    background: linear-gradient(0deg, rgba(26,37,64,0.04), rgba(26,37,64,0.04)), var(--paper);\n  }\n\n  /* Cloud row card \u2014 denser & cleaner than the old draft-card */\n  .qrow {\n    display: flex; align-items: center; gap: 12px;\n    padding: 14px 14px; background: var(--paper);\n    border: 1px solid var(--line); border-radius: 10px;\n    margin-bottom: 8px; transition: border-color 0.12s, transform 0.12s;\n    -webkit-tap-highlight-color: transparent;\n  }\n  .qrow:hover { border-color: var(--green-light); }\n  .qrow-main { flex: 1; min-width: 0; }\n  .qrow-cust { font-size: 15px; font-weight: 700; color: var(--navy); margin-bottom: 3px; word-break: break-word; }\n  .qrow-meta {\n    display: flex; gap: 6px; flex-wrap: wrap; align-items: center;\n    font-size: 12px; color: var(--slate);\n  }\n  .qrow-meta .sep { opacity: 0.5; }\n  .qrow-total {\n    color: var(--green); font-weight: 700; font-size: 13px;\n    margin-top: 4px;\n  }\n  .qrow-actions { display: flex; gap: 6px; flex-shrink: 0; }\n  .qrow-actions .btn { padding: 8px 14px; font-size: 13px; min-height: 36px; }\n  /* Project chips on row cards \u2014 compact summary of what's in the quote */\n  .qrow-chips, .qrow-chips-row {\n    display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;\n    align-items: center;\n  }\n  .proj-chip {\n    display: inline-block;\n    font-size: 11px; font-weight: 600;\n    color: var(--green); background: #eaf3ec;\n    padding: 2px 8px; border-radius: 999px;\n    white-space: nowrap;\n  }\n  /* Rep-quoting-by chip on each dashboard row. Small avatar circle\n     + name, mirrors the header rep chip style so the eye recognizes\n     it instantly. */\n  .qrow-rep-chip {\n    display: inline-flex; align-items: center; gap: 5px;\n    padding: 2px 8px 2px 2px;\n    background: var(--line-soft);\n    border-radius: 999px;\n    font-size: 11px; font-weight: 600;\n    color: var(--navy);\n    white-space: nowrap;\n    max-width: 220px;\n  }\n  .qrow-rep-avatar {\n    width: 20px; height: 20px;\n    background: var(--navy); color: white;\n    border-radius: 50%;\n    display: inline-flex; align-items: center; justify-content: center;\n    font-size: 9px; font-weight: 800;\n    flex-shrink: 0;\n  }\n  .qrow-rep-name {\n    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\n  }\n  .qrow-addr {\n    /* Truncate long addresses on a single line in the meta row */\n    max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\n    display: inline-block; vertical-align: bottom;\n  }\n  .qrow-actions .ico-btn {\n    width: 38px; height: 38px; border-radius: 8px;\n    background: var(--line-soft); color: var(--slate);\n    display: flex; align-items: center; justify-content: center;\n    font-size: 18px; cursor: pointer; border: none;\n    transition: background 0.12s;\n    -webkit-tap-highlight-color: transparent;\n  }\n  .qrow-actions .ico-btn:hover { background: var(--line); color: var(--navy); }\n\n  /* Inline action menu \u2014 replaces native dropdown for mobile-friendliness */\n  .row-menu {\n    position: absolute; z-index: 100;\n    background: var(--paper); border: 1.5px solid var(--line);\n    border-radius: 10px; box-shadow: var(--shadow-lg);\n    padding: 6px; min-width: 180px;\n  }\n  .row-menu button {\n    display: block; width: 100%; text-align: left;\n    background: transparent; border: none; cursor: pointer;\n    padding: 10px 12px; border-radius: 6px; font-size: 14px;\n    color: var(--navy); transition: background 0.1s;\n    -webkit-tap-highlight-color: transparent;\n    min-height: 40px;\n  }\n  .row-menu button:hover { background: var(--line-soft); }\n  .row-menu button.danger { color: var(--coral); }\n  .row-menu button.danger:hover { background: var(--coral-pale); }\n  .row-menu hr { border: none; border-top: 1px solid var(--line); margin: 4px 0; }\n\n  /* Status pill in header \u2014 shows save state for the current draft */\n  .save-pill {\n    display: inline-flex; align-items: center; gap: 6px;\n    padding: 4px 10px; border-radius: 999px;\n    font-size: 11px; font-weight: 700;\n    background: var(--line-soft); color: var(--slate);\n    transition: background 0.15s, color 0.15s;\n    white-space: nowrap;\n  }\n  .save-pill.saving { background: #fff5e6; color: #a66400; }\n  .save-pill.saved  { background: #e6f5ec; color: #2d6e4e; }\n  .save-pill.failed { background: var(--coral-pale); color: var(--coral); cursor: pointer; }\n  .save-pill.hidden { display: none; }\n  .save-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }\n  .save-pill.saving .dot { animation: pulse 1s ease-in-out infinite; }\n  @keyframes pulse { 50% { opacity: 0.3; } }\n\n  /* Jobber integration pill \u2014 clickable, in the header */\n  .jobber-pill {\n    display: inline-flex; align-items: center; gap: 6px;\n    padding: 4px 10px; border-radius: 999px;\n    font-size: 11px; font-weight: 700;\n    background: var(--line-soft); color: var(--slate);\n    border: none; cursor: pointer;\n    transition: background 0.15s, color 0.15s;\n    -webkit-tap-highlight-color: transparent;\n    white-space: nowrap;\n  }\n  .jobber-pill:hover { background: var(--line); }\n  .jobber-pill.connected { background: #e6f5ec; color: #2d6e4e; }\n  .jobber-pill.warn      { background: #fff5e6; color: #a66400; }\n  .jobber-pill.error     { background: var(--coral-pale); color: var(--coral); }\n  .jobber-pill .jp-dot {\n    width: 6px; height: 6px; border-radius: 50%;\n    background: currentColor;\n  }\n\n  .jobber-action {\n    display: flex; align-items: center; gap: 10px;\n    padding: 12px 14px;\n    background: var(--paper); border: 1.5px solid var(--line);\n    border-radius: 10px; cursor: pointer;\n    font-size: 14px; font-weight: 600; color: var(--navy);\n    transition: border-color 0.12s, background 0.12s;\n    width: 100%; text-align: left;\n    -webkit-tap-highlight-color: transparent;\n    min-height: 44px;\n  }\n  .jobber-action:hover { border-color: var(--green); }\n  .jobber-action.primary { background: var(--green); color: white; border-color: var(--green); }\n  .jobber-action.primary:hover { background: var(--green-light); border-color: var(--green-light); }\n  .jobber-action.danger { color: var(--coral); }\n  .jobber-action.danger:hover { border-color: var(--coral); background: var(--coral-pale); }\n  .jobber-action .ico { font-size: 18px; }\n\n  @media (max-width: 640px) {\n    .jobber-pill { font-size: 10px; padding: 3px 8px; }\n  }\n\n  /* ============================================================\n     MOBILE \u2014 dashboard refinements (\u2264640px).\n     Scoped to dashboard surfaces only (stat cards, quote rows,\n     folders, bulk bar, settings dialog). Tablet + desktop layouts\n     above 640px are untouched.\n     ============================================================ */\n  @media (max-width: 640px) {\n    /* Dashboard title row \u2014 keep welcome copy + utility cluster on\n       one screenful. Heading shrinks more aggressively here than\n       the global .stage h1 because the dashboard is a list-first\n       surface where customers' names ARE the focal point. */\n    .dash-title-row {\n      gap: 8px;\n      margin-bottom: 8px;\n    }\n    .dash-title-row > div:first-child { min-width: 0; }\n    #stage-dashboard h1 {\n      font-size: 18px; margin-bottom: 4px;\n    }\n    #stage-dashboard .lead {\n      font-size: 12px; margin-bottom: 12px;\n      /* On phones, the lead paragraph is just chrome \u2014 clip to one\n         line so the actual list lands above the fold. The full\n         text is still in the DOM for accessibility. */\n      max-height: 2.6em; overflow: hidden;\n    }\n    .dash-utility { padding-top: 0; gap: 4px; }\n\n    /* Stat cards \u2014 2-up grid using flex baselines already set;\n       reduce numeric weight so they don't dominate when the rep\n       just wants to scan their list. */\n    .dash-stats { gap: 8px; margin: 8px 0 14px; }\n    .stat-card { padding: 10px 12px; flex-basis: calc(50% - 4px); min-width: 0; }\n    .stat-card .stat-num { font-size: 18px; }\n    .stat-card .stat-sub {\n      font-size: 11px;\n      /* Long $-totals like \"$12,345 in projects\" can wrap awkwardly;\n         keep them on one ellipsised line. */\n      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\n    }\n    .stat-card .stat-lbl { font-size: 10px; margin-top: 6px; }\n\n    /* Toolbar \u2014 full-width Start-New + Search stacked. */\n    .dash-toolbar { flex-direction: column; align-items: stretch; gap: 10px; margin-bottom: 14px; padding-bottom: 14px; }\n    .dash-toolbar .btn { width: 100%; min-height: 46px; }\n    .dash-search { width: 100%; }\n    .dash-search input { padding: 10px 12px 10px 36px; font-size: 16px; /* keep 16px to suppress iOS autozoom */ }\n    .dash-search::before { left: 12px; font-size: 12px; }\n\n    /* Quote-row card \u2014 denser, with the meta + chip rows tuned\n       so they NEVER overflow the card width on a 360px phone. */\n    .qrow {\n      flex-direction: column; align-items: stretch;\n      padding: 12px; gap: 10px;\n    }\n    .qrow-cust { font-size: 14px; line-height: 1.3; }\n    .qrow-meta {\n      font-size: 11px; gap: 4px 6px;\n      /* The meta row can pile up: quote-id \u00b7 phone \u00b7 address \u00b7 ago.\n         Allow it to wrap and clamp address truncation to fit. */\n    }\n    .qrow-meta .quote-id-mono {\n      font-size: 11px;\n      /* Truncate especially long IDs so they don't push the row wide */\n      max-width: 38vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\n      display: inline-block; vertical-align: bottom;\n    }\n    .qrow-total { font-size: 12px; margin-top: 2px; }\n    .qrow-addr {\n      /* Was 60vw which on iPhone SE / 360px phones still pushed past\n         the card's inner width once padding + gap was subtracted.\n         50vw keeps it safely inside even with the quote-id leading. */\n      max-width: 50vw;\n    }\n    .qrow-chips-row { gap: 4px; margin-top: 4px; }\n    .proj-chip { font-size: 10px; padding: 2px 7px; }\n    .qrow-rep-chip {\n      max-width: calc(100% - 8px);\n      font-size: 10px; padding: 2px 8px 2px 2px;\n    }\n    .qrow-rep-avatar { width: 18px; height: 18px; font-size: 8.5px; }\n    .qrow-rep-name {\n      /* Cap the rep name so a long \"First Lastname\" doesn't elbow\n         out the project chips. */\n      max-width: 130px;\n    }\n\n    /* Row actions \u2014 Resume button + \u22ef menu side-by-side, both\n       chunky enough to thumb-tap. */\n    .qrow-actions { justify-content: stretch; gap: 8px; }\n    .qrow-actions .btn { flex: 1; min-height: 44px; font-size: 13.5px; padding: 10px 14px; }\n    .qrow-actions .ico-btn { width: 44px; height: 44px; flex-shrink: 0; font-size: 19px; }\n\n    /* Bulk-mode tweaks \u2014 when select-mode is on, the row gets a\n       leading checkbox AND the column layout means the checkbox\n       lands on top of the customer name. Float it to the top-left\n       corner so the layout stays scannable. */\n    #dashContent.bulk-mode .qrow {\n      flex-direction: row; flex-wrap: wrap; align-items: flex-start;\n    }\n    #dashContent.bulk-mode .qrow .qrow-checkbox {\n      width: 24px; height: 24px; margin-top: 4px;\n    }\n    #dashContent.bulk-mode .qrow-main { flex: 1 1 calc(100% - 36px); }\n    #dashContent.bulk-mode .qrow-actions { flex: 1 1 100%; }\n\n    /* Bulk action bar \u2014 when selection is non-empty, the floating\n       toolbar at the top needs the count + actions to stack rather\n       than fight for horizontal room with 3-4 wide buttons. */\n    .bulk-action-bar {\n      padding: 10px 12px;\n      flex-direction: column; align-items: stretch; gap: 8px;\n    }\n    .bulk-action-bar .bulk-count { align-self: flex-start; font-size: 12px; padding: 3px 9px; }\n    .bulk-action-bar .bulk-actions {\n      justify-content: stretch; gap: 6px; flex-wrap: wrap;\n    }\n    .bulk-action-bar .bulk-actions .btn {\n      flex: 1 1 calc(50% - 3px); min-height: 40px; font-size: 12px; padding: 8px 10px;\n    }\n\n    /* Folders */\n    .folder { margin-bottom: 8px; border-radius: 10px; }\n    .folder summary { padding: 12px; min-height: 48px; gap: 8px; }\n    .folder summary .folder-label { font-size: 12px; letter-spacing: 0.06em; }\n    .folder summary .folder-count { font-size: 11px; padding: 2px 8px; }\n    .folder summary .folder-icon { font-size: 16px; }\n    .folder-body { padding: 0 10px 10px; }\n    .folder-empty { font-size: 12px; padding: 12px 4px; }\n\n    /* Recent strip */\n    .recent-strip { margin: 4px 0 14px; }\n    .recent-strip h3 { font-size: 11px; margin: 0 0 8px; }\n\n    /* Inline action menu (\u22ef) \u2014 bigger tap targets, hugs the row */\n    .row-menu { min-width: 200px; max-width: calc(100vw - 24px); }\n    .row-menu button { font-size: 14px; padding: 12px; min-height: 44px; }\n\n    /* Header save / Jobber pills */\n    .save-pill { font-size: 10px; padding: 3px 8px; }\n\n    /* Jobber requests panel (orange \"\ud83d\udce5 Recent Jobber requests\") */\n    .req-panel { margin-bottom: 12px; }\n    .req-card-cust { font-size: 14px; }\n    .req-card-title { font-size: 12px; }\n    .req-card-meta { font-size: 11px; }\n\n    /* Settings dialog \u2014 re-clamp max-height (the desktop rule sets\n       92vh, but on mobile the dialog also has a sticky tabs bar\n       and footer that eat ~110px; 88vh prevents the footer from\n       being scrolled off when content is tall). */\n    .pricing-admin-dialog { max-height: 88vh; }\n    .pricing-admin-dialog .pa-tabs {\n      gap: 2px; padding: 6px 6px 0;\n      /* Tabs row can overflow horizontally on a phone \u2014 let it scroll\n         rather than wrap into a 2nd row that pushes content down. */\n      overflow-x: auto; flex-wrap: nowrap;\n      scrollbar-width: none;\n    }\n    .pricing-admin-dialog .pa-tabs::-webkit-scrollbar { display: none; }\n    .pa-tab { padding: 8px 10px; font-size: 12px; white-space: nowrap; }\n    .pa-body { padding: 12px 14px; }\n    .pa-readonly { padding: 5px 8px; font-size: 12px; }\n    .pa-footer { padding: 10px 14px; }\n    .pa-footer .pa-meta { font-size: 10.5px; min-width: 0; }\n  }\n\n  /* Ultra-narrow phones (iPhone SE 1st gen, small Androids \u2264380px).\n     The 640px block above already does most of the work; these\n     tweaks just rescue the surfaces that still ran out of room\n     at 320\u2013380px. */\n  @media (max-width: 380px) {\n    .dash-stats { gap: 6px; }\n    .stat-card { padding: 8px 10px; flex-basis: calc(50% - 3px); }\n    .stat-card .stat-num { font-size: 16px; }\n    .stat-card .stat-lbl { font-size: 9.5px; letter-spacing: 0.06em; }\n    .dash-util-btn { padding: 7px 8px; min-width: 36px; min-height: 36px; }\n    .dash-util-btn .ico { font-size: 14px; }\n    .qrow { padding: 10px; gap: 8px; }\n    .qrow-cust { font-size: 13.5px; }\n    .qrow-actions .btn { font-size: 13px; min-height: 42px; }\n    .qrow-actions .ico-btn { width: 42px; height: 42px; }\n    .qrow-rep-name { max-width: 100px; }\n    .qrow-addr { max-width: 44vw; }\n    .qrow-meta .quote-id-mono { max-width: 32vw; }\n    .folder summary { padding: 10px; }\n    .pricing-admin-dialog { max-width: calc(100% - 10px); width: calc(100% - 10px); }\n  }\n\n  /* UI POLISH \u2014 iPad portrait breakpoint (768\u20131024px) */\n  @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {\n    .stage-wrap { padding: 24px 18px 80px; }\n    .card-grid.cols-3 { grid-template-columns: 1fr 1fr; }\n    .final-grid { grid-template-columns: 1fr; }\n    .final-side { position: relative; top: 0; }\n    .app-header { padding: 12px 18px; }\n    .progress { padding: 12px 18px; }\n    /* iPad portrait: revert to content-sized + scroll so labels never\n       get squished mid-word. The landscape breakpoint above keeps the\n       fill-the-bar default. */\n    .progress-step { flex: 0 0 auto; min-width: 80px; font-size: 10px; }\n    /* Bigger touch targets on tablet */\n    .btn { padding: 16px 28px; font-size: 16px; min-height: 52px; }\n    .toggle-row { padding: 16px 16px; min-height: 56px; }\n    .radio-row { padding: 14px 16px; }\n    .selectable-card .card-body { padding: 20px 22px 24px; }\n    .progress-step { padding: 10px 12px; min-height: 44px; }\n    .wood-age-btn { padding: 18px 18px; min-height: 64px; }\n  }\n  /* Phone-specific tweaks (below 760px) \u2014 sticky stage-nav is global now so\n     no duplicate position rule needed here. */\n  @media (max-width: 760px) {\n    .stage-wrap { padding-bottom: 24px; }\n    /* Bigger touch targets across the board */\n    .btn { padding: 14px 22px; font-size: 15px; min-height: 50px; }\n    .toggle-row { padding: 14px 14px; min-height: 56px; }\n    .radio-row { padding: 14px 14px; min-height: 64px; }\n    .selectable-card .card-body { padding: 16px 18px; }\n    .wood-age-btn { padding: 16px; min-height: 60px; }\n    /* Side-tracker becomes a bottom sheet on phones \u2014 much better thumb reach.\n       Belt-and-suspenders hide: transform AND visibility, so even if Wix\n       wraps the Custom Element in something that breaks position:fixed,\n       the panel is still completely invisible when closed.\n       inset/width are explicit-viewport-width so it always centers\n       horizontally regardless of the host's containing block. */\n    .side-tracker {\n      inset: auto 0 0 0 !important;\n      top: auto !important;\n      left: 0 !important; right: 0 !important;\n      width: 100vw !important; max-width: 100vw !important;\n      height: 85vh; max-height: 85vh;\n      margin: 0 !important;\n      border-radius: 16px 16px 0 0;\n      transform: translateY(105%);\n      visibility: hidden;\n      pointer-events: none;\n      box-sizing: border-box;\n    }\n    .side-tracker.open { transform: translateY(0); visibility: visible; pointer-events: auto; }\n    /* Prevent any horizontal overflow that could let part of the off-screen\n       panel peek through at the page edge. */\n    :host, :host { overflow-x: hidden; max-width: 100vw; }\n    /* Mobile side-tracker tab \u2014 slim vertical pill, minimal footprint */\n    .side-tracker-tab {\n      writing-mode: vertical-rl !important;\n      text-orientation: mixed;\n      top: 50% !important;\n      bottom: auto !important;\n      right: 0 !important;\n      transform: translateY(-50%) !important;\n      padding: 5px 2.5px;\n      font-size: 8.5px;\n      letter-spacing: 0;\n      border-radius: 5px 0 0 5px;\n      box-shadow: -2px 2px 6px rgba(0,0,0,0.12);\n    }\n    .side-tracker-tab.visible { animation: none; }\n    .side-tracker-tab .count {\n      writing-mode: horizontal-tb;\n      font-size: 8px; padding: 0 3px;\n      margin-top: 2px; margin-left: 0;\n      min-width: 0;\n      border-radius: 4px;\n      line-height: 1.3;\n    }\n\n    /* Draft cards \u2014 stack vertically on phones so the customer name, meta\n       row, and Resume/Delete actions each get their own line instead of\n       being crammed into a single horizontal row. */\n    .draft-card {\n      flex-direction: column;\n      align-items: stretch;\n      gap: 10px;\n      padding: 14px 16px;\n    }\n    .draft-card-main { width: 100%; }\n    .draft-customer { font-size: 15px; margin-bottom: 4px; }\n    .draft-meta { font-size: 11px; gap: 3px 6px; line-height: 1.45; }\n    .draft-running-total { font-size: 13px; margin-top: 4px; }\n    .draft-card-actions {\n      width: 100%;\n      justify-content: stretch;\n      gap: 8px;\n    }\n    .draft-card-actions .btn-primary {\n      flex: 1;\n      padding: 12px 16px;\n      font-size: 14px;\n      min-height: 44px;\n      justify-content: center;\n    }\n    .draft-card-actions .btn-ghost-danger {\n      flex: 0 0 auto;\n      padding: 0 14px;\n      min-height: 44px;\n      min-width: 50px;\n    }\n    /* Progress bar \u2014 content-sized steps that finger-swipe horizontally.\n       overflow-x and touch-action explicitly !important so nothing in the\n       cascade can block the swipe. Children also get touch-action: pan-x\n       so a touch starting on a step button doesn't get hijacked. */\n    .progress {\n      padding: 8px 10px; gap: 6px;\n      touch-action: pan-x !important;\n      overflow-x: auto !important;\n      overflow-y: hidden !important;\n      -webkit-overflow-scrolling: touch !important;\n      overscroll-behavior-x: contain;\n    }\n    .progress-step {\n      flex: 0 0 auto;\n      min-width: 60px;\n      font-size: 9.5px;\n      padding: 6px 9px;\n      min-height: 42px;\n      display: inline-flex; flex-direction: column;\n      align-items: center; justify-content: center;\n      touch-action: pan-x;\n    }\n    .progress-step .step-num { font-size: 7.5px; }\n    .progress::-webkit-scrollbar { display: none; }\n    .progress { scrollbar-width: none; }\n    /* Header \u2014 compact on phone.\n       Three competing pieces \u2014 brand mark, save/Jobber pills, and the\n       Quote Total \u2014 used to fight for horizontal room and visibly\n       overlap on narrow phones. Strategy:\n         1. Shrink the brand mark hard (logo only at very narrow widths;\n            name truncates aggressively before that).\n         2. Let .brand-mark itself shrink (its `min-width: 0` lets the\n            ellipsis actually clip; previously the flex item was sized\n            to fit content and pushed the right cluster off-screen).\n         3. Cap .header-right with a max-width derived from viewport,\n            then let it scroll horizontally if its contents overflow \u2014\n            beats a wrapped second row that doubles header height. */\n    .app-header { padding: 8px 10px; gap: 6px; flex-wrap: nowrap; }\n    .app-header .brand-mark { gap: 8px; min-width: 0; flex-shrink: 1; }\n    .app-header .brand-mark .sub { display: none; }\n    .app-header .brand-mark .name {\n      font-size: 11.5px; line-height: 1.2;\n      /* Shorter cap than before (was 120px). Combined with min-width: 0\n         on the parent, the name now ellipsises gracefully when the\n         pills on the right need the space. */\n      max-width: 96px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\n    }\n    .app-header .brand-mark .logo { width: 26px; height: 26px; }\n    .header-right {\n      gap: 6px; flex-shrink: 0;\n      max-width: calc(100vw - 60px);\n      overflow-x: auto; overflow-y: hidden;\n      scrollbar-width: none;\n      /* prevent inertia scrolling from feeling like a bug on iOS */\n      -webkit-overflow-scrolling: auto;\n    }\n    .header-right::-webkit-scrollbar { display: none; }\n    .total-pill { min-width: 60px; padding: 4px 9px; }\n    .total-pill .amt { font-size: 13px; }\n    .total-pill .lbl { font-size: 8px; }\n    /* Quote-id tag \u2014 hide on tiny screens to keep header tight */\n    .quote-id-tag { display: none; }\n    /* Save pill \u2014 keep visible but tighter; hide the text on very narrow\n       screens, just show the colored dot. */\n    .save-pill { font-size: 10px; padding: 3px 7px; gap: 5px; }\n    .save-pill .save-pill-text {\n      max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\n    }\n    /* Jobber pill \u2014 same treatment. */\n    .jobber-pill {\n      font-size: 10px; padding: 3px 8px; gap: 5px;\n    }\n    .jobber-pill #jobberPillText {\n      max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\n    }\n    /* Stage header text \u2014 pulled down a notch (\"too damn big\" feedback) */\n    .stage-title { font-size: 10px; margin-bottom: 4px; }\n    .stage h1 { font-size: 19px; margin-bottom: 6px; line-height: 1.25; letter-spacing: -0.3px; }\n    .stage .lead { font-size: 12.5px; margin-bottom: 16px; line-height: 1.45; }\n\n    /* Tip boxes \u2014 were eating a big chunk of vertical space on a phone */\n    .tip-box { padding: 10px 12px; font-size: 12px; gap: 8px; margin-bottom: 12px; }\n    .tip-box .tip-ico { font-size: 14px; }\n    .tip-box .tip-body strong { font-size: 10px; margin-bottom: 3px; }\n\n    /* Alerts (reco banner, warnings, etc.) */\n    .alert { padding: 10px 12px; font-size: 12px; gap: 8px; margin-bottom: 12px; }\n    .reco-banner { padding: 10px 12px; margin-bottom: 14px; gap: 8px; }\n    .reco-banner .reco-content { font-size: 12px; }\n\n    /* Tighter side padding on phones to maximize content area */\n    .stage-wrap { padding: 14px 10px 24px; }\n    /* Grid gaps reduce \u2014 was 22px, fine on desktop but huge on a phone */\n    .card-grid { gap: 12px; margin-bottom: 18px; }\n    .product-choice-grid { gap: 12px; margin-bottom: 18px; }\n    .addon-grid { gap: 8px; }\n\n    /* Card images take less vertical space on phones */\n    .card-image { height: 150px; }\n    .selectable-card .card-body { padding: 12px 14px; }\n    .selectable-card .card-body .title { font-size: 15px; margin-bottom: 4px; }\n    .selectable-card .card-body .desc { font-size: 12px; line-height: 1.4; }\n    .selectable-card .card-body .badge { font-size: 9px; padding: 2px 6px; margin-top: 6px; }\n\n    /* Tier cards \u2014 much tighter padding + fonts */\n    .tier-card { padding: 14px; border-radius: 12px; }\n    .tier-card .tier-name { font-size: 10px; margin-bottom: 3px; }\n    .tier-card .tier-product { font-size: 15px; margin-bottom: 5px; line-height: 1.2; }\n    .tier-card .tier-tagline { font-size: 11px; margin-bottom: 8px; min-height: 0; }\n    .tier-card .tier-price { font-size: 22px; margin: 6px 0 1px; }\n    .tier-card .tier-cost-per-year { font-size: 11px; }\n    .tier-card .tier-life { font-size: 11px; padding: 4px 8px; margin: 6px 0 10px; }\n    .tier-card .tier-pros li, .tier-card .tier-cons li { font-size: 12px; padding-top: 3px; padding-bottom: 3px; }\n    .tier-card .whats-included { padding: 10px; margin-top: 10px; }\n    .tier-card .whats-included-label, .tier-card .whats-included ul li { font-size: 11px; }\n    .tier-card .best-for { padding-top: 10px; font-size: 11px; }\n    .tier-card .best-for strong { font-size: 10px; }\n\n    /* Product family cards */\n    .product-choice-card .prod-image { height: 130px; }\n    .product-choice-card .prod-body { padding: 12px 14px; gap: 5px; }\n    .product-choice-card .icon { font-size: 20px; }\n    .product-choice-card .h { font-size: 15px; }\n    .product-choice-card .d { font-size: 12px; line-height: 1.4; }\n    .product-choice-card .prod-pros li { font-size: 11.5px; padding: 3px 0 3px 18px; }\n    .product-choice-card .prod-cons li { font-size: 11px; padding: 2px 0 2px 18px; }\n    .product-choice-card .prod-recommend-note { padding: 8px 10px; font-size: 11px; margin-top: 10px; }\n    .product-choice-card .prod-recommend-note strong { font-size: 9px; }\n\n    /* Condition cards (Step 4) */\n    .condition-card .card-image { height: 100px; }\n    .condition-card .cond-body { padding: 10px 12px; }\n    .condition-card .cond-name { font-size: 13.5px; }\n    .condition-card .cond-prep { font-size: 11px; margin: 4px 0 8px; }\n    .condition-card .cond-bullets-label { font-size: 9px; }\n    .condition-card .cond-bullets li { font-size: 11px; line-height: 1.3; padding: 2px 0 2px 16px; }\n    .condition-card .cond-timing { font-size: 10px; padding: 3px 6px; margin-top: 6px; }\n    .condition-card .cond-add { font-size: 13px; padding-top: 8px; }\n\n    /* Form inputs \u2014 were big on desktop, way too big on phone */\n    .field label { font-size: 10.5px; margin-bottom: 4px; }\n    /* iOS Safari auto-zooms in when focusing an input with font-size < 16px\n       and doesn't reliably zoom back out \u2014 feels like the page is \"stuck\"\n       zoomed. Forcing every editable field to \u226516px on mobile is the\n       standard fix and prevents the surprise zoom entirely. */\n    .field input, .field select, .field textarea,\n    input[type=\"text\"], input[type=\"tel\"], input[type=\"email\"],\n    input[type=\"number\"], input[type=\"password\"], input[type=\"search\"],\n    input:not([type]), textarea, select {\n      padding: 10px 12px; font-size: 16px !important; border-radius: 8px;\n    }\n    .field .hint, .field .err { font-size: 11px; }\n    .form-grid { gap: 12px; margin-bottom: 16px; }\n    /* Other editable fields outside .field need the bump too */\n    .side-tracker-notes textarea { font-size: 16px !important; }\n    .custom-add-form input, .custom-add-form select { font-size: 16px !important; padding: 8px 10px; }\n    /* Custom color code input on Step 7 */\n    .custom-color-entry input { font-size: 16px !important; }\n\n    /* Measurement section */\n    .measure-section { padding: 14px 14px; margin-bottom: 12px; border-radius: 10px; }\n    .measure-section h3 { font-size: 14px; }\n    .measure-section .section-hint { font-size: 11.5px; margin-bottom: 12px; }\n\n    /* Wood age and toggle rows */\n    .wood-age-btn { padding: 12px 14px; }\n    .wood-age-btn .wa-ico { font-size: 22px; }\n    .wood-age-btn .wa-label { font-size: 12.5px; }\n    .wood-age-btn .wa-label small { font-size: 10px; }\n    .toggle-row { padding: 10px 12px; min-height: 0; margin-bottom: 6px; }\n    .toggle-row .name { font-size: 13px; }\n    .toggle-row .box { width: 18px; height: 18px; font-size: 11px; }\n    .toggle-row .price { font-size: 12.5px; }\n\n    /* Buttons \u2014 slightly smaller, still tap-friendly (\u226544px) */\n    .btn { padding: 11px 18px; font-size: 14px; min-height: 44px; border-radius: 8px; }\n\n    /* Color swatches */\n    .color-group-label { font-size: 12px; margin-bottom: 8px; }\n    .color-group-label small { font-size: 11px; }\n    .color-swatch { padding: 5px; border-radius: 8px; }\n    .color-swatch .name { font-size: 10.5px; }\n    .color-swatch .code { font-size: 9px; }\n    /* Color grid override already set earlier */\n    /* Color swatch grid \u2014 3 per row instead of fewer big ones */\n    .color-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 10px; }\n    .color-swatch { padding: 6px; }\n    .color-swatch .name { font-size: 11px; }\n    /* Final breakdown stacks; side panel goes below */\n    .final-side { margin-top: 16px; }\n    /* Discount rows \u2014 value chip on its own line UNDER the description so\n       long values like \"No processing fee\" never overflow. */\n    .radio-row {\n      flex-wrap: wrap;\n      padding: 12px;\n      gap: 8px 10px;\n      align-items: flex-start;\n    }\n    .radio-row .disc-img { width: 52px; height: 52px; flex-shrink: 0; }\n    .radio-row .dot-outer { margin-top: 4px; flex-shrink: 0; }\n    .radio-row .label {\n      flex: 1 1 0; min-width: 0;\n    }\n    .radio-row .label .head { font-size: 13px; }\n    .radio-row .label .sub { font-size: 11px; line-height: 1.4; }\n    .radio-row .value {\n      flex: 1 1 100%;\n      white-space: normal !important;\n      text-align: right;\n      font-size: 14px;\n      max-width: 100%;\n      line-height: 1.2;\n      margin-top: 2px;\n    }\n\n    /* Addon rows (Step 8) \u2014 restructure so the image sits ABOVE the\n       description and price on mobile. The checkbox floats over the\n       top-left corner of the image as an overlay. */\n    .addon-section .toggle-row {\n      flex-direction: column;\n      flex-wrap: nowrap;\n      align-items: stretch;\n      padding: 10px;\n      gap: 8px;\n      min-height: 0;\n      position: relative;\n    }\n    .addon-section .toggle-row .box {\n      position: absolute;\n      top: 18px; left: 18px;\n      z-index: 2;\n      /* No background override here \u2014 lets the base white/green cascade\n         through so the checkbox actually fills green when checked. The\n         shadow keeps it visible against any image color underneath. */\n      box-shadow: 0 2px 6px rgba(0,0,0,0.35);\n      flex-shrink: 0;\n    }\n    .toggle-row .addon-img {\n      width: 100% !important; height: 140px !important;\n      border-radius: 8px;\n      flex-shrink: 0;\n      order: -2;\n    }\n    .toggle-row .addon-desc { min-width: 0; order: -1; }\n    .toggle-row .addon-desc .ad-name { font-size: 14px; line-height: 1.3; }\n    .toggle-row .addon-desc .ad-sub { font-size: 12px; }\n    .toggle-row .price {\n      white-space: normal !important;\n      font-size: 14px;\n      text-align: right;\n      flex-shrink: 0;\n      order: 1;\n    }\n    .toggle-row .qty-input { width: 60px; align-self: flex-end; }\n\n    /* Addon rows WITHOUT an image (custom service rows etc.) stay in their\n       compact horizontal layout. */\n    .addon-section .toggle-row:not(:has(.addon-img)) {\n      flex-direction: row;\n      align-items: flex-start;\n    }\n    .addon-section .toggle-row:not(:has(.addon-img)) .box { position: static; box-shadow: none; }\n\n    /* Service-includes rows (the \"Included free\" green cards on Step 8) */\n    /* Mobile collapse chevron on service-include rows. The whole row is\n       the toggle. Description hides by default, taps reveal it. */\n    .service-include-row { cursor: pointer; -webkit-tap-highlight-color: transparent; }\n    .service-include-row .sir-chev {\n      display: inline-block;\n      color: var(--green);\n      font-size: 12px;\n      margin-left: 4px;\n      transition: transform 0.2s;\n    }\n    .service-include-row.expanded .sir-chev { transform: rotate(180deg); }\n    .service-include-row {\n      padding: 10px 12px; gap: 10px;\n      align-items: flex-start;\n    }\n    .service-include-row .check { width: 24px; height: 24px; font-size: 12px; margin-top: 2px; }\n    .service-include-row .addon-desc .ad-name { font-size: 13.5px; }\n    .service-include-row .addon-desc .ad-sub { font-size: 11px; }\n    .service-include-row .price { font-size: 10px; }\n\n    /* Custom items list + add form \u2014 repack so they stack cleanly */\n    .custom-item-row {\n      flex-wrap: wrap;\n      padding: 10px 12px;\n      gap: 6px 10px;\n    }\n    .custom-item-row .name { flex: 1 1 100%; font-size: 13px; }\n    .custom-item-row .price { font-size: 13px; }\n    .custom-add-btn { font-size: 11px; padding: 5px 10px; }\n\n    /* REVIEW screen \u2014 tighten edges and pad the main breakdown so the\n       customer-facing summary uses every available pixel on a phone. */\n    .stage-wrap { padding: 16px 10px 24px; }\n    .final-main { padding: 16px 14px; border-radius: 12px; }\n    .final-side { padding: 16px 14px; border-radius: 12px; }\n    .breakdown-section { margin-bottom: 14px; padding-bottom: 8px; }\n    .breakdown-line { padding: 8px 0; gap: 8px; }\n    .breakdown-line .desc { font-size: 13px; }\n    .breakdown-line .val { font-size: 13px; }\n    .saved-projects { padding: 12px 14px; }\n    .saved-project-row {\n      flex-wrap: wrap;\n      gap: 6px 10px;\n    }\n    .saved-project-row .meta { flex: 1 1 100%; padding-left: 0; }\n    .saved-project-row .amt { font-size: 14px; margin-right: 0; }\n    .saved-project-row .row-actions { width: 100%; gap: 6px; }\n    .saved-project-row .row-actions button { flex: 1; }\n    .grand-total { padding: 12px 14px; flex-wrap: wrap; gap: 6px; }\n    .grand-total .label { font-size: 11px; max-width: 100%; }\n    .grand-total .amount { font-size: 22px; }\n    .grand-total .grand-total-amount-block { align-items: flex-start; text-align: left; }\n    .grand-total .grand-total-savings { font-size: 10.5px; }\n    /* Project Total mid-breakdown box \u2014 was visually competing with the\n       Grand Total on phone. Shrink it. */\n    .project-total { padding: 10px 14px; margin-top: 10px; }\n    .project-total .label { font-size: 10.5px; }\n    .project-total .amount { font-size: 18px; }\n    /* Header amount pill */\n    .total-pill .lbl { font-size: 7.5px; }\n    /* Stage h1 even tighter \u2014 friend feedback was big on this */\n    .stage h1 { font-size: 17px; }\n    .stage .lead { font-size: 12px; margin-bottom: 14px; }\n    .stage-title { font-size: 9.5px; }\n    /* Breakdown header row inside review (project name + collapse button) */\n    .breakdown-header-row { margin-bottom: 10px; gap: 8px; }\n    .breakdown-header-row h3 { font-size: 15px; }\n    /* Math walk + DIY totals */\n    .math-walk h4 { font-size: 10px; margin-bottom: 6px; }\n    .math-walk-row.math-walk-subtotal,\n    .math-walk-row.math-walk-total-savings { font-size: 12.5px; }\n    .diy-comparison h4 { font-size: 12px; }\n    .diy-comparison .diy-blurb { font-size: 11.5px; margin-bottom: 10px; }\n    .diy-comparison .diy-row.diy-total { font-size: 13px; padding-top: 8px; }\n    .diy-comparison .diy-conclusion { padding: 10px 12px; font-size: 12px; }\n    /* Bundle savings pill (the celebrate banner) */\n    .bundle-savings-pill { font-size: 13px; padding: 8px 14px; }\n    .bundle-savings-pill strong { font-size: 15px !important; }\n    /* Math walk-through and DIY comparison are tighter too */\n    .math-walk, .diy-comparison { padding: 12px 14px; }\n    .math-walk-row, .diy-row { font-size: 12px; padding: 5px 0; }\n    .diy-project-item { flex-wrap: wrap; }\n    .diy-project-item span:first-child { flex: 1 1 100%; }\n    .quote-expiry-banner { padding: 10px 12px; font-size: 12px; gap: 8px; }\n    .risk-reversal-box { padding: 14px 16px; }\n    .risk-reversal-box li { font-size: 12px; }\n    .review-notes-box { padding: 12px 14px; }\n    .review-notes-box p { font-size: 13px; }\n\n    /* Modal \u2014 near-full-screen on phone with smaller text */\n    .info-dialog {\n      max-width: calc(100% - 16px);\n      width: calc(100% - 16px);\n      max-height: 96vh;\n      border-radius: 12px;\n    }\n    .info-modal-header { padding: 12px 14px; }\n    .info-modal-header h3 { font-size: 15px; }\n    .info-modal-header .close-x { width: 24px; height: 24px; font-size: 14px; }\n    .info-modal-body { padding: 14px 16px; font-size: 12.5px; line-height: 1.5; }\n    .info-modal-body p { margin-bottom: 8px; }\n    .info-modal-body li { margin-bottom: 4px; font-size: 12.5px; line-height: 1.4; }\n    .info-modal-body strong { font-size: 12.5px; }\n\n    /* \"You're saving $X \u2014 discounts ($X)\" pill was rendering as a vertical\n       column of one-word lines on phone because inline-flex was wrapping\n       inside a fixed-width pill shape. Convert to a full-width rounded\n       block on mobile with normal text flow. */\n    .bundle-savings-pill {\n      display: block;\n      width: 100%;\n      box-sizing: border-box;\n      border-radius: 12px;\n      padding: 10px 14px;\n      font-size: 12.5px;\n      text-align: left;\n      line-height: 1.4;\n    }\n    .bundle-savings-pill strong { font-size: 14px !important; }\n\n    /* Review screen \u2014 fence-performance-(oil) breakdown header was too big */\n    .breakdown-header-row { gap: 6px; }\n    .breakdown-header-row h3 { font-size: 13px !important; line-height: 1.25; }\n    .btn-collapse-project { font-size: 11px; padding: 5px 10px; }\n\n    /* All buttons \u2014 one more notch tighter than before. Still 40px min\n       height for tap-friendliness. */\n    .btn { padding: 9px 16px; font-size: 13px; min-height: 40px; }\n    .btn-secondary { padding: 9px 14px; }\n    .btn-save-exit { padding: 5px 10px; font-size: 11px; }\n\n    /* Custom items section h4 (the one with \"Employee Only\" badge + the\n       \"+ Add Custom Item\" button on the right) was overflowing on phone */\n    .addon-section h4 {\n      font-size: 12px;\n      flex-wrap: wrap; gap: 6px;\n    }\n    .addon-section h4 > span {\n      flex-wrap: wrap !important;\n      gap: 4px !important;\n    }\n    .employee-badge { font-size: 10px; padding: 4px 8px; }\n    .custom-add-btn { font-size: 10px; padding: 4px 8px; }\n    .custom-add-form { padding: 10px; }\n    .custom-add-form input, .custom-add-form select { padding: 6px 8px; font-size: 12px; }\n    .custom-add-form .btn-save, .custom-add-form .btn-cancel { padding: 6px 10px; font-size: 11px; }\n    .custom-item-row { padding: 8px 12px; }\n    .custom-item-row .name { font-size: 12.5px; }\n    .custom-item-row .price { font-size: 12.5px; }\n  }\n  /* Extra-narrow phones (\u2264 400px) \u2014 squeeze further */\n  @media (max-width: 400px) {\n    .stage-wrap { padding: 14px 10px 24px; }\n    .stage h1 { font-size: 20px; }\n    .progress-step { min-width: 64px; font-size: 9px; padding: 6px; }\n    .app-header { padding: 6px 8px; gap: 5px; }\n    /* On tiny phones the company name is the first to go \u2014 the brand\n       logo identifies us already, and the screen real estate is better\n       spent on pills + Save status. The .name still exists in the DOM\n       (and stays visible to screen readers via aria-label on .brand-mark\n       elsewhere) so SR users aren't impacted. */\n    .app-header .brand-mark .name { display: none; }\n    .app-header .brand-mark .logo { width: 24px; height: 24px; }\n    .header-right { max-width: calc(100vw - 44px); gap: 5px; }\n    .total-pill { min-width: 60px; padding: 4px 8px; }\n    .total-pill .amt { font-size: 13px; }\n    .total-pill .lbl { font-size: 7.5px; }\n    /* Save / Jobber pill text \u2192 dot-only on the narrowest phones */\n    .save-pill .save-pill-text,\n    .jobber-pill #jobberPillText { display: none; }\n    .save-pill, .jobber-pill { padding: 5px 6px; gap: 0; min-width: 22px; justify-content: center; }\n    .card-image { height: 150px; }\n    .product-choice-card .prod-image { height: 130px; }\n    .color-grid { grid-template-columns: repeat(2, 1fr) !important; }\n  }\n\n  /* ============ SIDE TRACKER PANEL ============ */\n  /* The header-mounted \"Your Quote\" button was an iframe-era fallback; in\n     the Custom Element build the floating tab on the right edge works fine,\n     so the header button is hidden. */\n  .header-tracker-btn { display: none !important; }\n\n  /* Floating \"Your Quote\" tab \u2014 fixed to the right edge of the viewport,\n     vertically centered. Hidden by default; .visible is toggled on by the\n     renderSidePanel() function once the user has made any meaningful\n     selection. */\n  .side-tracker-tab {\n    position: fixed; right: 0; top: 50%; transform: translateY(-50%);\n    background: var(--green); color: white;\n    padding: 14px 10px; border-radius: 10px 0 0 10px;\n    box-shadow: var(--shadow-md); cursor: pointer;\n    z-index: 999999; display: none;\n    writing-mode: vertical-rl; text-orientation: mixed;\n    font-weight: 700; font-size: 13px; letter-spacing: 0.05em;\n    transition: background 0.15s, padding 0.15s;\n  }\n  .side-tracker-tab:hover { background: var(--green-light); padding-right: 14px; }\n  .side-tracker-tab.visible { display: block; animation: slideTab 0.3s; }\n  /* Hide the floating tab while the side panel itself is open \u2014 otherwise\n     the tab sits on top of the panel at the same right:0 edge. */\n  .side-tracker-tab.hidden-while-open { display: none !important; }\n  @keyframes slideTab {\n    from { transform: translateY(-50%) translateX(100%); }\n    to   { transform: translateY(-50%) translateX(0); }\n  }\n  /* Count chip hidden globally \u2014 the user prefers the tab to read just\n     \"Your Quote\" without the running selection count attached. */\n  .side-tracker-tab .count { display: none !important; }\n\n  .side-tracker {\n    position: fixed; right: 0; top: 0; bottom: 0;\n    width: 360px; max-width: 90vw;\n    background: var(--paper); box-shadow: -8px 0 24px rgba(0,0,0,0.12);\n    z-index: 95; transform: translateX(100%);\n    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n    display: flex; flex-direction: column;\n  }\n  .side-tracker.open { transform: translateX(0); }\n  .side-tracker-header {\n    padding: 16px 20px; border-bottom: 1px solid var(--line);\n    display: flex; align-items: center; justify-content: space-between;\n    background: var(--navy); color: white;\n  }\n  .side-tracker-header h3 { font-size: 14px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin: 0; }\n  .side-tracker-header .close-btn {\n    background: rgba(255,255,255,0.15); color: white;\n    width: 30px; height: 30px; border-radius: 8px;\n    font-size: 18px; font-weight: 700;\n    display: flex; align-items: center; justify-content: center;\n    transition: background 0.15s;\n  }\n  .side-tracker-header .close-btn:hover { background: rgba(255,255,255,0.25); }\n  .side-tracker-body {\n    flex: 1 1 auto; min-height: 0; overflow-y: auto;\n    padding: 12px 16px;\n    touch-action: pan-y;\n    -webkit-overflow-scrolling: touch;\n    overscroll-behavior: contain;\n  }\n  .side-tracker-body .empty-state {\n    text-align: center; padding: 24px 10px; color: var(--slate);\n    font-size: 12px;\n  }\n  .tracker-section { margin-bottom: 14px; }\n  .tracker-section h4 {\n    font-size: 10px; color: var(--slate);\n    text-transform: uppercase; letter-spacing: 0.08em;\n    font-weight: 700; margin-bottom: 6px;\n    padding-bottom: 5px; border-bottom: 1px solid var(--line);\n  }\n  .tracker-row {\n    display: flex; align-items: center; gap: 8px;\n    padding: 6px 0; border-bottom: 1px dashed var(--line);\n    font-size: 12px;\n  }\n  .tracker-row:last-child { border-bottom: none; }\n  .tracker-row .tr-label { color: var(--slate); font-size: 9.5px; font-weight: 600; width: 56px; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.04em; }\n  /* Truncate long values (especially emails) with ellipsis so the edit\n     button always stays visible on the right. min-width:0 is required for\n     a flex child to actually shrink below its content width. */\n  .tracker-row .tr-value {\n    flex: 1 1 auto; min-width: 0;\n    color: var(--navy); font-weight: 600;\n    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\n  }\n  .tracker-row .tr-actions { display: flex; gap: 4px; flex-shrink: 0; }\n  .tracker-row .tr-actions button {\n    width: 24px; height: 24px; border-radius: 5px;\n    font-size: 11px; display: flex; align-items: center; justify-content: center;\n    transition: background 0.12s;\n  }\n  .tracker-row .tr-actions .edit { background: var(--line-soft); color: var(--navy); }\n  .tracker-row .tr-actions .edit:hover { background: var(--green-pale); color: var(--green); }\n  .tracker-row .tr-actions .clear { background: var(--line-soft); color: var(--coral); }\n  .tracker-row .tr-actions .clear:hover { background: var(--coral-pale); }\n  .side-tracker-footer {\n    padding: 10px 14px 12px;\n    border-top: 2px solid var(--green-pale);\n    background: var(--green-pale);\n    display: flex; align-items: center; gap: 10px;\n  }\n  .side-tracker-footer .tot-block {\n    margin-left: auto;\n    display: flex; flex-direction: column;\n    align-items: flex-end; line-height: 1.1;\n  }\n  .side-tracker-footer .tot-label {\n    font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.06em;\n    color: var(--slate); font-weight: 700;\n  }\n  .side-tracker-footer .tot-amt {\n    font-size: 18px; font-weight: 800; color: var(--green); letter-spacing: -0.3px;\n    margin-top: 2px;\n  }\n  .side-tracker-overlay {\n    position: fixed; inset: 0;\n    background: rgba(0,0,0,0.3);\n    z-index: 94; opacity: 0; pointer-events: none;\n    transition: opacity 0.25s;\n  }\n  .side-tracker-overlay.visible { opacity: 1; pointer-events: auto; }\n\n  /* ============ INFO BUTTON + MODAL ============ */\n  .info-btn {\n    display: inline-flex; align-items: center; justify-content: center;\n    width: 18px; height: 18px; border-radius: 50%;\n    background: var(--slate); color: white;\n    font-size: 11px; font-weight: 800; font-family: serif;\n    cursor: pointer; vertical-align: middle;\n    margin-left: 6px; user-select: none;\n    transition: all 0.15s;\n  }\n  .info-btn:hover, .info-btn:focus { background: var(--navy); transform: scale(1.1); outline: none; }\n  /* Native <dialog> \u2014 renders in the browser's top layer via showModal(),\n     escaping any containing-block / transform restrictions imposed by Wix's\n     Custom Element wrapper. The ::backdrop pseudo-element handles the\n     overlay automatically. Explicit fixed centering as a safety net for\n     Shadow-DOM + transformed-ancestor edge cases where the default\n     dialog auto-centering misbehaves. */\n  .info-dialog {\n    background: var(--paper); border-radius: 16px;\n    border: none; padding: 0;\n    max-width: 540px; width: calc(100% - 32px);\n    max-height: 85vh; overflow-y: auto;\n    box-shadow: var(--shadow-lg);\n    color: var(--navy);\n    position: fixed;\n    top: 50%; left: 50%;\n    transform: translate(-50%, -50%);\n    margin: 0;\n  }\n  /* Measurement tutorial \u2014 diagrams + cheat sheet + bullets.\n     Used by openMeasureTutorial() on Step 3 (Measurements). The modal\n     itself is `.info-dialog .measure-dialog`; styles below scope to\n     `.measure-dialog` so they don't leak into other info modals. */\n  .measure-dialog { max-width: 580px; }\n  .measure-dialog .mt-tips {\n    display: grid; gap: 8px;\n    background: #fff8eb;\n    border: 1px solid #f1d68e;\n    border-radius: 10px;\n    padding: 12px 14px;\n    margin-bottom: 16px;\n  }\n  .measure-dialog .mt-tip {\n    display: flex; align-items: flex-start; gap: 10px;\n    font-size: 13px; color: #5a3f00; line-height: 1.5;\n  }\n  .measure-dialog .mt-tip-ico {\n    font-size: 17px; flex-shrink: 0; line-height: 1.2;\n  }\n  .measure-dialog .mt-tip a { color: #2c6da7; font-weight: 700; }\n  .measure-dialog .mt-svg {\n    display: block;\n    width: 100%; max-width: 460px;\n    height: auto;\n    margin: 6px auto 18px;\n    background: linear-gradient(180deg, #f4f7fb 0%, #ffffff 70%);\n    border: 1px solid var(--line);\n    border-radius: 10px;\n    padding: 6px 4px;\n  }\n  .measure-dialog .mt-footer {\n    margin-top: 18px;\n    padding: 14px 16px;\n    background: var(--green-pale);\n    border-radius: 10px;\n    font-size: 13px;\n    line-height: 1.55;\n    color: var(--navy);\n  }\n  .measure-dialog .mt-footer strong { color: var(--green); }\n  @media (max-width: 640px) {\n    .measure-dialog .mt-tips { padding: 10px 12px; gap: 6px; }\n    .measure-dialog .mt-tip { font-size: 12.5px; }\n    .measure-dialog .mt-svg { padding: 4px; }\n    .measure-dialog .mt-footer { font-size: 12.5px; padding: 12px; }\n  }\n\n  /* Pricing admin reuses .info-dialog but wants more horizontal room +\n     a vertical layout with sticky tabs and footer. Larger than the\n     stock info modal because Settings has a lot to expose now (tier\n     rates, prep, extras, addons, discounts, DIY knobs, reps, devices). */\n  .pricing-admin-dialog { max-width: 1040px; width: calc(100% - 32px); max-height: 92vh; }\n  .pricing-admin-dialog .pa-tabs {\n    display: flex; gap: 4px;\n    padding: 8px 14px 0;\n    border-bottom: 1px solid var(--line);\n    position: sticky; top: 0;\n    background: var(--paper); z-index: 2;\n  }\n  .pa-tab {\n    background: transparent; border: none;\n    padding: 10px 16px; cursor: pointer;\n    font-size: 13px; font-weight: 600; color: var(--slate);\n    border-bottom: 3px solid transparent;\n    border-radius: 6px 6px 0 0;\n    transition: background 0.12s, color 0.12s, border-color 0.12s;\n  }\n  .pa-tab:hover { background: var(--line-soft); color: var(--navy); }\n  .pa-tab.active { color: var(--navy); border-bottom-color: var(--green); background: var(--line-soft); }\n  .pa-body { padding: 16px 20px; }\n  .pa-section { margin-bottom: 22px; }\n  .pa-section-title {\n    font-size: 13px; font-weight: 700; color: var(--navy);\n    text-transform: uppercase; letter-spacing: 0.06em;\n    margin: 0 0 10px;\n  }\n  .pa-grid {\n    display: grid;\n    grid-template-columns: minmax(120px, 1fr) repeat(3, 110px);\n    gap: 6px 10px; align-items: center;\n  }\n  .pa-grid-head {\n    font-size: 11px; font-weight: 700; color: var(--slate);\n    text-transform: uppercase; letter-spacing: 0.05em;\n    padding-bottom: 4px;\n    text-align: right;\n  }\n  .pa-grid-head:first-child { text-align: left; }\n  .pa-grid-label {\n    font-size: 13px; color: var(--navy); font-weight: 600;\n  }\n  .pa-grid input[type=\"number\"] {\n    width: 100%; padding: 6px 8px;\n    background: var(--paper); color: var(--navy);\n    border: 1px solid var(--line); border-radius: 6px;\n    font-size: 13px; font-family: ui-monospace, monospace;\n    text-align: right;\n    -moz-appearance: textfield;\n  }\n  .pa-grid input[type=\"number\"]:focus { outline: none; border-color: var(--green); box-shadow: 0 0 0 2px rgba(64, 156, 105, 0.16); }\n  .pa-grid input[type=\"number\"]::-webkit-outer-spin-button,\n  .pa-grid input[type=\"number\"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }\n  .pa-grid .pa-hint { font-size: 11px; color: var(--slate); grid-column: 1 / -1; margin-top: 2px; }\n  .pa-changed { background: #fff8eb; }\n  /* Read-only value chip \u2014 replaces the editable number input now that\n     pricing is shown for reference rather than tunable from the UI. */\n  .pa-readonly {\n    display: inline-block; width: 100%; box-sizing: border-box;\n    padding: 6px 10px;\n    background: var(--line-soft); color: var(--navy);\n    border: 1px solid var(--line); border-radius: 6px;\n    font-size: 13px; font-family: ui-monospace, monospace;\n    text-align: right; font-weight: 600;\n  }\n  .pa-readonly.muted { color: var(--slate); font-weight: 400; }\n  .pa-footer {\n    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;\n    padding: 14px 20px;\n    border-top: 1px solid var(--line);\n    position: sticky; bottom: 0;\n    background: var(--paper); z-index: 2;\n  }\n  .pa-meta { flex: 1; font-size: 11px; color: var(--slate); min-width: 140px; }\n  .pa-toast {\n    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);\n    background: var(--navy); color: white;\n    padding: 12px 22px; border-radius: 999px;\n    font-size: 13px; font-weight: 600;\n    box-shadow: var(--shadow-lg);\n    opacity: 0; pointer-events: none;\n    transition: opacity 0.2s, transform 0.2s;\n    z-index: 9999;\n  }\n  .pa-toast.show { opacity: 1; transform: translateX(-50%) translateY(-8px); }\n  @media (max-width: 640px) {\n    .pricing-admin-dialog { max-width: calc(100% - 16px); width: calc(100% - 16px); }\n    .pa-grid { grid-template-columns: 1fr 90px 90px 90px; gap: 4px 6px; font-size: 12px; }\n    .pa-grid-label { font-size: 12px; }\n    .pa-tabs { padding: 6px 6px 0; }\n    .pa-tab { padding: 8px 10px; font-size: 12px; }\n    .pa-footer { padding: 10px 14px; }\n  }\n  .info-dialog[open] { animation: modalPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }\n  .info-dialog::backdrop { background: rgba(26, 37, 64, 0.55); animation: fadeIn 0.2s; }\n  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }\n  /* Keep the centering translate baked into every keyframe of the\n     pop animation, otherwise the dialog snaps from a corner to center\n     as the animation ends. */\n  /* Keep the centering translate baked into every keyframe of the pop\n     animation, otherwise the dialog snaps from a corner to center as the\n     animation ends. */\n  @keyframes modalPop {\n    from { transform: translate(-50%, -50%) scale(0.92); opacity: 0; }\n    to   { transform: translate(-50%, -50%) scale(1);    opacity: 1; }\n  }\n  .info-modal-header {\n    padding: 18px 22px; border-bottom: 1px solid var(--line);\n    display: flex; justify-content: space-between; align-items: center;\n  }\n  .info-modal-header h3 { margin: 0; font-size: 18px; color: var(--navy); }\n  .info-modal-header .close-x {\n    background: var(--line-soft); color: var(--slate);\n    width: 28px; height: 28px; border-radius: 6px;\n    font-size: 16px; font-weight: 700;\n    display: flex; align-items: center; justify-content: center;\n  }\n  .info-modal-header .close-x:hover { background: var(--coral-pale); color: var(--coral); }\n  .info-modal-body { padding: 20px 22px; font-size: 14px; line-height: 1.6; color: var(--navy); }\n  .info-modal-body p { margin-bottom: 12px; }\n  .info-modal-body strong { color: var(--green); }\n  .info-modal-body ul { margin: 8px 0 12px 20px; }\n  .info-modal-body li { margin-bottom: 6px; }\n  .info-modal-body .info-img {\n    width: 100%; max-height: 200px; object-fit: cover;\n    border-radius: 10px; margin-bottom: 14px;\n  }\n\n  /* AUTH OVERLAY \u2014 full-cover gate shown until the rep signs in.\n     Sits above everything else (z-index 5000+) with its own backdrop\n     so the calc behind it can't be interacted with. */\n  .auth-gate {\n    position: fixed; inset: 0;\n    background: linear-gradient(135deg, #1a2540 0%, #2a3556 100%);\n    z-index: 5000;\n    display: flex; align-items: center; justify-content: center;\n    padding: 20px;\n    -webkit-overflow-scrolling: touch;\n    overflow-y: auto;\n  }\n  .auth-card {\n    background: var(--paper);\n    border-radius: 16px;\n    padding: 32px 28px;\n    max-width: 420px;\n    width: 100%;\n    box-shadow: 0 20px 60px rgba(0,0,0,0.35);\n  }\n  .auth-card .auth-logo {\n    width: 56px; height: 56px; border-radius: 12px;\n    background: var(--navy); color: white;\n    display: flex; align-items: center; justify-content: center;\n    font-size: 22px; font-weight: 800;\n    margin: 0 auto 16px;\n  }\n  .auth-card h2 {\n    text-align: center;\n    margin: 0 0 6px;\n    color: var(--navy);\n    font-size: 20px;\n  }\n  .auth-card .auth-sub {\n    text-align: center;\n    color: var(--slate);\n    font-size: 13px;\n    margin-bottom: 22px;\n  }\n  .auth-card .field { margin-bottom: 14px; }\n  .auth-card .field label {\n    display: block;\n    font-size: 12px; font-weight: 700;\n    color: var(--navy);\n    text-transform: uppercase; letter-spacing: 0.05em;\n    margin-bottom: 6px;\n  }\n  .auth-card .field input {\n    width: 100%; box-sizing: border-box;\n    padding: 12px 14px;\n    border: 1.5px solid var(--line);\n    border-radius: 8px;\n    font-size: 16px;\n    color: var(--navy);\n    background: var(--paper);\n  }\n  .auth-card .field input:focus {\n    outline: none; border-color: var(--green);\n    box-shadow: 0 0 0 3px rgba(64, 156, 105, 0.18);\n  }\n  .auth-card .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }\n  .auth-card .auth-submit {\n    width: 100%; padding: 14px; min-height: 52px;\n    margin-top: 8px;\n    background: var(--green); color: white;\n    border: none; border-radius: 8px;\n    font-size: 15px; font-weight: 700;\n    cursor: pointer; transition: background 0.12s, transform 0.06s;\n  }\n  .auth-card .auth-submit:hover { background: #3a755a; }\n  .auth-card .auth-submit:active { transform: scale(0.99); }\n  .auth-card .auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }\n  .auth-card .auth-error {\n    background: #ffeded;\n    color: #a23636;\n    padding: 10px 14px;\n    border-radius: 8px;\n    font-size: 13px;\n    margin-bottom: 14px;\n    display: none;\n  }\n  .auth-card .auth-error.show { display: block; }\n  .auth-card .auth-bootstrap-banner {\n    background: #fff8eb;\n    border: 1.5px solid #f1d68e;\n    color: #6b4d00;\n    padding: 12px 14px;\n    border-radius: 8px;\n    font-size: 13px;\n    margin-bottom: 16px;\n  }\n  .auth-card .auth-status {\n    display: flex; align-items: center; justify-content: center; gap: 10px;\n    padding: 14px;\n    background: #f5f9ff;\n    border-radius: 8px;\n    font-size: 14px; font-weight: 600;\n    color: var(--navy);\n    margin-bottom: 16px;\n  }\n  .auth-card .auth-status.success {\n    background: #e8f7ee;\n    color: #1f6b3a;\n  }\n  .auth-card .auth-status .spinner {\n    width: 16px; height: 16px;\n    border: 2px solid #d9e3f0;\n    border-top-color: var(--navy);\n    border-radius: 50%;\n    animation: authSpin 0.7s linear infinite;\n  }\n  @keyframes authSpin { to { transform: rotate(360deg); } }\n  .auth-card .auth-help {\n    font-size: 11px;\n    color: var(--slate);\n    text-align: center;\n    margin-top: 18px;\n    line-height: 1.5;\n  }\n\n  /* Header rep chip */\n  .rep-chip {\n    display: inline-flex; align-items: center; gap: 6px;\n    padding: 6px 12px;\n    background: var(--line-soft);\n    border-radius: 999px;\n    font-size: 12px; font-weight: 700;\n    color: var(--navy);\n    cursor: pointer;\n    -webkit-tap-highlight-color: transparent;\n  }\n  .rep-chip:hover { background: var(--line); }\n  .rep-chip .rep-initials {\n    width: 22px; height: 22px;\n    background: var(--navy); color: white;\n    border-radius: 50%;\n    display: inline-flex; align-items: center; justify-content: center;\n    font-size: 10px; font-weight: 800;\n  }\n  .rep-chip-menu {\n    position: absolute;\n    background: var(--paper);\n    border: 1px solid var(--line);\n    border-radius: 8px;\n    box-shadow: var(--shadow-md);\n    min-width: 200px;\n    padding: 6px;\n    z-index: 4000;\n  }\n  .rep-chip-menu button {\n    display: flex; align-items: center; gap: 8px;\n    width: 100%;\n    background: transparent; border: none;\n    padding: 10px 12px;\n    text-align: left;\n    font-size: 13px; color: var(--navy);\n    border-radius: 6px;\n    cursor: pointer;\n  }\n  .rep-chip-menu button:hover { background: var(--line-soft); }\n  .rep-chip-menu .rep-menu-info {\n    padding: 10px 12px;\n    border-bottom: 1px solid var(--line);\n    margin-bottom: 4px;\n    font-size: 12px;\n    color: var(--slate);\n  }\n\n  /* ============================================================\n     CUSTOMER-FACING CALCULATOR\n     ============================================================\n     Styles for the public customer build. All keyed under either\n     `.cust-*` class names or `.customer-mode` modifiers so they\n     don't pollute the rep build's stylesheet if anything is ever\n     shared. Visually distinct from the rep tool but uses the same\n     design token palette (--green / --navy / etc.) for brand\n     consistency.\n     ============================================================ */\n\n  /* Resume-from-localStorage banner. Pops at the top of the hero when\n     __custMaybeShowResumeBanner() finds a recent unsubmitted snapshot.\n     Soft blue accent so it doesn't compete with the headline. */\n  .cust-resume-banner {\n    display: none; align-items: center; gap: 14px;\n    background: #eef4fb; border: 1.5px solid #c8d8ec;\n    border-radius: 12px; padding: 14px 16px;\n    margin: 0 0 22px;\n  }\n  .cust-resume-banner-ico {\n    font-size: 28px; line-height: 1; flex-shrink: 0;\n  }\n  .cust-resume-banner-text { flex: 1; min-width: 0; }\n  .cust-resume-banner-text strong {\n    display: block; color: #1e4978; font-size: 15px; font-weight: 800;\n    margin-bottom: 2px;\n  }\n  .cust-resume-banner-text span {\n    display: block; color: #2c6da7; font-size: 13px;\n  }\n  .cust-resume-banner-actions {\n    display: flex; gap: 8px; flex-shrink: 0;\n  }\n  .cust-resume-banner-actions .btn {\n    padding: 8px 14px; font-size: 13px; min-height: 36px;\n  }\n  @media (max-width: 640px) {\n    .cust-resume-banner { flex-wrap: wrap; }\n    .cust-resume-banner-text { flex: 1 1 calc(100% - 42px); }\n    .cust-resume-banner-actions { flex: 1 1 100%; }\n    .cust-resume-banner-actions .btn { flex: 1; }\n  }\n\n  /* =============================================================\n     MOBILE COLLAPSE PATTERN \u2014 reusable\n     =============================================================\n     On phones, wrap any chunk of content in <div class=\"cust-mc\"> to\n     hide it by default. Add a sibling .cust-mc-toggle button that\n     calls toggleMobileExpand(event) on tap. The toggle adds/removes\n     the `.expanded` class on the nearest ancestor with\n     [data-mobile-collapse], revealing the .cust-mc content.\n     Desktop: toggle is hidden, .cust-mc always visible (transparent\n     to non-mobile users). */\n  .cust-mc-toggle { display: none; }\n  @media (max-width: 640px) {\n    .cust-mc {\n      max-height: 0;\n      overflow: hidden;\n      opacity: 0;\n      transition: max-height 0.3s ease, opacity 0.2s ease;\n    }\n    [data-mobile-collapse].expanded .cust-mc {\n      max-height: 1400px;\n      opacity: 1;\n    }\n    .cust-mc-toggle {\n      display: flex; align-items: center; justify-content: center;\n      gap: 6px; width: 100%;\n      margin: 8px 0 0;\n      padding: 8px 12px;\n      background: transparent;\n      border: 1px dashed var(--line);\n      border-radius: 8px;\n      color: var(--green);\n      font-size: 12.5px; font-weight: 700;\n      cursor: pointer;\n      -webkit-tap-highlight-color: transparent;\n      text-align: center;\n    }\n    .cust-mc-toggle .chev {\n      display: inline-block;\n      transition: transform 0.2s;\n      font-size: 14px;\n    }\n    [data-mobile-collapse].expanded .cust-mc-toggle .chev {\n      transform: rotate(180deg);\n    }\n    .cust-mc-toggle .lbl-collapsed { display: inline; }\n    .cust-mc-toggle .lbl-expanded { display: none; }\n    [data-mobile-collapse].expanded .cust-mc-toggle .lbl-collapsed { display: none; }\n    [data-mobile-collapse].expanded .cust-mc-toggle .lbl-expanded { display: inline; }\n  }\n\n  /* Hero / intro stage */\n  .cust-hero { max-width: 760px; margin: 0 auto; padding: 8px 0 40px; }\n  .cust-hero-eyebrow {\n    color: var(--green); font-size: 12px; font-weight: 700;\n    letter-spacing: 0.16em; text-transform: uppercase;\n    margin-bottom: 10px;\n  }\n  .cust-hero-h1 {\n    font-size: 38px; line-height: 1.15; letter-spacing: -0.5px;\n    color: var(--navy); margin: 0 0 18px;\n  }\n  .cust-hero-lead {\n    font-size: 16px; line-height: 1.6; color: var(--slate);\n    margin: 0 0 28px; max-width: 640px;\n  }\n  .cust-hero-trust {\n    display: grid;\n    /* 2 compact trust cells (Google rating + Licensed & Insured). The\n       EXPERT cert moved out to its own dedicated banner below \u2014 see\n       .cust-hero-cert. */\n    grid-template-columns: repeat(2, 1fr);\n    gap: 12px;\n    align-items: center;\n    background: var(--paper); border: 1.5px solid var(--line);\n    border-radius: 12px; padding: 18px; margin-bottom: 12px;\n  }\n  .cust-trust-item {\n    text-align: center;\n    display: flex; flex-direction: column;\n    align-items: center; justify-content: center;\n    gap: 4px;\n  }\n  .cust-trust-item strong {\n    display: inline-flex;\n    align-items: center; justify-content: center;\n    gap: 8px;\n    color: var(--navy); font-size: 18px; font-weight: 800;\n    letter-spacing: -0.2px; line-height: 1.1;\n  }\n  .cust-trust-item span {\n    font-size: 11px; color: var(--slate);\n    text-transform: uppercase; letter-spacing: 0.06em;\n    display: block;\n  }\n\n  /* Dedicated EXPERT certification banner \u2014 bigger badge + descriptive\n     copy alongside. Horizontal on desktop (badge left, text right),\n     stacks vertically on phones. */\n  .cust-hero-cert {\n    display: flex;\n    align-items: center;\n    gap: 18px;\n    background: var(--paper); border: 1.5px solid var(--line);\n    border-radius: 12px; padding: 16px 20px; margin-bottom: 28px;\n  }\n  .cust-hero-cert-badge {\n    width: 84px;\n    height: auto;\n    flex-shrink: 0;\n    display: block;\n  }\n  .cust-hero-cert-text {\n    flex: 1; min-width: 0;\n  }\n  .cust-hero-cert-text strong {\n    display: block;\n    color: var(--navy); font-size: 16px; font-weight: 800;\n    letter-spacing: -0.2px; margin-bottom: 4px;\n  }\n  .cust-hero-cert-text span {\n    display: block;\n    color: var(--slate); font-size: 13.5px; line-height: 1.55;\n  }\n  /* Benefits grid \u2014 2x2 on desktop, 1-col on phones. Replaces the old\n     5-card vertical .cust-hero-bullets stack so the page reads faster\n     and the eye has variety (icons in colored squares, instead of\n     a wall of identical white cards). */\n  .cust-hero-benefits {\n    display: grid;\n    grid-template-columns: 1fr 1fr;\n    gap: 12px; margin: 0 0 24px;\n  }\n  .cust-hero-benefit {\n    background: var(--paper); border: 1px solid var(--line);\n    border-radius: 12px; padding: 16px 18px;\n    display: flex; flex-direction: column; gap: 8px;\n    transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;\n  }\n  .cust-hero-benefit:hover {\n    border-color: var(--green);\n    transform: translateY(-1px);\n    box-shadow: var(--shadow-md);\n  }\n  .cust-hero-benefit-ico {\n    width: 40px; height: 40px;\n    border-radius: 10px;\n    background: var(--green-pale); color: var(--green);\n    display: inline-flex; align-items: center; justify-content: center;\n    font-size: 20px; line-height: 1;\n    flex-shrink: 0;\n  }\n  .cust-hero-benefit strong {\n    color: var(--navy); font-size: 14.5px; font-weight: 800;\n    line-height: 1.3; letter-spacing: -0.1px;\n  }\n  .cust-hero-benefit p {\n    margin: 0; color: var(--slate); font-size: 13.5px; line-height: 1.5;\n  }\n\n  /* Reviews card \u2014 the single accent break in the otherwise all-white\n     hero. Dark navy gradient. Links out to the company's real Google\n     My Business reviews page (no placeholder testimonials). Hover lifts\n     the card so the link affordance is obvious. */\n  .cust-hero-reviews {\n    position: relative;\n    display: block;\n    background: linear-gradient(135deg, var(--navy) 0%, #2a3e5c 100%);\n    color: #fff;\n    text-decoration: none;\n    border-radius: 14px;\n    padding: 22px 26px;\n    margin: 4px 0 18px;\n    overflow: hidden;\n    transition: transform 0.15s, box-shadow 0.15s;\n  }\n  .cust-hero-reviews:hover {\n    transform: translateY(-2px);\n    box-shadow: 0 8px 24px rgba(26, 37, 64, 0.22);\n    text-decoration: none;\n  }\n  .cust-hero-reviews-inner {\n    display: flex; align-items: center; gap: 18px;\n    position: relative; z-index: 1;\n  }\n  .cust-hero-reviews-stars {\n    font-size: 28px; line-height: 1;\n    color: #ffc532; letter-spacing: 3px;\n    flex-shrink: 0;\n  }\n  .cust-hero-reviews-text { flex: 1; min-width: 0; }\n  .cust-hero-reviews-text strong {\n    display: block; color: #fff; font-weight: 700;\n    font-size: 17px; letter-spacing: -0.2px; margin-bottom: 4px;\n  }\n  .cust-hero-reviews-text span {\n    display: block; color: rgba(255,255,255,0.78);\n    font-size: 13.5px; line-height: 1.45;\n  }\n  .cust-hero-reviews-arr {\n    color: #fff; font-size: 22px; line-height: 1;\n    opacity: 0.6; flex-shrink: 0;\n    transition: transform 0.15s, opacity 0.15s;\n  }\n  .cust-hero-reviews:hover .cust-hero-reviews-arr {\n    opacity: 1; transform: translateX(3px);\n  }\n\n  /* Perk pills \u2014 small honest callouts beneath the primary CTA.\n     Color consult, same-day quote, current scheduling window. Less\n     visual weight than full benefit cards but adds 3 more reasons to\n     click without crowding the hero. */\n  .cust-hero-perks {\n    display: flex; flex-wrap: wrap;\n    gap: 8px; justify-content: center;\n    margin: 16px auto 4px; max-width: 640px;\n  }\n  .cust-hero-perk {\n    display: inline-flex; align-items: center; gap: 6px;\n    padding: 6px 12px;\n    background: var(--green-pale); color: var(--green);\n    border-radius: 999px;\n    font-size: 12.5px; font-weight: 700;\n    letter-spacing: 0.01em;\n  }\n  .cust-hero-perk .ico { font-size: 14px; line-height: 1; }\n\n  /* Make \u2605 5.0 trust card a clickable link to Google reviews. */\n  a.cust-trust-item {\n    text-decoration: none; color: inherit;\n    transition: transform 0.12s;\n  }\n  a.cust-trust-item:hover { transform: translateY(-1px); text-decoration: none; }\n  a.cust-trust-item strong { color: var(--navy); }\n\n  .cust-hero-cta { text-align: center; margin: 16px 0 28px; }\n  .cust-hero-btn { font-size: 17px; padding: 18px 36px; min-height: 60px; }\n  .cust-hero-fine { font-size: 12px; color: var(--slate); margin-top: 10px; }\n\n  .cust-hero-faq {\n    background: var(--paper); border: 1.5px solid var(--line);\n    border-radius: 12px; padding: 0;\n  }\n  .cust-hero-faq summary {\n    cursor: pointer; padding: 20px 24px;\n    font-weight: 700; color: var(--navy);\n    font-size: 17px;\n    list-style: none; user-select: none;\n  }\n  .cust-hero-faq summary::-webkit-details-marker { display: none; }\n  .cust-hero-faq summary::after {\n    content: '\uff0b'; float: right; color: var(--green);\n    font-weight: 800; font-size: 22px; line-height: 1;\n  }\n  .cust-hero-faq[open] summary::after { content: '\u2212'; }\n  .cust-hero-faq-body { padding: 0 24px 22px; }\n  .cust-faq-q { padding: 14px 0; border-top: 1px solid var(--line); }\n  .cust-faq-q strong { display: block; color: var(--navy); margin-bottom: 6px; font-size: 16px; }\n  .cust-faq-q p { margin: 0; color: var(--navy); font-size: 15px; line-height: 1.6; }\n\n  /* Step 10 customer-mode overrides */\n  .final-grid.customer-mode { grid-template-columns: 1fr !important; }\n  .action-bar.customer-mode { justify-content: center; margin-top: 20px; }\n  .action-bar.customer-mode .right { display: none; }\n  .cust-extra-notes {\n    margin-top: 20px; padding: 16px 18px;\n    background: var(--paper); border: 1.5px solid var(--line);\n    border-radius: 12px;\n  }\n  .cust-extra-notes label { display: block; color: var(--navy); margin-bottom: 4px; font-size: 14px; }\n  .cust-extra-notes-hint { font-size: 12.5px; color: var(--slate); margin: 0 0 10px; }\n  .cust-extra-notes textarea {\n    width: 100%; box-sizing: border-box;\n    padding: 10px 12px; border: 1.5px solid var(--line); border-radius: 8px;\n    font-family: inherit; font-size: 14px; color: var(--navy);\n    resize: vertical; min-height: 70px;\n  }\n  .cust-extra-notes textarea:focus { outline: none; border-color: var(--green); }\n\n  /* \"What's included\" callout \u2014 sits between the breakdown and the\n     submit block. Reassures the customer that the total they see is\n     comprehensive (no add-on labor fees, no surprise wash bills). */\n  .cust-included {\n    background: var(--paper); border: 1.5px solid var(--line);\n    border-radius: 12px; padding: 16px 18px;\n    margin: 18px 0 0;\n  }\n  .cust-included-title {\n    font-size: 13px; font-weight: 800; color: var(--green);\n    text-transform: uppercase; letter-spacing: 0.06em;\n    margin-bottom: 10px;\n  }\n  .cust-included-list {\n    margin: 0; padding: 0; list-style: none;\n    display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px;\n  }\n  .cust-included-list li {\n    position: relative;\n    padding-left: 22px;\n    font-size: 13.5px; color: var(--navy); line-height: 1.45;\n  }\n  .cust-included-list li::before {\n    content: '\u2713';\n    position: absolute; left: 2px; top: 1px;\n    color: var(--green); font-weight: 800;\n  }\n  @media (max-width: 640px) {\n    .cust-included-list { grid-template-columns: 1fr; }\n  }\n\n  /* \"What happens next\" preview \u2014 3 numbered mini-cards above the\n     submit button. Lower-commitment framing: shows the customer\n     exactly what tapping the button kicks off. */\n  .cust-next-steps {\n    background: rgba(255,255,255,0.6);\n    border-radius: 10px;\n    padding: 14px 12px;\n    margin-bottom: 18px;\n  }\n  .cust-next-steps-title {\n    font-size: 12px; font-weight: 800;\n    color: var(--green); text-transform: uppercase; letter-spacing: 0.06em;\n    margin-bottom: 10px;\n  }\n  .cust-next-steps-grid {\n    display: grid; grid-template-columns: repeat(3, 1fr);\n    gap: 10px;\n  }\n  .cust-next-step {\n    display: flex; align-items: flex-start; gap: 8px;\n    text-align: left;\n  }\n  .cust-next-step-num {\n    flex-shrink: 0;\n    width: 24px; height: 24px;\n    border-radius: 50%;\n    background: var(--green); color: #fff;\n    font-size: 12px; font-weight: 800;\n    display: inline-flex; align-items: center; justify-content: center;\n  }\n  .cust-next-step-text { flex: 1; min-width: 0; }\n  .cust-next-step-text strong {\n    display: block;\n    font-size: 13px; color: var(--navy); font-weight: 700;\n    line-height: 1.25; margin-bottom: 2px;\n  }\n  .cust-next-step-text span {\n    display: block;\n    font-size: 11.5px; color: var(--slate); line-height: 1.4;\n  }\n  @media (max-width: 640px) {\n    .cust-next-steps-grid { grid-template-columns: 1fr; gap: 8px; }\n    .cust-next-step-text span { font-size: 12px; }\n  }\n\n  /* Submit-in-flight spinner \u2014 circular border, animated. Swapped into\n     the button's label while the estimate is being generated. */\n  .cust-submit-btn.loading { cursor: progress; opacity: 0.85; }\n  .cust-submit-spinner {\n    display: inline-block;\n    width: 14px; height: 14px;\n    border: 2px solid rgba(255,255,255,0.4);\n    border-top-color: #fff;\n    border-radius: 50%;\n    vertical-align: middle;\n    margin-right: 8px;\n    animation: cust-spin 0.7s linear infinite;\n  }\n  @keyframes cust-spin { to { transform: rotate(360deg); } }\n\n  .cust-submit-block { text-align: center; margin: 28px 0 16px; padding: 24px 18px; background: var(--green-pale); border-radius: 12px; }\n  .cust-submit-btn { font-size: 17px; padding: 18px 32px; min-height: 60px; min-width: 320px; }\n  .cust-callback-btn { font-size: 15px; padding: 14px 28px; min-height: 50px; min-width: 280px; }\n  .cust-submit-sub { font-size: 12.5px; color: var(--slate); max-width: 460px; margin: 10px auto 0; line-height: 1.5; }\n  .cust-submit-or {\n    margin: 18px auto 12px; color: var(--slate); font-size: 13px;\n    text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700;\n  }\n  .cust-submit-status {\n    margin-top: 14px; padding: 12px 14px; border-radius: 8px;\n    font-size: 14px; text-align: center;\n  }\n  .cust-submit-status.pending { background: #fff5e6; color: #6b4d00; }\n  .cust-submit-status.success { background: var(--green-pale); color: #1f4d36; }\n  .cust-submit-status.error { background: var(--coral-pale); color: var(--coral); }\n\n  /* Success screen \u2014 customer-facing thank-you */\n  .cust-success-box {\n    max-width: 460px; margin: 0 auto 20px;\n    background: var(--paper); border: 1.5px solid var(--line);\n    border-radius: 12px; padding: 14px 18px;\n  }\n  .cust-success-row {\n    display: flex; justify-content: space-between; align-items: baseline;\n    padding: 8px 0; border-bottom: 1px solid var(--line);\n  }\n  .cust-success-row:last-child { border-bottom: none; }\n  .cust-success-row strong { font-size: 13px; color: var(--slate); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }\n  .cust-success-row span { font-size: 17px; color: var(--navy); font-weight: 700; font-family: ui-monospace, monospace; }\n  .cust-success-next {\n    max-width: 540px; margin: 0 auto;\n    text-align: left; background: var(--paper);\n    border: 1px solid var(--line); border-radius: 12px; padding: 18px 22px;\n  }\n  .cust-success-next h3 {\n    font-size: 12px; color: var(--slate); text-transform: uppercase;\n    letter-spacing: 0.08em; margin: 0 0 12px;\n  }\n  .cust-success-next ol { margin: 0; padding-left: 22px; color: var(--navy); font-size: 14px; line-height: 1.7; }\n  .cust-success-next ol li { margin-bottom: 8px; line-height: 1.6; }\n  .cust-success-next ol li strong { color: var(--navy); }\n\n  /* Portal CTA on the success screen \u2014 biggest, highest-contrast button\n     on the page since this is the customer's path to approval + payment. */\n  .cust-success-portal {\n    text-align: center;\n    margin: 0 0 24px;\n    padding: 24px 18px;\n    background: var(--green-pale);\n    border: 2px solid var(--green);\n    border-radius: 14px;\n  }\n  .cust-portal-btn {\n    font-size: 17px; padding: 18px 32px; min-height: 60px;\n    min-width: 320px;\n  }\n  .cust-success-portal-sub {\n    font-size: 13px; color: var(--navy); max-width: 480px;\n    margin: 12px auto 0; line-height: 1.55;\n  }\n  .cust-secondary-ctas {\n    display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;\n    margin-top: 6px;\n  }\n  .cust-secondary-ctas .cust-callback-btn {\n    flex: 1; max-width: 220px; min-width: 0;\n    padding: 12px 16px; font-size: 14px; min-height: 46px;\n    text-decoration: none;\n  }\n\n  /* Sticky floating bar \u2014 shows the running estimate + a \"Need help?\"\n     menu once the customer is past Step 1. Replaces the old header\n     since the customer build embeds inside an existing Wix layout. */\n  /* Floating bar \u2014 sits flush against the progress strip below it so\n     the two look like one continuous piece of top chrome. No border or\n     margin between them; the progress strip's own bottom border +\n     shadow handle the visual separation from the page content. */\n  .cust-floating-bar {\n    position: sticky; top: 0;\n    z-index: 50;\n    display: flex; justify-content: space-between; align-items: center;\n    gap: 12px;\n    padding: 10px 16px;\n    background: var(--paper);\n    margin: 0;\n  }\n  .cust-floating-bar .total-pill { min-height: 0; padding: 6px 14px; }\n  .cust-floating-help { position: relative; }\n  .cust-help-btn {\n    background: transparent; border: 1.5px solid var(--green);\n    color: var(--green); padding: 8px 16px; border-radius: 999px;\n    font-size: 13px; font-weight: 700; cursor: pointer;\n    transition: background 0.12s, color 0.12s;\n    -webkit-tap-highlight-color: transparent;\n  }\n  .cust-help-btn:hover { background: var(--green); color: white; }\n\n  /* \"Need help?\" modal \u2014 centered in the viewport on every screen size.\n     Universal modal (mobile + desktop) rather than a dropdown. Behind\n     a dimmed backdrop with an \u00d7 close button in the top-right corner. */\n  .cust-help-menu {\n    position: fixed;\n    top: 50%; left: 50%;\n    right: auto; bottom: auto;\n    transform: translate(-50%, -50%);\n    background: var(--paper); border: 1.5px solid var(--line);\n    border-radius: 14px;\n    padding: 36px 12px 12px;          /* extra top padding clears the \u00d7 */\n    width: calc(100vw - 32px);\n    max-width: 380px;\n    min-width: 0;\n    max-height: 80vh;\n    overflow-y: auto;\n    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.28);\n    display: none;\n    z-index: 110;\n  }\n  .cust-help-menu.open { display: block; }\n\n  /* Close (\u00d7) button \u2014 top-right corner of the modal. Same on mobile\n     + desktop. Outside-click and backdrop-click also dismiss. */\n  .cust-help-close {\n    display: inline-flex; align-items: center; justify-content: center;\n    position: absolute; top: 8px; right: 8px;\n    background: transparent; border: none;\n    width: 32px; height: 32px;\n    font-size: 22px; line-height: 1;\n    color: var(--slate); cursor: pointer;\n    border-radius: 8px;\n    -webkit-tap-highlight-color: transparent;\n  }\n  .cust-help-close:hover { background: var(--line-soft); color: var(--navy); }\n\n  /* Backdrop behind the help menu modal \u2014 visible on every screen size\n     when the menu is open. Click to dismiss. */\n  .cust-help-backdrop {\n    display: none;\n    position: fixed; inset: 0;\n    background: rgba(0, 0, 0, 0.5);\n    z-index: 100;\n    -webkit-tap-highlight-color: transparent;\n  }\n  .cust-help-backdrop.open { display: block; }\n  .cust-help-menu a, .cust-help-menu button {\n    display: flex; align-items: center; gap: 10px; width: 100%;\n    padding: 12px 14px; border-radius: 8px;\n    background: transparent; border: none; cursor: pointer;\n    font-size: 14px; font-weight: 600; color: var(--navy);\n    text-align: left; text-decoration: none;\n    transition: background 0.1s;\n  }\n  .cust-help-menu a:hover, .cust-help-menu button:hover { background: var(--line-soft); }\n  .cust-help-menu .ico {\n    font-size: 18px; flex-shrink: 0;\n    width: 32px; height: 32px;\n    background: var(--green-pale); color: var(--green);\n    border-radius: 8px; display: inline-flex;\n    align-items: center; justify-content: center;\n  }\n  .cust-help-menu .lbl { flex: 1; }\n  .cust-help-menu .lbl small {\n    display: block; font-size: 12px; color: var(--slate);\n    margin-top: 2px; font-weight: 500;\n  }\n  .cust-help-menu-divider { border-top: 1px solid var(--line); margin: 4px 0; }\n  .cust-help-menu .copy-confirm {\n    font-size: 11px; color: var(--green); padding: 2px 8px;\n    border-radius: 999px; background: var(--green-pale); font-weight: 700;\n    margin-left: 8px; opacity: 0; transition: opacity 0.2s;\n  }\n  .cust-help-menu .copy-confirm.show { opacity: 1; }\n\n  /* ============================================================\n     CUSTOMER MOBILE \u2014 keep the hero readable on phones\n     ============================================================ */\n  @media (max-width: 640px) {\n    .cust-hero { padding: 4px 0 28px; }\n    .cust-hero-h1 { font-size: 26px; }\n    .cust-hero-lead { font-size: 14.5px; }\n    .cust-hero-trust { grid-template-columns: repeat(2, 1fr); padding: 12px; gap: 8px; }\n    .cust-trust-item strong { font-size: 14px; gap: 5px; flex-wrap: wrap; }\n    .cust-trust-item span { font-size: 10px; }\n    /* Stack the EXPERT cert banner vertically on phones so the badge\n       and text both stay readable. */\n    .cust-hero-cert { flex-direction: column; text-align: center; padding: 14px; gap: 12px; }\n    .cust-hero-cert-badge { width: 72px; }\n    .cust-hero-cert-text strong { font-size: 15px; }\n    .cust-hero-cert-text span { font-size: 13px; }\n    /* Benefits grid collapses to 1-col on phones */\n    .cust-hero-benefits { grid-template-columns: 1fr; gap: 10px; }\n    .cust-hero-benefit { padding: 14px 16px; }\n    /* Reviews card on phones \u2014 stack vertically so the stars sit on\n       top of the text rather than taking half the card width. */\n    .cust-hero-reviews { padding: 16px; }\n    .cust-hero-reviews-inner {\n      flex-direction: column;\n      align-items: flex-start;\n      gap: 8px; text-align: left;\n    }\n    .cust-hero-reviews-stars { font-size: 22px; letter-spacing: 3px; }\n    .cust-hero-reviews-text strong { font-size: 15.5px; }\n    .cust-hero-reviews-text span { font-size: 13px; }\n    .cust-hero-reviews-arr { display: none; }\n    .cust-hero-perks { gap: 6px; }\n    .cust-hero-perk { font-size: 11.5px; padding: 5px 10px; }\n    .cust-hero-btn { width: 100%; font-size: 15px; padding: 16px; min-height: 54px; }\n\n    /* Bottom Continue/Back nav stays glued to the viewport bottom on\n       phones (position:fixed, not sticky) \u2014 sticky only kicks in when\n       the section overflows, but on shorter stages users get stranded\n       with no visible CTA. Fixed means it's ALWAYS at the screen edge.\n       Stages get padding-bottom (below) to keep content clear of it. */\n    .stage-nav {\n      position: fixed;\n      bottom: 0;\n      left: 0;\n      right: 0;\n      z-index: 30;\n      padding: 12px 16px calc(12px + env(safe-area-inset-bottom));\n      background: var(--paper, #fafbfc);\n      border-top: 1px solid var(--line);\n      margin: 0;\n      box-shadow: 0 -4px 14px rgba(0, 0, 0, 0.06);\n    }\n    .stage-nav .btn { flex: 1; }\n    /* Reserve room above the fixed CTA so the last input / button on\n       each stage doesn't get hidden behind it. */\n    .stage { padding-bottom: 96px; }\n    /* Inputs scroll-margin so iOS Safari's autoscroll-on-focus keeps\n       the active field above both the top floating bar AND the fixed\n       bottom CTA. */\n    input, select, textarea {\n      scroll-margin-bottom: 110px;\n      scroll-margin-top: 80px;\n    }\n    .cust-submit-btn, .cust-callback-btn { width: 100%; min-width: 0; font-size: 15px; }\n    .cust-submit-block { padding: 18px 12px; }\n    .cust-floating-bar { padding: 8px 12px; }\n    .cust-help-btn { font-size: 12px; padding: 6px 12px; }\n    /* Help menu is now a universal centered modal \u2014 see base\n       .cust-help-menu / .cust-help-backdrop blocks above. No mobile-\n       specific overrides needed. */\n    /* On phone make the FAQ font friendly without going too big */\n    .cust-hero-faq summary { font-size: 15px; padding: 16px 18px; }\n    .cust-faq-q strong { font-size: 15px; }\n    .cust-faq-q p { font-size: 14px; }\n  }";
  const HTML  = "<!-- AUTH GATE \u2014 covers everything until the rep signs in. JS toggles\n     it via #authGate.style.display and swaps the inner form depending\n     on bootstrap state (no reps yet \u2192 create-first-admin form vs.\n     normal Sign-In form). The whole gate is rendered upfront and\n     hidden via CSS; the JS only flips a single root style. -->\n<!-- Default-VISIBLE: the gate covers the calc until authStatus\n     resolves. Otherwise the dashboard flashes briefly before the\n     gate slides in. JS hides this whenever auth is confirmed. -->\n<!-- Auth gate kept hidden in the customer build \u2014 public visitors don't sign in.\n     The DOM nodes stay so the existing auth JS doesn't throw on null refs. -->\n<div class=\"auth-gate\" id=\"authGate\" style=\"display:none !important; visibility:hidden;\">\n  <div class=\"auth-card\">\n    <div class=\"auth-logo\">SS</div>\n    <h2 id=\"authTitle\">Loading\u2026</h2>\n    <div class=\"auth-sub\" id=\"authSub\">Checking your session\u2026</div>\n    <div class=\"auth-bootstrap-banner\" id=\"authBootstrapBanner\" style=\"display:none;\">\n      <strong>First-time setup.</strong> No reps exist yet \u2014 the first account you create becomes the admin and can manage everyone else.\n    </div>\n    <div class=\"auth-error\" id=\"authError\"></div>\n    <!-- Status line: shows \"Signing in\u2026\" then \"\u2713 Signed in\" briefly\n         before the gate hides. Hidden by default. -->\n    <div class=\"auth-status\" id=\"authStatusLine\" style=\"display:none;\"></div>\n    <form id=\"authForm\" style=\"display:none;\">\n      <div class=\"auth-bootstrap-fields\" id=\"authBootstrapFields\" style=\"display:none;\">\n        <div class=\"field\">\n          <label>Full name</label>\n          <input type=\"text\" id=\"authDisplayName\" autocomplete=\"name\" placeholder=\"Adrian Gluchowski\">\n        </div>\n        <div class=\"field\">\n          <label>Email <span style=\"color:var(--slate);font-weight:500;text-transform:none;letter-spacing:0;\">(optional)</span></label>\n          <input type=\"email\" id=\"authEmail\" autocomplete=\"email\" placeholder=\"rep@superiorstainsolutions.com\">\n        </div>\n      </div>\n      <div class=\"field-row\">\n        <div class=\"field\">\n          <label>Initials</label>\n          <input type=\"text\" id=\"authInitials\" autocomplete=\"username\" inputmode=\"text\" autocapitalize=\"characters\" maxlength=\"6\" placeholder=\"AG\">\n        </div>\n        <div class=\"field\">\n          <label>PIN</label>\n          <input type=\"password\" id=\"authPin\" autocomplete=\"current-password\" inputmode=\"numeric\" pattern=\"[0-9]*\" maxlength=\"12\" placeholder=\"\u2022 \u2022 \u2022 \u2022\">\n        </div>\n      </div>\n      <button type=\"submit\" class=\"auth-submit\" id=\"authSubmit\">Sign in</button>\n    </form>\n    <div class=\"auth-help\" id=\"authHelpLine\" style=\"display:none;\">\n      Forgot your PIN? Ask an admin to reset it from Settings \u2192 Reps. Sessions auto-expire after 7 days of inactivity.\n    </div>\n  </div>\n</div>\n\n<div class=\"app\">\n\n  <!-- Brand banner removed for the customer build \u2014 this calculator\n       embeds inside the existing Wix site header/footer chrome, so a\n       second SSS banner is redundant.\n       The runtime running-estimate pill + helper buttons float as a\n       sticky bar above the flow once the customer is past Step 1, so\n       they always know where their estimate stands. -->\n  <div class=\"cust-floating-bar\" id=\"custFloatingBar\" style=\"display:none;\">\n    <div class=\"total-pill\" id=\"totalPill\" style=\"display:none;\">\n      <div class=\"lbl\">Your estimate</div>\n      <div class=\"amt\" id=\"totalAmount\">$0</div>\n    </div>\n    <div class=\"cust-floating-help\">\n      <!-- \"Need help?\" button \u2014 opens the modal below as a centered\n           overlay. Modal + backdrop live OUTSIDE this container (and\n           outside .cust-floating-bar) so they escape the bar's\n           stacking context \u2014 otherwise z-index 50 here would cap the\n           backdrop below the progress strip's z-index 80, and the\n           progress steps would stay bright through the dim. -->\n      <button type=\"button\" class=\"cust-help-btn\" onclick=\"toggleCustHelpMenu()\" id=\"custHelpMenuBtn\">\n        Need help?\n      </button>\n    </div>\n  </div>\n\n  <!-- Help modal \u2014 sibling of .cust-floating-bar (not inside it) so its\n       backdrop dims the floating bar AND the progress strip when open.\n       Both elements use position:fixed so DOM position doesn't matter\n       for layout; placement here is purely about stacking context. -->\n  <div class=\"cust-help-backdrop\" id=\"custHelpBackdrop\" onclick=\"toggleCustHelpMenu()\" aria-hidden=\"true\"></div>\n  <!-- IMPORTANT: replace the phone number below with the SSS team\n       number before going live. Pattern: E.164 in href (tel:+1\u2026),\n       formatted in label small text. tel:/sms: schemes work natively\n       on mobile and desktop. -->\n  <div class=\"cust-help-menu\" id=\"custHelpMenu\" data-sss-phone=\"+18647682582\" role=\"dialog\" aria-label=\"Need help\">\n    <button type=\"button\" class=\"cust-help-close\" onclick=\"toggleCustHelpMenu()\" aria-label=\"Close help menu\">\u00d7</button>\n    <a href=\"tel:+18647682582\" onclick=\"trackCustHelpAction('call')\" id=\"custCallLink\">\n      <span class=\"ico\">\ud83d\udcde</span>\n      <span class=\"lbl\"><strong>Call us</strong><small>Tap to dial \u2014 (864) 768-2582</small></span>\n    </a>\n    <a href=\"sms:+18647682582\" onclick=\"trackCustHelpAction('text')\" id=\"custTextLink\">\n      <span class=\"ico\">\ud83d\udcac</span>\n      <span class=\"lbl\"><strong>Text us</strong><small>Send us a message \u2014 we monitor 7 days/week</small></span>\n    </a>\n    <div class=\"cust-help-menu-divider\"></div>\n    <button type=\"button\" onclick=\"custCopyPhoneNumber()\" id=\"custCopyPhoneBtn\">\n      <span class=\"ico\">\ud83d\udccb</span>\n      <span class=\"lbl\"><strong>Copy our number</strong><small id=\"custCopyPhoneSmall\">(864) 768-2582</small></span>\n      <span class=\"copy-confirm\" id=\"custCopyPhoneConfirm\">Copied</span>\n    </button>\n  </div>\n  <!-- Rep-only chrome that the legacy JS still touches via getElementById.\n       Hidden, present only so document.getElementById('quoteNum') etc.\n       don't throw. -->\n  <div style=\"display:none !important;\" aria-hidden=\"true\">\n    <span class=\"quote-num\" id=\"quoteNum\">\u2014</span>\n    <span class=\"save-pill hidden\" id=\"savePill\"><span class=\"dot\"></span><span class=\"save-pill-text\">Idle</span></span>\n    <button type=\"button\" class=\"jobber-pill\" id=\"jobberPill\"><span class=\"jp-dot\"></span><span id=\"jobberPillText\">Jobber</span></button>\n    <div class=\"total-pill secondary\" id=\"activeProjectPill\"><div class=\"lbl\"></div><div class=\"amt\" id=\"activeProjectAmount\">$0</div></div>\n    <button type=\"button\" id=\"headerSideTrackerBtn\"><span class=\"header-tracker-count\" id=\"headerSideTrackerCount\">0</span></button>\n  </div>\n\n  <!-- PROJECT BUBBLES \u2014 shows all projects in this quote, lets employee jump\n       between them. Numbers repeat-types (\"Fence #1\", \"Fence #2\") automatically. -->\n  <div class=\"project-bubbles\" id=\"projectBubbles\" style=\"display:none;\"></div>\n\n  <!-- PROGRESS \u2014 10 steps. Default hidden; refreshProgressBarVisibility()\n       reveals it only when a quote-building stage (1\u201310) is the visible\n       one. Inline display:none beats any timing race where the JS hasn't\n       wired up the visibility logic yet. -->\n  <nav class=\"progress\" id=\"progress\" style=\"display:none;\">\n    <div class=\"progress-step active reachable\" data-stage=\"1\"><span class=\"step-num\">Step 1</span>Customer</div>\n    <div class=\"progress-step\" data-stage=\"2\"><span class=\"step-num\">Step 2</span>Project</div>\n    <div class=\"progress-step\" data-stage=\"3\"><span class=\"step-num\">Step 3</span>Measurements</div>\n    <div class=\"progress-step\" data-stage=\"4\"><span class=\"step-num\">Step 4</span>Condition</div>\n    <div class=\"progress-step\" data-stage=\"5\"><span class=\"step-num\">Step 5</span>Product</div>\n    <div class=\"progress-step\" data-stage=\"6\"><span class=\"step-num\">Step 6</span>Tier</div>\n    <div class=\"progress-step\" data-stage=\"7\"><span class=\"step-num\">Step 7</span>Color</div>\n    <div class=\"progress-step\" data-stage=\"8\"><span class=\"step-num\">Step 8</span>Add-ons</div>\n    <div class=\"progress-step\" data-stage=\"9\"><span class=\"step-num\">Step 9</span>Discounts</div>\n    <div class=\"progress-step\" data-stage=\"10\"><span class=\"step-num\">Step 10</span>Review</div>\n  </nav>\n\n  <main class=\"stage-wrap\">\n\n    <!-- STAGE 0: HERO / INTRO \u2014 customer-facing landing screen.\n         First thing the visitor sees. Sets expectations (free, quick,\n         no commitment), establishes trust (license + insurance + reviews),\n         and funnels them into Step 1 (lead capture). -->\n    <section class=\"stage visible\" id=\"stage-intro\">\n      <div class=\"cust-hero\">\n        <!-- Resume-from-localStorage banner. Hidden by default; shown\n             by __custMaybeShowResumeBanner() at init time if a recent\n             unsubmitted progress snapshot exists in localStorage. -->\n        <div class=\"cust-resume-banner\" id=\"custResumeBanner\" style=\"display:none;\">\n          <div class=\"cust-resume-banner-ico\">\ud83d\udcdd</div>\n          <div class=\"cust-resume-banner-text\">\n            <strong>Welcome back!</strong>\n            <span id=\"custResumeBannerSub\">Pick up where you left off?</span>\n          </div>\n          <div class=\"cust-resume-banner-actions\">\n            <button type=\"button\" class=\"btn btn-primary\" onclick=\"custResumeContinue()\">Continue \u2192</button>\n            <button type=\"button\" class=\"btn btn-ghost\" onclick=\"custDiscardResume()\">Start fresh</button>\n          </div>\n        </div>\n\n        <div class=\"cust-hero-eyebrow\">FREE ONLINE ESTIMATE</div>\n        <h1 class=\"cust-hero-h1\">See the price to restore your fence, deck, or pergola.</h1>\n        <p class=\"cust-hero-lead\">\n          Walk through your project at your own pace &mdash; fence, deck, pergola, or ceiling &mdash; and see every line item before you commit to anything. No salesman ever calls unless you ask.\n        </p>\n\n        <div class=\"cust-hero-trust\">\n          <!-- Live Google My Business reviews URL \u2014 taps open the\n               leave-a-review (and read-existing-reviews) page directly. -->\n          <a class=\"cust-trust-item\" href=\"https://share.google/gbBUdC5kdhdxGSQIH\" target=\"_blank\" rel=\"noopener\" aria-label=\"Read our Google reviews\">\n            <strong>\u2605 5.0</strong><span>Google rating &middot; read reviews \u2192</span>\n          </a>\n          <div class=\"cust-trust-item\"><strong>Licensed &amp; Insured</strong><span>in South Carolina</span></div>\n        </div>\n\n        <!-- Dedicated EXPERT 3-Step certification banner. Gets its own\n             row so the badge image can be displayed at a meaningful size\n             alongside a 1-sentence explainer. Sits below the compact\n             trust strip without crowding it. -->\n        <div class=\"cust-hero-cert\">\n          <img src=\"https://static.wixstatic.com/media/6616da_0ac3d87b6d2145eb9c2b21d9ab4ae852~mv2.png\"\n               alt=\"EXPERT 3-Step System certified applicator\"\n               class=\"cust-hero-cert-badge\">\n          <div class=\"cust-hero-cert-text\">\n            <strong>EXPERT-Certified Applicator</strong>\n            <span>Trained in the EXPERT 3-Step Staining System &mdash; pro-grade prep paired with manufacturer-warrantied stains built for the Southeast climate.</span>\n          </div>\n        </div>\n\n        <!-- 2x2 benefits grid. Tightened from 5 vertical cards. Removed\n             \"About 5 minutes\" benefit (already in subhead + CTA fine print)\n             and consolidated \"Approve & pay\" + \"From your phone\". -->\n        <div class=\"cust-hero-benefits\">\n          <div class=\"cust-hero-benefit\">\n            <div class=\"cust-hero-benefit-ico\">\ud83d\udcb5</div>\n            <strong>Real prices, line by line.</strong>\n            <p>No hidden fees, no on-site upcharges. The number you see is the number you'd pay.</p>\n          </div>\n          <div class=\"cust-hero-benefit\">\n            <div class=\"cust-hero-benefit-ico\">\ud83d\udee1\ufe0f</div>\n            <strong>Zero pressure, zero spam.</strong>\n            <p>Your estimate is yours to keep. We won't chase you with calls you didn't ask for.</p>\n          </div>\n          <div class=\"cust-hero-benefit\">\n            <div class=\"cust-hero-benefit-ico\">\ud83d\udce6</div>\n            <strong>Bundle &amp; save 10%.</strong>\n            <p>Fence AND deck on the same estimate? Ten percent comes off the total automatically.</p>\n          </div>\n          <div class=\"cust-hero-benefit\">\n            <div class=\"cust-hero-benefit-ico\">\u26a1</div>\n            <strong>Approve from your phone.</strong>\n            <p>Like the price? Place your 25% deposit and lock in your slot in under a minute.</p>\n          </div>\n        </div>\n\n        <!-- (Removed dedicated 'Read what real customers say' navy card \u2014\n             the \u2605 5.0 trust strip card above already links to the same\n             Google reviews URL with a 'read reviews \u2192' affordance.) -->\n\n        <div class=\"cust-hero-cta\">\n          <button class=\"btn btn-primary cust-hero-btn\" onclick=\"goToStage1FromIntro()\">Start My Free Estimate \u2192</button>\n          <div class=\"cust-hero-fine\">Free &middot; About 5 minutes &middot; No account required</div>\n        </div>\n\n        <!-- Honest perk pills below the CTA. Free color consult is\n             already included, same-day quote = no waiting for a\n             salesperson, '2\u20134 wks out' = current scheduling window\n             (update this copy seasonally). -->\n        <div class=\"cust-hero-perks\">\n          <span class=\"cust-hero-perk\"><span class=\"ico\">\ud83c\udfa8</span>Free color consult included</span>\n          <span class=\"cust-hero-perk\"><span class=\"ico\">\u26a1</span>Same-day quote</span>\n          <span class=\"cust-hero-perk\"><span class=\"ico\">\ud83d\udcc5</span>Typically booking 2&ndash;4 weeks out</span>\n        </div>\n\n        <details class=\"cust-hero-faq\">\n          <summary>Frequently asked questions</summary>\n          <div class=\"cust-hero-faq-body\">\n            <div class=\"cust-faq-q\"><strong>Is this estimate binding?</strong>\n              <p>It's an honest estimate based on the information you provide. We always confirm the final price with a free in-person measurement before any work begins. If our in-person look reveals something different (a much larger fence, hidden damage), we tell you BEFORE we start &mdash; never after.</p></div>\n            <div class=\"cust-faq-q\"><strong>How is the price calculated?</strong>\n              <p>The calculator uses the same per-square-foot and per-linear-foot pricing our crews work from in the field. Your number is built from: (1) the wood you're staining, (2) the prep work it needs based on its age and condition, (3) the stain product you choose, and (4) any add-ons you select. There's no &quot;markup math&quot; happening behind the scenes &mdash; every dollar is a line item you can see.</p></div>\n            <div class=\"cust-faq-q\"><strong>How do you compare to DIY or a big-box installer?</strong>\n              <p>Doing it yourself is cheaper on materials (~$200&ndash;$400 of stain for a typical fence) but takes a full weekend or two of labor, and most DIY stains fail within 1&ndash;2 years because the prep step gets skipped. Big-box installers usually sub out to whichever crew is available that month &mdash; quality varies wildly. We're a local, EXPERT-certified crew using manufacturer-warrantied stain. The price reflects pro prep + pro product + a real warranty &mdash; not a race to the bottom.</p></div>\n            <div class=\"cust-faq-q\"><strong>Will you spam me?</strong>\n              <p>No. We use your contact info to send you the estimate and follow up about scheduling. That's it.</p></div>\n            <div class=\"cust-faq-q\"><strong>How long does the work take?</strong>\n              <p>Most fence and deck projects are completed in 1&ndash;3 days. Larger pergolas and multi-project bundles vary. We're typically booking <strong>2&ndash;4 weeks out</strong> &mdash; your deposit holds the next available slot.</p></div>\n            <div class=\"cust-faq-q\"><strong>What if I want to talk to someone before submitting?</strong>\n              <p>Call or text us at <a href=\"tel:+18647682582\"><strong>(864) 768-2582</strong></a> &mdash; we monitor messages 7 days a week. Once you start the estimate, you'll also see a <strong>Need help?</strong> menu at the top of the screen with one-tap call and text buttons.</p></div>\n          </div>\n        </details>\n      </div>\n    </section>\n\n\n    <!-- STAGE 1: CUSTOMER -->\n    <section class=\"stage\" id=\"stage-1\">\n      <div class=\"stage-title\">Step 1 of 10</div>\n      <h1>Let's start with you.</h1>\n      <p class=\"lead\">We'll use your contact info to send you the detailed estimate and to follow up about scheduling. No spam, no sharing, no surprises.</p>\n\n      <div class=\"tip-box\">\n        <span class=\"tip-ico\">\ud83d\udd12</span>\n        <div class=\"tip-body\">\n          <strong>Why we ask</strong>\n          Your information lets us deliver an accurate estimate and reach out to schedule a free in-person measurement. We never share your details with third parties.\n        </div>\n      </div>\n\n      <div class=\"form-grid\">\n        <div class=\"field\"><label>Your Name <span style=\"color:var(--coral);\">*</span></label><input type=\"text\" id=\"custName\" placeholder=\"Jane Smith\" autocomplete=\"name\" required><div class=\"err\">We just need a name to send your estimate to.</div></div>\n        <div class=\"field\">\n          <label>Phone Number <span style=\"color:var(--coral);\">*</span></label>\n          <input type=\"tel\" id=\"custPhone\" placeholder=\"(864) 555-0123\" autocomplete=\"tel\" inputmode=\"tel\" required>\n          <div class=\"hint\">Double-check this \u2014 we'll use it to follow up about scheduling.</div>\n          <div class=\"err\">Hmm \u2014 that number looks short. Mind double-checking?</div>\n        </div>\n        <div class=\"field\">\n          <label>Email <span style=\"color:var(--coral);\">*</span></label>\n          <input type=\"email\" id=\"custEmail\" placeholder=\"you@email.com\" autocomplete=\"email\" inputmode=\"email\" required>\n          <div class=\"hint\">Make sure this is correct \u2014 you'll use this email to view your estimate online later.</div>\n          <div class=\"err\">That email doesn't look right \u2014 typo, maybe?</div>\n        </div>\n        <div class=\"field\"><label>Property Address <span style=\"color:var(--coral);\">*</span></label><input type=\"text\" id=\"custAddress\" placeholder=\"123 Main St, Greenville, SC\" autocomplete=\"street-address\" required><div class=\"err\">We need the project address so we can schedule the in-person measurement.</div></div>\n      </div>\n\n      <!-- Honeypot \u2014 invisible field that bots typically fill. We reject\n           any submission where this is non-empty. Standard anti-spam. -->\n      <div style=\"position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;\" aria-hidden=\"true\">\n        <label>Leave this blank</label>\n        <input type=\"text\" id=\"custWebsiteHoneypot\" name=\"website\" tabindex=\"-1\" autocomplete=\"off\">\n      </div>\n\n      <div style=\"font-size:12px;color:var(--slate);margin-top:14px;text-align:center;\">\n        By continuing you agree to be contacted about your estimate. We don't share your info.\n      </div>\n\n      <div class=\"stage-nav\">\n        <button class=\"btn btn-secondary\" onclick=\"goToIntroFromStage1()\"><span class=\"arr-l\">\u2190</span> Back</button>\n        <button class=\"btn btn-primary\" id=\"stage1Next\" onclick=\"validateAndAdvanceFromStage1()\">Continue to Project Details <span class=\"arr-r\">\u2192</span></button>\n      </div>\n    </section>\n\n    <!-- STAGE 2: PROJECT TYPE -->\n    <section class=\"stage\" id=\"stage-2\">\n      <div class=\"stage-title\">Step 2 of 10</div>\n      <h1>What are we staining?</h1>\n      <p class=\"lead\">Pick the surface type. Each project type has its own measurement and pricing logic \u2014 you can bundle multiple projects at the end for 10% off.</p>\n\n      <div id=\"editingBanner\" style=\"display:none\"></div>\n      <div id=\"addingAnotherBanner\" style=\"display:none;\" class=\"alert info\" role=\"status\">\n        <span class=\"ico\">\u2795</span>\n        <div>\n          <strong>Adding another project to this quote</strong>\n          Pick the surface type for the new project. Changed your mind? Use the button on the right to cancel and return to the review screen.\n        </div>\n        <button class=\"btn-cancel-add\" onclick=\"cancelAddProject()\" type=\"button\">Cancel &amp; return to review</button>\n      </div>\n\n      <div class=\"tip-box\">\n        <span class=\"tip-ico\">\ud83d\udce6</span>\n        <div class=\"tip-body\">\n          <strong>Bundle savings <span class=\"info-btn\" role=\"button\" tabindex=\"0\" data-info=\"bundle_discount\" aria-label=\"More info\">i</span></strong>\n          If you have more than one wood surface that needs staining \u2014 fence + deck, pergola + ceiling, etc. \u2014 you can add multiple projects to a single quote and an automatic <strong>10% bundle discount</strong> applies to the total. Each project is priced individually first, then the bundle discount comes off everything except prep labor.\n        </div>\n      </div>\n\n      <div class=\"card-grid cols-3\" id=\"projectTypeCards\"></div>\n\n      <div class=\"stage-nav\">\n        <button class=\"btn btn-secondary\" onclick=\"prevStage()\"><span class=\"arr-l\">\u2190</span> Back</button>\n        <button class=\"btn btn-primary\" id=\"stage2Next\" onclick=\"nextStage()\" disabled>Next: Measurements <span class=\"arr-r\">\u2192</span></button>\n      </div>\n    </section>\n\n    <!-- STAGE 3: MEASUREMENTS -->\n    <section class=\"stage\" id=\"stage-3\">\n      <div class=\"stage-title\">Step 3 of 10</div>\n      <h1 id=\"measureTitle\">Measurements</h1>\n      <p class=\"lead\">Don't stress about exact numbers \u2014 pace off your fence, eyeball your deck, take a rough guess. We verify everything in person before any work starts.</p>\n\n      <!-- Prominent \"Not sure?\" helper card. Sits ABOVE the inputs so a\n           confused customer sees the escape hatch BEFORE trying to fill\n           in fields. Opens the project-specific measurement tutorial\n           modal (renderMeasureTutorial wires the right content). -->\n      <button type=\"button\" class=\"cust-measure-help-card\" onclick=\"openMeasureTutorial()\" aria-label=\"Open measurement tips\">\n        <span class=\"cust-measure-help-ico\">\ud83e\udd14</span>\n        <span class=\"cust-measure-help-text\">\n          <strong>Not sure how to measure?</strong>\n          <span>Tap for quick tips, photos, and pacing tricks for this project type.</span>\n        </span>\n        <span class=\"cust-measure-help-arr\">\u2192</span>\n      </button>\n\n      <div id=\"measureTip\"></div>\n      <div id=\"measureContainer\"></div>\n\n      <!-- WOOD AGE \u2014 3-option selector. Drives the condition recommendation on Step 4\n           and disables incompatible options (e.g. No Wash on 2+ year wood). -->\n      <div class=\"wood-age-section\">\n        <h3 style=\"font-size:16px;color:var(--navy);margin-bottom:6px;margin-top:24px;\">How old is the wood?</h3>\n        <p style=\"font-size:13px;color:var(--slate);margin-bottom:14px;\">Wood that's been exposed to weather more than 6 months has typically picked up surface greying, mildew, or UV damage. This drives the prep recommendation \u2014 and at 2+ years, a restoration wash is required because no-prep staining will fail. <span class=\"info-btn\" role=\"button\" tabindex=\"0\" data-info=\"six_month_rule\" aria-label=\"Why does this matter?\">i</span></p>\n        <div class=\"wood-age-buttons\" id=\"woodAgeButtons\">\n          <button type=\"button\" class=\"wood-age-btn\" data-wood-age=\"new\">\n            <span class=\"wa-ico\">\ud83c\udf31</span>\n            <span class=\"wa-label\">Brand-new<br><small>Under 6 months</small></span>\n          </button>\n          <button type=\"button\" class=\"wood-age-btn\" data-wood-age=\"weathered\">\n            <span class=\"wa-ico\">\ud83c\udf24\ufe0f</span>\n            <span class=\"wa-label\">Weathered<br><small>6 months \u2013 2 years</small></span>\n          </button>\n          <button type=\"button\" class=\"wood-age-btn\" data-wood-age=\"aged\">\n            <span class=\"wa-ico\">\ud83c\udf42</span>\n            <span class=\"wa-label\">Aged<br><small>2+ years old</small></span>\n          </button>\n        </div>\n      </div>\n\n      <!-- WAS PREVIOUSLY STAINED \u2014 moved from Step 5 so it can inform the condition recommendation -->\n      <div class=\"prev-stain-section\">\n        <h3 style=\"font-size:16px;color:var(--navy);margin-bottom:6px;margin-top:24px;\">Has this wood been stained before?</h3>\n        <p style=\"font-size:13px;color:var(--slate);margin-bottom:14px;\">This helps us recommend the right prep for Step 4 and the most compatible product on Step 5.</p>\n        <div class=\"toggle-row\" data-toggle=\"wasStained\">\n          <span class=\"box\"></span>\n          <span class=\"name\">\ud83e\udeb5 Yes, this wood has had stain applied to it before <span class=\"info-btn\" role=\"button\" tabindex=\"0\" data-info=\"why_prev_stain\" style=\"margin-left:8px;\" aria-label=\"More info\">i</span></span>\n        </div>\n\n        <div class=\"info-panel previous\" id=\"prevStainPanel\" style=\"display:none;\">\n          <h3>\ud83e\uddd0 What was previously used?</h3>\n          <p class=\"panel-hint\">Knowing what was used before helps us pick the right stain to recoat with. Switching stain types (oil \u2194 water) requires a full strip, while staying with the same type usually only needs a soft wash.</p>\n          <div class=\"form-grid\">\n            <div class=\"field\">\n              <label>Type Previously Used</label>\n              <select id=\"prevProductType\">\n                <option value=\"\">\u2014 Select type \u2014</option>\n                <option value=\"water\">Water-Based</option>\n                <option value=\"oil\">Oil-Based</option>\n                <option value=\"unsure\">Unsure</option>\n              </select>\n            </div>\n            <div class=\"field\"><label>Condition of existing finish</label>\n              <select id=\"prevCondition\">\n                <option value=\"\">\u2014 Select \u2014</option>\n                <option value=\"intact\">Intact (faded but not peeling)</option>\n                <option value=\"peeling\">Peeling, flaking, or chipping</option>\n                <option value=\"unsure\">Unsure</option>\n              </select>\n            </div>\n            <div class=\"field\"><label>Brand <span style=\"color:var(--slate);font-weight:500;text-transform:none;letter-spacing:0;\">(if known)</span></label><select id=\"prevBrand\"><option value=\"\">\u2014 Select brand \u2014</option></select></div>\n            <div class=\"field\"><label>Transparency <span style=\"color:var(--slate);font-weight:500;text-transform:none;letter-spacing:0;\">(if known)</span></label><select id=\"prevTransparency\"><option value=\"\">\u2014 Select transparency \u2014</option></select></div>\n            <div class=\"field\"><label>Product Name <span style=\"color:var(--slate);font-weight:500;text-transform:none;letter-spacing:0;\">(if known)</span></label><input type=\"text\" id=\"prevProductName\" placeholder=\"e.g. SuperDeck Semi-Trans\" autocomplete=\"off\"></div>\n            <div class=\"field\"><label>Color / Notes <span style=\"color:var(--slate);font-weight:500;text-transform:none;letter-spacing:0;\">(optional)</span></label><input type=\"text\" id=\"prevColorNotes\" placeholder=\"e.g. Cedar tone, applied 2020\" autocomplete=\"off\"></div>\n          </div>\n        </div>\n      </div>\n\n      <!-- REFERENCE PHOTOS \u2014 entirely optional on the customer build.\n           Framed as a 'speeds up our follow-up' bonus, with a clear\n           Skip path (the Next button below the section IS the skip).\n           Photos attach to the Jobber quote so the rep can see condition\n           before measurement. -->\n      <div class=\"photos-section cust-photos-optional\">\n        <h3 style=\"font-size:16px;color:var(--navy);margin-bottom:6px;margin-top:24px;\">\ud83d\udcf7 Want to share a few photos? <span style=\"color:var(--slate);font-weight:500;font-size:13px;\">(totally optional)</span></h3>\n        <p style=\"font-size:13px;color:var(--slate);margin-bottom:14px;\">\n          Photos help us prep your real-life estimate before we even arrive &mdash; sometimes shaving a day or two off our follow-up. But they're 100% optional. Skip ahead anytime by tapping <strong>Next</strong> below.\n        </p>\n        <input type=\"file\" id=\"photoInput\" accept=\"image/*\" capture=\"environment\" multiple style=\"display:none;\">\n        <div class=\"photo-upload-grid\" id=\"photoUploadGrid\"></div>\n        <button type=\"button\" class=\"btn btn-secondary photo-add-btn\" id=\"photoAddBtn\">\ud83d\udcf7 Add photos (optional)</button>\n        <div style=\"font-size:11.5px;color:var(--slate);margin-top:8px;font-style:italic;\">Up to 8 photos. We'll never share them.</div>\n      </div>\n\n      <div class=\"stage-nav\">\n        <button class=\"btn btn-secondary\" onclick=\"prevStage()\"><span class=\"arr-l\">\u2190</span> Back</button>\n        <button class=\"btn btn-primary\" id=\"stage3Next\" onclick=\"nextStage()\">Next: Condition <span class=\"arr-r\">\u2192</span></button>\n      </div>\n    </section>\n\n    <!-- STAGE 4: CONDITION -->\n    <section class=\"stage\" id=\"stage-4\">\n      <div class=\"stage-title\">Step 4 of 10</div>\n      <h1>What's the wood like right now?</h1>\n      <p class=\"lead\">How weathered or worn your wood is changes how much prep we'll need to do &mdash; and that's the difference between a stain that lasts 2 years vs. 5+.</p>\n\n      <div class=\"tip-box\">\n        <span class=\"tip-ico\">\ud83d\udccb</span>\n        <div class=\"tip-body\">\n          <strong>Why this matters</strong>\n          Skipping prep is the #1 reason stain jobs fail early. Weathered or greyed wood can't bond with new stain until it's been washed clean &mdash; and if there's an old finish on there, that needs to come off too. Spending a little more on prep usually means re-staining in 5+ years instead of 2.\n        </div>\n      </div>\n\n      <!-- Recommendation banner \u2014 explains WHY we recommended this prep\n           level (similar pattern to the product step on Stage 5). -->\n      <div class=\"reco-banner\" id=\"conditionRecoBanner\" style=\"display:none\">\n        <span class=\"reco-ico\">\u2b50</span>\n        <div class=\"reco-content\" id=\"conditionRecoBannerText\"></div>\n      </div>\n\n      <div class=\"card-grid cols-3\" id=\"conditionCards\"></div>\n\n      <div class=\"stage-nav\">\n        <button class=\"btn btn-secondary\" onclick=\"prevStage()\"><span class=\"arr-l\">\u2190</span> Back</button>\n        <button class=\"btn btn-primary\" id=\"stage4Next\" onclick=\"nextStage()\" disabled>Next: Product <span class=\"arr-r\">\u2192</span></button>\n      </div>\n    </section>\n\n    <!-- STAGE 5: PRODUCT + HOA + PREVIOUS STAIN -->\n    <section class=\"stage\" id=\"stage-5\">\n      <div class=\"stage-title\">Step 5 of 10</div>\n      <h1>Pick a stain style.</h1>\n      <p class=\"lead\">Each stain looks and ages a little differently. We'll suggest the best fit based on your wood's condition &mdash; pick our recommendation, or browse the others.</p>\n\n      <div class=\"reco-banner\" id=\"recoBanner\" style=\"display:none\">\n        <span class=\"reco-ico\">\u2b50</span>\n        <div class=\"reco-content\" id=\"recoBannerText\"></div>\n      </div>\n\n      <div class=\"product-choice-grid\" id=\"productChoiceCards\"><!-- rendered by renderProductCards() --></div>\n\n      <!-- \"wasStained\" block moved to Step 3 (Measurements) -->\n\n      <div class=\"info-panel highlighted\" id=\"hoaPanel\" style=\"display:none; margin-top:20px;\">\n        <h3>\ud83c\udfd8\ufe0f HOA-Required Color &amp; Product <span class=\"info-btn\" role=\"button\" tabindex=\"0\" data-info=\"hoa_explained\" aria-label=\"More info\">i</span></h3>\n        <p class=\"panel-hint\">Capture every detail of what the HOA requires so there's no dispute later. Your standard color picker will be skipped \u2014 we'll use exactly what they specify.</p>\n        <div class=\"form-grid\">\n          <div class=\"field\"><label>Brand</label><select id=\"hoaBrand\"><option value=\"\">\u2014 Select brand \u2014</option></select></div>\n          <div class=\"field\"><label>Transparency / Product Type</label><select id=\"hoaTransparency\"><option value=\"\">\u2014 Select transparency \u2014</option></select></div>\n          <div class=\"field\"><label>Specific Product Name</label><input type=\"text\" id=\"hoaProductName\" placeholder=\"e.g. SuperDeck Solid SD7-150\" autocomplete=\"off\"></div>\n          <div class=\"field\"><label>Required Color / Code</label><input type=\"text\" id=\"hoaColor\" placeholder=\"e.g. SW 3001 Shagbark\" autocomplete=\"off\"></div>\n        </div>\n        <div class=\"field\"><label>HOA Documentation Reference <span style=\"color:var(--slate);font-weight:500;text-transform:none;letter-spacing:0;\">(optional)</span></label><textarea id=\"hoaNotes\" placeholder=\"HOA approval doc # or other reference info\"></textarea></div>\n      </div>\n\n      <div class=\"stage-nav\">\n        <button class=\"btn btn-secondary\" onclick=\"prevStage()\"><span class=\"arr-l\">\u2190</span> Back</button>\n        <button class=\"btn btn-primary\" id=\"stage5Next\" onclick=\"nextStage()\" disabled>Next: Tier <span class=\"arr-r\">\u2192</span></button>\n      </div>\n    </section>\n\n    <!-- STAGE 6: TIER -->\n    <section class=\"stage\" id=\"stage-6\">\n      <div class=\"stage-title\">Step 6 of 10</div>\n      <h1>Pick the tier. <span class=\"info-btn\" role=\"button\" tabindex=\"0\" data-info=\"tier_help\" aria-label=\"More info\" style=\"vertical-align:middle;width:22px;height:22px;font-size:13px;\">i</span></h1>\n      <p class=\"lead\"><strong>Performance is what we recommend for almost every homeowner.</strong> Compare the three side-by-side and notice the cost-per-year \u2014 that's where the value of going up a tier really shows.</p>\n\n      <div class=\"alert info\" id=\"productLockIndicator\"><span class=\"ico\">\ud83d\udca1</span><div id=\"productLockText\"></div></div>\n\n      <div class=\"tip-box\">\n        <span class=\"tip-ico\">\ud83d\udcca</span>\n        <div class=\"tip-body\">\n          <strong>How to compare the tiers</strong>\n          Look at the \"yearly cost\" on each card &mdash; that's the total project price spread across how long the stain is expected to last. Going up a tier sometimes costs <em>less per year</em> than going cheap and re-doing the work sooner.\n        </div>\n      </div>\n\n      <!-- Previously-stained context \u2014 only renders when prev stain info is set -->\n      <div id=\"prevStainContext\"></div>\n\n      <div class=\"card-grid cols-3\" id=\"tierCards\"></div>\n\n      <div class=\"stage-nav\">\n        <button class=\"btn btn-secondary\" onclick=\"prevStage()\"><span class=\"arr-l\">\u2190</span> Back</button>\n        <button class=\"btn btn-primary\" id=\"stage6Next\" onclick=\"nextStage()\" disabled>Next: Color <span class=\"arr-r\">\u2192</span></button>\n      </div>\n    </section>\n\n    <!-- STAGE 7: COLOR -->\n    <section class=\"stage\" id=\"stage-7\">\n      <div class=\"stage-title\">Step 7 of 10</div>\n      <h1 id=\"colorTitle\">Pick a color.</h1>\n      <p class=\"lead\" id=\"colorLead\">Tap any swatch to pick it. These are manufacturer reference samples &mdash; how it ends up looking on your wood depends on the species, grain, and age, so we'll confirm with you before we buy stain.</p>\n\n      <div class=\"tip-box\">\n        <span class=\"tip-ico\">\ud83c\udfa8</span>\n        <div class=\"tip-body\">\n          <strong>About these colors</strong>\n          The swatches below are manufacturer reference samples on lighter wood. Final appearance varies with your specific wood species, grain, age, and lighting \u2014 a Cedar swatch can look noticeably different on Pressure-Treated Pine vs. older greyed lumber. We recommend looking at physical paint chips or color cards before locking in if you're between options.\n        </div>\n      </div>\n\n      <div class=\"color-grid\" id=\"colorGrid\"></div>\n\n      <div class=\"stage-nav\">\n        <button class=\"btn btn-secondary\" onclick=\"prevStage()\"><span class=\"arr-l\">\u2190</span> Back</button>\n        <button class=\"btn btn-primary\" id=\"stage7Next\" onclick=\"nextStage()\" disabled>Next: Add-ons <span class=\"arr-r\">\u2192</span></button>\n      </div>\n    </section>\n\n    <!-- STAGE 8: ADD-ONS -->\n    <section class=\"stage\" id=\"stage-8\">\n      <div class=\"stage-title\">Step 8 of 10</div>\n      <h1>Any upgrades or add-ons?</h1>\n      <p class=\"lead\">Pick anything that sounds useful &mdash; or skip them all. The running total at the top of the screen updates instantly as you toggle options on or off, so you always see the impact.</p>\n\n      <div id=\"addonsContainer\"></div>\n\n      <div class=\"stage-nav\">\n        <button class=\"btn btn-secondary\" onclick=\"prevStage()\"><span class=\"arr-l\">\u2190</span> Back</button>\n        <button class=\"btn btn-primary\" onclick=\"nextStage()\">Next: Discounts <span class=\"arr-r\">\u2192</span></button>\n      </div>\n    </section>\n\n    <!-- STAGE 9: DISCOUNTS (NEW) -->\n    <section class=\"stage\" id=\"stage-9\">\n      <div class=\"stage-title\">Step 9 of 10</div>\n      <h1>Discounts &amp; savings.</h1>\n      <p class=\"lead\">Tick any that apply to you &mdash; they combine up to <strong>10% off this project</strong>. Got two or more projects on this quote? The bundle discount kicks in automatically on top.</p>\n\n      <div class=\"tip-box\">\n        <span class=\"tip-ico\">\ud83d\udcb8</span>\n        <div class=\"tip-body\">\n          <strong>How discounts combine</strong>\n          The discounts below combine up to <strong>10% off</strong> this project. A couple are either/or &mdash; pick veteran <em>or</em> teacher (not both), and referral <em>or</em> repeat customer (not both). If you've got 2+ projects on this quote, the <strong>bundle discount</strong> takes another 10% off the total on top.\n        </div>\n      </div>\n\n      <div id=\"discountsContainer\"></div>\n\n      <div class=\"stage-nav\">\n        <button class=\"btn btn-secondary\" onclick=\"prevStage()\"><span class=\"arr-l\">\u2190</span> Back</button>\n        <button class=\"btn btn-primary\" onclick=\"nextStage()\">Next: Review &amp; Quote <span class=\"arr-r\">\u2192</span></button>\n      </div>\n    </section>\n\n    <!-- STAGE 10: REVIEW -->\n    <section class=\"stage\" id=\"stage-10\">\n      <div class=\"stage-title\">Step 10 of 10</div>\n      <h1>Your estimate.</h1>\n      <p class=\"lead\">Here's your detailed estimate. The total below is what your project would cost based on what you've shared. We'll confirm everything during a free in-person measurement before any work begins.</p>\n\n      <div class=\"tip-box\">\n        <span class=\"tip-ico\">\ud83d\udcb5</span>\n        <div class=\"tip-body\">\n          <strong>How to read this</strong>\n          Each project on this estimate is broken out as its own line, with the work scope, tier, color, and any discounts you've earned. Bundle savings (10% off) are automatically applied if you have multiple projects.\n        </div>\n      </div>\n\n      <div id=\"bundleStackBlock\" style=\"display:none\"></div>\n\n      <div class=\"final-grid customer-mode\">\n        <div>\n          <div class=\"final-main\" id=\"breakdownMain\" data-mobile-collapse=\"true\"></div>\n\n          <!-- Customer optional notes \u2014 context they want to share with\n               the team before the in-person visit. Goes into the Jobber\n               request notes verbatim. -->\n          <div class=\"cust-extra-notes\">\n            <label for=\"custMessageField\"><strong>Anything else we should know? (optional)</strong></label>\n            <p class=\"cust-extra-notes-hint\">Gate codes, dogs, preferred days, color preferences, anything that helps us prepare.</p>\n            <textarea id=\"custMessageField\" placeholder=\"Optional &mdash; tell us anything that's helpful\u2026\" rows=\"3\"></textarea>\n          </div>\n\n          <!-- Bundle helper \u2014 customers can add another project to bundle. -->\n          <div class=\"action-bar customer-mode\">\n            <div class=\"left\">\n              <button class=\"btn btn-secondary\" onclick=\"addAnotherProject()\">\uff0b Add another project (10% bundle savings)</button>\n            </div>\n          </div>\n\n          <!-- \"What's included\" callout \u2014 sits between the breakdown and\n               the submit CTA so the customer sees exactly what their\n               total covers before they commit. Avoids the 'is the labor\n               extra?' anxiety. -->\n          <!-- Only list items that don't appear as priced line items above.\n               Prep tier was already chosen on Step 4 and shows in the\n               itemized total, so it isn't a 'bonus inclusion' \u2014 leaving\n               it out here avoids implying the wash is free. -->\n          <div class=\"cust-included\">\n            <div class=\"cust-included-title\">\u2705 Every estimate also includes:</div>\n            <ul class=\"cust-included-list\">\n              <li>Free in-person color consultation</li>\n              <li>Free in-person measurement verification</li>\n              <li>Full job-site cleanup &mdash; we leave it like we found it</li>\n              <li>Manufacturer warranty on the stain product</li>\n            </ul>\n          </div>\n\n          <!-- Primary CTA: send the estimate, transition to AWAITING_RESPONSE,\n               and surface the Jobber Client Hub link on the success screen\n               so the customer can review/approve/pay the deposit without\n               employee intervention. -->\n          <div class=\"cust-submit-block\">\n            <!-- 'What happens next' 3-step preview so the customer knows\n                 exactly what clicking the button kicks off. Lower\n                 commitment framing = higher click rate. -->\n            <div class=\"cust-next-steps\">\n              <div class=\"cust-next-steps-title\">What happens after you tap below</div>\n              <div class=\"cust-next-steps-grid\">\n                <div class=\"cust-next-step\">\n                  <div class=\"cust-next-step-num\">1</div>\n                  <div class=\"cust-next-step-text\"><strong>View your estimate</strong><span>Open your secure Jobber portal &mdash; itemized to the penny.</span></div>\n                </div>\n                <div class=\"cust-next-step\">\n                  <div class=\"cust-next-step-num\">2</div>\n                  <div class=\"cust-next-step-text\"><strong>Approve when ready</strong><span>Place your 25% deposit to lock today's price.</span></div>\n                </div>\n                <div class=\"cust-next-step\">\n                  <div class=\"cust-next-step-num\">3</div>\n                  <div class=\"cust-next-step-text\"><strong>We measure &amp; schedule</strong><span>Free in-person verification, then on the calendar.</span></div>\n                </div>\n              </div>\n            </div>\n\n            <button class=\"btn btn-primary cust-submit-btn\" id=\"custSubmitEstimateBtn\" onclick=\"customerSubmitEstimate()\">\n              See My Detailed Estimate \u2192\n            </button>\n            <div class=\"cust-submit-sub\">No commitment, no payment now &mdash; just opens your itemized estimate so you can review and decide.</div>\n\n            <div class=\"cust-submit-or\">\u2014 or \u2014</div>\n\n            <!-- Secondary CTAs: talk to a human first. tel:/sms: native\n                 links so phones auto-dial / open Messages. Desktop users\n                 see the formatted number in the help-menu copy action. -->\n            <div class=\"cust-secondary-ctas\">\n              <a class=\"btn btn-secondary cust-callback-btn\" href=\"tel:+18647682582\" onclick=\"trackCustHelpAction('call_step10')\">\n                \ud83d\udcde Call Our Team\n              </a>\n              <a class=\"btn btn-secondary cust-callback-btn\" href=\"sms:+18647682582\" onclick=\"trackCustHelpAction('text_step10')\">\n                \ud83d\udcac Message Our Team\n              </a>\n            </div>\n            <div class=\"cust-submit-sub\">Have a question first? Call or text us &mdash; we monitor messages 7 days a week.</div>\n          </div>\n\n          <!-- Status zone \u2014 shown while submit is in flight or if it fails. -->\n          <div id=\"custSubmitStatus\" class=\"cust-submit-status\" style=\"display:none;\"></div>\n        </div>\n        <!-- Edit panel hidden in customer mode (rep-only price tweaking).\n             Kept in DOM since the existing JS targets it; just not styled\n             in customer mode. -->\n        <aside class=\"final-side\" id=\"editPanel\" style=\"display:none;\"></aside>\n      </div>\n    </section>\n\n    <section class=\"stage\" id=\"stage-success\">\n      <div class=\"success-screen\">\n        <div class=\"success-icon\">\u2713</div>\n        <h1 id=\"custSuccessHeading\">Your estimate is ready.</h1>\n        <p class=\"lead\" style=\"margin: 12px auto 20px; max-width: 600px;\" id=\"custSuccessLead\">\n          Tap the button below to view your detailed estimate on your secure Jobber portal. From there you can review every line item \u2014 and approve &amp; place your deposit whenever you're ready. Our team may also reach out about your quote.\n        </p>\n\n        <!-- Primary CTA: open the Jobber Client Hub URL. Visible only when\n             the backend returns one (AWAITING_RESPONSE quotes always do;\n             fallback path if Jobber push fails just hides this block). -->\n        <div id=\"custSuccessPortalBlock\" class=\"cust-success-portal\" style=\"display:none;\">\n          <a href=\"#\" target=\"_blank\" rel=\"noopener\" id=\"custSuccessPortalLink\" class=\"btn btn-primary cust-portal-btn\">\n            \ud83d\udd17 View My Estimate\n          </a>\n          <div class=\"cust-success-portal-sub\">Opens your secure Jobber portal where you can review every line item. When you're ready, approve right from the portal and place your <strong>25% deposit</strong> to lock in your scheduling slot.</div>\n        </div>\n\n        <div class=\"cust-success-box\">\n          <div class=\"cust-success-row\"><strong>Your reference number</strong><span id=\"custSuccessRef\">\u2014</span></div>\n          <div class=\"cust-success-row\"><strong>Estimate total</strong><span id=\"custSuccessTotal\">\u2014</span></div>\n          <div class=\"cust-success-row\"><strong>Deposit required</strong><span id=\"custSuccessDeposit\">\u2014</span></div>\n        </div>\n\n        <div class=\"cust-success-next\">\n          <h3>What happens next</h3>\n          <ol>\n            <li><strong>Review your estimate</strong> using the secure link above. When you're ready, approve and place your deposit right from the portal.</li>\n            <li><strong>Free in-person measurement &amp; color consultation</strong> at a time that works for you. We confirm scope and walk through stain options on-site.</li>\n            <li><strong>We schedule the work</strong> and complete your project on the agreed date.</li>\n          </ol>\n        </div>\n\n        <div style=\"display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top: 20px;\">\n          <a class=\"btn btn-secondary\" href=\"tel:+18647682582\">\ud83d\udcde Call our team</a>\n          <a class=\"btn btn-secondary\" href=\"sms:+18647682582\">\ud83d\udcac Text our team</a>\n          <button class=\"btn btn-secondary\" onclick=\"customerStartOver()\">\uff0b Start another estimate</button>\n        </div>\n\n        <div style=\"margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--line); text-align:center; font-size: 13px; color: var(--slate);\">\n          Questions about your estimate? Text or call us anytime. We monitor messages 7 days a week.\n        </div>\n      </div>\n    </section>\n\n    <!-- READ-ONLY VIEW \u2014 for finished, archived, or trashed quotes opened\n         from the dashboard. Sending locks the quote so concurrent edits\n         can't silently overwrite each other; reps can still duplicate\n         to edit a fresh copy. -->\n  </main>\n</div>\n\n<!-- Hidden stand-ins for elements the underlying JS still references.\n     The customer build doesn't expose side-tracker, dashboard, view\n     stage, settings, or rep notes \u2014 but plenty of DOM lookups (and\n     classList toggles) still happen in legacy code paths, so keeping\n     zero-impact hidden nodes keeps the existing JS from throwing. -->\n<div style=\"display:none !important;\" aria-hidden=\"true\">\n  <textarea id=\"quoteNotesField\"></textarea>\n  <div id=\"sideTracker\"></div>\n  <div id=\"sideTrackerTab\"></div>\n  <div id=\"sideTrackerOverlay\"></div>\n  <div id=\"sideTrackerBody\"></div>\n  <div id=\"sideTrackerCount\"></div>\n  <div id=\"sideTrackerTotal\"></div>\n  <div id=\"stage-dashboard\"></div>\n  <div id=\"stage-view\"></div>\n  <div id=\"viewSummary\"></div>\n  <div id=\"dashContent\"></div>\n  <div id=\"bulkActionBar\"></div>\n  <div id=\"bulkSelectToggle\"><span class=\"ico\"></span><span class=\"lbl\"></span></div>\n  <div id=\"dashStats\"></div>\n  <div id=\"statWeekCount\"></div>\n  <div id=\"statMonthCount\"></div>\n  <div id=\"statWeekTotal\"></div>\n  <div id=\"statMonthTotal\"></div>\n  <div id=\"reqPanel\"></div>\n  <div id=\"reqPanelBody\"></div>\n  <div id=\"reqPanelCount\"></div>\n  <div id=\"reqSearch\"></div>\n  <div id=\"dashSearch\"></div>\n  <div id=\"successJobberBlock\"></div>\n  <div id=\"stageViewLabel\"></div>\n  <div id=\"stageViewTitle\"></div>\n  <div id=\"stageViewLead\"></div>\n  <input id=\"custSearchInput\" />\n  <div id=\"custSearchPicked\"></div>\n  <div id=\"custSearchResults\"></div>\n  <input id=\"jobberNum\" />\n  <input id=\"employeeName\" />\n</div>\n\n<!-- INFO MODAL \u2014 uses native <dialog> so showModal() puts it in the browser's\n     top layer, escaping any containing-block / transform restrictions from\n     Wix's Custom Element wrapper. The ::backdrop pseudo-element handles the\n     overlay automatically. -->\n<dialog class=\"info-dialog\" id=\"infoModalDialog\">\n  <div class=\"info-modal-header\">\n    <h3 id=\"infoModalTitle\">Info</h3>\n    <button class=\"close-x\" onclick=\"closeInfoModal()\" aria-label=\"Close\">\u00d7</button>\n  </div>\n  <div class=\"info-modal-body\" id=\"infoModalBody\"></div>\n</dialog>\n\n<!-- MEASUREMENT TUTORIAL MODAL \u2014 same dialog approach -->\n<dialog class=\"info-dialog measure-dialog\" id=\"measureTutorialDialog\">\n  <div class=\"info-modal-header\">\n    <h3 id=\"measureTutorialTitle\">How to estimate measurements</h3>\n    <button class=\"close-x\" onclick=\"closeMeasureTutorial()\" aria-label=\"Close\">\u00d7</button>\n  </div>\n  <div class=\"info-modal-body\" id=\"measureTutorialBody\"></div>\n  <div style=\"padding: 12px 24px 20px; text-align: right; border-top: 1px solid var(--line);\">\n    <button class=\"btn btn-primary\" onclick=\"closeMeasureTutorial()\" style=\"padding: 10px 20px; font-size: 14px;\">Got it</button>\n  </div>\n</dialog>\n\n<!-- JOBBER INTEGRATION PANEL \u2014 connect / refresh / disconnect from\n     the OAuth-protected Jobber API. Opens via the small \"Jobber\" pill\n     in the header. -->\n<dialog class=\"info-dialog\" id=\"jobberPanelDialog\">\n  <div class=\"info-modal-header\">\n    <h3>Jobber integration</h3>\n    <button class=\"close-x\" onclick=\"closeJobberPanel()\" aria-label=\"Close\">\u00d7</button>\n  </div>\n  <div class=\"info-modal-body\" id=\"jobberPanelBody\">\n    <div id=\"jobberStatusBlock\" style=\"margin-bottom: 16px;\">Loading\u2026</div>\n    <div id=\"jobberActionsBlock\" style=\"display: flex; flex-direction: column; gap: 8px;\"></div>\n    <p style=\"margin-top: 18px; font-size: 12px; color: var(--slate); line-height: 1.5;\">\n      Once connected, sent quotes will push to Jobber automatically as new estimates.\n      The connection refreshes itself \u2014 you only need to use \"Refresh\" if something\n      looks stuck.\n    </p>\n  </div>\n</dialog>\n\n<!-- PROJECT-SWITCH CONFIRMATION \u2014 fires when the rep clicks a different\n     project type on Step 2 after meaningful data has been entered on\n     the current project. Defaults the primary action to \"Add as another\n     project\" so the safe path is one tap away. -->\n<dialog class=\"info-dialog\" id=\"projectSwitchDialog\">\n  <div class=\"info-modal-header\">\n    <h3>Switch project or add another?</h3>\n    <button class=\"close-x\" onclick=\"closeProjectSwitchDialog()\" aria-label=\"Close\">\u00d7</button>\n  </div>\n  <div class=\"info-modal-body\" id=\"projectSwitchBody\"></div>\n  <div class=\"project-switch-actions\">\n    <button class=\"btn btn-secondary\" onclick=\"closeProjectSwitchDialog()\">Cancel</button>\n    <button class=\"btn btn-ghost-danger\" onclick=\"confirmSwitchProject()\">Switch &amp; discard</button>\n    <button class=\"btn btn-primary\" onclick=\"confirmAddAnotherProject()\">\uff0b Add as another project</button>\n  </div>\n</dialog>\n\n<!-- PRICING ADMIN \u2014 edit tier rates, prep rates, bundle %, minimum job,\n     and per-discount rates. Saves to Wix Data (PricingRules collection)\n     and overrides are applied on top of the built-in defaults next\n     time the calc boots (or immediately, via in-memory merge below). -->\n<dialog class=\"info-dialog pricing-admin-dialog\" id=\"pricingAdminDialog\">\n  <div class=\"info-modal-header pa-header\">\n    <h3>\u2699\ufe0f Settings</h3>\n    <button class=\"close-x\" onclick=\"closePricingAdmin()\" aria-label=\"Close\">\u00d7</button>\n  </div>\n  <div class=\"pa-tabs\" id=\"pricingAdminTabs\">\n    <button class=\"pa-tab active\" data-pa-tab=\"tiers\">Tier rates</button>\n    <button class=\"pa-tab\" data-pa-tab=\"prep\">Prep rates</button>\n    <button class=\"pa-tab\" data-pa-tab=\"extras\">Extras</button>\n    <button class=\"pa-tab\" data-pa-tab=\"addons\">Add-ons</button>\n    <button class=\"pa-tab\" data-pa-tab=\"discounts\">Discounts</button>\n    <button class=\"pa-tab\" data-pa-tab=\"diy\">DIY compare</button>\n    <button class=\"pa-tab\" data-pa-tab=\"quote\">Quote rules</button>\n    <button class=\"pa-tab\" data-pa-tab=\"reps\">Reps</button>\n    <button class=\"pa-tab\" data-pa-tab=\"devices\">Devices</button>\n  </div>\n  <div class=\"info-modal-body pa-body\" id=\"pricingAdminBody\">Loading\u2026</div>\n  <div class=\"pa-footer\">\n    <div class=\"pa-meta\" id=\"pricingAdminMeta\">\n      <small style=\"color:var(--slate);\">Pricing values shown are read-only. Edit the <code>PRICING</code> constant in calculator.html and redeploy to change them.</small>\n    </div>\n    <button class=\"btn btn-primary\" onclick=\"closePricingAdmin()\">Close</button>\n  </div>\n</dialog>";

  function initCalculator(__doc, __host) {

/* ============================================================
   WIX BACKEND BRIDGE — HTTP-functions edition
   ============================================================
   The earlier CustomEvent/attribute bridge depended on the Velo $w
   wrapper exposing setAttribute() and on() — that turned out to be
   unreliable across Wix element types. We now fetch backend
   operations directly from /_functions/<method>, which:
     - works in any Wix mode (preview, editor, live)
     - doesn't depend on page-code.js being installed
     - inherits the user's logged-in session via cookies
     - uses standard HTTP, easy to debug in the Network tab

   Required server side:
     backend/http-functions.js  (HTTP endpoints)
     backend/employeeQuotes.jsw (data layer, called by http-functions)
   ============================================================ */
const __sssBridge = (function () {
  let employee = { id: '', email: '' };
  let initStarted = false;

  // Methods that don't take a body — use GET. Everything else POSTs JSON.
  const GET_METHODS = new Set(['whoami']);

  async function callBackend(method, args) {
    try {
      const isGet = GET_METHODS.has(method);
      const headers = isGet ? {} : { 'Content-Type': 'application/json' };
      // Pull the SSS auth token (if any) and attach as Bearer so admin-
      // gated endpoints (pricingRules save/reset, reps, devices) see a
      // signed rep. getAuthToken() is hoisted; returns '' when the rep
      // hasn't signed in yet — endpoints handle that as anonymous.
      try {
        if (typeof getAuthToken === 'function') {
          const tok = getAuthToken();
          if (tok) headers['Authorization'] = 'Bearer ' + tok;
        }
      } catch (e) {}
      const resp = await fetch('/_functions/' + method, {
        method: isGet ? 'GET' : 'POST',
        credentials: 'include',
        headers,
        body: isGet ? undefined : JSON.stringify(args || {})
      });
      if (!resp.ok) {
        // 404 means the backend file isn't deployed yet; 401 = not logged in
        return { ok: false, error: 'http_' + resp.status };
      }
      return await resp.json();
    } catch (e) {
      return { ok: false, error: e.message || 'fetch_failed' };
    }
  }

  // On first call to .ready(), fetch the current employee identity.
  // Cached for the lifetime of the page.
  async function ready() {
    if (initStarted) return employee;
    initStarted = true;
    const res = await callBackend('whoami');
    if (res && res.ok && res.employee) {
      employee = res.employee;
      console.log('[SSS Bridge] connected, employee:', employee.email || '(none)');
    } else {
      console.warn('[SSS Bridge] whoami failed:', res);
    }
    return employee;
  }
  // Kick off init at load so it's ready by the time the dashboard renders.
  ready();

  return {
    call: callBackend,
    ready,
    getEmployee: () => employee,
    // Console smoke test: paste `window.__sssBridgeTest()` in the page console.
    test: async () => {
      console.log('[SSS Bridge] test: calling getStats…');
      const res = await callBackend('getStats', {});
      console.log('[SSS Bridge] test result:', res);
      return res;
    }
  };
})();
// Expose smoke-test handle on window for debugging from the Wix page console.
window.__sssBridgeTest = __sssBridge.test;

// =============================================================
// CUSTOMER BUILD ONLY — gate the inherited rep autosave bridge
// =============================================================
// The customer HTML is forked from the rep build and shares the
// `__sssBridge.call('createQuote' / 'updateQuote' / 'setQuoteStatus' /
// 'getStats' / etc.)` autosave path. When a rep is signed in in the
// SAME BROWSER as the customer page (typical during dev/testing AND
// any case where the rep also browses the public site), the bridge
// calls would happily forward those rep-only writes to the live
// /_functions endpoints — polluting the rep Drafts folder with
// customer-test sessions. Block everything except the explicit
// customer-public allowlist below.
//
// The customer's two actual data paths — submitCustomerEstimate and
// saveCustomerDraft — both use direct fetch(), NOT this bridge, so
// blocking the bridge entirely doesn't affect the public flow. The
// inherited rep callers (autosave, finalize, etc.) just get back a
// { ok: false } and silently move on.
const __CUSTOMER_BRIDGE_ALLOWED = new Set([
  // 'whoami' could go here if we ever want to know whether a rep
  // happens to be signed in too — currently we don't care, so keep
  // the allowlist empty for maximum safety.
]);
(function gateCustomerBridge() {
  try {
    const origCall = __sssBridge.call;
    __sssBridge.call = async function (method, args) {
      if (!__CUSTOMER_BRIDGE_ALLOWED.has(method)) {
        // Silent no-op — the customer build doesn't use the rep
        // bridge for ANYTHING. Anyone calling it is leftover rep-
        // mode code path that we want to keep dormant.
        return { ok: false, error: 'customer_mode' };
      }
      return origCall(method, args);
    };
  } catch (e) { /* defensive — bridge may not exist yet on init */ }
})();

/* ============================================================
   PRICING TABLES
   ============================================================ */
const PRICING = {
  fence: { tiers: { essential: 9.20, performance: 11.20, showcase: 15.20 }, styleMultipliers: { privacy: 1.0, charleston: 1.0, shadowbox: 1.25, bob: 1.25, charleston_bob: 1.25, farm: 0.85 }, oneSidedFactor: 0.65, prep: { no_wash: 0, soft_wash: 2.80, strip_sand: 4.80 }, unit: 'ln ft' },
  // Deck tier rates are now expressed as actual $/sq ft (the FLAT
  // rate at each tier), matching every other project type. Used to be
  // a multiplier (0.8 / 1.0 / 1.3) applied to a separate baseline
  // — which made the settings tab show "1.0" for performance and
  // confused everyone. The component rates (railing/stair/lattice)
  // still scale relative to the baseline flat rate via a derived
  // multiplier inside computeProjectTotal — that math is unchanged.
  deck:  { tiers: { essential: 4.00, performance: 5.00, showcase: 6.50 }, rates: { flat: 5.00, railing: 7.50, stair: 31.25, lattice: 3.75 }, underneathMultiplier: 2, prep: { no_wash: 0, soft_wash: 1.25, strip_sand: 2.85 }, unit: 'sq ft' },
  pergola: { tiers: { essential: 4.40, performance: 5.50, showcase: 7.15 }, overheadAccessFlat: 200, prep: { no_wash: 0, soft_wash: 1.25, strip_sand: 2.85 }, unit: 'sq ft' },
  // Barn tier rates bumped so performance = $4.25/sq ft (same scaling
  // factor as the ceiling bump). Prep rates raised to match deck and
  // pergola — barn prep was previously lighter, but the actual labor
  // is the same.
  barn:    { tiers: { essential: 3.40, performance: 4.25, showcase: 5.55 }, heightPremium: 1.30, liftRentalPerDay: 400, trimRate: 1.50, cupolaFlat: 200, prep: { no_wash: 0, soft_wash: 1.25, strip_sand: 2.85 }, unit: 'sq ft' },
  ceiling: { tiers: { essential: 3.40, performance: 4.25, showcase: 5.55 }, tngPremium: 0.50, beamRate: 8.00, fixtureRemoval: 50, fanRemoval: 100, furnitureProtFlat: 100, prep: { no_wash: 0, soft_wash: 1.25, strip_sand: 2.85 }, unit: 'sq ft' },
  stainUpgrades: [
    { id: 'citronella',  name: 'EXPERT Natural Defense additive', restr: 'Oil only', product: 'oil',
      priceType: 'per_unit',
      // Base rate is per sq ft (deck / pergola / barn / ceiling). Fence
      // is priced per linear foot — same product, different surface
      // density — so it carries a higher per-unit rate. `rateByProject`
      // wins over `rate` when the current project type matches.
      rate: 0.50,
      rateByProject: { fence: 2.00 },
      minCharge: 70,
      img: 'https://stainandsealsupply.com/cdn/shop/files/stain-and-seal-supply-expert-natural-defense-1_1024x.jpg?v=1752858115',
      desc: 'Blend of citronella, cedarwood, cinnamon, geraniol, and lemongrass essential oils. Mixed at the can. Deters carpenter bees, wasps, termites, and 12+ outdoor pests without harming the wood finish. $2.00/ln ft on fences, $0.50/sq ft on decks/pergolas/barns/ceilings, with a $70 minimum.' },
    { id: 'two_tone',    name: 'Two-tone application (boards vs. rails)', priceType: 'percent', rate: 0.40,
      img: 'https://static.wixstatic.com/media/6616da_591f17ae70b64c7995bb55ada0093914~mv2.png',
      desc: 'Different stain color on rails/posts vs. boards. Adds significant labor — masking, separate cure times, and two full application passes. +40% of base price.' },
    { id: 'custom_color',name: 'Custom color match (you provide a sample or code)', priceType: 'flat', rate: 0,
      img: 'https://static.wixstatic.com/media/6616da_a36a623288334b47bcc281830a52fa1f~mv2.jpg',
      desc: 'Bring a paint chip, a photo, or a Sherwin-Williams color code. For water-based stains we use the SW color-match tool directly — no extra step. For oil-based custom colors we work with the nearest EXPERT swatch.' }
  ],
  // "Service add-ons" are now a curated list of complimentary services
  // that are checkmarked-by-default and always free — they're a feel-good
  // confirmation of what's included rather than billable line items.
  serviceAddons: [
    { id: 'touch_up_90', name: '30-day touch-up visit', priceType: 'flat', rate: 0,
      desc: 'If you spot any miss or thin spot in the first 30 days, we come back and touch it up at no charge. Included free on Performance and Showcase tiers.', defaultOn: true },
    { id: 'weather_resched', name: 'Free rescheduling', priceType: 'flat', rate: 0,
      desc: 'Stain needs dry weather to bond properly. If rain rolls in we reschedule at no charge — never an upcharge for the weather.', defaultOn: true },
    { id: 'pdf_quote', name: 'Detailed PDF quote emailed to you', priceType: 'flat', rate: 0,
      desc: 'You leave with a line-by-line PDF of every cost — measurements, tier, prep, add-ons, discounts. Easy to share with a spouse or partner, or pull up later for a referral.', defaultOn: true },
    { id: 'message_support', name: '7-day message support', priceType: 'flat', rate: 0,
      desc: "Direct text-message line to the project lead, available 7 days a week — before, during, and after the job. Questions about cure time, first wash, weather, anything — straight answer, no phone tag.", defaultOn: true }
  ],
  projectAddons: {
    fence: [
      { id: 'wood_caps', name: 'Black wood post caps', priceType: 'each', rate: 15, qtyLabel: 'caps' },
      { id: 'copper_caps', name: 'Copper post caps', priceType: 'each', rate: 15, qtyLabel: 'caps' },
      { id: 'finial_caps', name: 'Decorative caps', priceType: 'each', rate: 45, qtyLabel: 'caps' },
      { id: 'solar_caps', name: 'Solar light fence post caps', priceType: 'each', rate: 25, qtyLabel: 'caps' },
      { id: 'picket_replace', name: 'Picket replacement', priceType: 'each', rate: 25, qtyLabel: 'pickets' },
      { id: 'nail_resecure', name: 'Loose nail / staple re-secure', priceType: 'flat', rate: 0 },
      { id: 'gate_adjust', name: 'Sagging gate adjust / re-hang', priceType: 'each', rate: 100, qtyLabel: 'gates' },
      { id: 'mailbox_match', name: 'Mailbox / trash enclosure match', priceType: 'flat', rate: 150 }
    ],
    deck: [
      { id: 'deck_board_replace', name: 'Damaged deck board replacement', priceType: 'each', rate: 50, qtyLabel: 'boards' },
      { id: 'loose_rescrew', name: 'Loose board re-screw', priceType: 'flat', rate: 0 },
      { id: 'rail_caps', name: 'Railing post cap upgrade', priceType: 'each', rate: 25, qtyLabel: 'caps' },
      { id: 'antislip', name: 'Stair anti-slip strips', priceType: 'flat', rate: 100 },
      { id: 'bench_planter', name: 'Built-in bench / planter staining', priceType: 'each', rate: 100, qtyLabel: 'pieces' },
      { id: 'wood_patch', name: 'Wood patching / filler repair', priceType: 'each', rate: 40, qtyLabel: 'boards' }
    ],
    pergola: [
      { id: 'trim_accent', name: 'Trim / decorative accent staining', priceType: 'per_unit', rate: 2.00 },
      { id: 'beam_two_tone', name: 'Beam two-tone (different stain)', priceType: 'each_lnft', rate: 8.00, qtyLabel: 'beam ln ft' },
      { id: 'loose_hw', name: 'Loose hardware re-secure', priceType: 'flat', rate: 50 },
      { id: 'wood_patch', name: 'Wood patching / filler repair', priceType: 'each', rate: 40, qtyLabel: 'boards' }
    ],
    barn: [
      { id: 'trim_fascia', name: 'Trim / fascia staining', priceType: 'per_unit_trim', rate: 1.50 },
      { id: 'door_stain', name: 'Door staining', priceType: 'each', rate: 200, qtyLabel: 'doors' },
      { id: 'window_trim', name: 'Window trim staining', priceType: 'each', rate: 75, qtyLabel: 'windows' },
      { id: 'cupola', name: 'Cupola staining', priceType: 'flat', rate: 200 },
      { id: 'siding_patch', name: 'Damaged siding patch / replacement', priceType: 'each', rate: 50, qtyLabel: 'boards' },
      { id: 'wood_patch', name: 'Wood patching / filler repair', priceType: 'each', rate: 40, qtyLabel: 'boards' },
      { id: 'two_tone_trim', name: 'Two-tone trim accent', priceType: 'per_unit_trim', rate: 2.00 }
    ],
    ceiling: [
      { id: 'beam_two_tone', name: 'Beam two-tone (different stain)', priceType: 'each_lnft', rate: 8.00, qtyLabel: 'beam ln ft' },
      { id: 'trim_match', name: 'Color match to existing trim', priceType: 'flat', rate: 75 },
      { id: 'sealer_top', name: 'Clear sealer top coat', priceType: 'per_unit', rate: 0.50 },
      { id: 'fixture_remove', name: 'Light fixtures (mask & work around)', priceType: 'each', rate: 50, qtyLabel: 'fixtures' },
      { id: 'fan_remove', name: 'Ceiling fans (mask & work around)', priceType: 'each', rate: 100, qtyLabel: 'fans' },
      { id: 'wood_patch', name: 'Wood patching / filler repair', priceType: 'each', rate: 40, qtyLabel: 'planks' },
      { id: 'plank_replace', name: 'Damaged plank replacement', priceType: 'each', rate: 30, qtyLabel: 'planks' }
    ]
  },
  bundleDiscount: 0.10,
  minimumJob: 500,
  // DIY comparison knobs — all the retail prices and rules-of-thumb
  // that feed the "How does DIY actually compare?" panel on Review.
  // Every value here is editable from Settings → DIY tab, so when
  // EXPERT or Sherwin-Williams adjust their non-contractor pricing
  // the rep can re-tune without a code push.
  diy: {
    // 5-gallon pail retail prices by product + tier. Showcase oil =
    // EXPERT Log & Timber Oil ($450/5gal current). Showcase water =
    // SW Rain Refresh. Non-showcase oil = EXPERT Stain & Seal.
    // Non-showcase water = SW Woodscapes Solid.
    pail: {
      water: { essential: 320, performance: 320, showcase: 385 },
      oil:   { essential: 264, performance: 264, showcase: 450 }
    },
    citronellaPerPail:        100,  // EXPERT Natural Defense additive
    sodiumMetasilicatePerPail: 90,  // 5gal cleaner powder
    oxalicAcidPerPail:         90,  // 5gal brightener powder
    pressureWasherCost:       199,  // homeowner electric, one-time amortized
    sprayerCost:              280,  // Graco-grade homeowner sprayer
    hourlyLaborRate:           25,  // imputed DIY labor $/hr
    // Tooling cost per project type (brushes, rollers, masking, drop
    // cloths, ladder rental as relevant). One-time purchase amortized.
    // Previous values were inflated — a homeowner can outfit a deck
    // project with a couple decent brushes, 1-2 rollers + nap covers,
    // 2 drop cloths and masking for well under $100. These numbers now
    // match what you'd actually walk out of Home Depot with.
    projectTools:        { fence: 40, deck: 110, pergola: 90, barn: 90, ceiling: 85 },
    // Square-feet-per-hour (or lnft-per-hour for fence) divisors for
    // estimating DIY labor time. Higher = faster work. Tuned to a
    // weekend-warrior pace, not a contractor pace.
    projectTimeDivisor:  { fence: 16, deck: 24, pergola: 22, barn: 18, ceiling: 15 }
  }
};

/* ============================================================
   DISCOUNT CATALOG (separated step)
   ============================================================ */
// Discount catalog. `group` enforces mutual-exclusion within a group
// (only one option per group can be selected). The whole stack is capped at
// DISCOUNT_STACK_CAP below to prevent margin erosion.
const DISCOUNTS = [
  { id: 'bundle',         label: 'Bundle (2+ Projects)',          sub: 'Auto-applied when 2+ projects are in this quote. Stacks with everything else below.', rate: 0.10, autoCheck: () => state.bundledProjects.length >= 1 && !!state.activeProject.type, locked: true,
    img: 'https://images.unsplash.com/photo-1649270767492-9deecf622a06?w=400&q=80&auto=format&fit=crop' },
  { id: 'vet_responder',  label: 'Veteran / First Responder',      sub: 'For active military, veterans, police, fire, and EMS. Mutually exclusive with Senior and Teacher — pick one.', rate: 0.05, group: 'service_appreciation',
    img: 'https://images.unsplash.com/photo-1562884328-39da45501a9c?w=400&q=80&auto=format&fit=crop' },
  { id: 'senior',         label: 'Senior (65+)',                   sub: 'For homeowners 65 and over. Mutually exclusive with Veteran/First Responder and Teacher — pick one.', rate: 0.05, group: 'service_appreciation',
    img: 'https://images.unsplash.com/photo-1758686254601-a47850cb2226?w=400&q=80&auto=format&fit=crop' },
  { id: 'teacher_edu',    label: 'Teacher / Education Personnel',  sub: 'For active K–12 teachers, professors, school staff, and education employees. Mutually exclusive with Veteran/First Responder and Senior — pick one.', rate: 0.05, group: 'service_appreciation',
    img: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&q=80&auto=format&fit=crop' },
  { id: 'referral',       label: 'Referral',                      sub: 'You were referred by a previous client. Pick this OR repeat customer — not both.', rate: 0.05, group: 'loyalty',
    img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=80&auto=format&fit=crop' },
  { id: 'repeat',         label: 'Repeat Customer',               sub: "You've had a staining job with us in the last 5 years. Pick this OR referral — not both.", rate: 0.05, group: 'loyalty',
    img: 'https://images.unsplash.com/photo-1555245654-a6ed32522cb0?w=400&q=80&auto=format&fit=crop' },
  { id: 'same_day',       label: 'Book Today',                    sub: 'Book a confirmed date within 24 hours of receiving this quote. Helps us plan crews and rewards quick decisions.', rate: 0.05,
    img: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&q=80&auto=format&fit=crop' }
];

// Maximum total discount that can be applied per project from the stack.
// (Bundle 10% applies separately at the multi-project level.)
const DISCOUNT_STACK_CAP = 0.10;

/* ============================================================
   STAIN BRANDS (for HOA + Previous Stain)
   ============================================================ */
const STAIN_BRANDS = [
  'Sherwin-Williams', 'Behr', 'Cabot', 'Olympic', 'Benjamin Moore (Arborcoat)',
  'EXPERT Stain & Seal', 'TWP (Total Wood Preservative)', 'Ready Seal',
  'Defy', 'Penofin', "Thompson's WaterSeal", 'Wood Defender', 'PPG',
  'Valspar', 'Minwax', 'Other / Unknown'
];
const STAIN_TRANSPARENCIES = [
  'Clear / Sealer (no color)', 'Toner (very light tint)',
  'Semi-Transparent', 'Semi-Solid', 'Solid (opaque)', 'Unsure'
];

/* ============================================================
   COLOR LIBRARIES — REAL IMAGES FROM EXPERT'S WEBSITE
   ============================================================ */
const COLORS = {
  // EXPERT Stain & Seal — Performance oil tier
  // 18 colors (Whiskey not in catalog, Clear excluded as it's Essential tier)
  expert_stain_seal: {
    line: 'EXPERT Stain & Seal',
    note: 'Available in Transparent and Semi-Solid formulations.',
    colors: [
      { name: 'Cedar',      img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-SS-CEDAR-SWATCH.jpg?fit=600' },
      { name: 'Honey',      img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-SS-HONEY-SWATCH.jpg?fit=600' },
      { name: 'Natural',    img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-SS-NATURAL-SWATCH.jpg?fit=600' },
      { name: 'Redwood',    img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-SS-REDWOOD-SWATCH.jpg?fit=600' },
      { name: 'Pecan',      img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/pecan.jpg?fit=600' },
      { name: 'Chestnut',   img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/chestnut.jpg?fit=600' },
      { name: 'Mahogany',   img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/mahogany.jpg?fit=600' },
      { name: 'Sequoia',    img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/sequoia.jpg?fit=600' },
      { name: 'Walnut',     img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/walnut.jpg?fit=600' },
      { name: 'Palomino',   img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-SS-PALOMINO-SWATCH.jpg?fit=600' },
      { name: 'Auburn',     img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-SS-AUBURN-SWATCH.jpg?fit=600' },
      { name: 'Sable',      img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-SS-SABLE-SWATCH.jpg?fit=600' },
      { name: 'Chocolate',  img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-SS-CHOCOLATE-SWATCH.jpg?fit=600' },
      { name: 'Cape Cod',   img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-SS-CAPE-COD-SWATCH.jpg?fit=600' },
      { name: 'Slate Gray', img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-SS-SLATE-SWATCH.jpg?fit=600' },
      { name: 'Eucalyptus', img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-SS-EUCALYPTUS-SWATCH.jpg?fit=600' },
      { name: 'Barnwood',   img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-SS-BARNWOOD-SWATCH.jpg?fit=600' },
      { name: 'Black',      img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-SS-BLACK-SWATCH.jpg?fit=600' }
    ]
  },
  // EXPERT Log & Timber Oil — Showcase oil tier (8 semi-transparent colors)
  expert_log_timber: {
    line: 'EXPERT Log & Timber Oil',
    note: 'Semi-transparent oil — best for log siding, beams, and timber.',
    colors: [
      { name: 'Alpine Seal',   img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-LT-ALPINE-SEAL-SWATCH.jpg?fit=600' },
      { name: 'Whitewash',     img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-LT-WHITE-WASH-SWATCH.jpg?fit=600' },
      { name: 'Rustic Cedar',  img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-LT-RUSTIC-CEDAR-SWATCH.jpg?fit=600' },
      { name: 'Sedona',        img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-LT-SEDONA-SWATCH.jpg?fit=600' },
      { name: 'Bison Brown',   img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-LT-BISON-BROWN-SWATCH.jpg?fit=600' },
      { name: 'Dark Oak',      img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-LT-DARK-OAK-SWATCH.jpg?fit=600' },
      { name: 'Mountain Pine', img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-LT-MOUNTAIN-PINE-SWATCH.jpg?fit=600' },
      { name: 'Charcoal',      img: 'https://i0.wp.com/expertwoodcare.com/wp-content/uploads/2025/02/2024-EXP-LT-CHARCOAL-SWATCH.jpg?fit=600' }
    ]
  },
  // SW Woodscapes — full catalog grouped by color family, sorted light → dark within each
  sw_superdeck_water: {
    line: 'SW Woodscapes (Water-Based)',
    note: 'Full SW Woodscapes Solid color line, organized by color family. Hex values are approximations — show the customer a physical sample for final approval.',
    grouped: true,
    groups: [
      { label: 'Tan & Beige', colors: [
        { name: 'Navajo White',       code: 'SW 3005', hex: '#d8c3a0' },
        { name: 'Summerhouse Beige',  code: 'SW 3004', hex: '#c8a984' },
        { name: 'Sand Castle',        code: 'SW 3006', hex: '#c2a47a' },
        { name: 'Belvedere Tan',      code: 'SW 3002', hex: '#b89572' },
        { name: 'Shagbark',           code: 'SW 3001', hex: '#a98a6c' },
        { name: 'Almond Tree',        code: 'SW 3047', hex: '#a68c64' },
        { name: 'Palomino',           code: 'SW 3046', hex: '#a48458' },
        { name: 'Monterey Tan',       code: 'SW 3049', hex: '#9d8460' },
        { name: 'Pine Cone',          code: 'SW 3046', hex: '#977956' },
        { name: 'Cottonwood',         code: 'SW 3040', hex: '#8d7a5a' },
        { name: 'Leather',            code: 'SW 3068', hex: '#8a6e4e' }
      ]},
      { label: 'Brown & Mahogany', colors: [
        { name: 'Buckthorn',          code: 'SW 3003', hex: '#a07a52' },
        { name: 'Pepperidge',         code: 'SW 3017', hex: '#8a6c50' },
        { name: 'Fawn',               code: 'SW 3065', hex: '#866d4f' },
        { name: 'Sahara',             code: 'SW 3076', hex: '#806848' },
        { name: 'Desert Wood',        code: 'SW 3030', hex: '#7e5d3c' },
        { name: 'Cedar',              code: 'SW 3034', hex: '#7a5538' },
        { name: 'Spicewood',          code: 'SW 3021', hex: '#7a4f37' },
        { name: 'Canyon',             code: 'SW 3062', hex: '#6e4530' },
        { name: 'Cabin Brown',        code: 'SW 3031', hex: '#6a4830' },
        { name: 'Russet Brown',       code: 'SW 3045', hex: '#664229' },
        { name: 'Woodbriar',          code: 'SW 3035', hex: '#6e5238' },
        { name: 'Shagbark Brown',     code: 'SW 3077', hex: '#5e4530' },
        { name: 'Mission Brown',      code: 'SW 3072', hex: '#5a3f2a' },
        { name: 'Lodge Brown',        code: 'SW 3007', hex: '#523a26' },
        { name: 'Yosemite Gold',      code: 'SW 3048', hex: '#b08840' },
        { name: 'Ember',              code: 'SW 3029', hex: '#7c4827' },
        { name: 'Espresso',           code: 'SW 3064', hex: '#3a2a1c' }
      ]},
      { label: 'Red & Burgundy', colors: [
        { name: 'Rock Rose',          code: 'SW 3016', hex: '#a06864' },
        { name: 'Sequoia',            code: 'SW 3015', hex: '#9c5040' },
        { name: 'Brick',              code: 'SW 3061', hex: '#9a4030' },
        { name: 'Cape Cod Red',       code: 'SW 3020', hex: '#8a3a30' },
        { name: 'Ranchero Red',       code: 'SW 3044', hex: '#8a3520' },
        { name: 'Cheyenne Red',       code: 'SW 3043', hex: '#8a3a26' },
        { name: 'Traditional Mahogany',code: 'SW 3080', hex: '#5e2d22' },
        { name: 'Salem Red',          code: 'SW 3018', hex: '#5a2018' }
      ]},
      { label: 'Green & Olive', colors: [
        { name: 'Lichen',             code: 'SW 3069', hex: '#8a8a6a' },
        { name: 'Cypress Moss',       code: 'SW 3041', hex: '#7a7a5a' },
        { name: 'Palmetto',           code: 'SW 3038', hex: '#6e7058' },
        { name: 'Shade Tree',         code: 'SW 3037', hex: '#5e6248' },
        { name: 'Orchard',            code: 'SW 3036', hex: '#525e44' },
        { name: 'Greenbrier',         code: 'SW 3050', hex: '#4a583e' },
        { name: 'Pineneedle',         code: 'SW 3009', hex: '#3e4e36' },
        { name: 'Mallard Green',      code: 'SW 3070', hex: '#384a36' },
        { name: 'Wave Crest',         code: 'SW 3082', hex: '#6a8472' },
        { name: 'Blue Spruce',        code: 'SW 3008', hex: '#465a52' }
      ]},
      { label: 'Blue & Slate', colors: [
        { name: 'Wet Clay',           code: 'SW 3083', hex: '#7e8088' },
        { name: 'Chesapeake',         code: 'SW 3051', hex: '#5a6c72' },
        { name: 'Acadia Blue',        code: 'SW 3011', hex: '#4a5e6a' },
        { name: 'Juniper Blue',       code: 'SW 3014', hex: '#3e5560' },
        { name: 'Shale',              code: 'SW 3078', hex: '#36505c' }
      ]},
      { label: 'Gray & Charcoal', colors: [
        { name: 'River Rock',         code: 'SW 3075', hex: '#a8a098' },
        { name: 'Stone',              code: 'SW 3079', hex: '#9e958a' },
        { name: 'Antique Gray',       code: 'SW 3060', hex: '#9c958c' },
        { name: 'Gray Birch',         code: 'SW 3013', hex: '#928a82' },
        { name: 'Mushroom',           code: 'SW 3074', hex: '#8a8074' },
        { name: 'Driftwood',          code: 'SW 3027', hex: '#867d70' },
        { name: 'Misty Mauve',        code: 'SW 3073', hex: '#8a7a72' },
        { name: 'Mercury',            code: 'SW 3071', hex: '#7c7670' },
        { name: 'Smoke Tree',         code: 'SW 3019', hex: '#7a7268' },
        { name: 'Caribou',            code: 'SW 3025', hex: '#6e6860' },
        { name: 'Woodsmoke Gray',     code: 'SW 3010', hex: '#646058' },
        { name: 'Flagstone',          code: 'SW 3023', hex: '#605a52' },
        { name: 'Hudson Gray',        code: 'SW 3067', hex: '#5a564e' },
        { name: 'King\'s Canyon',     code: 'SW 3026', hex: '#52483e' },
        { name: 'Meadowbrook',        code: 'SW 3012', hex: '#4e4a44' },
        { name: 'Traditional Stone Hedge', code: 'SW 3081', hex: '#4a4640' },
        { name: 'Forest Dew',         code: 'SW 3066', hex: '#42463e' },
        { name: 'Woodland',           code: 'SW 3042', hex: '#3a3e36' },
        { name: 'River Birch',        code: 'SW 3024', hex: '#36322c' },
        { name: 'Charcoal',           code: 'SW 3063', hex: '#2a2a26' },
        { name: 'Black Alder',        code: 'SW 3022', hex: '#1c1814' },
        { name: 'Tobacco',            code: 'SW 3039', hex: '#5a4a3a' }
      ]},
      { label: 'Custom', colors: [
        { name: 'Custom — enter SW code or paint chip', code: '', hex: '#e8e3da', isCustom: true }
      ]}
    ]
  }
};

function getColorLibrary(productType, tier) {
  if (productType === 'hoa') return null; // HOA picks own color in stage 5
  if (productType === 'oil') {
    if (tier === 'essential') return null;
    if (tier === 'performance') return 'expert_stain_seal';
    if (tier === 'showcase') return 'expert_log_timber';
  }
  return 'sw_superdeck_water';
}

// HOA "tier" — only one effective option, priced at Performance rate
const HOA_TIER_META = {
  explain: "HOA-Required Product — your HOA specifies the brand, transparency, and color, so the standard tier choice doesn't apply. Pricing is based on our Performance-tier rate.",
  performance: {
    product: 'HOA-Specified Product',
    tagline: 'Whatever your HOA requires — applied to spec',
    life: 'Depends on the product the HOA specifies',
    details: 'Lifespan and warranty depend on the brand your HOA mandates — we apply per the HOA spec, but the manufacturer warranty terms are whatever that product carries (we don\'t add our own warranty on top of a product we didn\'t pick).',
    pros: ['Exact HOA spec documented in your quote', 'Applied to your HOA\'s required brand, transparency, and color', 'Clear record for compliance'],
    cons: ['Manufacturer warranty depends on the HOA-specified product, not on us'],
    bestFor: 'Homes governed by an HOA with specific color/product mandates'
  }
};

function getTierMeta(productType, tier) {
  if (productType === 'hoa') return HOA_TIER_META[tier] || HOA_TIER_META.performance;
  return TIER_META[productType] && TIER_META[productType][tier];
}

/* ============================================================
   PRODUCT FAMILY METADATA — Stage 5 product cards
   ============================================================ */
const PRODUCT_FAMILY_META = {
  water: {
    icon: '💧',
    heading: 'Water-Based',
    img: 'https://static.wixstatic.com/media/6616da_8c8ed8795f6f4bc2a30ccd57e77d9a22~mv2.jpg',
    summary: 'Fast-drying, low odor, easy water cleanup. SW Woodscapes Solid family. Best when wood was previously stained with water-based.',
    pros: [
      'Unlimited color matching — full SW catalog + any custom paint chip',
      'Fast dry — 1–4 hours between coats',
      'Low odor — safer around pets, kids, and sensitive customers',
      'Soap-and-water cleanup, no solvents',
      'Compatible recoat over previously water-stained wood (no full strip needed)',
      'Better long-term UV color stability (less fade)'
    ],
    cons: [
      'We only recommend SOLID water-based — semi-trans water doesn\'t penetrate well enough to last',
      'Sits on the wood, doesn\'t penetrate as deep as oil',
      'Doesn\'t enhance natural grain — fully covers it',
      'Switching from previously-oil-stained wood requires full strip',
      'Shorter lifespan per coat than oil on horizontal wear surfaces'
    ],
    recommendNote: 'Best when the existing finish is water-based, or when low odor / fast turnaround matters more than maximum longevity.'
  },
  oil: {
    icon: '🛢️',
    heading: 'Oil-Based',
    img: 'https://static.wixstatic.com/media/6616da_5cead61260e74114831ef77b95c9d217~mv2.jpg',
    summary: 'Penetrates deep into wood pores. EXPERT Stain & Seal and Log & Timber Oil. Best for southern climates with intense UV.',
    pros: [
      'Penetrates deep — protects wood from the inside out',
      'Available in transparent, semi-transparent, AND semi-solid (lets grain show through)',
      '2-year manufacturer warranty on semi-trans, 3-year on semi-solid',
      'Eligible for the EXPERT Limited Lifetime guarantee via the 3-Step System',
      'Stronger UV resistance per coat — built for southern sun',
      'Log & Timber Oil adds natural insect deterrence (carpenter bees, termites)',
      'Better for high-exposure decks, pergolas, log siding'
    ],
    cons: [
      '18 EXPERT colors available (vs unlimited for water)',
      '24 hrs between coats — longer total project time',
      'Stronger odor during application',
      'Mineral spirits cleanup, not water',
      'Switching from previously-water-stained wood requires full strip'
    ],
    recommendNote: 'Our default recommendation for most South Carolina jobs — the UV protection and longer lifespan are worth the slightly slower process.'
  },
  hoa: {
    icon: '🏘️',
    heading: 'HOA-Required Product',
    img: 'https://images.unsplash.com/photo-1767286794705-90a999ee905f?w=600&q=80&auto=format&fit=crop',
    summary: 'Your HOA dictates a specific brand, transparency, and color. Tell us what it is and we\'ll capture the exact spec for your records and quote.',
    pros: [
      'Applied to your HOA\'s required brand, transparency, and color',
      'Exact HOA spec documented in your quote and records',
      'No risk of mismatched paperwork or HOA fines later',
      'Clear single source of truth for what was required'
    ],
    cons: [
      'Tier choice is locked — HOA dictates the product',
      'No color picker — your HOA already chose the color',
      'Manufacturer warranty depends on the HOA-specified product'
    ],
    recommendNote: 'Pick this only if your HOA mandates a specific brand or color that\'s outside our standard SW Woodscapes / EXPERT product lines.'
  }
};

/* ============================================================
   TIER METADATA — enhanced value comparison
   ============================================================ */
const TIER_META = {
  water: {
    explain: "Water-based stains dry fast, clean up with water, and have lower odor. Best for fences, decks, and most exterior wood.",
    essential: {
      product: 'SW Woodscapes (1 coat)',
      tagline: 'Budget-friendly basic protection',
      life: '~2 years',
      details: 'A single coat of SW Woodscapes Solid water-based stain. Quick 1-day application, soap-and-water cleanup. Lighter film build than 2-coat Performance, so it weathers faster.',
      pros: ['Lowest up-front cost', 'Quick 1-day application', 'Full solid color coverage', 'Easy water cleanup'],
      cons: ['Will need refreshing within 2 years', 'Less water-bead protection', 'Lighter UV defense'],
      bestFor: 'Rental properties, fences in shade, budget-tight customers'
    },
    performance: {
      product: 'SW Woodscapes (2 coats)',
      tagline: 'Our most-recommended water-based job',
      life: '4–5 years',
      details: 'Two full coats of SW Woodscapes Solid stain. Coverage rate ~150 sq ft per gallon. Includes a free 30-day touch-up visit. Re-coats easily down the road.',
      pros: ['Best value water-based — most popular', 'Even color, no streaks', 'Strong UV fade resistance', '30-day touch-up visit included', 'Full coat depth for proper film thickness'],
      cons: ['Less self-cleaning behavior than Showcase Rain Refresh'],
      bestFor: 'Most homeowners — full-sun decks, privacy fences, family homes'
    },
    showcase: {
      product: 'SW Woodscapes Rain Refresh',
      tagline: 'Self-cleaning solid stain — stays cleaner, longer',
      life: '5–7 years',
      details: 'SW Woodscapes Rain Refresh is a separate SW solid-color exterior stain with Self-Cleaning Technology — rainfall lifts surface dirt off so the finish stays looking new. Carries a 10-year limited manufacturer warranty.',
      pros: ['Self-cleaning surface (SW Self-Cleaning Technology)', '10-year limited manufacturer warranty', '30-day touch-up included', 'Premium feel and look'],
      cons: ['Higher up-front cost', 'Solid color only (no transparency)'],
      bestFor: 'High-humidity climates, premium decks, customers who hate maintenance'
    }
  },
  oil: {
    explain: "Oil-based stains penetrate deep into wood, bring out grain, and last longer in harsh sun. Slower dry, stronger smell.",
    essential: {
      product: 'EXPERT Clear Sealer',
      tagline: "Structural protection without altering the wood's appearance",
      life: '~2 years',
      details: 'EXPERT Clear Sealer — a clear oil-based penetrating sealer. Goes invisible into the wood, no pigment. Lets the wood weather and grey naturally while preventing warping, cupping, and twisting from moisture cycling. Not warranty-eligible by the manufacturer (clear sealants are excluded from EXPERT warranty coverage).',
      pros: ['Allows the wood to grey naturally over time — preserves the weathered look', 'Protects against warping, twisting, cupping, and moisture damage', 'Lowest oil-based cost', 'Highlights natural grain', 'Easy to refresh — no color matching required'],
      cons: ['No pigment, so no UV color protection — the wood will continue to grey', 'No color customization possible', 'Not covered by EXPERT manufacturer warranty'],
      bestFor: 'Cedar, redwood, teak — customers who want the natural look and feel of weathered wood, with the structural integrity intact'
    },
    performance: {
      product: 'EXPERT Stain & Seal',
      tagline: 'Our most-recommended oil job',
      life: '3–4 years',
      details: 'EXPERT Stain & Seal — a deep-penetrating semi-transparent or semi-solid oil-based stain with real pigment for UV protection. EXPERT\'s recoat schedule is every 24 months on horizontal surfaces, every 36 months on vertical. 2-year manufacturer warranty. Coverage ~125–150 sq ft per gallon. Available in 18 colors.',
      pros: ['Best value oil-based — most popular', 'Deep penetration into wood pores', 'Strong UV protection from real pigment', '2-year manufacturer warranty', '30-day touch-up included', '18 color options (transparent + semi-solid)'],
      cons: ['Stronger odor during application', 'Longer dry time (oil)'],
      bestFor: 'Most homeowners with full-sun exposure — decks, fences, pergolas'
    },
    showcase: {
      product: 'EXPERT Log & Timber Oil',
      tagline: 'Premium oil for timber — longest manufacturer-backed warranty in our lineup',
      life: '4–5 years',
      details: 'EXPERT Log & Timber Oil — a semi-transparent premium oil designed for log homes and exposed timbers. Applies in temperatures from 10°F to 110°F. Natural carpenter-bee deterrence. 3-year manufacturer warranty (longest in the EXPERT line). Eligible for the EXPERT Limited Lifetime guarantee via the 3-Step System on qualifying new wood.',
      pros: ['3-year manufacturer warranty', 'Eligible for the EXPERT Limited Lifetime guarantee via 3-Step System', 'Natural insect defense (carpenter bees, wasps)', 'Application range 10°F to 110°F', '30-day touch-up included', 'Best for log siding & exposed timbers'],
      cons: ['Highest up-front cost', 'Semi-transparent only — limited color range (8 colors)'],
      bestFor: 'Log cabins, exposed-beam homes, mountain properties, high-elevation customers'
    }
  }
};

/* ============================================================
   PROJECT META — with image URLs
   ============================================================ */
const PROJECT_META = {
  fence:   { name: 'Fence',          icon: '🪵', unit: 'ln ft', img: 'https://static.wixstatic.com/media/6616da_70b75370c79a48b39d20cdb5c99c5323~mv2.jpg', desc: 'Linear feet × height. Both sides standard. Privacy, shadowbox, board-on-board, farm fence.', badge: 'Most common' },
  deck:    { name: 'Deck',           icon: '🌳', unit: 'sq ft', img: 'https://static.wixstatic.com/media/6616da_3dac2dabdd894c3abcf3491e2b954996~mv2.jpg', desc: 'Flat surface sq ft + railings + stairs. Optional underneath staining and lattice walls.', badge: 'Most common' },
  pergola: { name: 'Pergola',        icon: '⛱️', unit: 'sq ft', img: 'https://static.wixstatic.com/media/6616da_ab2a8aeff2ec435b8f8385c1c0454c91~mv2.jpg', desc: 'Total surface sq ft — top + bottom of beams + posts. Plant tarping included.' },
  ceiling: { name: 'Wooden Ceiling', icon: '🏠', unit: 'sq ft', img: 'https://static.wixstatic.com/media/6616da_36be1e29989c4a349547c1bf70ed16ec~mv2.jpg', desc: 'Porch ceilings, exposed beams, T&G. Easier than exterior — protected from weather.' },
  barn:    { name: 'Barn',           icon: '🏚️', unit: 'sq ft', img: 'https://images.unsplash.com/photo-1625512078789-f89843023df6?w=600&q=80&auto=format&fit=crop', desc: 'Barn siding estimates aren\'t available online yet — call or text us for a custom quote in the meantime.', badge: 'Coming Soon', comingSoon: true }
};

/* ============================================================
   CONDITION META — with image URLs
   ============================================================ */
// Conditions are now SERVICES (what we do), not wood states.
// Headline = service name. Description = when you need it.
const CONDITION_META = {
  no_wash: {
    label: 'No Wash',
    serviceDesc: 'Light cleaning only — no prep premium.',
    whenNeeded: 'Recommended for brand-new wood (recently installed, no UV exposure, no greying or mildew). The surface just needs a light cleaning before stain — no chemical prep required.',
    img: 'https://images.unsplash.com/photo-1593285247650-cd7bb44adcfd?w=600&q=80&auto=format&fit=crop'
  },
  soft_wash: {
    label: 'Soft Wash + Brightener',
    serviceDesc: 'Sodium metasilicate cleaner + oxalic acid brightener.',
    whenNeeded: 'Recommended for wood that is greyed, faded, mildewed, or weathered — and also for re-staining over an existing finish of the same type, as long as that finish is still in good condition (not peeling or chipping). Soft wash removes dead surface fibers and opens the wood pores so new stain bonds properly.',
    img: 'https://images.unsplash.com/photo-1727670340813-9de8913881b2?w=600&q=80&auto=format&fit=crop'
  },
  strip_sand: {
    label: 'Surface preparation (strip or sand)',
    serviceDesc: 'We strip or sand based on the actual condition — not a one-size-fits-all bare-wood treatment.',
    whenNeeded: 'Used when the existing finish needs more than a wash before we recoat. We strip OR sand based on what the wood actually needs: peeling/flaking finishes get stripped, while finishes that are just rough or have raised peaks usually just need sanding to flatten and bond. When you\'re recoating a similar stain in good shape, a thorough sanding is often enough — full stripping isn\'t always necessary.',
    img: 'https://images.unsplash.com/photo-1776346515127-0a6eec4395c2?w=600&q=80&auto=format&fit=crop'
  }
};

/* ============================================================
   STATE
   ============================================================ */
const state = {
  // Customer state — keeps the legacy single-field `name` and
  // `address` (still used by the current Step 1 form) AND adds the
  // structured fields that Jobber's ClientCreateInput / AddressAttributes
  // expect. If only `name` and `address` are filled, the backend
  // splits them automatically on push.
  customer: {
    name: '', phone: '', email: '', address: '',
    firstName: '', lastName: '', companyName: '',
    street1: '', street2: '', city: '', province: '', postalCode: '',
    // Set when the rep picks an existing client from the Step 1 search
    // dropdown — lets findOrCreateClient skip the search/create roundtrip
    // and tie the quote straight to the existing Jobber client + property.
    jobberClientId: '', jobberPropertyId: '',
    jobberNum: '', employee: ''
  },
  currentStage: 1,
  maxStageReached: 1,           // For bidirectional nav — bumps as user advances
  activeProject: makeBlankProject(),
  bundledProjects: [],
  editingBundleIdx: null,
  paymentMethod: 'deposit',
  notes: '',                    // Quote-level free-form notes — shown on Review, sent to Jobber
  quoteId: '',
  cloudRowId: null,             // _id of the cloud row once created — null until first cloud save
  // Jobber request linkage — set when a quote is started from the
  // "Recent Jobber Requests" panel on the dashboard. Survives cloud
  // round-trip and is passed back to Jobber as `attributes.requestId`
  // when the finished quote pushes, so Jobber stitches the quote to
  // the original inbound request automatically.
  jobberRequestId: ''
};

function makeBlankProject() {
  return {
    type: null, measurements: {},
    condition: null, productType: 'oil', tier: 'performance',
    // *Confirmed flags differentiate "user explicitly clicked a card"
    // from "we set the default for them". When false, on arriving at
    // that step we snap the selection to the *recommendation*, not
    // whatever was stamped during a bundled-project copy or stale
    // state. The user clicking any card flips the corresponding flag
    // to true, locking in their choice across re-renders.
    conditionConfirmed: false,
    productConfirmed: false,
    tierConfirmed: false,         // true once user explicitly clicks a tier card (or HOA mode auto-confirms)
    woodAge: null,                // 'new' | 'weathered' | 'aged' — captured on Step 3, gates Step 4 options
    selectedColor: null,
    addons: {}, serviceAddons: {},
    selectedDiscounts: [],        // array of discount IDs — all stack on top of bundle
    customAddons: [],             // employee-added custom line items
    hoa: { brand: '', transparency: '', productName: '', color: '', notes: '' },
    previousStain: { wasStained: false, previousProductType: '', brand: '', transparency: '', productName: '', colorNotes: '' },
    // Reference photos — array of { url, name, size, uploaded? } stamps.
    // Captured on the Measurements step (compact upload widget), stored
    // on the project so they bundle correctly, and attached as Jobber
    // line item images after the quote pushes. URL is the wixstatic.com
    // URL returned by Wix Media Manager once the upload succeeds; while
    // uploading we may temporarily hold a dataURL for the preview.
    referencePhotos: []
  };
}

function makeQuoteId() {
  const d = new Date();
  const stamp = d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
  return `SSS-${stamp}-${Math.floor(Math.random() * 900 + 100)}`;
}
state.quoteId = makeQuoteId();
__doc.getElementById('quoteNum').textContent = state.quoteId;

// CUSTOMER-MODE BOOTSTRAP
// The public-facing build is anonymous (no auth), starts on the hero
// intro stage (not the dashboard), and never touches Jobber connection
// state in the UI. We still wire up the progress bar observer and
// pricing-override fetch so the math is correct from first paint.
(function bootstrapCustomer() {
  // Force the intro hero to be the only visible stage at load. Belt &
  // suspenders for any stale `.visible` class that might have shipped.
  try {
    __doc.querySelectorAll('.stage').forEach(s => s.classList.remove('visible'));
    const intro = __doc.getElementById('stage-intro');
    if (intro) intro.classList.add('visible');
  } catch (e) {}

  // Hide the progress bar until the customer enters the project flow.
  try { refreshProgressBarVisibility(); } catch (e) {}
  try {
    if (typeof MutationObserver !== 'undefined') {
      const stages = __doc.querySelectorAll('.stage');
      if (stages.length) {
        const obs = new MutationObserver(() => {
          try { refreshProgressBarVisibility(); } catch (e) {}
        });
        stages.forEach(s => obs.observe(s, { attributes: true, attributeFilter: ['class'] }));
      }
    }
  } catch (e) {}

  // Pull pricing overrides (read-only — same endpoint the rep build uses).
  // No re-render needed since the customer hasn't entered numbers yet.
  try { applyPricingOverrides(); } catch (e) {}

  // Check localStorage for a recent unsubmitted progress snapshot — if
  // present, show the "pick up where you left off" banner on the hero.
  // Wrapped in try so a storage failure can't break the hero.
  try { __custMaybeShowResumeBanner(); } catch (e) { console.warn('[Customer] resume banner check failed:', e); }
})();

// ============================================================
//  AUTH — login overlay + session state
// ============================================================
// The whole calc is gated behind sign-in. checkAuthAndGate runs once
// at bootstrap and decides what to show:
//   1. No reps exist yet (bootstrap path) → show "Create first admin" form
//   2. Cookie missing/expired → show normal Sign-In form
//   3. Cookie valid → hide the gate, calc is usable
//
// On successful sign-in we stash the rep in `__currentRep`, paint the
// header chip, and never re-render the overlay until the rep signs
// out or their cookie expires.
let __currentRep = null;
let __authBootstrap = false;
// Auth token (deviceId.signature) — stashed in localStorage on
// sign-in and sent as `Authorization: Bearer <token>` on every
// authenticated fetch. Cookie was unreliable in Wix's iframe-embedded
// Custom Element context (third-party cookie restrictions), so we
// hold the token ourselves and send it explicitly.
// `var` (not `const`) — bootstrapDashboard runs above this point in
// source order, and checkAuthAndGate dereferences AUTH_STORAGE_KEY
// immediately. A `const` would be in the temporal dead zone at that
// moment and throw "Cannot access 'AUTH_STORAGE_KEY' before
// initialization" before any of the storage-channel diagnostics run.
var AUTH_STORAGE_KEY = 'sss_auth_token';
// Wix's Custom Element runs inside an iframe whose origin can change
// between page loads (opaque-origin sandboxing in some configs).
// localStorage on those iframes gets wiped per refresh. We fan the
// token out across THREE channels — localStorage, sessionStorage,
// and a non-HttpOnly cookie — so as long as ANY of them survives,
// the rep stays signed in. The backend also reads from a cookie set
// via Set-Cookie OR from the Authorization header. Belt + suspenders
// + duct tape.
function _safeStorageGet(store) {
  try { return store && store.getItem(AUTH_STORAGE_KEY); }
  catch (e) { return null; }
}
function _safeStorageSet(store, value) {
  try {
    if (value) store.setItem(AUTH_STORAGE_KEY, value);
    else store.removeItem(AUTH_STORAGE_KEY);
  } catch (e) { /* sandbox blocked */ }
}
function _readJsCookie(name) {
  try {
    const parts = (document.cookie || '').split(';');
    for (const p of parts) {
      const t = p.trim();
      if (t.indexOf(name + '=') === 0) return decodeURIComponent(t.slice(name.length + 1));
    }
  } catch (e) {}
  return null;
}
function _writeJsCookie(name, value, maxAgeSeconds) {
  try {
    if (value) {
      document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; max-age=' + maxAgeSeconds + '; SameSite=Lax';
    } else {
      document.cookie = name + '=; path=/; max-age=0; SameSite=Lax';
    }
  } catch (e) {}
}
function getAuthToken() {
  return _safeStorageGet(typeof localStorage !== 'undefined' ? localStorage : null)
      || _safeStorageGet(typeof sessionStorage !== 'undefined' ? sessionStorage : null)
      || _readJsCookie(AUTH_STORAGE_KEY)
      || '';
}
function setAuthToken(token) {
  if (typeof localStorage   !== 'undefined') _safeStorageSet(localStorage, token);
  if (typeof sessionStorage !== 'undefined') _safeStorageSet(sessionStorage, token);
  // 7-day non-HttpOnly cookie (we don't lose anything security-wise vs
  // the HttpOnly cookie since JS already needs the token to send it
  // as a Bearer header).
  _writeJsCookie(AUTH_STORAGE_KEY, token, 7 * 24 * 60 * 60);
  // CROSS-FRAME PERSISTENCE: ask the parent Wix page (page-code.js)
  // to save the token in its own storage. The iframe's own
  // localStorage gets wiped on every refresh, but the parent page's
  // wix-storage-frontend.local persists across reloads. The parent's
  // postMessage listener writes/reads on our behalf.
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'sss-storage',
        op: token ? 'set' : 'clear',
        value: token || ''
      }, '*');
    }
  } catch (e) { /* parent unreachable — fine */ }
}

// Async — asks the parent Wix page for the previously-saved token.
// Resolves with the token string, or '' on timeout. Used on
// bootstrap to recover the session after every iframe-wipe refresh.
function loadAuthTokenFromParent() {
  return new Promise((resolve) => {
    if (!window.parent || window.parent === window) { resolve(''); return; }
    const reqId = 'sss-' + Math.random().toString(36).slice(2);
    let done = false;
    const handler = (event) => {
      const m = event && event.data;
      if (!m || m.type !== 'sss-storage-result' || m.requestId !== reqId) return;
      done = true;
      window.removeEventListener('message', handler);
      resolve((m.value || '').toString());
    };
    window.addEventListener('message', handler);
    try {
      window.parent.postMessage({ type: 'sss-storage', op: 'get', requestId: reqId }, '*');
    } catch (e) {
      window.removeEventListener('message', handler);
      resolve('');
      return;
    }
    // Bail if the parent isn't responding (e.g. page-code.js not
    // installed, or running outside Wix). 1.5s is enough for one
    // RTT in normal conditions.
    setTimeout(() => {
      if (done) return;
      window.removeEventListener('message', handler);
      resolve('');
    }, 1500);
  });
}
// Centralized fetch wrapper: adds the Bearer header when a token
// exists. Use this for ALL backend calls so we never accidentally
// skip auth.
async function authFetch(url, opts) {
  opts = opts || {};
  const headers = Object.assign({}, opts.headers || {});
  const token = getAuthToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return fetch(url, Object.assign({}, opts, {
    headers,
    credentials: 'include'   // belt + suspenders so cookie also rides where supported
  }));
}

async function checkAuthAndGate() {
  // None of the iframe-side storage channels survive a page reload
  // (Wix sandboxes the Custom Element iframe with an opaque origin
  // that wipes localStorage / sessionStorage / cookies on every
  // load). Recover the token from the parent Wix page's storage,
  // which IS persistent. If parent returns a token, also write it
  // to local channels so subsequent reads inside this session are
  // synchronous and fast.
  let lsToken = null, ssToken = null, ckToken = null;
  try { lsToken = (typeof localStorage !== 'undefined' && localStorage.getItem(AUTH_STORAGE_KEY)) || null; } catch (e) {}
  try { ssToken = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(AUTH_STORAGE_KEY)) || null; } catch (e) {}
  ckToken = _readJsCookie(AUTH_STORAGE_KEY);
  console.log('[SSS Auth] checkAuthAndGate — local token sources:', {
    localStorage: lsToken ? lsToken.slice(0, 12) + '… (' + lsToken.length + ')' : null,
    sessionStorage: ssToken ? ssToken.slice(0, 12) + '… (' + ssToken.length + ')' : null,
    cookie: ckToken ? ckToken.slice(0, 12) + '… (' + ckToken.length + ')' : null
  });

  // If no local channel has the token, ask the parent page for one.
  if (!lsToken && !ssToken && !ckToken) {
    const parentToken = await loadAuthTokenFromParent();
    if (parentToken) {
      console.log('[SSS Auth] recovered token from parent page (len ' + parentToken.length + ')');
      // Re-populate local channels so authFetch's getAuthToken
      // returns it synchronously on subsequent calls this session.
      try { localStorage.setItem(AUTH_STORAGE_KEY, parentToken); } catch (e) {}
      try { sessionStorage.setItem(AUTH_STORAGE_KEY, parentToken); } catch (e) {}
      _writeJsCookie(AUTH_STORAGE_KEY, parentToken, 7 * 24 * 60 * 60);
    } else {
      console.log('[SSS Auth] parent had no token either — sign-in required');
    }
  }
  console.log('[SSS Auth] resolved token:', getAuthToken() ? 'YES (length ' + getAuthToken().length + ')' : 'NO');

  let status = null;
  try {
    const r = await authFetch('/_functions/authStatus');
    status = await r.json();
    console.log('[SSS Auth] authStatus response:', status);
  } catch (e) {
    console.warn('[SSS Auth] authStatus fetch threw:', e);
    showAuthGate(true, 'auth_unreachable');
    return;
  }
  if (status && status.ok && status.rep) {
    __currentRep = status.rep;
    __authBootstrap = false;
    hideAuthGate();
    paintRepChip();
    return;
  }
  __authBootstrap = !!(status && status.bootstrap);
  showAuthGate(__authBootstrap, null);
}

function showAuthGate(bootstrap, errorCode) {
  const gate = __doc.getElementById('authGate');
  if (!gate) return;
  gate.style.display = 'flex';
  // Toggle the bootstrap-only fields + banner.
  const bsBanner = __doc.getElementById('authBootstrapBanner');
  const bsFields = __doc.getElementById('authBootstrapFields');
  const title    = __doc.getElementById('authTitle');
  const sub      = __doc.getElementById('authSub');
  const submit   = __doc.getElementById('authSubmit');
  const form     = __doc.getElementById('authForm');
  const help     = __doc.getElementById('authHelpLine');
  const status   = __doc.getElementById('authStatusLine');
  if (bootstrap) {
    if (bsBanner) bsBanner.style.display = '';
    if (bsFields) bsFields.style.display = '';
    if (title)    title.textContent = 'Create the first admin';
    if (sub)      sub.textContent = 'No reps exist yet. Pick your initials + a 4–8 digit PIN to bootstrap the system.';
    if (submit)   submit.textContent = 'Create admin & sign in';
  } else {
    if (bsBanner) bsBanner.style.display = 'none';
    if (bsFields) bsFields.style.display = 'none';
    if (title)    title.textContent = 'Sign in';
    if (sub)      sub.textContent = 'Initials + 4-digit PIN. Trusted for 7 days on this device.';
    if (submit)   submit.textContent = 'Sign in';
  }
  // We now know auth IS required — reveal the form + help text. The
  // gate was rendered with form hidden so the initial paint shows a
  // friendly "Loading…" state instead of an empty form.
  if (form)   form.style.display = '';
  if (help)   help.style.display = '';
  if (status) { status.style.display = 'none'; status.className = 'auth-status'; status.innerHTML = ''; }
  if (errorCode) showAuthError(prettyAuthError(errorCode));
  else hideAuthError();
  // Wire the submit handler once. `form` was already declared above
  // when revealing the form's display; reuse it instead of redeclaring.
  if (form && !form._wired) {
    form._wired = true;
    form.addEventListener('submit', onAuthSubmit);
  }
  // Focus the initials field for immediate typing.
  setTimeout(() => {
    const initialsEl = __doc.getElementById('authInitials');
    if (initialsEl) try { initialsEl.focus(); } catch (e) {}
  }, 50);
}

function hideAuthGate() {
  const gate = __doc.getElementById('authGate');
  if (gate) gate.style.display = 'none';
}

// Status feedback on the gate — "Signing in…" with spinner during
// submit, then "✓ Signed in" briefly before hideAuthGate fires.
// Gives the rep a clear "yes it worked" beat instead of the form
// just vanishing.
function showAuthStatusBusy(text) {
  const el = __doc.getElementById('authStatusLine');
  if (!el) return;
  el.className = 'auth-status';
  el.innerHTML = `<span class="spinner"></span><span>${escapeHtml(text || 'Signing in…')}</span>`;
  el.style.display = '';
  hideAuthError();
}
function showAuthStatusSuccess(text) {
  const el = __doc.getElementById('authStatusLine');
  if (!el) return;
  el.className = 'auth-status success';
  el.innerHTML = `<span>✓</span><span>${escapeHtml(text || 'Signed in')}</span>`;
  el.style.display = '';
}
function hideAuthStatus() {
  const el = __doc.getElementById('authStatusLine');
  if (!el) return;
  el.style.display = 'none';
  el.className = 'auth-status';
  el.innerHTML = '';
}

function showAuthError(msg) {
  const el = __doc.getElementById('authError');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}
function hideAuthError() {
  const el = __doc.getElementById('authError');
  if (!el) return;
  el.classList.remove('show');
  el.textContent = '';
}

function prettyAuthError(code) {
  if (!code) return 'Sign-in failed. Try again.';
  if (code === 'invalid_credentials') return 'That PIN doesn\'t match those initials. Try again.';
  if (code === 'locked') return 'Too many failed attempts. Try again in 15 minutes.';
  if (code === 'initials_taken') return 'Those initials are already taken — pick another set.';
  if (code === 'pin_length') return 'PIN must be 4–8 digits.';
  if (code === 'missing_credentials') return 'Initials and PIN are both required.';
  if (code === 'missing_fields') return 'Please fill in all required fields.';
  if (code === 'auth_unreachable') return 'Auth service is unreachable. Check your connection and reload.';
  if (code === 'admin_signin_required_to_add_rep') return 'Reps already exist — please sign in instead.';
  if (code === 'not_signed_in') return 'Session expired or missing. Please sign in.';
  if (code === 'admin_only') return 'Admin access required for this action.';
  if (code === 'device_revoked') return 'This device\'s session was revoked. Sign in again.';
  if (code === 'session_expired') return 'Your session expired. Sign in again.';
  return 'Sign-in failed: ' + code;
}

async function onAuthSubmit(e) {
  e.preventDefault();
  hideAuthError();
  const initials = (__doc.getElementById('authInitials').value || '').trim();
  const pin      = (__doc.getElementById('authPin').value || '').trim();
  if (!initials || !pin) { showAuthError(prettyAuthError('missing_credentials')); return; }

  const submit = __doc.getElementById('authSubmit');
  if (submit) submit.disabled = true;
  showAuthStatusBusy(__authBootstrap ? 'Creating admin account…' : 'Signing in…');

  try {
    if (__authBootstrap) {
      const displayName = (__doc.getElementById('authDisplayName').value || '').trim();
      const email       = (__doc.getElementById('authEmail').value || '').trim();
      const r = await authFetch('/_functions/authCreateRep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initials, displayName, email, pin })
      });
      let data = null;
      try { data = await r.json(); } catch (e) {}
      console.log('[SSS Auth] authCreateRep response:', data);
      // Bootstrap path returns a token in the body — capture it
      // immediately so subsequent fetches are authenticated.
      if (data && data.ok && data.token) setAuthToken(data.token);
      if (!r.ok || !data || !data.ok) {
        hideAuthStatus();
        let extra = '';
        if (data && data._trace) extra = ' · trace: ' + JSON.stringify(data._trace);
        showAuthError(prettyAuthError(data && data.error) + (data && data.error === 'admin_signin_required_to_add_rep' ? ' (Reps already exist — sign in instead.)' : '') + extra);
        if (data && data.error === 'admin_signin_required_to_add_rep') {
          __authBootstrap = false;
          showAuthGate(false, null);
        }
        return;
      }
      // Bootstrap response includes the rep AND sets the auth cookie
      // server-side, so we can drop straight into the calc — no
      // follow-up signIn call needed.
      if (data.rep) {
        __currentRep = data.rep;
        __authBootstrap = false;
        showAuthStatusSuccess('Admin created — welcome ' + (data.rep.displayName || data.rep.initials));
        // Let the success message breathe for a moment before
        // sliding the gate out and revealing the calc.
        await new Promise(r => setTimeout(r, 700));
        hideAuthGate();
        paintRepChip();
        try { if (typeof loadDashboardData === 'function') { dashState.loaded = false; loadDashboardData().then(renderDashboard); } } catch (e) {}
      } else {
        // Fallback (backend didn't auto-sign-in for some reason):
        // call signIn explicitly.
        await doSignIn(initials, pin);
      }
    } else {
      await doSignIn(initials, pin);
    }
  } finally {
    if (submit) submit.disabled = false;
  }
}

// Returns true on success (rep is now signed in), false on failure
// (error already painted into the form).
async function doSignIn(initials, pin) {
  showAuthStatusBusy('Signing in…');
  const r = await authFetch('/_functions/authSignIn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initials, pin })
  });
  let data = null;
  try { data = await r.json(); } catch (e) {}
  if (!r.ok || !data || !data.ok) {
    hideAuthStatus();
    showAuthError(prettyAuthError(data && data.error));
    return false;
  }
  // Stash the bearer token for every subsequent request.
  if (data.token) setAuthToken(data.token);
  __currentRep = data.rep;
  showAuthStatusSuccess('Signed in — welcome ' + (data.rep.displayName || data.rep.initials));
  await new Promise(r => setTimeout(r, 700));
  __authBootstrap = false;
  hideAuthGate();
  paintRepChip();
  // Kick off the dashboard cloud fetch now that auth is settled —
  // any earlier-fired fetch ran without the cookie. Cheap to re-fire.
  try { if (typeof loadDashboardData === 'function') { dashState.loaded = false; loadDashboardData().then(renderDashboard); } } catch (e) {}
  return true;
}

// Header rep chip — small pill in the header that opens a menu with
// "Sign out" and (for admins) a quick link to the Reps admin tab.
function paintRepChip() {
  if (!__currentRep) return;
  const header = __doc.querySelector('.app-header .header-right');
  if (!header) return;
  let chip = __doc.getElementById('repChip');
  if (!chip) {
    chip = document.createElement('button');
    chip.id = 'repChip';
    chip.type = 'button';
    chip.className = 'rep-chip';
    chip.title = 'Account menu — sign out, change PIN, manage reps';
    chip.onclick = (e) => { e.stopPropagation(); toggleRepMenu(e); };
    header.appendChild(chip);
  }
  const inits = (__currentRep.initials || '?').toUpperCase().slice(0, 2);
  const name  = __currentRep.displayName || __currentRep.initials || '';
  // Trailing ▾ caret makes it obvious the chip is a dropdown trigger.
  chip.innerHTML = `<span class="rep-initials">${escapeHtml(inits)}</span><span class="rep-chip-name">${escapeHtml(name)}</span><span style="font-size:10px;opacity:0.6;margin-left:2px;">▾</span>`;
  // Whenever we paint the chip we also know the rep is authenticated,
  // so stamp the rep's displayName into state.customer.employee. That
  // single field feeds buildCloudPayload, the Jobber push, and the
  // PDF — so a single mutation here flows everywhere downstream.
  if (state && state.customer) {
    state.customer.employee = name;
    state.repId   = __currentRep._id;
    state.repName = name;
  }
  // Hide the manual "Quoting Employee" input on Step 1 — the rep is
  // already known and shouldn't be re-typed (which let one rep
  // accidentally credit a quote to another). Reflect their name in
  // a static read-only display instead.
  hideManualEmployeeField();
}

function hideManualEmployeeField() {
  const empInput = __doc.getElementById('employeeName');
  if (!empInput) return;
  const field = empInput.closest('.field');
  if (!field) return;
  // Replace the field's contents with a read-only display so the
  // layout stays consistent (keeps the form grid row count intact).
  field.innerHTML = `
    <label>Quoting Employee</label>
    <div style="padding:12px 14px;background:var(--line-soft);border-radius:8px;font-size:14px;color:var(--navy);font-weight:600;">
      ${escapeHtml(__currentRep && __currentRep.displayName || '—')}
      <span style="font-size:11px;font-weight:500;color:var(--slate);margin-left:6px;">(signed in)</span>
    </div>
  `;
}

let __repMenuEl = null;
function closeRepMenu() {
  if (__repMenuEl && __repMenuEl.parentNode) __repMenuEl.parentNode.removeChild(__repMenuEl);
  __repMenuEl = null;
}
function toggleRepMenu(ev) {
  if (__repMenuEl) { closeRepMenu(); return; }
  const menu = document.createElement('div');
  menu.className = 'rep-chip-menu';
  const isAdmin = __currentRep && __currentRep.role === 'admin';
  const adminBits = isAdmin
    ? '<button onclick="openPricingAdmin();switchPricingAdminTab(\'reps\');closeRepMenu();">👥 Manage reps</button>' +
      '<button onclick="openPricingAdmin();switchPricingAdminTab(\'devices\');closeRepMenu();">📱 Manage devices</button>'
    : '';
  menu.innerHTML = `
    <div class="rep-menu-info">
      <strong>${escapeHtml(__currentRep.displayName || __currentRep.initials)}</strong>
      <div style="font-size:11px;margin-top:2px;color:var(--slate);">${escapeHtml(__currentRep.role || 'rep')} · ${escapeHtml(__currentRep.initials)}</div>
    </div>
    ${adminBits}
    <button onclick="openChangePinPrompt();closeRepMenu();">🔑 Change my PIN</button>
    <button onclick="signOutAndReload();closeRepMenu();">🚪 Sign out</button>
  `;
  const rect = ev.currentTarget.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top  = (rect.bottom + 6) + 'px';
  menu.style.left = Math.max(8, rect.right - 220) + 'px';
  __doc.appendChild(menu);
  __repMenuEl = menu;
  // Close on outside click.
  setTimeout(() => {
    const off = (e) => { if (!__repMenuEl || __repMenuEl.contains(e.target)) return; closeRepMenu(); __doc.removeEventListener('click', off, true); };
    __doc.addEventListener('click', off, true);
  }, 0);
}

async function signOutAndReload() {
  try {
    await authFetch('/_functions/authSignOut', { method: 'POST' });
  } catch (e) { /* fire-and-forget */ }
  // Clear the bearer token everywhere — local channels AND the
  // parent page's storage proxy. setAuthToken('') already does both
  // (writes empty/clear to all three local channels + postMessages
  // clear to the parent), so this single call handles it.
  setAuthToken('');
  __currentRep = null;
  // Drop the chip + show the gate again. A full reload would also
  // work but it's heavier than needed.
  const chip = __doc.getElementById('repChip');
  if (chip && chip.parentNode) chip.parentNode.removeChild(chip);
  showAuthGate(false, null);
}

async function openChangePinPrompt() {
  if (!__currentRep) return;
  const pin = prompt('Enter a new 4–8 digit PIN for your account:');
  if (!pin) return;
  if (!/^\d{4,8}$/.test(pin.trim())) { alert('PIN must be 4–8 digits.'); return; }
  const r = await authFetch('/_functions/authUpdateRepPin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repId: __currentRep._id, pin: pin.trim() })
  });
  const data = await r.json().catch(() => null);
  if (data && data.ok) alert('PIN updated. New PIN takes effect at your next sign-in.');
  else alert('Failed to update PIN: ' + ((data && data.error) || 'unknown error'));
}

// Soft refresh — re-fetches data without reloading the page. Was a
// hard parent reload, but that nuked the auth context too, forcing
// a re-sign-in every time the rep clicked Refresh. Soft refresh
// keeps the rep signed in and just fetches fresh dashboard data.
function refreshDashboardHard() {
  if (typeof loadDashboardData === 'function') {
    dashState.loaded = false;
    loadDashboardData().then(renderDashboard);
  }
}

// Return-to-dashboard helper shared by the success screen and other exit
// paths. Re-fetches the cloud list so newly-finished quotes show up.
function returnToDashboard() {
  __doc.querySelectorAll('.stage').forEach(s => s.classList.remove('visible'));
  __doc.getElementById('stage-dashboard').classList.add('visible');
  if (typeof setSavePill === 'function') setSavePill('hidden');
  refreshProgressBarVisibility();
  // Re-evaluate the "Projects in this quote" bubble bar — it self-hides
  // when the dashboard is visible, but only gets called from
  // updateRunningTotal which the dashboard doesn't trigger. Without
  // this, the bar stays stuck in whatever state the quote left it in.
  try { renderProjectBubbles(); } catch (e) {}
  // Force the header pills to re-evaluate visibility now that the
  // dashboard is up — updateRunningTotal hides the Quote Total / Active
  // Project pills whenever stage-dashboard.visible is true.
  try { updateRunningTotal(); } catch (e) {}
  dashState.loaded = false;
  renderDashboard();
  scrollAppToTop();
}

// Bail out of a brand-new quote on Step 1 without saving anything.
// If the debounced auto-save already created a cloud row from earlier
// keystrokes, move it to Trash (recoverable) rather than leave litter
// in the Drafts folder.
/* ============================================================
   STEP 1 CUSTOMER SEARCH — Jobber type-ahead
   ============================================================
   Lets the rep search existing Jobber clients by name/email/phone
   and one-click auto-fill the customer form. Stores the picked
   client's id + propertyId so findOrCreateClient on push skips the
   search/create roundtrip and uses the existing client directly.
   ============================================================ */
let __custSearchTimer = null;
let __custSearchAbort = 0;        // monotonic counter so out-of-order responses get discarded
const __CUST_SEARCH_DEBOUNCE_MS = 250;

function attachCustomerSearchListeners() {
  const input   = __doc.getElementById('custSearchInput');
  if (!input || input._sssWired) return;
  input._sssWired = true;
  input.addEventListener('input', (e) => onCustSearchInput(e.target.value));
  input.addEventListener('keydown', onCustSearchKeydown);
  // Close the dropdown when clicking anywhere outside the search component
  __doc.addEventListener('click', (e) => {
    const wrap = __doc.querySelector('.cust-search');
    if (!wrap) return;
    if (wrap.contains(e.target)) return;
    closeCustSearchDropdown();
  });
}

function onCustSearchInput(value) {
  clearTimeout(__custSearchTimer);
  const q = (value || '').trim();
  if (q.length < 2) { closeCustSearchDropdown(); return; }
  __custSearchTimer = setTimeout(() => runCustSearch(q), __CUST_SEARCH_DEBOUNCE_MS);
}

async function runCustSearch(q) {
  const seq = ++__custSearchAbort;
  showCustSearchLoading();
  try {
    const r = await fetch('/_functions/searchJobberClients', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, limit: 8 })
    });
    if (seq !== __custSearchAbort) return;  // stale response, newer query in flight
    const data = await r.json();
    if (!data || !data.ok) {
      renderCustSearchResults([], data && data.error);
      return;
    }
    renderCustSearchResults(data.nodes || [], null);
  } catch (e) {
    if (seq !== __custSearchAbort) return;
    renderCustSearchResults([], e.message || 'network_error');
  }
}

function showCustSearchLoading() {
  const box = __doc.getElementById('custSearchResults');
  if (!box) return;
  box.innerHTML = '<div class="cust-search-loading">Searching Jobber…</div>';
  box.style.display = 'block';
}

function renderCustSearchResults(nodes, errMsg) {
  const box = __doc.getElementById('custSearchResults');
  if (!box) return;
  if (errMsg) {
    box.innerHTML = `<div class="cust-search-empty">Search failed: ${escapeHtml(errMsg)}</div>`;
    box.style.display = 'block';
    return;
  }
  if (!nodes.length) {
    box.innerHTML = '<div class="cust-search-empty">No matches in Jobber. Fill the form below to create a new client.</div>';
    box.style.display = 'block';
    return;
  }
  box.innerHTML = nodes.map((c, i) => {
    const display = c.companyName
      ? `${escapeHtml(c.companyName)}${c.firstName || c.lastName ? ` (${escapeHtml((c.firstName + ' ' + c.lastName).trim())})` : ''}`
      : escapeHtml((c.firstName + ' ' + c.lastName).trim() || 'Unnamed client');
    const metaBits = [
      c.email   ? escapeHtml(c.email)   : null,
      c.phone   ? escapeHtml(c.phone)   : null,
      c.street1 ? escapeHtml([c.street1, c.city].filter(Boolean).join(', ')) : null
    ].filter(Boolean);
    const meta = metaBits.join('<span class="sep"> · </span>');
    return `
      <div class="cust-result" data-cust-idx="${i}" onclick="pickCustSearchResult(${i})">
        <div class="cr-name">${display}</div>
        ${meta ? `<div class="cr-meta">${meta}</div>` : ''}
      </div>`;
  }).join('');
  box.style.display = 'block';
  // Stash for the click handler to read
  box._results = nodes;
}

function closeCustSearchDropdown() {
  const box = __doc.getElementById('custSearchResults');
  if (box) { box.style.display = 'none'; box.innerHTML = ''; }
}

function pickCustSearchResult(idx) {
  const box = __doc.getElementById('custSearchResults');
  const c = box && box._results && box._results[idx];
  if (!c) return;

  // Push picked values into state.customer (both structured AND legacy).
  const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ');
  state.customer.firstName    = c.firstName    || '';
  state.customer.lastName     = c.lastName     || '';
  state.customer.companyName  = c.companyName  || '';
  state.customer.name         = c.companyName || fullName || state.customer.name || '';
  state.customer.email        = c.email        || '';
  state.customer.phone        = c.phone        || '';
  state.customer.street1      = c.street1      || '';
  state.customer.street2      = c.street2      || '';
  state.customer.city         = c.city         || '';
  state.customer.province     = c.province     || '';
  state.customer.postalCode   = c.postalCode   || '';
  state.customer.address      = [c.street1, c.city, [c.province, c.postalCode].filter(Boolean).join(' ')]
    .filter(Boolean).join(', ');
  state.customer.jobberClientId   = c.id;
  state.customer.jobberPropertyId = c.propertyId || '';

  // Mirror into the visible form inputs so the rep sees the fill.
  const set = (id, v) => { const el = __doc.getElementById(id); if (el) el.value = v || ''; };
  set('custName',    state.customer.name);
  set('custPhone',   state.customer.phone);
  set('custEmail',   state.customer.email);
  set('custAddress', state.customer.address);

  closeCustSearchDropdown();
  renderCustSearchPicked();
  // Clear the search input so it doesn't keep firing queries
  const input = __doc.getElementById('custSearchInput');
  if (input) input.value = '';
  // Save the pre-fill immediately so a refresh doesn't lose the link to Jobber
  if (typeof scheduleAutoSave === 'function') scheduleAutoSave();
}

function renderCustSearchPicked() {
  const picked = __doc.getElementById('custSearchPicked');
  if (!picked) return;
  if (!state.customer.jobberClientId) {
    picked.style.display = 'none';
    picked.innerHTML = '';
    return;
  }
  const label = state.customer.companyName || [state.customer.firstName, state.customer.lastName].filter(Boolean).join(' ') || 'Picked client';
  picked.innerHTML = `
    <span>✓ Linked to Jobber: <strong>${escapeHtml(label)}</strong></span>
    <button type="button" class="pck-clear" onclick="clearPickedCustomer()">Unlink</button>`;
  picked.style.display = 'flex';
}

function clearPickedCustomer() {
  state.customer.jobberClientId = '';
  state.customer.jobberPropertyId = '';
  renderCustSearchPicked();
  if (typeof scheduleAutoSave === 'function') scheduleAutoSave();
}

function onCustSearchKeydown(e) {
  if (e.key === 'Escape') {
    closeCustSearchDropdown();
    e.target.blur();
  }
}

function cancelNewQuote() {
  const hasAnyInput = !!(state.customer.name || state.customer.phone || state.customer.email || state.customer.address || state.customer.jobberNum);
  if (hasAnyInput && !confirm('Discard this quote? Any info entered will be cleared.')) return;

  // Cancel the pending debounced save so the wiped state doesn't get written.
  if (typeof autoSaveTimer !== 'undefined' && autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }

  // If a cloud row was already minted by an earlier auto-save, soft-delete
  // it so the rep doesn't have to clean up Drafts afterward.
  if (state.cloudRowId && typeof __sssBridge !== 'undefined') {
    __sssBridge.call('setQuoteStatus', { quoteRowId: state.cloudRowId, status: 'trashed' })
      .catch(e => console.warn('[SSS] trash on cancel failed:', e));
  }

  // Remove the matching localStorage draft entry if there is one.
  try {
    const drafts = getDrafts().filter(d => d.quoteId !== state.quoteId);
    setDrafts(drafts);
  } catch (e) { /* non-fatal */ }

  // Reset state to a fresh quote. Keep the employee name — they're
  // probably about to start another one.
  const employee = state.customer.employee || '';
  state.customer = {
    name: '', phone: '', email: '', address: '',
    firstName: '', lastName: '', companyName: '',
    street1: '', street2: '', city: '', province: '', postalCode: '',
    jobberClientId: '', jobberPropertyId: '',
    jobberNum: '', employee
  };
  state.activeProject = makeBlankProject();
  state.bundledProjects = [];
  state.editingBundleIdx = null;
  state.paymentMethod = 'deposit';
  state.notes = '';
  state.quoteId = makeQuoteId();
  state.cloudRowId = null;
  state.maxStageReached = 1;
  // Drop any lingering Jobber-request linkage from the previous quote.
  state.jobberRequestId = '';

  // Wipe form inputs so the next "Start New Quote" doesn't show stale text.
  __doc.querySelectorAll('input').forEach(i => {
    if (i.type !== 'checkbox' && i.type !== 'radio') i.value = '';
  });
  const empField = __doc.getElementById('employeeName');
  if (empField) empField.value = employee;
  const qn = __doc.getElementById('quoteNum');
  if (qn) qn.textContent = state.quoteId;

  returnToDashboard();
}

/* ============================================================
   STAGE LOGIC
   ============================================================ */
function isHoa() { return state.activeProject.productType === 'hoa'; }
function isClearSealer() {
  return state.activeProject.productType === 'oil' && state.activeProject.tier === 'essential';
}
function shouldSkipColorStage() {
  return isClearSealer() || isHoa();
}

// ---- COLOR MEMORY -----------------------------------------------------------
// Colors are tied to a specific library (e.g. expert_stain_seal, sw_superdeck_water,
// expert_log_timber). When the user switches product family or tier, the new
// library may have entirely different colors, so we can't just keep the same
// `selectedColor` — but we CAN remember which color they picked for each library
// and restore it if they switch back.
function rememberCurrentColor() {
  const ap = state.activeProject;
  if (!ap.selectedColor) return;
  const libKey = getColorLibrary(ap.productType, ap.tier);
  if (!libKey) return;
  if (!ap.savedColors) ap.savedColors = {};
  ap.savedColors[libKey] = JSON.parse(JSON.stringify(ap.selectedColor));
}
function restoreColorForCurrentLib() {
  const ap = state.activeProject;
  const libKey = getColorLibrary(ap.productType, ap.tier);
  if (!libKey) { ap.selectedColor = null; return; }
  if (ap.savedColors && ap.savedColors[libKey]) {
    ap.selectedColor = JSON.parse(JSON.stringify(ap.savedColors[libKey]));
  } else {
    ap.selectedColor = null;
  }
}
function recommendedProduct() {
  // Recommendation is driven by what was previously stained (if anything).
  // Stay-with-same-type avoids needing a full strip.
  const ps = state.activeProject.previousStain;
  if (ps.wasStained && ps.previousProductType === 'water') return 'water';
  // Default to oil for new wood, greyed wood, previously oil-stained, or unsure.
  return 'oil';
}

// =============================================================
// CUSTOMER AUTOSAVE — localStorage progress persistence
// =============================================================
// Saves the customer's progress on every stage transition so a refresh,
// accidental tab close, or "I'll come back tomorrow" doesn't lose
// everything they've entered. Restored via a "pick up where you left
// off" banner on the hero. Cleared on successful submission so a
// completed quote doesn't keep prompting them to resume.
const CUST_PROGRESS_KEY = 'sss_cust_progress_v1';
const CUST_PROGRESS_TTL_MS = 14 * 24 * 60 * 60 * 1000;  // 14 days

function __custSaveProgress() {
  try {
    // Don't save if the customer hasn't started yet (no project type
    // selected AND no contact info) — saves a stale blank from being
    // re-loaded if they refreshed the hero.
    const hasProgress = (state.activeProject && state.activeProject.type)
                     || (state.customer && (state.customer.name || state.customer.email));
    if (!hasProgress) return;
    // Also don't save if this quote was already submitted — the
    // already-submitted lock is the authoritative state for completed
    // quotes; don't pollute progress storage with finished work.
    if (typeof __custAlreadySubmittedThisQuote === 'function' && __custAlreadySubmittedThisQuote()) {
      return;
    }
    const snap = {
      v: 1,
      savedAt: Date.now(),
      quoteId:         state.quoteId,
      currentStage:    state.currentStage,
      maxStageReached: state.maxStageReached,
      customer:        state.customer,
      activeProject:   state.activeProject,
      bundledProjects: state.bundledProjects,
      paymentMethod:   state.paymentMethod,
      notes:           state.notes
    };
    localStorage.setItem(CUST_PROGRESS_KEY, JSON.stringify(snap));
  } catch (e) { /* localStorage full or blocked — silent */ }
}

function __custLoadProgress() {
  try {
    const raw = localStorage.getItem(CUST_PROGRESS_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw);
    if (!snap || snap.v !== 1) return null;
    if (!snap.savedAt || (Date.now() - snap.savedAt) > CUST_PROGRESS_TTL_MS) {
      // Stale — silently drop.
      localStorage.removeItem(CUST_PROGRESS_KEY);
      return null;
    }
    return snap;
  } catch (e) { return null; }
}

function __custClearProgress() {
  try { localStorage.removeItem(CUST_PROGRESS_KEY); } catch (e) {}
}

// Replay a saved snapshot back into `state` and jump to the last
// stage they reached. Called from the hero's "Continue" button.
function __custResumeFromSavedProgress() {
  const snap = __custLoadProgress();
  if (!snap) return false;
  try {
    if (snap.quoteId)         state.quoteId         = snap.quoteId;
    if (snap.customer)        state.customer        = { ...state.customer, ...snap.customer };
    if (snap.activeProject)   state.activeProject   = snap.activeProject;
    if (Array.isArray(snap.bundledProjects)) state.bundledProjects = snap.bundledProjects;
    if (snap.paymentMethod)   state.paymentMethod   = snap.paymentMethod;
    if (typeof snap.notes === 'string') state.notes = snap.notes;
    if (snap.maxStageReached) state.maxStageReached = snap.maxStageReached;
    // Repopulate Step 1 inputs from restored state so the customer
    // sees their data still in the form.
    const set = (id, v) => { const el = __doc.getElementById(id); if (el && v) el.value = v; };
    set('custName',    state.customer.name);
    set('custPhone',   state.customer.phone);
    set('custEmail',   state.customer.email);
    set('custAddress', state.customer.address);
    // Show the floating help bar + jump to last reached stage.
    const bar = __doc.getElementById('custFloatingBar');
    if (bar) bar.style.display = 'flex';
    const targetStage = Math.max(1, snap.currentStage || snap.maxStageReached || 1);
    showStage(targetStage);
    if (typeof updateRunningTotal === 'function') updateRunningTotal();
    return true;
  } catch (e) {
    console.warn('[Customer] resume failed:', e);
    __custClearProgress();
    return false;
  }
}

// Called from the hero's "Start fresh" button — clears any saved
// progress and hides the resume banner so the customer starts clean.
function custDiscardResume() {
  __custClearProgress();
  const banner = __doc.getElementById('custResumeBanner');
  if (banner) banner.style.display = 'none';
}
function custResumeContinue() {
  const ok = __custResumeFromSavedProgress();
  if (!ok) {
    const banner = __doc.getElementById('custResumeBanner');
    if (banner) banner.style.display = 'none';
  }
}

// On-load check — if saved progress exists, surface the resume banner
// on the hero. Called from the customer-init flow further down.
function __custMaybeShowResumeBanner() {
  const snap = __custLoadProgress();
  const banner = __doc.getElementById('custResumeBanner');
  if (!banner) return;
  if (!snap) { banner.style.display = 'none'; return; }
  // Skip the prompt if this exact quote was already submitted (the
  // sister localStorage lock covers that case authoritatively).
  if (typeof __custAlreadySubmittedThisQuote === 'function') {
    // Have to temporarily set state.quoteId to compare; do it carefully.
    const prevId = state.quoteId;
    state.quoteId = snap.quoteId;
    const isDone = __custAlreadySubmittedThisQuote();
    state.quoteId = prevId;
    if (isDone) { __custClearProgress(); banner.style.display = 'none'; return; }
  }
  // Populate the banner's subline with a friendly "X days ago at step Y" hint.
  const subEl = __doc.getElementById('custResumeBannerSub');
  if (subEl) {
    const ageMin = Math.max(1, Math.floor((Date.now() - snap.savedAt) / 60000));
    const human = ageMin < 60   ? `${ageMin} min ago`
                : ageMin < 1440 ? `${Math.floor(ageMin/60)} hr ago`
                                : `${Math.floor(ageMin/1440)} day(s) ago`;
    const stageHint = snap.maxStageReached ? ` &middot; Step ${snap.maxStageReached} of 10` : '';
    subEl.innerHTML = `Saved ${human}${stageHint}. Pick up where you left off?`;
  }
  banner.style.display = 'flex';
}

// =============================================================
// CUSTOMER DRAFT POST — server-side lead capture
// =============================================================
// On every stage transition (after Step 1 contact info is captured),
// fire a POST to /_functions/saveCustomerDraft so the rep dashboard
// can see leads who started a quote but haven't finished yet. The
// payload is shaped down to just what the dashboard needs — name,
// email, phone, address, current stage, project type, running total.
// Fire-and-forget: a failure here NEVER blocks the customer's flow.

// Track the last-posted snapshot so we skip redundant POSTs when
// nothing actually changed (same stage + same email = same lead).
let __custLastDraftSig = '';

function __custBuildDraftPayload() {
  return {
    reference: state.quoteId,
    customer: {
      name:      state.customer && state.customer.name      || '',
      email:     state.customer && state.customer.email     || '',
      phone:     state.customer && state.customer.phone     || '',
      address:   state.customer && state.customer.address   || '',
      firstName: state.customer && state.customer.firstName || '',
      lastName:  state.customer && state.customer.lastName  || ''
    },
    activeProject:    { type: (state.activeProject && state.activeProject.type) || '' },
    bundledCount:     Array.isArray(state.bundledProjects) ? state.bundledProjects.length : 0,
    currentStage:     state.currentStage    || 0,
    maxStageReached:  state.maxStageReached || 0,
    runningTotal:     (function () {
      try { return (typeof computeAllTotals === 'function' && computeAllTotals().final) || 0; }
      catch (e) { return 0; }
    })(),
    pageUrl:          (typeof location !== 'undefined' && location.href) || '',
    referrer:         (typeof document !== 'undefined' && document.referrer) || '',
    honeypot:         ''
  };
}

async function __custPostDraft() {
  try {
    // Only post if we have valid contact info (Step 1 must be complete)
    // AND the user hasn't already submitted this quote (we don't want
    // to keep refreshing the draft after a successful submission since
    // the backend deletes it on submit).
    const c = state.customer || {};
    if (!c.email || !c.name || !c.phone) return;
    if (typeof __custAlreadySubmittedThisQuote === 'function' && __custAlreadySubmittedThisQuote()) return;

    const payload = __custBuildDraftPayload();
    // Skip redundant POSTs — only fire when something meaningfully
    // changed (stage progressed, project type changed, or contact info
    // updated). Reduces backend writes by ~50% in typical sessions.
    const sig = [
      payload.reference,
      payload.customer.email,
      payload.customer.phone,
      payload.activeProject.type,
      payload.currentStage,
      payload.maxStageReached
    ].join('|');
    if (sig === __custLastDraftSig) return;
    __custLastDraftSig = sig;

    // Fire and forget — never await this from the calling code path.
    // Network errors get swallowed so a flaky connection doesn't
    // affect the customer's flow. We log honest success/failure to
    // the console so a dev opening DevTools can verify drafts are
    // actually reaching the backend AND succeeding (the backend
    // returns HTTP 200 with {ok:false,error:'...'} on failure, so a
    // 2xx response is NOT proof of success — we have to inspect the
    // body's `ok` field too).
    fetch('/_functions/saveCustomerDraft', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(async (r) => {
      let body = null;
      try { body = await r.json(); } catch (e) { body = null; }
      if (!r.ok) {
        console.warn('[SSS Drafts] saveCustomerDraft returned HTTP ' + r.status + ' — backend may not be deployed yet, OR the CustomerDrafts collection may not exist in Wix. Body:', body);
      } else if (!body || !body.ok) {
        console.warn('[SSS Drafts] saveCustomerDraft returned HTTP 200 but body.ok=false — likely the CustomerDrafts Wix collection does not exist yet. Body:', body);
      } else {
        console.log('[SSS Drafts] draft snapshot saved (' + payload.reference + ', stage ' + payload.currentStage + ')');
      }
    }).catch((e) => {
      console.warn('[SSS Drafts] saveCustomerDraft network error:', e && e.message || e);
    });
  } catch (e) {
    // Defensive — never let draft tracking break the calc.
    console.warn('[Customer] draft POST skipped:', e);
  }
}

function showStage(n) {
  if (n === 7 && shouldSkipColorStage()) state.activeProject.selectedColor = null;

  __doc.querySelectorAll('.stage').forEach(s => s.classList.remove('visible'));
  const target = __doc.getElementById('stage-' + n);
  if (target) target.classList.add('visible');
  state.currentStage = n;
  if (n > state.maxStageReached) state.maxStageReached = n;

  // Persist progress on every stage transition so a refresh / close
  // doesn't lose what they've entered. Stages 1+ only (intro = 0).
  if (n >= 1 && n <= 10) {
    try { __custSaveProgress(); } catch (e) {}
    // Server-side lead capture — fire a snapshot up to the rep
    // dashboard as the customer progresses. Only fires once Step 1
    // contact info exists; skipped after a successful submit.
    if (n >= 2) {
      try { __custPostDraft(); } catch (e) {}
    }
  }

  // Reveal the save pill once a quote is actively in progress.
  if (typeof setSavePill === 'function') {
    if (state.cloudRowId || state.customer.name || state.activeProject.type) {
      setSavePill(__lastSavedAt ? 'saved' : 'saving');
    }
  }

  refreshProgressBar();
  // Scroll the iframe content back to the top so each new step starts from
  // the top of the visible viewport. #scrollContainer is the scrolling
  // ancestor in our fixed-viewport iframe model — body itself doesn't scroll.
  scrollAppToTop();

  if (n === 2) renderProjectTypeCards();
  if (n === 3) renderMeasurements();
  if (n === 4) {
    // Snap to the recommended condition on first arrival. Once the
    // user has explicitly clicked a card, conditionConfirmed locks it
    // in and we leave their choice alone on re-render.
    let condChanged = false;
    if (!state.activeProject.conditionConfirmed) {
      const reco = typeof recommendCondition === 'function' ? recommendCondition() : null;
      if (reco && state.activeProject.condition !== reco) {
        state.activeProject.condition = reco;
        condChanged = true;
      }
    }
    renderConditionCards();
    // Reflect the auto-applied recommendation in the header total
    // immediately — otherwise the rep has to click the same card we
    // already highlighted just to "commit" the same value.
    if (condChanged) try { updateRunningTotal(); } catch (e) {}
  }
  if (n === 5) {
    // Snap to the recommended product on first arrival.
    let prodChanged = false;
    if (!state.activeProject.productConfirmed) {
      const reco = typeof recommendedProduct === 'function' ? recommendedProduct() : null;
      // Don't auto-flip into HOA — that's an explicit opt-in flow.
      if (reco && reco !== 'hoa' && state.activeProject.productType !== reco) {
        state.activeProject.productType = reco;
        prodChanged = true;
      }
    }
    renderProductStage();
    // Product tier multiplier affects tierBase (oil vs water), so the
    // header pill needs a recompute when the recommendation lands.
    if (prodChanged) try { updateRunningTotal(); } catch (e) {}
  }
  if (n === 6) {
    // Smart default — Performance is the recommended tier for nearly all customers.
    // Auto-confirm it on first arrival so the total reflects a real number immediately;
    // user can still click Essential / Showcase to change.
    let tierChanged = false;
    if (!state.activeProject.tierConfirmed && state.activeProject.productType !== 'hoa') {
      if (state.activeProject.tier !== 'performance') state.activeProject.tier = 'performance';
      state.activeProject.tierConfirmed = true;
      tierChanged = true;
    }
    renderTierCards();
    // Without this call the Quote Total pill stays at whatever it was
    // before tier confirmation (often $0). The user's experience: "I
    // landed on the tier step but the price didn't update until I
    // clicked the same Performance card we already highlighted."
    if (tierChanged) try { updateRunningTotal(); } catch (e) {}
  }
  if (n === 1) {
    // Refresh the "Linked to Jobber: ..." badge — visible when a
    // resumed draft was already paired with a Jobber client, or
    // hidden when the rep just unlinked.
    try { renderCustSearchPicked(); } catch (e) {}
  }
  if (n === 7) renderColorStage();
  if (n === 8) renderAddons();
  if (n === 9) renderDiscounts();
  if (n === 10) { state._returnToReviewOnCancel = false; renderFinalBreakdown(); }
}

// Track the last stage we auto-scrolled to. We only re-center the bar when
// the active stage actually changes — otherwise re-renders that happen to
// touch the progress bar would yank the user back to the active step and
// fight any manual swipe-scrolling they were doing.
let _lastAutoScrolledStage = null;

function refreshProgressBar() {
  const n = state.currentStage;
  __doc.querySelectorAll('.progress-step').forEach(el => {
    const stage = parseInt(el.dataset.stage);
    el.classList.remove('active', 'done', 'skipped', 'reachable');
    if (stage === n) el.classList.add('active', 'reachable');
    else if (stage === 7 && shouldSkipColorStage() && stage < state.maxStageReached) el.classList.add('skipped');
    else if (stage <= state.maxStageReached) el.classList.add('done', 'reachable');
  });
  if (n !== _lastAutoScrolledStage) {
    _lastAutoScrolledStage = n;
    scrollProgressToActive();
  }
  refreshProgressBarVisibility();
}

// Show the progress bar only during the actual quote-building flow.
// Hidden on the dashboard, on the read-only view page, and on the
// success/quote-saved page — none of those are part of the 10-step
// progression so the bar is just noise (and on the dashboard, it
// stayed visible after a View-then-Cancel round trip, which was the
// reported bug). The HTML markup starts with inline `display:none`,
// so any path that doesn't reach a stage-1..10 leaves the bar hidden.
// Anyone that transitions stages should call this (refreshProgressBar
// invokes it for the happy path; explicit calls in returnToDashboard
// and the view-quote handler cover the rest).
function refreshProgressBarVisibility() {
  const bar = __doc.getElementById('progress');
  if (!bar) return;
  // The "real" quote-building stages are stage-1..stage-10. Show the
  // bar only when one of those is visible. Anything else (dashboard,
  // stage-view, stage-success, or no stage at all) keeps it hidden.
  let onQuoteStage = false;
  for (let n = 1; n <= 10; n++) {
    const el = __doc.getElementById('stage-' + n);
    if (el && el.classList.contains('visible')) { onQuoteStage = true; break; }
  }
  bar.style.display = onQuoteStage ? 'flex' : 'none';
}

// Smooth-scroll the progress bar so the currently-active step sits centered
// in the visible portion of the bar. On mobile the bar is narrower than the
// full set of 10 steps, so this animation is what lets the user always see
// where they are without manual horizontal scrolling.
function scrollProgressToActive() {
  const bar = __doc.getElementById('progress');
  if (!bar) return;
  const active = bar.querySelector('.progress-step.active');
  if (!active) return;
  // requestAnimationFrame so the browser has applied any layout changes
  // from the class toggle above before we measure offsets.
  requestAnimationFrame(() => {
    const targetLeft = active.offsetLeft - (bar.clientWidth - active.offsetWidth) / 2;
    const clamped = Math.max(0, Math.min(targetLeft, bar.scrollWidth - bar.clientWidth));
    try {
      bar.scrollTo({ left: clamped, behavior: 'smooth' });
    } catch (e) {
      bar.scrollLeft = clamped;
    }
  });
}

function nextStage() {
  console.log('[SSS Stage] nextStage from', state.currentStage);
  const valid = validateStage(state.currentStage);
  console.log('[SSS Stage] validateStage(' + state.currentStage + ') =', valid);
  if (!valid) return;
  let target = state.currentStage + 1;
  if (target === 7 && shouldSkipColorStage()) target = 8;
  if (target > 10) target = 10;
  console.log('[SSS Stage] transitioning to', target);
  showStage(target);
}

function prevStage() {
  let target = state.currentStage - 1;
  if (target === 7 && shouldSkipColorStage()) target = 6;
  if (target < 1) target = 1;
  showStage(target);
}

function focusFirstInvalid() {
  // Find the first .field.invalid in the currently-visible stage and scroll
  // the user to it + focus its input. Without this, the user clicks Next,
  // nothing happens, and the red highlights are below their viewport.
  const firstInvalid = __doc.querySelector('.stage.visible .field.invalid');
  if (!firstInvalid) return;
  try { firstInvalid.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
  const input = firstInvalid.querySelector('input, select, textarea');
  if (input) setTimeout(() => { try { input.focus(); } catch (e) {} }, 250);
}

function validateStage(n) {
  if (n === 1) {
    const c = state.customer;
    let ok = true;
    // Customer fields are required; Quoting Employee is now optional —
    // it's only used as a stamp on saved quotes and can be set later
    // from the dashboard or pulled from the signed-in member. Still
    // capture it if filled in.
    [['custName', 'name'], ['custPhone', 'phone'], ['custEmail', 'email'], ['custAddress', 'address']].forEach(([id, key]) => {
      const el = __doc.getElementById(id);
      const val = el.value.trim();
      const field = el.closest('.field');
      if (!val) { field.classList.add('invalid'); ok = false; }
      else if (key === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) { field.classList.add('invalid'); ok = false; }
      else { field.classList.remove('invalid'); c[key] = val; }
    });
    // Capture the employee field opportunistically (not required).
    const empEl = __doc.getElementById('employeeName');
    if (empEl) {
      const empVal = empEl.value.trim();
      const empField = empEl.closest('.field');
      if (empField) empField.classList.remove('invalid');
      if (empVal) c.employee = empVal;
    }
    state.customer.jobberNum = __doc.getElementById('jobberNum').value.trim();
    if (!ok) focusFirstInvalid();
    return ok;
  }
  if (n === 2) return !!state.activeProject.type;
  if (n === 3) return validateMeasurements();
  if (n === 5) {
    if (!state.activeProject.productType) return false;
    if (isHoa()) {
      if (!state.activeProject.hoa.brand || !state.activeProject.hoa.color) {
        alert('HOA-Required Product needs at least a brand and a color/code. Fill those in or pick a different product family.');
        return false;
      }
    }
    return true;
  }
  if (n === 7) return shouldSkipColorStage() ? true : !!state.activeProject.selectedColor;
  return true;
}

// Scroll the user back to the top of the calculator embed. Since the iframe
// is content-sized (auto-resize), there's no internal scroll — we postMessage
// the parent Velo page, which calls $w('#htmlCalculator').scrollTo() so the
// Wix page scrolls the iframe element into view from its top.
function scrollAppToTop() {
  try { __host.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) {}
}

['custName','custPhone','custEmail','custAddress','employeeName','jobberNum'].forEach(id => {
  __doc.getElementById(id).addEventListener('blur', () => {
    const el = __doc.getElementById(id);
    const field = el.closest('.field');
    if (el.value.trim()) field.classList.remove('invalid');
  });
});

// Bidirectional nav via progress bar
__doc.querySelectorAll('.progress-step').forEach(el => {
  el.addEventListener('click', () => {
    const stage = parseInt(el.dataset.stage);
    if (el.classList.contains('skipped')) return;
    // Reachable if it's an active/done step OR equal to current
    if (stage <= state.maxStageReached) {
      // Validate current stage before jumping forward
      if (stage > state.currentStage && !validateStage(state.currentStage)) return;
      showStage(stage);
    }
  });
});

/* ============================================================
   STAGE 2: PROJECT TYPE — IMAGE CARDS
   ============================================================ */
// Stable per-type sequence numbering for the project bubbles bar.
// Each project gets a _seq integer (1, 2, 3...) for its type the moment a
// type is selected on Step 2, and that number never changes for the life of
// that project — even when the user reorders bundles, switches active, or
// deletes another project. So "Fence #1" always refers to the same fence.
function assignProjectSeqIfNeeded(p) {
  if (!p || !p.type || typeof p._seq === 'number') return;
  let maxSeq = 0;
  const consider = (q) => {
    if (q && q !== p && q.type === p.type && typeof q._seq === 'number' && q._seq > maxSeq) maxSeq = q._seq;
  };
  state.bundledProjects.forEach(consider);
  consider(state.activeProject);
  p._seq = maxSeq + 1;
}

function renderProjectTypeCards() {
  __doc.getElementById('projectTypeCards').innerHTML = Object.entries(PROJECT_META).map(([id, p]) => {
    const isComingSoon = !!p.comingSoon;
    const classes = [
      'selectable-card',
      state.activeProject.type === id ? 'selected' : '',
      isComingSoon ? 'coming-soon' : ''
    ].filter(Boolean).join(' ');
    const badgeClass = isComingSoon ? 'badge coming-soon-badge' : 'badge';
    return `
    <button class="${classes}" data-project="${id}" ${isComingSoon ? 'aria-disabled="true" disabled' : ''}>
      <div class="card-image" style="background-image:url('${p.img}')"></div>
      <div class="card-body">
        <div class="title">${p.icon} ${p.name}</div>
        <div class="desc">${p.desc}</div>
        ${p.badge ? `<div class="${badgeClass}">${p.badge}</div>` : ''}
      </div>
    </button>
  `;
  }).join('');

  __doc.querySelectorAll('#projectTypeCards .selectable-card').forEach(card => {
    card.addEventListener('click', () => {
      // Coming-soon cards are visually disabled and the <button> has the
      // `disabled` attribute, but click handlers still fire on Safari in
      // some cases. Short-circuit defensively.
      if (card.classList.contains('coming-soon')) return;
      const newType = card.dataset.project;
      const ap = state.activeProject;
      const isSwitch = ap.type && ap.type !== newType;
      // If the rep is switching to a different type AFTER already entering
      // meaningful data, intercept with a confirmation that defaults the
      // primary action to "Add as another project" — the safe path.
      if (isSwitch) {
        const hasData = (
          Object.keys(ap.measurements || {}).length > 0 ||
          ap.tierConfirmed ||
          (state.maxStageReached || 0) > 2 ||
          (ap.addons && Object.keys(ap.addons).length > 0)
        );
        if (hasData) {
          openProjectSwitchDialog(newType);
          return;
        }
        // No data — clean switch, fall through to original behavior.
        ap.measurements = {};
        ap.addons = {};
        ap.tierConfirmed = false;
        if (state.maxStageReached > 2) state.maxStageReached = 2;
      }
      applyProjectTypeChoice(newType);
    });
  });
  refreshStage2Selection();
}

// Shared apply-type logic — used by direct selection (no data) and by
// both confirmation paths (Switch & discard, Add another).
function applyProjectTypeChoice(newType) {
  state.activeProject.type = newType;
  if (state.activeProject._lastSeqType && state.activeProject._lastSeqType !== newType) {
    delete state.activeProject._seq;
  }
  state.activeProject._lastSeqType = newType;
  assignProjectSeqIfNeeded(state.activeProject);
  __doc.querySelectorAll('#projectTypeCards .selectable-card').forEach(c =>
    c.classList.toggle('selected', c.dataset.project === newType));
  const next = __doc.getElementById('stage2Next');
  if (next) next.disabled = false;
  updateRunningTotal();
}

// --- Project switch / add confirmation -------------------------

let __pendingProjectSwitch = null;

function openProjectSwitchDialog(newType) {
  __pendingProjectSwitch = newType;
  const body = __doc.getElementById('projectSwitchBody');
  if (body) {
    const ap = state.activeProject;
    const currentLabel = (PROJECT_META[ap.type] && PROJECT_META[ap.type].name) || ap.type;
    const newLabel     = (PROJECT_META[newType] && PROJECT_META[newType].name) || newType;
    body.innerHTML =
      '<p>You\'ve already started a <strong>' + escapeHtml(currentLabel) + '</strong> project on this quote ' +
      '(measurements, tier, add-ons, etc.).</p>' +
      '<p>Did you mean to:</p>' +
      '<ul style="padding-left: 22px; margin: 8px 0 0;">' +
      '<li><strong>Add as another project</strong> — bundle the current ' + escapeHtml(currentLabel) +
      ' and start a fresh ' + escapeHtml(newLabel) + ' alongside (10% bundle discount kicks in at 2+ projects)</li>' +
      '<li><strong>Switch &amp; discard</strong> — throw away the current ' + escapeHtml(currentLabel) +
      ' and replace it with ' + escapeHtml(newLabel) + '. <em>This cannot be undone.</em></li>' +
      '</ul>';
  }
  const dlg = __doc.getElementById('projectSwitchDialog');
  if (dlg && typeof dlg.showModal === 'function' && !dlg.open) dlg.showModal();
}

function closeProjectSwitchDialog() {
  const dlg = __doc.getElementById('projectSwitchDialog');
  if (dlg && dlg.open) dlg.close();
  __pendingProjectSwitch = null;
}

function confirmAddAnotherProject() {
  const newType = __pendingProjectSwitch;
  closeProjectSwitchDialog();
  if (!newType) return;
  // Bundle the current project + start a fresh one of the chosen type.
  addAnotherProject();
  // After addAnotherProject: state.activeProject is now blank. Apply the
  // newly chosen type so the rep keeps the same flow forward.
  applyProjectTypeChoice(newType);
}

function confirmSwitchProject() {
  const newType = __pendingProjectSwitch;
  closeProjectSwitchDialog();
  if (!newType) return;
  state.activeProject.measurements = {};
  state.activeProject.addons = {};
  state.activeProject.tierConfirmed = false;
  if (state.maxStageReached > 2) state.maxStageReached = 2;
  applyProjectTypeChoice(newType);
}

/* ============================================================
   JOBBER INTEGRATION PANEL
   ============================================================ */
let __jobberStatus = { connected: false, loading: true };

// Fetch status from /_functions/jobberStatus and update the header pill.
async function refreshJobberPill() {
  try {
    const r = await fetch('/_functions/jobberStatus', { credentials: 'include' });
    if (!r.ok) { setJobberPill('error', 'Off'); return; }
    const data = await r.json();
    __jobberStatus = data;
    if (data && data.connected) {
      setJobberPill('connected', 'Jobber ✓');
    } else {
      setJobberPill('', 'Jobber off');
    }
  } catch (e) {
    setJobberPill('error', 'Jobber !');
    __jobberStatus = { connected: false, error: e.message };
  }
}

function setJobberPill(cls, label) {
  const pill = __doc.getElementById('jobberPill');
  if (!pill) return;
  pill.classList.remove('connected', 'warn', 'error');
  if (cls) pill.classList.add(cls);
  const text = __doc.getElementById('jobberPillText');
  if (text) text.textContent = label;
}

function openJobberPanel() {
  const dlg = __doc.getElementById('jobberPanelDialog');
  if (!dlg) return;
  // Show with stale data immediately, then refresh.
  renderJobberPanel(__jobberStatus);
  if (typeof dlg.showModal === 'function' && !dlg.open) dlg.showModal();
  // Always re-fetch on open so the displayed state is current.
  fetch('/_functions/jobberStatus', { credentials: 'include' })
    .then(r => r.json())
    .then(data => { __jobberStatus = data; renderJobberPanel(data); refreshJobberPill(); })
    .catch(e => renderJobberPanel({ connected: false, error: e.message }));
}

function closeJobberPanel() {
  const dlg = __doc.getElementById('jobberPanelDialog');
  if (dlg && dlg.open) dlg.close();
}

function renderJobberPanel(status) {
  const statusEl  = __doc.getElementById('jobberStatusBlock');
  const actionsEl = __doc.getElementById('jobberActionsBlock');
  if (!statusEl || !actionsEl) return;

  const connected = !!(status && status.connected);
  const expires   = status && status.accessExpiresAt
    ? new Date(status.accessExpiresAt).toLocaleString()
    : null;
  const reason    = status && status.reason;

  if (connected) {
    statusEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="width:10px;height:10px;border-radius:50%;background:#2d6e4e;"></span>
        <div>
          <div style="font-weight:700;color:#2d6e4e;">Connected to Jobber</div>
          ${expires ? `<div style="font-size:12px;color:var(--slate);margin-top:2px;">Token refreshes automatically · current expires ${escapeHtml(expires)}</div>` : ''}
        </div>
      </div>`;
    actionsEl.innerHTML = `
      <button class="jobber-action" onclick="jobberTestConnection()"><span class="ico">🔍</span><span>Test connection</span></button>
      <button class="jobber-action" onclick="jobberManualRefresh()"><span class="ico">🔄</span><span>Refresh token</span></button>
      <button class="jobber-action danger" onclick="jobberDisconnectConfirm()"><span class="ico">⛓️‍💥</span><span>Disconnect</span></button>
    `;
  } else {
    const subtext = reason === 'refresh_failed'
      ? 'Stored refresh token is no longer valid — reconnect to fix.'
      : 'Click Connect to authorize this site to push quotes to Jobber.';
    statusEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="width:10px;height:10px;border-radius:50%;background:#5a6378;"></span>
        <div>
          <div style="font-weight:700;color:var(--navy);">Not connected</div>
          <div style="font-size:12px;color:var(--slate);margin-top:2px;">${escapeHtml(subtext)}</div>
        </div>
      </div>`;
    actionsEl.innerHTML = `
      <button class="jobber-action primary" onclick="jobberConnect()"><span class="ico">🔗</span><span>Connect to Jobber</span></button>
    `;
  }
}

function jobberConnect() {
  // Open Jobber's OAuth consent in a new tab so the rep doesn't lose
  // calc state. The callback page auto-confirms; rep returns here.
  window.open('/_functions/jobberStartAuth', '_blank', 'noopener');
  // Re-check status every 2s for the next 30s so the UI flips to
  // "Connected" as soon as the OAuth handshake completes.
  let n = 0;
  const poll = setInterval(() => {
    n++;
    fetch('/_functions/jobberStatus', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data && data.connected) {
          clearInterval(poll);
          __jobberStatus = data;
          renderJobberPanel(data);
          refreshJobberPill();
        } else if (n >= 15) {
          clearInterval(poll);
        }
      })
      .catch(() => { if (n >= 15) clearInterval(poll); });
  }, 2000);
}

function jobberManualRefresh() {
  const actions = __doc.getElementById('jobberActionsBlock');
  if (actions) actions.innerHTML = '<div style="text-align:center;color:var(--slate);padding:12px;">Refreshing…</div>';
  fetch('/_functions/jobberRefresh', { method: 'POST', credentials: 'include' })
    .then(r => r.json())
    .then(data => {
      if (data && data.ok) {
        alert('Token refreshed successfully.');
      } else {
        alert('Refresh failed: ' + (data && data.error ? data.error : 'unknown'));
      }
      return fetch('/_functions/jobberStatus', { credentials: 'include' }).then(r => r.json());
    })
    .then(s => { __jobberStatus = s; renderJobberPanel(s); refreshJobberPill(); })
    .catch(e => { alert('Refresh error: ' + e.message); renderJobberPanel(__jobberStatus); });
}

function jobberDisconnectConfirm() {
  if (!confirm('Disconnect from Jobber? Future quotes won\'t push automatically until you reconnect. Existing Jobber quotes are unaffected.')) return;
  fetch('/_functions/jobberDisconnect', { method: 'POST', credentials: 'include' })
    .then(r => r.json())
    .then(data => {
      if (data && data.ok) {
        __jobberStatus = { connected: false };
        renderJobberPanel(__jobberStatus);
        refreshJobberPill();
      } else {
        alert('Disconnect failed.');
      }
    });
}

function jobberTestConnection() {
  const actions = __doc.getElementById('jobberActionsBlock');
  if (actions) actions.innerHTML = '<div style="text-align:center;color:var(--slate);padding:12px;">Testing…</div>';
  fetch('/_functions/jobberTest', { credentials: 'include' })
    .then(r => r.json())
    .then(data => {
      if (data && data.ok && data.account) {
        alert(`✓ Connected to Jobber account: ${data.account.name || data.account.id}`);
      } else if (data && data.ok && !data.account) {
        // OAuth handshake succeeded but the account query returned null —
        // virtually always a scope problem (the JWT was minted with empty
        // scopes, so we can't actually read account info).
        alert(
          'Connected, but the account query came back empty.\n\n' +
          'This almost always means your Jobber app was authorized with no scopes.\n\n' +
          'Fix:\n' +
          '  1. Open your Jobber developer app config\n' +
          '  2. Enable scopes: clients:read, clients:write, quotes:read, quotes:write\n' +
          '  3. Save\n' +
          '  4. Come back here → Disconnect → Connect again'
        );
      } else {
        alert('Connection test failed: ' + JSON.stringify(data, null, 2));
      }
      renderJobberPanel(__jobberStatus);
    })
    .catch(e => {
      alert('Test error: ' + e.message);
      renderJobberPanel(__jobberStatus);
    });
}

// Pill is refreshed on load (below the bootstrap call).
function refreshStage2Selection() {
  __doc.getElementById('stage2Next').disabled = !state.activeProject.type;
  const banner = __doc.getElementById('editingBanner');
  if (state.editingBundleIdx !== null) {
    banner.style.display = 'block';
    banner.className = 'editing-banner';
    banner.innerHTML = `<span><strong>Editing bundled project</strong> — changes will replace project #${state.editingBundleIdx + 1} in your bundle.</span><button onclick="cancelEditBundled()">Cancel edit</button>`;
  } else {
    banner.style.display = 'none';
  }
  // "Adding another" banner — only shown when adding a new project while
  // bundled projects already exist (so cancelling has somewhere to return to).
  const addBanner = __doc.getElementById('addingAnotherBanner');
  if (addBanner) {
    const showAdd = !!state._returnToReviewOnCancel && state.bundledProjects.length > 0 && !state.activeProject.type;
    addBanner.style.display = showAdd ? 'flex' : 'none';
  }
}

/* ============================================================
   STAGE 3: MEASUREMENTS
   ============================================================ */
const MEASURE_TIPS = {
  fence:   { ico: '📏', title: 'How we measure fences', body: 'Linear feet is measured base to base of posts (not panel to panel). Height is base of pickets to top, rounded to the nearest half-foot. Pricing assumes both sides stained — the standard for privacy fences — unless you toggle "one side only" below.' },
  deck:    { ico: '📏', title: 'What we count on a deck', body: 'Flat surface (sq ft) covers the top boards only. Railings are itemized in linear feet — a 40-ft perimeter railing counts as 40 ln ft regardless of how many rails it has. Stairs are counted individually by tread (not risers).' },
  pergola: { ico: '📏', title: 'Why pergola surface area is bigger than it looks', body: 'Total surface includes the top and bottom of every beam, all four sides of the posts, plus rafters and any decorative elements — not just the footprint. A 12×12 pergola is usually 180–220 sq ft of actual stainable surface, not 144.' },
  barn:    { ico: '📏', title: 'How we measure barn siding', body: 'Siding sq ft is calculated wall by wall (length × height for each wall). We don\'t subtract for normal-sized windows and doors. For walls above 12 ft, a height premium applies and a lift rental may be needed — typically quoted together.' },
  ceiling: { ico: '📏', title: 'What\'s included in a ceiling job', body: 'Beyond the sq ft of the ceiling itself, interior jobs include moving furniture, masking floors and walls, and covering/masking light fixtures and ceiling fans (we don\'t remove them — we cover them to protect from overspray). Tongue-and-groove and beam two-toning add complexity but a richer final look.' }
};

function renderMeasurements() {
  const proj = state.activeProject.type;
  const meta = PROJECT_META[proj];
  __doc.getElementById('measureTitle').textContent = `${meta.icon} ${meta.name} Measurements`;
  const tip = MEASURE_TIPS[proj];
  __doc.getElementById('measureTip').innerHTML = `<div class="tip-box"><span class="tip-ico">${tip.ico}</span><div class="tip-body"><strong>${tip.title}</strong>${tip.body}</div></div>`;

  const container = __doc.getElementById('measureContainer');

  let html = '';
  if (proj === 'fence') {
    html = `
      <div class="measure-section">
        <h3>Fence dimensions</h3>
        <p class="section-hint">We price by linear feet × height. Pricing assumes both sides stained (the standard).</p>
        <div class="form-grid">
          <div class="field"><label>Linear feet</label><input type="number" min="0" step="1" id="m_linearft" placeholder="e.g. 200"></div>
          <div class="field"><label>Average height (ft)</label><input type="number" min="0" step="0.5" id="m_height" placeholder="e.g. 6"></div>
          <div class="field"><label>Fence style</label>
            <select id="m_style">
              <option value="privacy">Standard Privacy</option>
              <option value="charleston">Charleston</option>
              <option value="shadowbox">Shadowbox (both sides visible)</option>
              <option value="bob">Board-on-Board</option>
              <option value="charleston_bob">Charleston Board-on-Board</option>
              <option value="farm">Farm Fence (less surface area)</option>
            </select>
          </div>
          <div class="field" style="display:flex;align-items:flex-end;">
            <div class="toggle-row" data-toggle="m_oneSided" style="width:100%;margin-bottom:0;"><span class="box"></span><span class="name">Some (or all) of the fence is one-side only</span></div>
          </div>
        </div>
        <div class="form-grid" id="oneSidedPartialRow" style="display:none; margin-top:8px;">
          <div class="field">
            <label>One-side-only linear feet</label>
            <input type="number" min="0" step="1" id="m_oneSidedLnFt" placeholder="Leave empty if the entire fence is one side only">
            <div class="hint">If only part of the fence is one-side (e.g. shared with a neighbor), enter just that portion's linear feet. Leave empty to apply one-side pricing to the full <span id="oneSidedTotalLnFtHint">—</span> ln ft.</div>
          </div>
        </div>
      </div>`;
  } else if (proj === 'deck') {
    html = `
      <div class="measure-section">
        <h3>Deck dimensions</h3>
        <p class="section-hint">Itemize each surface. Stairs are counted individually.</p>
        <div class="form-grid">
          <div class="field"><label>Flat surface (sq ft)</label><input type="number" min="0" step="1" id="m_flat" placeholder="e.g. 320"><div class="hint">Top boards only</div></div>
          <div class="field"><label>Railing (linear ft)</label><input type="number" min="0" step="1" id="m_rail" placeholder="e.g. 48"></div>
          <div class="field"><label>Number of stairs</label><input type="number" min="0" step="1" id="m_stairs" placeholder="e.g. 5"></div>
          <div class="field"><label>Lattice / privacy walls (sq ft)</label><input type="number" min="0" step="1" id="m_lattice" placeholder="optional"></div>
        </div>
        <div class="toggle-row" data-toggle="m_underneath" style="margin-top:8px;"><span class="box"></span><span class="name">Stain underneath / joists (doubles flat sq ft)</span></div>
      </div>`;
  } else if (proj === 'pergola') {
    html = `
      <div class="measure-section">
        <h3>Pergola dimensions</h3>
        <p class="section-hint">Give us the footprint of the pergola (length × width). We calculate the stainable surface area for you — pergolas have ~1.5× more surface than the footprint because we stain top + bottom of every beam, all four sides of the posts, plus rafters.</p>
        <div class="form-grid">
          <div class="field"><label>Length (ft)</label><input type="number" min="0" step="0.5" id="m_pergLen" placeholder="e.g. 12"></div>
          <div class="field"><label>Width (ft)</label><input type="number" min="0" step="0.5" id="m_pergWid" placeholder="e.g. 12"></div>
          <div class="field"><label>Approximate height (ft)</label><input type="number" min="0" step="0.5" id="m_pergHeight" placeholder="e.g. 8"><div class="hint">Most residential pergolas are 8–10 ft</div></div>
        </div>
        <div id="pergComputedReadout" style="margin: 10px 0 16px; padding: 12px 14px; background: var(--green-pale); border-left: 3px solid var(--green); border-radius: 8px; font-size: 13px; color: var(--navy); display: none;">
          <strong style="display:block; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--green); margin-bottom:2px;">Calculated stainable surface</strong>
          <span id="pergComputedValue">—</span>
        </div>
        <div class="toggle-row" data-toggle="m_overhead" style="margin-top:8px;"><span class="box"></span><span class="name">Overhead access challenge <span class="info-btn" role="button" tabindex="0" data-info="pergola_overhead" aria-label="What is overhead access challenge?">i</span></span></div>
      </div>`;
  } else if (proj === 'barn') {
    html = `
      <div class="measure-section">
        <h3>Barn siding dimensions</h3>
        <p class="section-hint">Process: pressure wash + brightener, scrape loose paint, sand, then 1–2 coats of solid stain.</p>
        <div class="form-grid">
          <div class="field"><label>Siding sq ft</label><input type="number" min="0" step="1" id="m_barnSqFt" placeholder="e.g. 1200"></div>
          <div class="field"><label>Trim / fascia (linear ft)</label><input type="number" min="0" step="1" id="m_barnTrim" placeholder="optional"></div>
          <div class="field"><label>Cupolas (#)</label><input type="number" min="0" step="1" id="m_cupolaCount" placeholder="0"></div>
          <div class="field"><label>Lift rental days needed</label><input type="number" min="0" step="1" id="m_liftDays" placeholder="0"><div class="hint">If needed for tall walls</div></div>
        </div>
        <div class="toggle-row" data-toggle="m_height12" style="margin-top:8px;"><span class="box"></span><span class="name">Walls above 12 ft / 2nd story (height premium)</span></div>
      </div>`;
  } else if (proj === 'ceiling') {
    html = `
      <div class="measure-section">
        <h3>Wooden ceiling dimensions</h3>
        <p class="section-hint">Common locations: porch ceilings, screen porches, exposed-beam great rooms, T&amp;G kitchens.</p>
        <div class="form-grid">
          <div class="field"><label>Ceiling area (sq ft)</label><input type="number" min="0" step="1" id="m_ceilSqFt" placeholder="e.g. 280"></div>
          <div class="field"><label>Beam length total (linear ft)</label><input type="number" min="0" step="1" id="m_beamLnFt" placeholder="optional"><div class="hint">Only if beams stained different color</div></div>
          <div class="field"><label>Light fixtures to cover &amp; mask</label><input type="number" min="0" step="1" id="m_fixtures" placeholder="0"></div>
          <div class="field"><label>Ceiling fans to cover &amp; mask</label><input type="number" min="0" step="1" id="m_fans" placeholder="0"></div>
        </div>
        <div class="toggle-row" data-toggle="m_tng" style="margin-top:8px;"><span class="box"></span><span class="name">Tongue-and-groove</span></div>
        <div class="toggle-row" data-toggle="m_furnProtect" style="margin-top:8px;"><span class="box"></span><span class="name">Indoor furniture / floor protection needed</span></div>
      </div>`;
  }
  container.innerHTML = html;
  restoreMeasurementValues();
  attachMeasureListeners();
  // Reference photos — render any already on this project and wire
  // the file input. Lives on the Measurements step but bound to
  // state.activeProject.referencePhotos so it travels with the project.
  renderReferencePhotos();
  attachPhotoListeners();
}

function restoreMeasurementValues() {
  const m = state.activeProject.measurements;
  const proj = state.activeProject.type;
  const set = (id, v) => { const el = __doc.getElementById(id); if (el && v !== undefined && v !== null && v !== '') el.value = v; };
  const tog = (key, v) => { const row = __doc.querySelector(`[data-toggle="${key}"]`); if (row) row.classList.toggle('checked', !!v); };
  if (proj === 'fence') { set('m_linearft', m.linearft); set('m_height', m.height); set('m_style', m.style || 'privacy'); tog('m_oneSided', m.oneSided); set('m_oneSidedLnFt', m.oneSidedLnFt); updateOneSidedRow(); }
  else if (proj === 'deck') { set('m_flat', m.flat); set('m_rail', m.rail); set('m_stairs', m.stairs); set('m_lattice', m.lattice); tog('m_underneath', m.underneath); }
  else if (proj === 'pergola') { set('m_pergLen', m.length); set('m_pergWid', m.width); set('m_pergHeight', m.height); tog('m_overhead', m.overhead); updatePergolaSqFtReadout(); }
  else if (proj === 'barn') { set('m_barnSqFt', m.sqft); set('m_barnTrim', m.trim); set('m_cupolaCount', m.cupolaCount); set('m_liftDays', m.liftDays); tog('m_height12', m.heightPremium); }
  else if (proj === 'ceiling') { set('m_ceilSqFt', m.sqft); set('m_beamLnFt', m.beamLnFt); set('m_fixtures', m.fixtures); set('m_fans', m.fans); tog('m_tng', m.tng); tog('m_furnProtect', m.furnProtect); }
}

function attachMeasureListeners() {
  __doc.querySelectorAll('#measureContainer input, #measureContainer select').forEach(inp => {
    inp.addEventListener('input', saveMeasurements);
    inp.addEventListener('change', saveMeasurements);
  });
  __doc.querySelectorAll('#measureContainer .toggle-row').forEach(row => {
    row.addEventListener('click', () => { row.classList.toggle('checked'); saveMeasurements(); updateOneSidedRow(); });
  });
  // Wire up the 3-button wood-age selector (Step 3)
  __doc.querySelectorAll('#woodAgeButtons .wood-age-btn').forEach(btn => {
    btn.classList.toggle('selected', state.activeProject.woodAge === btn.dataset.woodAge);
    btn.onclick = (e) => {
      if (e.target.classList && e.target.classList.contains('info-btn')) return;
      state.activeProject.woodAge = btn.dataset.woodAge;
      __doc.querySelectorAll('#woodAgeButtons .wood-age-btn').forEach(b => b.classList.toggle('selected', b === btn));
      // If a now-locked condition was previously selected, clear it so the user re-picks on Step 4
      const allowed = allowedConditions();
      if (state.activeProject.condition && !allowed.includes(state.activeProject.condition)) {
        state.activeProject.condition = null;
      }
      updateRunningTotal();
    };
  });

  // Wire up the wasStained toggle (now lives on Step 3)
  const wasStainedToggle = __doc.querySelector('[data-toggle="wasStained"]');
  const prevPanel = __doc.getElementById('prevStainPanel');
  if (wasStainedToggle && prevPanel) {
    // Restore visual state
    wasStainedToggle.classList.toggle('checked', !!state.activeProject.previousStain.wasStained);
    prevPanel.style.display = state.activeProject.previousStain.wasStained ? 'block' : 'none';
    wasStainedToggle.onclick = (e) => {
      if (e.target.classList && e.target.classList.contains('info-btn')) return;
      const newVal = !state.activeProject.previousStain.wasStained;
      state.activeProject.previousStain.wasStained = newVal;
      wasStainedToggle.classList.toggle('checked', newVal);
      prevPanel.style.display = newVal ? 'block' : 'none';
      if (newVal) populatePrevStainForm();
    };
    // If panel is currently visible, also populate form fields
    if (state.activeProject.previousStain.wasStained) populatePrevStainForm();
  }
}

function populatePrevStainForm() {
  const ps = state.activeProject.previousStain;
  populateBrandDropdown('prevBrand', ps.brand);
  populateTransparencyDropdown('prevTransparency', ps.transparency);
  const setVal = (id, v) => { const el = __doc.getElementById(id); if (el) el.value = v || ''; };
  setVal('prevProductType', ps.previousProductType);
  setVal('prevCondition', ps.prevCondition);
  setVal('prevProductName', ps.productName);
  setVal('prevColorNotes', ps.colorNotes);
  // Wire onchange/input handlers (idempotent — overwrite each time)
  const wire = (id, key, transform = v => v) => {
    const el = __doc.getElementById(id); if (!el) return;
    el.onchange = el.oninput = (e) => { ps[key] = transform(e.target.value); };
  };
  wire('prevProductType', 'previousProductType');
  wire('prevCondition', 'prevCondition');
  wire('prevBrand', 'brand');
  wire('prevTransparency', 'transparency');
  wire('prevProductName', 'productName');
  wire('prevColorNotes', 'colorNotes');
}

/* ============================================================
   MEASUREMENT TUTORIAL MODAL
   ============================================================ */
function openMeasureTutorial() {
  const proj = state.activeProject.type;
  const tips = MEASURE_TUTORIAL[proj] || MEASURE_TUTORIAL.fence;
  __doc.getElementById('measureTutorialTitle').textContent = tips.title;
  __doc.getElementById('measureTutorialBody').innerHTML = tips.body;
  const dlg = __doc.getElementById('measureTutorialDialog');
  if (dlg && typeof dlg.showModal === 'function') {
    if (!dlg.open) dlg.showModal();
  }
}
function closeMeasureTutorial() {
  const dlg = __doc.getElementById('measureTutorialDialog');
  if (dlg && typeof dlg.close === 'function' && dlg.open) dlg.close();
}

// =============================================================
//  MEASUREMENT TUTORIAL — diagrams + tips per project type
// =============================================================
// Each tutorial entry now leads with:
//   1. A universal "cheat sheet" tips block (pace it off, Maps, rough)
//   2. An inline SVG diagram specific to the project type
//   3. The detailed bullet content (tightened from original)
//   4. A confidence-builder footer
// Inline SVG keeps the page weight low (no extra image requests) and
// scales crisply on any device. Colors use page variables so the
// diagrams pick up brand tone automatically.

const MEASURE_TIP_HEADER = `
  <div class="mt-tips">
    <div class="mt-tip"><span class="mt-tip-ico">🚶</span><span>Pace it off &mdash; your stride is about <strong>2.5 ft</strong>, so 20 steps ≈ 50 ft.</span></div>
    <div class="mt-tip"><span class="mt-tip-ico">📏</span><span>A 25 ft tape measure handles most projects. Borrow one from a neighbor or grab one at any hardware store.</span></div>
    <div class="mt-tip"><span class="mt-tip-ico">👍</span><span>Rough numbers are fine &mdash; we verify everything in person before any work starts.</span></div>
  </div>`;

const MEASURE_TIP_FOOTER = `
  <div class="mt-footer">
    <strong>You can't get this wrong.</strong> Whatever you enter, we double-check in person at the free measurement visit. Just get us close enough to give you a real number.
  </div>`;

// SVG diagrams. Each uses inline currentColor where possible so the
// theme automatically picks them up. Kept under ~2 KB each.
const MEASURE_SVG = {
  fence: `
    <svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Fence panel measurement diagram" class="mt-svg">
      <!-- 4 panels with vertical pickets, posts between, top + bottom rails -->
      <g>
        <rect x="20" y="58"  width="8" height="90" fill="#3a2510"/>
        <rect x="115" y="58" width="8" height="90" fill="#3a2510"/>
        <rect x="210" y="58" width="8" height="90" fill="#3a2510"/>
        <rect x="305" y="58" width="8" height="90" fill="#3a2510"/>
        <rect x="400" y="58" width="8" height="90" fill="#3a2510"/>
      </g>
      <!-- Panels (groups of pickets between posts) -->
      <g fill="#c9a576" stroke="#8b6a3f" stroke-width="0.5">
        <!-- Panel 1 -->
        <rect x="34" y="68" width="9" height="72"/><rect x="47" y="68" width="9" height="72"/>
        <rect x="60" y="68" width="9" height="72"/><rect x="73" y="68" width="9" height="72"/>
        <rect x="86" y="68" width="9" height="72"/><rect x="99" y="68" width="9" height="72"/>
        <!-- Panel 2 -->
        <rect x="129" y="68" width="9" height="72"/><rect x="142" y="68" width="9" height="72"/>
        <rect x="155" y="68" width="9" height="72"/><rect x="168" y="68" width="9" height="72"/>
        <rect x="181" y="68" width="9" height="72"/><rect x="194" y="68" width="9" height="72"/>
        <!-- Panel 3 -->
        <rect x="224" y="68" width="9" height="72"/><rect x="237" y="68" width="9" height="72"/>
        <rect x="250" y="68" width="9" height="72"/><rect x="263" y="68" width="9" height="72"/>
        <rect x="276" y="68" width="9" height="72"/><rect x="289" y="68" width="9" height="72"/>
        <!-- Panel 4 -->
        <rect x="319" y="68" width="9" height="72"/><rect x="332" y="68" width="9" height="72"/>
        <rect x="345" y="68" width="9" height="72"/><rect x="358" y="68" width="9" height="72"/>
        <rect x="371" y="68" width="9" height="72"/><rect x="384" y="68" width="9" height="72"/>
      </g>
      <!-- Top and bottom rails on each panel -->
      <g fill="#5d3a1a">
        <rect x="28" y="74"  width="87" height="4"/><rect x="28" y="128" width="87" height="4"/>
        <rect x="123" y="74" width="87" height="4"/><rect x="123" y="128" width="87" height="4"/>
        <rect x="218" y="74" width="87" height="4"/><rect x="218" y="128" width="87" height="4"/>
        <rect x="313" y="74" width="87" height="4"/><rect x="313" y="128" width="87" height="4"/>
      </g>
      <!-- Measurement bracket for one panel -->
      <g stroke="#2c6da7" stroke-width="2" fill="none">
        <line x1="28" y1="46"  x2="115" y2="46"/>
        <line x1="28" y1="40"  x2="28" y2="52"/>
        <line x1="115" y1="40" x2="115" y2="52"/>
      </g>
      <text x="71" y="36" text-anchor="middle" fill="#2c6da7" font-size="15" font-weight="700" font-family="system-ui, sans-serif">≈ 8 ft per panel</text>
      <!-- Ground -->
      <line x1="10" y1="158" x2="418" y2="158" stroke="#6b7280" stroke-width="1.5"/>
      <!-- Caption -->
      <text x="210" y="186" text-anchor="middle" fill="#1a2540" font-size="13" font-weight="600" font-family="system-ui, sans-serif">Count panels × ~6–8 ft = total linear feet</text>
    </svg>`,

  deck: `
    <svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Deck length × width diagram" class="mt-svg">
      <!-- Deck plan view (top-down) with horizontal boards -->
      <g>
        <rect x="60" y="40" width="300" height="140" fill="#c9a576" stroke="#5d3a1a" stroke-width="2"/>
        <!-- Board lines -->
        <g stroke="#8b6a3f" stroke-width="0.8">
          <line x1="60" y1="58"  x2="360" y2="58"/>
          <line x1="60" y1="76"  x2="360" y2="76"/>
          <line x1="60" y1="94"  x2="360" y2="94"/>
          <line x1="60" y1="112" x2="360" y2="112"/>
          <line x1="60" y1="130" x2="360" y2="130"/>
          <line x1="60" y1="148" x2="360" y2="148"/>
          <line x1="60" y1="166" x2="360" y2="166"/>
        </g>
      </g>
      <!-- Length arrow (horizontal, above) -->
      <g stroke="#2c6da7" stroke-width="2" fill="none">
        <line x1="60" y1="26" x2="360" y2="26"/>
        <polyline points="65,21 60,26 65,31" />
        <polyline points="355,21 360,26 355,31" />
      </g>
      <text x="210" y="18" text-anchor="middle" fill="#2c6da7" font-size="14" font-weight="700" font-family="system-ui, sans-serif">Length</text>
      <!-- Width arrow (vertical, left) -->
      <g stroke="#2c6da7" stroke-width="2" fill="none">
        <line x1="44" y1="40" x2="44" y2="180"/>
        <polyline points="39,45 44,40 49,45" />
        <polyline points="39,175 44,180 49,175" />
      </g>
      <text x="22" y="115" text-anchor="middle" fill="#2c6da7" font-size="14" font-weight="700" font-family="system-ui, sans-serif" transform="rotate(-90 22 115)">Width</text>
      <!-- Caption -->
      <text x="210" y="204" text-anchor="middle" fill="#1a2540" font-size="14" font-weight="700" font-family="system-ui, sans-serif">Length × Width = square feet</text>
    </svg>`,

  pergola: `
    <svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pergola footprint diagram" class="mt-svg">
      <!-- Pergola plan view (top-down) — corner posts + parallel rafters + cross beams -->
      <g>
        <rect x="80" y="50" width="260" height="130" fill="none" stroke="#5d3a1a" stroke-width="2.5"/>
        <!-- Rafters (horizontal slats) -->
        <g stroke="#8b6a3f" stroke-width="3">
          <line x1="80" y1="68"  x2="340" y2="68"/>
          <line x1="80" y1="86"  x2="340" y2="86"/>
          <line x1="80" y1="104" x2="340" y2="104"/>
          <line x1="80" y1="122" x2="340" y2="122"/>
          <line x1="80" y1="140" x2="340" y2="140"/>
          <line x1="80" y1="158" x2="340" y2="158"/>
        </g>
        <!-- Cross beams (vertical edge) -->
        <g stroke="#5d3a1a" stroke-width="4">
          <line x1="80" y1="50" x2="80" y2="180"/>
          <line x1="340" y1="50" x2="340" y2="180"/>
        </g>
        <!-- Corner posts -->
        <g fill="#3a2510">
          <rect x="74" y="44" width="12" height="12"/>
          <rect x="334" y="44" width="12" height="12"/>
          <rect x="74" y="174" width="12" height="12"/>
          <rect x="334" y="174" width="12" height="12"/>
        </g>
      </g>
      <!-- Length / Width arrows -->
      <g stroke="#2c6da7" stroke-width="2" fill="none">
        <line x1="80" y1="32" x2="340" y2="32"/>
        <polyline points="85,27 80,32 85,37"/>
        <polyline points="335,27 340,32 335,37"/>
      </g>
      <text x="210" y="24" text-anchor="middle" fill="#2c6da7" font-size="14" font-weight="700" font-family="system-ui, sans-serif">Length</text>
      <g stroke="#2c6da7" stroke-width="2" fill="none">
        <line x1="62" y1="50" x2="62" y2="180"/>
        <polyline points="57,55 62,50 67,55"/>
        <polyline points="57,175 62,180 67,175"/>
      </g>
      <text x="42" y="115" text-anchor="middle" fill="#2c6da7" font-size="14" font-weight="700" font-family="system-ui, sans-serif" transform="rotate(-90 42 115)">Width</text>
      <!-- Caption -->
      <text x="210" y="204" text-anchor="middle" fill="#1a2540" font-size="13" font-weight="600" font-family="system-ui, sans-serif">Give us L × W of the footprint. We calculate beam surface area for you.</text>
    </svg>`,

  ceiling: `
    <svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ceiling area diagram" class="mt-svg">
      <!-- Top-down view of porch ceiling with T&G planks + fixture -->
      <g>
        <rect x="60" y="40" width="300" height="140" fill="#c9a576" stroke="#5d3a1a" stroke-width="2"/>
        <!-- T&G planks -->
        <g stroke="#8b6a3f" stroke-width="0.8">
          <line x1="60" y1="62"  x2="360" y2="62"/>
          <line x1="60" y1="84"  x2="360" y2="84"/>
          <line x1="60" y1="106" x2="360" y2="106"/>
          <line x1="60" y1="128" x2="360" y2="128"/>
          <line x1="60" y1="150" x2="360" y2="150"/>
        </g>
        <!-- Fan icon (just a circle with blades) -->
        <g transform="translate(210, 110)" fill="#3a2510">
          <circle cx="0" cy="0" r="6"/>
          <ellipse cx="-14" cy="0" rx="10" ry="3" fill="#5d3a1a" transform="rotate(0)"/>
          <ellipse cx="0" cy="-14" rx="3" ry="10" fill="#5d3a1a"/>
          <ellipse cx="14" cy="0" rx="10" ry="3" fill="#5d3a1a"/>
          <ellipse cx="0" cy="14" rx="3" ry="10" fill="#5d3a1a"/>
        </g>
      </g>
      <!-- Arrows -->
      <g stroke="#2c6da7" stroke-width="2" fill="none">
        <line x1="60" y1="26" x2="360" y2="26"/>
        <polyline points="65,21 60,26 65,31" />
        <polyline points="355,21 360,26 355,31" />
      </g>
      <text x="210" y="18" text-anchor="middle" fill="#2c6da7" font-size="14" font-weight="700" font-family="system-ui, sans-serif">Length</text>
      <g stroke="#2c6da7" stroke-width="2" fill="none">
        <line x1="44" y1="40" x2="44" y2="180"/>
        <polyline points="39,45 44,40 49,45" />
        <polyline points="39,175 44,180 49,175" />
      </g>
      <text x="22" y="115" text-anchor="middle" fill="#2c6da7" font-size="14" font-weight="700" font-family="system-ui, sans-serif" transform="rotate(-90 22 115)">Width</text>
      <!-- Caption -->
      <text x="210" y="204" text-anchor="middle" fill="#1a2540" font-size="14" font-weight="700" font-family="system-ui, sans-serif">L × W of the ceiling area = square feet</text>
    </svg>`,

  barn: `
    <svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Barn wall measurement diagram" class="mt-svg">
      <!-- Front of a barn — gable wall -->
      <g>
        <polygon points="80,60 210,30 340,60 340,180 80,180" fill="#c9a576" stroke="#5d3a1a" stroke-width="2"/>
        <!-- Vertical siding lines -->
        <g stroke="#8b6a3f" stroke-width="0.8">
          <line x1="110" y1="60" x2="110" y2="180"/>
          <line x1="140" y1="60" x2="140" y2="180"/>
          <line x1="170" y1="60" x2="170" y2="180"/>
          <line x1="200" y1="60" x2="200" y2="180"/>
          <line x1="230" y1="60" x2="230" y2="180"/>
          <line x1="260" y1="60" x2="260" y2="180"/>
          <line x1="290" y1="60" x2="290" y2="180"/>
          <line x1="320" y1="60" x2="320" y2="180"/>
        </g>
        <!-- Door -->
        <rect x="190" y="120" width="40" height="60" fill="#5d3a1a"/>
      </g>
      <!-- Length arrow -->
      <g stroke="#2c6da7" stroke-width="2" fill="none">
        <line x1="80" y1="200" x2="340" y2="200"/>
        <polyline points="85,195 80,200 85,205" />
        <polyline points="335,195 340,200 335,205" />
      </g>
      <text x="210" y="217" text-anchor="middle" fill="#2c6da7" font-size="14" font-weight="700" font-family="system-ui, sans-serif">Wall length</text>
      <!-- Height arrow -->
      <g stroke="#2c6da7" stroke-width="2" fill="none">
        <line x1="62" y1="60" x2="62" y2="180"/>
        <polyline points="57,65 62,60 67,65" />
        <polyline points="57,175 62,180 67,175" />
      </g>
      <text x="42" y="120" text-anchor="middle" fill="#2c6da7" font-size="14" font-weight="700" font-family="system-ui, sans-serif" transform="rotate(-90 42 120)">Height</text>
      <!-- Caption -->
      <text x="210" y="20" text-anchor="middle" fill="#1a2540" font-size="13" font-weight="600" font-family="system-ui, sans-serif">Length × Height for each wall, then add them up</text>
    </svg>`
};

const MEASURE_TUTORIAL = {
  fence: {
    title: 'How to estimate fence measurements',
    body: MEASURE_TIP_HEADER + MEASURE_SVG.fence + `
      <p style="margin-bottom:14px;"><strong>Linear feet (how long the fence is):</strong></p>
      <ul style="margin-bottom:18px;padding-left:20px;line-height:1.7;">
        <li>Walk along the base &mdash; count panels and multiply by panel width. Most panels are <strong>6 or 8 ft</strong> wide (check the gap between posts).</li>
        <li>Pace it out &mdash; 20 normal steps ≈ 50 ft.</li>
        <li>Use a tape measure or measuring wheel at one or two corners and estimate the rest.</li>
        <li><strong>Round to the nearest 5 ft.</strong> Over-estimating slightly is fine.</li>
      </ul>
      <p style="margin-bottom:14px;"><strong>Height:</strong></p>
      <ul style="margin-bottom:18px;padding-left:20px;line-height:1.7;">
        <li>Most residential privacy fences are <strong>6 ft</strong>.</li>
        <li>Front-yard / decorative / pool fences are usually <strong>4 ft</strong>.</li>
        <li>Measure from the ground to the top of the pickets (not the post caps).</li>
      </ul>
      <p style="margin-bottom:8px;"><strong>Fence style:</strong></p>
      <ul style="padding-left:20px;line-height:1.7;">
        <li><strong>Privacy</strong> &mdash; solid panels, no gaps. Most common.</li>
        <li><strong>Shadowbox</strong> &mdash; boards alternate front/back (looks the same from either side).</li>
        <li><strong>Board-on-board</strong> &mdash; overlapping pickets, no gaps from either side.</li>
        <li><strong>Charleston</strong> &mdash; decorative cut into the picket tops.</li>
        <li><strong>Farm fence</strong> &mdash; horizontal rails with big gaps (3-rail or split-rail).</li>
      </ul>` + MEASURE_TIP_FOOTER
  },
  deck: {
    title: 'How to estimate deck measurements',
    body: MEASURE_TIP_HEADER + MEASURE_SVG.deck + `
      <p style="margin-bottom:14px;"><strong>Flat surface (square feet):</strong></p>
      <ul style="margin-bottom:18px;padding-left:20px;line-height:1.7;">
        <li><strong>Length × width</strong> of the deck floor. Don't subtract for stairs or built-ins.</li>
        <li>Typical sizes: 12×12 = 144 sq ft &middot; 10×16 = 160 &middot; 14×20 = 280 &middot; 16×24 = 384.</li>
        <li>L-shaped / multi-level: break it into rectangles, calculate each, add together.</li>
      </ul>
      <p style="margin-bottom:14px;"><strong>Railing (linear feet):</strong></p>
      <ul style="margin-bottom:18px;padding-left:20px;line-height:1.7;">
        <li>Total length around the deck's handrail. Skip any side flush against the house.</li>
        <li>A 12×12 deck with railing on 3 sides ≈ 36 ln ft.</li>
      </ul>
      <p style="margin-bottom:14px;"><strong>Stairs:</strong></p>
      <ul style="margin-bottom:18px;padding-left:20px;line-height:1.7;">
        <li>Count individual <strong>treads</strong> (the part you step on) &mdash; not risers, not the landing.</li>
        <li>3 ft drop ≈ 4 stairs &middot; 6 ft drop ≈ 8 stairs.</li>
      </ul>
      <p style="margin-bottom:14px;"><strong>Underneath / joists:</strong></p>
      <ul style="margin-bottom:18px;padding-left:20px;line-height:1.7;">
        <li>Only check this if you want the visible underside of the deck stained (e.g., second-story decks where the patio below sees it).</li>
      </ul>
      <p style="margin-bottom:8px;"><strong>Lattice / privacy walls:</strong></p>
      <ul style="padding-left:20px;line-height:1.7;">
        <li>Decorative lattice between deck posts. Measure each panel's sq ft.</li>
      </ul>` + MEASURE_TIP_FOOTER
  },
  pergola: {
    title: 'How to estimate pergola measurements',
    body: MEASURE_TIP_HEADER + MEASURE_SVG.pergola + `
      <p style="margin-bottom:14px;">Just measure the <strong>footprint</strong> (length × width of the area under the pergola). We calculate the actual stainable surface from there &mdash; pergolas always have more wood to coat than the footprint suggests because we stain the top + bottom of every beam + all four sides of the posts.</p>
      <p style="margin-bottom:14px;"><strong>Quick estimates by footprint:</strong></p>
      <ul style="margin-bottom:18px;padding-left:20px;line-height:1.7;">
        <li><strong>10×10</strong> ≈ 150–180 sq ft of stainable surface</li>
        <li><strong>12×12</strong> ≈ 180–220 sq ft</li>
        <li><strong>14×16</strong> ≈ 280–350 sq ft</li>
        <li><strong>16×24</strong> ≈ 400–500 sq ft</li>
      </ul>
      <p style="margin-bottom:8px;">Don't worry about counting beams &mdash; just give us the footprint.</p>` + MEASURE_TIP_FOOTER
  },
  barn: {
    title: 'How to estimate barn siding',
    body: MEASURE_TIP_HEADER + MEASURE_SVG.barn + `
      <p style="margin-bottom:14px;"><strong>Siding sq ft (per wall):</strong></p>
      <ul style="margin-bottom:18px;padding-left:20px;line-height:1.7;">
        <li>For each wall: <strong>wall length × wall height</strong>. Add the walls together for total sq ft.</li>
        <li>Don't subtract for normal windows or doors &mdash; the trim around them needs staining anyway.</li>
        <li>Typical 24×36 barn with 12 ft walls ≈ 1,440 sq ft total.</li>
      </ul>
      <p style="margin-bottom:8px;"><strong>Tall walls / 2-story:</strong></p>
      <ul style="padding-left:20px;line-height:1.7;">
        <li>Toggle "Walls above 12 ft" &mdash; a 30% height premium applies for the extra labor.</li>
        <li>A lift rental is usually required above ~16 ft, billed at $400/day.</li>
      </ul>` + MEASURE_TIP_FOOTER
  },
  ceiling: {
    title: 'How to estimate a wooden ceiling',
    body: MEASURE_TIP_HEADER + MEASURE_SVG.ceiling + `
      <p style="margin-bottom:14px;"><strong>Ceiling area (square feet):</strong></p>
      <ul style="margin-bottom:18px;padding-left:20px;line-height:1.7;">
        <li><strong>Length × width</strong> of the ceiling area you want stained.</li>
        <li>Typical porch ceiling: 12×8 = 96 sq ft &middot; Typical T&G kitchen: 200–300 sq ft.</li>
      </ul>
      <p style="margin-bottom:14px;"><strong>Beam two-tone (linear feet):</strong></p>
      <ul style="margin-bottom:18px;padding-left:20px;line-height:1.7;">
        <li>Only count beams if you want them stained a <em>different</em> color than the planks.</li>
        <li>12×12 ceiling with three crossing beams ≈ 36 ln ft of beam.</li>
      </ul>
      <p style="margin-bottom:8px;"><strong>Fixtures &amp; fans:</strong></p>
      <ul style="padding-left:20px;line-height:1.7;">
        <li>Count what we'll cover &amp; mask (we wrap them rather than removing). Typical porch: 1 fan + 2 lights.</li>
      </ul>` + MEASURE_TIP_FOOTER
  }
};

// ============================================================
//  REFERENCE PHOTOS — capture, upload to Wix Media, attach to project
// ============================================================
const PHOTO_MAX_COUNT     = 8;
const PHOTO_MAX_BYTES     = 10 * 1024 * 1024;  // 10 MB
const PHOTO_PREVIEW_MAX_W = 1600;              // downscale before upload
const PHOTO_JPEG_QUALITY  = 0.82;

function attachPhotoListeners() {
  const input = __doc.getElementById('photoInput');
  if (input && !input._wired) {
    input._wired = true;
    input.addEventListener('change', onPhotosPicked);
  }
  // The "Add photos" button used to open the picker via an inline
  // onclick that called `__doc.getElementById('photoInput').click()`.
  // Inside the shadow DOM, `document.getElementById` from inline
  // attributes resolves against the host document — which doesn't
  // contain the input — so the click silently no-op'd. Wiring the
  // handler here keeps `__doc` in scope and the picker pops as
  // expected on both iPad and desktop.
  const btn = __doc.getElementById('photoAddBtn');
  if (btn && !btn._wired) {
    btn._wired = true;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const fileInput = __doc.getElementById('photoInput');
      if (fileInput && typeof fileInput.click === 'function') fileInput.click();
    });
  }
}

function renderReferencePhotos() {
  const grid    = __doc.getElementById('photoUploadGrid');
  const addBtn  = __doc.getElementById('photoAddBtn');
  if (!grid) return;
  const photos = state.activeProject.referencePhotos || [];
  grid.innerHTML = photos.map((p, idx) => {
    const cls = p.failed ? ' failed' : (p.uploading ? ' uploading' : '');
    const src = p.url || p.previewDataUrl || '';
    const errTitle = p.failed && p.errorMsg ? ` title="${escapeHtml(p.errorMsg)}"` : '';
    // onerror — if the uploaded URL fails to load, swap to the data URL
    // preview so the card never goes blank. (Wix Media URLs sometimes
    // take a few seconds to propagate; this hides that gap.)
    const fallback = (p.url && p.previewDataUrl) ? ` onerror="this.onerror=null;this.src='${escapeHtml(p.previewDataUrl)}'"` : '';
    return `
      <div class="photo-card${cls}"${errTitle}>
        ${src ? `<img src="${escapeHtml(src)}" alt=""${fallback}>` : ''}
        <button type="button" class="photo-remove" onclick="removeReferencePhoto(${idx})" aria-label="Remove photo">×</button>
      </div>`;
  }).join('');
  if (addBtn) {
    if (photos.length >= PHOTO_MAX_COUNT) {
      addBtn.disabled = true;
      addBtn.textContent = `Max ${PHOTO_MAX_COUNT} photos`;
    } else {
      addBtn.disabled = false;
      addBtn.textContent = photos.length === 0 ? '📷 Add photos' : '📷 Add more';
    }
  }
}

// File input change handler — kicks off downscale-then-upload for each
// pick. We don't block "Next" while uploads run; the success popup
// will surface any uploads that didn't make it.
async function onPhotosPicked(e) {
  const files = Array.from(e.target.files || []);
  e.target.value = '';   // reset so picking the same file again still fires change
  for (const f of files) {
    if (!state.activeProject.referencePhotos) state.activeProject.referencePhotos = [];
    if (state.activeProject.referencePhotos.length >= PHOTO_MAX_COUNT) break;
    if (f.size > PHOTO_MAX_BYTES) {
      alert(`"${f.name}" is too large (${Math.round(f.size/1024/1024)} MB). Limit is ${PHOTO_MAX_BYTES/1024/1024} MB per photo.`);
      continue;
    }
    const photo = {
      name: f.name || `photo_${Date.now()}.jpg`,
      size: f.size,
      uploading: true,
      failed: false,
      errorMsg: '',
      url: '',
      previewDataUrl: ''
    };
    state.activeProject.referencePhotos.push(photo);
    renderReferencePhotos();
    // Process + upload in the background; the grid re-renders when it lands.
    // Hard timeout so a hung step (e.g. HEIC decode on iPad Safari) can't
    // leave the card stuck on "Uploading…" forever.
    Promise.race([
      processAndUploadPhoto(f, photo),
      new Promise((_, rej) => setTimeout(() => rej(new Error('upload_timeout_60s')), 60000))
    ]).catch(err => {
      console.warn('[SSS Photos] upload failed:', err);
      photo.uploading = false;
      photo.failed = true;
      photo.errorMsg = (err && err.message) ? err.message : String(err);
      renderReferencePhotos();
    });
  }
}

// Best-effort downscale + upload. The pipeline degrades gracefully:
//   1. Try to read the file as a data URL
//   2. Try to decode + downscale via canvas
//   3. If either fails (HEIC on iPad Safari, broken JPEG, etc.) fall
//      back to uploading the original file as-is so the photo still
//      makes it to Wix Media — we just skip the size savings.
// Each step logs to console so we can diagnose if something breaks.
async function processAndUploadPhoto(file, photoRef) {
  console.log('[SSS Photos] processing', file.name, file.type, file.size);
  let uploadDataUrl = null;

  // Step 1: read into data URL (for preview + as upload payload)
  try {
    uploadDataUrl = await readFileAsDataURL(file);
    photoRef.previewDataUrl = uploadDataUrl;
    renderReferencePhotos();
  } catch (e) {
    console.warn('[SSS Photos] read-as-dataurl failed:', e);
    throw new Error('file_read_failed: ' + (e && e.message ? e.message : e));
  }

  // Step 2: try to downscale. Wrap in a 15s timeout so a broken
  // decode (HEIC, very large dimensions) doesn't hang. If it fails,
  // we keep the original data URL and ship that to the backend.
  try {
    const downscaled = await Promise.race([
      downscaleDataUrl(uploadDataUrl, PHOTO_PREVIEW_MAX_W, PHOTO_JPEG_QUALITY),
      new Promise((_, rej) => setTimeout(() => rej(new Error('downscale_timeout_15s')), 15000))
    ]);
    if (downscaled && downscaled.length < uploadDataUrl.length) {
      uploadDataUrl = downscaled;
      console.log('[SSS Photos] downscaled, new size:', uploadDataUrl.length);
    }
  } catch (e) {
    console.warn('[SSS Photos] downscale failed, uploading original:', e);
  }

  // Step 3: send to backend. Upload through HTTP function directly
  // (NOT the bridge) so we get a clear network-tab entry + can read
  // resp.status when something's off.
  console.log('[SSS Photos] uploading', uploadDataUrl.length, 'bytes to /_functions/uploadReferencePhoto');
  let respStatus = 0;
  let respBody = null;
  try {
    const resp = await fetch('/_functions/uploadReferencePhoto', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataUrl: uploadDataUrl,
        fileName: photoRef.name,
        quoteId: state.quoteId
      })
    });
    respStatus = resp.status;
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error('http_' + resp.status + (text ? ': ' + text.slice(0, 200) : ''));
    }
    respBody = await resp.json();
  } catch (e) {
    console.warn('[SSS Photos] upload fetch failed (status=' + respStatus + '):', e);
    throw e;
  }

  if (!respBody || !respBody.ok || !respBody.url) {
    throw new Error('upload_no_url: ' + JSON.stringify(respBody || {}).slice(0, 200));
  }
  photoRef.url = respBody.url;
  photoRef.uploading = false;
  // Keep the dataURL preview as a fallback so the local card never
  // goes blank — if Wix's URL takes a moment to propagate or the
  // browser can't load it, we still show *something* visual.
  // Cleared on the next renderDashboard so we don't bloat the saved
  // payload.
  renderReferencePhotos();
  triggerAutoSave();
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('file_read_error'));
    reader.onabort = () => reject(new Error('file_read_aborted'));
    try { reader.readAsDataURL(file); }
    catch (e) { reject(e); }
  });
}

function downscaleDataUrl(dataUrl, maxW, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Image decoded — drawing to canvas can still fail (CORS-tainted
      // sources, etc.). Anything that throws past this point falls
      // back to "use the original" in the caller.
      try {
        const ratio = Math.min(1, maxW / (img.width || maxW));
        const w = Math.max(1, Math.round((img.width || maxW)  * ratio));
        const h = Math.max(1, Math.round((img.height || maxW) * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) { reject(e); }
    };
    img.onerror = (e) => reject(new Error('image_decode_failed'));
    img.src = dataUrl;
  });
}

function removeReferencePhoto(idx) {
  if (!state.activeProject.referencePhotos) return;
  state.activeProject.referencePhotos.splice(idx, 1);
  renderReferencePhotos();
  triggerAutoSave();
}

// Best-effort auto-save trigger so the cloud row keeps the new photos
// even if the rep walks away mid-quote. Defensive about which save
// helper actually exists in this build.
function triggerAutoSave() {
  try {
    if (typeof markDirty === 'function') markDirty();
    else if (typeof scheduleAutoSave === 'function') scheduleAutoSave();
  } catch (e) { /* non-fatal */ }
}

function saveMeasurements() {
  const m = state.activeProject.measurements;
  const proj = state.activeProject.type;
  const get = (id) => +__doc.getElementById(id)?.value || 0;
  const getStr = (id) => __doc.getElementById(id)?.value || '';
  const isOn = (key) => __doc.querySelector(`[data-toggle="${key}"]`)?.classList.contains('checked') || false;
  if (proj === 'fence') {
    m.linearft = get('m_linearft'); m.height = get('m_height'); m.style = getStr('m_style') || 'privacy';
    m.oneSided = isOn('m_oneSided');
    m.oneSidedLnFt = get('m_oneSidedLnFt');
    // Clamp the partial value so it can never exceed the total — UI safety net
    if (m.oneSidedLnFt > m.linearft) m.oneSidedLnFt = m.linearft;
    updateOneSidedRow();
  }
  else if (proj === 'deck') { m.flat = get('m_flat'); m.rail = get('m_rail'); m.stairs = get('m_stairs'); m.lattice = get('m_lattice'); m.underneath = isOn('m_underneath'); }
  else if (proj === 'pergola') {
    m.length = get('m_pergLen'); m.width = get('m_pergWid'); m.height = get('m_pergHeight');
    m.overhead = isOn('m_overhead');
    // Stainable surface ≈ 1.55 × footprint when height isn't entered, otherwise
    // footprint + perimeter × height × 0.45 (posts + beams + rafters factor).
    // Always at least the footprint itself.
    const footprint = (m.length || 0) * (m.width || 0);
    if (footprint > 0) {
      const perim = 2 * ((m.length || 0) + (m.width || 0));
      const heightFactor = (m.height && m.height > 0) ? (perim * m.height * 0.45) : (footprint * 0.55);
      m.sqft = Math.round(footprint + heightFactor);
    } else {
      m.sqft = 0;
    }
    updatePergolaSqFtReadout();
  }
  else if (proj === 'barn') { m.sqft = get('m_barnSqFt'); m.trim = get('m_barnTrim'); m.cupolaCount = get('m_cupolaCount'); m.liftDays = get('m_liftDays'); m.heightPremium = isOn('m_height12'); }
  else if (proj === 'ceiling') { m.sqft = get('m_ceilSqFt'); m.beamLnFt = get('m_beamLnFt'); m.fixtures = get('m_fixtures'); m.fans = get('m_fans'); m.tng = isOn('m_tng'); m.furnProtect = isOn('m_furnProtect'); }
  updateRunningTotal();
}

function validateMeasurements() {
  const m = state.activeProject.measurements;
  const proj = state.activeProject.type;
  if (proj === 'fence') return m.linearft > 0 && m.height > 0;
  if (proj === 'deck') return m.flat > 0 || m.rail > 0 || m.stairs > 0;
  if (proj === 'pergola') return (m.length > 0 && m.width > 0) || m.sqft > 0;
  if (proj === 'barn') return m.sqft > 0;
  if (proj === 'ceiling') return m.sqft > 0;
  return false;
}

function updateOneSidedRow() {
  // Show the partial-linear-feet input only when "one side only" is toggled on.
  // Empty input = entire fence is one-sided. Sync the hint with current linear-foot total.
  const row = __doc.getElementById('oneSidedPartialRow');
  if (!row) return;
  const toggle = __doc.querySelector('[data-toggle="m_oneSided"]');
  const isOn = toggle && toggle.classList.contains('checked');
  row.style.display = isOn ? '' : 'none';
  const totalEl = __doc.getElementById('oneSidedTotalLnFtHint');
  if (totalEl) {
    const total = state.activeProject.measurements.linearft || 0;
    totalEl.textContent = total > 0 ? total : '—';
  }
}

function updatePergolaSqFtReadout() {
  const readout = __doc.getElementById('pergComputedReadout');
  const value = __doc.getElementById('pergComputedValue');
  if (!readout || !value) return;
  const sq = state.activeProject.measurements.sqft || 0;
  if (sq > 0) {
    const len = state.activeProject.measurements.length || 0;
    const wid = state.activeProject.measurements.width || 0;
    const h = state.activeProject.measurements.height || 0;
    value.innerHTML = `<strong style="font-size:18px;">${sq.toLocaleString()} sq ft</strong> stainable surface — calculated from ${len}×${wid}${h ? ` × ${h} ft tall` : ''} footprint.`;
    readout.style.display = 'block';
  } else {
    readout.style.display = 'none';
  }
}

/* ============================================================
   STAGE 4: CONDITION — IMAGE CARDS
   ============================================================ */
function recommendCondition() {
  const ps = state.activeProject.previousStain;
  const age = state.activeProject.woodAge;

  // Previously stained — prev-condition drives the recommendation
  if (ps.wasStained) {
    if (ps.prevCondition === 'peeling') return 'strip_sand';
    if (ps.prevCondition === 'intact') return 'soft_wash';
    return 'soft_wash'; // unsure / not specified
  }

  // Never stained: age drives the recommendation.
  // 'new'  (under 6 mo)   → no wash
  // 'weathered' (6 mo–2 yr) → soft wash (most common case)
  // 'aged'  (2+ years)    → soft wash baseline; strip & sand if signs of damage
  if (age === 'new') return 'no_wash';
  if (age === 'aged') return 'soft_wash';
  if (age === 'weathered') return 'soft_wash';
  return 'soft_wash'; // default if age not picked yet
}

// Which condition options the customer is allowed to pick given wood age.
// Aged (2+ yr) wood cannot be no-wash — staining over weathered/UV-damaged surface fibers fails.
function allowedConditions() {
  const age = state.activeProject.woodAge;
  if (age === 'aged') return ['soft_wash', 'strip_sand'];
  return ['no_wash', 'soft_wash', 'strip_sand'];
}

const CONDITION_BULLETS = {
  no_wash: {
    when: [
      'Brand-new fence, deck, or other wood (just installed)',
      'No greying, no UV damage, no previous stain',
      'Wood is free of mill scale, dirt, or surface debris'
    ],
    process: [
      'Light surface cleaning (included)',
      'No stripping, no sanding, no extra labor'
    ],
    timing: 'Adds zero days to the project'
  },
  soft_wash: {
    when: [
      'Wood is greyed, faded, or weathered from sun and rain',
      'Previously stained with the same product family and finish is still intact (no peeling)',
      'Mildew, mold, or surface algae visible',
      'Wood has been bare for 6+ months'
    ],
    process: [
      'Soft wash with sodium metasilicate (alkaline cleaner)',
      'Oxalic acid brightener to balance pH and lift greying',
      'Light rinse and full dry cycle (24–48 hrs)',
      'No sanding required'
    ],
    timing: 'Adds 1 day to the project'
  },
  strip_sand: {
    when: [
      'Existing finish is peeling, flaking, or chipping (full strip needed)',
      'Switching stain types (oil ↔ water) — old finish has to come off',
      'Surface is rough, has raised peaks, or shows multiple uneven coats',
      'Re-coating a similar stain in good shape — a sanding to flatten peaks is usually enough'
    ],
    process: [
      'Assess the existing finish first — stripping isn\'t always necessary',
      'Strip only the areas where the finish is failing',
      'Sand to flatten peaks, smooth raised grain, and open the surface for bonding',
      'Brightener wash + full dry cycle before stain goes on'
    ],
    timing: 'Adds 1–2 days to the project (depending on what we find)'
  }
};

function renderConditionCards() {
  const proj = state.activeProject.type;
  const prep = PRICING[proj].prep;
  const unit = PRICING[proj].unit;
  const prepBase = computePrepBase();
  const order = ['no_wash', 'soft_wash', 'strip_sand'];
  const reco = recommendCondition();
  const allowed = allowedConditions();

  // Recommendation banner — explains WHY we picked this prep level for
  // their specific wood-age + previous-stain situation.
  const ps = state.activeProject.previousStain;
  const age = state.activeProject.woodAge;
  const recoBanner = __doc.getElementById('conditionRecoBanner');
  const recoBannerText = __doc.getElementById('conditionRecoBannerText');
  if (recoBanner && recoBannerText) {
    const recoLabel = CONDITION_META[reco] ? CONDITION_META[reco].label : '';
    let why = '';
    if (ps.wasStained && ps.prevCondition === 'peeling') {
      why = `<strong>We recommend ${recoLabel}.</strong>You told us the existing finish is peeling/flaking. New stain over a failing finish will fail with it within months — the only way to get a clean, long-lasting result is to take the old stain off and start on bare wood.`;
    } else if (ps.wasStained && ps.prevCondition === 'intact') {
      why = `<strong>We recommend ${recoLabel}.</strong>The existing finish is still bonded — no full strip needed. A soft wash with sodium metasilicate cleaner + oxalic acid brightener clears dead surface fibers and re-opens the wood pores so the recoat bonds cleanly.`;
    } else if (ps.wasStained) {
      why = `<strong>We recommend ${recoLabel}.</strong>The wood has been stained before. Soft wash is the safe default — it cleans the surface and re-opens the pores. If on-site we find the existing finish is peeling, we'll bump up to a full strip.`;
    } else if (age === 'new') {
      why = `<strong>We recommend ${recoLabel}.</strong>Brand-new wood (under 6 months) has no UV damage, mildew, or greying yet — the surface is already ready for stain. A light cleaning is all that's needed; no chemical prep premium.`;
    } else if (age === 'weathered') {
      why = `<strong>We recommend ${recoLabel}.</strong>Wood 6 months to 2 years old has typically picked up surface greying and dead fibers from UV exposure — even if it doesn't look obvious. A soft wash with brightener restores the pH and lets new stain penetrate properly, which is the difference between a 4-year finish and an 18-month finish.`;
    } else if (age === 'aged') {
      why = `<strong>We recommend ${recoLabel}.</strong>2+ year old wood has significant surface damage from UV and weather. No-wash isn't an option here — staining over weathered surface fibers means the new finish flakes off with them. Soft wash is the minimum; if we find peeling stain or deeply damaged wood on-site we'll move to strip & sand.`;
    } else {
      why = `<strong>We recommend ${recoLabel}.</strong>Based on the wood's condition this is the prep level that gives you the best stain longevity for the cost.`;
    }
    recoBannerText.innerHTML = why;
    recoBanner.style.display = 'flex';
  }

  __doc.getElementById('conditionCards').innerHTML = order.map(key => {
    const cond = CONDITION_META[key];
    const rate = prep[key];
    // Decks have multiple component rates; show TOTAL prep cost for decks, $/unit for everything else
    const isDeck = (proj === 'deck');
    const totalPrep = rate * prepBase;
    let costLabel;
    if (rate === 0) costLabel = 'No prep premium';
    else if (isDeck && prepBase > 0) costLabel = `+$${totalPrep.toFixed(2)} prep`;
    else if (isDeck) costLabel = `Prep priced at $${rate.toFixed(2)}/sq ft`;
    else costLabel = `+$${rate.toFixed(2)}/${unit} prep`;

    const bullets = CONDITION_BULLETS[key] || { when: [], process: [], timing: '' };
    const isLocked = !allowed.includes(key);
    const isReco = (key === reco) && !isLocked;
    const isSelected = (state.activeProject.condition === key);

    return `
      <button class="condition-card ${isReco ? 'recommended' : ''} ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}" data-cond="${key}" data-mobile-collapse="true" ${isLocked ? 'aria-disabled="true" tabindex="-1"' : ''}>
        ${isLocked ? '<div class="locked-badge">Unavailable for this age</div>' : (isReco ? '<div class="reco-flag">Recommended</div>' : '')}
        <div class="card-image" style="background-image:url('${cond.img}')"></div>
        <div class="cond-body">
          <div class="cond-name">${cond.label} <span class="info-btn" role="button" tabindex="0" data-info="cond_${key}" aria-label="More info">i</span></div>
          <!-- Preview line — always visible, even on collapsed mobile. -->
          <div class="cond-prep" style="font-weight:600;color:var(--navy);margin: 6px 0 8px;">${cond.serviceDesc}</div>
          <div class="cust-mc">
            <div class="cond-bullets-group">
              <div class="cond-bullets-label">When you'd pick this</div>
              <ul class="cond-bullets">${bullets.when.map(b => `<li>${b}</li>`).join('')}</ul>
            </div>
            <div class="cond-bullets-group">
              <div class="cond-bullets-label">What we do</div>
              <ul class="cond-bullets process">${bullets.process.map(b => `<li>${b}</li>`).join('')}</ul>
            </div>
          </div>
          <span class="cust-mc-toggle" role="button" tabindex="0" onclick="toggleMobileExpand(event)" aria-label="Toggle details">
            <span class="lbl-collapsed">Show details</span>
            <span class="lbl-expanded">Hide details</span>
            <span class="chev">▾</span>
          </span>
          <div class="cond-card-footer">
            ${bullets.timing ? `<div class="cond-timing">⏱ ${bullets.timing}</div>` : ''}
            <div class="cond-add">${costLabel}</div>
          </div>
        </div>
      </button>`;
  }).join('');

  __doc.querySelectorAll('#conditionCards .condition-card').forEach(card => {
    if (card.classList.contains('locked')) return; // gated by wood age
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('info-btn')) return;
      // Tap on the expand toggle is handled by toggleMobileExpand and
      // stops propagation; this guard is belt-and-suspenders.
      if (e.target.closest('.cust-mc-toggle')) return;
      const newCond = card.dataset.cond;
      state.activeProject.condition = newCond;
      // Lock in the user's explicit pick so we don't snap back to
      // the recommendation on re-render.
      state.activeProject.conditionConfirmed = true;
      // Selection stays collapsed — user prefers all cards collapsed
      // by default so the page stays compact. They can tap the toggle
      // to expand any card they want a closer look at.
      __doc.querySelectorAll('#conditionCards .condition-card').forEach(c => c.classList.remove('selected', 'expanded'));
      card.classList.add('selected');
      __doc.getElementById('stage4Next').disabled = false;
      updateRunningTotal();
    });
  });
  // Auto-select the recommended option if nothing is selected (or current pick is locked)
  if (!state.activeProject.condition || !allowed.includes(state.activeProject.condition)) {
    const prev = state.activeProject.condition;
    state.activeProject.condition = reco;
    const recoCard = __doc.querySelector(`#conditionCards .condition-card[data-cond="${reco}"]`);
    if (recoCard) recoCard.classList.add('selected');
    // Make the header pill catch up to the auto-applied choice without
    // requiring the rep to click the already-highlighted card.
    if (prev !== reco) try { updateRunningTotal(); } catch (e) {}
  }
  __doc.getElementById('stage4Next').disabled = false;
}

function computePrepBase() {
  const proj = state.activeProject.type;
  const m = state.activeProject.measurements;
  if (proj === 'fence') return (m.linearft || 0);
  if (proj === 'deck') {
    let baseSqFt = (m.flat || 0);
    if (m.underneath) baseSqFt *= 2;
    baseSqFt += (m.lattice || 0);
    return baseSqFt;
  }
  if (proj === 'pergola' || proj === 'barn' || proj === 'ceiling') return (m.sqft || 0);
  return 0;
}

/* ============================================================
   STAGE 5: PRODUCT + HOA + PREVIOUS STAIN
   ============================================================ */
function renderProductStage() {
  const condition = state.activeProject.condition;
  const ps = state.activeProject.previousStain;
  const recommended = recommendedProduct();
  const banner = __doc.getElementById('recoBanner');
  const bannerText = __doc.getElementById('recoBannerText');
  banner.style.display = 'flex';
  if (recommended === 'water') {
    bannerText.innerHTML = `<strong>We recommend Water-Based.</strong>The wood was previously stained with a water-based product. Re-coating with water-based avoids needing to strip the existing finish completely. Switching to oil-based would require a full strip — possible, but more labor and cost.`;
  } else if (ps.wasStained && ps.previousProductType === 'oil') {
    bannerText.innerHTML = `<strong>We recommend Oil-Based.</strong>The wood already has oil-based stain on it. Recoating with oil avoids the full strip that would be required to switch to water-based.`;
  } else if (ps.wasStained && ps.previousProductType === 'unsure') {
    bannerText.innerHTML = `<strong>We recommend Oil-Based as a safe default.</strong>Since the previous product isn\'t known, oil is more forgiving — it bonds well to most existing finishes. We'll inspect the existing finish on-site to confirm before finalizing prep.`;
  } else if (condition === 'soft_wash') {
    bannerText.innerHTML = `<strong>We recommend Oil-Based for greyed wood.</strong>Weathered wood has opened pores — oil penetrates and seals more effectively than water-based.`;
  } else {
    bannerText.innerHTML = `<strong>We recommend Oil-Based for new wood.</strong>Oil penetrates deeper and protects against UV and moisture longer than water-based — particularly valuable in the Southeast where summer sun is harsh.`;
  }

  // Build the 3 product cards from PRODUCT_FAMILY_META so we can include pros/cons bullets
  const order = ['water', 'oil', 'hoa'];
  __doc.getElementById('productChoiceCards').innerHTML = order.map(prod => {
    const meta = PRODUCT_FAMILY_META[prod];
    const isSelected = state.activeProject.productType === prod;
    const isReco = (prod === recommended) && (prod !== 'hoa');
    return `
      <button class="product-choice-card ${isReco ? 'recommended' : ''} ${isSelected ? 'selected' : ''}" data-product="${prod}" data-mobile-collapse="true">
        ${isReco ? '<div class="reco-flag">Recommended</div>' : ''}
        <div class="prod-image" style="background-image:url('${meta.img}')"></div>
        <div class="prod-body">
          <div class="icon">${meta.icon}</div>
          <div class="h">${meta.heading}</div>
          <!-- Preview line — always visible, even on collapsed mobile. -->
          <div class="d">${meta.summary}</div>
          <div class="cust-mc">
            <ul class="prod-pros">${meta.pros.map(p => `<li>${p}</li>`).join('')}</ul>
            <ul class="prod-cons">${meta.cons.map(c => `<li>${c}</li>`).join('')}</ul>
            <div class="prod-recommend-note"><strong>When to pick this:</strong> ${meta.recommendNote}</div>
          </div>
          <span class="cust-mc-toggle" role="button" tabindex="0" onclick="toggleMobileExpand(event)" aria-label="Toggle details">
            <span class="lbl-collapsed">Show details</span>
            <span class="lbl-expanded">Hide details</span>
            <span class="chev">▾</span>
          </span>
        </div>
      </button>`;
  }).join('');

  __doc.querySelectorAll('#productChoiceCards .product-choice-card').forEach(card => {
    const prod = card.dataset.product;
    card.onclick = (e) => {
      // Skip if they tapped the mobile expand toggle — that's not a select.
      if (e && e.target && e.target.closest && e.target.closest('.cust-mc-toggle')) return;
      const prev = state.activeProject.productType;
      // Save current color BEFORE switching, then restore the one previously
      // chosen for the new product (if any).
      rememberCurrentColor();
      state.activeProject.productType = prod;
      // Lock in the user's explicit pick so we don't snap back to
      // the recommendation on re-render.
      state.activeProject.productConfirmed = true;
      if (prev !== prod) restoreColorForCurrentLib();
      // When switching product family, drop incompatible addons
      delete state.activeProject.addons.citronella;
      // When switching to HOA, force tier to performance and auto-confirm
      // (HOA has no real tier choice, so we treat it as confirmed immediately)
      if (prod === 'hoa') { state.activeProject.tier = 'performance'; state.activeProject.tierConfirmed = true; }
      // Switching FROM HOA back to water/oil: require explicit tier re-confirmation
      else if (state.activeProject.tierConfirmed && prev === 'hoa') state.activeProject.tierConfirmed = false;
      // All cards stay collapsed (toggle is the only way to expand).
      __doc.querySelectorAll('#productChoiceCards .product-choice-card').forEach(c => {
        const picked = c.dataset.product === prod;
        c.classList.toggle('selected', picked);
        c.classList.remove('expanded');
      });
      // Show/hide HOA panel based on selection
      __doc.getElementById('hoaPanel').style.display = (prod === 'hoa') ? 'block' : 'none';
      updateStage5NextButton();
      updateRunningTotal();
    };
  });

  // wasStained moved to Step 3 — no need to handle here anymore

  // HOA panel — show when HOA product is selected
  __doc.getElementById('hoaPanel').style.display = isHoa() ? 'block' : 'none';
  populateBrandDropdown('hoaBrand', state.activeProject.hoa.brand);
  populateTransparencyDropdown('hoaTransparency', state.activeProject.hoa.transparency);
  __doc.getElementById('hoaProductName').value = state.activeProject.hoa.productName || '';
  __doc.getElementById('hoaColor').value = state.activeProject.hoa.color || '';
  __doc.getElementById('hoaNotes').value = state.activeProject.hoa.notes || '';

  attachStage5Listeners();
  updateStage5NextButton();
}

function populateBrandDropdown(id, selected) {
  __doc.getElementById(id).innerHTML = '<option value="">— Select brand —</option>' + STAIN_BRANDS.map(b => `<option value="${b}"${b === selected ? ' selected' : ''}>${b}</option>`).join('');
}
function populateTransparencyDropdown(id, selected) {
  __doc.getElementById(id).innerHTML = '<option value="">— Select transparency —</option>' + STAIN_TRANSPARENCIES.map(t => `<option value="${t}"${t === selected ? ' selected' : ''}>${t}</option>`).join('');
}

function attachStage5Listeners() {
  __doc.getElementById('hoaBrand').onchange = (e) => { state.activeProject.hoa.brand = e.target.value; updateStage5NextButton(); };
  __doc.getElementById('hoaTransparency').onchange = (e) => { state.activeProject.hoa.transparency = e.target.value; };
  __doc.getElementById('hoaProductName').oninput = (e) => { state.activeProject.hoa.productName = e.target.value; };
  __doc.getElementById('hoaColor').oninput = (e) => { state.activeProject.hoa.color = e.target.value; updateStage5NextButton(); };
  __doc.getElementById('hoaNotes').oninput = (e) => { state.activeProject.hoa.notes = e.target.value; };
  // wasStained handlers were moved to attachMeasureListeners (Step 3)
}

function updateStage5NextButton() {
  const btn = __doc.getElementById('stage5Next');
  let canProceed = !!state.activeProject.productType;
  if (isHoa()) canProceed = canProceed && !!state.activeProject.hoa.brand && !!state.activeProject.hoa.color;
  btn.disabled = !canProceed;
}

/* ============================================================
   STAGE 6: TIER — enhanced comparison
   ============================================================ */
function renderTierCards() {
  const product = state.activeProject.productType;
  const locked = product === 'water' ? '💧 Water-Based' : (product === 'oil' ? '🛢️ Oil-Based' : '🏘️ HOA-Required');
  __doc.getElementById('productLockText').innerHTML = `<strong>${locked}</strong> selected — change on <a href="javascript:void(0)" onclick="showStage(5)" style="color:var(--green);font-weight:700;text-decoration:underline;">Step 5</a>.`;

  renderPrevStainContext();

  if (product === 'hoa') {
    renderHoaTierCards();
    return;
  }

  // Safety net: if measurements are empty AND we haven't already completed this
  // project (maxStageReached < 10), warn and send the user back to Step 3.
  // Once a project has been through review, we trust its state on subsequent
  // visits — re-validating would flag a bug where bundled-project re-edits
  // briefly look "empty" while the form rehydrates.
  const previouslyCompleted = state.maxStageReached >= 10 && state.activeProject.tierConfirmed;
  if (!validateMeasurements() && !previouslyCompleted) {
    __doc.getElementById('tierCards').innerHTML = `
      <div style="grid-column: 1 / -1; padding: 32px 28px; background: var(--gold-pale); border: 2px dashed var(--gold); border-radius: var(--radius-lg); text-align: center;">
        <h3 style="color: var(--navy); margin-bottom: 8px;">📏 Measurements needed before tier prices can be calculated</h3>
        <p style="color: #5a4a1f; font-size: 14px; margin-bottom: 16px;">Tier prices are calculated from the measurements you provide. We need those entered before we can show real numbers here.</p>
        <button class="btn btn-primary" onclick="showStage(3)" style="padding: 12px 24px;">← Go back to Step 3: Measurements</button>
      </div>`;
    __doc.getElementById('stage6Next').disabled = true;
    return;
  }

  const meta = TIER_META[product];
  const proj = state.activeProject.type;
  const sample = computeSampleTierPrices(product);
  // Midpoint years for cost-per-year math — matches the life ranges shown on each card.
  // Water:  Essential ~2y, Performance ~4.5y, Showcase ~6y
  // Oil:    Essential ~2y, Performance ~3.5y, Showcase ~4.5y
  const lifespanYears = product === 'water'
    ? { essential: 2, performance: 4.5, showcase: 6 }
    : { essential: 2, performance: 3.5, showcase: 4.5 };

  __doc.getElementById('tierCards').innerHTML = ['essential', 'performance', 'showcase'].map(t => {
    const tm = meta[t];
    const isReco = (t === 'performance');
    const isSelected = (state.activeProject.tier === t);
    const totalPrice = sample[t];
    const unit = tierUnitPrice(proj, t);
    const costPerYear = totalPrice > 0 ? Math.round(totalPrice / lifespanYears[t]) : 0;
    // Showcase tier: first two bullets render with ★ as the headline benefits,
    // remaining bullets render with ✓ as standard checkmarks. Other tiers keep
    // a single ★ on the lead bullet.
    const prosHtml = tm.pros.map((p, i) => {
      const isStandout = (t === 'showcase') ? (i < 2) : (i === 0);
      return `<li${isStandout ? ' class="standout"' : ''}>${p}</li>`;
    }).join('');
    const detailsHtml = tm.details ? `<div class="tier-life-tooltip">${tm.details}</div>` : '';
    // Decks have multiple components (flat + railing + stairs + lattice) so a single $/sq ft headline is misleading.
    // For decks, show total project cost. For everything else, show per-unit rate.
    const showTotalAsHeadline = (proj === 'deck');
    const headlinePrice = showTotalAsHeadline
      ? `$${Math.round(totalPrice).toLocaleString()}<span style="font-size:14px;color:var(--slate);font-weight:600;"> total</span>`
      : `$${unit.rate.toFixed(2)}<span style="font-size:14px;color:var(--slate);font-weight:600;">/${unit.unit}</span>`;
    const secondaryLine = showTotalAsHeadline
      ? `≈ $${costPerYear.toLocaleString()}/yr amortized`
      : `≈ $${Math.round(totalPrice).toLocaleString()} total · ≈ $${costPerYear.toLocaleString()}/yr amortized`;
    // What's Included — real value-adds per tier, tied to product-specific warranties.
    // EXPERT Stain & Seal: 2-yr semi-trans / 3-yr semi-solid manufacturer warranty.
    // Limited Lifetime guarantee available with the EXPERT 3-Step System (clean / brighten / stain & seal).
    let included;
    if (product === 'oil' && t === 'essential') {
      // Clear sealer — no color, no warranty against color failure
      included = [
        '✓ Siding &amp; hardware protection during application',
        '✓ Full job-site cleanup after we leave',
        '✓ EXPERT 3-Step System prep included',
        '✓ Fully insured &amp; licensed in South Carolina'
      ];
    } else if (product === 'oil' && t === 'performance') {
      included = [
        '✓ <strong>EXPERT manufacturer warranty</strong> — 2 yrs on semi-trans, 3 yrs on semi-solid',
        '✓ Siding &amp; hardware protection during application',
        '✓ Free 30-day touch-up visit if you spot any miss',
        '✓ EXPERT 3-Step System (qualifies for Limited Lifetime guarantee)',
        '✓ Fully insured &amp; licensed work'
      ];
    } else if (product === 'oil' && t === 'showcase') {
      included = [
        '✓ <strong>EXPERT Log &amp; Timber Oil</strong> — 3-year manufacturer warranty',
        '✓ Eligible for the <strong>EXPERT Limited Lifetime guarantee</strong> via the 3-Step System (qualifying new wood, conditions apply)',
        '✓ Siding &amp; hardware protection during application',
        '✓ Free 30-day touch-up visit',
        '✓ Natural carpenter-bee &amp; wood-boring-insect deterrence',
        '✓ Fully insured &amp; licensed work'
      ];
    } else if (product === 'water' && t === 'essential') {
      included = [
        '✓ Siding &amp; hardware protection during application',
        '✓ Full job-site cleanup',
        '✓ Single-coat SW Woodscapes Solid application',
        '✓ Fully insured &amp; licensed work'
      ];
    } else if (product === 'water' && t === 'performance') {
      included = [
        '✓ Two full coats of SW Woodscapes Solid for proper film build',
        '✓ Siding &amp; hardware protection during application',
        '✓ Free 30-day touch-up visit',
        '✓ Fully insured &amp; licensed work'
      ];
    } else if (product === 'water' && t === 'showcase') {
      included = [
        '✓ Two coats of <strong>SW Woodscapes Rain Refresh</strong> with Self-Cleaning Technology',
        '✓ <strong>10-year limited manufacturer warranty</strong> (per Sherwin-Williams)',
        '✓ Siding &amp; hardware protection during application',
        '✓ Free 30-day touch-up visit',
        '✓ Fully insured &amp; licensed work'
      ];
    } else {
      included = [
        '✓ Siding &amp; hardware protection during application',
        '✓ Full job-site cleanup',
        '✓ Fully insured &amp; licensed work'
      ];
    }
    return `
      <button class="tier-card ${isReco ? 'recommended' : ''} ${isSelected ? 'selected' : ''}" data-tier="${t}" data-mobile-collapse="true">
        ${isReco ? '<div class="reco-flag">Recommended</div>' : ''}
        <div class="tier-name">${t}</div>
        <div class="tier-product">${tm.product}</div>
        <div class="tier-tagline">${tm.tagline}</div>
        <div class="tier-price">${headlinePrice}</div>
        <div class="tier-cost-per-year">${secondaryLine}</div>
        <div class="cust-mc">
          <div class="tier-life">⏱ ${tm.life}${detailsHtml}</div>
          <ul class="tier-pros">${prosHtml}</ul>
          ${tm.cons.length ? `<ul class="tier-cons">${tm.cons.map(c => `<li>${c}</li>`).join('')}</ul>` : ''}
          <div class="whats-included">
            <div class="whats-included-label">What's included</div>
            <ul>${included.map(i => `<li>${i}</li>`).join('')}</ul>
          </div>
          <div class="best-for"><strong>Best for</strong>${tm.bestFor}</div>
        </div>
        <span class="cust-mc-toggle" role="button" tabindex="0" onclick="toggleMobileExpand(event)" aria-label="Toggle details">
          <span class="lbl-collapsed">Show details</span>
          <span class="lbl-expanded">Hide details</span>
          <span class="chev">▾</span>
        </span>
      </button>`;
  }).join('');

  __doc.querySelectorAll('#tierCards .tier-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Skip selection if they tapped the mobile expand toggle.
      if (e && e.target && e.target.closest && e.target.closest('.cust-mc-toggle')) return;
      const newTier = card.dataset.tier;
      const tierChanged = state.activeProject.tier !== newTier;
      if (tierChanged) {
        rememberCurrentColor();
        state.activeProject.tier = newTier;
        restoreColorForCurrentLib();
      } else {
        state.activeProject.tier = newTier;
      }
      state.activeProject.tierConfirmed = true;
      // Stay collapsed on select; toggle is the only way to expand.
      __doc.querySelectorAll('#tierCards .tier-card').forEach(c => c.classList.remove('selected', 'expanded'));
      card.classList.add('selected');
      __doc.getElementById('stage6Next').disabled = false;
      __doc.getElementById('stage6Next').innerHTML = shouldSkipColorStage() ? 'Next: Add-ons <span class="arr-r">→</span>' : 'Next: Color <span class="arr-r">→</span>';
      updateRunningTotal();
    });
  });
  __doc.getElementById('stage6Next').disabled = !state.activeProject.tier;
  __doc.getElementById('stage6Next').innerHTML = shouldSkipColorStage() ? 'Next: Add-ons <span class="arr-r">→</span>' : 'Next: Color <span class="arr-r">→</span>';
}

function renderHoaTierCards() {
  // Show 3 cards but only the middle (HOA-Specified) is enabled
  const price = computeTierBase(); // tier already locked to 'performance' when HOA picked
  const hoa = HOA_TIER_META.performance;
  __doc.getElementById('tierCards').innerHTML = `
    <div class="tier-card disabled" aria-disabled="true">
      <div class="tier-name">Essential</div>
      <div class="tier-product">Not applicable</div>
      <div class="tier-tagline">Your HOA dictates the product — tier choice doesn't apply.</div>
    </div>
    <button class="tier-card recommended selected" data-tier="performance">
      <div class="reco-flag">HOA Locked</div>
      <div class="tier-name">HOA-Specified</div>
      <div class="tier-product">${hoa.product}</div>
      <div class="tier-tagline">${hoa.tagline}</div>
      <div class="tier-price">$${price.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
      <div class="tier-cost-per-year">Priced at our Performance-tier rate</div>
      <div class="tier-life">⏱ ${hoa.life}${hoa.details ? `<div class="tier-life-tooltip">${hoa.details}</div>` : ''}</div>
      <ul class="tier-pros">${hoa.pros.map(p => `<li>${p}</li>`).join('')}</ul>
      <ul class="tier-cons">${hoa.cons.map(c => `<li>${c}</li>`).join('')}</ul>
      <div class="best-for"><strong>Best for</strong>${hoa.bestFor}</div>
    </button>
    <div class="tier-card disabled" aria-disabled="true">
      <div class="tier-name">Showcase</div>
      <div class="tier-product">Not applicable</div>
      <div class="tier-tagline">Your HOA dictates the product — tier choice doesn't apply.</div>
    </div>`;
  // HOA flow is locked to performance, button always enabled
  state.activeProject.tier = 'performance';
  __doc.getElementById('stage6Next').disabled = false;
  __doc.getElementById('stage6Next').innerHTML = 'Next: Add-ons <span class="arr-r">→</span>';
}

function renderPrevStainContext() {
  const container = __doc.getElementById('prevStainContext');
  if (!container) return;
  const ps = state.activeProject.previousStain;
  const product = state.activeProject.productType;
  if (!ps.wasStained || product === 'hoa') { container.innerHTML = ''; return; }

  const prevType = ps.previousProductType;
  const isSameType = (prevType === 'water' && product === 'water') || (prevType === 'oil' && product === 'oil');
  const isSwitching = (prevType === 'water' && product === 'oil') || (prevType === 'oil' && product === 'water');
  const typeLabel = prevType === 'water' ? 'water-based' : (prevType === 'oil' ? 'oil-based' : 'an unknown product');
  const brandLabel = ps.brand ? ` (${ps.brand}${ps.transparency ? ' ' + ps.transparency : ''})` : '';

  // Tailored notes based on what they told us
  const notes = [];
  if (isSameType) {
    notes.push(`<strong>Good news — you're staying with the same stain type.</strong> If the existing finish is in good condition, Step 4's <strong>Soft Wash</strong> will be enough. No full strip needed.`);
  } else if (isSwitching) {
    notes.push(`<strong>Heads up — you're switching from ${prevType}-based to ${product}-based.</strong> The two chemistries don't bond well, so the existing finish has to come off completely. Make sure <strong>Strip &amp; Sand</strong> is selected on Step 4.`);
  } else if (prevType === 'unsure') {
    notes.push(`<strong>We'll inspect the existing finish on-site</strong> to confirm what's there before finalizing prep. If it's the same type as your new choice and still bonding well, Soft Wash works. If we find peeling or signs of incompatibility, we'll move to Strip &amp; Sand.`);
  }

  notes.push(`Re-coats over previously stained wood typically last <strong>~80% as long</strong> as the same product applied to bare wood. The lifespan numbers on the tier cards already factor this in for your situation.`);

  if (ps.brand || ps.colorNotes) {
    notes.push(`Want to <strong>match the existing color</strong> exactly? Pick the free <em>"Custom color match (you provide a sample)"</em> add-on on Step 8 and bring a chip or photo to scheduling.`);
  }

  container.innerHTML = `
    <div class="alert" style="background: linear-gradient(135deg, #e6f0f7 0%, #f0f6fb 100%); border-left: 4px solid #3a7095; color: #234862; margin-bottom: 20px;">
      <span class="ico">🪵</span>
      <div>
        <strong style="color: var(--navy); display:block; margin-bottom: 6px;">Previously stained with ${typeLabel}${brandLabel} — here's what it means for your tier choice</strong>
        <ul style="margin: 6px 0 0 18px; padding: 0; font-size: 13px; line-height: 1.55;">
          ${notes.map(n => `<li style="margin-bottom: 4px;">${n}</li>`).join('')}
        </ul>
      </div>
    </div>`;
}

function tierUnitPrice(proj, tier) {
  // Returns the headline per-unit rate for a tier (most representative number)
  if (proj === 'fence')   return { rate: PRICING.fence.tiers[tier], unit: 'ln ft' };
  if (proj === 'deck')    return { rate: PRICING.deck.tiers[tier], unit: 'sq ft' };
  if (proj === 'pergola') return { rate: PRICING.pergola.tiers[tier], unit: 'sq ft' };
  if (proj === 'barn')    return { rate: PRICING.barn.tiers[tier], unit: 'sq ft' };
  if (proj === 'ceiling') return { rate: PRICING.ceiling.tiers[tier], unit: 'sq ft' };
  return { rate: 0, unit: '' };
}

function computeSampleTierPrices(product) {
  const out = {};
  ['essential', 'performance', 'showcase'].forEach(t => {
    const saved = state.activeProject.tier;
    const savedP = state.activeProject.productType;
    state.activeProject.tier = t;
    state.activeProject.productType = product;
    out[t] = computeTierBase();
    state.activeProject.tier = saved;
    state.activeProject.productType = savedP;
  });
  return out;
}

/* ============================================================
   STAGE 7: COLOR — IMAGE SWATCHES (EXPERT real images)
   ============================================================ */
function renderColorStage() {
  if (shouldSkipColorStage()) { showStage(8); return; }
  const libKey = getColorLibrary(state.activeProject.productType, state.activeProject.tier);
  const lib = COLORS[libKey];
  __doc.getElementById('colorTitle').textContent = `Pick a color — ${lib.line}`;

  // Flatten to count + handle grouped vs flat color libraries
  const allColors = lib.grouped
    ? lib.groups.flatMap(g => g.colors)
    : lib.colors;
  __doc.getElementById('colorLead').innerHTML = `${allColors.length} colors available. ${lib.note || ''}`;

  const renderSwatch = (c) => {
    const isSelected = state.activeProject.selectedColor && state.activeProject.selectedColor.name === c.name;
    const chipStyle = c.img ? `background-image:url('${c.img}')` : `background-color:${c.hex}`;
    const chipClass = c.img ? '' : 'hex-only';
    const codeLine = c.code ? `<div class="code">${c.code}</div>` : '';
    return `
      <div class="color-swatch ${isSelected ? 'selected' : ''} ${c.isCustom ? 'custom-swatch' : ''}" data-color="${c.name}">
        <div class="chip ${chipClass}" style="${chipStyle}"></div>
        <div class="name">${c.name}</div>${codeLine}
      </div>`;
  };

  let html = '';
  if (lib.grouped) {
    html = lib.groups.map(g => `
      <div class="color-group">
        <h4 class="color-group-label">${g.label} <small>· ${g.colors.length}</small></h4>
        <div class="color-grid">${g.colors.map(renderSwatch).join('')}</div>
      </div>
    `).join('');
  } else {
    html = `<div class="color-grid">${lib.colors.map(renderSwatch).join('')}</div>`;
  }

  // Custom color code entry — shown when a Custom swatch is selected
  const customPicked = state.activeProject.selectedColor && state.activeProject.selectedColor.isCustom;
  html += `
    <div class="custom-color-entry ${customPicked ? 'visible' : ''}" id="customColorEntry">
      <h4 style="font-size:14px;color:var(--navy);margin-bottom:6px;">Custom color code or sample</h4>
      <p style="font-size:13px;color:var(--slate);margin-bottom:12px;">Enter the SW code (e.g. <code style="background:var(--line-soft);padding:2px 6px;border-radius:4px;">SW 3080</code>), a paint chip name, or a description. For water-based, we'll match it using the SW color-match tool.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <input type="text" id="customColorInput" placeholder="e.g. SW 3080 Traditional Mahogany" value="${state.activeProject.customColorCode || ''}" style="flex:1;min-width:200px;padding:12px 14px;border:2px solid var(--line);border-radius:10px;font-size:15px;">
        <button class="btn btn-primary" onclick="applyCustomColor()" style="padding:12px 24px;">Apply</button>
      </div>
    </div>`;

  __doc.getElementById('colorGrid').outerHTML = `<div id="colorGrid">${html}</div>`;

  __doc.querySelectorAll('#colorGrid .color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      const name = sw.dataset.color;
      const c = allColors.find(x => x.name === name);
      state.activeProject.selectedColor = { ...c, line: lib.line };
      __doc.querySelectorAll('#colorGrid .color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      // Show custom entry if Custom swatch was picked
      const entry = __doc.getElementById('customColorEntry');
      if (entry) entry.classList.toggle('visible', !!c.isCustom);
      // Enable Next unless they picked Custom without a code yet
      const needsCode = c.isCustom && !state.activeProject.customColorCode;
      __doc.getElementById('stage7Next').disabled = needsCode;
    });
  });
  const sc = state.activeProject.selectedColor;
  const needsCode = sc && sc.isCustom && !state.activeProject.customColorCode;
  __doc.getElementById('stage7Next').disabled = !sc || needsCode;
}

function applyCustomColor() {
  const code = __doc.getElementById('customColorInput').value.trim();
  if (!code) { alert('Enter a color code or description.'); return; }
  state.activeProject.customColorCode = code;
  // Update the stored selectedColor to include the user's entered code
  if (state.activeProject.selectedColor) {
    state.activeProject.selectedColor = { ...state.activeProject.selectedColor, code: code, name: 'Custom: ' + code };
  }
  __doc.getElementById('stage7Next').disabled = false;
  fireConfetti();
}

/* ============================================================
   STAGE 8: ADD-ONS (no discounts here anymore)
   ============================================================ */
function renderAddons() {
  const proj = state.activeProject.type;
  const product = state.activeProject.productType;
  // Only show stain upgrades compatible with the selected product (HOA hides stain upgrades)
  const stainUpgrades = isHoa() ? [] : PRICING.stainUpgrades.filter(a => !a.product || a.product === product);
  const projAddons = PRICING.projectAddons[proj] || [];
  const serviceAddons = PRICING.serviceAddons;
  const customAddons = state.activeProject.customAddons || [];

  const stainSection = stainUpgrades.length ? `
    <div class="addon-section">
      <h4>🧪 Stain Product Upgrades</h4>
      <div class="addon-grid">${stainUpgrades.map(a => addonRow(a, 'stain')).join('')}</div>
    </div>` : (isHoa() ? `
    <div class="addon-section">
      <h4>🧪 Stain Product Upgrades</h4>
      <p style="font-size:13px;color:var(--slate);">Stain product upgrades aren't applicable here — the HOA specifies the exact product, so add-ons that modify the stain don't apply.</p>
    </div>` : '');

  __doc.getElementById('addonsContainer').innerHTML = `
    <div class="addon-section service-includes-section">
      <h4>✨ Included free with every quote</h4>
      <p style="font-size:13px;color:var(--slate);margin-bottom:12px;">These services are always included — they're not extras you pay for, they're what good staining looks like done right.</p>
      <div class="addon-grid service-includes-grid">${serviceAddons.map(a => `
        <div class="service-include-row" data-mobile-collapse="true" onclick="toggleMobileExpand(event)" role="button" tabindex="0">
          <span class="check">✓</span>
          <div class="addon-desc">
            <div class="ad-name">${a.name}</div>
            ${a.desc ? `<div class="ad-sub cust-mc">${a.desc}</div>` : ''}
          </div>
          <span class="price">FREE</span>
        </div>
      `).join('')}</div>
    </div>
    ${stainSection}
    <div class="addon-section">
      <h4>${PROJECT_META[proj].icon} ${PROJECT_META[proj].name} Add-ons</h4>
      <div class="addon-grid">${projAddons.map(a => addonRow(a, 'project')).join('')}</div>
    </div>`;
  // Note: "🛠️ Custom Items" section is intentionally omitted from the
  // customer build — it's an employee-only tool for adding off-list
  // line items. The rep build still renders + uses it. Calculation,
  // serialization, and rendering code further down still references
  // `state.activeProject.customAddons` defensively, but in the
  // customer flow nothing ever populates that array.
  attachAddonListeners();
}

function renderCustomItemsList() {
  const customAddons = state.activeProject.customAddons || [];
  if (!customAddons.length) {
    return `<p style="font-size:13px;color:var(--slate);font-style:italic;">No custom items added. Use "+ Add Custom Item" for anything not on the standard add-on list.</p>`;
  }
  return customAddons.map((c, i) => `
    <div class="custom-item-row">
      <span class="name">${c.name}</span>
      <span class="price">${formatCustomPrice(c)}</span>
      <button class="remove-btn" onclick="removeCustomAddon(${i})" title="Remove">×</button>
    </div>
  `).join('');
}

function formatCustomPrice(c) {
  if (c.priceType === 'flat') return `+$${(+c.rate).toFixed(2)}`;
  if (c.priceType === 'per_unit') return `+$${(+c.rate).toFixed(2)}/${PRICING[state.activeProject.type].unit}`;
  if (c.priceType === 'percent') return `+${(+c.rate).toFixed(1)}%`;
  return '';
}

function attachCustomAddonListeners() {
  const btn = __doc.getElementById('customAddBtn');
  const form = __doc.getElementById('customAddForm');
  const saveBtn = __doc.getElementById('customAddSave');
  const cancelBtn = __doc.getElementById('customAddCancel');
  if (btn) btn.onclick = () => { form.style.display = 'block'; __doc.getElementById('customAddName').focus(); };
  if (cancelBtn) cancelBtn.onclick = () => {
    form.style.display = 'none';
    __doc.getElementById('customAddName').value = '';
    __doc.getElementById('customAddAmount').value = '';
  };
  if (saveBtn) saveBtn.onclick = () => {
    const name = __doc.getElementById('customAddName').value.trim();
    const priceType = __doc.getElementById('customAddPriceType').value;
    const rate = parseFloat(__doc.getElementById('customAddAmount').value);
    if (!name) { alert('Please give the item a description.'); return; }
    if (isNaN(rate) || rate < 0) { alert('Please enter a valid amount.'); return; }
    if (!state.activeProject.customAddons) state.activeProject.customAddons = [];
    state.activeProject.customAddons.push({ id: 'custom_' + Date.now(), name, priceType, rate });
    form.style.display = 'none';
    __doc.getElementById('customAddName').value = '';
    __doc.getElementById('customAddAmount').value = '';
    __doc.getElementById('customItemsList').innerHTML = renderCustomItemsList();
    updateRunningTotal();
  };
}

function removeCustomAddon(idx) {
  if (!state.activeProject.customAddons) return;
  state.activeProject.customAddons.splice(idx, 1);
  __doc.getElementById('customItemsList').innerHTML = renderCustomItemsList();
  updateRunningTotal();
}

function addonRow(a, group) {
  const stored = group === 'service' ? state.activeProject.serviceAddons[a.id] : state.activeProject.addons[a.id];
  const checked = !!stored;
  const qty = (typeof stored === 'object' && stored.qty) ? stored.qty : 1;
  const priceLabel = formatAddonPrice(a);
  const restr = a.restr ? `<span class="restr">${a.restr}</span>` : '';
  const qtyInput = needsQty(a) ? `<input type="number" min="1" step="1" value="${qty}" class="qty-input" data-qty="${a.id}" placeholder="${a.qtyLabel || 'qty'}">` : '';
  const imageHtml = a.img ? `<div class="addon-img" style="background-image:url('${a.img}')"></div>` : '';
  const descHtml = a.desc
    ? `<div class="addon-desc"><div class="ad-name">${a.name}${restr}</div><div class="ad-sub">${a.desc}</div></div>`
    : `<div class="addon-desc"><div class="ad-name">${a.name}${restr}</div></div>`;
  return `<div class="toggle-row ${checked ? 'checked' : ''}" data-addon="${a.id}" data-group="${group}"><span class="box"></span>${imageHtml}${descHtml}${qtyInput}<span class="price">${priceLabel}</span></div>`;
}

function needsQty(a) { return a.priceType === 'each' || a.priceType === 'each_lnft'; }

// Resolve an addon's effective rate for the current project. Uses
// `rateByProject[type]` if the addon declares per-project overrides
// (e.g., citronella: $1.50/ln ft on fence, $0.50/sq ft elsewhere),
// otherwise falls back to the flat `rate` field. Centralized so all
// per_unit consumers — pricing math, breakdown display, catalog
// labels — agree on what the customer is actually paying.
function addonEffectiveRate(def, proj) {
  if (!def) return 0;
  if (def.rateByProject && proj && def.rateByProject[proj] != null) return def.rateByProject[proj];
  return +def.rate || 0;
}

function formatAddonPrice(a) {
  const proj = state.activeProject && state.activeProject.type;
  const effRate = addonEffectiveRate(a, proj);
  // Anywhere a calculated rate would render as "$0" or "+$0", show "FREE" instead
  if (!effRate || effRate === 0) return 'FREE';
  if (a.priceType === 'flat') return `+$${effRate}`;
  if (a.priceType === 'each') return `$${effRate} ea`;
  if (a.priceType === 'each_lnft') return `$${effRate}/ln ft`;
  if (a.priceType === 'per_unit') return `+$${effRate.toFixed(2)}/${PRICING[proj].unit}`;
  if (a.priceType === 'per_unit_trim') return `$${effRate.toFixed(2)}/ln ft trim`;
  if (a.priceType === 'percent') return `+${(effRate * 100).toFixed(0)}%`;
  return '';
}

function attachAddonListeners() {
  __doc.querySelectorAll('[data-addon]').forEach(row => {
    const id = row.dataset.addon;
    const group = row.dataset.group;
    const qtyInp = row.querySelector('input[data-qty]');
    row.addEventListener('click', (e) => {
      if (e.target === qtyInp) return;
      const willCheck = !row.classList.contains('checked');
      row.classList.toggle('checked', willCheck);
      saveAddon(id, group, willCheck, qtyInp ? +qtyInp.value : 1);
    });
    if (qtyInp) {
      qtyInp.addEventListener('click', e => e.stopPropagation());
      qtyInp.addEventListener('input', () => { if (row.classList.contains('checked')) saveAddon(id, group, true, +qtyInp.value); });
    }
  });
}

function saveAddon(id, group, checked, qty) {
  const target = group === 'service' ? state.activeProject.serviceAddons : state.activeProject.addons;
  if (checked) target[id] = needsQty(findAddonDef(id)) ? { qty: Math.max(1, qty || 1) } : true;
  else delete target[id];
  updateRunningTotal();
}

function findAddonDef(id) {
  const proj = state.activeProject.type;
  return [...PRICING.stainUpgrades, ...(PRICING.projectAddons[proj] || []), ...PRICING.serviceAddons].find(a => a.id === id);
}

/* ============================================================
   STAGE 9: DISCOUNTS — separated, single-select (radio)
   ============================================================ */
function renderDiscounts() {
  const sels = state.activeProject.selectedDiscounts || [];
  const sum = totalDiscountRate();
  const bundleAuto = state.bundledProjects.length >= 1 && !!state.activeProject.type;
  const html = `
    <div class="alert info" style="margin-bottom:20px;">
      <span class="ico">✨</span>
      <div><strong>Discounts stack — up to ${(DISCOUNT_STACK_CAP*100).toFixed(0)}% total.</strong>${bundleAuto ? ' Your bundle discount (10%) is auto-applied on top. ' : ' '}Pick any that apply. Some discounts are mutually exclusive — picking one in a group auto-clears the other (you can\'t double up on service-appreciation or loyalty).</div>
    </div>
    <div id="discountList">
      ${DISCOUNTS.filter(d => !d.locked).map(d => {
        const isChecked = sels.includes(d.id);
        const ratePct = (d.rate * 100);
        const rateLabel = (Math.round(ratePct) === ratePct) ? `${ratePct.toFixed(0)}%` : `${ratePct.toFixed(1)}%`;
        // Informational items (e.g. cash/check payment) don't apply a discount —
        // they describe transparent pricing instead. Show a neutral label.
        const valueDisplay = d.informational ? 'No processing fee' : `−${rateLabel}`;
        return `
          <div class="radio-row ${isChecked ? 'checked' : ''} ${d.informational ? 'informational' : ''}" data-discount="${d.id}" data-mobile-collapse="true" ${d.group ? `data-discount-group="${d.group}"` : ''}>
            <div class="disc-img" style="background-image:url('${d.img}')"></div>
            <div class="dot-outer square"></div>
            <div class="label">
              <div class="head" onclick="toggleMobileExpand(event)">${d.label}</div>
              <div class="sub cust-mc">${d.sub}</div>
            </div>
            <div class="value">${valueDisplay}</div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="discount-sum-line" id="discountSumLine">
      <div>
        <strong>Total discount applied:</strong>
        <span id="discountSumText">${sum.rate > 0 ? `${sum.count} selected · ${sum.label}` : 'None selected yet'}</span>
      </div>
      <div class="discount-sum-rate" id="discountSumRate">−${(sum.rate * 100).toFixed(1).replace(/\.0$/, '')}%</div>
    </div>
    ${sum.uncappedRate > DISCOUNT_STACK_CAP ? `<div class="alert warn" style="margin-top:12px;"><span class="ico">⚠️</span><div><strong>Stack capped at ${(DISCOUNT_STACK_CAP*100).toFixed(0)}%.</strong>You've selected ${(sum.uncappedRate*100).toFixed(1)}% worth, but the project-level discount stack is capped at ${(DISCOUNT_STACK_CAP*100).toFixed(0)}% to keep our margins sustainable. The bundle discount (10%) applies separately on top.</div></div>` : ''}
  `;
  __doc.getElementById('discountsContainer').innerHTML = html;
  __doc.querySelectorAll('#discountList .radio-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.discount;
      const group = row.dataset.discountGroup;
      const sels = state.activeProject.selectedDiscounts = state.activeProject.selectedDiscounts || [];
      const idx = sels.indexOf(id);
      const wasUnchecked = idx === -1;
      if (wasUnchecked) {
        // If this discount is in a mutex group, deselect any other selected option from the same group
        if (group) {
          const sameGroupIds = DISCOUNTS.filter(d => d.group === group && d.id !== id).map(d => d.id);
          sameGroupIds.forEach(otherId => {
            const otherIdx = sels.indexOf(otherId);
            if (otherIdx >= 0) sels.splice(otherIdx, 1);
            const otherRow = __doc.querySelector(`#discountList .radio-row[data-discount="${otherId}"]`);
            if (otherRow) otherRow.classList.remove('checked');
          });
        }
        sels.push(id);
      } else {
        sels.splice(idx, 1);
      }
      row.classList.toggle('checked', wasUnchecked);
      // Update the sum line + maybe fire confetti
      const sum = totalDiscountRate();
      const sumText = __doc.getElementById('discountSumText');
      const sumRate = __doc.getElementById('discountSumRate');
      if (sumText) sumText.textContent = sum.rate > 0 ? `${sum.count} selected · ${sum.label}` : 'None selected yet';
      if (sumRate) sumRate.textContent = '−' + (sum.rate * 100).toFixed(1).replace(/\.0$/, '') + '%';
      if (wasUnchecked) fireConfetti();
      updateRunningTotal();
      // Re-render to update the cap warning banner state
      const container = __doc.getElementById('discountsContainer');
      if (container && sum.uncappedRate !== sum.rate) {
        // Only re-render if the cap state changed (avoid full re-render churn otherwise)
        renderDiscounts();
      }
    });
  });
}

/* ============================================================
   PRICING ENGINE
   ============================================================ */
// Product-family multiplier applied to the raw tier base. Water-based jobs
// and HOA-specified jobs cost ~5% more in materials + labor than oil; oil
// jobs stay at the baseline tier rates.
const PRODUCT_PRICE_MULT = { water: 1.05, hoa: 1.05, oil: 1.0 };

function computeTierBase() {
  const raw = computeTierBaseRaw();
  const mult = PRODUCT_PRICE_MULT[state.activeProject.productType] || 1.0;
  return raw * mult;
}

function computeTierBaseRaw() {
  const proj = state.activeProject.type;
  const tier = state.activeProject.tier;
  const m = state.activeProject.measurements;
  if (proj === 'fence') {
    const totalLnFt = m.linearft || 0;
    const perFootRate = PRICING.fence.tiers[tier] * PRICING.fence.styleMultipliers[m.style || 'privacy'];
    if (!m.oneSided) return totalLnFt * perFootRate;
    // One-side-only is enabled. If `oneSidedLnFt` is specified, only that
    // portion is priced as one-sided; the remainder is priced normally.
    // If left empty (0/null), assume the ENTIRE fence is one-sided.
    const partial = +m.oneSidedLnFt || 0;
    const oneSidedLn = (partial > 0 && partial < totalLnFt) ? partial : totalLnFt;
    const bothSidedLn = totalLnFt - oneSidedLn;
    return (oneSidedLn * perFootRate * PRICING.fence.oneSidedFactor) + (bothSidedLn * perFootRate);
  }
  if (proj === 'deck') {
    // Tier rate is the actual $/sq ft for flat decking at this tier.
    // The component rates (railing, stair) still scale relative to
    // the Performance baseline, so we derive the multiplier on the
    // fly. Lattice stays flat-rate (not tier-scaled) — that's a
    // commodity material cost that doesn't change with finish quality.
    const tierRate = PRICING.deck.tiers[tier];
    const baseline = PRICING.deck.rates.flat || 1;
    const mult = tierRate / baseline;
    let flatSqFt = (m.flat || 0);
    if (m.underneath) flatSqFt *= PRICING.deck.underneathMultiplier;
    return flatSqFt * tierRate
      + (m.rail || 0) * PRICING.deck.rates.railing * mult
      + (m.stairs || 0) * PRICING.deck.rates.stair * mult
      + (m.lattice || 0) * PRICING.deck.rates.lattice;
  }
  if (proj === 'pergola') {
    let base = (m.sqft || 0) * PRICING.pergola.tiers[tier];
    if (m.overhead) base += PRICING.pergola.overheadAccessFlat;
    return base;
  }
  if (proj === 'barn') {
    let base = (m.sqft || 0) * PRICING.barn.tiers[tier];
    if (m.heightPremium) base *= PRICING.barn.heightPremium;
    if (m.cupolaCount) base += m.cupolaCount * PRICING.barn.cupolaFlat;
    if (m.trim) base += m.trim * PRICING.barn.trimRate;
    if (m.liftDays) base += m.liftDays * PRICING.barn.liftRentalPerDay;
    return base;
  }
  if (proj === 'ceiling') {
    let base = (m.sqft || 0) * PRICING.ceiling.tiers[tier];
    if (m.tng) base += (m.sqft || 0) * PRICING.ceiling.tngPremium;
    if (m.beamLnFt) base += m.beamLnFt * PRICING.ceiling.beamRate;
    if (m.fixtures) base += m.fixtures * PRICING.ceiling.fixtureRemoval;
    if (m.fans) base += m.fans * PRICING.ceiling.fanRemoval;
    if (m.furnProtect) base += PRICING.ceiling.furnitureProtFlat;
    return base;
  }
  return 0;
}

function computePrepCost() {
  const proj = state.activeProject.type;
  // Guard: no project selected (e.g. right after collapseActiveProject resets active to blank)
  if (!proj || !PRICING[proj] || !PRICING[proj].prep) return 0;
  const cond = state.activeProject.condition;
  const raw = (PRICING[proj].prep[cond] || 0) * computePrepBase();
  // Prep minimums — small jobs still incur fixed costs (chemistry,
  // truck time, setup) that don't scale linearly with footage. The
  // floor protects us from quoting $80 for a 40-lnft fence wash when
  // the chemistry alone costs more than that.
  const PREP_MIN = (cond === 'soft_wash')  ? 200
                 : (cond === 'strip_sand') ? 400
                 : 0;
  if (raw > 0 && PREP_MIN > 0 && raw < PREP_MIN) return PREP_MIN;
  return raw;
}

function computeAddonsTotal() {
  const proj = state.activeProject.type;
  const m = state.activeProject.measurements;
  let flat = 0; let percentRate = 0;
  const allAddons = { ...state.activeProject.addons, ...state.activeProject.serviceAddons };
  Object.keys(allAddons).forEach(id => {
    const def = findAddonDef(id); if (!def) return;
    const stored = allAddons[id];
    const qty = (typeof stored === 'object' && stored.qty) ? stored.qty : 1;
    if (def.priceType === 'flat') flat += def.rate;
    else if (def.priceType === 'each') flat += def.rate * qty;
    else if (def.priceType === 'each_lnft') flat += def.rate * qty;
    else if (def.priceType === 'per_unit') {
      const units = proj === 'fence' ? (m.linearft || 0) : (m.sqft || m.flat || 0);
      const rate = addonEffectiveRate(def, proj);
      let amount = rate * units;
      if (def.minCharge && amount < def.minCharge && units > 0) amount = def.minCharge;
      flat += amount;
    }
    else if (def.priceType === 'per_unit_trim') flat += def.rate * (m.trim || 0);
    else if (def.priceType === 'percent') percentRate += def.rate;
  });
  // Custom employee-added addons
  (state.activeProject.customAddons || []).forEach(c => {
    if (c.priceType === 'flat') flat += +c.rate;
    else if (c.priceType === 'per_unit') flat += +c.rate * (proj === 'fence' ? (m.linearft || 0) : (m.sqft || m.flat || 0));
    else if (c.priceType === 'percent') percentRate += +c.rate / 100;
  });
  return { flat, percentRate };
}

function totalDiscountRate() {
  // All manually-selected discounts stack, subject to:
  //  (1) mutex groups — only one option per `group` can be active (enforced at click-time too)
  //  (2) DISCOUNT_STACK_CAP — total stack capped to avoid eroding margin
  // Bundle is handled separately at the multi-project level in computeAllTotals().
  let sum = 0;
  const labels = [];
  const sels = state.activeProject.selectedDiscounts || [];
  sels.forEach(id => {
    const def = DISCOUNTS.find(d => d.id === id && !d.locked);
    if (def) { sum += def.rate; labels.push(def.label); }
  });
  const capped = Math.min(sum, DISCOUNT_STACK_CAP);
  return { rate: capped, uncappedRate: sum, label: labels.join(' + ') || '', count: sels.length, cap: DISCOUNT_STACK_CAP };
}
// Back-compat alias for any old call sites
function bestDiscountRate() { return totalDiscountRate(); }

function computeProjectTotal() {
  // Tier base only counts toward the running total once the user has explicitly
  // picked a tier (or selected HOA which auto-confirms). Before that, the only
  // money in the total is restoration/prep cost — shown as soon as the user
  // picks Soft Wash or Strip & Sand on Stage 4.
  const tierBase = state.activeProject.tierConfirmed ? computeTierBase() : 0;
  const prep = computePrepCost();
  const addons = computeAddonsTotal();
  const percentMod = tierBase * addons.percentRate;
  let subtotal = tierBase + prep + addons.flat + percentMod;

  const disc = bestDiscountRate();
  const discountableBase = tierBase + addons.flat + percentMod;
  const discountAmount = discountableBase * disc.rate;
  subtotal -= discountAmount;

  let minimumApplied = false;
  if (subtotal < PRICING.minimumJob && tierBase > 0) { subtotal = PRICING.minimumJob; minimumApplied = true; }
  return { tierBase, prep, addonsFlat: addons.flat, percentMod, percentRate: addons.percentRate, discountRate: disc.rate, discountAmount, discountLabel: disc.label, subtotal, minimumApplied };
}

function computeAllTotals() {
  const active = computeProjectTotal();
  // If any bundled project is missing _cached (resumed quote, fresh
  // page load before refreshAllProjectCaches ran, etc.), compute it
  // now. Without this guard, that project contributes $0 to the total
  // and surfaces as "I picked soft wash but the total didn't change."
  const missingCache = (state.bundledProjects || []).some(p => p && p.type && !p._cached);
  if (missingCache && typeof refreshAllProjectCaches === 'function') {
    try { refreshAllProjectCaches(); } catch (e) {}
  }
  const bundled = state.bundledProjects.map(p => p._cached || { tierBase:0, prep:0, addonsFlat:0, percentMod:0, subtotal: 0, discountAmount: 0 });
  const projectsCount = (active.subtotal > 0 ? 1 : 0) + bundled.length;
  const sumBeforeBundle = active.subtotal + bundled.reduce((s, b) => s + b.subtotal, 0);

  // Total per-project discount savings across active + all bundled (stackable discounts)
  const totalDiscountSavings = (active.discountAmount || 0) + bundled.reduce((s, b) => s + (b.discountAmount || 0), 0);

  let bundleEligible = projectsCount >= 2;
  let bundleDiscount = 0;
  let finalTotal = sumBeforeBundle;
  if (bundleEligible) {
    const activeRaw = active.tierBase + active.prep + active.addonsFlat + active.percentMod;
    const bundledRaw = bundled.reduce((s, b) => s + (b.tierBase + b.prep + b.addonsFlat + b.percentMod), 0);
    const totalRaw = activeRaw + bundledRaw - totalDiscountSavings;  // apply per-project discounts first
    const totalDiscountable = (active.tierBase + active.addonsFlat + active.percentMod) + bundled.reduce((s, b) => s + (b.tierBase + b.addonsFlat + b.percentMod), 0);
    bundleDiscount = totalDiscountable * PRICING.bundleDiscount;
    finalTotal = totalRaw - bundleDiscount;
  }
  // Quote-level $500 job minimum. Floored AFTER bundle discount + after
  // per-project discounts. Track that we hit it so the review page can
  // surface a "minimum applied" banner near the Grand Total.
  let minimumApplied = false;
  if (finalTotal > 0 && finalTotal < PRICING.minimumJob) {
    finalTotal = PRICING.minimumJob;
    minimumApplied = true;
  }
  return { active, bundled, projectsCount, sumBeforeBundle, bundleEligible, bundleDiscount, finalTotal, totalDiscountSavings, minimumApplied };
}

let _lastDisplayedTotal = 0;
let _lastDisplayedActive = 0;

function animateCounter(el, from, to, duration) {
  if (from === to) { el.textContent = '$' + Math.round(to).toLocaleString(); return; }
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const val = Math.round(from + (to - from) * eased);
    el.textContent = '$' + val.toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function updateRunningTotal() {
  const totals = computeAllTotals();
  const totalAmount = __doc.getElementById('totalAmount');
  const activeAmount = __doc.getElementById('activeProjectAmount');
  const activePill = __doc.getElementById('activeProjectPill');
  const totalPill = __doc.getElementById('totalPill');

  // Hide the total pill entirely until there's an actual price to show
  // (i.e., a tier has been selected AND measurements entered → tierBase > 0,
  // OR there are bundled projects already with prices). Also always
  // hidden on the dashboard — Quote Total is a per-quote concept that
  // has no meaning when the rep is browsing the list of all quotes.
  const dashVis = __doc.getElementById('stage-dashboard');
  const onDashboard = !!(dashVis && dashVis.classList.contains('visible'));
  const hasPrice = totals.finalTotal > 0;
  totalPill.style.display = (hasPrice && !onDashboard) ? 'flex' : 'none';
  activePill.style.display = (!onDashboard && state.bundledProjects.length > 0 && totals.active.subtotal > 0) ? 'flex' : 'none';

  if (hasPrice) {
    animateCounter(totalAmount, _lastDisplayedTotal, totals.finalTotal, 700);
    _lastDisplayedTotal = totals.finalTotal;
    if (state.bundledProjects.length > 0) {
      animateCounter(activeAmount, _lastDisplayedActive, totals.active.subtotal, 700);
      _lastDisplayedActive = totals.active.subtotal;
    }
  } else {
    _lastDisplayedTotal = 0;
    _lastDisplayedActive = 0;
  }

  // Side panel — render on every total update so it stays in sync
  renderSidePanel();
  // Project bubbles indicator — re-render so numbering stays correct
  renderProjectBubbles();
}

function renderProjectBubbles() {
  const bar = __doc.getElementById('projectBubbles');
  if (!bar) return;
  // Hide entirely on dashboard / success screens
  const dashVisible = __doc.getElementById('stage-dashboard').classList.contains('visible');
  const successVisible = __doc.getElementById('stage-success') && __doc.getElementById('stage-success').classList.contains('visible');
  // Build the full list: bundled projects, then active (if any)
  const bundled = state.bundledProjects;
  const active = state.activeProject;
  const haveActive = !!active.type;
  const totalProjects = bundled.length + (haveActive ? 1 : 0);
  if (dashVisible || successVisible || totalProjects === 0) { bar.style.display = 'none'; return; }
  if (totalProjects === 1 && !haveActive) { /* only bundled, no active — still show */ }
  // If we have only one project total, don't show the bubble bar (not useful for single-project quotes)
  if (totalProjects < 2) { bar.style.display = 'none'; return; }

  // Build numbered labels using each project's stable per-type _seq.
  // Backfill _seq on any older projects (e.g. drafts created before seq
  // numbering existed) so they show a sensible #N too.
  bundled.forEach(assignProjectSeqIfNeeded);
  if (haveActive) assignProjectSeqIfNeeded(active);
  const all = [
    ...bundled.map((p, idx) => ({ kind: 'bundled', idx, project: p })),
    ...(haveActive ? [{ kind: 'active', idx: bundled.length, project: active }] : [])
  ];
  const typeCounts = {};
  all.forEach(item => {
    const t = item.project.type;
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const labels = all.map(item => {
    const t = item.project.type;
    const meta = PROJECT_META[t];
    if (typeCounts[t] > 1 && typeof item.project._seq === 'number') {
      return `${meta.icon} ${meta.name} #${item.project._seq}`;
    }
    return `${meta.icon} ${meta.name}`;
  });
  const html = `
    <span class="project-bubbles-label">Projects in this quote:</span>
    ${all.map((item, i) => {
      const isActive = (item.kind === 'active');
      const price = item.kind === 'bundled'
        ? (item.project._cached && item.project._cached.subtotal) || 0
        : (computeProjectTotal().subtotal || 0);
      return `
        <button type="button" class="project-bubble ${isActive ? 'active' : ''}" data-bubble-kind="${item.kind}" data-bubble-idx="${item.idx}">
          <span class="pb-ico">${PROJECT_META[item.project.type].icon}</span>
          <span>${labels[i].replace(PROJECT_META[item.project.type].icon + ' ', '')}</span>
          ${price > 0 ? `<span class="pb-price">$${Math.round(price).toLocaleString()}</span>` : ''}
        </button>`;
    }).join('')}
  `;
  bar.innerHTML = html;
  bar.style.display = 'flex';
  // Wire up clicks
  bar.querySelectorAll('.project-bubble').forEach(b => {
    b.addEventListener('click', () => {
      const kind = b.dataset.bubbleKind;
      const idx = parseInt(b.dataset.bubbleIdx, 10);
      if (kind === 'bundled') {
        // Switch active project to this bundled one (mirror editBundledProject without confirm)
        if (state.activeProject.type) {
          const totals = computeProjectTotal();
          const cached = JSON.parse(JSON.stringify(state.activeProject));
          cached._cached = totals;
          state.bundledProjects.push(cached);
        }
        const editing = state.bundledProjects[idx];
        delete editing._cached;
        state.activeProject = editing;
        state.activeProject.tierConfirmed = true;
        state.bundledProjects.splice(idx, 1);
        state.maxStageReached = 10;
        showStage(10);
        updateRunningTotal();
      }
    });
  });
}

/* ============================================================
   STAGE 10: REVIEW
   ============================================================ */
function renderFinalBreakdown() {
  const totals = computeAllTotals();
  const proj = state.activeProject.type;

  const stack = __doc.getElementById('bundleStackBlock');
  // Fire confetti the first time bundle qualifies in this render
  if (totals.bundleEligible && !state._bundleCelebrated) { state._bundleCelebrated = true; fireConfetti(); }
  if (!totals.bundleEligible) state._bundleCelebrated = false;

  // Compute total savings across bundle + all selected discounts
  const bundleSavings = totals.bundleDiscount || 0;
  const discountSavings = totals.totalDiscountSavings || 0;
  const totalSavings = Math.round(bundleSavings + discountSavings);
  const breakdown = [];
  if (bundleSavings > 0) breakdown.push(`bundle ($${Math.round(bundleSavings).toLocaleString()})`);
  if (discountSavings > 0) breakdown.push(`discounts ($${Math.round(discountSavings).toLocaleString()})`);
  const savingsPillHtml = totalSavings > 0
    ? `<div class="bundle-savings-pill">🎉 You're saving <strong style="font-size:18px;">$${totalSavings.toLocaleString()}</strong>${breakdown.length ? ' — ' + breakdown.join(' + ') : ''}.</div>`
    : '';

  if (state.bundledProjects.length > 0) {
    stack.style.display = 'block';
    // Title swaps based on actual project count. "(10% off)" only makes
    // sense when the bundle discount is actually applying, which needs
    // 2+ projects total (active + bundled, or 2+ bundled).
    const totalProjects = state.bundledProjects.length + (state.activeProject.type ? 1 : 0);
    const stackTitle = totalProjects >= 2
      ? 'Bundled projects (10% off)'
      : 'Project summary';
    stack.innerHTML = `
      ${savingsPillHtml}
      <div class="saved-projects">
        <div class="bundle-stack-title">${stackTitle}</div>
        ${state.bundledProjects.map((p, i) => `
          <div class="saved-project-row" data-mobile-collapse="true" onclick="toggleMobileExpand(event)" role="button" tabindex="0">
            <span class="ico">${PROJECT_META[p.type].icon}</span>
            <div class="meta">
              <div class="nm">${PROJECT_META[p.type].name} — ${p.tier} (${p.productType})${p.selectedColor ? ` · ${p.selectedColor.name}` : ''}${p.productType === 'hoa' ? ' · HOA product' : ''}</div>
              <div class="det cust-mc">${describeBundledRow(p)}</div>
            </div>
            <div class="amt">$${Math.round(p._cached.subtotal).toLocaleString()}</div>
            <div class="row-actions">
              <button type="button" class="edit-btn" data-edit-bundle="${i}" onclick="event.stopPropagation();">Edit</button>
              <button type="button" class="remove-btn" data-remove-bundle="${i}" onclick="event.stopPropagation();">Remove</button>
            </div>
          </div>
        `).join('')}
      </div>`;
  } else if (totalSavings > 0) {
    // No bundled projects, but discounts exist — still show the savings pill
    stack.style.display = 'block';
    stack.innerHTML = savingsPillHtml;
  } else {
    stack.style.display = 'none';
  }

  if (!proj) { renderBundleOnlyBreakdown(totals); renderEditPanel(); return; }

  const a = totals.active;
  const meta = PROJECT_META[proj];
  const tierName = state.activeProject.tier;
  const tierMeta = getTierMeta(state.activeProject.productType, tierName);
  const color = state.activeProject.selectedColor;
  const hoa = state.activeProject.hoa;

  const measureLines = describeMeasurementLines();
  const stainAddons = Object.keys(state.activeProject.addons).map(id => {
    const def = findAddonDef(id); if (!def) return null;
    const stored = state.activeProject.addons[id];
    const qty = (typeof stored === 'object' && stored.qty) ? stored.qty : 1;
    return { def, qty, cost: computeSingleAddonCost(id, qty) };
  }).filter(Boolean);
  const serviceAddons = Object.keys(state.activeProject.serviceAddons).map(id => {
    const def = findAddonDef(id); if (!def) return null;
    return { def, qty: 1, cost: computeSingleAddonCost(id, 1) };
  }).filter(Boolean);
  const customItems = (state.activeProject.customAddons || []).map(c => {
    let cost = 0;
    const m = state.activeProject.measurements;
    if (c.priceType === 'flat') cost = +c.rate;
    else if (c.priceType === 'per_unit') cost = +c.rate * (proj === 'fence' ? (m.linearft || 0) : (m.sqft || m.flat || 0));
    else if (c.priceType === 'percent') cost = computeTierBase() * (+c.rate / 100);
    return { def: { name: c.name + ' (custom)' }, qty: 1, cost };
  });

  let colorPillHtml = '';
  if (isHoa()) {
    colorPillHtml = `<div class="color-pill hoa"><span class="dot"></span>HOA: ${hoa.brand} · ${hoa.color}${hoa.productName ? ` (${hoa.productName})` : ''}</div>`;
  } else if (color) {
    const dotStyle = color.img ? `background-image:url('${color.img}')` : `background:${color.hex}`;
    colorPillHtml = `<div class="color-pill"><span class="dot" style="${dotStyle}"></span>${color.name}${color.code ? ' · ' + color.code : ''} <small style="color:var(--slate);">(${color.line})</small></div>`;
  } else if (isClearSealer()) {
    colorPillHtml = '<div class="color-pill"><span class="dot" style="background:transparent;border-color:var(--slate);"></span>Clear (no color)</div>';
  }

  let prevStainHtml = '';
  const ps = state.activeProject.previousStain;
  if (ps.wasStained && (ps.previousProductType || ps.brand || ps.productName)) {
    const typeLabel = ps.previousProductType === 'water' ? 'Water-based' : (ps.previousProductType === 'oil' ? 'Oil-based' : 'Unknown type');
    const summary = (ps.previousProductType === 'unsure' || !ps.brand) ? typeLabel : `${ps.brand}${ps.transparency ? ' · ' + ps.transparency : ''}${ps.productName ? ' · ' + ps.productName : ''}${ps.colorNotes ? ' · ' + ps.colorNotes : ''}`;
    prevStainHtml = `
      <div class="breakdown-section">
        <h4>Previous Stain (informational)</h4>
        <div class="breakdown-line"><span class="desc">Previously used<small>${typeLabel}</small></span><span class="val" style="font-weight:500;font-size:13px;color:var(--slate)">${summary}</span></div>
      </div>`;
  }

  const productLabel = isHoa() ? 'HOA-Specified' : `${tierName.charAt(0).toUpperCase() + tierName.slice(1)} (${state.activeProject.productType})`;
  __doc.getElementById('breakdownMain').innerHTML = `
    <div class="breakdown-header-row">
      <h3 style="margin:0;">${meta.icon} ${meta.name} — ${productLabel}</h3>
      <button type="button" class="btn-collapse-project" id="btnCollapseActiveProject" title="Collapse this project — move it into the bundle stack and hide details">▾ Collapse</button>
    </div>
    ${colorPillHtml}

    <!-- Itemized breakdown — collapsed by default on mobile so the
         review page lands on the total without a wall of line items.
         Customers tap the toggle below to drill in. Desktop ignores
         .cust-mc (always visible). -->
    <span class="cust-mc-toggle" role="button" tabindex="0" onclick="toggleMobileExpand(event)" aria-label="Toggle itemized breakdown" style="margin-bottom:12px;">
      <span class="lbl-collapsed">Show itemized breakdown</span>
      <span class="lbl-expanded">Hide itemized breakdown</span>
      <span class="chev">▾</span>
    </span>
    <div class="cust-mc">
      <div class="breakdown-section" style="margin-top:14px;">
        <h4>Measurements</h4>
        ${measureLines.map(l => `<div class="breakdown-line"><span class="desc">${l.label}</span><span class="val">${l.value}</span></div>`).join('')}
      </div>

      <div class="breakdown-section">
        <h4>Tier Base</h4>
        <div class="breakdown-line"><span class="desc">${tierMeta.product}<small>Expected life: ${tierMeta.life}</small></span><span class="val">$${a.tierBase.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
      </div>

      <div class="breakdown-section">
        <h4>Prep Work</h4>
        <div class="breakdown-line"><span class="desc">${prepLabel(state.activeProject.condition)}</span><span class="val">${a.prep > 0 ? '$' + a.prep.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}) : 'Included'}</span></div>
      </div>

      ${prevStainHtml}

      ${stainAddons.length || serviceAddons.length || customItems.length ? `
      <div class="breakdown-section">
        <h4>Add-ons</h4>
        ${[...stainAddons, ...serviceAddons, ...customItems].map(item => `<div class="breakdown-line"><span class="desc">${item.def.name}${item.qty > 1 ? '<small>Qty: ' + item.qty + '</small>' : ''}</span><span class="val">$${item.cost.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>`).join('')}
      </div>` : ''}

      ${a.discountAmount > 0 && !totals.bundleEligible ? `
      <div class="breakdown-section">
        <div class="breakdown-line discount"><span class="desc">${a.discountLabel}<small>${(a.discountRate*100).toFixed(0)}% off — best discount applied</small></span><span class="val">−$${a.discountAmount.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
      </div>` : ''}

      ${totals.bundleEligible ? `
      <div class="breakdown-section">
        <h4>Bundle Discount</h4>
        <div class="breakdown-line discount"><span class="desc">Multi-project bundle<small>10% off — stacks on top of any per-project discounts</small></span><span class="val">−$${totals.bundleDiscount.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
      </div>` : ''}

      ${a.minimumApplied ? `<div class="breakdown-line minimum"><span class="desc">⚠️ Job minimum applied<small>Calculated project total was below our $${PRICING.minimumJob} job minimum — bumped up to the floor</small></span><span class="val">$${PRICING.minimumJob}</span></div>` : ''}
    </div>

    <!-- Project Total — always visible, even when itemized breakdown is collapsed -->
    <div class="project-total"><span class="label">${state.bundledProjects.length > 0 ? 'This Project Subtotal' : 'Project Total'}</span><span class="amount">$${Math.round(a.subtotal).toLocaleString()}</span></div>

    <!-- Quote-level notes — captured from the side-tracker, shown to the customer here, sent to Jobber -->
    ${state.notes && state.notes.trim() ? `
      <div class="review-notes-box">
        <h4>📝 Notes for this quote</h4>
        <p>${state.notes.trim().replace(/</g, '&lt;')}</p>
      </div>
    ` : ''}

    <!-- MATH WALK-THROUGH — explicit so the customer can see how the Grand Total was reached.
         Uses GROSS (pre-discount) project totals so the subsequent discount-line
         subtractions actually add up to the Grand Total. Previous version showed
         post-per-project-discount subtotals as "Quote subtotal" then subtracted
         per-project discounts AGAIN below — visually double-counting and making
         the displayed numbers not match the displayed total. -->
    ${(() => {
      // Gross = subtotal + per-project discount that was already applied.
      // Sum of gross values - all discounts = finalTotal (math holds).
      const activeGross = (a.subtotal || 0) + (a.discountAmount || 0);
      const bundledGross = state.bundledProjects.map(p => {
        const c = p._cached || {};
        return (Number(c.subtotal) || 0) + (Number(c.discountAmount) || 0);
      });
      const sumOfGross = activeGross + bundledGross.reduce((s, x) => s + x, 0);
      const totalSavings = (totals.bundleDiscount || 0) + (totals.totalDiscountSavings || 0);
      // Only show the walk-through if there's bundling or any savings to explain
      if (state.bundledProjects.length === 0 && totalSavings === 0) return '';
      return `
        <div class="math-walk">
          <h4>How we got to the Grand Total</h4>
          ${a.subtotal > 0 ? `<div class="math-walk-row"><span>${PROJECT_META[proj].icon} ${PROJECT_META[proj].name} (this project)</span><span>$${Math.round(activeGross).toLocaleString()}</span></div>` : ''}
          ${state.bundledProjects.map((p, i) => `
            <div class="math-walk-row"><span>${PROJECT_META[p.type].icon} ${PROJECT_META[p.type].name} (bundled)</span><span>$${Math.round(bundledGross[i]).toLocaleString()}</span></div>
          `).join('')}
          <div class="math-walk-row math-walk-subtotal"><span>Quote subtotal</span><span>$${Math.round(sumOfGross).toLocaleString()}</span></div>
          ${totals.totalDiscountSavings > 0 ? `<div class="math-walk-row math-walk-discount"><span>Stacked discounts</span><span>−$${Math.round(totals.totalDiscountSavings).toLocaleString()}</span></div>` : ''}
          ${totals.bundleDiscount > 0 ? `<div class="math-walk-row math-walk-discount"><span>Bundle discount (10%)</span><span>−$${Math.round(totals.bundleDiscount).toLocaleString()}</span></div>` : ''}
          ${totalSavings > 0 ? `<div class="math-walk-row math-walk-total-savings"><span>Total savings</span><span>−$${Math.round(totalSavings).toLocaleString()}</span></div>` : ''}
        </div>
      `;
    })()}

    <!-- DIY cost comparison — sits between the math walk-through and the Grand Total -->
    ${computeDIYComparison(totals.finalTotal)}

    <!-- GRAND TOTAL — sum of all projects with bundle + all discounts applied -->
    <div class="grand-total" style="margin-top:18px;">
      <span class="label">${state.bundledProjects.length > 0 ? 'Quote Grand Total (all ' + (state.bundledProjects.length + 1) + ' projects)' : 'Grand Total'}</span>
      <div class="grand-total-amount-block">
        <span class="amount">$${Math.round(totals.finalTotal).toLocaleString()}</span>
        ${((totals.bundleDiscount || 0) + (totals.totalDiscountSavings || 0)) > 0
          ? `<span class="grand-total-savings">Includes $${Math.round((totals.bundleDiscount || 0) + (totals.totalDiscountSavings || 0)).toLocaleString()} in total savings</span>`
          : ''}
      </div>
    </div>
    ${totals.minimumApplied ? `
      <div class="alert warn" style="margin-top:12px;">
        <span class="ico">⚠️</span>
        <div><strong>$${PRICING.minimumJob} job minimum applied.</strong>Your calculated total came in under our $${PRICING.minimumJob} job minimum, so the quote has been bumped to the floor. This covers crew dispatch, materials handling, and the fixed costs of any visit regardless of size.</div>
      </div>
    ` : ''}

    <!-- Quote expiry & risk reversal — visible right under the price to reduce decision friction -->
    <div class="quote-expiry-banner" style="margin-top:16px;">
      <span class="icon">📅</span>
      <div>This quote is locked through <strong>${getQuoteExpiryDate()}</strong> (30 days). Book within 24 hours to lock in an extra 5% off with the "Book Today" discount on Step 9.</div>
    </div>

    <div class="risk-reversal-box">
      <h4>You're covered</h4>
      <ul>
        <li><strong>Fully licensed &amp; insured</strong> in South Carolina — no risk to you</li>
        ${(state.activeProject.tier === 'performance' || state.activeProject.tier === 'showcase') ? '<li><strong>Free 30-day touch-up visit</strong> — if you spot any miss, we come back free</li>' : ''}
        ${state.activeProject.tier === 'showcase' ? '<li><strong>Extended warranty available</strong> — add it on Step 8</li>' : ''}
        <li><strong>We don't get paid until you're happy</strong> — only 25% deposit at scheduling reserves your slot; balance is due after completion (Wisetack covers that 75% balance if you finance)</li>
        <li><strong>Quote is final &amp; transparent</strong> — no hidden fees, no surprise upsells on-site</li>
      </ul>
    </div>

    <div class="payment-options" style="margin-top: 16px; padding: 16px; background: var(--cream); border-radius: 10px; font-size: 13px; color: var(--slate);">
      <strong style="color: var(--navy); font-size: 14px;">Payment options:</strong>
      <div class="pay-opt-grid" style="margin-top:10px; display:flex; flex-direction:column; gap:10px;">
        <label class="pay-opt" style="display:flex; align-items:flex-start; gap:10px; padding:12px; background:var(--paper); border:1.5px solid var(--line); border-radius:8px; cursor:pointer;">
          <input type="radio" name="pay" value="deposit" ${state.paymentMethod === 'deposit' ? 'checked' : ''} onchange="state.paymentMethod=this.value; renderFinalBreakdown();" style="margin-top:3px;">
          <div style="flex:1;">
            <div style="font-weight:700; color:var(--navy);">25% deposit + balance on completion</div>
            <div style="margin-top:6px; font-size:13px; line-height:1.5;">
              <strong style="color:var(--navy);">Deposit due at scheduling: $${Math.round(totals.finalTotal * 0.25).toLocaleString()}</strong><br>
              <span>Remaining balance after we finish: $${Math.round(totals.finalTotal * 0.75).toLocaleString()}</span>
            </div>
          </div>
        </label>
        <label class="pay-opt" style="display:flex; align-items:flex-start; gap:10px; padding:12px; background:var(--paper); border:1.5px solid var(--line); border-radius:8px; cursor:pointer;">
          <input type="radio" name="pay" value="wisetack" ${state.paymentMethod === 'wisetack' ? 'checked' : ''} onchange="state.paymentMethod=this.value; renderFinalBreakdown();" style="margin-top:3px;">
          <div style="flex:1;">
            <div style="font-weight:700; color:var(--navy);">25% deposit + financing through Wisetack <span class="payment-pill" style="margin-left:6px;">0% APR available if you qualify</span></div>
            <div style="margin-top:6px; font-size:13px; line-height:1.5;">
              <strong style="color:var(--navy);">Deposit due at scheduling: $${Math.round(totals.finalTotal * 0.25).toLocaleString()}</strong><br>
              <strong style="color:var(--navy);">Wisetack covers the remaining $${Math.round(totals.finalTotal * 0.75).toLocaleString()}</strong> — ≈ $${Math.round((totals.finalTotal * 0.75)/24).toLocaleString()}/mo over 24 months · soft credit pull, no impact on your score<br>
              <span style="font-size:11px;">*Estimate only — qualified applicants may receive 0% APR. Actual rate &amp; term determined by Wisetack after credit check. The 25% deposit reserves your scheduling slot and is required on every quote.</span>
            </div>
          </div>
        </label>
      </div>
    </div>`;
  renderEditPanel();
}

// Global event delegation — fires regardless of re-renders, scoping, or inline-handler stripping
__doc.addEventListener('click', function(e) {
  const target = e.target;
  if (!target || !target.closest) return;

  // Collapse active project — match by class (same pattern as Remove which works)
  const collapseBtn = target.closest('.btn-collapse-project');
  if (collapseBtn) {
    e.preventDefault(); e.stopPropagation();
    console.log('[Calculator] Collapse clicked');
    collapseActiveProject();
    return;
  }
  // Edit a bundled project
  const editBtn = target.closest('[data-edit-bundle]');
  if (editBtn) {
    e.preventDefault(); e.stopPropagation();
    const idx = parseInt(editBtn.dataset.editBundle, 10);
    if (!isNaN(idx)) editBundledProject(idx);
    return;
  }
  // Remove a bundled project
  const removeBtn = target.closest('[data-remove-bundle]');
  if (removeBtn) {
    e.preventDefault(); e.stopPropagation();
    const idx = parseInt(removeBtn.dataset.removeBundle, 10);
    if (!isNaN(idx)) removeBundledProject(idx);
    return;
  }
}, false);
// Also expose to window in case anything tries to invoke it from an inline handler
window.collapseActiveProject = function() {
  if (!state.activeProject.type) return;
  const totals = computeProjectTotal();
  const cached = JSON.parse(JSON.stringify(state.activeProject));
  cached._cached = totals;
  state.bundledProjects.push(cached);
  state.activeProject = makeBlankProject();
  state.editingBundleIdx = null;
  renderFinalBreakdown();
  updateRunningTotal();
  scrollAppToTop();
};

function computeDIYComparison(proTotal) {
  if (!proTotal || proTotal < 500) return '';

  // Build the list of all projects in this quote (active + bundled)
  const projects = [];
  if (state.activeProject.type) projects.push(state.activeProject);
  state.bundledProjects.forEach(p => projects.push(p));
  if (projects.length === 0) return '';

  // All DIY constants come from PRICING.diy so they're editable from
  // Settings → DIY tab. Fallbacks here keep the function safe if an
  // override save accidentally clears a leaf.
  const D = (PRICING && PRICING.diy) || {};
  const PROJECT_TOOLS = D.projectTools || { fence: 80, deck: 215, pergola: 180, barn: 175, ceiling: 165 };
  const PROJECT_TIME_DIVISOR = D.projectTimeDivisor || { fence: 16, deck: 24, pergola: 12, barn: 18, ceiling: 15 };
  const HOURLY_RATE = (typeof D.hourlyLaborRate === 'number') ? D.hourlyLaborRate : 25;

  // Retail pail price (5 gal) by product family + tier. Reads from
  // PRICING.diy.pail. Showcase oil tier = EXPERT Log & Timber Oil
  // ($450/5gal). EXPERT Stain & Seal = $264 for non-showcase oil.
  // SW Woodscapes Solid = $320; SW Rain Refresh = $385 for water.
  function pailCostFor(p) {
    const fam = (p.productType === 'water') ? 'water' : 'oil';
    const tierKey = p.tier || 'performance';
    const fallback = (fam === 'water')
      ? { essential: 320, performance: 320, showcase: 385 }
      : { essential: 264, performance: 264, showcase: 450 };
    const table = (D.pail && D.pail[fam]) || fallback;
    return (typeof table[tierKey] === 'number') ? table[tierKey] : fallback[tierKey];
  }
  // Citronella additive (EXPERT Natural Defense) — homeowner price.
  const CITRONELLA_PER_PAIL = (typeof D.citronellaPerPail === 'number') ? D.citronellaPerPail : 100;

  let totalPails = 0;
  let totalHours = 0;
  let totalToolsCost = 0;
  let totalStainCost = 0;
  let totalCitronellaCost = 0;
  let needsSprayer = false;
  let sprayerNote = '';
  let projectLines = [];

  // Wash prep — sodium metasilicate cleaner + oxalic acid brightener
  // (EXPERT Clean & Bright system, retail homeowner price). One pail
  // of each covers roughly 800 sq ft / 200 linear feet of fence at
  // standard mix ratios. Strip/sand requires extra chemistry +
  // significantly more time vs a soft wash.
  // Prices are conservative retail estimates — adjust to match
  // current EXPERT/stain-and-seal-supply prices when they change.
  const SODIUM_METASILICATE_PER_PAIL = (typeof D.sodiumMetasilicatePerPail === 'number') ? D.sodiumMetasilicatePerPail : 90;
  const OXALIC_ACID_PER_PAIL         = (typeof D.oxalicAcidPerPail === 'number') ? D.oxalicAcidPerPail : 90;
  let needsWashChems = false;
  let washChemPails  = 0;
  let washChemNote   = '';
  // Pressure washer — homeowner-grade 2500–3000 PSI electric, one-time
  // purchase amortized across all projects in the quote (same model as
  // the Graco sprayer below).
  let needsPressureWasher = false;
  const PRESSURE_WASHER_COST = (typeof D.pressureWasherCost === 'number') ? D.pressureWasherCost : 199;

  // Add-on DIY impact rule of thumb: a pro charges
  //   material ($X) + labor ($Y) + markup
  // For DIY we drop the markup. Material is roughly 30% of the pro
  // addon cost (homeowner buys retail without contractor discount but
  // also without contractor markup). Time is roughly 50% of the pro
  // cost in equivalent labor at $25/hr. Net: addon contributes
  // ~30% as extra material + ~50%/$25 hours, so total DIY ≈ 80% of
  // the pro addon cost. Conservative — keeps the savings number honest
  // without inflating it.
  function addonProCost(p) {
    const c = p && p._cached;
    if (!c) return 0;
    return (c.addonsFlat || 0) + (c.percentMod || 0);
  }
  let totalAddonMaterial = 0;
  let totalAddonHours = 0;

  projects.forEach(p => {
    const m = p.measurements;
    const isOneCoat = (p.productType === 'water' && p.tier === 'essential');
    let pails = 0;
    let scope = 0;
    if (p.type === 'fence') {
      const linearft = m.linearft || 0;
      pails = isOneCoat ? Math.ceil(linearft / 100) : Math.ceil(linearft / 50);
      scope = linearft;
    } else if (p.type === 'deck') {
      const flatSq = (m.flat || 0) * (m.underneath ? 2 : 1) + (m.lattice || 0);
      pails = isOneCoat ? Math.ceil(flatSq / 750) : Math.ceil(flatSq / 375);
      scope = flatSq;
    } else {
      const sq = m.sqft || 0;
      pails = isOneCoat ? Math.ceil(sq / 750) : Math.ceil(sq / 375);
      scope = sq;
    }
    pails = Math.max(pails, 1);
    const baseHours = Math.max(4, Math.ceil(scope / (PROJECT_TIME_DIVISOR[p.type] || 30)));
    const toolsCost = PROJECT_TOOLS[p.type] || 150;
    const pailCost = pailCostFor(p);
    const stainCostForProj = pails * pailCost;
    // Citronella adds cost only when the customer would actually buy the
    // additive — i.e., the citronella addon is checked on an oil project.
    const citronellaCostForProj = (p.productType === 'oil' && p.addons && p.addons.citronella)
      ? pails * CITRONELLA_PER_PAIL : 0;

    // Add-on DIY impact — extra materials + extra hours per project
    const addonPro = addonProCost(p);
    const addonMat = Math.round(addonPro * 0.30);
    const addonHrs = Math.round((addonPro * 0.50) / 25);

    // Two-tone is a percent-based upgrade that materially changes the
    // application: extra pail of stain + ~40% more time per project.
    // `addonPro` above already captures the percent-mod dollars, but
    // we surface the extra pail explicitly so the DIY line reads
    // honestly ("2 pails instead of 1").
    let extraPailsFromTwoTone = 0;
    if (p.addons && p.addons.two_tone) {
      extraPailsFromTwoTone = Math.max(1, Math.ceil(pails * 0.5));
    }

    const hours = baseHours + addonHrs;
    const stainTotalForProj = stainCostForProj + (extraPailsFromTwoTone * pailCost);
    pails += extraPailsFromTwoTone;

    totalPails += pails;
    totalHours += hours;
    totalToolsCost += toolsCost;
    totalStainCost += stainTotalForProj;
    totalCitronellaCost += citronellaCostForProj;
    totalAddonMaterial += addonMat;
    totalAddonHours += addonHrs;

    if (p.type === 'fence' || p.type === 'barn') needsSprayer = true;
    if (p.type === 'deck' && m.underneath) { needsSprayer = true; sprayerNote = ' (needed for underside/joist access)'; }

    // Wash prep — the prep choice is stored on `p.condition` (NOT
    // `p.prep` — earlier guess was wrong, which is why this block was
    // silently never firing). Soft wash and strip/sand both require
    // a pressure washer + cleaner + brightener. Strip/sand is much
    // slower because of the extra scrub/sand pass.
    //
    // Time per the user's calibration: soft wash adds ~6 hours per
    // 100 linear feet of fence (so roughly 6h / 200 sq ft for non-
    // fence projects, since 100 lf at 6ft tall ≈ 600 sq ft of one-
    // side surface). Strip/sand takes ~2.5× as long.
    let prepHoursForThisProj = 0;
    if (p.condition === 'soft_wash' || p.condition === 'strip_sand') {
      needsWashChems = true;
      needsPressureWasher = true;
      // Coverage units — pick the scope number that the chem rate is
      // calibrated against: lin ft for fences, sq ft for everything else.
      let prepScope = 0;
      if (p.type === 'fence') prepScope = m.linearft || 0;
      else if (p.type === 'deck') prepScope = (m.flat || 0) * (m.underneath ? 2 : 1) + (m.lattice || 0);
      else prepScope = m.sqft || 0;

      // Chem pails — one 5-gal pail of each covers ~200 lin ft of
      // fence OR ~800 sq ft of flat surface at typical concentrations.
      const pailsForThisProj = p.type === 'fence'
        ? Math.max(1, Math.ceil(prepScope / 200))
        : Math.max(1, Math.ceil(prepScope / 800));
      // Strip/sand needs ~50% more chemistry (stronger mix + extra pass).
      const chemMultiplier = p.condition === 'strip_sand' ? 1.5 : 1.0;
      washChemPails += Math.ceil(pailsForThisProj * chemMultiplier);

      // Prep time — soft wash 6 hrs per 100 lf fence (or per 600 sq
      // ft equivalent on flat surfaces). Strip/sand ~2.5× that.
      const softWashRate = p.type === 'fence' ? (6 / 100) : (6 / 600);
      const stripMultiplier = p.condition === 'strip_sand' ? 2.5 : 1.0;
      prepHoursForThisProj = Math.max(2, Math.ceil(prepScope * softWashRate * stripMultiplier));
      totalHours += prepHoursForThisProj;

      if (p.condition === 'strip_sand' && !washChemNote.includes('strip')) {
        washChemNote = ' (heavier mix needed for stripping back to bare wood)';
      }
    }

    const coatNote = isOneCoat ? '1 coat' : (p.productType === 'oil' ? 'oil-based' : '2 coats');
    const pailsLabel = pails === 1 ? '1 pail' : `${pails} pails`;
    // Per-project total = stain + tools + time (staining + prep) +
    // citronella + addon impact. (sprayer + pressure washer are
    // amortized across all projects so they aren't included here.)
    const projectHours = hours + prepHoursForThisProj;
    const projectTotal = stainTotalForProj + toolsCost + (projectHours * HOURLY_RATE) + citronellaCostForProj + addonMat;
    const addonNote = addonPro > 0 ? `, +$${addonMat} addon materials, +${addonHrs} hrs for add-ons` : '';
    const prepHoursNote = prepHoursForThisProj > 0
      ? `, +${prepHoursForThisProj} hrs ${p.condition === 'strip_sand' ? 'strip/sand prep' : 'soft wash prep'}`
      : '';
    projectLines.push({
      label: `${PROJECT_META[p.type].icon} ${PROJECT_META[p.type].name} — ${pailsLabel} × $${pailCost} stain, $${toolsCost} tools, ${projectHours} hrs @ $${HOURLY_RATE}/hr${citronellaCostForProj > 0 ? `, +$${citronellaCostForProj} citronella` : ''}${prepHoursNote}${addonNote}`,
      total: projectTotal
    });
  });

  const sprayerCost = needsSprayer ? ((typeof D.sprayerCost === 'number') ? D.sprayerCost : 249) : 0;
  const pressureWasherCost = needsPressureWasher ? PRESSURE_WASHER_COST : 0;
  const washChemCost = needsWashChems
    ? washChemPails * (SODIUM_METASILICATE_PER_PAIL + OXALIC_ACID_PER_PAIL)
    : 0;
  const timeCost = totalHours * HOURLY_RATE;
  // totalAddonMaterial captures the extra supplies a homeowner buys for
  // each add-on (replacement boards, hardware, sealers, etc.). The hours
  // for those add-ons are already folded into totalHours above, so we
  // don't double-count them in timeCost.
  const diyTotal = totalStainCost + totalCitronellaCost + sprayerCost + pressureWasherCost
    + washChemCost + totalToolsCost + timeCost + totalAddonMaterial;
  const savings = Math.max(0, diyTotal - proTotal);

  // Per-project list — only when 2+ projects. Each line shows that project's
  // FULL DIY cost (stain + tools + time + citronella), not just one slice,
  // so the numbers actually add up the way the customer expects.
  const perProjectHtml = projects.length > 1
    ? `<div class="diy-project-list">${projectLines.map(pl =>
        `<div class="diy-project-item"><span>${pl.label}</span><span>$${pl.total.toLocaleString()}</span></div>`
      ).join('')}${sprayerCost > 0 ? `<div class="diy-project-item" style="font-style:italic;color:var(--slate);"><span>+ Graco Project Plus sprayer (shared)</span><span>$${sprayerCost.toLocaleString()}</span></div>` : ''}</div>` : '';

  return `
    <div class="diy-comparison">
      <h4>How does DIY actually compare?${projects.length > 1 ? ` <small>(all ${projects.length} projects in this quote)</small>` : ''}</h4>
      <p class="diy-blurb">If you tackled this yourself, here's an honest estimate using contractor-grade materials at the prices a homeowner would actually pay at the store:</p>
      ${perProjectHtml}
      <div class="diy-row"><span>Stain (${totalPails} × 5 gal pails @ non-contractor pricing)</span><span>$${totalStainCost.toLocaleString()}</span></div>
      ${totalCitronellaCost > 0 ? `<div class="diy-row"><span>EXPERT Natural Defense citronella additive ($${CITRONELLA_PER_PAIL} per 5 gal)</span><span>$${totalCitronellaCost.toLocaleString()}</span></div>` : ''}
      ${washChemCost > 0 ? `<div class="diy-row"><span>EXPERT Clean &amp; Bright system — sodium metasilicate cleaner + oxalic acid brightener (${washChemPails} × 5 gal each)${washChemNote}</span><span>$${washChemCost.toLocaleString()}</span></div>` : ''}
      ${pressureWasherCost > 0 ? `<div class="diy-row"><span>Pressure washer — homeowner-grade 2500 PSI electric (one-time purchase, used for prep wash)</span><span>$${pressureWasherCost}</span></div>` : ''}
      ${sprayerCost > 0 ? `<div class="diy-row"><span>Graco Project Plus airless sprayer${sprayerNote}</span><span>$${sprayerCost}</span></div>` : ''}
      <div class="diy-row"><span>Brushes, rollers, applicator pads, drop cloths, sheeting${projects.length>1 ? ' (all projects)' : ''}</span><span>$${totalToolsCost.toLocaleString()}</span></div>
      <div class="diy-row"><span>Your time (~${totalHours} hrs × $${HOURLY_RATE}/hr)</span><span>$${timeCost.toLocaleString()}</span></div>
      <div class="diy-row diy-total"><span>Estimated DIY cost</span><span>$${diyTotal.toLocaleString()}</span></div>
      ${savings > 0
        ? `<p class="diy-conclusion">Hiring us costs <strong>$${Math.round(proTotal).toLocaleString()}</strong> — about <strong>$${savings.toLocaleString()} less</strong> than DIY when you factor in your time. Plus you get our warranty, professional-grade prep, and your weekend back to actually enjoy the yard.</p>`
        : `<p class="diy-conclusion" style="background:var(--green-pale);color:#1f4d36;">For projects this size, the DIY math is close. The difference becomes our warranty, professional-grade prep, the fact that we're fully licensed and insured (no liability falling on you), and your weekend free to actually enjoy the yard instead of working on it.</p>`}
    </div>`;
}

function getQuoteExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function renderBundleOnlyBreakdown(totals) {
  // Compute math-walk-through pieces. Use GROSS (pre-discount) project
  // totals so the deductions below add up to the displayed Grand Total.
  // sumOfSubs would otherwise be post-per-project-discount and the
  // "Stacked discounts" line below would visually double-count.
  const bundledGross = state.bundledProjects.map(p => {
    const c = p._cached || {};
    return (Number(c.subtotal) || 0) + (Number(c.discountAmount) || 0);
  });
  const sumOfGross = bundledGross.reduce((s, x) => s + x, 0);
  const totalSavings = (totals.bundleDiscount || 0) + (totals.totalDiscountSavings || 0);

  __doc.getElementById('breakdownMain').innerHTML = `
    <h3>Bundled Quote Summary</h3>
    <p style="color:var(--slate);font-size:13px;margin-bottom:14px;">No active project — quote consists of the bundled projects above. Click <strong>Edit</strong> on any card to bring it back into the editor.</p>

    <!-- Quote-level notes — captured from the side-tracker, sent to Jobber later -->
    ${state.notes && state.notes.trim() ? `
      <div class="review-notes-box">
        <h4>📝 Notes for this quote</h4>
        <p>${state.notes.trim().replace(/</g, '&lt;')}</p>
      </div>
    ` : ''}

    <!-- MATH WALK-THROUGH — explicit so the customer can see how the Grand Total was reached -->
    ${state.bundledProjects.length > 0 ? `
      <div class="math-walk">
        <h4>How we got to the Grand Total</h4>
        ${state.bundledProjects.map((p, i) => `
          <div class="math-walk-row"><span>${PROJECT_META[p.type].icon} ${PROJECT_META[p.type].name} (bundled)</span><span>$${Math.round(bundledGross[i]).toLocaleString()}</span></div>
        `).join('')}
        <div class="math-walk-row math-walk-subtotal"><span>Quote subtotal</span><span>$${Math.round(sumOfGross).toLocaleString()}</span></div>
        ${totals.totalDiscountSavings > 0 ? `<div class="math-walk-row math-walk-discount"><span>Stacked discounts</span><span>−$${Math.round(totals.totalDiscountSavings).toLocaleString()}</span></div>` : ''}
        ${totals.bundleDiscount > 0 ? `<div class="math-walk-row math-walk-discount"><span>Bundle discount (10%)</span><span>−$${Math.round(totals.bundleDiscount).toLocaleString()}</span></div>` : ''}
        ${totalSavings > 0 ? `<div class="math-walk-row math-walk-total-savings"><span>Total savings</span><span>−$${Math.round(totalSavings).toLocaleString()}</span></div>` : ''}
      </div>
    ` : ''}

    <!-- DIY cost comparison — works across bundled projects -->
    ${computeDIYComparison(totals.finalTotal)}

    <!-- GRAND TOTAL -->
    <div class="grand-total" style="margin-top:18px;">
      <span class="label">${state.bundledProjects.length > 0 ? 'Quote Grand Total (all ' + state.bundledProjects.length + ' projects)' : 'Grand Total'}</span>
      <div class="grand-total-amount-block">
        <span class="amount">$${Math.round(totals.finalTotal).toLocaleString()}</span>
        ${totalSavings > 0
          ? `<span class="grand-total-savings">Includes $${Math.round(totalSavings).toLocaleString()} in total savings</span>`
          : ''}
      </div>
    </div>

    <!-- Quote expiry banner -->
    <div class="quote-expiry-banner" style="margin-top:16px;">
      <span class="icon">📅</span>
      <div>This quote is locked through <strong>${getQuoteExpiryDate()}</strong> (30 days). Book within 24 hours to lock in an extra 5% off with the "Book Today" discount on Step 9.</div>
    </div>

    <!-- Risk reversal -->
    <div class="risk-reversal-box">
      <h4>You're covered</h4>
      <ul>
        <li><strong>Fully licensed &amp; insured</strong> in South Carolina — no risk to you</li>
        <li><strong>Free 30-day touch-up visit</strong> on Performance and Showcase tiers — if you spot any miss, we come back free</li>
        <li><strong>We don't get paid until you're happy</strong> — only 25% deposit at scheduling reserves your slot; balance is due after completion (Wisetack covers that 75% balance if you finance)</li>
        <li><strong>Quote is final &amp; transparent</strong> — no hidden fees, no surprise upsells on-site</li>
      </ul>
    </div>

    <!-- Payment options -->
    <div class="payment-options" style="margin-top: 16px; padding: 16px; background: var(--cream); border-radius: 10px; font-size: 13px; color: var(--slate);">
      <strong style="color: var(--navy); font-size: 14px;">Payment options:</strong>
      <div class="pay-opt-grid" style="margin-top:10px; display:flex; flex-direction:column; gap:10px;">
        <label class="pay-opt" style="display:flex; align-items:flex-start; gap:10px; padding:12px; background:var(--paper); border:1.5px solid var(--line); border-radius:8px; cursor:pointer;">
          <input type="radio" name="pay" value="deposit" ${state.paymentMethod === 'deposit' ? 'checked' : ''} onchange="state.paymentMethod=this.value; renderFinalBreakdown();" style="margin-top:3px;">
          <div style="flex:1;">
            <div style="font-weight:700; color:var(--navy);">25% deposit + balance on completion</div>
            <div style="margin-top:6px; font-size:13px; line-height:1.5;">
              <strong style="color:var(--navy);">Deposit due at scheduling: $${Math.round(totals.finalTotal * 0.25).toLocaleString()}</strong><br>
              <span>Remaining balance after we finish: $${Math.round(totals.finalTotal * 0.75).toLocaleString()}</span>
            </div>
          </div>
        </label>
        <label class="pay-opt" style="display:flex; align-items:flex-start; gap:10px; padding:12px; background:var(--paper); border:1.5px solid var(--line); border-radius:8px; cursor:pointer;">
          <input type="radio" name="pay" value="wisetack" ${state.paymentMethod === 'wisetack' ? 'checked' : ''} onchange="state.paymentMethod=this.value; renderFinalBreakdown();" style="margin-top:3px;">
          <div style="flex:1;">
            <div style="font-weight:700; color:var(--navy);">25% deposit + financing through Wisetack <span class="payment-pill" style="margin-left:6px;">0% APR available if you qualify</span></div>
            <div style="margin-top:6px; font-size:13px; line-height:1.5;">
              <strong style="color:var(--navy);">Deposit due at scheduling: $${Math.round(totals.finalTotal * 0.25).toLocaleString()}</strong><br>
              <strong style="color:var(--navy);">Wisetack covers the remaining $${Math.round(totals.finalTotal * 0.75).toLocaleString()}</strong> — ≈ $${Math.round((totals.finalTotal * 0.75)/24).toLocaleString()}/mo over 24 months · soft credit pull, no impact on your score<br>
              <span style="font-size:11px;">*Estimate only — qualified applicants may receive 0% APR. Actual rate &amp; term determined by Wisetack after credit check. The 25% deposit reserves your scheduling slot and is required on every quote.</span>
            </div>
          </div>
        </label>
      </div>
    </div>`;
}

function describeMeasurementLines() {
  const proj = state.activeProject.type;
  const m = state.activeProject.measurements;
  if (proj === 'fence') {
    const total = m.linearft || 0;
    const partial = +m.oneSidedLnFt || 0;
    let sidesLabel;
    if (!m.oneSided) sidesLabel = 'Both sides (standard)';
    else if (partial > 0 && partial < total) sidesLabel = `${partial} ln ft one-side only · ${total - partial} ln ft both sides`;
    else sidesLabel = 'One side only (entire fence)';
    return [
      { label: 'Linear feet', value: `${total} ft` },
      { label: 'Average height', value: `${m.height || 0} ft` },
      { label: 'Style', value: styleName(m.style) },
      { label: 'Sides', value: sidesLabel }
    ];
  }
  if (proj === 'deck') return [
    { label: 'Flat surface', value: `${m.flat || 0} sq ft${m.underneath ? ' (×2 underneath)' : ''}` },
    { label: 'Railing', value: `${m.rail || 0} ln ft` },
    { label: 'Stairs', value: `${m.stairs || 0}` },
    ...(m.lattice ? [{ label: 'Lattice/walls', value: `${m.lattice} sq ft` }] : [])
  ];
  if (proj === 'pergola') return [
    ...((m.length || m.width) ? [{ label: 'Footprint', value: `${m.length || 0} × ${m.width || 0} ft${m.height ? ` × ${m.height} ft tall` : ''}` }] : []),
    { label: 'Stainable surface', value: `${m.sqft || 0} sq ft (calculated)` },
    ...(m.overhead ? [{ label: 'Overhead access', value: 'Yes' }] : [])
  ];
  if (proj === 'barn') return [
    { label: 'Siding', value: `${m.sqft || 0} sq ft` },
    ...(m.heightPremium ? [{ label: 'Height premium', value: 'Above 12 ft' }] : []),
    ...(m.trim ? [{ label: 'Trim/fascia', value: `${m.trim} ln ft` }] : []),
    ...(m.cupolaCount ? [{ label: 'Cupolas', value: `${m.cupolaCount}` }] : []),
    ...(m.liftDays ? [{ label: 'Lift rental', value: `${m.liftDays} day(s)` }] : [])
  ];
  if (proj === 'ceiling') return [
    { label: 'Ceiling area', value: `${m.sqft || 0} sq ft` },
    ...(m.tng ? [{ label: 'Tongue-and-groove', value: 'Yes' }] : []),
    ...(m.beamLnFt ? [{ label: 'Beam two-tone', value: `${m.beamLnFt} ln ft` }] : []),
    ...(m.fixtures ? [{ label: 'Fixtures covered & masked', value: `${m.fixtures}` }] : []),
    ...(m.fans ? [{ label: 'Fans covered & masked', value: `${m.fans}` }] : []),
    ...(m.furnProtect ? [{ label: 'Furniture protection', value: 'Yes' }] : [])
  ];
  return [];
}

function describeBundledRow(p) {
  const m = p.measurements;
  if (p.type === 'fence') {
    const total = m.linearft || 0;
    const partial = +m.oneSidedLnFt || 0;
    let sidesNote = '';
    if (m.oneSided && partial > 0 && partial < total) sidesNote = ` · ${partial} ln ft one-side`;
    else if (m.oneSided) sidesNote = ' · one-side only';
    return `${total} ln ft · ${m.height || 0} ft tall${sidesNote} · ${prepLabel(p.condition)}`;
  }
  if (p.type === 'deck') return `${m.flat || 0} sq ft flat${m.rail ? ' + ' + m.rail + ' ln ft rail' : ''} · ${prepLabel(p.condition)}`;
  if (p.type === 'pergola') return `${m.sqft || 0} sq ft · ${prepLabel(p.condition)}`;
  if (p.type === 'barn') return `${m.sqft || 0} sq ft siding · ${prepLabel(p.condition)}`;
  if (p.type === 'ceiling') return `${m.sqft || 0} sq ft ceiling · ${prepLabel(p.condition)}`;
  return prepLabel(p.condition);
}

function styleName(s) { return { privacy: 'Privacy', charleston: 'Charleston', shadowbox: 'Shadowbox', bob: 'Board-on-Board', charleston_bob: 'Charleston BOB', farm: 'Farm Fence' }[s] || 'Privacy'; }

function prepLabel(c) { return { no_wash: 'No wash — light cleaning only', soft_wash: 'Soft wash + brightener (sodium metasilicate + oxalic acid)', strip_sand: 'Surface preparation (strip or sand as the condition requires)' }[c]; }

function computeSingleAddonCost(id, qty) {
  const def = findAddonDef(id); if (!def) return 0;
  const m = state.activeProject.measurements;
  const proj = state.activeProject.type;
  const tierBase = computeTierBase();
  if (def.priceType === 'flat') return def.rate;
  if (def.priceType === 'each' || def.priceType === 'each_lnft') return def.rate * qty;
  if (def.priceType === 'per_unit') {
    const units = proj === 'fence' ? (m.linearft || 0) : (m.sqft || m.flat || 0);
    const rate = addonEffectiveRate(def, proj);
    let amount = rate * units;
    if (def.minCharge && amount < def.minCharge && units > 0) amount = def.minCharge;
    return amount;
  }
  if (def.priceType === 'per_unit_trim') return def.rate * (m.trim || 0);
  if (def.priceType === 'percent') return tierBase * def.rate;
  return 0;
}

function renderEditPanel() {
  const proj = state.activeProject.type;
  if (!proj) { __doc.getElementById('editPanel').innerHTML = '<h3>Adjust & Recalculate</h3><p style="font-size:13px;color:var(--slate);">No active project to edit.</p>'; return; }
  const product = state.activeProject.productType;
  const isHoaMode = isHoa();
  const sample = isHoaMode ? null : computeSampleTierPrices(product);

  const tiersHtml = isHoaMode
    ? `<div class="mini-tier-row active"><span class="label">HOA-Specified<br><small style="font-size:11px;color:var(--slate);font-weight:400;">Locked to Performance rate</small></span><span class="price">$${Math.round(computeTierBase()).toLocaleString()}</span></div>`
    : ['essential', 'performance', 'showcase'].map(t => {
        const tm = getTierMeta(product, t);
        return `
          <div class="mini-tier-row ${state.activeProject.tier === t ? 'active' : ''}" onclick="setTier('${t}')">
            <span class="label">${t.charAt(0).toUpperCase() + t.slice(1)}<br><small style="font-size:11px;color:var(--slate);font-weight:400;">${tm.product}</small></span>
            <span class="price">$${Math.round(sample[t]).toLocaleString()}</span>
          </div>`;
      }).join('');

  const stainUpgrades = PRICING.stainUpgrades.filter(a => !a.product || a.product === product);
  const projAddons = PRICING.projectAddons[proj] || [];

  const renderMini = (a, group) => {
    const stored = group === 'service' ? state.activeProject.serviceAddons[a.id] : state.activeProject.addons[a.id];
    const checked = !!stored;
    const qty = (typeof stored === 'object' && stored.qty) ? stored.qty : 1;
    const showQty = checked && needsQty(a);
    const qtyControl = showQty
      ? `<input type="number" min="1" step="1" value="${qty}" class="mini-qty-input"
             onclick="event.stopPropagation()"
             onchange="setAddonInlineQty('${a.id}', '${group}', this.value)"
             aria-label="Quantity">`
      : '';
    return `<div class="mini-toggle ${checked ? 'checked' : ''}" onclick="toggleAddonInline('${a.id}', '${group}')"><div class="check"></div><div class="name">${a.name}</div>${qtyControl}<div class="price">${formatAddonPrice(a)}</div></div>`;
  };

  let colorSection = '';
  if (isHoa()) {
    colorSection = `<div class="side-section"><h4>HOA Color</h4><div class="color-pill hoa"><span class="dot"></span>${state.activeProject.hoa.brand}<br>${state.activeProject.hoa.color}</div><button onclick="showStage(5)" style="margin-top:8px;background:var(--line-soft);padding:6px 10px;border-radius:6px;font-size:12px;font-weight:600;width:100%;">Edit HOA info →</button></div>`;
  } else if (!isClearSealer()) {
    const c = state.activeProject.selectedColor;
    const libKey = getColorLibrary(product, state.activeProject.tier);
    const lib = COLORS[libKey];
    const dotStyle = c && c.img ? `background-image:url('${c.img}')` : (c ? `background:${c.hex}` : '');
    colorSection = `
      <div class="side-section">
        <h4>Color (${lib.line})</h4>
        ${c ? `<div class="color-pill"><span class="dot" style="${dotStyle}"></span>${c.name}${c.code ? ' · ' + c.code : ''}</div>` : '<p style="font-size:12px;color:var(--coral);">No color selected</p>'}
        <button onclick="showStage(7)" style="margin-top:8px;background:var(--line-soft);padding:6px 10px;border-radius:6px;font-size:12px;font-weight:600;width:100%;">Change color →</button>
      </div>`;
  } else {
    colorSection = `<div class="side-section"><h4>Color</h4><div class="color-pill"><span class="dot" style="background:transparent;border-color:var(--slate);"></span>Clear sealer (no color)</div></div>`;
  }

  // Active discount summary
  const disc = bestDiscountRate();
  const discountSection = `
    <div class="side-section">
      <h4>Discount</h4>
      ${disc.rate > 0 ? `<div style="font-size:13px;color:var(--green);font-weight:700;">${disc.label}: −${(disc.rate * 100).toFixed(0)}%</div>` : '<div style="font-size:13px;color:var(--slate);">No discount applied</div>'}
      <button onclick="showStage(9)" style="margin-top:8px;background:var(--line-soft);padding:6px 10px;border-radius:6px;font-size:12px;font-weight:600;width:100%;">Change discount →</button>
    </div>`;

  const panel = __doc.getElementById('editPanel');
  // Default-collapse on first mount when on mobile (≤760px). Once the user
  // toggles it open/closed once, the state persists across re-renders.
  if (window.matchMedia('(max-width: 760px)').matches && !panel.dataset.collapseInit) {
    panel.classList.add('edit-panel-collapsed');
    panel.dataset.collapseInit = '1';
  } else if (!panel.dataset.collapseInit) {
    panel.dataset.collapseInit = '1';
  }
  panel.innerHTML = `
    <button class="edit-panel-toggle" type="button" onclick="toggleEditPanel()">
      <h3>Adjust &amp; Recalculate</h3>
      <span class="edit-panel-arrow" aria-hidden="true">▾</span>
    </button>
    <div class="edit-panel-body">
      <div class="side-section">
        <h4>Product</h4>
        <div style="display:flex;gap:6px;">
          <button style="flex:1;padding:8px;border-radius:8px;background:${product === 'water' ? 'var(--navy)' : 'var(--line-soft)'};color:${product === 'water' ? 'white' : 'var(--navy)'};font-weight:600;font-size:13px;" onclick="setProduct('water')">💧 Water</button>
          <button style="flex:1;padding:8px;border-radius:8px;background:${product === 'oil' ? 'var(--navy)' : 'var(--line-soft)'};color:${product === 'oil' ? 'white' : 'var(--navy)'};font-weight:600;font-size:13px;" onclick="setProduct('oil')">🛢️ Oil</button>
        </div>
      </div>
      <div class="side-section"><h4>Tier</h4>${tiersHtml}</div>
      ${colorSection}
      <div class="side-section"><h4>Stain Upgrades</h4>${stainUpgrades.map(a => renderMini(a, 'stain')).join('')}</div>
      <div class="side-section"><h4>${PROJECT_META[proj].name} Add-ons</h4>${projAddons.map(a => renderMini(a, 'project')).join('')}</div>
      ${discountSection}
    </div>`;
}

function toggleEditPanel() {
  const panel = __doc.getElementById('editPanel');
  if (panel) panel.classList.toggle('edit-panel-collapsed');
}

function setTier(t) {
  const old = state.activeProject.tier;
  if (old !== t) {
    rememberCurrentColor();
    state.activeProject.tier = t;
    restoreColorForCurrentLib();
  } else {
    state.activeProject.tier = t;
  }
  state.activeProject.tierConfirmed = true;
  renderFinalBreakdown(); updateRunningTotal();
}
function setProduct(p) {
  const old = state.activeProject.productType;
  if (old !== p) {
    rememberCurrentColor();
    state.activeProject.productType = p;
    restoreColorForCurrentLib();
  } else {
    state.activeProject.productType = p;
  }
  delete state.activeProject.addons.citronella;
  renderFinalBreakdown(); updateRunningTotal();
}
function setAddonInlineQty(id, group, val) {
  const qty = Math.max(1, parseInt(val) || 1);
  const target = group === 'service' ? state.activeProject.serviceAddons : state.activeProject.addons;
  if (target[id]) target[id] = { qty };
  renderFinalBreakdown(); updateRunningTotal();
}

function toggleAddonInline(id, group) {
  const def = findAddonDef(id);
  const target = group === 'service' ? state.activeProject.serviceAddons : state.activeProject.addons;
  if (target[id]) delete target[id];
  else target[id] = needsQty(def) ? { qty: 1 } : true;
  renderFinalBreakdown(); updateRunningTotal();
}

/* ============================================================
   BUNDLE
   ============================================================ */
function addAnotherProject() {
  // If we have a partially-built active project, push it into the bundle first
  // so it isn't lost. If active is empty (e.g. just collapsed or just removed
  // the last one and clicked "Add"), skip the push and just start a fresh
  // project — don't alert "add a project first" when we have bundled projects.
  if (state.activeProject.type) {
    const totals = computeProjectTotal();
    const cached = JSON.parse(JSON.stringify(state.activeProject));
    cached._cached = totals;
    state.bundledProjects.push(cached);
  } else if (state.bundledProjects.length === 0) {
    // Truly empty quote — nothing to push, nothing to bundle yet. Send the user
    // back to Step 2 to pick a project type (this is the only path that should
    // ever say "you don't have a project yet").
    showStage(2);
    return;
  }
  // Inherit project-level discounts from the most recent project. Vet/Senior/
  // Teacher/Referral/Repeat-Customer/Cash are customer attributes — if the
  // homeowner qualified on project #1 they qualify on project #2 too. The
  // rep can still un-check any of them on the new project's discounts step.
  const inheritedDiscounts = (function () {
    const lastBundled = state.bundledProjects[state.bundledProjects.length - 1];
    const src = lastBundled && lastBundled.selectedDiscounts;
    return Array.isArray(src) ? src.slice() : [];
  })();
  // Remember we're in the middle of adding so the user can cancel back to Review
  state._returnToReviewOnCancel = true;
  state.activeProject = makeBlankProject();
  state.activeProject.selectedDiscounts = inheritedDiscounts;
  state.editingBundleIdx = null;
  state.maxStageReached = 2;
  const next = __doc.getElementById('stage2Next'); if (next) next.disabled = true;
  refreshStage2Selection();
  showStage(2);
  updateRunningTotal();
}

// Cancel adding a new project — restore the last-bundled project as active and
// return to Step 10 (Review). Wired up from the "Cancel & return to review" button.
function cancelAddProject() {
  if (state.bundledProjects.length === 0) { showStage(10); return; }
  // If the user typed anything into the new project, discard it
  state.activeProject = makeBlankProject();
  // Pop the last-bundled back into active so they have a focused project
  const last = state.bundledProjects.pop();
  if (last) { delete last._cached; state.activeProject = last; state.activeProject.tierConfirmed = true; }
  state.maxStageReached = 10;
  state._returnToReviewOnCancel = false;
  showStage(10);
  updateRunningTotal();
}

// Collapse the active project on the Review screen — pushes it into the bundled stack
// (so it shows as a compact card up top) and re-renders the breakdown to show only
// the grand-total summary. To bring it back, the user clicks "Edit" on its card.
function collapseActiveProject() {
  if (!state.activeProject.type) return;
  const totals = computeProjectTotal();
  const cached = JSON.parse(JSON.stringify(state.activeProject));
  cached._cached = totals;
  state.bundledProjects.push(cached);
  state.activeProject = makeBlankProject();
  state.editingBundleIdx = null;
  renderFinalBreakdown();  // re-render in bundle-only mode
  updateRunningTotal();
  // Scroll up so the user can see the project now sitting in the bundle stack at top
  scrollAppToTop();
}

function editBundledProject(idx) {
  if (!confirm('Load this project into the active editor? Your current in-progress project will be saved to the bundle first if it has data.')) return;
  if (state.activeProject.type) {
    const totals = computeProjectTotal();
    const cached = JSON.parse(JSON.stringify(state.activeProject));
    cached._cached = totals;
    state.bundledProjects.push(cached);
  }
  const editing = state.bundledProjects[idx];
  delete editing._cached;
  state.activeProject = editing;
  // A bundled project was already complete — treat its tier as confirmed
  state.activeProject.tierConfirmed = true;
  state.bundledProjects.splice(idx, 1);
  state.editingBundleIdx = idx;
  // Allow full navigation across all stages since this project is "complete"
  state.maxStageReached = 10;
  refreshStage2Selection();
  showStage(2);
  updateRunningTotal();
}

function cancelEditBundled() { state.editingBundleIdx = null; refreshStage2Selection(); }

function removeBundledProject(idx) {
  if (!confirm('Remove this project from the bundle?')) return;
  state.bundledProjects.splice(idx, 1);
  renderFinalBreakdown();
  updateRunningTotal();
}

/* ============================================================
   PDF
   ============================================================ */
function generatePDF() {
  const totals = computeAllTotals();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const W = 612, M = 48;
  let y = M;

  doc.setFillColor(26, 37, 64);
  doc.rect(0, 0, W, 80, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('Superior Stain Solutions', M, 38);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text('Professional fence, deck & exterior wood staining', M, 56);
  doc.setFontSize(9);
  doc.text(`Quote ${state.quoteId}`, W - M - 100, 38);
  doc.text(new Date().toLocaleDateString(), W - M - 100, 56);

  y = 110;
  doc.setTextColor(26, 37, 64);
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text('Quote for ' + (state.customer.name || '—'), M, y); y += 18;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 99, 120);
  doc.text(`${state.customer.address || ''}`, M, y); y += 13;
  doc.text(`${state.customer.phone || ''} · ${state.customer.email || ''}`, M, y); y += 13;
  if (state.customer.jobberNum) { doc.text(`Jobber Job: ${state.customer.jobberNum}`, M, y); y += 13; }
  doc.text(`Prepared by: ${state.customer.employee || ''}`, M, y); y += 22;

  doc.setDrawColor(236, 233, 227);
  doc.line(M, y, W - M, y); y += 14;

  const allProjects = [...(state.activeProject.type ? [{ ...state.activeProject, _cached: totals.active }] : []), ...state.bundledProjects];
  allProjects.forEach((p) => {
    const meta = PROJECT_META[p.type];
    const tier = getTierMeta(p.productType, p.tier);
    doc.setTextColor(26, 37, 64);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text(`${meta.name} — ${p.tier.charAt(0).toUpperCase() + p.tier.slice(1)} (${p.productType})`, M, y);
    doc.text('$' + Math.round(p._cached.subtotal).toLocaleString(), W - M, y, { align: 'right' });
    y += 14;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.setTextColor(90, 99, 120);
    doc.text(tier.product + ' · Expected life: ' + tier.life, M, y); y += 13;

    if (p.productType === 'hoa') {
      doc.text(`HOA Color: ${p.hoa.brand} — ${p.hoa.color}${p.hoa.productName ? ' (' + p.hoa.productName + ')' : ''}`, M, y); y += 11;
      if (p.hoa.transparency) { doc.text(`  Transparency: ${p.hoa.transparency}`, M, y); y += 11; }
    } else if (p.selectedColor) {
      doc.text(`Color: ${p.selectedColor.name}${p.selectedColor.code ? ' (' + p.selectedColor.code + ')' : ''}`, M, y); y += 11;
    } else if (p.productType === 'oil' && p.tier === 'essential') {
      doc.text(`Color: Clear sealer (no pigment)`, M, y); y += 11;
    }

    const old = state.activeProject;
    state.activeProject = p;
    describeMeasurementLines().forEach(l => { doc.text(`• ${l.label}: ${l.value}`, M + 12, y); y += 11; });
    state.activeProject = old;

    if (p._cached.prep > 0) { doc.text(`• Prep: ${prepLabel(p.condition)} — $${p._cached.prep.toFixed(2)}`, M + 12, y); y += 11; }

    if (p.previousStain && p.previousStain.wasStained) {
      const typeLabel = p.previousStain.previousProductType === 'water' ? 'Water-based' : (p.previousStain.previousProductType === 'oil' ? 'Oil-based' : 'Unknown type');
      const prev = (p.previousStain.previousProductType === 'unsure' || !p.previousStain.brand) ? typeLabel : `${p.previousStain.brand}${p.previousStain.transparency ? ' / ' + p.previousStain.transparency : ''}`;
      doc.text(`• Previously stained: ${prev}`, M + 12, y); y += 11;
    }

    if (p.customAddons && p.customAddons.length) {
      doc.text(`• Custom items:`, M + 12, y); y += 11;
      p.customAddons.forEach(c => {
        const priceStr = c.priceType === 'flat' ? `$${(+c.rate).toFixed(2)}`
          : c.priceType === 'per_unit' ? `$${(+c.rate).toFixed(2)}/unit`
          : `${(+c.rate).toFixed(1)}%`;
        doc.text(`    – ${c.name} (${priceStr})`, M + 12, y); y += 11;
      });
    }

    y += 6;
    doc.line(M, y, W - M, y); y += 14;
    if (y > 700) { doc.addPage(); y = M; }
  });

  doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(26, 37, 64);
  doc.text('Subtotal', M, y);
  doc.text('$' + (totals.sumBeforeBundle).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}), W - M, y, { align: 'right' });
  y += 16;
  if (totals.bundleDiscount > 0) {
    doc.setTextColor(45, 110, 78);
    doc.text(`Bundle discount (${totals.projectsCount} projects, 10% off)`, M, y);
    doc.text('−$' + totals.bundleDiscount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}), W - M, y, { align: 'right' });
    y += 16;
  }

  y += 8;
  doc.setFillColor(26, 37, 64);
  doc.rect(M, y, W - 2*M, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL', M + 16, y + 26);
  doc.setFontSize(20);
  doc.text('$' + Math.round(totals.finalTotal).toLocaleString(), W - M - 16, y + 26, { align: 'right' });
  y += 60;

  doc.setTextColor(26, 37, 64); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text('Payment Terms', M, y); y += 14;
  doc.setFont('helvetica', 'normal');
  if (state.paymentMethod === 'wisetack') {
    doc.text(`Wisetack financing available — approx $${Math.round(totals.finalTotal/24).toLocaleString()}/mo over 24 months`, M, y); y += 12;
    doc.text('(Final rate determined by Wisetack credit check)', M, y); y += 16;
  } else {
    doc.text(`25% deposit ($${Math.round(totals.finalTotal*0.25).toLocaleString()}) due at scheduling.`, M, y); y += 12;
    doc.text(`Remaining 75% ($${Math.round(totals.finalTotal*0.75).toLocaleString()}) due upon project completion.`, M, y); y += 16;
  }

  // Quote notes (if any) — wrap to keep on-page
  if (state.notes && state.notes.trim()) {
    if (y > 680) { doc.addPage(); y = M; }
    doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 37, 64);
    doc.text('Notes', M, y); y += 14;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const wrapped = doc.splitTextToSize(state.notes.trim(), W - 2 * M);
    wrapped.forEach(line => {
      if (y > 750) { doc.addPage(); y = M; }
      doc.text(line, M, y); y += 11;
    });
    y += 8;
  }

  doc.setTextColor(90, 99, 120); doc.setFontSize(8);
  doc.text('Quote valid for 30 days. Final price may vary if measurements differ from on-site verification.', M, 760);
  doc.text('Superior Stain Solutions LLC · superiorstainsolutions.com', M, 772);

  doc.save(`Quote-${state.quoteId}-${(state.customer.name || 'customer').replace(/\s+/g,'_')}.pdf`);
}

/* ============================================================
   FINALIZE
   ============================================================ */
function finalizeQuote(sendMethod) {
  // sendMethod: 'upload' (default) — save the quote to Jobber as a
  // Draft. The rep opens it in Jobber from the success screen via a
  // prominent button. We intentionally do NOT pre-open a tab here:
  // Safari/iPad popup blockers + the async fetch's gesture rules made
  // that flow show a blank "about:blank" tab too often. One-button
  // flow on the next page is more reliable.
  if (!sendMethod) sendMethod = 'upload';
  state.__sendMethod = sendMethod;
  const totals = computeAllTotals();
  const allProjects = [...(state.activeProject.type ? [{ ...state.activeProject, _cached: totals.active }] : []), ...state.bundledProjects];
  const payload = {
    quoteId: state.quoteId, createdAt: new Date().toISOString(),
    customer: state.customer,
    // employee = freeform name we've always sent. When the rep is
    // authenticated, this mirrors __currentRep.displayName so the
    // PDF + Jobber notes show the right name. repId / repName are
    // the authoritative auth-backed fields for cloud-save audit.
    employee: (__currentRep && __currentRep.displayName) || state.customer.employee || '',
    repId:   (__currentRep && __currentRep._id) || '',
    repName: (__currentRep && __currentRep.displayName) || '',
    paymentMethod: state.paymentMethod,
    sendMethod,
    notes: state.notes || '',
    projects: allProjects.map(p => ({
      type: p.type, productType: p.productType, tier: p.tier,
      condition: p.condition, selectedColor: p.selectedColor,
      hoa: p.hoa, previousStain: p.previousStain,
      measurements: p.measurements,
      addons: p.addons, serviceAddons: p.serviceAddons,
      customAddons: p.customAddons || [],
      selectedDiscounts: p.selectedDiscounts || [],
      subtotal: p._cached.subtotal
    })),
    totals: { sumBeforeBundle: totals.sumBeforeBundle, bundleDiscount: totals.bundleDiscount, bundleEligible: totals.bundleEligible, finalTotal: totals.finalTotal }
  };
  // PDF auto-download removed by request — the rep can still grab a PDF
  // from the "📄 Re-download PDF" button on the success screen. Customer
  // delivery happens through Jobber's email + accept/reject flow.
  try { __host.dispatchEvent(new CustomEvent('sssQuoteFinalize', { detail: payload, bubbles: true, composed: true })); } catch (e) { console.warn('CustomEvent dispatch failed:', e); }

  // Cloud → Jobber sequence: flush pending save, wait for it to settle,
  // do a final write, mark the row finished, then push to Jobber. Each
  // step is awaited so measurements typed seconds before "Send Quote"
  // make it into both EmployeeQuotes AND the Jobber line items.
  (async () => {
    try {
      flushPendingSaves();
      await awaitSaveSettled();
      const finalPayload = buildCloudPayload();
      if (!state.cloudRowId && finalPayload && typeof __sssBridge !== 'undefined') {
        const r = await __sssBridge.call('createQuote', { payload: finalPayload });
        if (r && r.ok && r.quote && r.quote._id) state.cloudRowId = r.quote._id;
      } else if (state.cloudRowId && finalPayload) {
        await __sssBridge.call('updateQuote', { quoteRowId: state.cloudRowId, patch: finalPayload });
      }
      if (state.cloudRowId) {
        await __sssBridge.call('setQuoteStatus', { quoteRowId: state.cloudRowId, status: 'finished' });
      }
      // Push to Jobber. Fire-and-forget so finalize UI is snappy; the
      // result is surfaced via the success-screen status block below.
      // sendMethod tells the backend whether to auto-transition the
      // quote in Jobber so the customer gets an email/text.
      pushFinishedQuoteToJobber(state.cloudRowId, false, sendMethod);
    } catch (e) { console.warn('[SSS Cloud] finalize failed:', e); }
  })();

  __doc.querySelectorAll('.stage').forEach(s => s.classList.remove('visible'));
  __doc.getElementById('stage-success').classList.add('visible');
  // Success isn't part of the 10-step flow — hide the progress bar.
  try { refreshProgressBarVisibility(); } catch (e) {}
  // Reset success-screen Jobber block to "Pushing…" while the request runs.
  const jbox = __doc.getElementById('successJobberBlock');
  if (jbox) jbox.innerHTML = '<div class="jobber-push-row pending"><span class="ico">⏳</span><span>Pushing to Jobber…</span></div>';
  scrollAppToTop();
  closeSideTracker();
  // Hide the side-tracker floating tab + header button on the success
  // screen. The quote is locked in — there's nothing to track here, and
  // leaving the tab visible led to it appearing then disappearing on
  // first click (renderSidePanel wasn't being invoked after this
  // transition, so the .visible class lingered from the review stage).
  const _stTab = __doc.getElementById('sideTrackerTab');
  if (_stTab) _stTab.classList.remove('visible');
  const _stHeaderBtn = __doc.getElementById('headerSideTrackerBtn');
  if (_stHeaderBtn) _stHeaderBtn.style.display = 'none';
  if (typeof setSavePill === 'function') setSavePill('hidden');
}

// Fire the push call against the backend and surface success/failure
// on the success screen so the rep knows whether the quote landed in
// Jobber or needs a retry. Stamps `state._lastJobberPush` so the
// summary view can reference it.
async function pushFinishedQuoteToJobber(rowId, force, sendMethod) {
  const box = __doc.getElementById('successJobberBlock');
  if (!rowId) {
    if (box) box.innerHTML = '<div class="jobber-push-row error"><span class="ico">⚠️</span><span>No cloud row — Jobber push skipped.</span></div>';
    return;
  }
  if (box) {
    const verb = force ? 'Re-sending draft to Jobber…' : 'Uploading draft to Jobber…';
    box.innerHTML = '<div class="jobber-push-row pending"><span class="ico">⏳</span><span>' + verb + '</span></div>';
  }
  try {
    const r = await fetch('/_functions/pushToJobber', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteRowId: rowId, force: !!force, sendMethod: sendMethod || 'email' })
    });
    const data = await r.json();
    state._lastJobberPush = data;
    if (!box) return;
    if (data && data.ok) {
      const numberLine = data.jobberQuoteNumber
        ? `<div style="font-size:12px;color:var(--slate);margin-top:2px;">Quote #${escapeHtml(data.jobberQuoteNumber)}</div>`
        : '';
      const wasAlready = data.alreadyPushed ? ' (already in Jobber)' : '';
      const openLink = data.jobberWebUri
        ? `<a href="${escapeHtml(data.jobberWebUri)}" target="_blank" rel="noopener" class="btn btn-primary" style="margin-top:14px;font-size:15px;padding:12px 22px;text-decoration:none;display:inline-flex;align-items:center;gap:6px;margin-right:8px;box-shadow:var(--shadow-md);">↗ Open in Jobber</a>`
        : '';
      // Surface the line items we sent so the rep can verify prices.
      // If Jobber shows $0 but our sent unitPrice was non-zero, the
      // problem is on Jobber's side (silent field rejection) — paste
      // me the values and we'll fix it.
      let lineItemsBlock = '';
      if (Array.isArray(data.sentLineItems) && data.sentLineItems.length) {
        const rows = data.sentLineItems.map(li => `
          <tr>
            <td style="padding:4px 8px;">${escapeHtml(li.name)}</td>
            <td style="padding:4px 8px;text-align:right;font-family:ui-monospace,monospace;">${fmtMoney(li.unitPrice || 0)}</td>
            <td style="padding:4px 8px;text-align:right;font-family:ui-monospace,monospace;">${fmtMoney(li.totalPrice || 0)}</td>
          </tr>
        `).join('');
        // Subtotal / discount / total — pulled from the push response so
        // the rep sees the same numbers Jobber rendered, not a separate
        // local calc. Backend returns sentSubtotal / sentDiscount /
        // sentFinalTotal on every push for this preview.
        const sentSubtotal   = Number(data.sentSubtotal)   || 0;
        const sentDiscount   = Number(data.sentDiscount)   || 0;
        const sentFinalTotal = Number(data.sentFinalTotal) || (sentSubtotal - sentDiscount);
        const totalsRows = `
          <tr style="border-top:1px solid var(--line);">
            <td style="padding:6px 8px;text-align:right;color:var(--slate);" colspan="2">Subtotal (line items)</td>
            <td style="padding:6px 8px;text-align:right;font-family:ui-monospace,monospace;">${fmtMoney(sentSubtotal)}</td>
          </tr>
          ${sentDiscount > 0 ? `
            <tr>
              <td style="padding:6px 8px;text-align:right;color:#1f4d36;font-weight:600;" colspan="2">Quote-level discount (per-project + bundle)</td>
              <td style="padding:6px 8px;text-align:right;font-family:ui-monospace,monospace;color:#1f4d36;font-weight:600;">−${fmtMoney(sentDiscount)}</td>
            </tr>
          ` : ''}
          <tr style="border-top:2px solid var(--navy);background:#f5f9ff;">
            <td style="padding:8px;text-align:right;color:var(--navy);font-weight:700;" colspan="2">Customer-visible total in Jobber</td>
            <td style="padding:8px;text-align:right;font-family:ui-monospace,monospace;color:var(--navy);font-weight:700;font-size:13px;">${fmtMoney(sentFinalTotal)}</td>
          </tr>`;
        // Build a send-status pill. Jobber's GraphQL API doesn't expose
        // a public send-to-customer mutation, so we don't pretend to.
        // The honest UX: quote is created in Jobber and ready to send;
        // the rep clicks Send inside Jobber (or we auto-open the
        // Jobber URL right after pushing).
        function pill(bg, color, text) {
          return `<span style="background:${bg};color:${color};padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">${text}</span>`;
        }
        // Single status pill — the quote always lands as a Draft in
        // Jobber. The rep opens it via the prominent "Open in Jobber"
        // button rendered below (real <a target="_blank"> = no popup
        // blocker issues).
        const sendMethodPill = pill('var(--line-soft)', 'var(--slate)', 'Saved as Draft in Jobber');
        // Reference-photos pill — surfaces native-attachment status
        // and how many photos rode along on the description as links.
        let photosPill = '';
        const photoCount = Number(data.referencePhotoCount) || 0;
        if (photoCount > 0) {
          const att = data.attachments || {};
          if (att.ok) {
            photosPill = pill('#e8f5ff', '#0b69b8', `✓ ${photoCount} reference photo${photoCount === 1 ? '' : 's'} attached`);
          } else if (att.attempted) {
            photosPill = pill('#fff4e5', '#a66400', `📷 ${photoCount} photo${photoCount === 1 ? '' : 's'} included as links in description`);
          } else {
            photosPill = pill('var(--line-soft)', 'var(--slate)', `📷 ${photoCount} photo${photoCount === 1 ? '' : 's'} included as links in description`);
          }
        }
        lineItemsBlock = `
          ${sendMethodPill ? `<div style="margin-top:8px;">${sendMethodPill}</div>` : ''}
          ${photosPill ? `<div style="margin-top:6px;">${photosPill}</div>` : ''}
          <details style="margin-top:10px;" open>
            <summary style="cursor:pointer;font-size:12px;font-weight:600;">Show line items sent to Jobber</summary>
            <table style="margin-top:6px;font-size:12px;width:100%;background:#fff;border-radius:4px;color:var(--navy);">
              <thead><tr style="border-bottom:1px solid var(--line);">
                <th style="padding:4px 8px;text-align:left;">Item</th>
                <th style="padding:4px 8px;text-align:right;">Unit Price</th>
                <th style="padding:4px 8px;text-align:right;">Total</th>
              </tr></thead>
              <tbody>${rows}${totalsRows}</tbody>
            </table>
          </details>`;
      }
      box.innerHTML = `
        <div class="jobber-push-row success">
          <span class="ico">✓</span>
          <div style="flex: 1;">
            <div><strong>Sent to Jobber${escapeHtml(wasAlready)}</strong></div>
            ${numberLine}
            ${lineItemsBlock}
            <div style="margin-top:10px;">
              ${openLink}
              <button class="btn btn-secondary" style="font-size:12px;padding:6px 12px;margin-top:14px;" onclick="resendFinishedToJobber('${escapeHtml(rowId)}')">🔄 Re-send to Jobber</button>
            </div>
          </div>
        </div>`;
    } else {
      // Log the full response so it's grabbable from console too.
      console.error('[Jobber push] full response:', data);
      const err = (data && data.error) || 'unknown error';
      // Extract the most actionable bits: GraphQL error messages from
      // the detail array, and the input we sent. Keeps the success
      // screen readable instead of dumping raw JSON.
      let primaryMsg = '';
      if (data && Array.isArray(data.detail) && data.detail.length) {
        primaryMsg = data.detail.map(d => d && d.message).filter(Boolean).join(' · ');
      } else if (data && typeof data.detail === 'string') {
        primaryMsg = data.detail;
      }
      const detailBlock = data && data.detail
        ? `<details style="margin-top:6px;"><summary style="cursor:pointer;font-size:12px;font-weight:600;">Show full GraphQL response</summary><pre class="err-pre">${escapeHtml(JSON.stringify(data.detail, null, 2))}</pre></details>`
        : '';
      const inputBlock = data && data.input
        ? `<details style="margin-top:6px;"><summary style="cursor:pointer;font-size:12px;font-weight:600;">Show payload we sent</summary><pre class="err-pre">${escapeHtml(JSON.stringify(data.input, null, 2))}</pre></details>`
        : '';
      // Stash the full response for the copy button — easier than
      // round-tripping through the DOM.
      window.__lastJobberPushResponse = data;
      box.innerHTML = `
        <div class="jobber-push-row error">
          <span class="ico">⚠️</span>
          <div style="flex: 1; min-width: 0;">
            <div><strong>Jobber push failed:</strong> ${escapeHtml(err)}</div>
            ${primaryMsg ? `<div style="font-size:12px;margin-top:4px;word-break:break-word;">${escapeHtml(primaryMsg)}</div>` : ''}
            ${detailBlock}
            ${inputBlock}
            <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn btn-secondary" style="font-size:12px;padding:6px 12px;" onclick="pushFinishedQuoteToJobber('${escapeHtml(rowId)}')">🔄 Retry push</button>
              <button class="btn btn-secondary" style="font-size:12px;padding:6px 12px;" onclick="copyJobberErrorToClipboard(this)">📋 Copy error</button>
            </div>
          </div>
        </div>`;
    }
  } catch (e) {
    if (box) box.innerHTML = `<div class="jobber-push-row error"><span class="ico">⚠️</span><span>Network error — <button class="btn-link" onclick="pushFinishedQuoteToJobber('${escapeHtml(rowId)}')">retry</button></span></div>`;
  }
}

// Copy the last Jobber push error to the clipboard so the user can
// paste it back to me / a support ticket in one tap. Falls back to a
// hidden textarea + execCommand for older browsers / restricted
// contexts where navigator.clipboard isn't available.
async function copyJobberErrorToClipboard(btnEl) {
  const data = window.__lastJobberPushResponse;
  if (!data) {
    alert('No error response cached. Trigger the failure again first.');
    return;
  }
  const text = JSON.stringify(data, null, 2);
  let ok = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      ok = true;
    }
  } catch (e) { /* fall through to the legacy path */ }
  if (!ok) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      __doc.appendChild(ta);
      ta.select();
      ok = document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) { ok = false; }
  }
  if (btnEl) {
    const original = btnEl.innerHTML;
    btnEl.innerHTML = ok ? '✓ Copied' : '⚠️ Copy failed';
    btnEl.disabled = true;
    setTimeout(() => { btnEl.innerHTML = original; btnEl.disabled = false; }, 1800);
  } else if (!ok) {
    alert('Copy failed. The full response is at `window.__lastJobberPushResponse` in the console.');
  }
}

// Force-resend helper — same path but creates a fresh Jobber quote
// instead of short-circuiting on an existing jobberQuoteId.
function resendFinishedToJobber(rowId) {
  if (!confirm('Re-send this quote to Jobber? This creates a fresh quote in Jobber — the previous one stays there until you delete it manually.')) return;
  pushFinishedQuoteToJobber(rowId, true);
}

// Wrapper for the main action-row button on the success screen — uses
// the current state's cloudRowId since the button doesn't have row-scoped
// context like the status-block button does.
function resendCurrentQuoteFromSuccess() {
  if (!state.cloudRowId) {
    alert('Quote hasn\'t been saved to the cloud yet — wait a moment and try again.');
    return;
  }
  if (!confirm('Re-send this quote to Jobber? This creates a fresh quote in Jobber — the previous one stays there until you delete it manually.')) return;
  pushFinishedQuoteToJobber(state.cloudRowId, true);
}

function resetQuote() {
  // Used by the success-screen "+ Start New Quote" button. Used to
  // duplicate the startNewQuote logic inline but without the null
  // guards — so if any single element lookup (employeeName, stage2Next,
  // quoteNum) returned null, the function threw mid-reset and the user
  // was stuck on the success screen with no obvious feedback. Delegate
  // to the canonical fresh-quote routine, which has the guards.
  if (!confirm('Start a new quote? Current quote will be cleared.')) return;
  try {
    startNewQuote();
  } catch (e) {
    // Last-resort fallback: if startNewQuote itself fails, at least
    // get the rep off the success screen so they're not stranded.
    console.error('[SSS] resetQuote: startNewQuote threw:', e);
    try { returnToDashboard(); } catch (e2) {}
  }
}

/* ============================================================
   SIDE TRACKER PANEL
   ============================================================ */
function openSideTracker() {
  // Scroll the parent Wix page to the top of the calculator embed BEFORE
  // opening the sidebar, so the sidebar's header is in view.
  scrollAppToTop();
  __doc.getElementById('sideTracker').classList.add('open');
  __doc.getElementById('sideTrackerOverlay').classList.add('visible');
  // Hide the floating tab while the panel is open — they both pin to right:0
  // and the tab would otherwise sit on top of the open panel.
  const tab = __doc.getElementById('sideTrackerTab');
  if (tab) tab.classList.add('hidden-while-open');
  renderSidePanel();
  // Hydrate the notes field from state every time the panel opens
  const ta = __doc.getElementById('quoteNotesField');
  if (ta) {
    ta.value = state.notes || '';
    // Keep the textarea expanded if it already has content (CSS otherwise
    // collapses it back to 1 line on blur).
    ta.classList.toggle('has-content', !!ta.value.trim());
    // Auto-save on input + keep the expanded state in sync with content.
    ta.oninput = (e) => {
      state.notes = e.target.value;
      ta.classList.toggle('has-content', !!e.target.value.trim());
      scheduleAutoSave();
    };
  }
}
function closeSideTracker() {
  __doc.getElementById('sideTracker').classList.remove('open');
  __doc.getElementById('sideTrackerOverlay').classList.remove('visible');
  const tab = __doc.getElementById('sideTrackerTab');
  if (tab) tab.classList.remove('hidden-while-open');
}

function saveAndReturnToDashboard() {
  // Force-save the current draft, then navigate back to dashboard.
  // flushPendingSaves cancels the debounce and runs the save right now —
  // protects against losing in-progress measurements when the rep walks
  // away after only typing a value (no further interaction would have
  // triggered the 1.5s debounce yet).
  if (typeof flushPendingSaves === 'function') flushPendingSaves();
  else autoSaveDraft();
  closeSideTracker();
  // Hide all stages, show the dashboard
  __doc.querySelectorAll('.stage').forEach(s => s.classList.remove('visible'));
  __doc.getElementById('stage-dashboard').classList.add('visible');
  // Hide the save pill — it's a quote-context indicator, not relevant here.
  if (typeof setSavePill === 'function') setSavePill('hidden');
  // Hide the "Projects in this quote" bubble bar — same fix as returnToDashboard.
  try { renderProjectBubbles(); } catch (e) {}
  // Hide the 10-step progress bar — we're back on the dashboard now.
  try { refreshProgressBarVisibility(); } catch (e) {}
  // Drop the Quote Total / Active Project header pills.
  try { updateRunningTotal(); } catch (e) {}
  // Always re-fetch on dashboard visit so newly saved/finished rows appear.
  dashState.loaded = false;
  renderDashboard();
  scrollAppToTop();
}

function buildTrackerRows() {
  // Build a list of [section, label, value, editStage, clearFn] for what's been set
  const rows = [];
  const c = state.customer;
  const ap = state.activeProject;

  // Customer
  if (c.name) rows.push({ section: 'Customer', label: 'Name', value: c.name, stage: 1 });
  if (c.phone) rows.push({ section: 'Customer', label: 'Phone', value: c.phone, stage: 1 });
  if (c.email) rows.push({ section: 'Customer', label: 'Email', value: c.email, stage: 1 });
  if (c.address) rows.push({ section: 'Customer', label: 'Address', value: c.address, stage: 1 });

  // Project + measurements
  if (ap.type) {
    rows.push({ section: 'Project', label: 'Type', value: PROJECT_META[ap.type].icon + ' ' + PROJECT_META[ap.type].name, stage: 2, clear: () => { ap.type = null; ap.measurements = {}; } });
    const m = ap.measurements;
    if (ap.type === 'fence' && (m.linearft || m.height)) rows.push({ section: 'Project', label: 'Size', value: `${m.linearft||0} ft × ${m.height||0} ft (${styleName(m.style)})`, stage: 3, clear: () => { ap.measurements = {}; } });
    else if (ap.type === 'deck' && (m.flat || m.rail || m.stairs)) rows.push({ section: 'Project', label: 'Size', value: `${m.flat||0} sq ft flat${m.rail?` + ${m.rail} ln ft rail`:''}${m.stairs?` + ${m.stairs} stairs`:''}`, stage: 3, clear: () => { ap.measurements = {}; } });
    else if ((ap.type === 'pergola' || ap.type === 'barn' || ap.type === 'ceiling') && m.sqft) rows.push({ section: 'Project', label: 'Size', value: `${m.sqft} sq ft`, stage: 3, clear: () => { ap.measurements = {}; } });

    // Wood age (Step 3)
    if (ap.woodAge) {
      const ageLabel = { new: 'Brand-new (<6 mo)', weathered: 'Weathered (6 mo–2 yr)', aged: 'Aged (2+ yr)' }[ap.woodAge];
      rows.push({ section: 'Project', label: 'Wood age', value: ageLabel, stage: 3, clear: () => { ap.woodAge = null; } });
    }

    // Condition
    if (ap.condition) rows.push({ section: 'Project', label: 'Prep', value: CONDITION_META[ap.condition].label, stage: 4 });

    // Product + previously stained
    if (ap.productType === 'water') rows.push({ section: 'Project', label: 'Product', value: '💧 Water-Based', stage: 5 });
    else if (ap.productType === 'oil') rows.push({ section: 'Project', label: 'Product', value: '🛢️ Oil-Based', stage: 5 });
    else if (ap.productType === 'hoa') rows.push({ section: 'Project', label: 'Product', value: '🏘️ HOA: ' + (ap.hoa.brand || '?') + ' / ' + (ap.hoa.color || '?'), stage: 5 });

    if (ap.previousStain.wasStained) {
      const t = ap.previousStain.previousProductType;
      const label = t === 'water' ? 'Water-based' : (t === 'oil' ? 'Oil-based' : (t === 'unsure' ? 'Unsure' : 'Yes'));
      rows.push({ section: 'Project', label: 'Prev stain', value: label + (ap.previousStain.brand ? ` (${ap.previousStain.brand})` : ''), stage: 5 });
    }

    // Tier
    if (ap.tier && !isHoa()) {
      const tm = getTierMeta(ap.productType, ap.tier);
      if (tm) rows.push({ section: 'Project', label: 'Tier', value: ap.tier.charAt(0).toUpperCase() + ap.tier.slice(1) + ' — ' + tm.product, stage: 6 });
    } else if (isHoa()) {
      rows.push({ section: 'Project', label: 'Tier', value: 'HOA-Specified (locked)', stage: 6 });
    }

    // Color
    if (ap.selectedColor) rows.push({ section: 'Project', label: 'Color', value: ap.selectedColor.name + (ap.selectedColor.code ? ` (${ap.selectedColor.code})` : ''), stage: 7, clear: () => { ap.selectedColor = null; } });
    else if (isHoa() && ap.hoa.color) rows.push({ section: 'Project', label: 'Color', value: 'HOA: ' + ap.hoa.color, stage: 5 });
    else if (isClearSealer()) rows.push({ section: 'Project', label: 'Color', value: 'Clear (no pigment)', stage: 6 });

    // Add-ons
    const addonCount = Object.keys(ap.addons).length + Object.keys(ap.serviceAddons).length + (ap.customAddons||[]).length;
    if (addonCount > 0) rows.push({ section: 'Project', label: 'Add-ons', value: `${addonCount} selected`, stage: 8, clear: () => { ap.addons = {}; ap.serviceAddons = {}; ap.customAddons = []; } });

    // Discount
    if (ap.selectedDiscounts && ap.selectedDiscounts.length > 0) {
      const labels = ap.selectedDiscounts.map(id => {
        const d = DISCOUNTS.find(x => x.id === id);
        return d ? `${d.label} (−${(d.rate*100).toFixed(0)}%)` : null;
      }).filter(Boolean).join(', ');
      rows.push({ section: 'Project', label: 'Discounts', value: labels, stage: 9, clear: () => { ap.selectedDiscounts = []; } });
    }
  }

  return rows;
}

function renderSidePanel() {
  const totals = computeAllTotals();
  const rows = buildTrackerRows();
  const bundled = state.bundledProjects;
  const tab = __doc.getElementById('sideTrackerTab');
  const countEl = __doc.getElementById('sideTrackerCount');
  const bodyEl = __doc.getElementById('sideTrackerBody');
  const totalEl = __doc.getElementById('sideTrackerTotal');

  // Visibility: only when the user has made any meaningful selection, and
  // never on the dashboard / success screens (which are their own surfaces).
  const dashboardVisible = __doc.getElementById('stage-dashboard').classList.contains('visible');
  const successVisible = __doc.getElementById('stage-success') && __doc.getElementById('stage-success').classList.contains('visible');
  const hasSelections = (rows.length > 0) || bundled.length > 0;
  const shouldShow = hasSelections && !dashboardVisible && !successVisible;
  tab.classList.toggle('visible', shouldShow);
  // Header-mounted button mirrors the floating tab's visibility and count.
  const headerBtn = __doc.getElementById('headerSideTrackerBtn');
  const headerCount = __doc.getElementById('headerSideTrackerCount');
  if (headerBtn) headerBtn.style.display = shouldShow ? 'inline-flex' : 'none';
  if (headerCount) headerCount.textContent = String(rows.length + bundled.length);
  if (dashboardVisible || successVisible) closeSideTracker();
  countEl.textContent = rows.length + bundled.length;
  totalEl.textContent = '$' + Math.round(totals.finalTotal).toLocaleString();

  // Group rows by section
  const sections = {};
  rows.forEach(r => { (sections[r.section] = sections[r.section] || []).push(r); });

  let html = '';
  if (Object.keys(sections).length === 0 && bundled.length === 0) {
    html = '<div class="empty-state">Start picking options and they\'ll appear here. You can edit or remove any selection at any time.</div>';
  } else {
    Object.entries(sections).forEach(([sec, items]) => {
      html += `<div class="tracker-section"><h4>${sec}</h4>`;
      items.forEach((r, idx) => {
        const clearBtn = r.clear ? `<button class="clear" onclick="clearTrackerRow('${r.section}',${idx})" title="Clear">×</button>` : '';
        html += `<div class="tracker-row">
          <span class="tr-label">${r.label}</span>
          <span class="tr-value">${r.value}</span>
          <div class="tr-actions">
            <button class="edit" onclick="closeSideTracker();showStage(${r.stage})" title="Edit">✎</button>
            ${clearBtn}
          </div>
        </div>`;
      });
      html += '</div>';
    });

    if (bundled.length > 0) {
      html += '<div class="tracker-section"><h4>Bundled Projects (10% off)</h4>';
      bundled.forEach((p, i) => {
        html += `<div class="tracker-row">
          <span class="tr-label">${PROJECT_META[p.type].icon}</span>
          <span class="tr-value">${PROJECT_META[p.type].name} — $${Math.round(p._cached.subtotal).toLocaleString()}</span>
          <div class="tr-actions">
            <button class="edit" onclick="closeSideTracker();editBundledProject(${i})" title="Edit">✎</button>
            <button class="clear" onclick="if(confirm('Remove?'))removeBundledProject(${i})" title="Remove">×</button>
          </div>
        </div>`;
      });
      html += '</div>';
    }
  }
  bodyEl.innerHTML = html;
}

function clearTrackerRow(section, idx) {
  // Re-build rows to find the clear function (rows are rebuilt on every render)
  const rows = buildTrackerRows().filter(r => r.section === section);
  const target = rows[idx];
  if (target && target.clear) {
    target.clear();
    renderSidePanel();
    updateRunningTotal();
  }
}

/* ============================================================
   INFO MODAL — popup explanations for any term
   ============================================================ */
const INFO_TOPICS = {
  six_month_rule: {
    title: 'Why does 6 months matter?',
    body: `<p>Bare wood that's been exposed to weather for more than 6 months has typically picked up enough surface damage that staining over it without a soft wash will compromise the bond — even if the wood still looks fairly clean from a distance.</p>
      <p><strong>What 6+ months of exposure does to wood:</strong></p>
      <ul>
        <li><strong>Surface fibers break down</strong> from UV. Those fibers are no longer structurally sound — anything we stain on top of them is sitting on dead wood that'll flake off.</li>
        <li><strong>Mildew and algae</strong> begin to colonize the pores, even if invisible. If we trap them under stain, they'll grow through and lift the finish.</li>
        <li><strong>pH balance shifts</strong> — fresh wood is roughly neutral; weathered wood becomes alkaline. New stain bonds best to a freshly-brightened, pH-balanced surface.</li>
        <li><strong>Grey tone develops</strong> in the top layer. Staining over greyed wood without lifting it first leaves muddy, uneven color.</li>
      </ul>
      <p><strong>The fix:</strong> a soft wash with sodium metasilicate to clear dead fibers and mildew, followed by an oxalic-acid brightener to restore pH and lift the grey. Adds 1 day to the project but is the difference between a stain that lasts the rated lifespan vs. one that fails in 12–18 months.</p>
      <p style="margin-top:14px;padding:10px 12px;background:var(--gold-pale);border-left:3px solid var(--gold);border-radius:6px;color:#5a4a1f;">If the wood is on a fully-covered porch (no rain, no UV) the 6-month rule is more lenient — judge by appearance. But anything in direct sun and weather for 6+ months should get a soft wash.</p>`
  },
  pergola_overhead: {
    title: 'What is "overhead access challenge"?',
    body: `<p>Pergolas always involve overhead work — but sometimes the site makes that work meaningfully harder. The "overhead access challenge" flag adds a $200 line item to cover the extra time, equipment, and care needed when access is restricted.</p>
      <p>Check this if any of these apply:</p>
      <ul>
        <li><strong>Built over a deck with railings</strong> — we have to work around the rails or position ladders on the deck surface (more setup, slower progress).</li>
        <li><strong>Surrounded by mature landscaping</strong> — shrubs, trees, or planter beds that can't be moved force us to maneuver in tight spaces with extra tarping to protect plants.</li>
        <li><strong>Over a pool, hot tub, or pond</strong> — water below means extra fall protection, plank-over-water setup, and no spraying (brushed application only).</li>
        <li><strong>Pergola over 10 ft tall</strong> — taller ladders, more trips up and down, sometimes scaffolding instead.</li>
        <li><strong>Attached to a second-story balcony</strong> — work from above adds time and risk.</li>
        <li><strong>Hardscape directly below</strong> (pavers, stamped concrete, outdoor kitchen) — we can't drop anything, so movement is slower and tarping is heavier.</li>
      </ul>
      <p>If the pergola is freestanding over grass or simple patio with room to set ladders comfortably on all sides, leave this unchecked.</p>`
  },
  why_prev_stain: {
    title: 'Why does it matter if the wood was previously stained?',
    body: `<p>Knowing what was used before helps us choose the right approach for recoating.</p>
      <ul>
        <li><strong>Water on water</strong>, or <strong>oil on oil</strong> — usually works with just a soft wash. The new stain bonds to the old one because they're chemically similar.</li>
        <li><strong>Switching types</strong> (oil ↔ water) — requires a full strip-and-sand. The two chemistries don't bond well.</li>
        <li><strong>Peeling or chipping existing finish</strong> — must be stripped regardless of type. Leaving it underneath causes the new stain to fail.</li>
      </ul>
      <p>If you're not sure what was used, that's fine — we'll inspect the existing finish on-site to confirm what type and condition it's in before finalizing prep.</p>`
  },
  cond_no_wash: {
    title: 'No Wash — when is it appropriate?',
    body: `<p><strong>No Wash</strong> is the lightest prep level — included in the base price, no premium added.</p>
      <p>Best for wood that is genuinely new: recently installed, no UV exposure, no greying, no mildew. A light surface cleaning is all that's needed before stain — no chemical prep required.</p>
      <p>If you see <strong>any</strong> greying, fading, or mildew spots — even faint ones — pick Soft Wash instead. New stain can't bond to weathered wood without the prep step.</p>`
  },
  cond_soft_wash: {
    title: 'Soft Wash + Brightener — the most common prep',
    body: `<p>This is the prep we use on the majority of fence and deck jobs. It handles a wide range of wood conditions without the labor cost of stripping.</p>
      <p><strong>What it involves:</strong></p>
      <ul>
        <li>A sodium-metasilicate-based cleaner that breaks down dead surface fibers, dirt, and mildew</li>
        <li>An oxalic-acid brightener that neutralizes the wood's pH and removes any silver/grey patina</li>
        <li>The result: clean, slightly opened wood pores that allow new stain to penetrate and bond</li>
      </ul>
      <p><strong>Best for:</strong> Greyed wood, faded wood, mildew presence, OR re-staining over an existing finish of the <em>same type</em> (water on water, oil on oil) that's still in good condition.</p>`
  },
  cond_strip_sand: {
    title: 'Surface preparation — strip or sand, as the condition needs',
    body: `<p>This is the deeper prep level — but we don't blanket-treat every job the same. We choose between stripping and sanding based on what the wood actually needs:</p>
      <ul>
        <li><strong>Stripping</strong> only when the finish is peeling, flaking, or chipping — leaving that underneath causes the new stain to fail in months</li>
        <li><strong>Switching stain types</strong> (oil ↔ water) — the two chemistries don't bond well, so the old finish has to come off in those failure spots</li>
        <li><strong>Sanding</strong> when the finish is rough, has raised peaks, or has multiple uneven coats — flattening those peaks gives new stain a clean surface to bond to without going all the way back to bare wood</li>
        <li><strong>Re-coating a similar stain in good shape</strong> — a thorough sanding is usually enough; full stripping isn't necessary just because there's an old coat present</li>
      </ul>
      <p>If you're recoating an existing finish that's still in good shape — even if it looks faded — Soft Wash is usually enough. You don't need this prep level every time.</p>
      <p><strong>Our approach:</strong> assess the surface first, strip only the spots that need it, sand to flatten peaks and open the surface, then brightener wash and full dry cycle before staining.</p>`
  },
  water_vs_oil: {
    title: 'Water-based vs. oil-based stain',
    body: `<p><strong>Water-based stains</strong> (like SW Woodscapes) dry fast (1–4 hours between coats), have low odor, clean up with water, and re-coat easily down the road. They lay on top of the wood more than they penetrate. Best when the wood was previously stained with water-based, or when you want low VOC / fast turnaround.</p>
      <p><strong>Oil-based stains</strong> (like EXPERT Stain &amp; Seal) penetrate deeper into the wood, bring out grain more vividly, and resist UV breakdown longer — particularly important in the Southeast where summer sun is harsh. They typically last 30–50% longer per coat than water-based, but have stronger odor during application and slower dry time.</p>
      <p>You can't mix the two — switching from one to the other requires stripping the existing finish completely.</p>`
  },
  hoa_explained: {
    title: 'What does "HOA-Required" mean?',
    body: `<p>If your home is governed by a Homeowners Association with rules about exterior wood finishes, they often specify exactly which brand, transparency, and color you can use. Failing to follow it can result in fines or a required re-do at your cost.</p>
      <p>When you pick the HOA-Required option, we:</p>
      <ul>
        <li>Capture the exact spec from your HOA documentation for your records and this quote</li>
        <li>Skip our standard color picker (since your HOA already chose the color)</li>
        <li>Lock the price to our Performance-tier rate (other tier options don't apply)</li>
      </ul>
      <p><strong>We'll apply the product your HOA requires.</strong> Pricing is at our Performance-tier rate regardless of brand. The only thing to know up front: the manufacturer warranty terms are whatever that product carries — we don't add our own warranty on top of a product we didn't pick. Just tell us what your HOA mandates and we'll log it for the quote.</p>`
  },
  tier_help: {
    title: 'How do I choose a tier?',
    body: `<p>The three tiers represent escalating levels of protection, longevity, and value:</p>
      <ul>
        <li><strong>Essential</strong> — budget-friendly basic protection. Use for rental properties, fences in shade, or short-term needs. Will need a refresh in 18–24 months.</li>
        <li><strong>Performance ★ (Recommended)</strong> — our most-quoted tier. Best balance of price and longevity (3–5 years). 30-day touch-up visit included.</li>
        <li><strong>Showcase</strong> — premium-level protection (4–7 years). The cost-per-year is often lower than going cheap and re-doing the work sooner.</li>
      </ul>
      <p>The cost-per-year number under each price is the most useful comparison — it shows what you're really paying over the life of the stain.</p>`
  },
  bundle_discount: {
    title: 'How does the bundle discount work?',
    body: `<p>Bundling 2 or more separate staining projects in a single quote automatically saves you <strong>10% off the total</strong>. Examples that count as separate projects:</p>
      <ul>
        <li>A fence + a deck</li>
        <li>A pergola + a wooden ceiling</li>
        <li>Two fences on different sides of the property</li>
      </ul>
      <p>The bundle discount stacks on top of any project-level discounts you pick on Step 9 (veteran, teacher, cash payment, etc.) — those have their own combined cap of 14% per project. Bundle 10% applies separately on top.</p>`
  },
  prep_chem: {
    title: 'What chemicals do you use for prep?',
    body: `<p>Two main products, depending on what the wood needs:</p>
      <ul>
        <li><strong>Sodium metasilicate</strong> — an alkaline cleaner. Breaks down dead wood fibers, dirt, and mildew. Safe for plants when diluted properly and rinsed.</li>
        <li><strong>Oxalic acid</strong> — a wood brightener. Neutralizes the wood's pH after the cleaner, removes silver/grey weathering, and opens the wood pores so new stain can bond. Also derived naturally from many plants (rhubarb leaves, spinach).</li>
      </ul>
      <p>For stripping previously stained wood we use additional products appropriate to the old finish — sodium-metasilicate-based for water-based stain, often citrus-based or solvent-based for oil-based stain.</p>`
  },
  rain_refresh: {
    title: 'What is SW Woodscapes Rain Refresh?',
    body: `<p>SW Woodscapes Rain Refresh is a separate Sherwin-Williams solid-color exterior wood stain with <strong>Self-Cleaning Technology</strong> — rainfall lifts surface dirt off the finish so it stays looking new longer.</p>
      <p>It carries a <strong>10-year limited manufacturer warranty</strong> from Sherwin-Williams. It's the product we use for the Showcase water-based tier (not an additive — it's a different SKU than regular Woodscapes).</p>
      <p style="margin-top:14px;padding:10px 12px;background:var(--gold-pale);border-left:3px solid var(--gold);border-radius:6px;color:#5a4a1f;">SW markets Rain Refresh as "stays cleaner, longer" — we don't promise a specific lifespan beyond what's in the manufacturer warranty.</p>`
  },
  citronella: {
    title: 'What is the Citronella additive?',
    body: `<p>EXPERT Citronella is an oil-based stain additive that mixes into the can during application. It deters carpenter bees, wasps, and other biting insects from drilling into the wood — a real problem for cedar fences in the Southeast.</p>
      <p>It does <em>not</em> change the color of the stain or its appearance. The effect lasts as long as the stain itself (typically 4–5 years for Performance, 6–7 for Showcase). It's compatible with all EXPERT oil-based products; not available for water-based.</p>`
  }
};

function openInfoModal(topicKey, triggerEl) {
  const topic = INFO_TOPICS[topicKey];
  if (!topic) return;
  __doc.getElementById('infoModalTitle').textContent = topic.title;
  __doc.getElementById('infoModalBody').innerHTML = topic.body;
  const dlg = __doc.getElementById('infoModalDialog');
  if (dlg && typeof dlg.showModal === 'function') {
    if (!dlg.open) dlg.showModal();
  }
}
function closeInfoModal() {
  const dlg = __doc.getElementById('infoModalDialog');
  if (dlg && typeof dlg.close === 'function' && dlg.open) dlg.close();
}

// Wire info buttons globally — uses event delegation since buttons can be re-rendered
__doc.addEventListener('click', (e) => {
  const btn = e.target.closest('.info-btn');
  if (btn) { e.stopPropagation(); openInfoModal(btn.dataset.info, btn); }
});
__doc.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeInfoModal(); closeSideTracker(); }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('info-btn')) {
    e.preventDefault();
    openInfoModal(e.target.dataset.info, e.target);
  }
});

/* ============================================================
   CONFETTI — fires when a customer qualifies for a discount
   ============================================================ */
let _confettiThrottle = 0;
function fireConfetti() {
  // Throttle so rapid clicks don't spam
  const now = Date.now();
  if (now - _confettiThrottle < 600) return;
  _confettiThrottle = now;
  const colors = ['#2d6e4e', '#c89b3c', '#5a8d68', '#c84d3a', '#3a7095'];
  for (let i = 0; i < 36; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.top = '-20px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = (Math.random() * 0.3) + 's';
    piece.style.animationDuration = (1.2 + Math.random() * 0.8) + 's';
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    __doc.appendChild(piece);
    setTimeout(() => piece.remove(), 2400);
  }
}

/* ============================================================
   DASHBOARD + AUTO-SAVE DRAFTS
   ============================================================ */
const DRAFT_STORAGE_KEY = 'sss_quote_drafts_v1';
let autoSaveTimer = null;

function getDrafts() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}

function setDrafts(arr) {
  try { localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(arr)); } catch (e) { console.warn('Draft save failed:', e); }
}

function autoSaveDraft() {
  // Don't save if nothing meaningful entered
  if (!state.customer.name && !state.activeProject.type && state.bundledProjects.length === 0) return;
  // Don't save on the dashboard itself
  if (state.currentStage === 'dashboard') return;

  const drafts = getDrafts();
  const existing = drafts.findIndex(d => d.quoteId === state.quoteId);
  const snapshot = {
    quoteId: state.quoteId,
    cloudRowId: state.cloudRowId || null,
    lastSavedAt: new Date().toISOString(),
    customerName: state.customer.name || '(unnamed customer)',
    employeeName: state.customer.employee || '',
    stageReached: state.maxStageReached,
    state: JSON.parse(JSON.stringify(state))
  };
  if (existing >= 0) drafts[existing] = snapshot;
  else drafts.unshift(snapshot);
  // Keep most-recent 20 only
  setDrafts(drafts.slice(0, 20));

  // Fire-and-forget cloud save. localStorage above is the canonical
  // local cache; cloud is best-effort so a network hiccup never blocks
  // the rep from moving forward.
  cloudSaveDraft();
}

/* ============================================================
   CLOUD AUTO-SAVE — mirrors localStorage to EmployeeQuotes collection
   ============================================================ */
let __cloudSaveInFlight = false;
let __cloudSavePending  = false;

// Build a Jobber line item ({name, description}) from a project state.
// The description is a multi-line plain-text block listing every
// meaningful selection — tier/product/color, measurements/scope,
// wood condition/prep, paid add-ons w/ qty, custom items, discounts.
// Lives here in the frontend because all the human-readable labels
// (PRICING.projectAddons, PROJECT_META, etc.) are calc-side.
function buildJobberLineItem(p, idx, total) {
  const PROJ = PROJECT_META[p.type] || {};
  const TIER_LABELS = { essential: 'Essential', performance: 'Performance', showcase: 'Showcase' };
  const PROD_LABELS = { water: 'Water-based stain', oil: 'Oil-based stain', hoa: 'HOA-specified product' };
  const COND_LABELS = { new: 'New / Like new', weathered: 'Weathered', aged: 'Aged' };
  const WOOD_LABELS = { new: 'New wood', weathered: 'Weathered wood', aged: 'Aged wood' };
  // Softer prep language — we don't always strip down to bare wood;
  // often a good sanding is sufficient to flatten peaks. Wording
  // reflects that.
  const PREP_LABELS = {
    no_wash:    'No additional prep',
    soft_wash:  'Soft wash (light surface cleaning)',
    strip_sand: 'Surface preparation (strip or sand as the condition requires)'
  };
  // Human-readable fence style names — replaces raw IDs like
  // `charleston_bob` which were leaking through to client-facing copy.
  const STYLE_LABELS = {
    privacy:        'Privacy',
    shadowbox:      'Shadowbox',
    charleston:     'Charleston',
    bob:            'Board-on-board',
    charleston_bob: 'Charleston board-on-board',
    farm:           'Farm-style'
  };

  // Line item title per project. "& Restoration" is only appended
  // when there's actual condition-based restoration work happening
  // (soft wash or strip/sand prep) — for new wood with no prep, the
  // title is just "X Staining" since calling it restoration would
  // mis-describe the scope.
  const isRestoration = (p.condition === 'soft_wash' || p.condition === 'strip_sand');
  const PROJECT_LINE_ITEM_BASE = {
    fence:   'Fence Staining',
    deck:    'Deck Staining',
    pergola: 'Pergola Staining',
    barn:    'Barn & Outbuilding Staining',
    ceiling: 'Ceiling Stain & Finishing'
  };
  const PROJECT_LINE_ITEM_RESTORATION = {
    fence:   'Fence Staining & Restoration',
    deck:    'Deck Staining & Restoration',
    pergola: 'Pergola Staining & Restoration',
    barn:    'Barn & Outbuilding Staining & Restoration',
    // Ceiling rephrases rather than appending, since "& Finishing &
    // Restoration" would chain awkwardly.
    ceiling: 'Ceiling Restoration & Finishing'
  };
  const titleMap = isRestoration ? PROJECT_LINE_ITEM_RESTORATION : PROJECT_LINE_ITEM_BASE;
  const projectName = titleMap[p.type]
                   || (PROJ.name || (p.type || 'Project').replace(/^./, c => c.toUpperCase())) + ' Staining';
  const name = `${projectName}${total > 1 ? ` (#${idx + 1})` : ''}`;
  const lines = [];
  // Section helper — blank line above an ALL-CAPS header so the
  // sections are scannable without leaning on emoji visual cues.
  // Reads more like a contractor's line-item description than a
  // marketing email.
  const pushSection = (heading) => { lines.push(''); lines.push(heading); };

  // Inline key/value formatter — left-padded label keeps the section
  // headers visually aligned without locking us into a fixed column
  // width that would mangle on small screens / PDFs.
  const kv = (label, value) => `${label}: ${value}`;

  // --- BASICS (tier + product) ---
  // Format: "Tier: Performance - Oil based"
  // Hyphen separator + bare "Oil based" / "Water based" (the word
  // "stain" is redundant since the next line names the specific stain).
  const tierLabel = TIER_LABELS[p.tier] || p.tier || '';
  const TIER_PRODUCT_DISPLAY = { oil: 'Oil based', water: 'Water based', hoa: 'HOA-specified' };
  const prodDisplay = TIER_PRODUCT_DISPLAY[p.productType] || (PROD_LABELS[p.productType] || p.productType || '');
  if (tierLabel || prodDisplay) {
    lines.push(kv('Tier', [tierLabel, prodDisplay].filter(Boolean).join(' - ')));
  }

  // --- STAIN PRODUCT LINE ---
  // Names the actual stain product (and its transparency class) the
  // customer is getting. Transparency is what drives the warranty
  // (semi-transparent = 2-yr, semi-solid = 3-yr per EXPERT), so we
  // include it here so the Warranty line at the bottom reads
  // consistently.
  const STAIN_PRODUCT_BY_TIER = {
    'essential-oil':     'Single-coat oil sealer',
    'essential-water':   'Single-coat water-based',
    'performance-oil':   'EXPERT Stain & Seal (semi-transparent)',
    'performance-water': 'EXPERT Water-Based Wood Stain (semi-solid)',
    'showcase-oil':      'EXPERT Log & Timber Oil (semi-transparent)',
    'showcase-water':    'EXPERT 3-Step System (semi-solid)'
  };
  const wKey = `${p.tier}-${p.productType}`;
  if (STAIN_PRODUCT_BY_TIER[wKey]) lines.push(kv('Stain', STAIN_PRODUCT_BY_TIER[wKey]));

  // Color
  if (p.selectedColor) {
    const sc = p.selectedColor;
    const colorName  = (typeof sc === 'string') ? sc : (sc.name || sc.label || '');
    const colorBrand = (typeof sc === 'object' && sc.brand) ? sc.brand : '';
    if (colorName) lines.push(kv('Color', `${colorName}${colorBrand ? ` (${colorBrand})` : ''}`));
  }

  // HOA specifics
  if (p.productType === 'hoa' && p.hoa) {
    const hp = [p.hoa.brand, p.hoa.productName, p.hoa.color].filter(Boolean);
    if (hp.length) lines.push(kv('HOA-required product', hp.join(' / ')));
    if (p.hoa.notes) lines.push(kv('HOA notes', p.hoa.notes));
  }

  // Scope / measurements — collect human-readable bits, then render
  // either as a single inline line (if one item) or as a bulleted
  // section (if multiple). Keeps the description tight on simple
  // quotes while making complex multi-component projects scannable.
  const m = p.measurements || {};
  const scopeItems = [];
  const fmtNum = (n) => Number(n).toLocaleString();

  if (p.type === 'fence') {
    // Lead with overall dimensions + style.
    if (m.linearft) {
      const lead = `${fmtNum(m.linearft)} ln ft × ${m.height || 0} ft tall`;
      const styleSuffix = m.style ? ` (${STYLE_LABELS[m.style] || m.style} style)` : '';
      scopeItems.push(lead + styleSuffix);
    } else if (m.style) {
      scopeItems.push(`${STYLE_LABELS[m.style] || m.style} style`);
    }
    // One-side breakdown — important detail that affects pricing.
    if (m.oneSided) {
      const total   = Number(m.linearft) || 0;
      const partial = Number(m.oneSidedLnFt) || 0;
      if (partial > 0 && partial < total) {
        scopeItems.push(`${fmtNum(partial)} ln ft stained one side only`);
        scopeItems.push(`${fmtNum(total - partial)} ln ft stained both sides`);
      } else {
        scopeItems.push('One-sided staining (entire fence)');
      }
    }
  } else if (p.type === 'deck') {
    if (m.flat)    scopeItems.push(`${fmtNum(m.flat)} sq ft flat decking${m.underneath ? ' (underside included)' : ''}`);
    if (m.rail)    scopeItems.push(`${fmtNum(m.rail)} ln ft of railing`);
    if (m.stairs)  scopeItems.push(`${fmtNum(m.stairs)} stair${m.stairs > 1 ? 's' : ''}`);
    if (m.lattice) scopeItems.push(`${fmtNum(m.lattice)} sq ft lattice / skirting`);
  } else if (p.type === 'pergola') {
    if (m.length && m.width) {
      const heightSuffix = m.height ? ` × ${m.height}' tall` : '';
      scopeItems.push(`${m.length}' × ${m.width}' footprint${heightSuffix}`);
    }
    if (m.sqft) scopeItems.push(`${fmtNum(m.sqft)} sq ft of stainable surface`);
    if (m.overhead) scopeItems.push('Overhead access required (attached to house or roofed)');
  } else if (p.type === 'barn') {
    if (m.sqft)          scopeItems.push(`${fmtNum(m.sqft)} sq ft of siding`);
    if (m.trim)          scopeItems.push(`${fmtNum(m.trim)} ln ft of trim`);
    if (m.cupolaCount)   scopeItems.push(`${m.cupolaCount} cupola${m.cupolaCount > 1 ? 's' : ''}`);
    if (m.heightPremium) scopeItems.push('Walls over 12 ft tall (height premium applies)');
    if (m.liftDays)      scopeItems.push(`${m.liftDays} day${m.liftDays > 1 ? 's' : ''} of equipment lift rental`);
  } else if (p.type === 'ceiling') {
    if (m.sqft)     scopeItems.push(`${fmtNum(m.sqft)} sq ft of ceiling surface`);
    if (m.tng)      scopeItems.push('Tongue-and-groove ceiling (premium application)');
    if (m.beamLnFt) scopeItems.push(`${fmtNum(m.beamLnFt)} ln ft of exposed beams`);
    if (m.fixtures) scopeItems.push(`${m.fixtures} light fixture${m.fixtures > 1 ? 's' : ''} to mask & work around`);
    if (m.fans)     scopeItems.push(`${m.fans} ceiling fan${m.fans > 1 ? 's' : ''} to mask & work around`);
    if (m.furnProtect) scopeItems.push('Indoor furniture / floor protection required');
  }

  if (scopeItems.length === 1) {
    lines.push(kv('Scope', scopeItems[0]));
  } else if (scopeItems.length > 1) {
    pushSection('SCOPE');
    scopeItems.forEach(item => lines.push(`  - ${item}`));
  }

  // Wood age / surface condition + prep — combined into one section
  // so the customer isn't reading "Wood:" and "Prep:" as two different
  // unrelated things. They're tightly related — wood condition drives
  // the prep choice.
  if (p.woodAge || p.condition) {
    const condBits = [];
    if (p.woodAge) condBits.push(WOOD_LABELS[p.woodAge] || p.woodAge);
    if (p.condition) condBits.push(PREP_LABELS[p.condition] || COND_LABELS[p.condition] || p.condition);
    lines.push(kv('Condition & prep', condBits.join(' — ')));
  }

  // Paid add-ons (project-specific + stain upgrades)
  const addonDefs = [
    ...(PRICING.projectAddons[p.type] || []),
    ...(PRICING.stainUpgrades || [])
  ];
  const checkedAddons = Object.entries(p.addons || {})
    .filter(([_, v]) => v)
    .map(([id, v]) => ({ id, v }));
  if (checkedAddons.length) {
    const labels = checkedAddons.map(({ id, v }) => {
      const def = addonDefs.find(a => a.id === id);
      const lbl = def ? def.name : id;
      const qty = (v && typeof v === 'object' && v.qty) ? v.qty : null;
      return qty ? `${lbl} × ${qty}` : lbl;
    });
    pushSection('ADD-ONS');
    labels.forEach(l => lines.push(`  - ${l}`));
  }

  // Custom add-ons (rep-entered)
  if (p.customAddons && p.customAddons.length) {
    pushSection('CUSTOM ITEMS');
    p.customAddons.forEach(ca => {
      const price = ca.price ? ` ($${Math.round(ca.price).toLocaleString()})` : '';
      lines.push(`  - ${ca.name || 'Custom item'}${price}`);
    });
  }

  // Project-level discounts applied
  if (p.selectedDiscounts && p.selectedDiscounts.length) {
    // Sum the uncapped discount rate. We use this to decide whether to
    // show the cap disclaimer at the bottom (when the rep stacked more
    // than DISCOUNT_STACK_CAP, the effective rate gets clipped — the
    // customer should know that's intentional, not a bug).
    let uncappedRate = 0;
    const discountList = p.selectedDiscounts.map(id => {
      const def = (typeof DISCOUNTS !== 'undefined') ? DISCOUNTS.find(d => d.id === id) : null;
      if (def && def.id !== 'bundle' && typeof def.rate === 'number') uncappedRate += def.rate;
      const label = def ? (def.label || def.name) : id;
      const rate = def && typeof def.rate === 'number' ? def.rate : 0;
      const ratePct = rate > 0 ? ` — ${Math.round(rate * 100)}% off` : '';
      return `${label}${ratePct}`;
    });
    if (discountList.length) {
      pushSection('DISCOUNTS APPLIED');
      discountList.forEach(d => lines.push(`  - ${d}`));
      // Dollar value of the per-project discount actually applied to
      // this line. Pulled from the project's cached compute (set when
      // the active project finalizes, or stamped via refreshAllProjectCaches
      // on a bundled-project resume). Customers regularly asked "how
      // much is the discount saving me?" — now it's right there.
      const projDiscountAmount = Number((p._cached && p._cached.discountAmount) || p.discountAmount) || 0;
      if (projDiscountAmount > 0) {
        lines.push(`  - Savings on this line: $${projDiscountAmount.toFixed(2)}`);
      }
      // Disclaimer when the stacked total exceeds our cap. Bundle is
      // excluded from the sum because it stacks separately on top.
      const cap = (typeof DISCOUNT_STACK_CAP === 'number') ? DISCOUNT_STACK_CAP : 0.10;
      if (uncappedRate > cap + 0.0001) {
        const capPct = Math.round(cap * 100);
        const selectedPct = Math.round(uncappedRate * 100);
        lines.push('');
        lines.push(`  Note: Project-level discounts are capped at ${capPct}% total. Selected discounts totaled ${selectedPct}%, so an effective ${capPct}% has been applied. Bundle discount (when applicable) stacks separately.`);
      }
    }
  }

  // Previously stained — moved to its own section at the BOTTOM so the
  // top of the description shows what we're doing, and the "history"
  // context shows below. Cleaner read order.
  if (p.previousStain && p.previousStain.wasStained) {
    const ps = p.previousStain;
    const PROD_LABELS_PS = { water: 'water-based', oil: 'oil-based', solid: 'solid', semi: 'semi-transparent', clear: 'clear sealer' };
    const psParts = [];
    if (ps.brand)               psParts.push(ps.brand);
    if (ps.productName)         psParts.push(ps.productName);
    if (ps.previousProductType) psParts.push(PROD_LABELS_PS[ps.previousProductType] || ps.previousProductType);
    pushSection('PREVIOUSLY STAINED');
    if (psParts.length)  lines.push(`  - Prior coat: ${psParts.join(' — ')}`);
    if (ps.transparency) lines.push(`  - Transparency: ${ps.transparency}`);
    if (ps.colorNotes)   lines.push(`  - Color notes: ${ps.colorNotes}`);
  }

  // --- WARRANTY (bottom of description) ---
  // Per EXPERT Stain & Seal Supply's product documentation:
  //   - Semi-transparent stains: 2-year manufacturer warranty
  //   - Semi-solid stains: 3-year manufacturer warranty
  // Essential-tier single-coat sealers don't carry a color-longevity
  // warranty (they're value tier — sealing only, no pigment system).
  // HOA-specified products warranty per whatever product the HOA
  // requires, so we skip the line in that case.
  const WARRANTY_BY_TIER = {
    'performance-oil':   '2-year manufacturer warranty on color & sheen (semi-transparent)',
    'showcase-oil':      '2-year manufacturer warranty on color & sheen (semi-transparent)',
    'performance-water': '3-year manufacturer warranty on color & sheen (semi-solid)',
    'showcase-water':    '3-year manufacturer warranty on color & sheen (semi-solid)',
    'essential-oil':     'No manufacturer warranty on color longevity (value tier — sealing only)',
    'essential-water':   'No manufacturer warranty on color longevity (value tier — sealing only)'
  };
  if (WARRANTY_BY_TIER[wKey]) {
    lines.push('');
    lines.push(kv('Warranty', WARRANTY_BY_TIER[wKey]));
  }

  // Reference photo URLs are NOT embedded in the customer-facing
  // description. They go on the private internal notes (assembled in
  // jobber.jsw pushQuote) so the rep and crew can see them while the
  // customer's quote stays clean. The backend also still tries to
  // attach them as proper Jobber line-item images on a best-effort
  // basis — we send the URLs through `referencePhotoUrls` for that.
  const photos = (p.referencePhotos || []).filter(ph => ph && ph.url);

  return {
    name,
    description: lines.join('\n'),
    referencePhotoUrls: photos.map(ph => ph.url)
  };
}

function buildCloudPayload() {
  // Reject obviously-empty drafts so we don't litter the dashboard with
  // junk rows the rep didn't really start.
  const hasCustomerName = state.customer.name || state.customer.firstName || state.customer.lastName;
  if (!hasCustomerName && !state.activeProject.type && state.bundledProjects.length === 0) return null;

  let totals;
  try { totals = computeAllTotals(); } catch (e) { totals = { active: { subtotal: 0 }, bundled: [], sumBeforeBundle: 0, bundleDiscount: 0, bundleEligible: false, finalTotal: 0 }; }
  // CRITICAL: computeAllTotals() RETURNS the totals object but doesn't
  // set `_cached` on state.activeProject. Without this stamp, the
  // subtotal we send to the cloud (and downstream to Jobber) is 0.
  // That's what was producing $0 line items in Jobber's UI.
  const allProjects = [
    ...(state.activeProject.type ? [{ ...state.activeProject, _cached: totals.active }] : []),
    ...state.bundledProjects
  ];

  // Combined display fields (legacy compat) — derived from the
  // structured fields when present, otherwise from the existing
  // single-field shape. Old drafts that only have `name`/`address`
  // continue to work without migration.
  const combinedName = state.customer.firstName || state.customer.lastName
    ? `${state.customer.firstName || ''} ${state.customer.lastName || ''}`.trim()
    : (state.customer.name || '');
  const combinedAddr = state.customer.street1
    ? [
        state.customer.street1,
        state.customer.street2,
        [state.customer.city, state.customer.province, state.customer.postalCode].filter(Boolean).join(' ')
      ].filter(Boolean).join(', ')
    : (state.customer.address || '');

  return {
    customer: {
      // Legacy combined fields (used by the dashboard, read-only view, etc.)
      name:    combinedName,
      address: combinedAddr,
      phone:   state.customer.phone   || '',
      email:   state.customer.email   || '',
      // Structured fields — these are what get passed to Jobber's
      // AddressAttributes (street1/street2/city/province/postalCode).
      // Optional; the backend falls back to splitting the combined
      // values if the structured ones are empty.
      firstName:   state.customer.firstName   || '',
      lastName:    state.customer.lastName    || '',
      companyName: state.customer.companyName || '',
      street1:     state.customer.street1     || '',
      street2:     state.customer.street2     || '',
      city:        state.customer.city        || '',
      province:    state.customer.province    || '',
      postalCode:  state.customer.postalCode  || '',
      // Picked-from-Jobber fields — let findOrCreateClient skip search/create
      // and tie the quote straight to the existing client+property in Jobber.
      jobberClientId:   state.customer.jobberClientId   || '',
      jobberPropertyId: state.customer.jobberPropertyId || ''
    },
    employee: (__currentRep && __currentRep.displayName) || state.customer.employee || '',
    repId:   (__currentRep && __currentRep._id) || '',
    repName: (__currentRep && __currentRep.displayName) || '',
    jobberJobNum: state.customer.jobberNum || '',
    // Jobber request linkage — set when the quote was started from
    // the Recent Jobber Requests panel on the dashboard. Survives
    // cloud round-trip; pushQuote sends it back to Jobber as
    // attributes.requestId so the quote is linked to the inbound
    // request in Jobber's request tracker.
    jobberRequestId: state.jobberRequestId || '',
    projects: allProjects.map((p, idx) => {
      let jobberLine = { name: '', description: '' };
      try { jobberLine = buildJobberLineItem(p, idx, allProjects.length); }
      catch (e) { console.warn('[SSS] buildJobberLineItem threw:', e); }

      const cachedSubtotal     = (p._cached && Number(p._cached.subtotal))       || 0;
      const cachedDiscountAmt  = (p._cached && Number(p._cached.discountAmount)) || 0;
      // Pre-discount = what the project would cost without the per-project
      // discount applied. We send this as the Jobber line item unitPrice
      // so the customer sees the full price, and the discount shows up
      // as its own line in Jobber's quote UI.
      const preDiscountSubtotal = cachedSubtotal + cachedDiscountAmt;

      return {
        type: p.type, productType: p.productType, tier: p.tier,
        condition: p.condition, woodAge: p.woodAge,
        selectedColor: p.selectedColor,
        hoa: p.hoa, previousStain: p.previousStain,
        measurements: p.measurements,
        addons: p.addons, serviceAddons: p.serviceAddons,
        customAddons: p.customAddons || [],
        selectedDiscounts: p.selectedDiscounts || [],
        referencePhotos: (p.referencePhotos || []).filter(ph => ph && ph.url).map(ph => ({ url: ph.url, name: ph.name || '' })),
        // Subtotal & discount fields — all survive cloud round-trips.
        subtotal:           cachedSubtotal,
        discountAmount:     cachedDiscountAmt,
        preDiscountSubtotal: preDiscountSubtotal,
        _jobberName: jobberLine.name,
        _jobberDescription: jobberLine.description,
        _jobberReferencePhotoUrls: jobberLine.referencePhotoUrls || []
      };
    }),
    totals: {
      sumBeforeBundle:      totals.sumBeforeBundle,
      bundleDiscount:       totals.bundleDiscount,
      bundleEligible:       totals.bundleEligible,
      // Sum of per-project discount amounts across all projects on the
      // quote. The backend adds this to bundleDiscount to compute the
      // total dollar discount applied at Jobber's quote level.
      totalDiscountSavings: totals.totalDiscountSavings || 0,
      final:                totals.finalTotal,
      // Stage progress — stored inside the totals JSON so we don't need
      // a schema change. Restored on resume so reps land on the step they
      // were last on, not jumped to Step 10 with an incomplete project.
      _currentStage:        state.currentStage,
      _maxStageReached:     state.maxStageReached
    },
    notes:          state.notes || '',
    paymentMethod:  state.paymentMethod || '',
    bundleEligible: !!totals.bundleEligible
  };
}

// Ring buffer of recent save attempts — accessible at
// window.__sssSaveLog from the browser console. Helps diagnose
// "my quote didn't save" reports without speculation.
const __sssSaveLog = [];
function logSave(entry) {
  __sssSaveLog.push({ ts: new Date().toISOString(), ...entry });
  if (__sssSaveLog.length > 40) __sssSaveLog.shift();
}
window.__sssSaveLog = __sssSaveLog;

// Promise that resolves when there's no save in flight / pending. Used by
// finalize and stage-navigation paths to guarantee the in-flight write
// lands before we move on or before we mark the row "finished".
let __saveSettledResolver = null;
let __saveSettledPromise = Promise.resolve();
function markSaveStart() {
  if (!__saveSettledResolver) {
    __saveSettledPromise = new Promise(r => { __saveSettledResolver = r; });
  }
}
function markSaveDone() {
  if (!__cloudSaveInFlight && !__cloudSavePending && __saveSettledResolver) {
    const r = __saveSettledResolver; __saveSettledResolver = null;
    r();
  }
}
function awaitSaveSettled() { return __saveSettledPromise; }

async function cloudSaveDraft(attempt = 0) {
  if (typeof __sssBridge === 'undefined' || !__sssBridge.call) return;
  // Coalesce concurrent saves: one in flight + one queued.
  if (__cloudSaveInFlight) { __cloudSavePending = true; markSaveStart(); return; }
  const payload = buildCloudPayload();
  if (!payload) return;

  __cloudSaveInFlight = true;
  markSaveStart();
  if (typeof setSavePill === 'function') setSavePill('saving');

  // Diagnostic: log the payload SIZE (not contents — could be large)
  // so out-of-bounds writes are visible in the log.
  let payloadBytes = 0;
  try { payloadBytes = JSON.stringify(payload).length; } catch (e) {}

  try {
    let res;
    if (!state.cloudRowId) {
      res = await __sssBridge.call('createQuote', { payload });
      if (res && res.ok && res.quote && res.quote._id) {
        state.cloudRowId = res.quote._id;
        if (res.quote.quoteId) {
          state.quoteId = res.quote.quoteId;
          const qnEl = __doc.getElementById('quoteNum');
          if (qnEl) qnEl.textContent = state.quoteId;
        }
      }
    } else {
      res = await __sssBridge.call('updateQuote', { quoteRowId: state.cloudRowId, patch: payload });
    }
    if (res && res.ok) {
      __lastSavedAt = Date.now();
      if (typeof setSavePill === 'function') setSavePill('saved');
      logSave({ ok: true, kind: state.cloudRowId ? 'update' : 'create', bytes: payloadBytes, quoteId: state.quoteId, rowId: state.cloudRowId, attempt });
    } else {
      console.warn('[SSS Cloud] save failed:', res);
      logSave({ ok: false, kind: 'rejected', bytes: payloadBytes, quoteId: state.quoteId, rowId: state.cloudRowId, attempt, error: res && res.error });
      // Retry with backoff: 1s, 3s, 8s. After three tries, give up but
      // leave the pill in 'failed' state so the rep knows.
      if (attempt < 3) {
        const wait = [1000, 3000, 8000][attempt];
        setTimeout(() => cloudSaveDraft(attempt + 1), wait);
      } else if (typeof setSavePill === 'function') {
        setSavePill('failed');
      }
    }
  } catch (e) {
    console.warn('[SSS Cloud] save threw:', e);
    logSave({ ok: false, kind: 'threw', bytes: payloadBytes, quoteId: state.quoteId, rowId: state.cloudRowId, attempt, error: String(e && e.message || e) });
    if (attempt < 3) {
      const wait = [1000, 3000, 8000][attempt];
      setTimeout(() => cloudSaveDraft(attempt + 1), wait);
    } else if (typeof setSavePill === 'function') {
      setSavePill('failed');
    }
  } finally {
    __cloudSaveInFlight = false;
    if (__cloudSavePending) {
      __cloudSavePending = false;
      // Run again on next tick so the new state is captured.
      setTimeout(() => cloudSaveDraft(0), 0);
    } else {
      markSaveDone();
    }
  }
}

// Force any pending debounced save to run immediately. Useful before
// navigation/finalize so the latest measurements always land before
// the row is marked finished or the rep leaves the page.
function flushPendingSaves() {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
    try { autoSaveDraft(); } catch (e) { console.warn('[SSS] flush autoSaveDraft threw:', e); }
  }
}

function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(autoSaveDraft, 1500); // 1.5s debounce
}

/* ============================================================
   DASHBOARD (cloud-fetched) — folders, search, recent, stats
   ============================================================ */
const dashState = {
  search: '',
  folders: { draft: true, finished: false, archived: false, trashed: false },
  cache:   { draft: [], finished: [], archived: [], trashed: [] },
  loaded:  false,
  searchTimer: null,
  // Bulk-select mode. When `bulkMode` is true, every dashboard row
  // shows a checkbox and a sticky action bar at the top lets the
  // rep move/trash/restore the selection in one go.
  bulkMode: false,
  // Selected row IDs across folders. Keyed by `${folder}:${rowId}` so
  // a quote ID that collides across two folders (shouldn't, but
  // defensive) doesn't get confused. Local-only drafts use
  // `${folder}:local:${quoteId}`.
  selection: new Set()
};

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtMoney(n) {
  const v = Number(n) || 0;
  return '$' + Math.round(v).toLocaleString();
}

function setStatsLoading() {
  const sw  = __doc.getElementById('statWeekCount');
  const swt = __doc.getElementById('statWeekTotal');
  const sm  = __doc.getElementById('statMonthCount');
  const smt = __doc.getElementById('statMonthTotal');
  if (sw)  sw.textContent  = '…';
  if (swt) swt.textContent = ' ';
  if (sm)  sm.textContent  = '…';
  if (smt) smt.textContent = ' ';
}

function applyStatsResult(stats) {
  const sw  = __doc.getElementById('statWeekCount');
  const swt = __doc.getElementById('statWeekTotal');
  const sm  = __doc.getElementById('statMonthCount');
  const smt = __doc.getElementById('statMonthTotal');
  if (stats && stats.ok && stats.stats) {
    if (sw)  sw.textContent  = stats.stats.week.count;
    if (swt) swt.textContent = fmtMoney(stats.stats.week.total) + ' quoted';
    if (sm)  sm.textContent  = stats.stats.month.count;
    if (smt) smt.textContent = fmtMoney(stats.stats.month.total) + ' quoted';
    return true;
  }
  if (sw)  sw.textContent  = '—';
  if (swt) swt.textContent = 'stats unavailable';
  if (sm)  sm.textContent  = '—';
  if (smt) smt.textContent = 'stats unavailable';
  return false;
}

// Stats fetch is independent of the list fetches so a stale/late
// list response can't suppress the stats UI. Retries up to 3x with
// short backoff to cover the common race where the returning rep
// beats the setQuoteStatus('finished') write to the DB.
async function refreshStats({ attempts = 3, delayMs = 700 } = {}) {
  if (typeof __sssBridge === 'undefined' || !__sssBridge.call) return false;
  for (let i = 0; i < attempts; i++) {
    try {
      const stats = await __sssBridge.call('getStats', {});
      if (applyStatsResult(stats)) return true;
    } catch (e) { console.warn('[SSS Cloud] stats attempt', i + 1, 'failed:', e); }
    if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs * (i + 1)));
  }
  return false;
}

/* ============================================================
   RECENT JOBBER REQUESTS — dashboard panel
   ============================================================
   Pulls customer-submitted quote requests from Jobber and lets the
   rep convert one into a fresh quote with the customer info pre-
   filled (incl. jobberClientId so push doesn't create a duplicate).
   Fire-and-forget — silently hides the panel if Jobber's not
   connected or returns no requests.
   ============================================================ */
let __jobberRequestsCache = [];

// Pulls a generous slice of recent requests and renders them
// in the dashboard panel. The rep can search/filter client-side
// so they can find an older request without re-fetching.
let __reqSearch = '';
async function loadJobberRequests() {
  const panel = __doc.getElementById('reqPanel');
  const body  = __doc.getElementById('reqPanelBody');
  const countEl = __doc.getElementById('reqPanelCount');
  if (!panel || !body) return;
  try {
    const r = await fetch('/_functions/jobberRequests?limit=50', { credentials: 'include' });
    if (!r.ok) { panel.style.display = 'none'; return; }
    const data = await r.json();
    if (!data || !data.ok) {
      // Don't show a noisy error on the dashboard if the schema
      // probe is wrong — just log + hide. Surface the issue if
      // there's clearly a server problem.
      console.warn('[SSS] jobberRequests fetch failed:', data);
      if (data && data.error && data.detail) {
        body.innerHTML = `<div class="req-error">Couldn't load Jobber requests — ${escapeHtml(String(data.error))}. Check the Jobber connection or schema.</div>`;
        if (countEl) countEl.textContent = '!';
        panel.style.display = 'block';
        panel.open = true;
      } else {
        panel.style.display = 'none';
      }
      return;
    }
    const nodes = Array.isArray(data.nodes) ? data.nodes : [];
    __jobberRequestsCache = nodes;
    if (countEl) countEl.textContent = String(nodes.length);
    if (nodes.length === 0) {
      // Nothing to convert — keep the panel out of the way.
      panel.style.display = 'none';
      return;
    }
    renderJobberRequests();
    panel.style.display = 'block';

    // Hook up the search input once. Each keystroke re-filters the
    // already-fetched list — no extra network calls.
    const searchEl = __doc.getElementById('reqSearch');
    if (searchEl && !searchEl._wired) {
      searchEl._wired = true;
      searchEl.addEventListener('input', (e) => {
        __reqSearch = (e.target.value || '').toLowerCase().trim();
        renderJobberRequests();
      });
    }
    // Stay collapsed by default — the rep opens it when they want to
    // see today's incoming requests. Once they've opened/closed it,
    // their choice sticks for the rest of the session.
  } catch (e) {
    console.warn('[SSS] jobberRequests threw:', e);
    panel.style.display = 'none';
  }
}

function renderJobberRequests() {
  const body = __doc.getElementById('reqPanelBody');
  const countEl = __doc.getElementById('reqPanelCount');
  if (!body) return;
  const all = __jobberRequestsCache || [];
  const q = __reqSearch;
  const filtered = !q ? all : all.filter(req => {
    const blob = [
      req.customerName, req.firstName, req.lastName, req.companyName,
      req.email, req.phone, req.title, req.city, req.province,
      req.street1, req.requestStatus
    ].filter(Boolean).join(' ').toLowerCase();
    return blob.includes(q);
  });
  if (countEl) countEl.textContent = q ? `${filtered.length}/${all.length}` : String(all.length);
  if (filtered.length === 0) {
    body.innerHTML = `<div class="req-empty">No requests match "${escapeHtml(q)}".</div>`;
    return;
  }
  body.innerHTML = filtered.map((req) => {
    const origIdx = all.indexOf(req);
    const ago = req.createdAt ? timeSince(new Date(req.createdAt)) : '';
    const metaBits = [
      req.requestStatus ? `<span class="req-card-status">${escapeHtml(req.requestStatus)}</span>` : '',
      req.email ? `<span>${escapeHtml(req.email)}</span>` : '',
      req.phone ? `<span>${escapeHtml(req.phone)}</span>` : '',
      req.city  ? `<span>${escapeHtml([req.city, req.province].filter(Boolean).join(', '))}</span>` : '',
      ago        ? `<span>${escapeHtml(ago)}</span>` : ''
    ].filter(Boolean).join('<span class="sep"> · </span>');
    return `
      <div class="req-card">
        <div class="req-card-main">
          <div class="req-card-cust">${escapeHtml(req.customerName || 'Unknown')}</div>
          ${req.title ? `<div class="req-card-title">${escapeHtml(req.title)}</div>` : ''}
          ${metaBits ? `<div class="req-card-meta">${metaBits}</div>` : ''}
        </div>
        <div class="req-card-actions">
          <button class="btn btn-primary" onclick="convertJobberRequestToQuote(${origIdx})">＋ Convert to Quote</button>
        </div>
      </div>`;
  }).join('');
}

// Convert the picked Jobber request into a brand-new quote with the
// customer info pre-filled (including jobberClientId so the push won't
// duplicate the client). Then jump straight to Step 2 since Step 1 is
// already complete.
function convertJobberRequestToQuote(idx) {
  const req = __jobberRequestsCache[idx];
  if (!req) return;
  const customerLabel = req.customerName || 'this request';
  if (!confirm(`Start a new quote from ${customerLabel}'s Jobber request? The customer details will be pre-filled.`)) return;

  // Reset state to a fresh quote — same as startNewQuote, but then
  // immediately stamp the request's customer data.
  const employee = state.customer.employee || '';
  state.customer = {
    name: '', phone: '', email: '', address: '',
    firstName: '', lastName: '', companyName: '',
    street1: '', street2: '', city: '', province: '', postalCode: '',
    jobberClientId: '', jobberPropertyId: '',
    jobberNum: '', employee
  };
  state.activeProject = makeBlankProject();
  state.bundledProjects = [];
  state.editingBundleIdx = null;
  state.paymentMethod = 'deposit';
  state.notes = req.title ? `Imported from Jobber request: ${req.title}` : '';
  state.quoteId = makeQuoteId();
  state.cloudRowId = null;
  state.maxStageReached = 1;
  // Carry the Jobber request ID so pushQuote can link the resulting
  // quote back to the inbound request in Jobber's request tracker.
  state.jobberRequestId = req.id || '';

  // Stamp the request's customer info into both structured + legacy fields.
  const fullName = [req.firstName, req.lastName].filter(Boolean).join(' ').trim();
  state.customer.firstName    = req.firstName    || '';
  state.customer.lastName     = req.lastName     || '';
  state.customer.companyName  = req.companyName  || '';
  state.customer.name         = req.companyName || fullName || '';
  state.customer.email        = req.email        || '';
  state.customer.phone        = req.phone        || '';
  state.customer.street1      = req.street1      || '';
  state.customer.street2      = req.street2      || '';
  state.customer.city         = req.city         || '';
  state.customer.province     = req.province     || '';
  state.customer.postalCode   = req.postalCode   || '';
  state.customer.address      = [
    req.street1, req.city, [req.province, req.postalCode].filter(Boolean).join(' ')
  ].filter(Boolean).join(', ');
  state.customer.jobberClientId   = req.clientId   || '';
  state.customer.jobberPropertyId = req.propertyId || '';

  // Hide dashboard, paint the form, jump to Step 2 since Step 1 is filled.
  __doc.getElementById('stage-dashboard').classList.remove('visible');
  __doc.querySelectorAll('input').forEach(i => { if (i.type !== 'checkbox' && i.type !== 'radio') i.value = ''; });
  const set = (id, v) => { const el = __doc.getElementById(id); if (el) el.value = v || ''; };
  set('custName',     state.customer.name);
  set('custPhone',    state.customer.phone);
  set('custEmail',    state.customer.email);
  set('custAddress',  state.customer.address);
  set('employeeName', state.customer.employee);
  const qn = __doc.getElementById('quoteNum'); if (qn) qn.textContent = state.quoteId;
  const ta = __doc.getElementById('quoteNotesField'); if (ta) ta.value = state.notes || '';

  showStage(2);
  updateRunningTotal();
}

async function loadDashboardData() {
  if (typeof __sssBridge === 'undefined' || !__sssBridge.call) {
    dashState.cache.draft = getDrafts().map(localDraftToView);
    dashState.cache.finished = []; dashState.cache.archived = []; dashState.cache.trashed = [];
    dashState.loaded = true;
    return;
  }

  setStatsLoading();
  // Kick stats off in parallel but don't await — let it self-heal in
  // its own retry loop while the rest of the dashboard renders.
  refreshStats();
  // Recent Jobber requests panel — fire-and-forget, hides on its own
  // if Jobber isn't reachable or returns nothing.
  loadJobberRequests();

  // Promise.allSettled (not Promise.all) so one slow/failed folder
  // request doesn't cascade into a catch that blanks all caches.
  // Previously: any one rejection → catch → caches reset → user sees
  // an empty dashboard for a beat. Now each folder updates independently.
  const results = await Promise.allSettled([
    __sssBridge.call('listQuotes', { status: 'draft',    limit: 200 }),
    __sssBridge.call('listQuotes', { status: 'finished', limit: 200 }),
    __sssBridge.call('listQuotes', { status: 'archived', limit: 200 }),
    __sssBridge.call('listQuotes', { status: 'trashed',  limit: 200 })
  ]);
  const folders = ['draft', 'finished', 'archived', 'trashed'];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value && r.value.ok) {
      dashState.cache[folders[i]] = r.value.items || [];
    } else {
      console.warn(`[SSS Cloud] ${folders[i]} fetch failed:`,
        r.status === 'rejected' ? r.reason : r.value);
      // Keep the previous cache rather than blanking it.
      dashState.cache[folders[i]] = dashState.cache[folders[i]] || [];
    }
  });
  // If the drafts fetch failed entirely, surface localStorage drafts so
  // the rep isn't blocked.
  if (results[0].status !== 'fulfilled' || !(results[0].value && results[0].value.ok)) {
    const localOnly = getDrafts().map(localDraftToView);
    if (localOnly.length > 0 && dashState.cache.draft.length === 0) {
      dashState.cache.draft = localOnly;
    }
  }
  dashState.loaded = true;
}

// Map a localStorage draft snapshot to the same shape as a cloud row,
// so a single renderer can handle either source.
function localDraftToView(d) {
  return {
    _id: 'local:' + d.quoteId,
    quoteId: d.quoteId,
    status: 'draft',
    customer: { name: d.customerName || '', phone: '', email: '', address: '' },
    employeeName: d.employeeName || '',
    lastEditedBy: d.employeeName || '',
    finalTotal: 0,
    projectCount: (d.state && d.state.bundledProjects ? d.state.bundledProjects.length : 0) + (d.state && d.state.activeProject && d.state.activeProject.type ? 1 : 0),
    dateModified: d.lastSavedAt,
    createdAt: d.lastSavedAt,
    dateFinished: null, dateArchived: null, dateTrashed: null,
    _localOnly: true,
    _localIdx: -1  // resolved at render time
  };
}

function matchesSearch(item) {
  const q = dashState.search.trim().toLowerCase();
  if (!q) return true;
  const c = item.customer || {};
  const blob = [
    c.name, c.phone, c.email, c.address,
    item.quoteId, item.employeeName, item.lastEditedBy
  ].filter(Boolean).join(' ').toLowerCase();
  return blob.includes(q);
}

function bulkKey(folder, item) {
  return folder + ':' + (item._localOnly ? ('local:' + item.quoteId) : (item._id || ''));
}

function renderQRow(item, folder) {
  const cust  = (item.customer && item.customer.name) || '(unnamed customer)';
  const addr  = (item.customer && item.customer.address) || '';
  const phone = (item.customer && item.customer.phone)   || '';
  const ago   = item.dateModified ? timeSince(new Date(item.dateModified)) : '';
  // Prefer the auth-backed rep name (stamped when the rep was signed
  // in via the SSS auth system) over the older freeform fields. Falls
  // back to those for quotes saved before auth went in.
  const by    = item.repName || item.lastEditedBy || item.employeeName || '';
  const total = Number(item.finalTotal) || 0;
  const isLocal = !!item._localOnly;
  const rowId  = isLocal ? '' : (item._id || '');
  const bKey   = bulkKey(folder, item);
  const isChecked = dashState.bulkMode && dashState.selection.has(bKey);
  const primaryLabel = folder === 'trashed' ? 'View' : (folder === 'finished' ? 'View' : 'Resume →');
  const primaryAction = isLocal
    ? `resumeLocalDraft('${escapeHtml(item.quoteId)}')`
    : `resumeCloudQuote('${escapeHtml(rowId)}')`;

  // Project summary chips: "Fence · Deck" with tier labels when present.
  // Falls back to a simple project count if labels aren't available.
  const projects = Array.isArray(item.projects) ? item.projects : [];
  const PROJECT_LABELS = { fence: 'Fence', deck: 'Deck', pergola: 'Pergola', barn: 'Barn', ceiling: 'Ceiling' };
  const TIER_SHORT = { essential: 'Ess', performance: 'Perf', showcase: 'Show' };
  const projChipsHtml = projects.length > 0
    ? projects.slice(0, 4).map(p => {
        const lbl = PROJECT_LABELS[p && p.type] || (p && p.type) || '';
        const t = p && p.tier && TIER_SHORT[p.tier];
        return `<span class="proj-chip">${escapeHtml(lbl)}${t ? ` · ${t}` : ''}</span>`;
      }).join('') + (projects.length > 4 ? `<span class="proj-chip">+${projects.length - 4}</span>` : '')
    : '';

  // Pull initials from the rep name (or initials field if available)
  // so we can render a compact avatar circle on the row.
  const byInitials = (item.repInitials && String(item.repInitials).toUpperCase().slice(0, 2))
                  || (by ? by.split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 2) : '');
  const repChipHtml = by
    ? `<span class="qrow-rep-chip" title="Quoted by ${escapeHtml(by)}"><span class="qrow-rep-avatar">${escapeHtml(byInitials || '?')}</span><span class="qrow-rep-name">${escapeHtml(by)}</span></span>`
    : '';

  return `
    <div class="qrow${isChecked ? ' selected' : ''}" data-bulk-key="${escapeHtml(bKey)}">
      <input type="checkbox" class="qrow-checkbox" ${isChecked ? 'checked' : ''} onchange="toggleBulkRow('${escapeHtml(bKey)}', this.checked)" onclick="event.stopPropagation();" aria-label="Select quote">
      <div class="qrow-main">
        <div class="qrow-cust">${escapeHtml(cust)}</div>
        <div class="qrow-meta">
          <span class="quote-id-mono">${escapeHtml(item.quoteId || '')}</span>
          ${phone ? `<span class="sep">·</span><span>${escapeHtml(phone)}</span>` : ''}
          ${addr  ? `<span class="sep">·</span><span class="qrow-addr">${escapeHtml(addr)}</span>` : ''}
          ${ago   ? `<span class="sep">·</span><span>${ago}</span>`              : ''}
          ${isLocal ? '<span class="sep">·</span><span style="color:var(--coral)">local only</span>' : ''}
        </div>
        <div class="qrow-chips-row">
          ${repChipHtml}
          ${projChipsHtml || ''}
        </div>
        ${total > 0 ? `<div class="qrow-total">${fmtMoney(total)}</div>` : ''}
      </div>
      <div class="qrow-actions">
        <button class="btn btn-primary" onclick="${primaryAction}">${primaryLabel}</button>
        <button class="ico-btn" onclick="openRowMenu(event, '${escapeHtml(rowId)}', '${folder}', ${isLocal ? 'true' : 'false'}, '${escapeHtml(item.quoteId || '')}')" aria-label="More actions">⋯</button>
      </div>
    </div>`;
}

function folderMeta(folder) {
  switch (folder) {
    case 'draft':    return { icon: '📂', label: 'Drafts'   };
    case 'finished': return { icon: '✅', label: 'Finished' };
    case 'archived': return { icon: '🗄',  label: 'Archived' };
    case 'trashed':  return { icon: '🗑',  label: 'Trash'    };
  }
}

function renderFolder(folder) {
  const items = (dashState.cache[folder] || []).filter(matchesSearch);
  const meta = folderMeta(folder);
  const open = dashState.folders[folder] || (dashState.search.trim() && items.length > 0);
  const bodyHtml = items.length === 0
    ? `<div class="folder-empty">No ${meta.label.toLowerCase()} ${dashState.search ? 'match this search' : 'yet'}.</div>`
    : items.map(it => renderQRow(it, folder)).join('');

  // Surface the auto-purge policy on the Trash folder so reps know
  // their deleted quotes aren't sitting there forever (and that they
  // have a 7-day window to undo).
  const trashNote = folder === 'trashed'
    ? `<div class="folder-empty" style="font-size:11px;padding:6px 4px 0;color:var(--slate);font-style:italic;">Items here are automatically deleted permanently after 7 days.</div>`
    : '';

  return `
    <details class="folder" ${open ? 'open' : ''} data-folder="${folder}">
      <summary onclick="onFolderToggle('${folder}', event)">
        <span class="chev">▸</span>
        <span class="folder-icon">${meta.icon}</span>
        <span class="folder-label">${meta.label}</span>
        <span class="folder-count">${items.length}</span>
      </summary>
      <div class="folder-body">${trashNote}${bodyHtml}</div>
    </details>`;
}

function renderRecentStrip() {
  // Top 3 most-recently-modified drafts. If user has no drafts, hide.
  const drafts = (dashState.cache.draft || [])
    .slice() // already sorted by backend (descending dateModified)
    .filter(matchesSearch)
    .slice(0, 3);
  if (drafts.length === 0) return '';
  return `
    <div class="recent-strip">
      <h3>📌 Recent activity</h3>
      ${drafts.map(it => renderQRow(it, 'draft')).join('')}
    </div>`;
}

function renderDashboard() {
  const dashContent = __doc.getElementById('dashContent');
  if (!dashContent) return;

  // If we've never loaded, kick it off and show a skeleton.
  if (!dashState.loaded) {
    dashContent.innerHTML = `
      <div class="empty-drafts">
        <div class="empty-icon">⏳</div>
        <h3>Loading your quotes…</h3>
        <p>Fetching from the cloud.</p>
      </div>`;
    loadDashboardData().then(renderDashboard);
    return;
  }

  const total =
    dashState.cache.draft.length +
    dashState.cache.finished.length +
    dashState.cache.archived.length +
    dashState.cache.trashed.length;

  if (total === 0) {
    dashContent.innerHTML = `
      <div class="empty-drafts">
        <div class="empty-icon">📋</div>
        <h3>No quotes yet</h3>
        <p>Click "Start New Quote" above to begin a quote. Your progress will auto-save as you go.</p>
      </div>`;
    // Still call this — the bar lives outside dashContent and could be
    // stuck visible from a previous bulk-mode session if every quote
    // just got deleted. renderBulkActionBar handles the hide path.
    renderBulkActionBar();
    return;
  }

  dashContent.classList.toggle('bulk-mode', !!dashState.bulkMode);
  dashContent.innerHTML =
    renderRecentStrip() +
    renderFolder('draft') +
    renderFolder('finished') +
    renderFolder('archived') +
    renderFolder('trashed');
  renderBulkActionBar();
}

// ============================================================
//  BULK SELECT — toggle mode, track selection, dispatch actions
// ============================================================
// Re-sync the Select/Exit pill button's visual state to match
// dashState.bulkMode. Called from every code path that flips bulkMode
// so the button never desyncs from the actual state.
function refreshBulkSelectButton() {
  const btn = __doc.getElementById('bulkSelectToggle');
  if (!btn) return;
  btn.classList.toggle('active', !!dashState.bulkMode);
  // The pill has icon + label child spans (mobile hides the label, so
  // updating textContent without preserving the spans would wipe the
  // icon too).
  const ico = btn.querySelector('.ico');
  const lbl = btn.querySelector('.lbl');
  if (ico) ico.textContent = dashState.bulkMode ? '✕' : '☑️';
  if (lbl) lbl.textContent = dashState.bulkMode ? 'Exit' : 'Select';
}

// Force-exit bulk mode regardless of previous state. Clears the
// selection, resets the pill button, and hides the action bar inline.
// Used by every "I'm done with bulk mode" path: the Exit pill,
// post-action cleanup (after archive / trash / restore / delete), and
// the "Cancel" button inside the action bar.
function exitBulkMode() {
  dashState.bulkMode = false;
  dashState.selection.clear();
  refreshBulkSelectButton();
  const bar = __doc.getElementById('bulkActionBar');
  if (bar) { bar.style.display = 'none'; bar.innerHTML = ''; }
}

function toggleBulkMode() {
  if (dashState.bulkMode) {
    exitBulkMode();
  } else {
    dashState.bulkMode = true;
    refreshBulkSelectButton();
  }
  renderDashboard();
}

function toggleBulkRow(bKey, checked) {
  if (checked) dashState.selection.add(bKey);
  else dashState.selection.delete(bKey);
  // Light-touch update: re-paint the row's selected class + refresh
  // the action bar. Avoid a full renderDashboard so the user's scroll
  // position doesn't jump.
  const row = __doc.querySelector(`.qrow[data-bulk-key="${cssEscape(bKey)}"]`);
  if (row) row.classList.toggle('selected', checked);
  renderBulkActionBar();
}

// Minimal CSSEscape — Wix's environment isn't guaranteed to have
// CSS.escape, so quote special chars in the bKey before using it in
// an attribute selector.
function cssEscape(s) {
  return String(s).replace(/(["\\])/g, '\\$1');
}

// Walk the selection set and resolve each key back into the actual
// row object from dashState.cache. Returns `{ items, foldersSeen }`
// so we can show folder-aware actions (e.g. "Delete Forever" only
// when the selection contains trash items).
function getBulkSelectedItems() {
  const items = [];
  const foldersSeen = new Set();
  dashState.selection.forEach(bKey => {
    const idx = bKey.indexOf(':');
    if (idx < 0) return;
    const folder = bKey.slice(0, idx);
    const ref    = bKey.slice(idx + 1);
    const list = dashState.cache[folder] || [];
    let it;
    if (ref.indexOf('local:') === 0) {
      const qid = ref.slice(6);
      it = list.find(x => x._localOnly && x.quoteId === qid);
    } else {
      it = list.find(x => !x._localOnly && x._id === ref);
    }
    if (it) {
      items.push({ folder, item: it });
      foldersSeen.add(folder);
    }
  });
  return { items, foldersSeen };
}

function renderBulkActionBar() {
  const bar = __doc.getElementById('bulkActionBar');
  if (!bar) return;
  if (!dashState.bulkMode || dashState.selection.size === 0) {
    bar.style.display = 'none';
    bar.innerHTML = '';
    return;
  }
  const { foldersSeen } = getBulkSelectedItems();
  const count = dashState.selection.size;
  // Folder-aware action buttons:
  //   - Anything from non-trash → Move to Trash
  //   - Anything from trash     → Restore + Delete Forever
  //   - Anything from non-archive → Archive
  //   - Anything from archive   → Restore to Drafts
  const buttons = [];
  if ([...foldersSeen].some(f => f !== 'archived' && f !== 'trashed')) {
    buttons.push(`<button class="btn" onclick="bulkSetStatus('archived')">🗄 Archive</button>`);
  }
  if (foldersSeen.has('archived')) {
    buttons.push(`<button class="btn" onclick="bulkSetStatus('draft')">↩ Restore to Drafts</button>`);
  }
  if (!foldersSeen.has('trashed')) {
    buttons.push(`<button class="btn btn-danger" onclick="bulkSetStatus('trashed')">🗑 Move to Trash</button>`);
  } else {
    buttons.push(`<button class="btn" onclick="bulkSetStatus('draft')">↩ Restore</button>`);
    buttons.push(`<button class="btn btn-danger" onclick="bulkPermanentlyDelete()">🔥 Delete Forever</button>`);
  }
  bar.style.display = 'flex';
  bar.innerHTML = `
    <span class="bulk-count">${count} selected</span>
    <button class="btn" onclick="bulkClearSelection()">Clear</button>
    <div class="bulk-actions">${buttons.join('')}</div>`;
}

// "Cancel" / "Done" button inside the action bar — fully exits bulk
// mode rather than just clearing selection. Matches user mental model:
// if they wanted to keep selecting, they'd just uncheck rows.
function bulkClearSelection() {
  exitBulkMode();
  renderDashboard();
}

// Move every selected quote into the target status folder. Local-only
// drafts can't be moved server-side; we skip them with a count message.
async function bulkSetStatus(targetStatus) {
  const { items } = getBulkSelectedItems();
  const cloudItems = items.filter(({ item }) => !item._localOnly);
  const localItems = items.filter(({ item }) => item._localOnly);
  if (cloudItems.length === 0 && localItems.length === 0) return;

  const verb = targetStatus === 'trashed' ? 'move to trash'
            : targetStatus === 'archived' ? 'archive'
            : 'restore';
  const confirmMsg = `${verb.charAt(0).toUpperCase() + verb.slice(1)} ${cloudItems.length} quote${cloudItems.length === 1 ? '' : 's'}?`
    + (localItems.length > 0 ? ` (${localItems.length} local-only draft${localItems.length === 1 ? '' : 's'} will be skipped — only cloud-saved quotes can be ${verb}d in bulk.)` : '');
  if (!confirm(confirmMsg)) return;

  // Fire all status updates in parallel.
  await Promise.allSettled(cloudItems.map(({ item }) =>
    __sssBridge.call('setQuoteStatus', { quoteRowId: item._id, status: targetStatus })
  ));
  // Action's done — fully exit bulk mode so the Select pill resets and
  // the bar dismisses. Used to just clear selection here, which left
  // the pill stuck on "✕ Exit" even though the bar was gone.
  exitBulkMode();
  // Reload data so the row moves to its new folder, then re-render.
  await loadDashboardData();
  renderDashboard();
}

async function bulkPermanentlyDelete() {
  const { items } = getBulkSelectedItems();
  const trashItems = items.filter(({ folder }) => folder === 'trashed');
  if (trashItems.length === 0) {
    alert('Only items already in the trash can be permanently deleted. Move them to the trash first.');
    return;
  }
  if (!confirm(`Permanently delete ${trashItems.length} quote${trashItems.length === 1 ? '' : 's'}? This cannot be undone.`)) return;
  await Promise.allSettled(trashItems.map(({ item }) =>
    __sssBridge.call('permanentlyDelete', { quoteRowId: item._id })
  ));
  exitBulkMode();
  await loadDashboardData();
  renderDashboard();
}

// ============================================================
//  PRICING ADMIN — editable overrides for tier/prep/discount rates
// ============================================================
// Snapshot of the as-loaded built-in defaults. We deep-copy on first
// access so subsequent applyPricingOverrides() calls can re-merge
// from a clean baseline (without this, repeated overrides would
// stack on top of each other and drift further from the code source
// every save). Also exposed as a "what would happen if I reset?"
// reference for the admin UI.
// `var` (not `let`) because `bootstrapDashboard()` near the top of the
// script calls `applyPricingOverrides()` which reads these — `let`
// declarations down here would be in the temporal dead zone at that
// point and throw "Cannot access '__builtInPricing' before
// initialization". `var` hoists to the script's top with an initial
// value of undefined, which our `if (!__builtInPricing)` guard
// handles fine.
var __builtInPricing  = null;
var __builtInDiscounts = null;
// Mirror of the persisted overrides for the editor form. Empty {}/[]
// when no admin has saved overrides yet.
var __pricingOverrides   = { rules: {}, discounts: [] };
var __pricingMeta        = { lastEditedBy: '', lastEditedAt: null };
// In-memory working copy while the editor is open (so cancel actually
// cancels). Diffed against __pricingOverrides on Save.
var __paWorking = null;

function deepCopy(v) { return JSON.parse(JSON.stringify(v)); }
function deepMerge(target, source) {
  // Recursive merge with array support. When both target and source
  // have an array at the same key, we merge by index — necessary for
  // add-on overrides like `stainUpgrades[0].rate` to patch a single
  // field on a single add-on without replacing the whole array.
  if (!source || typeof source !== 'object') return target;
  Object.keys(source).forEach(k => {
    const sv = source[k];
    if (Array.isArray(sv) && Array.isArray(target[k])) {
      for (let i = 0; i < sv.length; i++) {
        const item = sv[i];
        if (item == null) continue;
        if (typeof item === 'object' && !Array.isArray(item)) {
          if (!target[k][i] || typeof target[k][i] !== 'object') target[k][i] = {};
          deepMerge(target[k][i], item);
        } else {
          target[k][i] = item;
        }
      }
    } else if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      deepMerge(target[k], sv);
    } else {
      target[k] = sv;
    }
  });
  return target;
}

// Fetch pricing overrides from the backend and apply them to the live
// PRICING + DISCOUNTS in-memory. Idempotent — safe to call repeatedly.
// Falls back silently to defaults if the backend isn't reachable
// (so a bad network doesn't blank the calculator).
async function applyPricingOverrides() {
  // Snapshot built-ins on first call so we can re-merge cleanly later.
  if (!__builtInPricing) {
    __builtInPricing = deepCopy(PRICING);
    __builtInDiscounts = deepCopy(DISCOUNTS);
  }
  if (typeof __sssBridge === 'undefined' || !__sssBridge.call) return;
  try {
    const res = await __sssBridge.call('getPricingRules');
    if (!res || !res.ok) return;
    __pricingOverrides = {
      rules:     res.rules     || {},
      discounts: res.discounts || []
    };
    __pricingMeta = {
      lastEditedBy: res.lastEditedBy || '',
      lastEditedAt: res.lastEditedAt || null
    };
    // Re-build PRICING from a clean baseline + overrides.
    Object.keys(__builtInPricing).forEach(k => { PRICING[k] = deepCopy(__builtInPricing[k]); });
    deepMerge(PRICING, __pricingOverrides.rules);
    // Discounts: walk the built-in array, patch `rate` from overrides
    // by id. We deliberately don't allow adding/removing discount
    // entries from the UI — only re-tuning rates of the existing ones.
    DISCOUNTS.forEach((d, i) => {
      const baseline = __builtInDiscounts[i];
      if (baseline) DISCOUNTS[i] = deepCopy(baseline);
      const patch = (__pricingOverrides.discounts || []).find(p => p && p.id === d.id);
      if (patch && typeof patch.rate === 'number') DISCOUNTS[i].rate = patch.rate;
    });
  } catch (e) { /* non-fatal; defaults stay in effect */ }
}

function openPricingAdmin() {
  // Snapshot the as-loaded overrides + built-ins for the editor. The
  // working copy starts as a clone of currently-applied overrides so
  // unedited fields show the value the calc is actually using.
  if (!__builtInPricing) { __builtInPricing = deepCopy(PRICING); __builtInDiscounts = deepCopy(DISCOUNTS); }
  __paWorking = {
    rules:     deepCopy(__pricingOverrides.rules || {}),
    discounts: deepCopy(__pricingOverrides.discounts || [])
  };
  __doc.getElementById('pricingAdminBody').innerHTML = renderPricingAdminTab('tiers');
  __doc.querySelectorAll('#pricingAdminTabs .pa-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.paTab === 'tiers');
    t.onclick = () => switchPricingAdminTab(t.dataset.paTab);
  });
  const meta = __doc.getElementById('pricingAdminMeta');
  if (meta) {
    if (__pricingMeta.lastEditedAt) {
      const d = new Date(__pricingMeta.lastEditedAt);
      meta.textContent = 'Last edited ' + d.toLocaleString() + (__pricingMeta.lastEditedBy ? ' by ' + __pricingMeta.lastEditedBy : '');
    } else {
      meta.textContent = 'No overrides saved yet — currently running on code defaults.';
    }
  }
  const dlg = __doc.getElementById('pricingAdminDialog');
  if (dlg && dlg.showModal) dlg.showModal();
  else if (dlg) dlg.setAttribute('open', '');
}

function closePricingAdmin() {
  const dlg = __doc.getElementById('pricingAdminDialog');
  if (dlg && dlg.close) dlg.close();
  else if (dlg) dlg.removeAttribute('open');
  __paWorking = null;
}

function switchPricingAdminTab(tab) {
  // Capture any edits the user typed on the current tab before swapping
  // out the DOM (otherwise switching tab discards in-progress changes).
  paCaptureCurrentTab();
  __doc.querySelectorAll('#pricingAdminTabs .pa-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.paTab === tab);
  });
  __doc.getElementById('pricingAdminBody').innerHTML = renderPricingAdminTab(tab);
}

function paCaptureCurrentTab() {
  if (!__paWorking) return;
  const body = __doc.getElementById('pricingAdminBody');
  if (!body) return;
  body.querySelectorAll('input[data-pa-path]').forEach(inp => {
    const path = inp.dataset.paPath;
    const v = parseFloat(inp.value);
    if (isNaN(v)) return;
    paSetPath(__paWorking, path, v);
  });
}

// Walk a dotted path and set the leaf value. Creates intermediate
// objects as needed. Paths use `.` for objects and `:<index>` for
// arrays (e.g. `discounts:2.rate`).
function paSetPath(root, path, value) {
  const parts = path.split('.');
  let node = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (key.indexOf(':') >= 0) {
      // Array-style index inside the path
      const [arrKey, idxStr] = key.split(':');
      const idx = parseInt(idxStr, 10);
      if (!Array.isArray(node[arrKey])) node[arrKey] = [];
      while (node[arrKey].length <= idx) node[arrKey].push({});
      node = node[arrKey][idx];
    } else {
      if (!node[key] || typeof node[key] !== 'object') node[key] = {};
      node = node[key];
    }
  }
  node[parts[parts.length - 1]] = value;
}

// Get the effective current value for a field — overrides wins, falls
// back to the built-in. Used to pre-fill the editor inputs.
function paGetEffective(path) {
  // Path navigates both built-ins and overrides; overrides shadows.
  const o = paWalk(__paWorking, path);
  if (typeof o === 'number') return o;
  return paWalk({ rules: __builtInPricing, discounts: __builtInDiscounts }, path);
}

function paWalk(root, path) {
  if (!root) return undefined;
  const parts = path.split('.');
  let node = root;
  for (let i = 0; i < parts.length; i++) {
    if (node == null) return undefined;
    const key = parts[i];
    if (key.indexOf(':') >= 0) {
      const [arrKey, idxStr] = key.split(':');
      const idx = parseInt(idxStr, 10);
      node = (node[arrKey] || [])[idx];
    } else {
      node = node[key];
    }
  }
  return node;
}

function paField(path, step) {
  // Pricing settings are READ-ONLY in the UI. Rates live in the
  // PRICING constant in calculator.html — to change them, edit the
  // source and redeploy. The Wix-Data override layer is intentionally
  // disabled (it never reliably persisted through Wix Data v2 field-
  // stripping) but the helpers below stay in the source so we can
  // revive editable settings later if needed without a rewrite.
  const def      = paWalk({ rules: __builtInPricing, discounts: __builtInDiscounts }, path);
  const override = paWalk(__paWorking, path);
  const value    = typeof override === 'number' ? override : def;
  if (value == null || isNaN(value)) return `<span class="pa-readonly muted">—</span>`;
  // Format compactly: integers stay integer, decimals trim trailing
  // zeros but show at least 2 places when sub-dollar (so 0.10 stays
  // 0.10 not 0.1 — easier to scan as a percent/multiplier).
  const formatted = (Math.abs(value) < 1 && value !== 0)
    ? value.toFixed(2)
    : (Number.isInteger(value) ? String(value) : (+value.toFixed(2)).toString());
  return `<span class="pa-readonly" data-pa-path="${path}">${formatted}</span>`;
}

const PA_PROJECT_TYPES = [
  { id: 'fence',   label: 'Fence',   unit: 'per ln ft' },
  { id: 'deck',    label: 'Deck',    unit: 'per sq ft' },
  { id: 'pergola', label: 'Pergola', unit: 'per sq ft' },
  { id: 'barn',    label: 'Barn',    unit: 'per sq ft' },
  { id: 'ceiling', label: 'Ceiling', unit: 'per sq ft' }
];

function renderPricingAdminTab(tab) {
  if (tab === 'tiers') return renderPATiers();
  if (tab === 'prep')  return renderPAPrep();
  if (tab === 'extras') return renderPAExtras();
  if (tab === 'addons') return renderPAAddons();
  if (tab === 'discounts') return renderPADiscounts();
  if (tab === 'diy') return renderPADIY();
  if (tab === 'quote') return renderPAQuote();
  if (tab === 'reps') {
    // Bump the ticket so any in-flight loadAndRenderReps from a
    // previous tab render gets cancelled when its await resolves.
    // (Was clobbering the body when the user opened Settings → Reps
    // and an earlier render's fetch landed *after* this one.)
    __paAdminTicket++;
    setTimeout(loadAndRenderReps, 0);
    return '<div id="repsTabBody" data-ticket="' + __paAdminTicket + '" style="padding:8px 0;color:var(--slate);font-size:13px;">Loading reps…</div>';
  }
  if (tab === 'devices') {
    __paAdminTicket++;
    setTimeout(loadAndRenderDevices, 0);
    return '<div id="devicesTabBody" data-ticket="' + __paAdminTicket + '" style="padding:8px 0;color:var(--slate);font-size:13px;">Loading devices…</div>';
  }
  return '';
}

// Ticket counter — bumped every time a Reps/Devices tab is rendered.
// Each loader captures the ticket value at start; if the body's
// data-ticket no longer matches, the loader bails without writing
// (its target body has been replaced by a newer render).
var __paAdminTicket = 0;

// ---- Reps admin --------------------------------------------------
async function loadAndRenderReps() {
  const body = __doc.getElementById('repsTabBody');
  if (!body) { console.log('[SSS Admin] loadAndRenderReps: body missing, abort'); return; }
  const ticket = body.dataset.ticket;
  console.log('[SSS Admin] loadAndRenderReps starting, ticket=', ticket);
  try {
    const r = await authFetch('/_functions/authListReps');
    const data = await r.json();
    console.log('[SSS Admin] loadAndRenderReps response:', data);
    // Guard: if the body was replaced by a newer tab render, our
    // ticket no longer matches — bail before writing stale content
    // into a body that was just re-rendered.
    const liveBody = __doc.getElementById('repsTabBody');
    if (!liveBody || liveBody.dataset.ticket !== ticket) {
      console.log('[SSS Admin] loadAndRenderReps: ticket stale, skip write');
      return;
    }
    if (!data || !data.ok) {
      liveBody.innerHTML = `<div class="folder-empty" style="color:var(--coral);">Couldn't load reps: ${escapeHtml((data && data.error) || 'unknown')}</div>`;
      return;
    }
    const rows = (data.reps || []).map(rep => {
      const last = rep.lastSignInAt ? new Date(rep.lastSignInAt).toLocaleString() : 'never';
      return `
        <div class="rep-row" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;margin-bottom:6px;background:var(--paper);">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--navy);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">${escapeHtml((rep.initials || '?').toUpperCase().slice(0,2))}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;color:var(--navy);">${escapeHtml(rep.displayName || rep.initials)} <span style="font-size:11px;font-weight:500;color:var(--slate);text-transform:uppercase;">${escapeHtml(rep.role || 'rep')}</span></div>
            <div style="font-size:11px;color:var(--slate);">${escapeHtml(rep.initials)} · ${rep.email ? escapeHtml(rep.email) + ' · ' : ''}last sign-in: ${escapeHtml(last)}</div>
          </div>
          <button class="btn btn-secondary" style="padding:6px 10px;font-size:11px;" onclick="adminResetRepPin('${escapeHtml(rep._id)}','${escapeHtml(rep.initials)}')">🔑 Reset PIN</button>
          ${rep._id === (__currentRep && __currentRep._id) ? '' : `<button class="btn btn-ghost-danger" style="padding:6px 10px;font-size:11px;" onclick="adminDeleteRep('${escapeHtml(rep._id)}','${escapeHtml(rep.displayName || rep.initials)}')">Remove</button>`}
        </div>`;
    }).join('');
    liveBody.innerHTML = `
      <div style="margin-bottom:14px;font-size:12px;color:var(--slate);">${(data.reps || []).length} rep${(data.reps || []).length === 1 ? '' : 's'} configured. Reset a PIN any time; the rep's next sign-in uses the new one.</div>
      ${rows || '<div class="folder-empty">No reps yet.</div>'}
      <div style="margin-top:18px;padding:14px;border:1.5px dashed var(--line);border-radius:8px;">
        <h4 class="pa-section-title">Add a new rep</h4>
        <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div class="field"><label style="font-size:11px;">Initials</label><input type="text" id="newRepInitials" maxlength="6" placeholder="e.g. AG" autocapitalize="characters"></div>
          <div class="field"><label style="font-size:11px;">Display name</label><input type="text" id="newRepName" placeholder="e.g. Adrian Gluchowski"></div>
          <div class="field"><label style="font-size:11px;">Email <span style="color:var(--slate);font-weight:400;">(optional)</span></label><input type="email" id="newRepEmail" placeholder="rep@..."></div>
          <div class="field"><label style="font-size:11px;">PIN (4–8 digits)</label><input type="text" id="newRepPin" inputmode="numeric" pattern="[0-9]*" maxlength="8" placeholder="e.g. 4471"></div>
          <div class="field"><label style="font-size:11px;">Role</label><select id="newRepRole"><option value="rep">Rep</option><option value="admin">Admin</option></select></div>
        </div>
        <button class="btn btn-primary" style="margin-top:8px;" onclick="adminCreateRep()">＋ Add rep</button>
      </div>`;
  } catch (e) {
    const liveBodyErr = __doc.getElementById('repsTabBody');
    if (liveBodyErr) liveBodyErr.innerHTML = `<div class="folder-empty" style="color:var(--coral);">Couldn't load reps: ${escapeHtml(e.message || e)}</div>`;
  }
}

// Module-level in-flight guard. Even if the user double-clicks /
// hits Enter while a click is queued, we only fire one request.
// Without this, two requests would race; the first creates the rep
// and the second returns `initials_taken` (with the alert showing
// the second response). Sequential clicks (after one completes) are
// fine — the flag clears in the finally block.
var __adminCreateRepInFlight = false;
async function adminCreateRep() {
  if (__adminCreateRepInFlight) {
    console.log('[SSS Admin] adminCreateRep: already in flight, ignoring duplicate click');
    return;
  }
  const initials    = (__doc.getElementById('newRepInitials').value || '').trim();
  const displayName = (__doc.getElementById('newRepName').value || '').trim();
  const email       = (__doc.getElementById('newRepEmail').value || '').trim();
  const pin         = (__doc.getElementById('newRepPin').value || '').trim();
  const role        = (__doc.getElementById('newRepRole').value || 'rep');
  if (!initials || !pin) { alert('Initials and PIN are required.'); return; }
  if (!/^\d{4,8}$/.test(pin)) { alert('PIN must be 4–8 digits.'); return; }
  __adminCreateRepInFlight = true;
  // Find the submit button and disable it while we wait — gives the
  // rep visual feedback (and physically prevents double clicks even
  // if the in-flight flag somehow gets bypassed).
  const btn = __doc.querySelector('button[onclick="adminCreateRep()"]');
  const originalText = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Creating…'; }
  try {
    const r = await authFetch('/_functions/authCreateRep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initials, displayName, email, pin, role })
    });
    let data = null;
    let bodyText = '';
    try { bodyText = await r.clone().text(); } catch (e) {}
    try { data = await r.json(); } catch (e) {}
    console.log('[SSS Admin] adminCreateRep response:', { status: r.status, ok: r.ok, data, bodyPreview: bodyText.slice(0, 300) });
    if (data && data.ok) {
      // Reset form fields after success.
      try { __doc.getElementById('newRepInitials').value = ''; } catch (e) {}
      try { __doc.getElementById('newRepName').value = ''; } catch (e) {}
      try { __doc.getElementById('newRepEmail').value = ''; } catch (e) {}
      try { __doc.getElementById('newRepPin').value = ''; } catch (e) {}
      loadAndRenderReps();
    } else {
      const msg = (data && data.error)
        ? 'Failed to create rep: ' + data.error + (data.detail ? ' — ' + JSON.stringify(data.detail).slice(0, 200) : '') + ' (HTTP ' + r.status + ')'
        : 'Failed to create rep: HTTP ' + r.status + (bodyText ? ' — ' + bodyText.slice(0, 200) : '');
      alert(msg);
    }
  } finally {
    __adminCreateRepInFlight = false;
    if (btn) { btn.disabled = false; btn.textContent = originalText || '＋ Add rep'; }
  }
}

async function adminResetRepPin(repId, label) {
  const pin = prompt(`Set a new PIN for ${label}:`);
  if (!pin) return;
  if (!/^\d{4,8}$/.test(pin.trim())) { alert('PIN must be 4–8 digits.'); return; }
  const r = await authFetch('/_functions/authUpdateRepPin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repId, pin: pin.trim() })
  });
  const data = await r.json().catch(() => null);
  if (data && data.ok) alert('PIN reset for ' + label + '.');
  else alert('Failed to reset PIN: ' + ((data && data.error) || 'unknown'));
}

async function adminDeleteRep(repId, label) {
  if (!confirm(`Remove ${label}? Their devices will be revoked. This cannot be undone.`)) return;
  const r = await authFetch('/_functions/authDeleteRep', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repId })
  });
  const data = await r.json().catch(() => null);
  if (data && data.ok) loadAndRenderReps();
  else alert('Failed to delete: ' + ((data && data.error) || 'unknown'));
}

// ---- Devices admin -----------------------------------------------
// Hide revoked/expired sessions by default — they're rarely useful
// in the admin view. Toggle keeps them around for audit when needed.
var __adminDevicesShowAll = false;
async function loadAndRenderDevices() {
  const body = __doc.getElementById('devicesTabBody');
  if (!body) { console.log('[SSS Admin] loadAndRenderDevices: body missing, abort'); return; }
  const ticket = body.dataset.ticket;
  try {
    const r = await authFetch('/_functions/authListDevices');
    const data = await r.json();
    const liveBody = __doc.getElementById('devicesTabBody');
    if (!liveBody || liveBody.dataset.ticket !== ticket) {
      return;
    }
    if (!data || !data.ok) {
      liveBody.innerHTML = `<div class="folder-empty" style="color:var(--coral);">Couldn't load devices: ${escapeHtml((data && data.error) || 'unknown')}</div>`;
      return;
    }
    // Classify each device — active sessions are the only ones the
    // admin cares about most of the time. Revoked/expired ones get
    // collapsed into a separate count + toggle.
    const allDevices = data.devices || [];
    const now = new Date();
    function isActive(d) {
      if (d.revoked) return false;
      if (d.expiresAt && new Date(d.expiresAt) < now) return false;
      return true;
    }
    const activeDevices  = allDevices.filter(isActive);
    const archivedCount  = allDevices.length - activeDevices.length;
    const showAll = !!__adminDevicesShowAll;
    const visibleDevices = showAll ? allDevices : activeDevices;

    function renderRow(d) {
      const last = d.lastUsedAt ? timeSince(new Date(d.lastUsedAt)) : '—';
      const exp  = d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : '—';
      const status = d.revoked
        ? '<span style="color:var(--coral);font-weight:700;font-size:11px;">REVOKED</span>'
        : (d.expiresAt && new Date(d.expiresAt) < now
          ? '<span style="color:#a66400;font-weight:700;font-size:11px;">EXPIRED</span>'
          : '<span style="color:#1f4d36;font-weight:700;font-size:11px;">ACTIVE</span>');
      const label = d.label || '(no label)';
      // For revoked rows, show how many days remain before auto-delete.
      // Backend stamps revokedAt; rows older than 7 days are purged on
      // the next admin visit, so the countdown actually means something.
      let purgeNote = '';
      if (d.revoked) {
        const revokedTs = d.revokedAt ? Date.parse(d.revokedAt) : NaN;
        if (isFinite(revokedTs)) {
          const msLeft = (revokedTs + 7 * 24 * 60 * 60 * 1000) - Date.now();
          const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
          purgeNote = ` · auto-deletes in ${daysLeft}d`;
        } else {
          purgeNote = ' · auto-deletes within 7d';
        }
      }
      return `
        <div class="rep-row" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;margin-bottom:6px;background:var(--paper);">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;color:var(--navy);font-size:13px;">${escapeHtml(label)} <span style="font-size:10px;font-weight:500;color:var(--slate);">${escapeHtml((d.repInitials || '?').toUpperCase())}</span></div>
            <div style="font-size:11px;color:var(--slate);">${status} · last used ${escapeHtml(last)} · expires ${escapeHtml(exp)}${purgeNote}</div>
          </div>
          ${d.revoked ? '' : `<button class="btn btn-ghost-danger" style="padding:6px 10px;font-size:11px;" onclick="adminRevokeDevice('${escapeHtml(d._id)}','${escapeHtml(label)}')">Revoke</button>`}
        </div>`;
    }
    const rows = visibleDevices.map(renderRow).join('');

    const revokeAllBtn = activeDevices.length > 1
      ? `<button class="btn btn-ghost-danger" style="padding:6px 12px;font-size:12px;" onclick="adminRevokeAllDevices()">🚪 Revoke all (${activeDevices.length})</button>`
      : '';
    const toggleBtn = archivedCount > 0
      ? `<button class="btn btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="toggleAdminDevicesShowAll()">${showAll ? 'Hide' : 'Show'} ${archivedCount} revoked/expired</button>`
      : '';
    liveBody.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
        <div style="font-size:12px;color:var(--slate);flex:1;min-width:200px;">${activeDevices.length} active session${activeDevices.length === 1 ? '' : 's'}${archivedCount > 0 ? ` · ${archivedCount} revoked/expired hidden` : ''}.</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${toggleBtn}
          ${revokeAllBtn}
        </div>
      </div>
      ${rows || '<div class="folder-empty">No active devices.</div>'}`;
  } catch (e) {
    const liveBodyErr = __doc.getElementById('devicesTabBody');
    if (liveBodyErr) liveBodyErr.innerHTML = `<div class="folder-empty" style="color:var(--coral);">Couldn't load devices: ${escapeHtml(e.message || e)}</div>`;
  }
}

async function adminRevokeDevice(deviceId, label) {
  if (!confirm(`Revoke "${label}"? The rep will be signed out on this device.`)) return;
  const r = await authFetch('/_functions/authRevokeDevice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId })
  });
  const data = await r.json().catch(() => null);
  if (data && data.ok) loadAndRenderDevices();
  else alert('Failed to revoke: ' + ((data && data.error) || 'unknown'));
}

function toggleAdminDevicesShowAll() {
  __adminDevicesShowAll = !__adminDevicesShowAll;
  // Force a re-load so the body re-renders with the new filter state.
  // (Setting innerHTML directly would leave the ticket guard in place
  // and the re-fetch wouldn't write back.)
  __paAdminTicket++;
  const body = __doc.getElementById('devicesTabBody');
  if (body) {
    body.dataset.ticket = String(__paAdminTicket);
    body.innerHTML = '<div style="padding:8px 0;color:var(--slate);font-size:13px;">Loading devices…</div>';
  }
  loadAndRenderDevices();
}

async function adminRevokeAllDevices() {
  if (!confirm('Revoke ALL active device sessions? Every signed-in rep (including you) will be sent back to the sign-in screen. Use this when you suspect a compromise or want a clean slate.')) return;
  // Fetch the current list and revoke each active one in parallel.
  const r = await authFetch('/_functions/authListDevices');
  const data = await r.json().catch(() => null);
  if (!data || !data.ok) { alert('Failed to load devices'); return; }
  const now = new Date();
  const active = (data.devices || []).filter(d => !d.revoked && !(d.expiresAt && new Date(d.expiresAt) < now));
  const results = await Promise.all(active.map(d =>
    authFetch('/_functions/authRevokeDevice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: d._id })
    }).then(rr => rr.json().catch(() => null))
  ));
  const okCount = results.filter(r => r && r.ok).length;
  alert(`Revoked ${okCount} of ${active.length} active device${active.length === 1 ? '' : 's'}.`);
  loadAndRenderDevices();
}

// Add-ons tab — edits the `rate` and (where applicable) `minCharge`
// for project add-ons and stain upgrades. Add-ons are nested deeper
// than tiers/prep in PRICING, so the path is
// `rules.projectAddons.<projectType>:<index>.rate` or
// `rules.stainUpgrades:<index>.rate`. The override system walks the
// path and patches only the leaf, so we don't have to ship the
// whole array — just the field that changed.
const PA_ADDON_FIELDS = {
  per_unit:       [{ key: 'rate', label: 'Rate ($ per unit)' }],
  per_unit_trim:  [{ key: 'rate', label: 'Rate ($ per unit)' }],
  each:           [{ key: 'rate', label: 'Rate ($ each)' }],
  each_lnft:      [{ key: 'rate', label: 'Rate ($ per ln ft)' }],
  flat:           [{ key: 'rate', label: 'Flat rate ($)' }],
  percent:        [{ key: 'rate', label: 'Rate (decimal, 0.40 = 40%)' }]
};

function paAddonRow(pathPrefix, addon, idx) {
  // Field type drives which numeric inputs we show. `min_charge`
  // exists on per_unit-style items (e.g., citronella has a $70 floor)
  // — we surface it as a second column when present.
  const fields = PA_ADDON_FIELDS[addon.priceType] || PA_ADDON_FIELDS.flat;
  const labelHtml = `
    <div class="pa-grid-label" style="grid-column: 1 / 2;">
      ${escapeHtml(addon.name || addon.id)}
      <br><small style="color:var(--slate);font-weight:500;">${escapeHtml(addon.priceType || '')}${typeof addon.minCharge === 'number' && addon.minCharge > 0 ? ' · min $' + addon.minCharge : ''}</small>
    </div>`;
  // Rate cell — uses paField against the project-specific path
  const rateCell = `<div>${paField(`${pathPrefix}:${idx}.rate`, '0.01')}</div>`;
  // Min-charge cell — only render when the base addon has one defined;
  // otherwise show a dash placeholder to keep grid alignment.
  const minChargeCell = (typeof addon.minCharge === 'number')
    ? `<div>${paField(`${pathPrefix}:${idx}.minCharge`, '1')}</div>`
    : `<div style="color:var(--line);text-align:right;padding:6px 0;">—</div>`;
  return labelHtml + rateCell + minChargeCell;
}

function renderPAAddons() {
  // Build a tabbed section per project type so the grid doesn't
  // become an unscannable wall of 50+ rows.
  const sections = [];

  // Stain upgrades first — apply to every project type
  const upgrades = (PRICING.stainUpgrades || []).map((addon, idx) =>
    paAddonRow('rules.stainUpgrades', addon, idx)
  ).join('');
  sections.push(`
    <h4 class="pa-section-title" style="margin-top:6px;">Stain upgrades (all projects)</h4>
    <div class="pa-grid" style="grid-template-columns: 1fr 120px 120px;">
      <div class="pa-grid-head">Add-on</div>
      <div class="pa-grid-head">Rate</div>
      <div class="pa-grid-head">Min charge</div>
      ${upgrades}
    </div>`);

  // Per-project add-ons
  PA_PROJECT_TYPES.forEach(proj => {
    const addons = (PRICING.projectAddons && PRICING.projectAddons[proj.id]) || [];
    if (addons.length === 0) return;
    const rows = addons.map((addon, idx) =>
      paAddonRow(`rules.projectAddons.${proj.id}`, addon, idx)
    ).join('');
    sections.push(`
      <h4 class="pa-section-title" style="margin-top:18px;">${escapeHtml(proj.label)} add-ons</h4>
      <div class="pa-grid" style="grid-template-columns: 1fr 120px 120px;">
        <div class="pa-grid-head">Add-on</div>
        <div class="pa-grid-head">Rate</div>
        <div class="pa-grid-head">Min charge</div>
        ${rows}
      </div>`);
  });

  return `
    <div class="pa-section">
      <p style="font-size:12px;color:var(--slate);margin:0 0 10px;">Tune per-unit / per-each / flat rates and minimum charges on every add-on. Add-on names and IDs stay code-defined — this is for adjusting their pricing only. Highlighted cells mean an override is active.</p>
      ${sections.join('')}
    </div>`;
}

function renderPATiers() {
  const rows = PA_PROJECT_TYPES.map(p => `
    <div class="pa-grid-label">${p.label} <small style="color:var(--slate);font-weight:500;">(${p.unit})</small></div>
    ${paField(`rules.${p.id}.tiers.essential`, '0.01')}
    ${paField(`rules.${p.id}.tiers.performance`, '0.01')}
    ${paField(`rules.${p.id}.tiers.showcase`, '0.01')}
  `).join('');
  return `
    <div class="pa-section">
      <h4 class="pa-section-title">Base tier rates</h4>
      <p style="font-size:12px;color:var(--slate);margin:0 0 10px;">These are the base dollars-per-unit before style multipliers, prep, addons, and discounts. Highlighted cells mean an override is active.</p>
      <div class="pa-grid">
        <div class="pa-grid-head">Project</div>
        <div class="pa-grid-head">Essential</div>
        <div class="pa-grid-head">Performance</div>
        <div class="pa-grid-head">Showcase</div>
        ${rows}
      </div>
    </div>`;
}

function renderPAPrep() {
  const rows = PA_PROJECT_TYPES.map(p => `
    <div class="pa-grid-label">${p.label} <small style="color:var(--slate);font-weight:500;">(${p.unit})</small></div>
    ${paField(`rules.${p.id}.prep.no_wash`, '0.01')}
    ${paField(`rules.${p.id}.prep.soft_wash`, '0.01')}
    ${paField(`rules.${p.id}.prep.strip_sand`, '0.01')}
  `).join('');
  return `
    <div class="pa-section">
      <h4 class="pa-section-title">Prep rates</h4>
      <p style="font-size:12px;color:var(--slate);margin:0 0 10px;">Added to the base tier rate per unit. No-wash is typically $0; soft wash and strip/sand add labor + chemistry.</p>
      <div class="pa-grid">
        <div class="pa-grid-head">Project</div>
        <div class="pa-grid-head">No wash</div>
        <div class="pa-grid-head">Soft wash</div>
        <div class="pa-grid-head">Strip / sand</div>
        ${rows}
      </div>
    </div>`;
}

function renderPADiscounts() {
  // Walk DISCOUNTS for rows with a numeric rate (skip the auto-applied
  // bundle entry — it's controlled separately on the Quote rules tab).
  const editable = DISCOUNTS.filter(d => typeof d.rate === 'number' && d.id !== 'bundle');
  const rows = editable.map(d => {
    // Index in DISCOUNTS for path-building (so paFinder hits the right
    // override slot).
    const idx = DISCOUNTS.indexOf(d);
    return `
      <div class="pa-grid-label" style="grid-column: 1 / 3;">${escapeHtml(d.label)}<br><small style="color:var(--slate);font-weight:500;">${escapeHtml(d.sub || '').slice(0, 80)}${(d.sub || '').length > 80 ? '…' : ''}</small></div>
      <div></div>
      <div data-discount-row="${idx}">${paField(`discounts:${idx}.rate`, '0.01')}<small style="display:block;margin-top:3px;color:var(--slate);font-size:10px;">Decimal — 0.05 = 5%</small></div>
    `;
  }).join('');
  return `
    <div class="pa-section">
      <h4 class="pa-section-title">Discount rates</h4>
      <p style="font-size:12px;color:var(--slate);margin:0 0 10px;">Each discount's % off, as a decimal (0.05 = 5%, 0.10 = 10%). The full discount catalog stays code-defined — this just tunes the rates.</p>
      <div class="pa-grid">
        <div class="pa-grid-head" style="grid-column: 1 / 3;">Discount</div>
        <div class="pa-grid-head"></div>
        <div class="pa-grid-head">Rate</div>
        ${rows}
      </div>
    </div>`;
}

// DIY-comparison knobs — retail pail prices, chemistry, tooling,
// hourly rate, and per-project time/tooling estimates. All read by
// computeDIYComparison() at the top of the function via PRICING.diy.
function renderPADIY() {
  const projects = PA_PROJECT_TYPES;
  const pailRows = ['water', 'oil'].map(fam => `
    <div class="pa-grid-label">${fam === 'water' ? 'Water-based stain' : 'Oil-based stain'}<br><small style="color:var(--slate);font-weight:500;">${fam === 'water' ? 'SW Woodscapes Solid / Rain Refresh' : 'EXPERT Stain & Seal / Log & Timber Oil'}</small></div>
    ${paField(`rules.diy.pail.${fam}.essential`, '1')}
    ${paField(`rules.diy.pail.${fam}.performance`, '1')}
    ${paField(`rules.diy.pail.${fam}.showcase`, '1')}
  `).join('');
  const toolsRows = projects.map(p => `
    <div class="pa-grid-label">${p.label}</div>
    ${paField(`rules.diy.projectTools.${p.id}`, '1')}
    ${paField(`rules.diy.projectTimeDivisor.${p.id}`, '1')}
  `).join('');
  return `
    <div class="pa-section">
      <h4 class="pa-section-title">5-gallon pail prices (homeowner retail)</h4>
      <p style="font-size:12px;color:var(--slate);margin:0 0 10px;">Non-contractor retail pricing — what a homeowner pays walking into the store. Showcase oil = EXPERT Log & Timber Oil ($450/5gal current).</p>
      <div class="pa-grid">
        <div class="pa-grid-head">Product family</div>
        <div class="pa-grid-head">Essential</div>
        <div class="pa-grid-head">Performance</div>
        <div class="pa-grid-head">Showcase</div>
        ${pailRows}
      </div>
    </div>
    <div class="pa-section">
      <h4 class="pa-section-title">Chemistry &amp; equipment</h4>
      <p style="font-size:12px;color:var(--slate);margin:0 0 10px;">Prep chemistry pails (one-time cost when soft wash or strip/sand prep is selected) and homeowner-grade equipment (amortized across the quote).</p>
      <div class="pa-grid" style="grid-template-columns: minmax(220px, 1fr) 120px;">
        <div class="pa-grid-head" style="text-align:left;">Item</div>
        <div class="pa-grid-head">Price ($)</div>
        <div class="pa-grid-label">EXPERT Natural Defense citronella (per 5gal stain)</div>
        ${paField('rules.diy.citronellaPerPail', '1')}
        <div class="pa-grid-label">Sodium metasilicate cleaner (5gal powder)</div>
        ${paField('rules.diy.sodiumMetasilicatePerPail', '1')}
        <div class="pa-grid-label">Oxalic acid brightener (5gal powder)</div>
        ${paField('rules.diy.oxalicAcidPerPail', '1')}
        <div class="pa-grid-label">Pressure washer (homeowner electric, one-time)</div>
        ${paField('rules.diy.pressureWasherCost', '1')}
        <div class="pa-grid-label">Graco-grade sprayer (when project needs spray)</div>
        ${paField('rules.diy.sprayerCost', '1')}
        <div class="pa-grid-label">DIY labor hourly rate ($/hr — homeowner&rsquo;s own time)</div>
        ${paField('rules.diy.hourlyLaborRate', '1')}
      </div>
    </div>
    <div class="pa-section">
      <h4 class="pa-section-title">Per-project tooling &amp; time</h4>
      <p style="font-size:12px;color:var(--slate);margin:0 0 10px;">Tooling = brushes/rollers/drop cloths/sheeting for that project type. Time divisor = sq ft (or lin ft for fence) per hour at a weekend-warrior pace — higher = faster work.</p>
      <div class="pa-grid" style="grid-template-columns: minmax(140px, 1fr) 140px 160px;">
        <div class="pa-grid-head" style="text-align:left;">Project</div>
        <div class="pa-grid-head">Tools ($)</div>
        <div class="pa-grid-head">Time divisor</div>
        ${toolsRows}
      </div>
    </div>`;
}

// Extras tab — per-project knobs that don't fit Tiers/Prep.
// Premiums, flat fees, and component rates that come into play
// on a per-project basis (T&G, beams, fixtures/fans, cupolas,
// trim, lift rental, height premium, deck component rates,
// fence style multipliers + one-sided factor, pergola overhead
// access flat). Everything routes through paField → __paWorking
// → savePricingRules so it persists.
function renderPAExtras() {
  return `
    <div class="pa-section">
      <h4 class="pa-section-title">Fence — style multipliers &amp; one-sided</h4>
      <p style="font-size:12px;color:var(--slate);margin:0 0 10px;">Multipliers on the base fence rate by style. One-sided factor applies when only one face is being stained.</p>
      <div class="pa-grid" style="grid-template-columns: minmax(180px, 1fr) 120px;">
        <div class="pa-grid-head" style="text-align:left;">Style / knob</div>
        <div class="pa-grid-head">Multiplier</div>
        <div class="pa-grid-label">Privacy</div>${paField('rules.fence.styleMultipliers.privacy', '0.01')}
        <div class="pa-grid-label">Charleston</div>${paField('rules.fence.styleMultipliers.charleston', '0.01')}
        <div class="pa-grid-label">Shadowbox</div>${paField('rules.fence.styleMultipliers.shadowbox', '0.01')}
        <div class="pa-grid-label">Board-on-board</div>${paField('rules.fence.styleMultipliers.bob', '0.01')}
        <div class="pa-grid-label">Charleston BOB</div>${paField('rules.fence.styleMultipliers.charleston_bob', '0.01')}
        <div class="pa-grid-label">Farm</div>${paField('rules.fence.styleMultipliers.farm', '0.01')}
        <div class="pa-grid-label">One-sided factor (multiplier on one-sided ln ft)</div>${paField('rules.fence.oneSidedFactor', '0.01')}
      </div>
    </div>
    <div class="pa-section">
      <h4 class="pa-section-title">Deck — component rates</h4>
      <p style="font-size:12px;color:var(--slate);margin:0 0 10px;">Component rates scale with the tier multiplier (derived from tier $/sq ft ÷ flat baseline). Lattice is flat regardless of tier. Underneath multiplier applies to the flat area when checked.</p>
      <div class="pa-grid" style="grid-template-columns: minmax(180px, 1fr) 120px;">
        <div class="pa-grid-head" style="text-align:left;">Knob</div>
        <div class="pa-grid-head">Value</div>
        <div class="pa-grid-label">Flat baseline ($/sq ft, sets tier multiplier divisor)</div>${paField('rules.deck.rates.flat', '0.01')}
        <div class="pa-grid-label">Railing ($/ln ft, scales with tier)</div>${paField('rules.deck.rates.railing', '0.01')}
        <div class="pa-grid-label">Stair ($/stair, scales with tier)</div>${paField('rules.deck.rates.stair', '0.01')}
        <div class="pa-grid-label">Lattice ($/sq ft, flat)</div>${paField('rules.deck.rates.lattice', '0.01')}
        <div class="pa-grid-label">Underneath area multiplier (×)</div>${paField('rules.deck.underneathMultiplier', '0.1')}
      </div>
    </div>
    <div class="pa-section">
      <h4 class="pa-section-title">Pergola</h4>
      <div class="pa-grid" style="grid-template-columns: minmax(180px, 1fr) 120px;">
        <div class="pa-grid-head" style="text-align:left;">Knob</div>
        <div class="pa-grid-head">Value ($)</div>
        <div class="pa-grid-label">Overhead access flat fee</div>${paField('rules.pergola.overheadAccessFlat', '1')}
      </div>
    </div>
    <div class="pa-section">
      <h4 class="pa-section-title">Barn</h4>
      <div class="pa-grid" style="grid-template-columns: minmax(180px, 1fr) 120px;">
        <div class="pa-grid-head" style="text-align:left;">Knob</div>
        <div class="pa-grid-head">Value</div>
        <div class="pa-grid-label">Height premium (× base) when 2+ stories</div>${paField('rules.barn.heightPremium', '0.01')}
        <div class="pa-grid-label">Lift rental ($/day, charged to job)</div>${paField('rules.barn.liftRentalPerDay', '1')}
        <div class="pa-grid-label">Trim rate ($/ln ft)</div>${paField('rules.barn.trimRate', '0.01')}
        <div class="pa-grid-label">Cupola flat ($/cupola)</div>${paField('rules.barn.cupolaFlat', '1')}
      </div>
    </div>
    <div class="pa-section">
      <h4 class="pa-section-title">Ceiling</h4>
      <div class="pa-grid" style="grid-template-columns: minmax(180px, 1fr) 120px;">
        <div class="pa-grid-head" style="text-align:left;">Knob</div>
        <div class="pa-grid-head">Value</div>
        <div class="pa-grid-label">T&amp;G premium ($/sq ft added when tongue-and-groove)</div>${paField('rules.ceiling.tngPremium', '0.01')}
        <div class="pa-grid-label">Beam rate ($/ln ft of beam)</div>${paField('rules.ceiling.beamRate', '0.01')}
        <div class="pa-grid-label">Fixture cover &amp; mask ($/fixture)</div>${paField('rules.ceiling.fixtureRemoval', '1')}
        <div class="pa-grid-label">Fan cover &amp; mask ($/fan)</div>${paField('rules.ceiling.fanRemoval', '1')}
        <div class="pa-grid-label">Furniture protection flat fee</div>${paField('rules.ceiling.furnitureProtFlat', '1')}
      </div>
    </div>`;
}

function renderPAQuote() {
  return `
    <div class="pa-section">
      <h4 class="pa-section-title">Quote-level rules</h4>
      <p style="font-size:12px;color:var(--slate);margin:0 0 10px;">Things that apply across the whole quote regardless of project type.</p>
      <div class="pa-grid">
        <div class="pa-grid-head" style="grid-column: 1 / 4;">Rule</div>
        <div class="pa-grid-head">Value</div>
        <div class="pa-grid-label" style="grid-column: 1 / 4;">Bundle discount<br><small style="color:var(--slate);font-weight:500;">Decimal — 0.10 = 10% off when 2+ projects on a quote.</small></div>
        ${paField('rules.bundleDiscount', '0.01')}
        <div class="pa-grid-label" style="grid-column: 1 / 4;">Minimum job<br><small style="color:var(--slate);font-weight:500;">Floor on the project total before discounts.</small></div>
        ${paField('rules.minimumJob', '1')}
      </div>
    </div>`;
}

async function savePricingAdmin() {
  paCaptureCurrentTab();
  if (!__paWorking) return;
  // Strip out fields whose value matches the built-in default. We
  // store only the deltas so the override doc stays small and a future
  // change to the code defaults still propagates through everywhere
  // the rep didn't explicitly override.
  const cleanRules = compactRulesOverride(__paWorking.rules);
  const cleanDiscounts = compactDiscountOverride(__paWorking.discounts);
  try {
    const res = await __sssBridge.call('savePricingRules', { rules: cleanRules, discounts: cleanDiscounts });
    if (!res || !res.ok) {
      paToast('Save failed: ' + ((res && res.error) || 'unknown error'));
      return;
    }
    __pricingOverrides = { rules: cleanRules, discounts: cleanDiscounts };
    __pricingMeta = { lastEditedBy: res.lastEditedBy || '', lastEditedAt: res.lastEditedAt || new Date().toISOString() };
    await applyPricingOverrides();   // re-merge so the live PRICING object is fresh
    paToast('Saved. Pricing now uses your new rates.');
    closePricingAdmin();
  } catch (e) {
    paToast('Save failed: ' + (e && e.message ? e.message : 'unknown error'));
  }
}

async function resetPricingAdmin() {
  if (!confirm('Wipe all pricing overrides and fall back to the built-in defaults? This affects every new quote going forward.')) return;
  try {
    const res = await __sssBridge.call('resetPricingRules');
    if (!res || !res.ok) {
      paToast('Reset failed: ' + ((res && res.error) || 'unknown error'));
      return;
    }
    __pricingOverrides = { rules: {}, discounts: [] };
    __pricingMeta = { lastEditedBy: '', lastEditedAt: null };
    await applyPricingOverrides();
    paToast('Reset complete. Calculator is back to code defaults.');
    closePricingAdmin();
  } catch (e) {
    paToast('Reset failed: ' + (e && e.message ? e.message : 'unknown error'));
  }
}

// Recursively walk an override object and drop any leaf whose value
// equals the built-in default. Empty branches collapse to nothing.
// Handles both plain objects and arrays (for add-ons).
function compactRulesOverride(node, defaultsRoot, path) {
  if (!defaultsRoot) defaultsRoot = __builtInPricing;
  if (!path) path = [];
  if (node == null || typeof node !== 'object') return undefined;
  // Resolve the default at the current path so we can compare leaves.
  let def = defaultsRoot;
  for (let i = 0; i < path.length; i++) { if (def) def = def[path[i]]; }

  if (Array.isArray(node)) {
    // For arrays, walk each index. Empty slots are skipped; non-empty
    // slots become item-by-index patches. Only output the array if
    // at least one index has a real override.
    const arr = [];
    let anySet = false;
    for (let i = 0; i < node.length; i++) {
      const v = node[i];
      const defVal = def && def[i];
      if (v == null) { arr.push(null); continue; }
      if (typeof v === 'object') {
        const sub = compactRulesOverride(v, defaultsRoot, path.concat([i]));
        if (sub && (Array.isArray(sub) ? sub.some(x => x != null) : Object.keys(sub).length > 0)) {
          arr.push(sub); anySet = true;
        } else {
          arr.push(null);
        }
      } else if (typeof v === 'number') {
        if (v !== defVal) { arr.push(v); anySet = true; }
        else arr.push(null);
      } else {
        arr.push(null);
      }
    }
    return anySet ? arr : undefined;
  }

  // Plain-object branch
  const out = {};
  Object.keys(node).forEach(k => {
    const v = node[k];
    const defChild = def ? def[k] : undefined;
    if (v != null && typeof v === 'object') {
      const sub = compactRulesOverride(v, defaultsRoot, path.concat([k]));
      if (sub != null) {
        if (Array.isArray(sub)) { if (sub.some(x => x != null)) out[k] = sub; }
        else if (Object.keys(sub).length > 0) out[k] = sub;
      }
    } else if (typeof v === 'number') {
      if (v !== defChild) out[k] = v;
    }
  });
  return out;
}

function compactDiscountOverride(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(p => {
      if (!p || !p.id || typeof p.rate !== 'number') return null;
      const built = (__builtInDiscounts || []).find(d => d.id === p.id);
      if (built && built.rate === p.rate) return null;
      return { id: p.id, rate: p.rate };
    })
    .filter(Boolean);
}

function paToast(msg) {
  let t = __doc.getElementById('paToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'paToast';
    t.className = 'pa-toast';
    __doc.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => { t.classList.remove('show'); }, 2400);
}

function onFolderToggle(folder, event) {
  // Capture the new open state ourselves so we can restore it on re-render.
  const det = event.target.closest('details');
  // Toggle happens after click — defer state read.
  setTimeout(() => { dashState.folders[folder] = !!det.open; }, 0);
}

function onDashSearchInput(rawVal) {
  // Called from the input's `oninput` handler (wired below) — debounced
  // so we don't re-render on every keystroke.
  dashState.search = rawVal || '';
  clearTimeout(dashState.searchTimer);
  dashState.searchTimer = setTimeout(renderDashboard, 180);
}

// ---- Row actions (cloud-backed) ------------------------------

let __openRowMenu = null;

function closeRowMenu() {
  if (__openRowMenu) { __openRowMenu.remove(); __openRowMenu = null; }
}

function openRowMenu(ev, rowId, folder, isLocal, quoteId) {
  ev.stopPropagation();
  closeRowMenu();
  const items = [];
  if (isLocal) {
    items.push({ label: 'Resume', fn: () => resumeLocalDraft(quoteId) });
    items.push({ label: 'Delete from device', fn: () => deleteLocalDraft(quoteId), danger: true });
  } else if (folder === 'draft') {
    items.push({ label: 'Resume',           fn: () => resumeCloudQuote(rowId) });
    items.push({ label: 'Duplicate',        fn: () => duplicateCloudQuote(rowId) });
    items.push({ label: 'Archive',          fn: () => moveCloudQuote(rowId, 'archived') });
    items.push({ label: 'Move to Trash',    fn: () => moveCloudQuote(rowId, 'trashed'), danger: true });
  } else if (folder === 'finished') {
    items.push({ label: 'View / Duplicate', fn: () => duplicateCloudQuote(rowId) });
    items.push({ label: 'Reopen as draft',  fn: () => moveCloudQuote(rowId, 'draft') });
    items.push({ label: 'Archive',          fn: () => moveCloudQuote(rowId, 'archived') });
    items.push({ label: 'Move to Trash',    fn: () => moveCloudQuote(rowId, 'trashed'), danger: true });
  } else if (folder === 'archived') {
    items.push({ label: 'Restore to Drafts',   fn: () => moveCloudQuote(rowId, 'draft') });
    items.push({ label: 'Restore to Finished', fn: () => moveCloudQuote(rowId, 'finished') });
    items.push({ label: 'Move to Trash',       fn: () => moveCloudQuote(rowId, 'trashed'), danger: true });
  } else if (folder === 'trashed') {
    items.push({ label: 'Restore to Drafts', fn: () => moveCloudQuote(rowId, 'draft') });
    items.push({ label: 'Delete permanently', fn: () => permanentlyDeleteCloud(rowId), danger: true });
  }

  const menu = document.createElement('div');
  menu.className = 'row-menu';
  items.forEach((it, i) => {
    if (it === '---') { menu.appendChild(Object.assign(document.createElement('hr'), {})); return; }
    const b = document.createElement('button');
    b.textContent = it.label;
    if (it.danger) b.className = 'danger';
    b.onclick = (e) => { e.stopPropagation(); closeRowMenu(); it.fn(); };
    menu.appendChild(b);
  });

  // Position near the click. We attach to the shadow root so coords stay local.
  const rect = ev.target.getBoundingClientRect();
  menu.style.top = (window.scrollY + rect.bottom + 6) + 'px';
  menu.style.left = Math.max(8, rect.right - 180) + 'px';
  __doc.appendChild(menu);
  __openRowMenu = menu;
}

function resumeCloudQuote(rowId) {
  if (typeof __sssBridge === 'undefined') return;
  __sssBridge.call('getQuote', { quoteRowId: rowId }).then(res => {
    if (!res || !res.ok || !res.quote) {
      alert('Could not load that quote — please try again.');
      return;
    }
    hydrateStateFromCloud(res.quote);
    const status = res.quote.status || 'draft';
    __doc.getElementById('stage-dashboard').classList.remove('visible');

    // Finished / archived / trashed quotes are read-only — sending locks
    // the quote and we don't want concurrent edits silently overwriting
    // each other, or the rep dragging the breakdown into an unsupported
    // state. Show the dedicated summary view instead. Reps can still
    // duplicate to make an editable copy.
    if (status !== 'draft') {
      renderViewMode(res.quote);
      __doc.getElementById('stage-view').classList.add('visible');
      refreshProgressBarVisibility();
      scrollAppToTop();
      return;
    }

    // Resume at the actual step the rep was on, not blindly at step 10.
    // Guards: if state was corrupted and currentStage is past max, clamp.
    const target = Math.max(1, Math.min(state.currentStage || state.maxStageReached || 1, state.maxStageReached || 10));
    showStage(target);
    updateRunningTotal();
    setTimeout(() => {
      try {
        if (typeof renderSidePanel === 'function') renderSidePanel();
        if (typeof renderFinalBreakdown === 'function' && target >= 10) {
          renderFinalBreakdown();
        }
        const tab = __doc.getElementById('sideTrackerTab');
        if (tab && (state.activeProject.type || state.bundledProjects.length > 0)) {
          tab.classList.add('visible');
          tab.classList.remove('hidden-while-open');
        }
      } catch (e) { /* non-fatal */ }
    }, 0);
  });
}

// Render the read-only summary view from a cloud quote row. Pulls
// straight from the server response so it never depends on
// state.activeProject._cached being populated (which is the path
// that was breaking when finished quotes were opened into the
// editable review and computeAllTotals saw incomplete state).
function renderViewMode(q) {
  const status = q.status || 'draft';
  const labelMap = { finished: 'FINISHED QUOTE', archived: 'ARCHIVED QUOTE', trashed: 'TRASHED QUOTE', draft: 'DRAFT' };
  const titleLabel = __doc.getElementById('stageViewLabel');
  const titleEl    = __doc.getElementById('stageViewTitle');
  const leadEl     = __doc.getElementById('stageViewLead');
  if (titleLabel) titleLabel.textContent = labelMap[status] || 'QUOTE';

  const PROJECT_LABELS = { fence: 'Fence', deck: 'Deck', pergola: 'Pergola', barn: 'Barn', ceiling: 'Ceiling' };
  const TIER_LABELS = { essential: 'Essential', performance: 'Performance', showcase: 'Showcase' };

  const cust = q.customer || {};
  const projects = Array.isArray(q.projects) ? q.projects : [];
  const totals = q.totals || {};
  const finalTotal = Number(q.finalTotal) || Number(totals.final) || 0;

  if (titleEl) {
    const name = cust.name || '(unnamed customer)';
    titleEl.innerHTML = `${escapeHtml(name)}<span class="view-status-pill ${status}">${labelMap[status] || 'Quote'}</span>`;
  }
  if (leadEl) {
    const dateLabel = q.dateFinished ? `Sent ${new Date(q.dateFinished).toLocaleDateString()}` :
                     q.dateArchived ? `Archived ${new Date(q.dateArchived).toLocaleDateString()}` :
                     q.dateTrashed  ? `Trashed ${new Date(q.dateTrashed).toLocaleDateString()}` : '';
    leadEl.textContent = `${dateLabel ? dateLabel + ' · ' : ''}This quote is read-only. Duplicate it to make an editable copy.`;
  }

  const summaryEl = __doc.getElementById('viewSummary');
  if (!summaryEl) return;

  const renderProjectRow = (p) => {
    if (!p || !p.type) return '';
    const label = PROJECT_LABELS[p.type] || p.type;
    const tier  = TIER_LABELS[p.tier] || p.tier || '';
    const product = p.productType === 'water' ? 'Water-based' : p.productType === 'oil' ? 'Oil-based' : (p.productType || '');
    const color = p.selectedColor && p.selectedColor.name ? p.selectedColor.name : (p.selectedColor || '');
    const m = p.measurements || {};
    let scopeStr = '';
    if (p.type === 'fence' && m.linearft) scopeStr = `${m.linearft} ln ft × ${m.height || 0} ft`;
    else if (p.type === 'deck')          scopeStr = `${(m.flat || 0)} sq ft flat${m.rail ? `, ${m.rail} ln ft railing` : ''}`;
    else if (m.sqft)                      scopeStr = `${m.sqft} sq ft`;
    else if (m.length && m.width)         scopeStr = `${m.length}' × ${m.width}'`;

    return `
      <div class="vs-proj">
        <div class="vs-proj-head">
          <span>${escapeHtml(label)}</span>
        </div>
        <div class="vs-proj-meta">
          ${tier ? `${escapeHtml(tier)} tier · ` : ''}${escapeHtml(product)}${color ? ` · ${escapeHtml(color)}` : ''}${scopeStr ? ` · ${escapeHtml(scopeStr)}` : ''}
        </div>
      </div>`;
  };

  // Jobber status block — shows whether this quote has been pushed,
  // and provides a re-send button. For trashed/archived quotes we
  // surface this too so a rep can recover a never-pushed quote.
  const jobberPushed = !!q.jobberQuoteId;
  const jobberStatusText = q.jobberStatus || (jobberPushed ? 'created' : 'not_pushed');
  const jobberFailed = jobberStatusText.indexOf('push_failed') === 0;
  const rowId = q._id;

  // Display Jobber's human-readable quote number if we have it; fall
  // back to the opaque ID otherwise.
  const jobberLabel = q.jobberQuoteNumber
    ? `Quote #${q.jobberQuoteNumber}`
    : q.jobberQuoteId;
  const openLink = q.jobberWebUri
    ? `<a href="${escapeHtml(q.jobberWebUri)}" target="_blank" rel="noopener" class="btn btn-primary vs-jobber-btn" style="text-decoration:none;display:inline-flex;align-items:center;">↗ Open in Jobber</a>`
    : '';

  const jobberBlockHtml = `
    <h3>Jobber</h3>
    <div class="vs-jobber ${jobberPushed ? 'success' : jobberFailed ? 'error' : 'pending'}">
      <div class="vs-jobber-status">
        ${jobberPushed ? `<span class="ico">✓</span><span><strong>Pushed to Jobber</strong>${jobberLabel ? ` · <span style="font-family:ui-monospace,monospace;font-size:12px;">${escapeHtml(jobberLabel)}</span>` : ''}</span>`
          : jobberFailed ? `<span class="ico">⚠️</span><span><strong>Push failed</strong> — ${escapeHtml(jobberStatusText.replace('push_failed:', ''))}</span>`
          : `<span class="ico">○</span><span>Not yet pushed to Jobber</span>`}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${openLink}
        <button class="btn btn-secondary vs-jobber-btn" onclick="resendViewedQuoteToJobber('${escapeHtml(rowId)}', ${jobberPushed})">
          🔄 ${jobberPushed ? 'Re-send to Jobber' : 'Push to Jobber'}
        </button>
      </div>
    </div>`;

  summaryEl.innerHTML = `
    <h3>Customer</h3>
    <div class="vs-row"><span class="lbl">Name</span><span class="val">${escapeHtml(cust.name || '—')}</span></div>
    ${cust.phone   ? `<div class="vs-row"><span class="lbl">Phone</span><span class="val">${escapeHtml(cust.phone)}</span></div>`   : ''}
    ${cust.email   ? `<div class="vs-row"><span class="lbl">Email</span><span class="val">${escapeHtml(cust.email)}</span></div>`   : ''}
    ${cust.address ? `<div class="vs-row"><span class="lbl">Address</span><span class="val">${escapeHtml(cust.address)}</span></div>` : ''}
    <div class="vs-row"><span class="lbl">Quote ID</span><span class="val">${escapeHtml(q.quoteId || '')}</span></div>
    ${q.employeeName ? `<div class="vs-row"><span class="lbl">Quoting employee</span><span class="val">${escapeHtml(q.employeeName)}</span></div>` : ''}
    ${q.jobberJobNum ? `<div class="vs-row"><span class="lbl">Jobber job #</span><span class="val">${escapeHtml(q.jobberJobNum)}</span></div>` : ''}

    <h3>Projects (${projects.length})</h3>
    ${projects.map(renderProjectRow).join('') || '<div class="vs-row"><span class="lbl">No projects on this quote.</span></div>'}

    ${q.paymentMethod ? `<h3>Payment</h3><div class="vs-row"><span class="lbl">Method</span><span class="val">${escapeHtml(q.paymentMethod === 'wisetack' ? 'Wisetack financing' : '25% deposit + balance')}</span></div>` : ''}
    ${q.notes ? `<h3>Notes</h3><div class="vs-row" style="display:block;"><span style="white-space:pre-wrap;">${escapeHtml(q.notes)}</span></div>` : ''}

    ${jobberBlockHtml}

    <div class="vs-total">
      <span class="lbl">Grand Total</span>
      <span class="val">${fmtMoney(finalTotal)}</span>
    </div>
  `;
}

// Wrapper for the prominent action-row button on the read-only view.
// Re-resolves rowId + alreadyPushed from state.cloudRowId / last loaded
// quote so the inline onclick doesn't need them passed in.
function resendCurrentViewedToJobber() {
  if (!state.cloudRowId) {
    alert('No quote loaded.');
    return;
  }
  // We don't know `alreadyPushed` here without a fetch — assume yes
  // (the safer default; user sees the confirm prompt about duplicate).
  resendViewedQuoteToJobber(state.cloudRowId, true);
}

// Re-send a viewed (finished/archived/trashed) quote to Jobber from
// the read-only summary view. Refetches the quote afterward so the
// status block updates with the new Jobber ID.
async function resendViewedQuoteToJobber(rowId, alreadyPushed) {
  if (!rowId) return;
  const msg = alreadyPushed
    ? 'Re-send this quote to Jobber? This creates a fresh quote in Jobber — the previous one stays there until you delete it manually.'
    : 'Push this quote to Jobber now?';
  if (!confirm(msg)) return;

  const summaryEl = __doc.getElementById('viewSummary');
  const existingBlock = summaryEl && summaryEl.querySelector('.vs-jobber');
  if (existingBlock) {
    existingBlock.innerHTML = '<div class="vs-jobber-status"><span class="ico">⏳</span><span>Sending to Jobber…</span></div>';
    existingBlock.className = 'vs-jobber pending';
  }

  try {
    // CRITICAL: refresh the cloud row with the CURRENT hydrated state
    // before pushing. Old rows (saved before the subtotal-stamping
    // fix) don't have line item prices on the projects[] JSON, which
    // is why Jobber was getting $0. Now we re-run buildCloudPayload
    // (which computes _cached and includes subtotal at the project
    // level) and patch the row so the backend's pushQuote has real
    // prices to read.
    if (typeof buildCloudPayload === 'function') {
      try {
        const refreshed = buildCloudPayload();
        if (refreshed && typeof __sssBridge !== 'undefined') {
          await __sssBridge.call('updateQuote', { quoteRowId: rowId, patch: refreshed });
        }
      } catch (e) { console.warn('[SSS] pre-push row refresh failed (non-fatal):', e); }
    }

    const r = await fetch('/_functions/pushToJobber', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteRowId: rowId, force: !!alreadyPushed })
    });
    const data = await r.json();
    if (!data || !data.ok) {
      console.error('[Jobber push] full response:', data);
      window.__lastJobberPushResponse = data;
      const err = (data && data.error) || 'unknown';
      const detail = data && data.detail ? '\n\nDetail:\n' + JSON.stringify(data.detail, null, 2) : '';
      const input = data && data.input ? '\n\nSent:\n' + JSON.stringify(data.input, null, 2) : '';
      alert('Jobber push failed: ' + err + detail + input + '\n\n(Full response also available at window.__lastJobberPushResponse — open the success screen on a fresh attempt to use the Copy Error button.)');
    }
    // Refresh the view from the (now-updated) cloud row so the block reflects reality.
    const fetched = await __sssBridge.call('getQuote', { quoteRowId: rowId });
    if (fetched && fetched.ok && fetched.quote) renderViewMode(fetched.quote);
  } catch (e) {
    alert('Network error pushing to Jobber: ' + e.message);
  }
}

// Duplicate the currently-loaded read-only quote and immediately open
// the new draft for editing.
function duplicateCurrentForEdit() {
  if (!state.cloudRowId || typeof __sssBridge === 'undefined') {
    alert('Cannot duplicate — no quote loaded.');
    return;
  }
  __sssBridge.call('duplicateQuote', { quoteRowId: state.cloudRowId }).then(res => {
    if (!res || !res.ok || !res.quote) {
      alert('Duplicate failed — please try again.');
      return;
    }
    // Open the newly-created draft as an editable quote.
    resumeCloudQuote(res.quote._id);
  });
}

// Recompute and stamp a `_cached` block onto every project that the
// totals math relies on (active + bundled). Without this, projects
// rehydrated from the cloud have no `_cached`, so computeAllTotals
// falls back to all-zeros for them — meaning prep, tier base, add-ons,
// and per-project discounts on bundled projects all silently
// contribute $0 to the running total. The symptom is "I picked soft
// wash but the total didn't change."
//
// Uses the existing single-project compute by temporarily swapping
// each project into `state.activeProject`, the same trick
// `computeSampleTierPrices` already uses inside the active-tier render.
function refreshAllProjectCaches() {
  if (!state || !state.activeProject) return;
  const restore = state.activeProject;
  // Bundled projects: pop each into active, compute, stamp.
  (state.bundledProjects || []).forEach(p => {
    if (!p || !p.type) return;
    state.activeProject = { ...p, tierConfirmed: true };
    try { p._cached = computeProjectTotal(); } catch (e) { /* keep stale cache rather than zeroing */ }
  });
  // Active project: restore reference then stamp.
  state.activeProject = restore;
  if (restore && restore.type) {
    try { restore._cached = computeProjectTotal(); } catch (e) { /* non-fatal */ }
  }
}

function hydrateStateFromCloud(q) {
  // Rehydrate the calc state from a cloud row's structured projects +
  // customer. Restore both legacy single-field values AND the structured
  // fields (Jobber-style). Old drafts have only name/address; newer
  // drafts have structured fields too. Either way, both shapes are
  // populated so display, edit, and Jobber push all just work.
  const qc = q.customer || {};
  state.customer = {
    name:        qc.name        || '',
    phone:       qc.phone       || '',
    email:       qc.email       || '',
    address:     qc.address     || '',
    firstName:   qc.firstName   || '',
    lastName:    qc.lastName    || '',
    companyName: qc.companyName || '',
    street1:     qc.street1     || '',
    street2:     qc.street2     || '',
    city:        qc.city        || '',
    province:    qc.province    || '',
    postalCode:  qc.postalCode  || '',
    jobberClientId:   qc.jobberClientId   || '',
    jobberPropertyId: qc.jobberPropertyId || '',
    jobberNum: '',
    employee: q.employeeName || ''
  };
  state.bundledProjects = [];
  state.activeProject = makeBlankProject();
  state.editingBundleIdx = null;
  const projs = Array.isArray(q.projects) ? q.projects : [];
  if (projs.length > 0) {
    // First project becomes activeProject so the rep can keep editing;
    // the rest are bundled.
    const first = projs[0];
    state.activeProject = {
      ...makeBlankProject(),
      ...first,
      tierConfirmed: true
    };
    for (let i = 1; i < projs.length; i++) {
      state.bundledProjects.push({ ...makeBlankProject(), ...projs[i], tierConfirmed: true });
    }
  }
  state.paymentMethod = q.paymentMethod || 'deposit';
  state.notes = q.notes || '';
  state.quoteId = q.quoteId || makeQuoteId();
  state.cloudRowId = q._id;
  state.jobberRequestId = q.jobberRequestId || '';
  // Restore actual stage progress from the totals JSON (stamped on every
  // save). Falls back to step 1 if no project / step 10 only if the rep
  // had genuinely reached the review. Avoids the "empty breakdown" bug
  // caused by force-jumping every resume to step 10.
  const savedTotals = q.totals || {};
  const savedMax = Number(savedTotals._maxStageReached) || 0;
  const savedCur = Number(savedTotals._currentStage) || 0;
  if (savedMax > 0) {
    state.maxStageReached = savedMax;
    state.currentStage    = savedCur || savedMax;
  } else {
    state.maxStageReached = projs.length > 0 ? 2 : 1;
    state.currentStage    = state.maxStageReached;
  }

  // Hydrate form fields from customer state.
  ['custName','custPhone','custEmail','custAddress','jobberNum','employeeName'].forEach(id => {
    const map = { custName:'name', custPhone:'phone', custEmail:'email', custAddress:'address', jobberNum:'jobberNum', employeeName:'employee' };
    const el = __doc.getElementById(id);
    if (el) el.value = state.customer[map[id]] || '';
  });
  const ta = __doc.getElementById('quoteNotesField'); if (ta) ta.value = state.notes || '';
  const qn = __doc.getElementById('quoteNum'); if (qn) qn.textContent = state.quoteId;
  // Bundled projects come back from the cloud without `_cached`, which
  // means computeAllTotals treats them as $0 contributors and the
  // header Quote Total reads low (the symptom: "soft wash isn't in
  // the total"). Refresh caches now so the math is correct the moment
  // the rep resumes.
  refreshAllProjectCaches();
}

function moveCloudQuote(rowId, newStatus) {
  if (typeof __sssBridge === 'undefined') return;
  __sssBridge.call('setQuoteStatus', { quoteRowId: rowId, status: newStatus }).then(res => {
    if (!res || !res.ok) {
      alert('Move failed — please try again.');
      return;
    }
    dashState.loaded = false;  // force reload
    loadDashboardData().then(renderDashboard);
  });
}

function duplicateCloudQuote(rowId) {
  if (typeof __sssBridge === 'undefined') return;
  __sssBridge.call('duplicateQuote', { quoteRowId: rowId }).then(res => {
    if (!res || !res.ok) { alert('Duplicate failed.'); return; }
    dashState.loaded = false;
    loadDashboardData().then(renderDashboard);
  });
}

function permanentlyDeleteCloud(rowId) {
  if (!confirm('Permanently delete this quote? This cannot be undone.')) return;
  if (typeof __sssBridge === 'undefined') return;
  __sssBridge.call('permanentlyDelete', { quoteRowId: rowId }).then(res => {
    if (!res || !res.ok) { alert('Delete failed.'); return; }
    dashState.loaded = false;
    loadDashboardData().then(renderDashboard);
  });
}

// ---- Legacy local-draft handlers (still needed for offline drafts) ----

function resumeLocalDraft(quoteId) {
  const drafts = getDrafts();
  const idx = drafts.findIndex(d => d.quoteId === quoteId);
  if (idx >= 0) resumeDraft(idx);
}

function deleteLocalDraft(quoteId) {
  if (!confirm('Remove this draft from this device?')) return;
  const drafts = getDrafts();
  const idx = drafts.findIndex(d => d.quoteId === quoteId);
  if (idx < 0) return;
  drafts.splice(idx, 1);
  setDrafts(drafts);
  // Reload — the local draft was a "local only" entry, no cloud action needed.
  dashState.cache.draft = getDrafts().map(localDraftToView).concat(
    (dashState.cache.draft || []).filter(d => !d._localOnly)
  );
  renderDashboard();
}

// ---- Save-status pill ----------------------------------------

function setSavePill(state) {
  // state: 'saving' | 'saved' | 'failed' | 'hidden'
  const pill = __doc.getElementById('savePill');
  if (!pill) return;
  pill.classList.remove('saving', 'saved', 'failed', 'hidden');
  const label = pill.querySelector('.save-pill-text');
  if (state === 'hidden') { pill.classList.add('hidden'); return; }
  pill.classList.add(state);
  if (state === 'saving') label.textContent = 'Saving…';
  else if (state === 'saved')  label.textContent = 'Saved · just now';
  else if (state === 'failed') label.textContent = 'Save failed · retry';
}

// Periodically update the "Saved · Xs ago" text without re-rendering.
let __lastSavedAt = 0;
setInterval(() => {
  const pill = __doc.getElementById('savePill');
  if (!pill || !pill.classList.contains('saved') || !__lastSavedAt) return;
  const secs = Math.floor((Date.now() - __lastSavedAt) / 1000);
  const lbl = pill.querySelector('.save-pill-text');
  if (!lbl) return;
  if (secs < 5) lbl.textContent = 'Saved · just now';
  else if (secs < 60) lbl.textContent = `Saved · ${secs}s ago`;
  else lbl.textContent = `Saved · ${Math.floor(secs / 60)}m ago`;
}, 5000);

// Close any open row menu when clicking elsewhere
__doc.addEventListener('click', (e) => {
  if (!__openRowMenu) return;
  if (__openRowMenu.contains(e.target)) return;
  closeRowMenu();
});

function computeDraftTotal(s) {
  // Quick total estimate for dashboard display (without mutating state)
  const orig = JSON.parse(JSON.stringify(state));
  Object.assign(state, JSON.parse(JSON.stringify(s)));
  const totals = computeAllTotals();
  Object.assign(state, orig);
  return totals.finalTotal;
}

function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + ' min ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + ' hr ago';
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return days + ' days ago';
  return date.toLocaleDateString();
}

function startNewQuote() {
  // Hide dashboard, reset state, jump to Step 1
  __doc.getElementById('stage-dashboard').classList.remove('visible');
  // Reset state (keep employee if set previously)
  const employee = state.customer.employee || '';
  state.customer = {
    name: '', phone: '', email: '', address: '',
    firstName: '', lastName: '', companyName: '',
    street1: '', street2: '', city: '', province: '', postalCode: '',
    jobberClientId: '', jobberPropertyId: '',
    jobberNum: '', employee
  };
  state.activeProject = makeBlankProject();
  state.bundledProjects = [];
  state.editingBundleIdx = null;
  state.paymentMethod = 'deposit';
  state.notes = '';
  state.quoteId = makeQuoteId();
  state.cloudRowId = null;     // fresh quote — first auto-save will mint a new cloud row
  state.maxStageReached = 1;
  state.jobberRequestId = '';  // drop any Jobber-request linkage

  __doc.getElementById('quoteNum').textContent = state.quoteId;
  __doc.querySelectorAll('input').forEach(i => { if (i.type !== 'checkbox' && i.type !== 'radio') i.value = ''; });
  const empField = __doc.getElementById('employeeName');
  if (empField) empField.value = employee;
  const ta = __doc.getElementById('quoteNotesField'); if (ta) ta.value = '';
  showStage(1);
  updateRunningTotal();
}

function resumeDraft(idx) {
  const drafts = getDrafts();
  const d = drafts[idx];
  if (!d) return;
  // Restore state from snapshot
  Object.assign(state, d.state);
  if (typeof state.notes !== 'string') state.notes = '';
  // Older drafts (saved before cloud sync) may not have cloudRowId — that's
  // fine, the next auto-save will create a new cloud row for them.
  if (typeof state.cloudRowId === 'undefined') state.cloudRowId = d.cloudRowId || null;
  // Re-hydrate form fields from customer state
  ['custName','custPhone','custEmail','custAddress','jobberNum','employeeName'].forEach(id => {
    const map = { custName:'name', custPhone:'phone', custEmail:'email', custAddress:'address', jobberNum:'jobberNum', employeeName:'employee' };
    const el = __doc.getElementById(id);
    if (el) el.value = state.customer[map[id]] || '';
  });
  const ta = __doc.getElementById('quoteNotesField'); if (ta) ta.value = state.notes || '';
  __doc.getElementById('quoteNum').textContent = state.quoteId;
  __doc.getElementById('stage-dashboard').classList.remove('visible');
  showStage(d.stageReached || 1);
  updateRunningTotal();
}

function deleteDraft(idx) {
  if (!confirm('Delete this draft? It will move to the Trash folder (cloud) and clear locally.')) return;
  const drafts = getDrafts();
  const removed = drafts[idx];
  drafts.splice(idx, 1);
  setDrafts(drafts);
  // Soft-delete in the cloud so the dashboard can still show / restore it.
  if (removed && removed.cloudRowId && typeof __sssBridge !== 'undefined') {
    __sssBridge.call('setQuoteStatus', { quoteRowId: removed.cloudRowId, status: 'trashed' })
      .catch(e => console.warn('[SSS Cloud] trash failed:', e));
  }
  renderDashboard();
}

function clearAllDrafts() {
  if (!confirm('Delete ALL local drafts? Cloud copies move to the Trash folder.')) return;
  const drafts = getDrafts();
  // Move every cloud-backed local draft to trash in parallel.
  if (typeof __sssBridge !== 'undefined') {
    drafts.forEach(d => {
      if (d.cloudRowId) {
        __sssBridge.call('setQuoteStatus', { quoteRowId: d.cloudRowId, status: 'trashed' })
          .catch(e => console.warn('[SSS Cloud] trash failed:', e));
      }
    });
  }
  setDrafts([]);
  renderDashboard();
}

// Hook auto-save into the key state-changing function
const _origUpdateRunningTotal = updateRunningTotal;
updateRunningTotal = function() {
  // If compute throws for any reason, swallow it so auto-save still fires below
  try { _origUpdateRunningTotal.apply(this, arguments); }
  catch (err) { console.warn('[Calculator] updateRunningTotal threw:', err); }
  scheduleAutoSave();
};

/* ============================================================
   INIT
   ============================================================ */
// On load: show dashboard if any drafts exist OR start fresh
renderDashboard();
// (was: window.addEventListener for SSS_QUOTE_SAVED — not needed in Custom Element context)

/* ============================================================
   TAP-VS-DRAG GUARD — if the finger moves more than 8px between
   touchstart and touchend, suppress the synthesized click. This way
   when the user drags to scroll, they don't accidentally select a
   card they were scrolling past. Pure taps (no movement) still work.
   ============================================================ */
(function setupTapGuard() {
  let startX = 0, startY = 0, dragged = false;
  const THRESHOLD = 8;
  __doc.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) { dragged = false; return; }
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dragged = false;
  }, { capture: true, passive: true });
  __doc.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 1) return;
    const dx = Math.abs(e.touches[0].clientX - startX);
    const dy = Math.abs(e.touches[0].clientY - startY);
    if (dx > THRESHOLD || dy > THRESHOLD) dragged = true;
  }, { capture: true, passive: true });
  __doc.addEventListener('click', (e) => {
    if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; }
  }, { capture: true });
})();

/* ============================================================
   AUTO-RESIZE — reports content height to the parent so the Velo page
   can grow the HtmlComponent to fit, eliminating the internal iframe
   scrollbar. The parent listens for SSS_RESIZE and adjusts
   $w('#htmlCalculator').height where supported, or relies on Wix's
   own iframe scroll-passthrough where it isn't.
   ============================================================ */
let _lastReportedHeight = 0;
function reportContentHeight() {
  const h = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    document.documentElement.offsetHeight,
    document.body.offsetHeight
  ) + 24;
  if (Math.abs(h - _lastReportedHeight) < 8) return;
  _lastReportedHeight = h;
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'SSS_RESIZE', height: h }, '*');
    }
  } catch (err) {}
}
window.requestAnimationFrame(() => setTimeout(reportContentHeight, 50));
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(reportContentHeight).observe(document.body);
}
window.addEventListener('resize', reportContentHeight);
const _origShowStage = typeof showStage === 'function' ? showStage : null;
if (_origShowStage) {
  showStage = function() {
    _origShowStage.apply(this, arguments);
    setTimeout(reportContentHeight, 80);
    setTimeout(reportContentHeight, 350);
  };
}

/* ============================================================
   CUSTOMER-FACING JS — public build's submit + nav handlers
   ============================================================
   Three groups of functions:
     1. Navigation: intro ↔ Step 1, validate Step 1
     2. Submit: customerSubmitEstimate + customerRequestCallback
     3. Success-screen actions
   Routes into the existing showStage / state machine so the rest
   of the calculator (project flow, math, side-tracker, etc.) just
   works without modification.
   ============================================================ */

// Stamp customer mode on a global so any downstream check can know
// we're in the public build. Useful for skipping rep-only side
// effects like auto-save-to-cloud during navigation.
var IS_CUSTOMER_BUILD = true;

// Override the auth gate check — customers don't sign in. Replaces
// the auth-bootstrap function with a no-op so nothing tries to call
// /_functions/authStatus or render the auth gate.
function checkAuthAndGate() {
  // No-op for customer build.
  const gate = __doc.getElementById('authGate');
  if (gate) gate.style.display = 'none';
}

// Hide the rep "Recent Jobber Requests" panel + dashboard search.
// These functions may be referenced by legacy code paths; stub them
// so any stray call doesn't error.
function refreshDashboardHard() { /* no-op in customer build */ }
function renderDashboard() { /* no-op in customer build */ }
function onDashSearchInput() { /* no-op in customer build */ }
function loadDashboardData() { return Promise.resolve(); }
function attachCustomerSearchListeners() { /* no-op — search is rep-only */ }
function refreshJobberPill() { /* no-op — pill hidden in customer build */ }
function openJobberPanel() { /* no-op */ }
function setSavePill() { /* no-op — pill hidden */ }

// Customer "Start" button on intro → go to Step 1. Reveals the sticky
// floating bar (running estimate pill + help menu) which is hidden on
// the hero so the intro reads as a clean landing page.
function goToStage1FromIntro() {
  showStage(1);
  const bar = __doc.getElementById('custFloatingBar');
  if (bar) bar.style.display = 'flex';
  scrollAppToTop();
}

// Customer "Back" button on Step 1 → return to intro hero. Hides the
// floating bar again.
function goToIntroFromStage1() {
  __doc.querySelectorAll('.stage').forEach(s => s.classList.remove('visible'));
  const intro = __doc.getElementById('stage-intro');
  if (intro) intro.classList.add('visible');
  state.currentStage = 0;
  try { refreshProgressBarVisibility(); } catch (e) {}
  const bar = __doc.getElementById('custFloatingBar');
  if (bar) bar.style.display = 'none';
  const menu = __doc.getElementById('custHelpMenu');
  if (menu) menu.classList.remove('open');
  scrollAppToTop();
}

// Toggle the "Need help?" popover. Closes on outside click.
// Generic mobile collapse-toggle. Tap a `.cust-mc-toggle` button to
// toggle the `.expanded` class on the nearest ancestor that's marked
// with `data-mobile-collapse`. Stops propagation so the toggle inside
// a selectable card doesn't also trigger the card's selection handler.
function toggleMobileExpand(e) {
  if (!e) return;
  e.stopPropagation();
  e.preventDefault();
  const t = e.currentTarget || e.target;
  if (!t) return;
  const card = t.closest('[data-mobile-collapse]');
  if (card) card.classList.toggle('expanded');
}

function toggleCustHelpMenu() {
  const menu = __doc.getElementById('custHelpMenu');
  const backdrop = __doc.getElementById('custHelpBackdrop');
  if (!menu) return;
  const btn = __doc.getElementById('custHelpMenuBtn');
  const willOpen = !menu.classList.contains('open');
  menu.classList.toggle('open');
  if (backdrop) backdrop.classList.toggle('open', willOpen);
  if (willOpen) {
    // No per-open position calculation needed anymore — the CSS
    // @media block centers the menu in the viewport on mobile via
    // top:50% / transform translate. Desktop dropdown stays anchored
    // to the help-button container via .cust-floating-help being
    // position:relative.
    setTimeout(() => {
      const onDocClick = (ev) => {
        // Clicks inside menu OR on the button OR on the backdrop are
        // handled by their own onclick handlers. Anything ELSE closes.
        if (menu.contains(ev.target) || (btn && btn.contains(ev.target))) return;
        if (backdrop && backdrop.contains(ev.target)) return;
        menu.classList.remove('open');
        if (backdrop) backdrop.classList.remove('open');
        __doc.removeEventListener('click', onDocClick);
      };
      __doc.addEventListener('click', onDocClick);
    }, 0);
  }
}

// Copy the SSS phone number to clipboard. Falls back to a temp textarea
// for browsers without clipboard API support (some Wix iframe contexts
// gate clipboard access; the fallback keeps it working).
function custCopyPhoneNumber() {
  const menu = __doc.getElementById('custHelpMenu');
  const phone = (menu && menu.getAttribute('data-sss-phone')) || '';
  const formatted = (phone || '').replace(/^\+1/, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  const toCopy = formatted || phone;
  const confirm = __doc.getElementById('custCopyPhoneConfirm');
  function flashConfirm() {
    if (!confirm) return;
    confirm.classList.add('show');
    setTimeout(() => confirm.classList.remove('show'), 1600);
  }
  try {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(toCopy).then(flashConfirm).catch(() => {
        legacyCopy(toCopy); flashConfirm();
      });
    } else {
      legacyCopy(toCopy); flashConfirm();
    }
  } catch (e) { legacyCopy(toCopy); flashConfirm(); }
}
function legacyCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
    __doc.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
  } catch (e) {}
}

// Telemetry stub — could send to an analytics endpoint later. For now
// just logs so we can see in dev tools that the events fire.
function trackCustHelpAction(action) {
  try { console.log('[Customer] help action:', action); } catch (e) {}
}

function openCustHelpMenu() { toggleCustHelpMenu(); }

// Strict-validate Step 1 customer info and advance to Step 2 if OK.
// Required fields: name, phone, email, address. Honeypot must be empty.
function validateAndAdvanceFromStage1() {
  const nameEl    = __doc.getElementById('custName');
  const phoneEl   = __doc.getElementById('custPhone');
  const emailEl   = __doc.getElementById('custEmail');
  const addrEl    = __doc.getElementById('custAddress');
  const honeypot  = __doc.getElementById('custWebsiteHoneypot');

  // Honeypot — if a bot filled this, silently bail.
  if (honeypot && honeypot.value && honeypot.value.trim() !== '') {
    console.warn('[Customer] Honeypot tripped — silent reject.');
    return;
  }

  const name  = (nameEl  && nameEl.value  || '').trim();
  const phone = (phoneEl && phoneEl.value || '').trim();
  const email = (emailEl && emailEl.value || '').trim();
  const addr  = (addrEl  && addrEl.value  || '').trim();

  // Per-field error states. .err divs already exist in markup; we just
  // toggle the .invalid class on the field wrapper to show them.
  const invalids = [];
  if (!name) invalids.push(nameEl);
  if (!/^[\d\s().+\-]{7,}$/.test(phone)) invalids.push(phoneEl);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalids.push(emailEl);
  if (!addr || addr.length < 6) invalids.push(addrEl);

  __doc.querySelectorAll('#stage-1 .field.invalid').forEach(f => f.classList.remove('invalid'));
  if (invalids.length) {
    invalids.forEach(el => {
      const wrap = el && el.closest && el.closest('.field');
      if (wrap) wrap.classList.add('invalid');
    });
    if (invalids[0]) invalids[0].focus();
    return;
  }

  // Persist into state. firstName / lastName splits help with Jobber's
  // ClientCreateInput shape downstream.
  state.customer.name     = name;
  state.customer.phone    = phone;
  state.customer.email    = email;
  state.customer.address  = addr;
  const nameParts = name.split(/\s+/);
  state.customer.firstName = nameParts[0] || '';
  state.customer.lastName  = nameParts.slice(1).join(' ') || '';

  // Advance.
  showStage(2);
  scrollAppToTop();
}

// Customer submit handler — sends the completed estimate to the backend
// which creates a Jobber Request + Draft Quote and emails the customer.
// Shows in-flight status and surfaces errors clearly so the customer
// isn't left guessing.
async function customerSubmitEstimate() {
  await _doCustomerSubmit('estimate');
}

// Alternative path — customer wants a call before/instead of seeing the
// estimate emailed. Same backend, but flags the request so the Jobber
// title prefixes "[CALLBACK]" and the rep knows to phone first.
async function customerRequestCallback() {
  await _doCustomerSubmit('callback');
}

// In-flight guard — prevents the double-tap race where a customer
// taps the submit button twice before the first fetch finishes. The
// page-level flag is paired with a per-quoteId localStorage lock so a
// page-refresh-during-submit doesn't create a duplicate Jobber Request
// or duplicate CustomerSubmissions row.
let __custSubmitInFlight = false;
const CUST_SUBMITTED_KEY = 'sss_cust_submitted_quote_v1';

function __custAlreadySubmittedThisQuote() {
  try {
    const saved = localStorage.getItem(CUST_SUBMITTED_KEY);
    if (!saved) return false;
    const obj = JSON.parse(saved);
    return obj && obj.quoteId && obj.quoteId === state.quoteId;
  } catch (e) { return false; }
}
function __custMarkQuoteSubmitted(result) {
  try {
    localStorage.setItem(CUST_SUBMITTED_KEY, JSON.stringify({
      quoteId: state.quoteId,
      submittedAt: Date.now(),
      reference: (result && result.reference) || state.quoteId,
      clientHubUri: (result && result.clientHubUri) || ''
    }));
  } catch (e) {}
}

async function _doCustomerSubmit(mode) {
  const isCallback = mode === 'callback';
  const statusEl   = __doc.getElementById('custSubmitStatus');
  const submitBtn  = __doc.getElementById('custSubmitEstimateBtn');
  const callBtn    = __doc.getElementById('custCallbackBtn');

  // If we're on the success screen, the callback button there fires
  // this too — find a different status target if so.
  const successCallbackBtn = __doc.getElementById('custSuccessCallbackBtn');

  // GUARD: in-flight double-tap. Bail silently — the user already
  // tapped once; the first call will resolve and show status.
  if (__custSubmitInFlight) {
    console.log('[Customer] submit already in-flight; ignoring duplicate tap');
    return;
  }

  // GUARD: this quote has already been submitted from this browser.
  // Don't re-fire — just route them to the success screen with the
  // previously-returned link. Prevents CRM flooding from refresh /
  // back-button / "resume" flows.
  if (__custAlreadySubmittedThisQuote()) {
    try {
      const prev = JSON.parse(localStorage.getItem(CUST_SUBMITTED_KEY) || '{}');
      showCustomerSuccess({
        ok: true,
        reference:    prev.reference || state.quoteId,
        total:        Number((state.totals && state.totals.final) || 0),
        clientHubUri: prev.clientHubUri || '',
        jobberWebUri: '',
        submitMode:   isCallback ? 'callback' : 'estimate'
      }, isCallback);
    } catch (e) {
      alert('You\'ve already submitted this estimate. Check your email or text messages for the link, or call us at (864) 768-2582 if you didn\'t get it.');
    }
    return;
  }

  // If the customer hasn't been through Step 1, we don't have contact
  // info. Force them back to Step 1.
  if (!state.customer || !state.customer.name || !state.customer.email || !state.customer.phone) {
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.className = 'cust-submit-status error';
      statusEl.textContent = 'Please complete your contact details first.';
    } else {
      alert('Please complete your contact details first.');
    }
    showStage(1);
    return;
  }

  // Customer message (optional text from the textarea on Step 10) — copy
  // into state.notes so the Jobber payload picks it up via the existing
  // notes channel.
  const msgEl = __doc.getElementById('custMessageField');
  if (msgEl) state.notes = (msgEl.value || '').trim();

  // Lock UI during the submit.
  function setStatus(kind, html) {
    if (!statusEl) return;
    statusEl.style.display = 'block';
    statusEl.className = 'cust-submit-status ' + kind;
    statusEl.innerHTML = html;
  }
  // Swap button to a loading-state look (text + opacity + cursor) so
  // the customer can SEE the submit is processing — not just a dead
  // disabled button. Restored when the fetch finishes (success or fail).
  const ORIG_SUBMIT_LABEL = submitBtn ? submitBtn.innerHTML : '';
  function setLocked(locked) {
    if (submitBtn) {
      submitBtn.disabled = locked;
      if (locked) {
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = '<span class="cust-submit-spinner" aria-hidden="true"></span> Generating your estimate…';
      } else {
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = ORIG_SUBMIT_LABEL || 'See My Detailed Estimate →';
      }
    }
    if (callBtn)   callBtn.disabled   = locked;
    if (successCallbackBtn) successCallbackBtn.disabled = locked;
  }

  __custSubmitInFlight = true;
  setLocked(true);
  setStatus('pending', isCallback
    ? '<span>📞 Sending your callback request…</span>'
    : '<span>📨 Generating your estimate…</span>');

  // Build the submission payload — re-uses the cloud-payload builder
  // (totals, projects, customer block) and tacks on customer-mode flags.
  let basePayload;
  try {
    basePayload = buildCloudPayload();
    if (!basePayload) throw new Error('payload_empty');
  } catch (e) {
    setLocked(false);
    setStatus('error', '⚠ Something went wrong building your estimate. Please refresh and try again.');
    console.error('[Customer] buildCloudPayload failed:', e);
    return;
  }

  // Add customer-mode metadata so the backend can build the right
  // Jobber title (with "[CALLBACK]" prefix when requested) and the
  // right confirmation email copy.
  const submission = {
    ...basePayload,
    customerMode: true,
    submitMode: isCallback ? 'callback' : 'estimate',
    pageUrl: (typeof location !== 'undefined' && location.href) || '',
    referrer: (typeof document !== 'undefined' && document.referrer) || ''
  };

  // POST to the public submit endpoint.
  try {
    const resp = await fetch('/_functions/submitCustomerEstimate', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error('http_' + resp.status + (txt ? ': ' + txt.slice(0, 140) : ''));
    }
    const result = await resp.json();
    if (!result || !result.ok) {
      throw new Error((result && result.error) || 'submit_failed');
    }

    // Success — mark this quote as submitted so refresh/back-button can't
    // re-fire, clear the in-progress snapshot (no need to prompt for
    // resume on a completed quote), then show the success stage.
    __custMarkQuoteSubmitted(result);
    try { __custClearProgress(); } catch (e) {}
    __custSubmitInFlight = false;
    showCustomerSuccess(result, isCallback);
  } catch (e) {
    __custSubmitInFlight = false;
    setLocked(false);
    setStatus('error', '⚠ We couldn\'t send your request. Please try again, or text us at the number above.<br><small style="opacity:0.7;">Error: ' + (e && e.message ? escapeHtml(e.message) : 'unknown') + '</small>');
    console.error('[Customer] submit failed:', e);
  }
}

// Render the customer success stage with submission details and the
// secure Jobber Client Hub link the customer can open to view/approve/
// pay the deposit on the spot.
function showCustomerSuccess(result, isCallback) {
  const refEl     = __doc.getElementById('custSuccessRef');
  const totalEl   = __doc.getElementById('custSuccessTotal');
  const depositEl = __doc.getElementById('custSuccessDeposit');
  const headEl    = __doc.getElementById('custSuccessHeading');
  const leadEl    = __doc.getElementById('custSuccessLead');
  const portalBlock = __doc.getElementById('custSuccessPortalBlock');
  const portalLink  = __doc.getElementById('custSuccessPortalLink');

  if (refEl) refEl.textContent = (result && result.reference) || state.quoteId || '—';

  // Resolve the estimate total. The backend returns `total` directly,
  // but if it's somehow missing we fall back to the locally computed
  // running total — this was the dash-bug: we relied on `result.total`
  // alone and the payload field was nested under `totals.final`.
  let total = (result && Number(result.total)) || 0;
  if (!total) {
    try {
      const t = computeAllTotals();
      total = (t && Number(t.finalTotal)) || 0;
    } catch (e) {}
  }
  if (totalEl) totalEl.textContent = total > 0 ? '$' + Math.round(total).toLocaleString() : '—';
  if (depositEl) {
    const dep = total * 0.25;
    depositEl.textContent = total > 0 ? '$' + Math.round(dep).toLocaleString() + ' (25%)' : '—';
  }

  // Show the portal link when Jobber returned a clientHubUri (which
  // happens on every successful AWAITING_RESPONSE quote create). If
  // Jobber's push failed we hide the block — customer still got the
  // success screen, just without the immediate-approve path.
  const hubUri = result && (result.clientHubUri || result.jobberWebUri || '');
  if (portalBlock && portalLink) {
    if (hubUri) {
      portalLink.setAttribute('href', hubUri);
      portalBlock.style.display = 'block';
    } else {
      portalBlock.style.display = 'none';
    }
  }

  // Heading + lead copy. We removed the "1 business day" promise per
  // policy — instead frame it as "our team may reach out about your
  // quote" so we're not bound to an SLA we can't always meet.
  if (isCallback) {
    if (headEl) headEl.textContent = 'Thanks — we got your request.';
    if (leadEl) leadEl.innerHTML = "Our team may reach out about your quote. In the meantime, you can also call or text us using the buttons below.";
  } else {
    if (headEl) headEl.textContent = 'Your estimate is ready.';
    if (leadEl) leadEl.innerHTML = "Tap the button below to view your detailed estimate on your secure Jobber portal. From there you can review every line item — and approve &amp; place your deposit whenever you're ready. Our team may also reach out about your quote.";
  }

  // Transition.
  __doc.querySelectorAll('.stage').forEach(s => s.classList.remove('visible'));
  const stg = __doc.getElementById('stage-success');
  if (stg) stg.classList.add('visible');
  // Hide the running-total pill on the success screen (the success box
  // shows the total in a denser format).
  const totalPill = __doc.getElementById('totalPill');
  if (totalPill) totalPill.style.display = 'none';
  // Also hide the floating bar on the success page — the customer is
  // done with the flow, the help menu is replaced by call/text buttons
  // inside the success body.
  const floatBar = __doc.getElementById('custFloatingBar');
  if (floatBar) floatBar.style.display = 'none';
  try { refreshProgressBarVisibility(); } catch (e) {}
  scrollAppToTop();
}

// Success-screen helpers
function customerStartOver() {
  if (!confirm('Start a new estimate? Your current information will be cleared.')) return;
  // Clear in-progress autosave so the next page load doesn't prompt
  // them to resume the quote they just completed/discarded.
  try { __custClearProgress(); } catch (e) {}
  // Hard reload — simplest reliable way to fully reset state, localStorage
  // drafts, etc. The hosted bundle is small and the customer flow is
  // short, so a reload is fine UX.
  try { location.reload(); }
  catch (e) {
    // Fallback if reload is blocked (unusual). Reset state manually.
    try { startNewQuote(); } catch (e2) {}
    goToIntroFromStage1();
  }
}

function customerCallbackFromSuccess() {
  // From the success screen, "have someone call me sooner" flags the
  // existing submission as also wanting a callback. We just re-submit
  // in callback mode with the same data so a second Jobber note lands
  // with the callback flag. Or we can just inform the customer.
  alert("Got it — we'll prioritize reaching out by phone within 1 business day.");
  // Could also POST to a /requestCallback endpoint to log explicitly;
  // for now the polite alert is enough since the request is already in
  // the team's queue.
}

// Make the new functions reachable from inline onclick attrs.
if (typeof window !== 'undefined') {
  window.goToStage1FromIntro          = goToStage1FromIntro;
  window.goToIntroFromStage1          = goToIntroFromStage1;
  window.validateAndAdvanceFromStage1 = validateAndAdvanceFromStage1;
  window.customerSubmitEstimate       = customerSubmitEstimate;
  window.customerRequestCallback      = customerRequestCallback;
  window.customerStartOver            = customerStartOver;
  window.customerCallbackFromSuccess  = customerCallbackFromSuccess;
  window.toggleCustHelpMenu           = toggleCustHelpMenu;
  window.openCustHelpMenu             = openCustHelpMenu;
  window.custCopyPhoneNumber          = custCopyPhoneNumber;
  window.trackCustHelpAction          = trackCustHelpAction;
}
  // Expose for inline onclick=/onchange= handlers in markup.
  Object.assign(window, { nextStage, prevStage, showStage, addAnotherProject, cancelAddProject, cancelEditBundled, collapseActiveProject, editBundledProject, removeBundledProject, resetQuote, startNewQuote, finalizeQuote, generatePDF, returnToDashboard, cancelNewQuote, refreshDashboardHard, pickCustSearchResult, clearPickedCustomer, convertJobberRequestToQuote, copyJobberErrorToClipboard, clearAllDrafts, resumeDraft, deleteDraft, saveAndReturnToDashboard, onFolderToggle, onDashSearchInput, openRowMenu, closeRowMenu, resumeCloudQuote, resumeLocalDraft, deleteLocalDraft, moveCloudQuote, duplicateCloudQuote, permanentlyDeleteCloud, duplicateCurrentForEdit, toggleBulkMode, toggleBulkRow, bulkClearSelection, bulkSetStatus, bulkPermanentlyDelete, openPricingAdmin, closePricingAdmin, switchPricingAdminTab, savePricingAdmin, resetPricingAdmin, removeReferencePhoto, signOutAndReload, openChangePinPrompt, closeRepMenu, adminCreateRep, adminResetRepPin, adminDeleteRep, adminRevokeDevice, adminRevokeAllDevices, toggleAdminDevicesShowAll, openProjectSwitchDialog, closeProjectSwitchDialog, confirmAddAnotherProject, confirmSwitchProject, openJobberPanel, closeJobberPanel, jobberConnect, jobberManualRefresh, jobberDisconnectConfirm, jobberTestConnection, pushFinishedQuoteToJobber, resendFinishedToJobber, resendViewedQuoteToJobber, resendCurrentQuoteFromSuccess, resendCurrentViewedToJobber, openSideTracker, closeSideTracker, clearTrackerRow, openInfoModal, closeInfoModal, openMeasureTutorial, closeMeasureTutorial, setProduct, setTier, toggleAddonInline, setAddonInlineQty, toggleEditPanel, applyCustomColor, removeCustomAddon, state, goToStage1FromIntro, goToIntroFromStage1, validateAndAdvanceFromStage1, customerSubmitEstimate, customerRequestCallback, customerStartOver, customerCallbackFromSuccess, toggleCustHelpMenu, openCustHelpMenu, custCopyPhoneNumber, trackCustHelpAction, custResumeContinue, custDiscardResume, toggleMobileExpand });

  }

  class SSSCustomerCalculator extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;
      this._shadow = this.attachShadow({ mode: 'open' });
      this._shadow.innerHTML = '<style>' + STYLE + '</style>' + HTML;
      const self = this;
      loadJsPDF().finally(() => {
        try { initCalculator.call(self, self._shadow, self); }
        catch (e) { console.error('[SSS Customer Calculator] init failed:', e); }
      });
    }
  }

  customElements.define('sss-customer-calculator', SSSCustomerCalculator);
})();
