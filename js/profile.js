/* =====================================================
   CYBERNEXA PROFILE PAGE
   Supabase Profile, Avatar Upload, Email Edit,
   Learning Progress & Advanced Account Security
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
            semester: document.getElementById("semester"),
            email: document.getElementById("email")
        };

        function setStatus(message, type = "info") {
            statusBox.textContent = message;
            statusBox.dataset.type = type;
            statusBox.className = "status-message visible status-" + type;
            
            // Auto-scroll into view if needed
            if (type === "error" || type === "success") {
                statusBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
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

        /* =====================================================
           AVATAR IMAGE HANDLING
        ===================================================== */
        function renderAvatar(imageUrl, fallbackName) {
            const avatar = document.getElementById("profileAvatar");
            const removeBtn = document.getElementById("removeAvatarBtn");
            if (!avatar) return;

            if (imageUrl) {
                avatar.style.backgroundImage = `url("${imageUrl}")`;
                avatar.style.backgroundSize = "cover";
                avatar.style.backgroundPosition = "center";
                avatar.textContent = "";
                avatar.classList.add("has-image");
                if (removeBtn) removeBtn.hidden = false;
            } else {
                avatar.style.backgroundImage = "";
                avatar.textContent = (fallbackName || "S").charAt(0).toUpperCase();
                avatar.classList.remove("has-image");
                if (removeBtn) removeBtn.hidden = true;
            }
        }

        function getStoredAvatar(userId) {
            return localStorage.getItem("cybernexa_avatar_" + userId) || null;
        }

        function setStoredAvatar(userId, dataUrl) {
            if (dataUrl) {
                try {
                    localStorage.setItem("cybernexa_avatar_" + userId, dataUrl);
                } catch (e) {
                    console.warn("Could not save avatar in localStorage:", e);
                }
            } else {
                localStorage.removeItem("cybernexa_avatar_" + userId);
            }
        }

        function setupAvatarUpload(user) {
            const fileInput = document.getElementById("avatarFileInput");
            const removeBtn = document.getElementById("removeAvatarBtn");

            if (fileInput) {
                fileInput.addEventListener("change", async function (e) {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    if (!file.type.startsWith("image/")) {
                        setStatus("Please select a valid image file (PNG, JPG, WEBP).", "error");
                        return;
                    }

                    if (file.size > 2 * 1024 * 1024) {
                        setStatus("Image size must be less than 2MB.", "error");
                        return;
                    }

                    setStatus("Processing and optimizing image...", "info");

                    const reader = new FileReader();
                    reader.onload = async function (event) {
                        const img = new Image();
                        img.onload = async function () {
                            // Scale down using canvas to 200x200 max for high performance & fast load
                            const canvas = document.createElement("canvas");
                            const ctx = canvas.getContext("2d");
                            const maxDim = 200;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                                if (width > maxDim) {
                                    height = Math.round((height * maxDim) / width);
                                    width = maxDim;
                                }
                            } else {
                                if (height > maxDim) {
                                    width = Math.round((width * maxDim) / height);
                                    height = maxDim;
                                }
                            }

                            canvas.width = width;
                            canvas.height = height;
                            ctx.drawImage(img, 0, 0, width, height);

                            const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);

                            // Update UI immediately
                            renderAvatar(optimizedDataUrl, getAuthName(user));
                            setStoredAvatar(user.id, optimizedDataUrl);

                            // Save to Supabase user metadata
                            try {
                                const { error } = await client.auth.updateUser({
                                    data: { avatar_url: optimizedDataUrl }
                                });
                                if (error) {
                                    console.warn("Avatar saved locally, auth metadata update warning:", error.message);
                                }
                                setStatus("Profile photo updated successfully!", "success");
                            } catch (err) {
                                console.warn("Failed to update user_metadata for avatar:", err);
                                setStatus("Profile photo saved on your browser.", "success");
                            }
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                });
            }

            if (removeBtn) {
                removeBtn.addEventListener("click", async function () {
                    const confirmRemove = confirm("Are you sure you want to remove your custom profile photo?");
                    if (!confirmRemove) return;

                    setStoredAvatar(user.id, null);
                    renderAvatar(null, getAuthName(user));

                    try {
                        await client.auth.updateUser({
                            data: { avatar_url: null }
                        });
                        setStatus("Profile photo removed. Restored standard initial avatar.", "info");
                    } catch (err) {
                        console.warn("Could not clear avatar in user_metadata:", err);
                        setStatus("Profile photo removed locally.", "info");
                    }
                });
            }
        }

        /* =====================================================
           EMAIL EDITING & VERIFICATION
        ===================================================== */
        function setupEmailEditing() {
            const toggleBtn = document.getElementById("toggleChangeEmailBtn");
            const box = document.getElementById("changeEmailBox");
            const newEmailInput = document.getElementById("newEmailInput");
            const submitBtn = document.getElementById("submitEmailChange");
            const cancelBtn = document.getElementById("cancelEmailChange");

            if (!toggleBtn || !box || !newEmailInput || !submitBtn || !cancelBtn) return;

            toggleBtn.addEventListener("click", function () {
                const isHidden = box.hidden;
                box.hidden = !isHidden;
                if (!box.hidden) {
                    newEmailInput.focus();
                }
            });

            cancelBtn.addEventListener("click", function () {
                box.hidden = true;
                newEmailInput.value = "";
            });

            submitBtn.addEventListener("click", async function () {
                const newEmail = newEmailInput.value.trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!newEmail || !emailRegex.test(newEmail)) {
                    setStatus("Please enter a valid new email address.", "error");
                    newEmailInput.focus();
                    return;
                }

                if (newEmail.toLowerCase() === (currentUser?.email || "").toLowerCase()) {
                    setStatus("New email cannot be the same as your current email.", "error");
                    newEmailInput.focus();
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.textContent = "Sending...";

                try {
                    const { data, error } = await client.auth.updateUser({
                        email: newEmail
                    });

                    if (error) throw error;

                    box.hidden = true;
                    newEmailInput.value = "";
                    setStatus(
                        `Verification email sent to "${newEmail}"! Please check your inbox and click the confirmation link to complete the email change.`,
                        "success"
                    );
                    const hint = document.getElementById("emailStatusHint");
                    if (hint) {
                        hint.textContent = `Pending verification for: ${newEmail}. Please check your inbox.`;
                        hint.style.color = "#38bdf8";
                    }
                } catch (error) {
                    console.error("[CyberNexa Email Change]", error);
                    setStatus(`Could not update email: ${error.message || "Please try again later."}`, "error");
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Update Email";
                }
            });
        }

        /* =====================================================
           PASSWORD STRENGTH METER & SECURITY ENHANCEMENTS
        ===================================================== */
        function setupPasswordSecurity() {
            const newPassword = document.getElementById("newPassword");
            const confirmPassword = document.getElementById("confirmPassword");
            const matchHint = document.getElementById("passwordMatchHint");
            const strengthBarFill = document.getElementById("strengthBarFill");
            const strengthLabel = document.getElementById("strengthLabel");

            const ruleLength = document.getElementById("ruleLength");
            const ruleUpper = document.getElementById("ruleUpper");
            const ruleLower = document.getElementById("ruleLower");
            const ruleNumber = document.getElementById("ruleNumber");
            const ruleSpecial = document.getElementById("ruleSpecial");

            // Password Show/Hide Toggle Buttons
            document.querySelectorAll(".password-toggle-btn").forEach(btn => {
                btn.addEventListener("click", function () {
                    const targetId = this.dataset.target;
                    const input = document.getElementById(targetId);
                    if (!input) return;

                    const isPassword = input.type === "password";
                    input.type = isPassword ? "text" : "password";

                    // Update SVG icon
                    if (isPassword) {
                        this.innerHTML = '<svg class="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
                        this.setAttribute("aria-label", "Hide password");
                    } else {
                        this.innerHTML = '<svg class="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
                        this.setAttribute("aria-label", "Show password");
                    }
                });
            });

            function updateRule(elem, passed) {
                if (!elem) return;
                elem.classList.toggle("passed", passed);
                elem.querySelector("span").textContent = passed ? "✓" : "✕";
            }

            function evaluatePassword(pwd) {
                const hasLength = pwd.length >= 8;
                const hasUpper = /[A-Z]/.test(pwd);
                const hasLower = /[a-z]/.test(pwd);
                const hasNumber = /[0-9]/.test(pwd);
                const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

                updateRule(ruleLength, hasLength);
                updateRule(ruleUpper, hasUpper);
                updateRule(ruleLower, hasLower);
                updateRule(ruleNumber, hasNumber);
                updateRule(ruleSpecial, hasSpecial);

                let score = 0;
                if (hasLength) score += 1;
                if (hasUpper) score += 1;
                if (hasLower) score += 1;
                if (hasNumber) score += 1;
                if (hasSpecial) score += 1;

                if (!pwd) {
                    if (strengthBarFill) {
                        strengthBarFill.style.width = "0%";
                        strengthBarFill.className = "strength-bar-fill";
                    }
                    if (strengthLabel) {
                        strengthLabel.textContent = "Enter password";
                        strengthLabel.className = "";
                    }
                    return 0;
                }

                if (score <= 2) {
                    if (strengthBarFill) {
                        strengthBarFill.style.width = "25%";
                        strengthBarFill.className = "strength-bar-fill strength-weak";
                    }
                    if (strengthLabel) {
                        strengthLabel.textContent = "Weak (Increase complexity)";
                        strengthLabel.className = "text-danger";
                    }
                } else if (score === 3) {
                    if (strengthBarFill) {
                        strengthBarFill.style.width = "50%";
                        strengthBarFill.className = "strength-bar-fill strength-fair";
                    }
                    if (strengthLabel) {
                        strengthLabel.textContent = "Fair (Add numbers or symbols)";
                        strengthLabel.className = "text-warning";
                    }
                } else if (score === 4) {
                    if (strengthBarFill) {
                        strengthBarFill.style.width = "75%";
                        strengthBarFill.className = "strength-bar-fill strength-good";
                    }
                    if (strengthLabel) {
                        strengthLabel.textContent = "Good";
                        strengthLabel.className = "text-info";
                    }
                } else {
                    if (strengthBarFill) {
                        strengthBarFill.style.width = "100%";
                        strengthBarFill.className = "strength-bar-fill strength-strong";
                    }
                    if (strengthLabel) {
                        strengthLabel.textContent = "Strong Passphrase ✓";
                        strengthLabel.className = "text-success";
                    }
                }
                return score;
            }

            function checkMatch() {
                const pwd = newPassword.value;
                const confirm = confirmPassword.value;

                if (!confirm) {
                    matchHint.textContent = "";
                    matchHint.className = "password-match-hint";
                    return;
                }

                if (pwd === confirm) {
                    matchHint.textContent = "✓ Passwords match";
                    matchHint.className = "password-match-hint text-success";
                } else {
                    matchHint.textContent = "✕ Passwords do not match";
                    matchHint.className = "password-match-hint text-danger";
                }
            }

            if (newPassword) {
                newPassword.addEventListener("input", function () {
                    evaluatePassword(this.value);
                    checkMatch();
                });
            }

            if (confirmPassword) {
                confirmPassword.addEventListener("input", checkMatch);
            }

            // Global device logout
            const logoutAllBtn = document.getElementById("logoutAllDevicesBtn");
            if (logoutAllBtn) {
                logoutAllBtn.addEventListener("click", async function () {
                    const confirmAll = confirm("Are you sure you want to sign out from ALL active devices and browsers? You will need to log in again.");
                    if (!confirmAll) return;

                    this.disabled = true;
                    this.textContent = "Signing out all devices...";

                    try {
                        const { error } = await client.auth.signOut({ scope: "global" });
                        if (error) throw error;
                        window.location.href = "../auth/login.html?session=terminated";
                    } catch (err) {
                        console.error("[CyberNexa Global Logout]", err);
                        setStatus(`Could not sign out of all devices: ${err.message}`, "error");
                        this.disabled = false;
                        this.textContent = "Logout All Devices";
                    }
                });
            }
        }

        /* =====================================================
           PROFILE OVERVIEW & DETAILS
        ===================================================== */
        function updateOverview(profile) {
            const name = profile.full_name || getAuthName(currentUser);
            const email = currentUser?.email || "Email unavailable";

            setText("overviewName", name);
            setText("overviewEmail", email);

            if (fields.email) {
                fields.email.value = email;
            }

            // Check if user has avatar saved
            const avatarUrl = currentUser?.user_metadata?.avatar_url || getStoredAvatar(currentUser?.id);
            renderAvatar(avatarUrl, name);

            const studyDetails = [
                profile.degree,
                profile.university,
                profile.semester ? `Semester ${profile.semester}` : ""
            ].filter(Boolean);

            setText(
                "overviewStudy",
                studyDetails.length ? studyDetails.join(" · ") : "Student account"
            );

            // Update Security Panel items
            if (currentUser?.last_sign_in_at) {
                setText("securityLastSignIn", formatDate(currentUser.last_sign_in_at));
            } else {
                setText("securityLastSignIn", "Current Session Active");
            }

            if (currentUser?.email_confirmed_at) {
                setText("securityAuthStatus", "Verified & Protected ✓");
            }

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

            // Create profile row for users who do not have one yet
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
            setText("profileOverallProgress", "Active");

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
                setupAvatarUpload(currentUser);
                setupEmailEditing();
                setupPasswordSecurity();
                setStatus("Your profile and learning summary are ready.", "success");
            } catch (error) {
                console.error("[CyberNexa Profile]", error);

                setStatus(
                    `Some account data could not be loaded: ${error.message || "Please try again."}`,
                    "error"
                );
            }
        }

        // Save personal information
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

                // Keep the navbar name in sync with the updated profile
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

                setStatus("Your profile has been saved successfully.", "success");
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

        // Restore original values when Cancel is clicked
        document.getElementById("cancelProfile").addEventListener("click", function () {
            if (originalProfile) {
                fillForm(originalProfile);
                updateOverview(originalProfile);
                setStatus("Your unsaved changes were cancelled.");
            }
        });

        // Toggle password form
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

        // Change password through Supabase Auth with validation
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

                setStatus("Your password has been updated successfully with strong encryption.", "success");
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

        // Current session logout
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

        // Initial page load
        await loadEverything();

        // Refresh profile and progress if auth state changes
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
