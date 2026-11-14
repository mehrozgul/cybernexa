/**
 * CyberNexa Interactive Notes Engine v3 — "Smart Concise Notes"
 * Transforms ALL 330 theory and lab pages into clean, concise, interactive notes.
 *
 * Key Capabilities:
 * 1. Essential Notes Mode: Automatically trims long narrative text down to core concepts.
 * 2. Universal Collapsible Cards: Targets every card type across all learning paths.
 * 3. Universal Checkpoints: Turns steps and bullet points into interactive checklist items.
 * 4. Essential Step Streamlining: Keeps only actionable commands and key outcomes in labs.
 * 5. Reading Progress Bar & Back to Top.
 * 6. Code Copy Buttons with 1-click feedback.
 * 7. Non-intrusive Floating Table of Contents.
 * 8. Reading Time & Progress Counter.
 * 9. Keyboard shortcuts: C (collapse all), E (expand all), N (toggle essential notes mode).
 */

(function () {
    'use strict';

    // Prevent duplicate initialization
    if (window._cybernexaNotesEngineInitialized) return;
    window._cybernexaNotesEngineInitialized = true;

    /* ── Helper Functions ── */
    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html !== undefined) e.innerHTML = html;
        return e;
    }

    function uid() {
        return 'cnx-' + Math.random().toString(36).slice(2, 9);
    }

    /* ── 1. Reading Progress Bar ── */
    function initReadingBar() {
        if (document.getElementById('cnx-reading-bar')) return;
        var bar = el('div', '', '<div id="cnx-reading-bar-fill"></div>');
        bar.id = 'cnx-reading-bar';
        document.body.prepend(bar);
        var fill = document.getElementById('cnx-reading-bar-fill');
        window.addEventListener('scroll', function () {
            var scrollTop = window.scrollY || document.documentElement.scrollTop;
            var docH = document.documentElement.scrollHeight - window.innerHeight;
            fill.style.width = (docH > 0 ? (scrollTop / docH * 100) : 0) + '%';
        }, { passive: true });
    }

    /* ── 2. Back to Top ── */
    function initBackTop() {
        if (document.getElementById('cnx-back-top')) return;
        var btn = el('button', '', '↑');
        btn.id = 'cnx-back-top';
        btn.title = 'Back to top';
        btn.setAttribute('aria-label', 'Back to top');
        document.body.appendChild(btn);
        window.addEventListener('scroll', function () {
            if (window.scrollY > 350) btn.classList.add('show');
            else btn.classList.remove('show');
        }, { passive: true });
        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ── 3. Essential Notes Mode Bar (Content Reducer Toggle) ── */
    function initEssentialModeBar() {
        if (document.getElementById('cnx-mode-bar')) return;

        var header = document.querySelector(
            '.article-header, .lab-header, .theory-header, .lesson-header, .topic-header, .windows-lab-header, .learning-container header, .windows-lab-container header'
        );
        if (!header) {
            header = document.querySelector('main header, main h1');
            if (header && header.tagName === 'H1') header = header.parentElement;
        }

        var isEssential = localStorage.getItem('cnx-essential-mode') !== 'false'; // Default: ON

        var bar = el('div', 'cnx-mode-bar');
        bar.id = 'cnx-mode-bar';

        var title = el('span', 'cnx-mode-title', '⚡ <strong>Notes Mode:</strong> Essential concepts highlighted');
        var toggleBtn = el('button', 'cnx-mode-toggle', isEssential ? 'Show Full Details' : '⚡ Concise Notes View');
        toggleBtn.title = 'Switch between concise notes and full expanded details';

        bar.appendChild(title);
        bar.appendChild(toggleBtn);

        if (header && header.parentNode) {
            header.parentNode.insertBefore(bar, header.nextSibling);
        } else {
            var main = document.querySelector('main') || document.body;
            main.prepend(bar);
        }

        function applyMode(essential) {
            if (essential) {
                document.body.classList.add('cnx-essential-mode');
                toggleBtn.textContent = '📖 Show Full Details';
                toggleBtn.classList.add('active');
                title.innerHTML = '⚡ <strong>Essential Notes View:</strong> Content condensed for rapid understanding';
            } else {
                document.body.classList.remove('cnx-essential-mode');
                toggleBtn.textContent = '⚡ Concise Notes View';
                toggleBtn.classList.remove('active');
                title.innerHTML = '📖 <strong>Full Details View:</strong> Complete step descriptions shown';
            }
            try { localStorage.setItem('cnx-essential-mode', String(essential)); } catch (e) {}
        }

        toggleBtn.addEventListener('click', function () {
            isEssential = !isEssential;
            applyMode(isEssential);
        });

        applyMode(isEssential);
    }

    /* ── 4. Reading Time Badge ── */
    function initReadingTime() {
        var header = document.querySelector(
            '.article-header, .lab-header, .theory-header, .lesson-header, .topic-header, .windows-lab-header, .windows-lab-category'
        );
        if (!header || header.querySelector('.cnx-read-time')) return;

        var main = document.querySelector('main') || document.body;
        var text = main.innerText || main.textContent || '';
        var words = text.trim().split(/\s+/).length;
        // In essential notes mode reading is quick: ~250 wpm
        var mins = Math.max(1, Math.round(words / 240));

        var badge = el('span', 'cnx-read-time', '⏱ ' + mins + ' min quick read');
        header.appendChild(badge);
    }

    /* ── 5. Universal Collapsible Cards (All 330 Pages) ── */
    function initCollapsibleSections() {
        // Broad selector matching cards across all paths
        var cardSelectors = [
            '.learning-card', '.lab-card', '.concept-card', '.windows-card',
            '.windows-lab-card', '.linux-card', '.linux-command-card', '.network-section',
            '.eh-card', '.ws-card', '.df-card', '.method-card', '.topic-card',
            '.command-card', '.note-card', '.article-section', '.theory-section',
            '.lab-section', '.definition-box', '.summary-box', '.task-card',
            '.windows-task-card', '.tool-card', '.practical-card', '.info-card'
        ].join(', ');

        var sections = document.querySelectorAll(cardSelectors);

        sections.forEach(function (sec) {
            // Prevent double initialization
            if (sec.dataset.cnxCollapsedInit === 'true') return;
            sec.dataset.cnxCollapsedInit = 'true';

            var h = sec.querySelector('h2, h3, .learning-card-heading, .windows-card-heading, .windows-lab-card-heading, .linux-card-heading, .card-heading');
            if (!h) return;

            var id = uid();
            var bodyId = id + '-body';

            var toggle = el('button', 'cnx-section-toggle');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-controls', bodyId);
            toggle.type = 'button';

            var iconEl = el('span', 'cnx-toggle-icon', '−');
            var badgeEl = el('span', 'cnx-section-done-badge', '✓ Done');
            var titleWrap = el('span', 'cnx-toggle-title-wrap');

            // Move header contents into titleWrap
            while (h.firstChild) {
                titleWrap.appendChild(h.firstChild);
            }
            titleWrap.appendChild(badgeEl);
            toggle.appendChild(titleWrap);
            toggle.appendChild(iconEl);
            h.appendChild(toggle);

            // Wrap remaining content in body wrapper
            var bodyWrap = el('div', 'cnx-section-body');
            bodyWrap.id = bodyId;
            bodyWrap.setAttribute('role', 'region');

            var children = Array.prototype.slice.call(sec.children);
            children.forEach(function (child) {
                if (child !== h && child !== toggle) {
                    bodyWrap.appendChild(child);
                }
            });
            sec.appendChild(bodyWrap);

            toggle.addEventListener('click', function (e) {
                e.preventDefault();
                var collapsed = sec.classList.toggle('cnx-collapsed');
                iconEl.textContent = collapsed ? '+' : '−';
                toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            });

            sec._cnxBadge = badgeEl;
        });
    }

    /* ── 6. Universal Interactive Checkpoints ── */
    function initCheckpoints() {
        var pageKey = location.pathname;

        // Target key items, steps, list items across all pages
        var itemSelectors = [
            '.key-point', '.note-bullets li', '.note-point', '.concept-item',
            '.lab-step', '.tool-step', '.step-item', '.key-item', '.windows-key-item',
            '.linux-key-item', '.check-item', '.summary-list li', '.windows-task-step',
            '.task-step', '.step-box'
        ].join(', ');

        var items = document.querySelectorAll(itemSelectors);
        if (!items.length) return;

        var saved = {};
        try { saved = JSON.parse(localStorage.getItem('cnx-checks-' + pageKey) || '{}'); } catch (e) {}

        items.forEach(function (item, i) {
            if (item.classList.contains('cnx-check-item')) return;

            var itemId = pageKey + '-' + i;
            var checkEl = el('span', 'cnx-checkbox', '');
            var textWrap = el('span', 'cnx-item-text', '');

            while (item.firstChild) textWrap.appendChild(item.firstChild);

            item.classList.add('cnx-check-item');
            item.appendChild(checkEl);
            item.appendChild(textWrap);

            if (saved[itemId]) {
                item.classList.add('cnx-checked');
            }

            item.addEventListener('click', function (e) {
                // Ignore if clicked on links or buttons inside item
                if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;

                item.classList.toggle('cnx-checked');
                saved[itemId] = item.classList.contains('cnx-checked');
                try { localStorage.setItem('cnx-checks-' + pageKey, JSON.stringify(saved)); } catch (e) {}
                updateSectionBadge(item);
                updateProgress();
            });
        });

        updateProgress();
    }

    function updateSectionBadge(item) {
        var sec = item.closest(
            '.learning-card, .lab-card, .concept-card, .windows-card, .windows-lab-card, .linux-card, .note-card, .article-section, .theory-section'
        );
        if (!sec || !sec._cnxBadge) return;
        var all = sec.querySelectorAll('.cnx-check-item');
        var done = sec.querySelectorAll('.cnx-check-item.cnx-checked');
        if (all.length && done.length === all.length) {
            sec._cnxBadge.classList.add('show');
        } else {
            sec._cnxBadge.classList.remove('show');
        }
    }

    function updateProgress() {
        var all = document.querySelectorAll('.cnx-check-item');
        var done = document.querySelectorAll('.cnx-check-item.cnx-checked');
        var bar = document.querySelector('.cnx-progress-bar-fill');
        var label = document.querySelector('.cnx-progress-label');

        if (bar && all.length) {
            bar.style.width = (done.length / all.length * 100) + '%';
        }
        if (label && all.length) {
            label.textContent = done.length + '/' + all.length + ' key points done';
        }

        document.querySelectorAll('.cnx-check-item').forEach(function (item) {
            updateSectionBadge(item);
        });
    }

    /* ── 7. Progress Tracker in Header ── */
    function initProgressTracker() {
        var header = document.querySelector(
            '.article-header, .lab-header, .theory-header, .lesson-header, .topic-header, .windows-lab-header'
        );
        if (!header || header.querySelector('.cnx-progress-wrap')) return;

        var all = document.querySelectorAll('.cnx-check-item');
        if (!all.length) return;

        var wrap = el('div', 'cnx-progress-wrap',
            '<div class="cnx-progress-bar-mini"><div class="cnx-progress-bar-fill" style="width:0%"></div></div>' +
            '<span class="cnx-progress-label">0/' + all.length + ' key points done</span>'
        );
        header.appendChild(wrap);
        updateProgress();
    }

    /* ── 8. Universal Smart Paragraph Truncation (Concise View) ── */
    function initReadMore() {
        var paras = document.querySelectorAll(
            'main p, .learning-container p, .windows-lab-container p, .article-page p'
        );
        var LIMIT = 150; // characters before concise truncation

        paras.forEach(function (p) {
            if (p.classList.contains('cnx-trimmed') ||
                p.classList.contains('topic-intro') ||
                p.classList.contains('windows-lab-intro') ||
                p.classList.contains('article-intro') ||
                p.classList.contains('cnx-no-trim') ||
                p.closest('#navbar-placeholder') ||
                p.closest('.navbar') ||
                p.closest('.footer') ||
                p.closest('#cnx-mode-bar')) return;

            var text = p.textContent || '';
            if (text.trim().length <= LIMIT) return;

            p.classList.add('cnx-trimmed');

            // Find a sentence or word break near LIMIT
            var breakIndex = text.indexOf('. ', LIMIT - 40);
            if (breakIndex === -1 || breakIndex > LIMIT + 40) {
                breakIndex = text.lastIndexOf(' ', LIMIT);
                if (breakIndex === -1) breakIndex = LIMIT;
            } else {
                breakIndex += 1; // Include period
            }

            var shortText = text.slice(0, breakIndex).trim();
            var restText = text.slice(breakIndex).trim();

            var shortNode = el('span', 'cnx-para-short', shortText + ' ');
            var restNode = el('span', 'cnx-para-rest', restText);
            var btn = el('button', 'cnx-read-more-btn', 'more ▾');
            btn.type = 'button';
            btn.setAttribute('aria-label', 'Expand details');

            p.textContent = '';
            p.appendChild(shortNode);
            p.appendChild(btn);
            p.appendChild(restNode);

            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var isExpanded = p.classList.toggle('cnx-para-expanded');
                btn.textContent = isExpanded ? 'less ▴' : 'more ▾';
            });
        });
    }

    /* ── 9. Universal Code Copy Buttons ── */
    function initCopyButtons() {
        var blocks = document.querySelectorAll(
            'pre, .code-block, .terminal-block, .command-box, .windows-command-box, .linux-command-box, pre code'
        );

        blocks.forEach(function (block) {
            // Avoid duplicate wrappers
            if (block.closest('.cnx-code-wrap')) return;

            var wrap = el('div', 'cnx-code-wrap');
            block.parentNode.insertBefore(wrap, block);
            wrap.appendChild(block);

            var btn = el('button', 'cnx-copy-btn', 'Copy');
            btn.type = 'button';
            btn.title = 'Copy to clipboard';
            wrap.appendChild(btn);

            btn.addEventListener('click', function () {
                var codeText = block.innerText || block.textContent || '';
                // Clean any trailing whitespace
                codeText = codeText.trim();

                function notifySuccess() {
                    btn.textContent = 'Copied! ✓';
                    btn.classList.add('copied');
                    setTimeout(function () {
                        btn.textContent = 'Copy';
                        btn.classList.remove('copied');
                    }, 1800);
                }

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(codeText).then(notifySuccess).catch(function () {
                        fallbackCopy(codeText);
                        notifySuccess();
                    });
                } else {
                    fallbackCopy(codeText);
                    notifySuccess();
                }
            });
        });

        function fallbackCopy(text) {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
    }

    /* ── 10. Floating Table of Contents ── */
    function initFloatingTOC() {
        if (document.getElementById('cnx-toc-float')) return;

        var headings = document.querySelectorAll(
            'main h2, .learning-container h2, .windows-lab-container h2, .learning-card-heading h2, .windows-card-heading h2, .linux-card-heading h2'
        );
        if (headings.length < 2) return;

        var toc = el('nav', '', '');
        toc.id = 'cnx-toc-float';
        toc.setAttribute('aria-label', 'Table of Contents');

        var title = el('p', 'cnx-toc-title', 'Essential Notes TOC');
        toc.appendChild(title);

        headings.forEach(function (h, i) {
            if (!h.id) h.id = 'cnx-sec-' + i;
            var text = h.textContent.replace(/[−+]/g, '').trim();
            // Truncate long header text in TOC
            if (text.length > 28) text = text.slice(0, 26) + '…';

            var link = el('a', 'cnx-toc-link', text);
            link.href = '#' + h.id;

            link.addEventListener('click', function (e) {
                e.preventDefault();
                var target = document.getElementById(h.id);
                if (target) {
                    var sec = target.closest(
                        '.learning-card, .lab-card, .concept-card, .windows-card, .windows-lab-card, .linux-card, .note-card'
                    );
                    if (sec && sec.classList.contains('cnx-collapsed')) {
                        var toggle = sec.querySelector('.cnx-section-toggle');
                        if (toggle) toggle.click();
                    }
                    setTimeout(function () {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                }
            });
            toc.appendChild(link);
        });

        document.body.appendChild(toc);

        // Highlight active link on scroll
        var links = toc.querySelectorAll('.cnx-toc-link');
        window.addEventListener('scroll', function () {
            var scrollY = window.scrollY + 120;
            var active = null;
            headings.forEach(function (h, i) {
                if (h.offsetTop <= scrollY) active = i;
            });
            links.forEach(function (l) { l.classList.remove('cnx-active'); });
            if (active !== null && links[active]) links[active].classList.add('cnx-active');
        }, { passive: true });
    }

    /* ── 11. Keyboard Shortcuts ── */
    function initKeyboard() {
        document.addEventListener('keydown', function (e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // 'C': Collapse all sections
            if (e.key === 'c' || e.key === 'C') {
                document.querySelectorAll(
                    '.learning-card, .lab-card, .concept-card, .windows-card, .windows-lab-card, .linux-card, .note-card, .article-section'
                ).forEach(function (sec) {
                    if (!sec.classList.contains('cnx-collapsed')) {
                        var toggle = sec.querySelector('.cnx-section-toggle');
                        if (toggle) toggle.click();
                    }
                });
            }

            // 'E': Expand all sections
            if (e.key === 'e' || e.key === 'E') {
                document.querySelectorAll('.cnx-collapsed').forEach(function (sec) {
                    var toggle = sec.querySelector('.cnx-section-toggle');
                    if (toggle) toggle.click();
                });
            }

            // 'N': Toggle Essential Notes View
            if (e.key === 'n' || e.key === 'N') {
                var toggleBtn = document.querySelector('.cnx-mode-toggle');
                if (toggleBtn) toggleBtn.click();
            }
        });
    }

    /* ── Initialize All Capabilities ── */
    function run() {
        try { initReadingBar(); } catch (e) { console.warn(e); }
        try { initBackTop(); } catch (e) { console.warn(e); }
        try { initEssentialModeBar(); } catch (e) { console.warn(e); }
        try { initCollapsibleSections(); } catch (e) { console.warn(e); }
        try { initCheckpoints(); } catch (e) { console.warn(e); }
        try { initProgressTracker(); } catch (e) { console.warn(e); }
        try { initReadingTime(); } catch (e) { console.warn(e); }
        try { initReadMore(); } catch (e) { console.warn(e); }
        try { initCopyButtons(); } catch (e) { console.warn(e); }
        try { initFloatingTOC(); } catch (e) { console.warn(e); }
        try { initKeyboard(); } catch (e) { console.warn(e); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
