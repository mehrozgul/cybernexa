
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  if (!signupForm) return;

  const supabaseClient = window.supabaseClient;

  const nameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("signupEmail");
  const passwordInput = document.getElementById("signupPassword");
  const confirmInput = document.getElementById("confirmPassword");
  const termsInput = document.getElementById("agreeTerms");
  const message = document.getElementById("signupMessage");

  const errors = {
    name: document.getElementById("nameError"),
    email: document.getElementById("signupEmailError"),
    password: document.getElementById("signupPasswordError"),
    confirm: document.getElementById("confirmError"),
    terms: document.getElementById("termsError")
  };

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Clear a field's error when changed
  nameInput.addEventListener("input", () => {
    errors.name.textContent = "";
    message.textContent = "";
  });

  emailInput.addEventListener("input", () => {
    errors.email.textContent = "";
    message.textContent = "";
  });

  passwordInput.addEventListener("input", () => {
    errors.password.textContent = "";
    if (confirmInput.value) {
      errors.confirm.textContent = "";
    }
    message.textContent = "";
  });

  confirmInput.addEventListener("input", () => {
    errors.confirm.textContent = "";
    message.textContent = "";
  });

  termsInput.addEventListener("change", () => {
    errors.terms.textContent = "";
    message.textContent = "";
  });

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

  // Connect Supabase and create account
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    Object.values(errors).forEach((element) => {
      element.textContent = "";
    });
    message.textContent = "";

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;
    const agreed = termsInput.checked;

    let valid = true;

    if (name.length < 2) {
      errors.name.textContent = "Please enter your full name.";
      valid = false;
    }

    if (!email) {
      errors.email.textContent = "Please enter your email address.";
      valid = false;
    } else if (!isValidEmail(email)) {
      errors.email.textContent = "Please enter a valid email address.";
      valid = false;
    }

    if (password.length < 8) {
      errors.password.textContent =
        "Password must be at least 8 characters.";
      valid = false;
    }

    if (!confirmPassword) {
      errors.confirm.textContent = "Please confirm your password.";
      valid = false;
    } else if (password !== confirmPassword) {
      errors.confirm.textContent = "Passwords do not match.";
      valid = false;
    }

    if (!agreed) {
      errors.terms.textContent =
        "Please accept the Terms of Service and Privacy Policy.";
      valid = false;
    }

    if (!valid) {
      message.textContent = "Please correct the errors above.";
      return;
    }

    const submitButton = signupForm.querySelector(
      'button[type="submit"]'
    );
    submitButton.disabled = true;
    submitButton.querySelector("span").textContent = "Creating Account...";
    if (!supabaseClient) {
      message.textContent = "Authentication service is not initialized. Please try again later.";
      submitButton.disabled = false;
      submitButton.querySelector("span").textContent = "Create Account";
      return;
    }

    message.textContent = "";

    try {
      const emailRedirectTo = new URL("login.html", window.location.href).href;

      const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name
          },
          emailRedirectTo
        }
      });
      if (error) {
        message.textContent = error.message;
        return;
      }

      if (data.user && !data.session) {
        message.textContent =
          "Account created. Please check your email to confirm your account.";
      } else if (data.user && data.session) {
        message.textContent =
          "Account created successfully. You can now sign in.";
        signupForm.reset();
      }
    } catch (error) {
      message.textContent =
        "Something went wrong. Please try again.";
      console.error("Signup error:", error);
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector("span").textContent = "Create Account";
    }
  });

  // Social sign-up is not integrated yet
  document.querySelectorAll(".social-button").forEach((button) => {
    button.addEventListener("click", () => {
      message.textContent =
        "Social sign-up is not available yet.";
    });
  });
});