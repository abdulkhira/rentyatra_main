/**
 * Utility functions to manage browser history and prevent back navigation
 */

/**
 * Prevents back navigation by replacing the current history entry
 * This effectively removes the login page from browser history
 */
export const preventBackNavigation = () => {
  // Replace current history entry with the current page
  // This removes the login page from browser history
  window.history.replaceState(null, '', window.location.href);
  
  // Add a new history entry to prevent back button from working
  window.history.pushState(null, '', window.location.href);
  
  // Listen for popstate events and prevent back navigation
  const handlePopState = (event) => {
    // Push the current state again to prevent going back
    window.history.pushState(null, '', window.location.href);
  };
  
  // Add event listener
  window.addEventListener('popstate', handlePopState);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('popstate', handlePopState);
  };
};

/**
 * Clears browser history and prevents back navigation
 * More aggressive approach that completely disables back button
 */
export const clearHistoryAndPreventBack = () => {
  // Clear the entire history stack
  window.history.replaceState(null, '', window.location.href);
  
  // Add multiple history entries to make back navigation ineffective
  for (let i = 0; i < 10; i++) {
    window.history.pushState(null, '', window.location.href);
  }
  
  // Override the back button behavior
  const handlePopState = (event) => {
    // Always push forward to prevent going back
    window.history.pushState(null, '', window.location.href);
  };
  
  window.addEventListener('popstate', handlePopState);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('popstate', handlePopState);
  };
};

/**
 * Disables browser back button completely
 * This is the most aggressive approach
 * CRITICAL: Prevents logout and redirect on back button press
 */
export const disableBackButton = () => {
  // Override the history.back method
  const originalBack = window.history.back;
  window.history.back = () => {
    // Do nothing - effectively disable back button
    console.log('🚫 Back button disabled - preventing navigation');
  };
  
  // Override the history.go method for negative values
  const originalGo = window.history.go;
  window.history.go = (delta) => {
    if (delta < 0) {
      // Prevent going back
      console.log('🚫 Back navigation disabled - preventing history.go');
      return;
    }
    // Allow going forward
    originalGo.call(window.history, delta);
  };
  
  // CRITICAL: Handle popstate events - prevent back navigation AND logout
  const handlePopState = (event) => {
    console.log('🚫 popstate event detected - preventing back navigation');
    
    // CRITICAL: Ensure user stays logged in
    // Check if user is logged in before preventing navigation
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedUser = localStorage.getItem('user');
    
    if (isLoggedIn && storedUser) {
      // User is logged in - prevent back navigation and stay on current page
      console.log('✅ User is logged in - preventing back navigation to login page');
      // Push current state to prevent back navigation
      window.history.pushState(null, '', window.location.href);
      
      // CRITICAL: Prevent any redirect to login page
      // If we're on login page, redirect to home or dashboard
      if (window.location.pathname === '/login' || window.location.pathname === '/signup') {
        console.log('⚠️ On login page but user is logged in - redirecting to home');
        window.history.replaceState(null, '', '/');
        window.location.href = '/';
        return;
      }
    } else {
      // User is not logged in - allow normal navigation
      // But still prevent going back to login if already on login
      if (window.location.pathname === '/login' || window.location.pathname === '/signup') {
        console.log('🚫 Already on login page - preventing further back navigation');
        window.history.pushState(null, '', window.location.href);
      }
    }
  };
  
  // CRITICAL: Add popstate listener with capture to catch it early
  window.addEventListener('popstate', handlePopState, true);
  
  // CRITICAL: Also prevent default browser back behavior
  // Push initial state to prevent back navigation
  window.history.pushState(null, '', window.location.href);
  
  // Return cleanup function to restore original behavior
  return () => {
    window.history.back = originalBack;
    window.history.go = originalGo;
    window.removeEventListener('popstate', handlePopState, true);
  };
};
