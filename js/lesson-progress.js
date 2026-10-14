
/* =====================================================
   CYBERNEXA SHARED LESSON PROGRESS
   Saves current lesson and completed lessons to Supabase
===================================================== */

(function () {
    "use strict";

    const TABLE = "student_course_progress";
    const DASHBOARD_PATH = "/dashboard/student-dashboard.html";

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
            } catch (error) {
                showError("Could not save lesson completion.", error);
            } finally {
                isSaving = false;
                button.disabled = button.dataset.completed === "true";
            }
        });
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
