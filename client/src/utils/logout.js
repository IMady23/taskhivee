// client/src/utils/logout.js
export function handleLogout() {
  try {
    // Clear all authentication-related data
    localStorage.removeItem("authToken");
    localStorage.removeItem("devsync_auth");
    sessionStorage.clear();
    
    // Clear any Firebase auth state
    if (window.firebase && window.firebase.auth) {
      window.firebase.auth().signOut();
    }
  } catch (err) {
    console.error("Logout error:", err);
  }

  // Redirect globally to landing page
  setTimeout(() => {
    window.location.replace("/");
  }, 300);
}
