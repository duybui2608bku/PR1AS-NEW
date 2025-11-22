"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import {
  Table,
  Card,
  Typography,
  Tag,
  Space,
  Button,
  Avatar,
  message,
  Modal,
  Input,
  Select,
  Tabs,
  Descriptions,
  Image,
  Divider,
} from "antd";
import {
  UserOutlined,
  ReloadOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  adminUserAPI,
  type User as ApiUser,
  type PendingWorker,
} from "@/lib/admin/user-api";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;
const { confirm } = Modal;

// Mapping service keys to Vietnamese names and descriptions
const serviceMapping: Record<string, { name: string; description: string }> = {
  // Homecare services
  "homecare-organizing": {
    name: "Dọn dẹp nhà cửa",
    description: "Dịch vụ sắp xếp và dọn dẹp nhà cửa ngăn nắp",
  },
  "homecare-cooking": {
    name: "Nấu ăn",
    description: "Dịch vụ nấu ăn với nhiều loại món ăn khác nhau",
  },
  "homecare-shopping": {
    name: "Đi chợ mua sắm",
    description: "Dịch vụ đi chợ và mua sắm hộ",
  },
  "homecare-laundry": {
    name: "Giặt giũ",
    description: "Dịch vụ giặt là và chăm sóc quần áo",
  },
  "homecare-cleaning": {
    name: "Vệ sinh nhà cửa",
    description: "Dịch vụ vệ sinh và làm sạch nhà cửa",
  },

  // Grooming services
  "grooming-hair": {
    name: "Làm tóc",
    description: "Dịch vụ làm tóc và chăm sóc tóc",
  },
  "grooming-makeup": {
    name: "Trang điểm",
    description: "Dịch vụ trang điểm chuyên nghiệp",
  },
  "grooming-nails": {
    name: "Làm móng",
    description: "Dịch vụ chăm sóc và làm đẹp móng tay, móng chân",
  },
  "grooming-nail": {
    name: "Làm móng",
    description: "Dịch vụ chăm sóc móng tay",
  },
  "grooming-facial": {
    name: "Chăm sóc da mặt",
    description: "Dịch vụ chăm sóc và làm đẹp da mặt",
  },
  "grooming-skincare": {
    name: "Chăm sóc da",
    description: "Dịch vụ chăm sóc và điều trị da",
  },
  "grooming-massage": {
    name: "Massage",
    description: "Dịch vụ massage thư giãn và trị liệu",
  },

  // Assistance services
  "assistance-interpreter": {
    name: "Phiên dịch",
    description: "Dịch vụ phiên dịch ngôn ngữ",
  },
  "assistance-personal": {
    name: "Trợ lý cá nhân",
    description: "Dịch vụ trợ lý cá nhân",
  },
  "assistance-onsite": {
    name: "Hỗ trợ tại chỗ",
    description: "Dịch vụ hỗ trợ chuyên nghiệp tại chỗ",
  },
  "assistance-virtual": {
    name: "Trợ lý ảo",
    description: "Dịch vụ trợ lý ảo từ xa",
  },
  "assistance-tour-guide": {
    name: "Hướng dẫn viên du lịch",
    description: "Dịch vụ hướng dẫn viên du lịch",
  },
  "assistance-tutor": {
    name: "Gia sư",
    description: "Dịch vụ gia sư và dạy kèm",
  },
  "assistance-driver": {
    name: "Tài xế",
    description: "Dịch vụ lái xe và đưa đón",
  },

  // Interpreter language pairs
  vi_to_en: {
    name: "Phiên dịch Việt - Anh",
    description: "Phiên dịch từ tiếng Việt sang tiếng Anh",
  },
  vi_to_ko: {
    name: "Phiên dịch Việt - Hàn",
    description: "Phiên dịch từ tiếng Việt sang tiếng Hàn",
  },
  vi_to_ja: {
    name: "Phiên dịch Việt - Nhật",
    description: "Phiên dịch từ tiếng Việt sang tiếng Nhật",
  },
  vi_to_zh: {
    name: "Phiên dịch Việt - Trung",
    description: "Phiên dịch từ tiếng Việt sang tiếng Trung",
  },
  en_to_vi: {
    name: "Phiên dịch Anh - Việt",
    description: "Phiên dịch từ tiếng Anh sang tiếng Việt",
  },
  en_to_ko: {
    name: "Phiên dịch Anh - Hàn",
    description: "Phiên dịch từ tiếng Anh sang tiếng Hàn",
  },
  en_to_ja: {
    name: "Phiên dịch Anh - Nhật",
    description: "Phiên dịch từ tiếng Anh sang tiếng Nhật",
  },
  en_to_zh: {
    name: "Phiên dịch Anh - Trung",
    description: "Phiên dịch từ tiếng Anh sang tiếng Trung",
  },
  ko_to_vi: {
    name: "Phiên dịch Hàn - Việt",
    description: "Phiên dịch từ tiếng Hàn sang tiếng Việt",
  },
  ko_to_en: {
    name: "Phiên dịch Hàn - Anh",
    description: "Phiên dịch từ tiếng Hàn sang tiếng Anh",
  },
  ko_to_ja: {
    name: "Phiên dịch Hàn - Nhật",
    description: "Phiên dịch từ tiếng Hàn sang tiếng Nhật",
  },
  ko_to_zh: {
    name: "Phiên dịch Hàn - Trung",
    description: "Phiên dịch từ tiếng Hàn sang tiếng Trung",
  },
  ja_to_vi: {
    name: "Phiên dịch Nhật - Việt",
    description: "Phiên dịch từ tiếng Nhật sang tiếng Việt",
  },
  ja_to_en: {
    name: "Phiên dịch Nhật - Anh",
    description: "Phiên dịch từ tiếng Nhật sang tiếng Anh",
  },
  ja_to_ko: {
    name: "Phiên dịch Nhật - Hàn",
    description: "Phiên dịch từ tiếng Nhật sang tiếng Hàn",
  },
  ja_to_zh: {
    name: "Phiên dịch Nhật - Trung",
    description: "Phiên dịch từ tiếng Nhật sang tiếng Trung",
  },
  zh_to_vi: {
    name: "Phiên dịch Trung - Việt",
    description: "Phiên dịch từ tiếng Trung sang tiếng Việt",
  },
  zh_to_en: {
    name: "Phiên dịch Trung - Anh",
    description: "Phiên dịch từ tiếng Trung sang tiếng Anh",
  },
  zh_to_ko: {
    name: "Phiên dịch Trung - Hàn",
    description: "Phiên dịch từ tiếng Trung sang tiếng Hàn",
  },
  zh_to_ja: {
    name: "Phiên dịch Trung - Nhật",
    description: "Phiên dịch từ tiếng Trung sang tiếng Nhật",
  },

  // Companionship services
  "companionship-level-1": {
    name: "Đồng hành Cấp 1",
    description:
      "Không tiếp xúc thể chất, trò chuyện thông thường, trang phục thoải mái",
  },
  "companionship-level-2": {
    name: "Đồng hành Cấp 2",
    description:
      "Không tiếp xúc thể chất, trò chuyện trí tuệ, trang phục bán chính thức",
  },
  "companionship-level-3": {
    name: "Đồng hành Cấp 3",
    description:
      "Cho phép tiếp xúc thể chất không thân mật, trò chuyện trí tuệ, trang phục chính thức",
  },
  "companionship-basic": {
    name: "Đồng hành cơ bản",
    description: "Dịch vụ đồng hành cơ bản",
  },
  "companionship-standard": {
    name: "Đồng hành tiêu chuẩn",
    description: "Dịch vụ đồng hành tiêu chuẩn",
  },
  "companionship-premium": {
    name: "Đồng hành cao cấp",
    description: "Dịch vụ đồng hành cao cấp",
  },
  "companionship-luxury": {
    name: "Đồng hành sang trọng",
    description: "Dịch vụ đồng hành sang trọng",
  },
};

// Helper function to get Vietnamese service name
const getServiceName = (nameKey?: string, slug?: string): string => {
  if (!nameKey && !slug) return "Dịch vụ không xác định";

  // Try to get from mapping first
  if (slug && serviceMapping[slug]) {
    return serviceMapping[slug].name;
  }

  // Try with name_key (convert to slug format)
  if (nameKey) {
    const slugFromKey = nameKey
      .replace(/^SERVICE_/, "")
      .toLowerCase()
      .replace(/_/g, "-");
    if (serviceMapping[slugFromKey]) {
      return serviceMapping[slugFromKey].name;
    }
  }

  // Fallback: format the text nicely
  const text = slug || nameKey || "";
  return text
    .replace(/^SERVICE_/, "")
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Helper function to get Vietnamese service description
const getServiceDescription = (
  nameKey?: string,
  slug?: string,
  fallbackDescription?: string
): string => {
  // Try to get from mapping first
  if (slug && serviceMapping[slug]) {
    return serviceMapping[slug].description;
  }

  // Try with name_key (convert to slug format)
  if (nameKey) {
    const slugFromKey = nameKey
      .replace(/^SERVICE_/, "")
      .toLowerCase()
      .replace(/_/g, "-");
    if (serviceMapping[slugFromKey]) {
      return serviceMapping[slugFromKey].description;
    }
  }

  // Return fallback description if provided
  return fallbackDescription || "";
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [pendingWorkers, setPendingWorkers] = useState<PendingWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("users");
  const [selectedWorker, setSelectedWorker] = useState<PendingWorker | null>(
    null
  );
  const [workerModalVisible, setWorkerModalVisible] = useState(false);
  const { t } = useTranslation();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminUserAPI.getAllUsers();
      if (response.error) {
        message.error(response.error);
      } else if (response.data) {
        setUsers(response.data.users);
      }
    } catch (error) {
      message.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingWorkers = useCallback(async () => {
    setPendingLoading(true);
    try {
      const response = await adminUserAPI.getPendingWorkers();
      if (response.error) {
        console.error("Pending workers error:", response.error);
        message.error(`Failed to load pending workers: ${response.error}`);
      } else if (response.data) {
        console.log("Pending workers loaded:", response.data.workers);
        setPendingWorkers(response.data.workers);
      }
    } catch (error) {
      console.error("Pending workers fetch error:", error);
      message.error("Failed to load pending workers");
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchPendingWorkers();
  }, [fetchUsers, fetchPendingWorkers]);

  const handleBanUser = (userId: string, email: string) => {
    confirm({
      title: t("admin.users.banUser") || "Ban User",
      icon: <ExclamationCircleOutlined />,
      content: `${
        t("admin.users.banUserConfirm") || "Are you sure you want to ban"
      } ${email}?`,
      okText: t("admin.users.yesBan") || "Yes, Ban",
      okType: "danger",
      cancelText: t("common.cancel") || "Cancel",
      onOk: async () => {
        try {
          const response = await adminUserAPI.banUser(userId);
          if (response.error) {
            message.error(response.error);
          } else {
            message.success(response.message || "User banned successfully");
            fetchUsers();
          }
        } catch (error) {
          message.error("Failed to ban user");
        }
      },
    });
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const response = await adminUserAPI.unbanUser(userId);
      if (response.error) {
        message.error(response.error);
      } else {
        message.success(response.message || "User unbanned successfully");
        fetchUsers();
      }
    } catch (error) {
      message.error("Failed to unban user");
    }
  };

  const handleDeleteUser = (userId: string, email: string) => {
    confirm({
      title: t("admin.users.deleteUser") || "Delete User",
      icon: <ExclamationCircleOutlined />,
      content: `${
        t("admin.users.deleteUserConfirm") ||
        "Are you sure you want to permanently delete"
      } ${email}? ${
        t("admin.users.deleteUserWarning") || "This action cannot be undone."
      }`,
      okText: t("admin.users.yesDelete") || "Yes, Delete",
      okType: "danger",
      cancelText: t("common.cancel") || "Cancel",
      onOk: async () => {
        try {
          const response = await adminUserAPI.deleteUser(userId);
          if (response.error) {
            message.error(response.error);
          } else {
            message.success(response.message || "User deleted successfully");
            fetchUsers();
          }
        } catch (error) {
          message.error("Failed to delete user");
        }
      },
    });
  };

  const handleApproveWorker = async (userId: string) => {
    try {
      const response = await adminUserAPI.approveWorker(userId);
      if (response.error) {
        message.error(response.error);
      } else {
        message.success(response.message || "Worker approved successfully");
        fetchPendingWorkers();
        fetchUsers();
      }
    } catch (error) {
      message.error("Failed to approve worker");
    }
  };

  const handleRejectWorker = (workerId: string, email: string) => {
    confirm({
      title: t("admin.users.rejectWorker") || "Reject Worker Application",
      icon: <ExclamationCircleOutlined />,
      content: `${
        t("admin.users.rejectWorkerConfirm") ||
        "Are you sure you want to reject"
      } ${email}'s worker application?`,
      okText: t("admin.users.yesReject") || "Yes, Reject",
      okType: "danger",
      cancelText: t("common.cancel") || "Cancel",
      onOk: async () => {
        message.success("Worker application rejected");
        fetchPendingWorkers();
      },
    });
  };

  const showWorkerDetails = (worker: PendingWorker) => {
    setSelectedWorker(worker);
    setWorkerModalVisible(true);
  };

  const userColumns: ColumnsType<ApiUser> = [
    {
      title: t("admin.users.user") || "User",
      dataIndex: "email",
      key: "email",
      render: (email: string, record: ApiUser) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.user_metadata?.full_name || "No name"}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>{email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: t("admin.users.role") || "Role",
      dataIndex: ["user_metadata", "role"],
      key: "role",
      render: (role: string) => {
        const roleColors: Record<string, string> = {
          admin: "red",
          worker: "blue",
          client: "green",
        };
        return (
          <Tag color={roleColors[role] || "default"}>
            {role?.toUpperCase() || "USER"}
          </Tag>
        );
      },
      filters: [
        { text: "Admin", value: "admin" },
        { text: "Worker", value: "worker" },
        { text: "Client", value: "client" },
      ],
      filteredValue: roleFilter === "all" ? null : [roleFilter],
      onFilter: (value, record) =>
        (record.user_metadata?.role || "client") === value,
    },
    {
      title: t("admin.users.status") || "Status",
      key: "status",
      render: (_, record: ApiUser) => {
        const isBanned =
          record.banned_until && new Date(record.banned_until) > new Date();
        return isBanned ? (
          <Tag color="error">{t("admin.users.banned") || "Banned"}</Tag>
        ) : (
          <Tag color="success">{t("admin.users.active") || "Active"}</Tag>
        );
      },
    },
    {
      title: t("admin.users.createdAt") || "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: t("admin.users.actions") || "Actions",
      key: "actions",
      render: (_, record: ApiUser) => {
        const isBanned =
          record.banned_until && new Date(record.banned_until) > new Date();
        const isAdmin = record.user_metadata?.role === "admin";

        return (
          <Space>
            {!isAdmin && (
              <Fragment>
                {isBanned ? (
                  <Button
                    type="link"
                    onClick={() => handleUnbanUser(record.id)}
                  >
                    {t("admin.users.unban") || "Unban"}
                  </Button>
                ) : (
                  <Button
                    type="link"
                    danger
                    onClick={() => handleBanUser(record.id, record.email)}
                  >
                    {t("admin.users.ban") || "Ban"}
                  </Button>
                )}
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteUser(record.id, record.email)}
                >
                  {t("admin.users.delete") || "Delete"}
                </Button>
              </Fragment>
            )}
          </Space>
        );
      },
    },
  ];

  const pendingWorkerColumns: ColumnsType<PendingWorker> = [
    {
      title: t("admin.users.worker") || "Worker",
      key: "worker",
      render: (_, record: PendingWorker) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.full_name ||
                record.user?.user_metadata?.full_name ||
                "No name"}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {record.user?.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: t("admin.users.basicInfo") || "Basic Info",
      key: "basicInfo",
      render: (_, record: PendingWorker) => (
        <Space direction="horizontal" size="small">
          {record.age && <Text>Age: {record.age}</Text>} |
          {record.height_cm && <Text>Height: {record.height_cm} cm</Text>} |
          {record.weight_kg && <Text>Weight: {record.weight_kg} kg</Text>}
        </Space>
      ),
    },
    {
      title: t("admin.users.appliedAt") || "Applied At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: t("admin.users.actions") || "Actions",
      key: "actions",
      render: (_, record: PendingWorker) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => showWorkerDetails(record)}
          >
            {t("admin.users.viewDetails") || "View Details"}
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleApproveWorker(record.user_id)}
          >
            {t("admin.users.approve") || "Approve"}
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => handleRejectWorker(record.id, record.user?.email)}
          >
            {t("admin.users.reject") || "Reject"}
          </Button>
        </Space>
      ),
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      (user.user_metadata?.full_name || "")
        .toLowerCase()
        .includes(searchText.toLowerCase());
    const matchesRole =
      roleFilter === "all" ||
      (user.user_metadata?.role || "client") === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <Title level={2}>{t("admin.users.title") || "User Management"}</Title>

      <Card style={{ marginTop: 24 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane
            tab={`${t("admin.users.allUsers") || "All Users"} (${
              users.length
            })`}
            key="users"
          >
            <Space style={{ marginBottom: 16, width: "100%" }} wrap>
              <Input
                placeholder={t("admin.users.searchUsers") || "Search users..."}
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
              <Select
                style={{ width: 250 }}
                value={roleFilter}
                onChange={setRoleFilter}
              >
                <Select.Option value="all">
                  {t("admin.users.allRoles") || "All Roles"}
                </Select.Option>
                <Select.Option value="admin">Admin</Select.Option>
                <Select.Option value="worker">Worker</Select.Option>
                <Select.Option value="client">Client</Select.Option>
              </Select>
              <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
                {t("common.refresh") || "Refresh"}
              </Button>
            </Space>

            <Table
              columns={userColumns}
              dataSource={filteredUsers}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showTotal: (total) =>
                  `${t("admin.users.total") || "Total"} ${total} ${
                    t("admin.users.users") || "users"
                  }`,
              }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={`${t("admin.users.pendingWorkers") || "Pending Workers"} (${
              pendingWorkers.length
            })`}
            key="pending-workers"
          >
            <Space style={{ marginBottom: 16, width: "100%" }} wrap>
              <Button icon={<ReloadOutlined />} onClick={fetchPendingWorkers}>
                {t("common.refresh") || "Refresh"}
              </Button>
            </Space>

            <Table
              columns={pendingWorkerColumns}
              dataSource={pendingWorkers}
              loading={pendingLoading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showTotal: (total) =>
                  `${t("admin.users.total") || "Total"} ${total} ${
                    t("admin.users.pendingApplications") ||
                    "pending applications"
                  }`,
              }}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Worker Details Modal */}
      <Modal
        title={t("admin.users.workerDetails") || "Worker Profile Details"}
        open={workerModalVisible}
        onCancel={() => setWorkerModalVisible(false)}
        width={800}
        bodyStyle={{ maxHeight: "90vh", overflowY: "auto" }}
        footer={[
          <Button key="close" onClick={() => setWorkerModalVisible(false)}>
            {t("common.close") || "Close"}
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseOutlined />}
            onClick={() => {
              if (selectedWorker) {
                handleRejectWorker(
                  selectedWorker.id,
                  selectedWorker.user?.email
                );
                setWorkerModalVisible(false);
              }
            }}
          >
            {t("admin.users.reject") || "Reject"}
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              if (selectedWorker) {
                handleApproveWorker(selectedWorker.user_id);
                setWorkerModalVisible(false);
              }
            }}
          >
            {t("admin.users.approve") || "Approve"}
          </Button>,
        ]}
      >
        {selectedWorker && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item
                label={t("admin.users.fullName") || "Full Name"}
                span={2}
              >
                <Text strong>{selectedWorker.full_name}</Text>
              </Descriptions.Item>

              <Descriptions.Item
                label={t("admin.users.email") || "Email"}
                span={2}
              >
                {selectedWorker.user?.email}
              </Descriptions.Item>

              {selectedWorker.nickname && (
                <Descriptions.Item
                  label={t("admin.users.nickname") || "Nickname"}
                  span={2}
                >
                  {selectedWorker.nickname}
                </Descriptions.Item>
              )}

              <Descriptions.Item label={t("admin.users.age") || "Age"}>
                {selectedWorker.age}
              </Descriptions.Item>

              <Descriptions.Item label={t("admin.users.status") || "Status"}>
                <Tag color="orange">{selectedWorker.profile_status}</Tag>
              </Descriptions.Item>

              {selectedWorker.height_cm && (
                <Descriptions.Item label={t("admin.users.height") || "Height"}>
                  {selectedWorker.height_cm} cm
                </Descriptions.Item>
              )}

              {selectedWorker.weight_kg && (
                <Descriptions.Item label={t("admin.users.weight") || "Weight"}>
                  {selectedWorker.weight_kg} kg
                </Descriptions.Item>
              )}

              {selectedWorker.zodiac_sign && (
                <Descriptions.Item
                  label={t("admin.users.zodiacSign") || "Zodiac Sign"}
                  span={2}
                >
                  {selectedWorker.zodiac_sign}
                </Descriptions.Item>
              )}

              {selectedWorker.lifestyle && (
                <Descriptions.Item
                  label={t("admin.users.lifestyle") || "Lifestyle"}
                  span={2}
                >
                  {selectedWorker.lifestyle}
                </Descriptions.Item>
              )}

              {selectedWorker.personal_quote && (
                <Descriptions.Item
                  label={t("admin.users.personalQuote") || "Personal Quote"}
                  span={2}
                >
                  <Text italic>"{selectedWorker.personal_quote}"</Text>
                </Descriptions.Item>
              )}

              <Descriptions.Item
                label={t("admin.users.createdAt") || "Applied At"}
                span={2}
              >
                {new Date(selectedWorker.created_at).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {selectedWorker.bio && (
              <Fragment>
                <Divider orientation="left">
                  {t("admin.users.bio") || "Bio"}
                </Divider>
                <Card size="small" style={{ backgroundColor: "#f5f5f5" }}>
                  <Text>{selectedWorker.bio}</Text>
                </Card>
              </Fragment>
            )}

            {/* Worker Images */}
            {selectedWorker.worker_images &&
              selectedWorker.worker_images.length > 0 && (
                <>
                  <Divider orientation="left">
                    {t("admin.users.images") || "Images"}
                  </Divider>
                  <Space wrap size="middle">
                    {selectedWorker.worker_images
                      .sort((a, b) => {
                        // Avatar first, then by display_order
                        if (a.image_type === "avatar") return -1;
                        if (b.image_type === "avatar") return 1;
                        return a.display_order - b.display_order;
                      })
                      .map((img) => (
                        <div key={img.id} style={{ textAlign: "center" }}>
                          <Image
                            src={img.image_url}
                            alt={img.image_type}
                            width={120}
                            height={120}
                            style={{ objectFit: "cover", borderRadius: 8 }}
                          />
                          <div style={{ marginTop: 4 }}>
                            <Tag
                              color={
                                img.image_type === "avatar" ? "blue" : "default"
                              }
                            >
                              {img.image_type}
                            </Tag>
                            {!img.is_approved && (
                              <Tag color="orange">
                                {t("admin.users.notApproved") || "Not Approved"}
                              </Tag>
                            )}
                          </div>
                        </div>
                      ))}
                  </Space>
                </>
              )}

            {/* Worker Services and Prices */}
            {selectedWorker.worker_services &&
              selectedWorker.worker_services.length > 0 && (
                <>
                  <Divider orientation="left">
                    {t("admin.users.servicesAndPricing") ||
                      "Services & Pricing"}
                  </Divider>
                  <Space
                    direction="vertical"
                    size="middle"
                    style={{ width: "100%" }}
                  >
                    {selectedWorker.worker_services
                      .filter((ws) => ws.is_active)
                      .map((workerService) => {
                        const price = workerService.worker_service_prices?.[0];
                        const service = workerService.services;

                        return (
                          <Card
                            key={workerService.id}
                            size="small"
                            type="inner"
                          >
                            <Space
                              direction="vertical"
                              size="small"
                              style={{ width: "100%" }}
                            >
                              <Text strong>
                                {getServiceName(
                                  service?.name_key,
                                  service?.slug
                                )}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {getServiceDescription(
                                  service?.name_key,
                                  service?.slug,
                                  service?.description
                                )}
                              </Text>
                              {price && (
                                <div>
                                  <Text type="secondary">
                                    {t("admin.users.pricing") || "Pricing"}:{" "}
                                  </Text>
                                  {price.price_vnd && (
                                    <Tag color="green">
                                      {price.price_vnd.toLocaleString()} VND
                                    </Tag>
                                  )}
                                  {price.price_usd && (
                                    <Tag color="blue">
                                      ${price.price_usd.toLocaleString()} USD
                                    </Tag>
                                  )}
                                  {price.price_jpy && (
                                    <Tag color="orange">
                                      ¥{price.price_jpy.toLocaleString()} JPY
                                    </Tag>
                                  )}
                                  {price.price_krw && (
                                    <Tag color="purple">
                                      ₩{price.price_krw.toLocaleString()} KRW
                                    </Tag>
                                  )}
                                  {price.price_cny && (
                                    <Tag color="red">
                                      ¥{price.price_cny.toLocaleString()} CNY
                                    </Tag>
                                  )}
                                  <div style={{ marginTop: 4 }}>
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: 12 }}
                                    >
                                      {t("admin.users.primaryCurrency") ||
                                        "Primary"}
                                      : <Tag>{price.primary_currency}</Tag>
                                    </Text>
                                  </div>
                                </div>
                              )}
                            </Space>
                          </Card>
                        );
                      })}
                  </Space>
                </>
              )}

            {selectedWorker.user_profiles && (
              <>
                <Divider orientation="left">
                  {t("admin.users.userProfile") || "User Profile"}
                </Divider>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label={t("admin.users.role") || "Role"}>
                    <Tag color="blue">
                      {selectedWorker.user_profiles.role?.toUpperCase() ||
                        "USER"}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
