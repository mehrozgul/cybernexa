
/* =========================================================
   CYBERNEXA SESSION & PROFILE NAVBAR
   Supports static and shared navbar
========================================================= */

let cyberNexaSessionInitialized = false;

async function initCyberNexaSession() {

    // Prevent duplicate initialization
    if (cyberNexaSessionInitialized) {
        return;
    }

    const profileNav = document.getElementById("profileNav");
    const menuToggle = document.getElementById("menu-toggle");

    if (!profileNav) {
        return;
    }

    const supabase = window.supabaseClient;
    cyberNexaSessionInitialized = true;

    // Root URL for links from nested pages
    const rootUrl = window.CYBERNEXA_ROOT ||
        new URL("./", window.location.href).href;

    function getUserName(user) {
        return (
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "User"
        );
    }

    // Show Login and Sign Up when user is logged out
    function showLoggedOut() {

        profileNav.replaceChildren();

        const login = document.createElement("a");
        login.href = new URL("auth/login.html", rootUrl).href;
        login.className = "nav-item profile-login";
        login.textContent = "Login";

        const signup = document.createElement("a");
        signup.href = new URL("auth/signup.html", rootUrl).href;
        signup.className = "nav-item profile-signup";
        signup.textContent = "Sign Up";

        profileNav.append(login, signup);
    }

    // Show Profile dropdown when user is logged in
    function showLoggedIn(user) {

        profileNav.replaceChildren();

        const wrapper = document.createElement("div");
        wrapper.className = "profile-dropdown";

        const profileButton = document.createElement("button");
        profileButton.type = "button";
        profileButton.className = "profile-trigger";
        profileButton.setAttribute("aria-expanded", "false");
        profileButton.setAttribute("aria-haspopup", "true");

        const profileIcon = document.createElement("span");
        profileIcon.className = "profile-avatar";
        profileIcon.textContent = getUserName(user).charAt(0).toUpperCase();

        const profileLabel = document.createElement("span");
        profileLabel.textContent = "Profile";

        const arrow = document.createElement("span");
        arrow.className = "profile-arrow";
        arrow.textContent = "⌄";

        profileButton.append(profileIcon, profileLabel, arrow);

        const menu = document.createElement("div");
        menu.className = "profile-menu";
        menu.hidden = true;

        const userName = document.createElement("div");
        userName.className = "profile-menu-name";
        userName.textContent = getUserName(user);

        const userEmail = document.createElement("div");
        userEmail.className = "profile-menu-email";
        userEmail.textContent = user.email || "Email unavailable";

        const accountStatus = document.createElement("div");
        accountStatus.className = "profile-menu-status";
        accountStatus.textContent = "Signed in";

        const separator = document.createElement("div");
        separator.className = "profile-menu-divider";

        const profilePageLink = document.createElement("a");
        profilePageLink.href = new URL("dashboard/profile.html", rootUrl).href;
        profilePageLink.className = "profile-menu-link";
        profilePageLink.textContent = "My Profile";

        const dashboardLink = document.createElement("a");
        dashboardLink.href = new URL("dashboard/student-dashboard.html", rootUrl).href;
        dashboardLink.className = "profile-menu-link";
        dashboardLink.textContent = "Student Dashboard";

        const logoutButton = document.createElement("button");
        logoutButton.type = "button";
        logoutButton.className = "profile-logout";
        logoutButton.textContent = "Logout";

        // Toggle Profile dropdown
        profileButton.addEventListener("click", function () {

            const isOpen = !menu.hidden;

            menu.hidden = isOpen;

            profileButton.setAttribute(
                "aria-expanded",
                String(!isOpen)
            );
        });

        // Logout user
        logoutButton.addEventListener("click", async function () {

            logoutButton.disabled = true;
            logoutButton.textContent = "Logging out...";

            const { error } = await supabase.auth.signOut();

            if (error) {

                console.error("Logout failed:", error.message);

                logoutButton.disabled = false;
                logoutButton.textContent = "Logout";

                alert("Logout failed. Please try again.");
            }
        });


        menu.append(
            userName,
            userEmail,
            accountStatus,
            separator,
            profilePageLink,
            dashboardLink,
            logoutButton
        );


        wrapper.append(profileButton, menu);
        profileNav.append(wrapper);
    }

    // Close dropdown when clicking outside Profile
    document.addEventListener("click", function (event) {

        if (!profileNav.contains(event.target)) {

            const menu = profileNav.querySelector(".profile-menu");
            const button = profileNav.querySelector(".profile-trigger");

            if (menu && button) {

                menu.hidden = true;

                button.setAttribute("aria-expanded", "false");
            }
        }
    });

    // Close mobile menu after selecting Profile controls
    profileNav.addEventListener("click", function (event) {


        if (
            event.target.closest(".profile-logout") ||
            event.target.closest(".profile-login") ||
            event.target.closest(".profile-signup") ||
            event.target.closest(".profile-menu-link")
        ) {
            if (menuToggle) {
                menuToggle.checked = false;
            }
        }

    });

    // If Supabase client is not loaded or available, show logged out fallback
    if (!supabase || !supabase.auth) {
        showLoggedOut();
        return;
    }

    // Restore current Supabase session
    const { data, error } = await supabase.auth.getSession();

    if (error) {

        console.error("Could not restore session:", error.message);

        showLoggedOut();

    } else if (data.session?.user) {

        showLoggedIn(data.session.user);

    } else {

        showLoggedOut();
    }

    // Listen for authentication changes
    supabase.auth.onAuthStateChange(function (event, session) {

        if (session?.user) {

            showLoggedIn(session.user);

        } else {

            showLoggedOut();
        }
    });
}
// Initialize static navbar on homepage,
// or wait for the shared navbar on subpages.
document.addEventListener("DOMContentLoaded", function () {

    const profileNav = document.getElementById("profileNav");
    const navbarPlaceholder = document.getElementById("navbar-placeholder");

    // Static navbar already exists
    if (profileNav) {
        initCyberNexaSession();
    }

    // Shared navbar will initialize after it loads
    else if (!navbarPlaceholder) {
        console.error("Profile container and navbar placeholder missing.");
    }
});

// Initialize shared navbar after loading
document.addEventListener(
    "cybernexa:navbar-ready",
    initCyberNexaSession
);