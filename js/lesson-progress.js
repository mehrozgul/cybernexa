
/* =====================================================
   CYBERNEXA SHARED LESSON PROGRESS
   Saves current lesson and completed lessons to Supabase
===================================================== */

(function () {
    "use strict";

    const TABLE = "student_course_progress";
    const DASHBOARD_PATH = "/dashboard/student-dashboard.html";

    // Mirror of COURSE_TOTALS in student-dashboard.js
    const COURSE_TOTALS_LOCAL = {
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
     * URLs are stored relative to the dashboard, not the
     * current lesson page. This is important for nested folders.
     */
    function safeLessonUrl(url) {
        if (typeof url !== "string" || !url.trim()) {
            return null;
        }

        const cleanedUrl = url.trim();

        // Only local relative URLs are accepted.
        if (
            cleanedUrl.startsWith("/") ||
            cleanedUrl.startsWith("//") ||
            cleanedUrl.includes("\\") ||
            /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(cleanedUrl)
        ) {
            return null;
        }

        try {
            const dashboardUrl = new URL(
                DASHBOARD_PATH,
                window.location.origin
            );

            const parsed = new URL(cleanedUrl, dashboardUrl);

            if (parsed.origin !== window.location.origin) {
                return null;
            }

            // Reject URLs that point outside the website root.
            if (!parsed.pathname.startsWith("/")) {
                return null;
            }

            if (parsed.pathname === DASHBOARD_PATH) {
                return null;
            }

            return cleanedUrl;
        } catch (error) {
            console.error("[CyberNexa Progress] Invalid lesson URL:", error);
            return null;
        }
    }

    function initializeLessonProgress() {
        document.querySelectorAll("[data-lesson-progress]").forEach(button => {
            if (button.dataset.progressInitialized === "true") return;

            button.dataset.progressInitialized = "true";
            setupLessonButton(button);
        });
    }

    async function setupLessonButton(button) {
        const courseId = button.dataset.courseId?.trim();
        const lessonId = button.dataset.lessonId?.trim();
        const lessonUrl = safeLessonUrl(
            button.dataset.dashboardUrl?.trim()
        );

        const statusId = button.dataset.statusId;
        const status = statusId
            ? document.getElementById(statusId)
            : button.parentElement?.querySelector("[role='status']");

        const originalText =
            button.textContent.trim() || "Mark Lesson Complete";

        const client = window.supabaseClient;
        let isSaving = false;

        function showStatus(message) {
            if (status) status.textContent = message;
        }

        function showError(message, error) {
            console.error("[CyberNexa Progress]", message, error);
            showStatus(`${message} ${error?.message || ""}`.trim());
        }

        function setCompleted() {
            button.textContent = "Lesson Completed";
            button.dataset.completed = "true";
        }

        if (!courseId || !lessonId || !lessonUrl) {
            button.disabled = true;
            showStatus("Lesson progress configuration is incomplete.");

            console.error(
                "[CyberNexa Progress] Check data-course-id, " +
                "data-lesson-id and data-dashboard-url.",
                {
                    courseId,
                    lessonId,
                    originalUrl: button.dataset.dashboardUrl,
                    validatedUrl: lessonUrl,
                    button
                }
            );
            return;
        }

        if (!client) {
            button.disabled = true;
            showStatus("Supabase client is unavailable.");
            console.error("[CyberNexa Progress] window.supabaseClient is missing.");
            return;
        }

        async function getCurrentUser() {
            const { data, error } = await client.auth.getSession();

            if (error) throw error;

            return data?.session?.user || null;
        }

        async function getCompletedLessons(userId) {
            const { data, error } = await client
                .from(TABLE)
                .select("completed_lessons")
                .eq("user_id", userId)
                .eq("course_id", courseId)
                .maybeSingle();

            if (error) throw error;

            return Array.isArray(data?.completed_lessons)
                ? [
                    ...new Set(
                        data.completed_lessons.filter(
                            item => typeof item === "string"
                        )
                    )
                ]
                : [];
        }

        async function saveProgress(userId, completedLessons) {
            const payload = {
                user_id: userId,
                course_id: courseId,
                completed_lessons: completedLessons,
                last_lesson_url: lessonUrl,
                updated_at: new Date().toISOString()
            };

            console.log("[CyberNexa Progress] Saving:", payload);

            const { error } = await client
                .from(TABLE)
                .upsert(payload, {
                    onConflict: "user_id,course_id"
                });

            if (error) throw error;

            document.dispatchEvent(
                new CustomEvent("cybernexa:progress-saved", {
                    detail: { courseId, lessonId, lessonUrl }
                })
            );
        }

        // Save the current lesson URL without completing it.
        button.disabled = true;
        button.textContent = "Checking Progress...";

        try {
            const user = await getCurrentUser();

            if (!user) {
                button.textContent = originalText;
                showStatus("Log in to save your learning progress.");
                return;
            }

            const completedLessons = await getCompletedLessons(user.id);

            if (completedLessons.includes(lessonId)) {
                setCompleted();
            } else {
                button.textContent = originalText;
            }

            await saveProgress(user.id, completedLessons);
            showStatus("Your current lesson is saved.");
        } catch (error) {
            button.textContent = originalText;
            showError("Could not save the current lesson.", error);
        } finally {
            button.disabled = button.dataset.completed === "true";
        }

        // Mark the lesson as completed when clicked.
        button.addEventListener("click", async function () {
            if (isSaving || button.dataset.completed === "true") return;

            isSaving = true;
            button.disabled = true;
            showStatus("Saving completed lesson...");

            try {
                const user = await getCurrentUser();

                if (!user) {
                    showStatus("Log in to save your learning progress.");
                    return;
                }

                const oldLessons = await getCompletedLessons(user.id);
                const completedLessons = [
                    ...new Set([...oldLessons, lessonId])
                ];

                await saveProgress(user.id, completedLessons);

                setCompleted();
                showStatus("Lesson completed! Your progress is saved.");

                // Check if the entire course is now complete.
                const totalLessons = COURSE_TOTALS_LOCAL[courseId];
                if (
                    totalLessons &&
                    completedLessons.length >= totalLessons
                ) {
                    showCourseCompletionCelebration(courseId);
                }
            } catch (error) {
                showError("Could not save lesson completion.", error);
            } finally {
                isSaving = false;
                button.disabled = button.dataset.completed === "true";
            }
        });
    }

    function showCourseCompletionCelebration(courseId) {
        const storageKey = "cnx-congrats-" + courseId;

        // Don't show twice for the same course.
        if (localStorage.getItem(storageKey)) return;
        localStorage.setItem(storageKey, "1");

        // Format course name from id (e.g. "web-security" -> "Web Security").
        const courseName = String(courseId)
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, l => l.toUpperCase());

        // Inject CSS once.
        if (!document.getElementById("cnx-congrats-style")) {
            const style = document.createElement("style");
            style.id = "cnx-congrats-style";
            style.textContent = `
                @keyframes cnxFloat {
                    0%   { transform: translateY(0)   rotate(0deg);   opacity: 1; }
                    100% { transform: translateY(-120vh) rotate(720deg); opacity: 0; }
                }
                .cnx-overlay {
                    position: fixed; inset: 0; z-index: 9999;
                    background: rgba(7,16,30,0.95);
                    display: flex; align-items: center; justify-content: center;
                    flex-direction: column; gap: 16px;
                    font-family: inherit; color: #fff; text-align: center;
                    padding: 24px;
                }
                .cnx-overlay h2 {
                    font-size: clamp(1.8rem, 5vw, 3rem);
                    color: #3b82f6; margin: 0;
                }
                .cnx-overlay p {
                    font-size: clamp(1rem, 3vw, 1.4rem);
                    color: #cbd5e1; margin: 0;
                }
                .cnx-emoji { font-size: clamp(3rem, 10vw, 5rem); line-height: 1; }
                .cnx-buttons { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
                .cnx-btn {
                    padding: 10px 24px; border-radius: 8px; border: none;
                    cursor: pointer; font-size: 1rem; font-weight: 600;
                    text-decoration: none; display: inline-block;
                    transition: opacity .2s;
                }
                .cnx-btn:hover { opacity: .85; }
                .cnx-btn-primary { background: #3b82f6; color: #fff; }
                .cnx-btn-secondary { background: #1e293b; color: #cbd5e1; border: 1px solid #334155; }
                .cnx-confetti-dot {
                    position: fixed; border-radius: 50%;
                    animation: cnxFloat linear infinite;
                    pointer-events: none;
                }
            `;
            document.head.appendChild(style);
        }

        // Build overlay.
        const overlay = document.createElement("div");
        overlay.className = "cnx-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", "Course completed");

        overlay.innerHTML = `
            <div class="cnx-emoji">🎉</div>
            <h2>Congratulations!</h2>
            <p>You completed <strong>${courseName}</strong>!</p>
            <div class="cnx-buttons">
                <a class="cnx-btn cnx-btn-primary"
                   href="../dashboard/student-dashboard.html">Go to Dashboard</a>
                <button class="cnx-btn cnx-btn-secondary" id="cnx-dismiss-btn">Continue</button>
            </div>
        `;

        // Confetti dots.
        const COLORS = ["#3b82f6","#60a5fa","#f59e0b","#34d399","#f472b6","#a78bfa"];
        for (let i = 0; i < 40; i++) {
            const dot = document.createElement("div");
            dot.className = "cnx-confetti-dot";
            const size = Math.random() * 10 + 6;
            dot.style.cssText = [
                `width:${size}px`, `height:${size}px`,
                `left:${Math.random() * 100}vw`,
                `top:${Math.random() * 100}vh`,
                `background:${COLORS[Math.floor(Math.random() * COLORS.length)]}`,
                `animation-duration:${Math.random() * 4 + 3}s`,
                `animation-delay:${Math.random() * 3}s`
            ].join(";");
            overlay.appendChild(dot);
        }

        document.body.appendChild(overlay);

        function dismiss() {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }

        overlay.querySelector("#cnx-dismiss-btn").addEventListener("click", dismiss);

        // Auto-dismiss after 10 seconds.
        setTimeout(dismiss, 10000);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeLessonProgress,
            { once: true }
        );
    } else {
        initializeLessonProgress();
    }
})();
