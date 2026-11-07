/* =========================================================
   CYBERNEXA SHARED NAVBAR LOADER
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {
    const placeholder = document.getElementById("navbar-placeholder");

    if (!placeholder) {
        console.error("Navbar placeholder not found.");
        return;
    }

    const navbarPath = placeholder.dataset.navbarPath;
    const rootPath = placeholder.dataset.rootPath || "../../../";

    // Resolve root directory for all shared links
    const rootUrl = new URL(rootPath, window.location.href);
    window.CYBERNEXA_ROOT = rootUrl.href;

    try {
        const response = await fetch(navbarPath);

        if (!response.ok) {
            throw new Error(`Navbar load failed: ${response.status}`);
        }

        const html = await response.text();
        placeholder.innerHTML = html;

        // Resolve shared navbar links from the website root
        placeholder.querySelectorAll("[data-path]").forEach(function (element) {
            const path = element.dataset.path;
            element.setAttribute("href", new URL(path, rootUrl).href);
        });

        // Let navbar.js and session.js know that navbar is ready
        document.dispatchEvent(new Event("cybernexa:navbar-ready"));

    } catch (error) {
        console.warn("Shared navbar fetch failed, rendering fallback navbar:", error);

        placeholder.innerHTML = `
        <header class="navbar">
            <div class="nav-container">
                <!-- BRAND -->
                <a href="${rootUrl.href}index.html" class="brand">
                    <div class="brand-logo">
                        <svg viewBox="0 0 50 60" aria-hidden="true">
                            <path d="M25 2 L46 10 V27 C46 42 37 52 25 58 C13 52 4 42 4 27 V10 Z" fill="none" stroke="currentColor" stroke-width="3" />
                            <rect x="18" y="25" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2.5" />
                            <path d="M20 25 V20 C20 16 30 16 30 20 V25" fill="none" stroke="currentColor" stroke-width="2.5" />
                            <circle cx="25" cy="31" r="2" fill="currentColor" />
                            <path d="M25 33 V36" stroke="currentColor" stroke-width="2" />
                        </svg>
                    </div>
                    <div class="brand-text">
                        <div class="brand-name">Cyber<span>Nexa</span></div>
                        <div class="brand-tagline">Cybersecurity &amp; IT Learning</div>
                    </div>
                </a>

                <!-- NAVIGATION -->
                <input type="checkbox" id="menu-toggle" class="menu-toggle">
                <nav class="navigation">
                    <a href="${rootUrl.href}index.html" class="nav-item"><span>Home</span></a>
                    <a href="${rootUrl.href}learning-paths/cybersecurity/theory/cybersecurity.html" class="nav-item"><span>Cybersecurity</span></a>
                    <a href="${rootUrl.href}learning-paths/networking/theory/networking.html" class="nav-item"><span>Networking</span></a>
                    <a href="${rootUrl.href}learning-paths/linux/theory/linux.html" class="nav-item"><span>Linux</span></a>
                    <a href="${rootUrl.href}learning-paths/cybersecurity-tools/theory/cyber-tools.html" class="nav-item"><span>Tools</span></a>
                    <a href="${rootUrl.href}learning-paths/labs/practical-labs.html" class="nav-item"><span>Labs</span></a>
                    <a href="${rootUrl.href}index.html#tutorials" class="nav-item"><span>Tutorials</span></a>
                    <!-- USER PROFILE -->
                    <div class="profile-nav" id="profileNav"></div>
                </nav>

                <!-- SEARCH -->
                <div class="search-wrapper">
                    <button type="button" class="search-button" aria-label="Open search">
                        <span class="search-icon" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                        <span class="search-text">Search...</span>
                    </button>
                </div>

                <!-- MOBILE MENU BUTTON (HAMBURGER) -->
                <label for="menu-toggle" class="menu-button" aria-label="Open navigation menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </label>
            </div>
        </header>`;

        document.dispatchEvent(new Event("cybernexa:navbar-ready"));
    }
});
