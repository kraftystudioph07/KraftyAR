// ==================== MOBILE MENU ====================
      const menuButton = document.getElementById("menuButton");
      const mobileMenu = document.getElementById("mobileMenu");

      menuButton.addEventListener("click", () => {
        const isOpen = menuButton.getAttribute("aria-expanded") === "true";
        menuButton.setAttribute("aria-expanded", String(!isOpen));
        mobileMenu.classList.toggle("hidden", isOpen);
        menuButton.setAttribute(
          "aria-label",
          isOpen ? "Open navigation menu" : "Close navigation menu",
        );
      });

      // Close mobile navigation after selecting a link.
      mobileMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          mobileMenu.classList.add("hidden");
          menuButton.setAttribute("aria-expanded", "false");
          menuButton.setAttribute("aria-label", "Open navigation menu");
        });
      });

      // ==================== LOGOUT ====================
      function logout() {
        /*
        TODO: Connect this function to your existing Firebase Authentication.

        Example:
          import { signOut } from "firebase/auth";
          await signOut(auth);

        After Firebase successfully signs the user out,
        redirect them to login.html.
      */

        window.location.href = "login.html";
      }

      // ==================== AUTHENTICATION PROTECTION ====================
      /*
      TODO: Add your existing Firebase Authentication state check here.

      Example concept:
        onAuthStateChanged(auth, (user) => {
          if (!user) {
            window.location.href = "login.html";
          }
        });

      Do NOT create another authentication system on this page.
      Connect this section to the Firebase Auth implementation
      already used by your Login Page.
    */