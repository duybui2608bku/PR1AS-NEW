import { useState, useEffect } from "react";

interface UseMobileSidebar {
  isMobile: boolean;
  collapsed: boolean;
  mobileOpen: boolean;
  setCollapsed: (value: boolean) => void;
  setMobileOpen: (value: boolean) => void;
  toggleSidebar: () => void;
  closeMobileSidebar: () => void;
}

export function useMobileSidebar(): UseMobileSidebar {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Initialize isMobile correctly - check window width immediately if available
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 992;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      // Note: We don't auto-close sidebar when switching to mobile
      // because sidebar is already hidden by default on mobile
    };

    // Only listen to resize events
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []); // Empty dependency array - only run on mount/unmount

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return {
    isMobile,
    collapsed,
    mobileOpen,
    setCollapsed,
    setMobileOpen,
    toggleSidebar,
    closeMobileSidebar,
  };
}
