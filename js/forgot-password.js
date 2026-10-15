
document.addEventListener("DOMContentLoaded", () => {
  const supabase = window.supabaseClient;

  // Ensure the Supabase client is available.
  if (!supabase) {
    console.error("Supabase client is not initialized.");
    showMessage("forgotMessage", "Connection error. Please try again later.", "error");
    showMessage("resetMessage", "Connection error. Please try again later.", "error");
    return;
  }

  function showMessage(id, message, type = "success") {
    const element = document.getElementById(id);
    if (!element) return;

    element.textContent = message;
    element.style.color = type === "error" ? "var(--error)" : "var(--success)";
  }

  function showError(id, message) {
    const element = document.getElementById(id);
    if (element) element.textContent = message;
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Show/hide password buttons on the reset page.
  document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.target);
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      button.classList.toggle("is-visible", isPassword);
      button.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
      );
    });
  });

  // FORGOT PASSWORD: send recovery email.
  const forgotForm = document.getElementById("forgotPasswordForm");

  if (forgotForm) {
    const emailInput = document.getElementById("resetEmail");
    const submitButton = document.getElementById("sendResetButton");

    emailInput.addEventListener("input", () => {
      showError("resetEmailError", "");
      showMessage("forgotMessage", "");
    });

    forgotForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = emailInput.value.trim();
      showError("resetEmailError", "");
      showMessage("forgotMessage", "");

      if (!email) {
        showError("resetEmailError", "Email address is required.");
        emailInput.focus();
        return;
      }

      if (!validEmail(email)) {
        showError("resetEmailError", "Please enter a valid email address.");
        emailInput.focus();
        return;
      }

      submitButton.disabled = true;
      submitButton.querySelector("span").textContent = "Sending...";

      try {
        const redirectTo = new URL(
          "reset-password.html",
          window.location.href
        ).href;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo
        });

        if (error) throw error;

        showMessage(
          "forgotMessage",
          "If an account exists for this email, a password reset link will be sent. Please check your inbox and spam folder."
        );

        forgotForm.reset();
      } catch (error) {
        console.error("Password reset email error:", error);
        showMessage(
          "forgotMessage",
          error.message || "Unable to send reset link. Please try again.",
          "error"
        );
      } finally {
        submitButton.disabled = false;
        submitButton.querySelector("span").textContent = "Send Reset Link";
      }
    });
  }

  // RESET PASSWORD: validate the recovery session before enabling form.
  const resetForm = document.getElementById("newPasswordForm");

  if (resetForm) {
    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmNewPassword");
    const submitButton = document.getElementById("updatePasswordButton");

    let recoveryVerified = false;

    function enableRecoveryForm() {
      recoveryVerified = true;
      submitButton.disabled = false;
      showMessage("resetMessage", "Recovery link verified. You can set a new password.");
    }

    function invalidRecovery() {
      recoveryVerified = false;
      submitButton.disabled = true;
      showMessage(
        "resetMessage",
        "This reset link is invalid or expired. Please request a new one.",
        "error"
      );
    }

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasRecoveryHash = hashParams.get("type") === "recovery";
    const hasAuthCode = new URLSearchParams(window.location.search).has("code");

    // Supabase emits PASSWORD_RECOVERY after a valid recovery link is processed.
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        enableRecoveryForm();
      }
    });

    // Check for an active session associated with the recovery URL.
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        invalidRecovery();
        return;
      }

      if (data.session && (hasRecoveryHash || hasAuthCode)) {
        enableRecoveryForm();
      } else if (!recoveryVerified) {
        invalidRecovery();
      }
    });

    newPassword.addEventListener("input", () => {
      showError("newPasswordError", "");
      showMessage("resetMessage", "");
    });

    confirmPassword.addEventListener("input", () => {
      showError("confirmNewPasswordError", "");
      showMessage("resetMessage", "");
    });

    resetForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      showError("newPasswordError", "");
      showError("confirmNewPasswordError", "");

      if (!recoveryVerified) {
        invalidRecovery();
        return;
      }

      const password = newPassword.value;
      const confirmation = confirmPassword.value;

      if (password.length < 8) {
        showError("newPasswordError", "Password must be at least 8 characters.");
        newPassword.focus();
        return;
      }

      if (password !== confirmation) {
        showError("confirmNewPasswordError", "Passwords do not match.");
        confirmPassword.focus();
        return;
      }

      submitButton.disabled = true;
      submitButton.querySelector("span").textContent = "Updating...";

      try {
        const { error } = await supabase.auth.updateUser({
          password
        });

        if (error) throw error;

        showMessage(
          "resetMessage",
          "Your password has been updated. Redirecting to login..."
        );

        resetForm.reset();

        // End the recovery session after a successful password change.
        await supabase.auth.signOut();

        setTimeout(() => {
          window.location.href = "login.html?password=updated";
        }, 1800);
      } catch (error) {
        console.error("Password update error:", error);
        showMessage(
          "resetMessage",
          error.message || "Unable to update password. Please try again.",
          "error"
        );
        submitButton.disabled = false;
      } finally {
        submitButton.querySelector("span").textContent = "Update Password";
      }
    });
  }
});