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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);

      // If switching to mobile, close sidebar
      if (mobile && mobileOpen) {
        setMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mobileOpen]);

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
