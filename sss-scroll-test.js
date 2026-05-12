// =============================================================
// sss-scroll-test.js — Custom Element scroll test
// =============================================================
// Defines a <sss-scroll-test> Custom Element with a tall column of
// fake cards. Drop it on a Wix page via Add → Embed Code → Custom
// Element. Then on iPad try scrolling by dragging anywhere on a
// card. If it scrolls smoothly, Wix Custom Elements DO NOT use a
// cross-origin iframe and we can port the full calculator. If it
// "catches" like the iframe embed does, Custom Elements have the
// same iOS quirk and we should abandon this path.
// =============================================================

class SSSScrollTest extends HTMLElement {
    connectedCallback() {
        // Light DOM (no shadow root) — renders directly into the Wix page.
        // This is what we want: less isolation = more native browser scroll
        // behavior. If Wix sandboxes Custom Elements in iframes anyway, this
        // won't help, but that's what the test is for.
        this.innerHTML = `
            <style>
                .sst-root {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    padding: 24px 24px 40px;
                    max-width: 720px;
                    margin: 0 auto;
                    color: #1a2540;
                }
                .sst-root h2 {
                    margin: 0 0 6px;
                    font-size: 22px;
                    color: #1a2540;
                }
                .sst-root p.sub {
                    margin: 0 0 20px;
                    color: #5a6378;
                    font-size: 14px;
                    line-height: 1.5;
                }
                .sst-card {
                    background: #ffffff;
                    border: 2px solid #ece9e3;
                    border-radius: 12px;
                    padding: 18px 22px;
                    margin-bottom: 16px;
                    cursor: pointer;
                    transition: border-color 0.15s, transform 0.15s;
                    -webkit-tap-highlight-color: transparent;
                    user-select: none;
                    -webkit-user-select: none;
                }
                .sst-card:hover { border-color: #5a8d68; }
                .sst-card.tapped { border-color: #c84d3a; background: #fde0d8; }
                .sst-card h3 {
                    margin: 0 0 4px;
                    font-size: 16px;
                    color: #1a2540;
                }
                .sst-card p {
                    margin: 0;
                    font-size: 13px;
                    color: #5a6378;
                    line-height: 1.4;
                }
                .sst-status {
                    position: sticky;
                    top: 0;
                    background: #2d6e4e;
                    color: white;
                    padding: 10px 14px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 700;
                    margin-bottom: 16px;
                    text-align: center;
                    z-index: 5;
                }
            </style>
            <div class="sst-root">
                <div class="sst-status" id="sst-status">Drag to scroll · Tap to "select"</div>
                <h2>Custom Element scroll test</h2>
                <p class="sub">If you can drag-scroll this list smoothly on iPad without "catching", Wix Custom Elements render natively in the page and we can port the full calculator. If it catches just like the HtmlComponent embed, this approach won't help us.</p>
                <div id="sst-cards"></div>
            </div>
        `;

        const cardsContainer = this.querySelector('#sst-cards');
        const status = this.querySelector('#sst-status');
        // Build 25 cards — enough to require scrolling on every screen size.
        const labels = [
            'Decorative wood post caps', 'Copper post caps', 'Lattice top accent staining',
            'Damaged board replacement', 'Loose nail re-secure', 'Gate adjust',
            'Trim accent staining', 'Two-tone application', 'Plant protection',
            'Stair anti-slip strips', 'Mailbox enclosure match', 'Citronella additive',
            'Custom color match', 'Built-in bench staining', 'Wood patching',
            'Color consultation', 'Sample swatch on wood', 'Weather rescheduling',
            'Free 90-day touch-up', 'Job-site cleanup', 'Pressure wash adjacent',
            'Extended warranty', 'Wood pre-treatment', 'Sealer top coat', 'HOA compliance review'
        ];
        labels.forEach((label, i) => {
            const card = document.createElement('div');
            card.className = 'sst-card';
            card.innerHTML = `
                <h3>${i + 1}. ${label}</h3>
                <p>This card is ${100 + Math.floor(Math.random() * 40)}px tall. Tap it to verify clicks still work after we made the page scrollable. The status bar at the top should turn red.</p>
            `;
            card.addEventListener('click', () => {
                this.querySelectorAll('.sst-card').forEach(c => c.classList.remove('tapped'));
                card.classList.add('tapped');
                status.textContent = `Tapped: "${label}" — clicks work ✓`;
                status.style.background = '#c84d3a';
                setTimeout(() => {
                    status.style.background = '#2d6e4e';
                    status.textContent = 'Drag to scroll · Tap to "select"';
                }, 1500);
            });
            cardsContainer.appendChild(card);
        });

        // Quick tap-vs-drag guard so a scroll-drag that ends on a card doesn't
        // accidentally fire the click. Same approach we use in the calculator.
        let sx = 0, sy = 0, dragged = false;
        this.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            sx = e.touches[0].clientX; sy = e.touches[0].clientY; dragged = false;
        }, { passive: true });
        this.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;
            if (Math.abs(e.touches[0].clientX - sx) > 8 || Math.abs(e.touches[0].clientY - sy) > 8) dragged = true;
        }, { passive: true });
        this.addEventListener('click', (e) => {
            if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; }
        }, true);
    }
}

if (!customElements.get('sss-scroll-test')) {
    customElements.define('sss-scroll-test', SSSScrollTest);
}
