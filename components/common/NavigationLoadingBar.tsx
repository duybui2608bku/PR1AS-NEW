"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Navigation Loading Bar Component
 * Shows a progress bar at the top of the page during navigation
 */
export default function NavigationLoadingBar() {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();

  // Handle page navigation loading
  useEffect(() => {
    // Show loading when pathname changes
    setIsNavigating(true);

    // Hide loading after a short delay (allows animation to complete)
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [pathname]);

  // Intercept link clicks to show loading immediately
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLAnchorElement;

      if (link && link.href) {
        const href = link.getAttribute("href");
        // Only show loading for internal links (not external URLs or anchors)
        if (
          href &&
          !href.startsWith("http") &&
          !href.startsWith("mailto:") &&
          !href.startsWith("tel:") &&
          !href.startsWith("#")
        ) {
          setIsNavigating(true);
        }
      }
    };

    // Add click listener to document
    document.addEventListener("click", handleLinkClick, true);

    return () => {
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        zIndex: 1001,
        backgroundColor: "transparent",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <div
        className="loading-progress-bar"
        style={{
          height: "100%",
          backgroundColor: "#FF385C",
          width: "100%",
          transform: "translateX(-100%)",
          animation: "loadingProgress 0.5s ease-out forwards",
        }}
      />
    </div>
  );
}
