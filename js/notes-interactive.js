/**
 * CyberNexa Interactive Notes Engine v2
 * Transforms ALL theory and lab pages into interactive note-style pages.
 * Runs automatically on page load — no HTML changes needed.
 *
 * Features:
 * 1. Reading progress bar
 * 2. Auto-collapsible sections (click header to collapse/expand)
 * 3. Checkable key-points with localStorage persistence
 * 4. Section completion badge when all points are checked
 * 5. Truncate long paragraphs with "read more"
 * 6. Copy buttons on code blocks
 * 7. Floating auto-generated TOC
 * 8. Reading time estimate
 * 9. Section progress tracker
 * 10. Back-to-top button
 */

(function () {
    'use strict';

    /* ── Helpers ── */
    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html !== undefined) e.innerHTML = html;
        return e;
    }
    function uid() {
        return 'cnx-' + Math.random().toString(36).slice(2, 8);
    }

    /* ── 1. Reading Progress Bar ── */
    function initReadingBar() {
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
        var btn = el('button', '', '↑');
        btn.id = 'cnx-back-top';
        btn.title = 'Back to top';
        btn.setAttribute('aria-label', 'Back to top');
        document.body.appendChild(btn);
        window.addEventListener('scroll', function () {
            if (window.scrollY > 400) btn.classList.add('show');
            else btn.classList.remove('show');
        }, { passive: true });
        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ── 3. Reading Time ── */
    function initReadingTime() {
        var main = document.querySelector('main') || document.querySelector('.article-page') || document.querySelector('.lab-page');
        if (!main) return;
        var text = main.innerText || main.textContent || '';
        var words = text.trim().split(/\s+/).length;
        var mins = Math.max(1, Math.round(words / 200));
        var header = document.querySelector('.article-header, .lab-header, .theory-header, .lesson-header, .topic-header');
        if (!header) return;
        var badge = el('span', 'cnx-read-time', '⏱ ' + mins + ' min read');
        header.appendChild(badge);
    }

    /* ── 4. Collapsible Sections ── */
    function initCollapsibleSections() {
        var sections = document.querySelectorAll(
            '.article-section, .theory-section, .topic-section, .note-card, .lab-section, .lab-box, .quiz-card, .summary-box, .definition-box'
        );
        sections.forEach(function (sec) {
            var h = sec.querySelector('h2, h3');
            if (!h || h.closest('.cnx-section-toggle')) return;

            var id = uid();
            var bodyId = id + '-body';

            // Wrap heading in toggle button
            var toggle = el('button', 'cnx-section-toggle');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-controls', bodyId);

            var iconEl = el('span', 'cnx-toggle-icon', '−');
            var badgeEl = el('span', 'cnx-section-done-badge', '✓ Done');
            var titleWrap = el('span', '', '');
            titleWrap.style.display = 'flex';
            titleWrap.style.alignItems = 'center';
            titleWrap.style.gap = '8px';
            titleWrap.style.flex = '1';

            // Move h2 contents into titleWrap
            while (h.firstChild) titleWrap.appendChild(h.firstChild);
            titleWrap.appendChild(badgeEl);
            toggle.appendChild(titleWrap);
            toggle.appendChild(iconEl);
            h.appendChild(toggle);
            h.style.marginBottom = '0';
            h.style.borderBottom = 'none';
            h.style.paddingBottom = '0';

            // Wrap remaining content in body
            var bodyWrap = el('div', 'cnx-section-body');
            bodyWrap.id = bodyId;
            bodyWrap.setAttribute('role', 'region');
            bodyWrap.style.paddingTop = '14px';

            var children = Array.prototype.slice.call(sec.children);
            children.forEach(function (child) {
                if (child !== h) bodyWrap.appendChild(child);
            });
            sec.appendChild(bodyWrap);

            toggle.addEventListener('click', function () {
                var collapsed = sec.classList.toggle('cnx-collapsed');
                iconEl.textContent = collapsed ? '+' : '−';
                toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            });

            sec._cnxBadge = badgeEl;
        });
    }

    /* ── 5. Checkable Key Points ── */
    function initCheckpoints() {
        var pageKey = location.pathname;

        // Target key-point, note-bullets li, concept-item
        var items = document.querySelectorAll(
            '.key-point, .note-bullets li, .note-point, .concept-item, .lab-step, .tool-step, .step-item'
        );
        if (!items.length) return;

        // Load saved state
        var saved = {};
        try { saved = JSON.parse(localStorage.getItem('cnx-checks-' + pageKey) || '{}'); } catch (e) { }

        items.forEach(function (item, i) {
            var itemId = pageKey + '-' + i;

            // Build checkbox UI
            var checkEl = el('span', 'cnx-checkbox', '');
            var textWrap = el('span', 'cnx-item-text', '');

            // Move existing content into textWrap
            while (item.firstChild) textWrap.appendChild(item.firstChild);

            // Remove old ::before arrow (handled by CSS class now)
            item.classList.add('cnx-check-item');
            item.prepend(textWrap);
            item.prepend(checkEl);

            // Restore saved state
            if (saved[itemId]) {
                item.classList.add('cnx-checked');
            }

            item.addEventListener('click', function () {
                item.classList.toggle('cnx-checked');
                saved[itemId] = item.classList.contains('cnx-checked');
                try { localStorage.setItem('cnx-checks-' + pageKey, JSON.stringify(saved)); } catch (e) { }
                updateSectionBadge(item);
                updateProgress();
            });
        });
        updateProgress();
    }

    function updateSectionBadge(item) {
        var sec = item.closest('.article-section, .theory-section, .note-card, .lab-section, .topic-section');
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
            label.textContent = done.length + '/' + all.length + ' points done';
        }
        // Update all section badges
        document.querySelectorAll('.cnx-check-item').forEach(function (item) {
            updateSectionBadge(item);
        });
    }

    /* ── 6. Progress tracker in header ── */
    function initProgressTracker() {
        var header = document.querySelector('.article-header, .lab-header, .theory-header, .lesson-header, .topic-header');
        if (!header) return;
        var all = document.querySelectorAll('.cnx-check-item');
        if (!all.length) return;

        var wrap = el('div', 'cnx-progress-wrap',
            '<div class="cnx-progress-bar-mini"><div class="cnx-progress-bar-fill" style="width:0%"></div></div>' +
            '<span class="cnx-progress-label">0/' + all.length + ' points done</span>'
        );
        header.appendChild(wrap);
        updateProgress();
    }

    /* ── 7. Truncate Long Paragraphs ── */
    function initReadMore() {
        var paras = document.querySelectorAll('.article-section p, .theory-section p, .note-card p, .lab-section p');
        var LIMIT = 160; // characters
        paras.forEach(function (p) {
            if (p.closest('.cnx-read-more-btn') || p.classList.contains('article-intro') || p.classList.contains('cnx-no-trim')) return;
            var text = p.textContent || '';
            if (text.trim().length <= LIMIT) return;
            var shortText = text.trim().slice(0, LIMIT);
            var restText = text.trim().slice(LIMIT);
            var shortNode = el('span', 'cnx-para-short', shortText + '…');
            var restNode = el('span', 'cnx-para-rest', restText);
            var btn = el('button', 'cnx-read-more-btn', 'more');
            btn.setAttribute('aria-label', 'Show more text');
            p.textContent = '';
            p.appendChild(shortNode);
            p.appendChild(btn);
            p.appendChild(restNode);
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                p.classList.toggle('cnx-para-expanded');
                if (p.classList.contains('cnx-para-expanded')) {
                    shortNode.textContent = text.trim();
                    btn.style.display = 'none';
                } else {
                    shortNode.textContent = shortText + '…';
                    btn.style.display = '';
                }
            });
        });
    }

    /* ── 8. Copy buttons for code blocks ── */
    function initCopyButtons() {
        var blocks = document.querySelectorAll('pre, .code-block, .terminal-block, .command-box');
        blocks.forEach(function (block) {
            if (block.querySelector('.cnx-copy-btn')) return;
            var wrap = el('div', 'cnx-code-wrap');
            block.parentNode.insertBefore(wrap, block);
            wrap.appendChild(block);
            var btn = el('button', 'cnx-copy-btn', 'Copy');
            wrap.appendChild(btn);
            btn.addEventListener('click', function () {
                var text = block.innerText || block.textContent || '';
                navigator.clipboard.writeText(text).then(function () {
                    btn.textContent = 'Copied!';
                    btn.classList.add('copied');
                    setTimeout(function () {
                        btn.textContent = 'Copy';
                        btn.classList.remove('copied');
                    }, 1800);
                }).catch(function () {
                    // Fallback
                    var ta = document.createElement('textarea');
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    btn.textContent = 'Copied!';
                    setTimeout(function () { btn.textContent = 'Copy'; }, 1800);
                });
            });
        });
    }

    /* ── 9. Auto-generated Floating TOC ── */
    function initFloatingTOC() {
        var headings = document.querySelectorAll('.article-section h2, .theory-section h2, .note-card h2, .lab-section h2, .topic-section h2');
        if (headings.length < 2) return;

        var toc = el('nav', '', '');
        toc.id = 'cnx-toc-float';
        toc.setAttribute('aria-label', 'Table of Contents');

        var title = el('p', 'cnx-toc-title', 'On This Page');
        toc.appendChild(title);

        headings.forEach(function (h, i) {
            if (!h.id) h.id = 'cnx-s-' + i;
            var text = h.textContent.replace(/[−+]/, '').trim().slice(0, 32);
            var link = el('a', 'cnx-toc-link', text);
            link.href = '#' + h.id;
            link.addEventListener('click', function (e) {
                e.preventDefault();
                var target = document.getElementById(h.id);
                if (target) {
                    // Expand if collapsed
                    var sec = target.closest('.article-section, .theory-section, .note-card, .lab-section');
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

        // Highlight active on scroll
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

    /* ── 10. Keyboard shortcut: C = collapse all, E = expand all ── */
    function initKeyboard() {
        document.addEventListener('keydown', function (e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'c' || e.key === 'C') {
                document.querySelectorAll('.article-section, .note-card, .theory-section, .lab-section').forEach(function (sec) {
                    if (!sec.classList.contains('cnx-collapsed')) {
                        var toggle = sec.querySelector('.cnx-section-toggle');
                        if (toggle) toggle.click();
                    }
                });
            }
            if (e.key === 'e' || e.key === 'E') {
                document.querySelectorAll('.cnx-collapsed').forEach(function (sec) {
                    var toggle = sec.querySelector('.cnx-section-toggle');
                    if (toggle) toggle.click();
                });
            }
        });
    }

    /* ── Init all features ── */
    function init() {
        try { initReadingBar(); } catch (e) { }
        try { initBackTop(); } catch (e) { }
        try { initReadingTime(); } catch (e) { }
        try { initCollapsibleSections(); } catch (e) { }
        try { initCheckpoints(); } catch (e) { }
        try { initProgressTracker(); } catch (e) { }
        try { initReadMore(); } catch (e) { }
        try { initCopyButtons(); } catch (e) { }
        try { initFloatingTOC(); } catch (e) { }
        try { initKeyboard(); } catch (e) { }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
