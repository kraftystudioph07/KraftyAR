import './tailwind_theme/tailwind.css';
      // Initialize Lucide icons
      lucide.createIcons();

      // =========================================================
      // DOM ELEMENTS
      // =========================================================

      const loginForm = document.getElementById("loginForm");

      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");

      const rememberMe = document.getElementById("rememberMe");

      const togglePassword = document.getElementById("togglePassword");
      const passwordIcon = document.getElementById("passwordIcon");

      const forgotPasswordButton = document.getElementById("forgotPassword");

      const signInButton = document.getElementById("signInButton");

      const buttonText = document.getElementById("buttonText");

      const buttonSpinner = document.getElementById("buttonSpinner");

      const errorAlert = document.getElementById("errorAlert");

      const errorMessage = document.getElementById("errorMessage");

      const emailError = document.getElementById("emailError");

      const passwordError = document.getElementById("passwordError");

      // =========================================================
      // REMEMBER ME
      // =========================================================

      const rememberedEmail = localStorage.getItem("rememberedEmail");

      if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberMe.checked = true;
      }

      // =========================================================
      // PASSWORD VISIBILITY
      // =========================================================

      togglePassword.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";

        passwordInput.type = isPassword ? "text" : "password";

        togglePassword.setAttribute(
          "aria-label",
          isPassword ? "Hide password" : "Show password",
        );

        passwordIcon.setAttribute(
          "data-lucide",
          isPassword ? "eye-off" : "eye",
        );

        lucide.createIcons();
      });

      // =========================================================
      // ERROR HELPERS
      // =========================================================

      function clearErrors() {
        emailError.textContent = "";
        passwordError.textContent = "";

        emailError.classList.add("hidden");
        passwordError.classList.add("hidden");

        errorAlert.classList.add("hidden");
        errorMessage.textContent = "";
      }

      function showFieldError(element, message) {
        element.textContent = message;
        element.classList.remove("hidden");
      }

      function showAuthError(message) {
        errorMessage.textContent = message;
        errorAlert.classList.remove("hidden");

        errorAlert.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }

      // =========================================================
      // VALIDATION
      // =========================================================

      function validateForm() {
        clearErrors();

        let valid = true;

        const email = emailInput.value.trim();

        const password = passwordInput.value;

        // Email validation
        if (!email) {
          showFieldError(emailError, "Please enter your email address.");

          valid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          showFieldError(emailError, "Please enter a valid email address.");

          valid = false;
        }

        // Password validation
        if (!password) {
          showFieldError(passwordError, "Please enter your password.");

          valid = false;
        }

        return valid;
      }

      // =========================================================
      // LOADING STATE
      // =========================================================

      function setLoading(isLoading) {
        signInButton.disabled = isLoading;

        if (isLoading) {
          buttonText.textContent = "Signing in...";
          buttonSpinner.classList.remove("hidden");
        } else {
          buttonText.textContent = "Sign In";
          buttonSpinner.classList.add("hidden");
        }
      }

      // =========================================================
      // FIREBASE AUTHENTICATION
      // =========================================================

      /*
        ==============================================================
        FIREBASE AUTHENTICATION
        ==============================================================

        TODO:
        Connect Firebase Authentication here.

        For example, with Firebase modular SDK:

        import {
            getAuth,
            signInWithEmailAndPassword
        } from "firebase/auth";

        const auth = getAuth();

        Then inside handleLogin():

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        ==============================================================

        IMPORTANT:
        Never put Firebase service account credentials in this file.

        Firebase Web API configuration values are normally safe to
        include in frontend applications, but service account/private
        credentials must NEVER be exposed.

        ==============================================================

        */

      // =========================================================
      // LOGIN FUNCTION
      // =========================================================

      async function handleLogin(email, password) {
        /*
            ----------------------------------------------------------
            TEMPORARY PROTOTYPE
            ----------------------------------------------------------

            Firebase has not been initialized yet.

            Replace this section with:

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            After successful authentication:

                window.location.href = "index.html";

            ----------------------------------------------------------
            */

        // ------------------------------------------------------
        // DEMO MODE
        // ------------------------------------------------------
        // This timeout only demonstrates the loading state.
        // Remove it when Firebase Authentication is connected.

        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });

        //throw new Error("AUTH_NOT_CONFIGURED");
      }

      // =========================================================
      // LOGIN FORM SUBMIT
      // =========================================================

      loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        clearErrors();

        if (!validateForm()) {
          return;
        }

        const email = emailInput.value.trim();

        const password = passwordInput.value;

        // Remember only the email address
        if (rememberMe.checked) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        setLoading(true);

        try {
          await handleLogin(email, password);

          // Successful authentication
          window.location.href = "./home.html";
        } catch (error) {
          console.error("Login error:", error);

          // Firebase-specific errors can be mapped here.
          //
          // Example:
          //
          // if (error.code === "auth/invalid-credential") {
          //     message = "Email or password is incorrect.";
          // }

          let message =
            "Unable to sign in right now. Please check your connection and try again.";

          if (error.message === "AUTH_NOT_CONFIGURED") {
            message =
              "Authentication is not configured yet. Connect Firebase Authentication to enable sign in.";
          }

          showAuthError(message);

          setLoading(false);
        }
      });

      // =========================================================
      // FORGOT PASSWORD
      // =========================================================

      function forgotPassword() {
        /*
            TODO:
            Connect to Firebase Authentication password reset.

            Example:

            import {
                sendPasswordResetEmail
            } from "firebase/auth";

            await sendPasswordResetEmail(
                auth,
                email
            );
            */

        const email = emailInput.value.trim();

        if (!email) {
          showFieldError(emailError, "Enter your email address first.");

          emailInput.focus();

          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          showFieldError(emailError, "Please enter a valid email address.");

          emailInput.focus();

          return;
        }

        showAuthError(
          "Password reset is not connected yet. Connect Firebase Authentication to enable this feature.",
        );
      }

      forgotPasswordButton.addEventListener("click", forgotPassword);

      // =========================================================
      // CLEAR FIELD ERRORS WHEN USER TYPES
      // =========================================================

      emailInput.addEventListener("input", () => {
        emailError.classList.add("hidden");
        errorAlert.classList.add("hidden");
      });

      passwordInput.addEventListener("input", () => {
        passwordError.classList.add("hidden");
        errorAlert.classList.add("hidden");
      });

/* const loginForm = document.getElementById("loginForm");
      const errorMessage = document.getElementById("errorMessage");

      loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        /*
        TEMPORARY LOGIN

        Replace this section with
        Firebase Authentication.
      

        if (email === "admin@example.com" && password === "123456") {
          errorMessage.classList.add("hidden");

          window.location.href = "./dashboard.html";
        } else {
          errorMessage.classList.remove("hidden");
        }
      }); */