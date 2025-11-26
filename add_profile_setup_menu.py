"""
Script to add Profile Setup menu to UserMenu and Worker Dashboard
"""

# 1. Update UserMenu.tsx - add Profile Setup menu after Profile
with open(r'e:\PR1AS\components\common\UserMenu.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace - add profile-setup before settings
old_section = '''    {
      key: "profile",
      label: t("header.userMenu.profile"),
      icon: <IdcardOutlined />,
    },
    {
      key: "settings",
      label: t("header.userMenu.settings"),
      icon: <SettingOutlined />,
    },'''

new_section = '''    {
      key: "profile",
      label: t("header.userMenu.profile"),
      icon: <IdcardOutlined />,
    },
    // Only show Profile Setup for workers
    ...(user.role === "worker"
      ? [
          {
            key: "profile-setup",
            label: t("header.userMenu.profileSetup") || "Profile Setup",
            icon: <SettingOutlined />,
          },
        ]
      : []),
    {
      key: "settings",
      label: t("header.userMenu.settings"),
      icon: <SettingOutlined />,
    },'''

content = content.replace(old_section, new_section)

# Add handler for profile-setup
old_handler = '''  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") {
      handleLogout();
    } else if (key === "dashboard") {
      router.push(getDashboardUrl(user.role));
    } else if (key === "profile") {
      router.push(getProfileUrl(user.role));
    } else if (key === "settings") {
      router.push("/settings");
    }
  };'''

new_handler = '''  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") {
      handleLogout();
    } else if (key === "dashboard") {
      router.push(getDashboardUrl(user.role));
    } else if (key === "profile") {
      router.push(getProfileUrl(user.role));
    } else if (key === "profile-setup") {
      router.push("/worker/setup");
    } else if (key === "settings") {
      router.push("/settings");
    }
  };'''

content = content.replace(old_handler, new_handler)

with open(r'e:\PR1AS\components\common\UserMenu.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ UserMenu.tsx updated!")

# 2. Update Worker layout.tsx - add Profile Setup menu
with open(r'e:\PR1AS\app\worker\layout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_menu = '''  const menuItems: MenuItem[] = [
    getItem(
      t("worker.dashboard.title") || "Dashboard",
      "/worker/dashboard",
      <DashboardOutlined />
    ),
    getItem("My Wallet", "/worker/wallet", <WalletOutlined />),
    getItem("My Jobs", "/worker/my-jobs", <UnorderedListOutlined />),
    getItem(t("nav.profile") || "Profile", "/worker/profile", <UserOutlined />),
  ];'''

new_menu = '''  const menuItems: MenuItem[] = [
    getItem(
      t("worker.dashboard.title") || "Dashboard",
      "/worker/dashboard",
      <DashboardOutlined />
    ),
    getItem("Profile Setup", "/worker/setup", <UserOutlined />),
    getItem("My Wallet", "/worker/wallet", <WalletOutlined />),
    getItem("My Jobs", "/worker/my-jobs", <UnorderedListOutlined />),
    getItem(t("nav.profile") || "Profile", "/worker/profile", <UserOutlined />),
  ];'''

content = content.replace(old_menu, new_menu)

with open(r'e:\PR1AS\app\worker\layout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Worker layout.tsx updated!")
print("\n✅ All files updated successfully!")
