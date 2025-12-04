"use client";

import { useState, useEffect, Fragment } from "react";
import { Layout, Button, Avatar, Drawer } from "antd";
import { UserOutlined, MenuOutlined } from "@ant-design/icons";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import UserMenu from "@/components/common/UserMenu";
import { useTranslation } from "react-i18next";
import { authAPI } from "@/lib/auth/api-client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import SearchBar from "@/components/common/SearchBar";
import { showNotification } from "@/lib/utils/toast";

const { Header: AntHeader } = Layout;

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  const { settings } = useSiteSettings();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const profile = await authAPI.getProfile();
        if (mounted) {
          setIsAuthenticated(!!profile);
          setUserRole(profile?.role || null);
        }
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
          setUserRole(null);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Fragment>
      <AntHeader
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          width: "100%",
          backgroundColor: "#fff",
          borderBottom: "1px solid #f0f0f0",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          height: "80px",
        }}
      >
        {/* Logo */}
        <div className="flex-none lg:flex-1 flex justify-start">
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            {settings &&
            settings.headerLogo &&
            settings.headerLogo !== "/logo.png" ? (
              settings.headerLogo.startsWith("http") ? (
                // External URL (Supabase storage) - use unoptimized
                <Image
                  src={settings.headerLogo}
                  alt={settings.siteName || "Logo"}
                  width={102}
                  height={32}
                  style={{ objectFit: "contain", height: "auto" }}
                  unoptimized
                  priority
                />
              ) : (
                // Local path
                <Image
                  src={settings.headerLogo}
                  alt={settings.siteName || "Logo"}
                  width={102}
                  height={32}
                  style={{ objectFit: "contain", height: "auto" }}
                  priority
                />
              )
            ) : (
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "bold",
                  color: "#FF385C",
                  letterSpacing: "-0.5px",
                }}
                className="sm:text-2xl"
              >
                {settings?.siteName || "PR1AS"}
              </div>
            )}
          </Link>
        </div>

        {/* Search Bar - Centered */}
        <div className="hidden md:flex flex-1 justify-center px-8">
          <SearchBar />
        </div>

        {/* Desktop Menu */}
        <div className="flex-none lg:flex-1 flex justify-end items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            {/* Only show "Become Worker" button if user is logged in and is a client */}
            {isAuthenticated && userRole === "client" && (
              <Button
                type="text"
                style={{
                  fontWeight: 500,
                  color: "#222",
                  borderRadius: "22px",
                }}
                onClick={() => router.push("/worker/profile/setup")}
              >
                {t("header.becomeWorker")}
              </Button>
            )}

            <LanguageSwitcher />
          </div>

          {isAuthenticated ? (
            <div className="hidden md:block">
              <UserMenu />
            </div>
          ) : (
            <div
              className="hidden md:flex"
              style={{
                alignItems: "center",
                gap: "12px",
                padding: "5px 5px 5px 12px",
                border: "1px solid #ddd",
                borderRadius: "21px",
                cursor: "pointer",
                transition: "box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Link
                href="/auth/login"
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <MenuOutlined style={{ fontSize: "16px", color: "#222" }} />
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: "#717171" }}
                />
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <LanguageSwitcher />
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(true)}
              style={{ fontSize: "20px" }}
            />
          </div>
        </div>
      </AntHeader>

      {/* Mobile Drawer Menu */}
      <Drawer
        title={t("header.menu")}
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
      >
        <div className="flex flex-col gap-4">
          {/* Only show "Become Worker" for non-admin users */}
          {userRole !== "admin" && (
            <Button
              type="text"
              block
              size="large"
              style={{
                fontWeight: 500,
                color: "#222",
                textAlign: "left",
              }}
            >
              {t("header.becomeWorker")}
            </Button>
          )}

          {isAuthenticated ? (
            <Fragment>
              {/* Show dashboard link based on role */}
              {userRole && (
                <Link href={`/${userRole}/dashboard`}>
                  <Button
                    type="text"
                    block
                    size="large"
                    style={{ textAlign: "left" }}
                  >
                    {userRole === "admin"
                      ? t("header.userMenu.adminDashboard") || "Admin Dashboard"
                      : userRole === "worker"
                      ? t("header.userMenu.workerDashboard") ||
                        "Worker Dashboard"
                      : t("header.userMenu.dashboard") || "Dashboard"}
                  </Button>
                </Link>
              )}

              <Link href={`/${userRole || "client"}/profile`}>
                <Button
                  type="text"
                  block
                  size="large"
                  style={{ textAlign: "left" }}
                >
                  {t("header.userMenu.profile")}
                </Button>
              </Link>

              {/* Show different menu items based on role */}
              {userRole === "client" && (
                <Link href="/client/my-jobs">
                  <Button
                    type="text"
                    block
                    size="large"
                    style={{ textAlign: "left" }}
                  >
                    {t("header.userMenu.myJobs") || "My Jobs"}
                  </Button>
                </Link>
              )}

              {userRole === "worker" && (
                <Link href="/worker/my-jobs">
                  <Button
                    type="text"
                    block
                    size="large"
                    style={{ textAlign: "left" }}
                  >
                    {t("header.userMenu.myWork") || "My Work"}
                  </Button>
                </Link>
              )}

              {userRole === "admin" && (
                <Fragment>
                  <Link href="/admin/users">
                    <Button
                      type="text"
                      block
                      size="large"
                      style={{ textAlign: "left" }}
                    >
                      {t("admin.sidebar.users") || "User Management"}
                    </Button>
                  </Link>
                  <Link href="/admin/settings">
                    <Button
                      type="text"
                      block
                      size="large"
                      style={{ textAlign: "left" }}
                    >
                      {t("admin.sidebar.settings") || "Settings"}
                    </Button>
                  </Link>
                </Fragment>
              )}

              <Button
                type="text"
                block
                size="large"
                danger
                style={{ textAlign: "left" }}
                onClick={async () => {
                  try {
                    await authAPI.logout();
                    setIsAuthenticated(false);
                    setUserRole(null);
                    setMobileMenuOpen(false);
                    router.push("/");
                  } catch (error) {
                    showNotification.error(
                      "Đăng xuất thất bại",
                      "Vui lòng thử lại sau."
                    );
                  }
                }}
              >
                {t("header.userMenu.logout")}
              </Button>
            </Fragment>
          ) : (
            <Fragment>
              <Link href="/auth/login">
                <Button type="primary" block size="large">
                  {t("header.login")}
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button block size="large">
                  {t("header.signup")}
                </Button>
              </Link>
            </Fragment>
          )}
        </div>
      </Drawer>
    </Fragment>
  );
}
