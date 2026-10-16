"use strict";
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const loginMessage = document.getElementById("loginMessage");
  const forgotLink = document.getElementById("forgotLink");
  const submitButton = loginForm?.querySelector('button[type="submit"]');

  if (
    !loginForm || !emailInput || !passwordInput ||
    !emailError || !passwordError || !loginMessage
  ) {
    return;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function clearMessages() {
    emailError.textContent = "";
    passwordError.textContent = "";
    loginMessage.textContent = "";
  }

  emailInput.addEventListener("input", clearMessages);
  passwordInput.addEventListener("input", clearMessages);

  // Show / hide password
  document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.target);
      if (!input) return;

      const showPassword = input.type === "password";
      input.type = showPassword ? "text" : "password";

      button.classList.toggle("is-visible", showPassword);
      button.setAttribute(
        "aria-label",
        showPassword ? "Hide password" : "Show password"
      );
    });
  });

  // Login with Supabase
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let valid = true;

    if (!email) {
      emailError.textContent = "Please enter your email address.";
      valid = false;
    } else if (!isValidEmail(email)) {
      emailError.textContent = "Please enter a valid email address.";
      valid = false;
    }

    if (!password) {
      passwordError.textContent = "Please enter your password.";
      valid = false;
    }

    if (!valid) {
      loginMessage.textContent = "Please correct the errors above.";
      return;
    }

    if (!window.supabaseClient) {
      loginMessage.textContent =
        "Authentication is not initialized. Please check the Supabase setup.";
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.querySelector("span").textContent = "Signing In...";
    }

    try {
      const { data, error } =
        await window.supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          loginMessage.textContent =
            "Please verify your email before signing in.";
        } else {
          loginMessage.textContent =
            "Login failed. Please check your email and password.";
        }
        return;
      }

      if (data.user) {
        loginMessage.textContent = "Login successful. Redirecting...";
        window.location.href = "../index.html";
      }
    } catch (error) {
      console.error("Login error:", error);
      loginMessage.textContent =
        "Something went wrong. Please try again.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.querySelector("span").textContent = "Sign In";
      }
    }
  });

  // Forgot password page
  if (forgotLink) {
    forgotLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "forgot-password.html";
    });
  }

  // Google, GitHub and Microsoft OAuth
  document.querySelectorAll(".social-button").forEach((button) => {
    button.addEventListener("click", async () => {
      loginMessage.textContent = "";

      const providerMap = {
        google: "google",
        github: "github",
        microsoft: "azure"
      };

      const buttonType = [...button.classList].find((name) =>
        Object.hasOwn(providerMap, name)
      );

      const provider = providerMap[buttonType];

      if (!provider || !window.supabaseClient) {
        loginMessage.textContent =
          "Authentication is not configured correctly.";
        return;
      }

      try {
        const { error } =
          await window.supabaseClient.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: new URL("../index.html", window.location.href).href,
              ...(provider === "azure" ? { scopes: "email" } : {})
            }
          });

        if (error) {
          console.error("OAuth error:", error);
          loginMessage.textContent =
            "Unable to start sign-in. Please try again.";
        }
      } catch (error) {
        console.error("OAuth error:", error);
        loginMessage.textContent =
          "Something went wrong. Please try again.";
      }
    });
  });
});