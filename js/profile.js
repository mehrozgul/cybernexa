
/* =====================================================
   CYBERNEXA PROFILE PAGE
   Supabase Profile, Learning Progress & Account Security
===================================================== */

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", initializeProfile, {
        once: true
    });

    async function initializeProfile() {
        const client = window.supabaseClient;

        const statusBox = document.getElementById("profileStatus");
        const profileForm = document.getElementById("profileForm");
        const passwordForm = document.getElementById("passwordForm");

        if (!client || !profileForm || !statusBox) {
            console.error("Profile page initialization failed.");
            return;
        }

        let currentUser = null;
        let originalProfile = null;

        const fields = {
            full_name: document.getElementById("fullName"),
            phone: document.getElementById("phone"),
            country: document.getElementById("country"),
            university: document.getElementById("university"),
            degree: document.getElementById("degree"),
            semester: document.getElementById("semester")
        };

        function setStatus(message, type = "info") {
            statusBox.textContent = message;
            statusBox.dataset.type = type;
        }

        function setText(id, value) {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        }

        function makeElement(tag, className, text) {
            const element = document.createElement(tag);

            if (className) element.className = className;
            if (text !== undefined) element.textContent = text;

            return element;
        }

        function getAuthName(user) {
            return (
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split("@")[0] ||
                "Student"
            );
        }

        function getFormValues() {
            return {
                full_name: fields.full_name.value.trim(),
                phone: fields.phone.value.trim(),
                country: fields.country.value.trim(),
                university: fields.university.value.trim(),
                degree: fields.degree.value.trim(),
                semester: fields.semester.value
            };
        }

        function fillForm(profile) {
            fields.full_name.value = profile.full_name || "";
            fields.phone.value = profile.phone || "";
            fields.country.value = profile.country || "";
            fields.university.value = profile.university || "";
            fields.degree.value = profile.degree || "";
            fields.semester.value = profile.semester || "";
        }

        function updateOverview(profile) {
            const name = profile.full_name || getAuthName(currentUser);
            const email = currentUser.email || "Email unavailable";

            setText("overviewName", name);
            setText("overviewEmail", email);

            const avatar = document.getElementById("profileAvatar");
            if (avatar) {
                avatar.textContent = name.charAt(0).toUpperCase();
            }

            const studyDetails = [
                profile.degree,
                profile.university,
                profile.semester ? `Semester ${profile.semester}` : ""
            ].filter(Boolean);

            setText(
                "overviewStudy",
                studyDetails.length ? studyDetails.join(" · ") : "Student account"
            );

            document.title = `${name} | CyberNexa Profile`;
        }

        function formatDate(value) {
            if (!value) return "Not yet";

            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return "Not yet";

            return date.toLocaleString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit"
            });
        }

        function courseName(courseId) {
            return String(courseId)
                .replace(/[-_]+/g, " ")
                .replace(/\b\w/g, letter => letter.toUpperCase());
        }

        function safeLessonUrl(url) {
            if (typeof url !== "string" || !url.trim()) return null;

            if (
                !url.startsWith("../learning-paths/") &&
                !url.startsWith("../tutorials/")
            ) {
                return null;
            }

            try {
                const parsed = new URL(url, window.location.href);

                if (parsed.origin !== window.location.origin) return null;
                if (parsed.pathname.includes("/../")) return null;

                return url;
            } catch {
                return null;
            }
        }

        async function loadProfile(user) {
            const { data, error } = await client
                .from("profiles")
                .select(
                    "id, full_name, phone, country, university, degree, semester, updated_at"
                )
                .eq("id", user.id)
                .maybeSingle();

            if (error) throw error;

            let profile = data;

            // Create a profile row for existing users who do not have one.
            if (!profile) {
                const initialProfile = {
                    id: user.id,
                    full_name: getAuthName(user),
                    phone: "",
                    country: "",
                    university: "",
                    degree: "",
                    semester: ""
                };

                const { data: inserted, error: insertError } = await client
                    .from("profiles")
                    .insert(initialProfile)
                    .select(
                        "id, full_name, phone, country, university, degree, semester, updated_at"
                    )
                    .single();

                if (insertError) throw insertError;
                profile = inserted;
            }

            originalProfile = {
                full_name: profile.full_name || "",
                phone: profile.phone || "",
                country: profile.country || "",
                university: profile.university || "",
                degree: profile.degree || "",
                semester: profile.semester || ""
            };

            fillForm(originalProfile);
            updateOverview(originalProfile);
        }

        async function loadLearningSummary(user) {
            const courseList = document.getElementById("profileCourseList");

            setText("profileCompletedLessons", "—");
            setText("profileActivePaths", "—");
            setText("profileOverallProgress", "Not available");
            setText("profileLastActivity", "Not yet");

            if (courseList) {
                courseList.replaceChildren(
                    makeElement("p", "muted", "Loading learning paths...")
                );
            }

            const { data, error } = await client
                .from("student_course_progress")
                .select(
                    "course_id, completed_lessons, last_lesson_url, updated_at"
                )
                .eq("user_id", user.id);

            if (error) throw error;

            const courses = (data || [])
                .filter(row => typeof row.course_id === "string" && row.course_id.trim())
                .map(row => ({
                    id: row.course_id,
                    completed: Array.isArray(row.completed_lessons)
                        ? [...new Set(
                            row.completed_lessons.filter(
                                lesson => typeof lesson === "string"
                            )
                        )]
                        : [],
                    url: safeLessonUrl(row.last_lesson_url),
                    updatedAt: row.updated_at || null
                }));

            const completedTotal = courses.reduce(
                (total, course) => total + course.completed.length,
                0
            );

            setText("profileCompletedLessons", String(completedTotal));
            setText("profileActivePaths", String(courses.length));

            // The project has not configured accurate lesson totals yet.
            // Do not display a misleading percentage.
            setText("profileOverallProgress", "Not available");

            const latest = courses
                .map(course => course.updatedAt)
                .filter(Boolean)
                .sort((a, b) => new Date(b) - new Date(a))[0];

            setText("profileLastActivity", formatDate(latest));

            if (!courseList) return;

            courseList.replaceChildren();

            if (!courses.length) {
                courseList.appendChild(
                    makeElement(
                        "p",
                        "muted",
                        "No learning progress saved yet. Start a lesson to see your progress here."
                    )
                );
                return;
            }

            courses.sort((a, b) => {
                const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                return dateB - dateA;
            });

            courses.forEach(course => {
                const item = makeElement("article", "course-item");
                const info = makeElement("div");

                info.append(
                    makeElement("h3", "", courseName(course.id)),
                    makeElement(
                        "p",
                        "",
                        `Last saved: ${formatDate(course.updatedAt)}`
                    )
                );

                const count = makeElement(
                    "span",
                    "course-count",
                    `${course.completed.length} completed`
                );

                item.append(info, count);

                if (course.url) {
                    const link = makeElement("a", "text-link", "Continue →");
                    link.href = course.url;
                    item.appendChild(link);
                }

                courseList.appendChild(item);
            });
        }

        async function loadEverything() {
            setStatus("Checking your account...");

            const { data, error } = await client.auth.getSession();

            if (error) throw error;

            currentUser = data?.session?.user || null;

            if (!currentUser) {
                setStatus("Please log in to access your profile.", "error");

                profileForm.hidden = true;

                const loginLink = document.createElement("a");
                loginLink.className = "button button-primary";
                loginLink.href = "../auth/login.html";
                loginLink.textContent = "Go to Login";

                statusBox.appendChild(document.createTextNode(" "));
                statusBox.appendChild(loginLink);

                const summary = document.getElementById("learning-summary");
                const security = document.getElementById("account-security");

                if (summary) summary.hidden = true;
                if (security) security.hidden = true;

                return;
            }

            profileForm.hidden = false;

            const summary = document.getElementById("learning-summary");
            const security = document.getElementById("account-security");

            if (summary) summary.hidden = false;
            if (security) security.hidden = false;

            try {
                await loadProfile(currentUser);
                await loadLearningSummary(currentUser);
                setStatus("Your profile and learning summary are ready.", "success");
            } catch (error) {
                console.error("[CyberNexa Profile]", error);

                setStatus(
                    `Some account data could not be loaded: ${error.message || "Please try again."}`,
                    "error"
                );
            }
        }

        // Save personal information.
        profileForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            if (!currentUser) {
                setStatus("Please log in again before saving your profile.", "error");
                return;
            }

            const saveButton = document.getElementById("saveProfile");
            const values = getFormValues();

            if (!values.full_name) {
                fields.full_name.focus();
                setStatus("Please enter your full name.", "error");
                return;
            }

            saveButton.disabled = true;
            saveButton.textContent = "Saving...";

            try {
                const { data, error } = await client
                    .from("profiles")
                    .upsert(
                        {
                            id: currentUser.id,
                            ...values,
                            updated_at: new Date().toISOString()
                        },
                        { onConflict: "id" }
                    )
                    .select(
                        "id, full_name, phone, country, university, degree, semester, updated_at"
                    )
                    .single();

                if (error) throw error;

                originalProfile = {
                    full_name: data.full_name || "",
                    phone: data.phone || "",
                    country: data.country || "",
                    university: data.university || "",
                    degree: data.degree || "",
                    semester: data.semester || ""
                };

                fillForm(originalProfile);
                updateOverview(originalProfile);

                // Keep the navbar name in sync with the updated profile.
                if (
                    values.full_name !== getAuthName(currentUser) &&
                    values.full_name
                ) {
                    const { error: authError } = await client.auth.updateUser({
                        data: { full_name: values.full_name }
                    });

                    if (authError) {
                        console.warn(
                            "Profile saved, but the navbar metadata could not be updated:",
                            authError.message
                        );
                    } else {
                        const { data: refreshed } = await client.auth.getUser();
                        if (refreshed?.user) currentUser = refreshed.user;
                    }
                }

                setStatus("Your profile has been saved.", "success");
            } catch (error) {
                console.error("[CyberNexa Profile Save]", error);
                setStatus(
                    `Could not save your profile: ${error.message || "Please try again."}`,
                    "error"
                );
            } finally {
                saveButton.disabled = false;
                saveButton.textContent = "Save Changes";
            }
        });

        // Restore original values when Cancel is clicked.
        document.getElementById("cancelProfile").addEventListener("click", function () {
            if (originalProfile) {
                fillForm(originalProfile);
                updateOverview(originalProfile);
                setStatus("Your unsaved changes were cancelled.");
            }
        });

        // Toggle password form.
        document.getElementById("togglePasswordForm").addEventListener(
            "click",
            function () {
                passwordForm.hidden = !passwordForm.hidden;

                this.textContent = passwordForm.hidden
                    ? "Change Password"
                    : "Close Password Form";

                if (!passwordForm.hidden) {
                    document.getElementById("newPassword").focus();
                }
            }
        );

        document.getElementById("cancelPassword").addEventListener(
            "click",
            function () {
                passwordForm.reset();
                passwordForm.hidden = true;
                document.getElementById("togglePasswordForm").textContent =
                    "Change Password";
                setStatus("Password form closed.");
            }
        );

        // Change password through Supabase Auth.
        passwordForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const newPassword = document.getElementById("newPassword").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
            const saveButton = document.getElementById("savePassword");

            if (newPassword.length < 8) {
                setStatus("Your new password must contain at least 8 characters.", "error");
                return;
            }

            if (newPassword !== confirmPassword) {
                setStatus("The passwords do not match.", "error");
                return;
            }

            saveButton.disabled = true;
            saveButton.textContent = "Updating...";

            try {
                const { error } = await client.auth.updateUser({
                    password: newPassword
                });

                if (error) throw error;

                passwordForm.reset();
                passwordForm.hidden = true;
                document.getElementById("togglePasswordForm").textContent =
                    "Change Password";

                setStatus("Your password has been updated successfully.", "success");
            } catch (error) {
                console.error("[CyberNexa Password Update]", error);
                setStatus(
                    `Could not update your password: ${error.message || "Please try again."}`,
                    "error"
                );
            } finally {
                saveButton.disabled = false;
                saveButton.textContent = "Update Password";
            }
        });

        // Logout and redirect to the login page.
        document.getElementById("logoutButton").addEventListener(
            "click",
            async function () {
                const button = this;
                button.disabled = true;
                button.textContent = "Signing out...";

                try {
                    const { error } = await client.auth.signOut();
                    if (error) throw error;

                    window.location.href = "../auth/login.html";
                } catch (error) {
                    console.error("[CyberNexa Logout]", error);
                    setStatus(
                        `Could not sign out: ${error.message || "Please try again."}`,
                        "error"
                    );
                    button.disabled = false;
                    button.textContent = "Logout";
                }
            }
        );

        // Initial page load.
        await loadEverything();

        // Refresh profile and progress if auth state changes.
        client.auth.onAuthStateChange((event, session) => {
            setTimeout(async () => {
                if (session?.user) {
                    currentUser = session.user;
                    await loadEverything();
                } else {
                    currentUser = null;
                    await loadEverything();
                }
            }, 0);
        });
    }
})();