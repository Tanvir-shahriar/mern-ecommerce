import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component ensures that navigating to a new route
 * resets the scroll position to the top of the page immediately,
 * without interfering with the user's custom CSS smooth scroll behavior.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Save the current CSS scroll behavior
    const originalStyle = document.documentElement.style.scrollBehavior;
    // Set to auto temporarily to snap to the top instantly
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    // Restore original scroll behavior immediately
    document.documentElement.style.scrollBehavior = originalStyle;
  }, [pathname]);

  return null;
};
