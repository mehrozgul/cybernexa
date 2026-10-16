/* =========================================================
   CYBERNEXA NAVBAR & SEARCH JAVASCRIPT
   Production Standard: Accessible, Responsive, Secure
========================================================= */

(function () {
    "use strict";

    let navbarInitialized = false;

    // Comprehensive catalog of CyberNexa topics for instant universal search
    const CYBERNEXA_TOPICS = [
        // Main Learning Paths
        { title: "Cybersecurity Fundamentals", category: "Learning Path", path: "learning-paths/cybersecurity/theory/cybersecurity.html", desc: "Core concepts, CIA triad, threat models, defense in depth" },
        { title: "Networking Fundamentals", category: "Learning Path", path: "learning-paths/networking/theory/networking.html", desc: "IP addressing, OSI model, TCP/IP, protocols, subnets" },
        { title: "Linux for Cybersecurity", category: "Learning Path", path: "learning-paths/linux/theory/linux.html", desc: "Linux commands, permissions, filesystem, process management" },
        { title: "Web Application Security", category: "Learning Path", path: "learning-paths/web-security/theory/web-security.html", desc: "OWASP Top 10, HTTP/S, auth, secure web development" },
        { title: "Python for Cybersecurity", category: "Learning Path", path: "learning-paths/python/theory/python-basics.html", desc: "Scripting, socket programming, network automation" },
        { title: "Ethical Hacking", category: "Learning Path", path: "learning-paths/ethical-hacking/theory/ethical-hacking.html", desc: "Methodology, reconnaissance, vulnerability assessment" },
        { title: "SOC & Blue Team", category: "Learning Path", path: "learning-paths/soc-blue-team/theory/soc-blue-team.html", desc: "Security operations, log monitoring, SIEM, threat hunting" },
        { title: "Incident Response", category: "Learning Path", path: "learning-paths/incident-response/theory/incident-response.html", desc: "Detection, containment, eradication, post-incident analysis" },
        { title: "Windows & System Security", category: "Learning Path", path: "learning-paths/windows/theory/windows.html", desc: "Windows internals, Active Directory, event logs, hardening" },
        { title: "Digital Forensics", category: "Learning Path", path: "learning-paths/digital-forensics/theory/digital-forensics.html", desc: "Evidence acquisition, disk forensics, artifact analysis" },
        { title: "Cybersecurity Tools", category: "Learning Path", path: "learning-paths/cybersecurity-tools/theory/cyber-tools.html", desc: "Nmap, Wireshark, Metasploit, Burp Suite, Sysinternals" },
        { title: "Practical Cybersecurity Labs", category: "Labs Hub", path: "learning-paths/labs/practical-labs.html", desc: "Hands-on browser labs and real-world exercises" },

        // Key Theory & Subtopics
        { title: "OSI Model Explained", category: "Networking", path: "learning-paths/networking/theory/osi-model.html", desc: "7 layers of computer networking and encapsulation" },
        { title: "TCP vs UDP", category: "Networking", path: "learning-paths/networking/theory/tcp-vs-udp.html", desc: "Connection-oriented vs connectionless transport protocols" },
        { title: "Subnetting & IP Addressing", category: "Networking", path: "learning-paths/networking/theory/subnetting.html", desc: "CIDR notation, subnet masks, network calculations" },
        { title: "Ports & Protocols", category: "Networking", path: "learning-paths/networking/theory/ports-protocols.html", desc: "Common ports (21, 22, 53, 80, 443, 3389) and protocols" },
        { title: "VPNs & Secure Tunnels", category: "Networking", path: "learning-paths/networking/theory/vpn.html", desc: "Virtual private networks, IPsec, OpenVPN, WireGuard" },
        { title: "VLANs & Segmentation", category: "Networking", path: "learning-paths/networking/theory/vlans.html", desc: "Virtual local area networks, 802.1Q tagging, isolation" },
        { title: "SQL Injection (SQLi)", category: "Web Security", path: "learning-paths/web-security/theory/sql-injection.html", desc: "Database exploitation, union attacks, parameterized queries" },
        { title: "Cross-Site Scripting (XSS)", category: "Web Security", path: "learning-paths/web-security/theory/xss.html", desc: "Stored, reflected, DOM-based XSS and output encoding" },
        { title: "Cross-Site Request Forgery (CSRF)", category: "Web Security", path: "learning-paths/web-security/theory/csrf.html", desc: "Session riding, anti-CSRF tokens, SameSite cookies" },
        { title: "Path Traversal Vulnerabilities", category: "Web Security", path: "learning-paths/web-security/theory/path-traversal.html", desc: "Directory traversal, path sanitization, canonicalization" },
        { title: "Authentication & Authorization", category: "Web Security", path: "learning-paths/web-security/theory/authentication-authorization.html", desc: "Session management, JWT, access control matrices, RBAC" },
        { title: "Security Headers", category: "Web Security", path: "learning-paths/web-security/theory/security-headers.html", desc: "CSP, HSTS, X-Content-Type-Options, X-Frame-Options" },
        { title: "SIEM & Log Analysis", category: "SOC Blue Team", path: "learning-paths/soc-blue-team/theory/siem.html", desc: "Security information and event management, correlation" },
        { title: "Indicators of Compromise (IOC)", category: "SOC Blue Team", path: "learning-paths/soc-blue-team/theory/ioc.html", desc: "Hashes, IP addresses, domains, Pyramid of Pain" },
        { title: "Windows Event Viewer & Logs", category: "Windows Security", path: "learning-paths/windows/theory/event-viewer.html", desc: "Security event IDs, authentication events, auditing" },
        { title: "PowerShell for Security", category: "Windows Security", path: "learning-paths/windows/theory/powershell.html", desc: "Admin automation, security auditing, incident triage" },

        // Latest Tutorials
        { title: "Understanding IP Addresses", category: "Tutorial", path: "tutorials/ip-addresses/ip-addresses.html", desc: "IPv4 vs IPv6, private vs public, CIDR and subnet basics" },
        { title: "Essential Linux Commands", category: "Tutorial", path: "tutorials/linux-command/linux-commands.html", desc: "Core command-line tools for security and sysadmin tasks" },
        { title: "HTTP Status Codes Explained", category: "Tutorial", path: "tutorials/status-code/http-status-codes.html", desc: "1xx, 2xx, 3xx, 4xx, 5xx codes and debugging web apps" },

        // Key Practical Labs
        { title: "SQL Injection Lab", category: "Practical Lab", path: "learning-paths/web-security/lab/sql-injection-lab.html", desc: "Hands-on practice finding and mitigating SQL injection" },
        { title: "XSS Defense Lab", category: "Practical Lab", path: "learning-paths/web-security/lab/xss-lab.html", desc: "Practice testing input validation and contextual output escaping" },
        { title: "Command Injection Lab", category: "Practical Lab", path: "learning-paths/web-security/lab/command-injection-lab.html", desc: "Analyze dangerous system command execution vulnerabilities" },
        { title: "IP Addresses Lab", category: "Practical Lab", path: "tutorials/ip-addresses/ip-addresses-lab.html", desc: "Interactive exercises for network address calculation" },
        { title: "Linux Commands Lab", category: "Practical Lab", path: "tutorials/linux-command/linux-commands-lab.html", desc: "Hands-on terminal commands simulation and challenges" },
        { title: "HTTP Status Codes Lab", category: "Practical Lab", path: "tutorials/status-code/http-status-codes-lab.html", desc: "Analyze client and server HTTP request/response codes" },

        // Account & General
        { title: "Student Dashboard", category: "Account", path: "dashboard/student-dashboard.html", desc: "Track course progress, completed labs, and metrics" },
        { title: "My Profile", category: "Account", path: "dashboard/profile.html", desc: "Manage personal information and security settings" },
        { title: "Sign In", category: "Auth", path: "auth/login.html", desc: "Access your CyberNexa account" },
        { title: "Create Account", category: "Auth", path: "auth/signup.html", desc: "Join CyberNexa for free cybersecurity education" },
        { title: "About CyberNexa", category: "Info", path: "footer/about.html", desc: "Our mission, educational principles, and platform info" },
        { title: "Contact Us", category: "Info", path: "footer/contact.html", desc: "Get in touch for questions, feedback, or collaborations" }
    ];

    function getBaseUrl() {
        if (window.CYBERNEXA_ROOT) {
            return window.CYBERNEXA_ROOT;
        }

        const placeholder = document.getElementById("navbar-placeholder");
        if (placeholder && placeholder.dataset.rootPath) {
            return new URL(placeholder.dataset.rootPath, window.location.href).href;
        }

        // Determine depth by counting segments from root
        const path = window.location.pathname;
        if (path.includes("/learning-paths/") || path.includes("/tutorials/")) {
            const depth = (path.match(/\//g) || []).length;
            // Best effort fallback
            const segments = path.split("/").filter(Boolean);
            const index = segments.findIndex(s => s === "learning-paths" || s === "tutorials" || s === "dashboard" || s === "auth" || s === "footer");
            if (index >= 0) {
                const upLevels = "../".repeat(segments.length - index);
                return new URL(upLevels, window.location.href).href;
            }
        }

        return new URL("./", window.location.href).href;
    }

    function initNavbar() {
        const menuToggle = document.querySelector(".menu-toggle");
        const menuButton = document.querySelector(".menu-button");
        const navigation = document.querySelector(".navigation");
        const searchButton = document.querySelector(".search-button");

        // Mobile menu toggle interactions
        if (menuToggle && menuButton && !menuButton.dataset.bound) {
            menuButton.dataset.bound = "true";

            menuButton.addEventListener("click", function () {
                setTimeout(function () {
                    const isOpen = menuToggle.checked;
                    menuButton.setAttribute("aria-expanded", String(isOpen));
                }, 0);
            });

            // Close menu on nav link click
            if (navigation) {
                navigation.querySelectorAll(".nav-item").forEach(function (link) {
                    link.addEventListener("click", function () {
                        if (window.innerWidth <= 1000 && menuToggle.checked) {
                            menuToggle.checked = false;
                            menuButton.setAttribute("aria-expanded", "false");
                        }
                    });
                });
            }

            // Close mobile menu on desktop resize
            window.addEventListener("resize", function () {
                if (window.innerWidth > 1000 && menuToggle.checked) {
                    menuToggle.checked = false;
                    menuButton.setAttribute("aria-expanded", "false");
                }
            });
        }

        // Search button interaction
        if (searchButton && !searchButton.dataset.bound) {
            searchButton.dataset.bound = "true";
            searchButton.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                openCyberNexaSearch();
            });
        }

        navbarInitialized = true;
    }

    /* =====================================================
       SEARCH MODAL SYSTEM
    ===================================================== */
    function createSearchOverlay() {
        if (document.querySelector(".cybernexa-search-overlay")) {
            return;
        }

        const overlay = document.createElement("div");
        overlay.className = "cybernexa-search-overlay";
        overlay.innerHTML = `
            <div class="cybernexa-search-box" role="dialog" aria-modal="true" aria-label="Search CyberNexa">
                <div class="cybernexa-search-header">
                    <div class="cybernexa-search-title">Search CyberNexa</div>
                    <button type="button" class="cybernexa-search-close" aria-label="Close search">✕</button>
                </div>
                <div class="cybernexa-search-input-wrap">
                    <span class="cybernexa-search-field-icon" aria-hidden="true">⌕</span>
                    <input
                        type="search"
                        class="cybernexa-search-field"
                        placeholder="Search courses, tutorials, labs, or topics..."
                        autocomplete="off"
                        spellcheck="false"
                        aria-label="Search query"
                    />
                </div>
                <div class="cybernexa-search-results" role="listbox"></div>
                <div class="cybernexa-search-footer">
                    <span>Press <kbd>ESC</kbd> to close</span>
                    <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const closeBtn = overlay.querySelector(".cybernexa-search-close");
        const searchInput = overlay.querySelector(".cybernexa-search-field");
        const resultsBox = overlay.querySelector(".cybernexa-search-results");

        closeBtn.addEventListener("click", closeCyberNexaSearch);

        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) {
                closeCyberNexaSearch();
            }
        });

        searchInput.addEventListener("input", function () {
            performSearch(searchInput.value.trim(), resultsBox);
        });

        searchInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                const firstResult = resultsBox.querySelector(".cybernexa-search-result");
                if (firstResult) {
                    firstResult.click();
                }
            }
        });
    }

    function openCyberNexaSearch() {
        createSearchOverlay();

        const overlay = document.querySelector(".cybernexa-search-overlay");
        const searchInput = overlay.querySelector(".cybernexa-search-field");
        const resultsBox = overlay.querySelector(".cybernexa-search-results");
        const menuToggle = document.querySelector(".menu-toggle");
        const menuButton = document.querySelector(".menu-button");

        // Close mobile menu if open
        if (menuToggle && menuToggle.checked) {
            menuToggle.checked = false;
            if (menuButton) menuButton.setAttribute("aria-expanded", "false");
        }

        overlay.classList.add("active");
        document.body.style.overflow = "hidden";

        // Prepopulate with top popular learning paths
        performSearch("", resultsBox);

        setTimeout(function () {
            searchInput.focus();
        }, 80);
    }

    function closeCyberNexaSearch() {
        const overlay = document.querySelector(".cybernexa-search-overlay");
        if (!overlay) return;

        overlay.classList.remove("active");
        document.body.style.overflow = "";

        const searchInput = overlay.querySelector(".cybernexa-search-field");
        const resultsBox = overlay.querySelector(".cybernexa-search-results");
        if (searchInput) searchInput.value = "";
        if (resultsBox) resultsBox.innerHTML = "";
    }

    function performSearch(query, resultsBox) {
        resultsBox.replaceChildren();
        const rootUrl = getBaseUrl();

        let matched = [];
        if (!query) {
            // Show featured paths by default
            matched = CYBERNEXA_TOPICS.slice(0, 8);
        } else {
            const q = query.toLowerCase();
            matched = CYBERNEXA_TOPICS.filter(function (item) {
                return (
                    item.title.toLowerCase().includes(q) ||
                    (item.desc && item.desc.toLowerCase().includes(q)) ||
                    (item.category && item.category.toLowerCase().includes(q))
                );
            }).slice(0, 10);
        }

        if (matched.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "cybernexa-search-empty";
            emptyState.textContent = `No learning paths or tutorials found for "${query}".`;
            resultsBox.appendChild(emptyState);
            return;
        }

        matched.forEach(function (item) {
            const a = document.createElement("a");
            a.className = "cybernexa-search-result";
            a.href = new URL(item.path, rootUrl).href;

            const headerRow = document.createElement("div");
            headerRow.className = "cybernexa-result-header";

            const title = document.createElement("span");
            title.className = "cybernexa-result-title";
            title.textContent = item.title;

            const badge = document.createElement("span");
            badge.className = "cybernexa-result-badge";
            badge.textContent = item.category;

            headerRow.append(title, badge);

            const desc = document.createElement("span");
            desc.className = "cybernexa-result-desc";
            desc.textContent = item.desc;

            a.append(headerRow, desc);
            resultsBox.appendChild(a);
        });
    }

    // Global keyboard listener for Escape and Ctrl+K / Cmd+K shortcuts
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            const overlay = document.querySelector(".cybernexa-search-overlay");
            if (overlay && overlay.classList.contains("active")) {
                closeCyberNexaSearch();
                return;
            }

            const menuToggle = document.querySelector(".menu-toggle");
            const menuButton = document.querySelector(".menu-button");
            if (menuToggle && menuToggle.checked) {
                menuToggle.checked = false;
                if (menuButton) menuButton.setAttribute("aria-expanded", "false");
            }
        }

        // Quick search hotkey: Cmd+K or Ctrl+K
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            const overlay = document.querySelector(".cybernexa-search-overlay");
            if (overlay && overlay.classList.contains("active")) {
                closeCyberNexaSearch();
            } else {
                openCyberNexaSearch();
            }
        }
    });

    // Run on initial DOMContentLoaded
    document.addEventListener("DOMContentLoaded", initNavbar);

    // Also run whenever shared navbar is loaded
    document.addEventListener("cybernexa:navbar-ready", initNavbar);

})();