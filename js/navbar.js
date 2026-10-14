/* =========================================================
   CYBERNEXA NAVBAR JAVASCRIPT
   FINAL VERSION
   ---------------------------------------------------------
   Includes:
   - Mobile Hamburger Menu
   - Search Button
   - Search Overlay
   - Search Results
   - Escape to Close
   - Outside Click to Close
   - Mobile Menu Close
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const menuToggle =
        document.querySelector(".menu-toggle");

    const menuButton =
        document.querySelector(".menu-button");

    const navigation =
        document.querySelector(".navigation");

    const searchButton =
        document.querySelector(".search-button");


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    if (menuToggle && menuButton) {

        menuButton.addEventListener("click", function () {

            /*
             * Checkbox automatically controls the menu.
             * This prevents unwanted page jumping.
             */

            setTimeout(function () {

                if (menuToggle.checked) {

                    menuButton.setAttribute(
                        "aria-expanded",
                        "true"
                    );

                } else {

                    menuButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }

            }, 0);

        });


        /*
         * Close menu when a navigation link is clicked
         */

        if (navigation) {

            const navLinks =
                navigation.querySelectorAll(".nav-item");

            navLinks.forEach(function (link) {

                link.addEventListener("click", function () {

                    if (
                        window.innerWidth <= 1000 &&
                        menuToggle
                    ) {

                        menuToggle.checked = false;

                        menuButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }

                });

            });

        }


        /*
         * Close mobile menu when screen becomes desktop
         */

        window.addEventListener("resize", function () {

            if (
                window.innerWidth > 1000 &&
                menuToggle.checked
            ) {

                menuToggle.checked = false;

                menuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        });

    }


    /* =====================================================
       SEARCH SYSTEM
    ===================================================== */

    if (!searchButton) {
        return;
    }


    /*
     * Important:
     * Prevent the search button from behaving like
     * a normal link and jumping to the bottom/end.
     */

    searchButton.addEventListener("click", function (event) {

        event.preventDefault();

        event.stopPropagation();

        openCyberNexaSearch();

    });


    /* =====================================================
       CREATE SEARCH OVERLAY
    ===================================================== */

    function createSearchOverlay() {

        /*
         * If already created, do not create another one.
         */

        if (
            document.querySelector(
                ".cybernexa-search-overlay"
            )
        ) {

            return;

        }


        const overlay =
            document.createElement("div");

        overlay.className =
            "cybernexa-search-overlay";


        overlay.innerHTML = `

            <div
                class="cybernexa-search-box"
                role="dialog"
                aria-modal="true"
                aria-label="CyberNexa Search"
            >

                <div class="cybernexa-search-header">

                    <div class="cybernexa-search-title">
                        Search CyberNexa
                    </div>

                    <button
                        type="button"
                        class="cybernexa-search-close"
                        aria-label="Close Search"
                    >
                        ×
                    </button>

                </div>


                <input
                    type="search"
                    class="cybernexa-search-field"
                    placeholder="Search tutorials, topics, learning paths..."
                    autocomplete="off"
                    aria-label="Search CyberNexa"
                />


                <div
                    class="cybernexa-search-results"
                ></div>

            </div>

        `;


        document.body.appendChild(overlay);


        /* =================================================
           SEARCH ELEMENTS
        ================================================= */

        const closeButton =
            overlay.querySelector(
                ".cybernexa-search-close"
            );

        const searchInput =
            overlay.querySelector(
                ".cybernexa-search-field"
            );


        const resultsBox =
            overlay.querySelector(
                ".cybernexa-search-results"
            );


        /* =================================================
           CLOSE BUTTON
        ================================================= */

        closeButton.addEventListener(
            "click",
            function () {

                closeCyberNexaSearch();

            }
        );


        /* =================================================
           CLICK OUTSIDE SEARCH BOX
        ================================================= */

        overlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === overlay
                ) {

                    closeCyberNexaSearch();

                }

            }
        );


        /* =================================================
           SEARCH INPUT
        ================================================= */

        searchInput.addEventListener(
            "input",
            function () {

                performCyberNexaSearch(
                    searchInput.value.trim(),
                    resultsBox
                );

            }
        );


        /* =================================================
           ENTER KEY
        ================================================= */

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    const firstResult =
                        resultsBox.querySelector(
                            ".cybernexa-search-result"
                        );

                    if (firstResult) {

                        firstResult.click();

                    }

                }

            }
        );

    }


    /* =====================================================
       OPEN SEARCH
    ===================================================== */

    function openCyberNexaSearch() {

        createSearchOverlay();


        const overlay =
            document.querySelector(
                ".cybernexa-search-overlay"
            );


        const searchInput =
            overlay.querySelector(
                ".cybernexa-search-field"
            );


        /*
         * Close mobile menu first
         */

        if (
            menuToggle &&
            menuToggle.checked
        ) {

            menuToggle.checked = false;

            if (menuButton) {

                menuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }


        /*
         * Open overlay
         */

        overlay.classList.add("active");


        document.body.style.overflow =
            "hidden";


        /*
         * Focus search field
         */

        setTimeout(function () {

            searchInput.focus();

        }, 100);

    }


    /* =====================================================
       CLOSE SEARCH
    ===================================================== */

    function closeCyberNexaSearch() {

        const overlay =
            document.querySelector(
                ".cybernexa-search-overlay"
            );


        if (!overlay) {
            return;
        }


        overlay.classList.remove(
            "active"
        );


        document.body.style.overflow =
            "";


        /*
         * Clear search field
         */

        const searchInput =
            overlay.querySelector(
                ".cybernexa-search-field"
            );


        const resultsBox =
            overlay.querySelector(
                ".cybernexa-search-results"
            );


        if (searchInput) {
            searchInput.value = "";
        }


        if (resultsBox) {
            resultsBox.innerHTML = "";
        }

    }


    /* =====================================================
       SEARCH DATA
    ===================================================== */

    function getCyberNexaSearchItems() {

        const items = [];


        /*
         * Navigation links
         */

        document
            .querySelectorAll(
                ".nav-item[href]"
            )
            .forEach(function (link) {

                const text =
                    link.textContent.trim();

                const href =
                    link.getAttribute("href");


                if (
                    text &&
                    href &&
                    href !== "#"
                ) {

                    items.push({
                        title: text,
                        url: href
                    });

                }

            });


        /*
         * Learning Path cards
         */

        document
            .querySelectorAll(
                ".learning-card"
            )
            .forEach(function (card) {

                const titleElement =
                    card.querySelector("h3");

                const link =
                    card.querySelector("a[href]");


                if (
                    titleElement &&
                    link
                ) {

                    const title =
                        titleElement.textContent.trim();

                    const descriptionElement =
                        card.querySelector("p");

                    const description =
                        descriptionElement
                            ? descriptionElement.textContent.trim()
                            : "";


                    const url =
                        link.getAttribute("href");


                    if (
                        title &&
                        url
                    ) {

                        items.push({

                            title:
                                title,

                            description:
                                description,

                            url:
                                url

                        });

                    }

                }

            });


        /*
         * Tutorial links
         */

        document
            .querySelectorAll(
                'a[href*="tutorials/"]'
            )
            .forEach(function (link) {

                const text =
                    link.textContent.trim();

                const href =
                    link.getAttribute("href");


                if (
                    text &&
                    href
                ) {

                    items.push({

                        title:
                            text,

                        url:
                            href

                    });

                }

            });


        /*
         * Remove duplicate URLs
         */

        const uniqueItems = [];

        const usedUrls =
            new Set();


        items.forEach(function (item) {

            if (
                !usedUrls.has(item.url)
            ) {

                usedUrls.add(item.url);

                uniqueItems.push(item);

            }

        });


        return uniqueItems;

    }


    /* =====================================================
       PERFORM SEARCH
    ===================================================== */

    function performCyberNexaSearch(
        query,
        resultsBox
    ) {

        resultsBox.innerHTML = "";


        /*
         * Nothing typed
         */

        if (!query) {

            resultsBox.innerHTML = `
                <div class="cybernexa-search-empty">
                    Start typing to search CyberNexa.
                </div>
            `;

            return;

        }


        const items =
            getCyberNexaSearchItems();


        const normalizedQuery =
            query.toLowerCase();


        const matchedItems =
            items.filter(function (item) {

                const title =
                    item.title
                        .toLowerCase();

                const description =
                    (
                        item.description || ""
                    ).toLowerCase();


                return (
                    title.includes(
                        normalizedQuery
                    ) ||
                    description.includes(
                        normalizedQuery
                    )
                );

            });


        /*
         * No results
         */

        if (
            matchedItems.length === 0
        ) {

            resultsBox.innerHTML = `
                <div class="cybernexa-search-empty">
                    No results found for "${escapeCyberNexaHTML(query)}"
                </div>
            `;

            return;

        }


        /*
         * Display results
         */

        matchedItems
            .slice(0, 12)
            .forEach(function (item) {

                const result =
                    document.createElement("a");


                result.className =
                    "cybernexa-search-result";


                result.href =
                    item.url;


                result.textContent =
                    item.title;


                resultsBox.appendChild(
                    result
                );

            });

    }


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeCyberNexaHTML(text) {

        const div =
            document.createElement("div");

        div.textContent =
            text;

        return div.innerHTML;

    }


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                const overlay =
                    document.querySelector(
                        ".cybernexa-search-overlay"
                    );


                if (
                    overlay &&
                    overlay.classList.contains(
                        "active"
                    )
                ) {

                    closeCyberNexaSearch();

                    return;

                }


                if (
                    menuToggle &&
                    menuToggle.checked
                ) {

                    menuToggle.checked =
                        false;


                    if (menuButton) {

                        menuButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }

                }

            }

        }
    );

});