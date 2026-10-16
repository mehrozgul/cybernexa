/* =====================================================
   CYBERNEXA STUDENT DASHBOARD
   Learning-Path Progress and Continue Learning
===================================================== */

(function () {
    "use strict";

    function initializeDashboard() {
        const status = document.getElementById("dashboardStatus");
        const progressByCourse = Object.create(null);
        let refreshing = false;

        /*
         * Replace null with the ACTUAL lesson count for each path.
         * IDs must match data-course-id in lesson completion buttons.
         */
        const COURSE_TOTALS = {
            cybersecurity: 20,
            "cybersecurity-tools": 10,
            "digital-forensics": 11,
            "ethical-hacking": 13,
            "incident-response": 10,
            linux: 12,
            networking: 20,
            python: 13,
            "soc-blue-team": 12,
            "web-security": 14,
            windows: 13
        };

        /*
         * Fallback URLs are used only when a course has no saved lesson URL.
         * Replace each URL with an existing landing-page HTML file if needed.
         */
        const COURSE_START_URLS = {
            cybersecurity: "../learning-paths/cybersecurity/",
            "cybersecurity-tools": "../learning-paths/cybersecurity-tools/",
            "digital-forensics": "../learning-paths/digital-forensics/",
            "ethical-hacking": "../learning-paths/ethical-hacking/",
            "incident-response": "../learning-paths/incident-response/",
            linux: "../learning-paths/linux/",
            networking: "../learning-paths/networking/",
            python: "../learning-paths/python/",
            "soc-blue-team": "../learning-paths/soc-blue-team/",
            "web-security": "../learning-paths/web-security/",
            windows: "../learning-paths/windows/"
        };

        const $ = id => document.getElementById(id);

        function setText(id, value) {
            const element = $(id);
            if (element) element.textContent = value;
        }

        function setStatus(message) {
            if (status) status.textContent = message;
        }

        function makeElement(tag, className, text) {
            const element = document.createElement(tag);

            if (className) element.className = className;
            if (text !== undefined) element.textContent = text;

            return element;
        }

        function safeLessonUrl(value) {
            if (typeof value !== "string" || !value.trim()) {
                return null;
            }

            const url = value.trim();

            // Only accept relative URLs.
            if (
                url.startsWith("/") ||
                url.startsWith("//") ||
                /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(url) ||
                url.includes("\\")
            ) {
                return null;
            }

            try {
                const parsed = new URL(url, window.location.href);

                if (parsed.origin !== window.location.origin) {
                    return null;
                }

                const rootPath = new URL("../", window.location.href).pathname;

                if (!parsed.pathname.startsWith(rootPath)) {
                    return null;
                }

                if (parsed.pathname.endsWith("/student-dashboard.html")) {
                    return null;
                }

                return url;
            } catch {
                return null;
            }
        }

        function formatCourseName(courseId) {
            return String(courseId)
                .replace(/[-_]+/g, " ")
                .replace(/\b\w/g, letter => letter.toUpperCase());
        }

        function formatDate(value) {
            if (!value) return "Not yet";

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                return "Not yet";
            }

            return date.toLocaleString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit"
            });
        }

        function getCourses() {
    return Object.keys(COURSE_TOTALS).map(id => {
        const data = progressByCourse[id] || {
            completed_lessons: [],
            last_lesson_url: null,
            updated_at: null
        };

        const configuredTotal = COURSE_TOTALS[id];

        const total = Number.isInteger(configuredTotal) &&
            configuredTotal >= 0
            ? configuredTotal
            : null;

        const completed = data.completed_lessons.length;

        return {
            id,
            name: formatCourseName(id),
            data,
            url: safeLessonUrl(data.last_lesson_url),
            startUrl: COURSE_START_URLS[id] || null,
            total,
            completed,
            percent: total > 0
                ? Math.min(100, Math.round((completed / total) * 100))
                : 0,
            active: Boolean(progressByCourse[id])
        };
    });
}
        function createProgressBar(percent, label) {
            const track = makeElement("div", "progress-track");

            track.setAttribute("role", "progressbar");
            track.setAttribute("aria-label", label);
            track.setAttribute("aria-valuemin", "0");
            track.setAttribute("aria-valuemax", "100");
            track.setAttribute("aria-valuenow", String(percent));

            const fill = makeElement("span");
            fill.style.width = percent + "%";

            track.appendChild(fill);

            return track;
        }

        function renderLearningPaths(courses) {
            const grid = $("learningPathGrid");
            if (!grid) return;

            grid.replaceChildren();

            if (!courses.length) {
                grid.appendChild(
                    makeElement(
                        "p",
                        "chart-note",
                        "No learning paths are configured yet."
                    )
                );
                return;
            }

            courses.forEach(course => {
                const card = makeElement(
                    "article",
                    "dashboard-panel learning-path-card"
                );

                const top = makeElement("div", "path-card-top");

                let iconClass = "security-icon";
                const iconSpan = makeElement("span", "path-icon " + iconClass);
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("viewBox", "0 0 24 24");
                svg.setAttribute("width", "18");
                svg.setAttribute("height", "18");
                svg.setAttribute("fill", "none");
                svg.setAttribute("stroke", "currentColor");
                svg.setAttribute("stroke-width", "2");
                svg.setAttribute("aria-hidden", "true");

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                if (course.id === "linux") {
                    iconClass = "linux-icon";
                    iconSpan.className = "path-icon " + iconClass;
                    path.setAttribute("d", "M8 21h8M12 17v4M7 9h10M7 12h5");
                    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    rect.setAttribute("x", "3");
                    rect.setAttribute("y", "4");
                    rect.setAttribute("width", "18");
                    rect.setAttribute("height", "13");
                    rect.setAttribute("rx", "2");
                    svg.appendChild(rect);
                } else if (course.id === "networking") {
                    iconClass = "network-icon";
                    iconSpan.className = "path-icon " + iconClass;
                    path.setAttribute("d", "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20");
                    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    circle.setAttribute("cx", "12");
                    circle.setAttribute("cy", "12");
                    circle.setAttribute("r", "10");
                    svg.appendChild(circle);
                } else if (course.id === "windows") {
                    iconClass = "windows-icon";
                    iconSpan.className = "path-icon " + iconClass;
                    path.setAttribute("d", "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18");
                } else {
                    path.setAttribute("d", "M12 2 20 5v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3Z");
                }
                svg.appendChild(path);
                iconSpan.appendChild(svg);

                top.append(
                    iconSpan,
                    makeElement(
                        "span",
                        "path-tag",
                        course.active ? "IN PROGRESS" : "READY TO START"
                    )
                );

                card.append(
                    top,
                    makeElement("h3", "", course.name),
                    makeElement(
                        "p",
                        "",
                        course.active
                            ? "Your progress is saved for this learning path."
                            : "Start this path to begin tracking your progress."
                    )
                );

                const progressRow = makeElement("div", "path-card-progress");

                progressRow.append(
                    makeElement(
                        "span",
                        "",
                        course.total === null
                            ? course.completed + " lesson(s) completed"
                            : Math.min(course.completed, course.total) +
                                  " / " +
                                  course.total +
                                  " lessons"
                    ),
                    makeElement(
                        "strong",
                        "",
                        course.total !== null && course.total > 0
                            ? course.percent + "%"
                            : "—"
                    )
                );

                card.append(
                    progressRow,
                    createProgressBar(
                        course.percent,
                        course.name + " progress"
                    )
                );

                if (course.total === null) {
                    card.appendChild(
                        makeElement(
                            "p",
                            "chart-note",
                            "Add this path's actual lesson total in COURSE_TOTALS to calculate its percentage."
                        )
                    );
                } else if (course.total === 0) {
                    card.appendChild(
                        makeElement(
                            "p",
                            "chart-note",
                            "Set a positive lesson total to calculate progress."
                        )
                    );
                }

                card.appendChild(
                    makeElement(
                        "p",
                        "chart-note",
                        course.active
                            ? "Last activity: " +
                                  formatDate(course.data.updated_at)
                            : "No saved activity yet."
                    )
                );

                const destination = course.url || course.startUrl;

                const link = makeElement(
                    "a",
                    "path-action",
                    course.url
                        ? "Continue Learning →"
                        : "Start Learning →"
                );

                link.setAttribute(
                    "aria-label",
                    (course.url ? "Continue " : "Start ") + course.name
                );

                if (destination) {
                    link.href = destination;
                } else {
                    link.href = "#learningPathsTitle";
                    link.addEventListener("click", event => {
                        event.preventDefault();
                        setStatus(
                            "Set the correct starting-page URL for " +
                                course.name +
                                " in COURSE_START_URLS."
                        );
                    });
                }

                card.appendChild(link);
                grid.appendChild(card);
            });
        }

        function renderDashboard() {
            const courses = getCourses();
            const activeCourses = courses.filter(course => course.active);

            const completedTotal = courses.reduce(
                (sum, course) => sum + course.completed,
                0
            );

            const totalsConfigured = courses.every(
                course => course.total !== null
            );

            const totalLessons = totalsConfigured
                ? courses.reduce((sum, course) => sum + course.total, 0)
                : null;

            setText("completedLessons", String(completedTotal));

            setText(
                "totalLessons",
                totalLessons === null ? "—" : String(totalLessons)
            );

            const overallPercent =
                totalLessons !== null && totalLessons > 0
                    ? Math.min(
                          100,
                          Math.round((completedTotal / totalLessons) * 100)
                      )
                    : 0;

            setText(
                "overallProgress",
                totalLessons !== null && totalLessons > 0
                    ? overallPercent + "%"
                    : "—"
            );

            if ($("overallProgressBar")) {
                $("overallProgressBar").style.width =
                    overallPercent + "%";
            }

            if ($("overallProgressTrack")) {
                $("overallProgressTrack").setAttribute(
                    "aria-valuenow",
                    String(overallPercent)
                );
            }

            setText("activePaths", String(activeCourses.length));

            const latestActivity = activeCourses
                .map(course => course.data.updated_at)
                .filter(Boolean)
                .sort((a, b) => new Date(b) - new Date(a))[0];

            setText("lastActivity", formatDate(latestActivity));

            // Only learning-path cards are rendered here.
            // The Learning Progress and Weekly Activity panels are not used.
            renderLearningPaths(courses);
        }

        function showSignInMessage() {
            setStatus("Please log in to view your saved learning progress.");

            [
                "overallProgress",
                "completedLessons",
                "totalLessons",
                "activePaths"
            ].forEach(id => setText(id, "—"));

            setText("lastActivity", "Not yet");

            if ($("overallProgressBar")) {
                $("overallProgressBar").style.width = "0%";
            }

            if ($("overallProgressTrack")) {
                $("overallProgressTrack").setAttribute(
                    "aria-valuenow",
                    "0"
                );
            }

            const grid = $("learningPathGrid");

            if (grid) {
                grid.replaceChildren(
                    makeElement(
                        "p",
                        "recent-empty",
                        "Log in to view your saved progress."
                    )
                );
            }
        }

        async function loadProgress() {
            const client = window.supabaseClient;

            if (!client) {
                throw new Error("Supabase client is unavailable.");
            }

            const {
                data: sessionData,
                error: sessionError
            } = await client.auth.getSession();

            if (sessionError) throw sessionError;

            const user = sessionData?.session?.user;

            Object.keys(progressByCourse).forEach(
                id => delete progressByCourse[id]
            );

            if (!user) {
                showSignInMessage();
                return;
            }

            setStatus("Loading your saved learning-path progress...");

            const { data, error } = await client
                .from("student_course_progress")
                .select(
                    "course_id, completed_lessons, last_lesson_url, updated_at"
                )
                .eq("user_id", user.id);

            if (error) throw error;

            (data || []).forEach(row => {
                const courseId = String(row.course_id || "").trim();

                if (!courseId) return;

                progressByCourse[courseId] = {
                    completed_lessons: Array.isArray(row.completed_lessons)
                        ? [
                              ...new Set(
                                  row.completed_lessons.filter(
                                      item => typeof item === "string"
                                  )
                              )
                          ]
                        : [],
                    last_lesson_url: safeLessonUrl(row.last_lesson_url),
                    updated_at: row.updated_at || null
                };
            });

            renderDashboard();
            setStatus("Your learning-path progress has been loaded.");
        }

        async function refreshDashboard() {
            if (refreshing) return;

            refreshing = true;

            try {
                await loadProgress();
            } catch (error) {
                console.error("[CyberNexa Dashboard]", error);

                setStatus(
                    "Could not load progress: " +
                        (error.message || "Check the browser console.")
                );
            } finally {
                refreshing = false;
            }
        }

        refreshDashboard();

        const client = window.supabaseClient;

        if (client) {
            client.auth.onAuthStateChange(() => {
                setTimeout(refreshDashboard, 0);
            });
        }

        document.addEventListener(
            "cybernexa:progress-saved",
            refreshDashboard
        );

        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) refreshDashboard();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeDashboard,
            { once: true }
        );
    } else {
        initializeDashboard();
    }
})();