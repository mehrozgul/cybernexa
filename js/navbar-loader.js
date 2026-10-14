
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
        console.error("Could not load shared navbar:", error);
    }
});