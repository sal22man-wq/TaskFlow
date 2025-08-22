import { useEffect } from "react";
import { useLocation } from "wouter";

export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Also ensure any modal containers scroll to top
    const containers = document.querySelectorAll('[data-scroll-container], .overflow-auto, .overflow-y-auto, main');
    containers.forEach(container => {
      if (container.scrollTop > 0) {
        container.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    });

    // Add route transition class to body for animation
    document.body.classList.add('route-transition');
    setTimeout(() => {
      document.body.classList.remove('route-transition');
    }, 200);
  }, [location]);

  return null; // This component doesn't render anything
}