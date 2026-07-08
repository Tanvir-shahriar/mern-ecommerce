import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component ensures that navigating to a new route
 * resets the scroll position to the top of the page immediately,
 * without interfering with the user's custom CSS smooth scroll behavior.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY > 320);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateVisibility);
    };
  }, []);

  useEffect(() => {
    // Save the current CSS scroll behavior
    const originalStyle = document.documentElement.style.scrollBehavior;
    // Set to auto temporarily to snap to the top instantly
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    setIsVisible(false);
    // Restore original scroll behavior immediately
    document.documentElement.style.scrollBehavior = originalStyle;
  }, [pathname]);

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      type="button"
      className={`scroll-to-top-button${isVisible ? ' visible' : ''}`}
      onClick={handleScrollToTop}
      aria-label="Scroll to top"
    >
      <ArrowUp size={22} strokeWidth={2.4} />
    </button>
  );
};
