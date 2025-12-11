"use client";

import { useState, useEffect, useCallback, Fragment, useMemo } from "react";
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
  DatePicker,
  Row,
  Col,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
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
import {
  SERVICE_MAPPING,
  getServiceName,
  getServiceDescription,
} from "@/lib/admin/constants";
import { showNotification } from "@/lib/utils/toast";

const { Title, Text } = Typography;
const { confirm } = Modal;


const { RangePicker } = DatePicker;

export default function UserManagementPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [pendingWorkers, setPendingWorkers] = useState<PendingWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeTab, setActiveTab] = useState("users");
  const [selectedWorker, setSelectedWorker] = useState<PendingWorker | null>(
    null
  );
  const [workerModalVisible, setWorkerModalVisible] = useState(false);
  const [banModalVisible, setBanModalVisible] = useState(false);
  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [banUserEmail, setBanUserEmail] = useState<string>("");
  const [banDuration, setBanDuration] = useState<string>("1y");
  const [banReason, setBanReason] = useState<string>("");
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);
  const [rejectUserEmail, setRejectUserEmail] = useState<string>("");
  const [rejectReason, setRejectReason] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Track which action is loading
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const { t } = useTranslation();

  const fetchUsers = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const filters: {
        search?: string;
        role?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
        page?: number;
        limit?: number;
      } = {
        page,
        limit: pageSize,
      };

      if (searchText.trim()) {
        filters.search = searchText.trim();
      }
      if (roleFilter && roleFilter !== "all") {
        filters.role = roleFilter;
      }
      if (statusFilter && statusFilter !== "all") {
        filters.status = statusFilter;
      }
      if (dateRange[0]) {
        filters.date_from = dateRange[0].format("YYYY-MM-DD");
      }
      if (dateRange[1]) {
        filters.date_to = dateRange[1].format("YYYY-MM-DD");
      }

      const response = await adminUserAPI.getAllUsers(filters);
      if (response.error) {
        message.error(response.error);
        setUsers([]);
        setTotalUsers(0);
      } else if (response.data) {
        setUsers(response.data.users || []);
        setTotalUsers(response.data.total || 0);
      } else {
        setUsers([]);
        setTotalUsers(0);
      }
    } catch (error) {
      message.error("Failed to load users");
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchText, roleFilter, statusFilter, dateRange, pageSize]);

  // Debounce search input - properly debounce the search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, statusFilter, dateRange]);

  // Fetch when page, pageSize, or filters change
  useEffect(() => {
    fetchUsers(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, debouncedSearchText, roleFilter, statusFilter, dateRange]);

  const fetchPendingWorkers = useCallback(async () => {
    setPendingLoading(true);
    try {
      const response = await adminUserAPI.getPendingWorkers();
      if (response.error) {
        message.error(`Failed to load pending workers: ${response.error}`);
        setPendingWorkers([]);
      } else if (response.data) {
        setPendingWorkers(response.data.workers || []);
      } else {
        setPendingWorkers([]);
      }
    } catch (error) {
      message.error("Failed to load pending workers");
      setPendingWorkers([]);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1);
    fetchPendingWorkers();
  }, []); // Only run once on mount

  const handleBanUser = (userId: string, email: string) => {
    setBanUserId(userId);
    setBanUserEmail(email);
    setBanDuration("1y");
    setBanReason("");
    setBanModalVisible(true);
  };

  const handleConfirmBan = async () => {
    if (!banUserId) return;

    setActionLoading("ban");
    try {
      const response = await adminUserAPI.banUser(
        banUserId,
        banDuration,
        banReason
      );
      if (response.error) {
        showNotification.error(
          "Failed to ban user",
          response.error
        );
      } else {
        showNotification.success(
          "User banned successfully",
          response.message || `User ${banUserEmail} has been banned`
        );
        setBanModalVisible(false);
        setBanUserId(null);
        setBanUserEmail("");
        setBanReason("");
        fetchUsers(currentPage);
      }
    } catch (error: any) {
      showNotification.error(
        "Failed to ban user",
        error.message || "An unexpected error occurred"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    const userEmail = user?.email || userId;

    confirm({
      title: t("admin.users.unbanUser") || "Unban User",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            {t("admin.users.unbanUserConfirm") ||
              "Are you sure you want to unban"}{" "}
            <Text strong>{userEmail}</Text>?
          </p>
        </div>
      ),
      okText: t("admin.users.yesUnban") || "Yes, Unban",
      okType: "primary",
      cancelText: t("common.cancel") || "Cancel",
      onOk: async () => {
        setActionLoading(`unban-${userId}`);
        try {
          const response = await adminUserAPI.unbanUser(userId);
          if (response.error) {
            showNotification.error(
              "Failed to unban user",
              response.error
            );
          } else {
            showNotification.success(
              "User unbanned successfully",
              response.message || `User ${userEmail} has been unbanned`
            );
            fetchUsers(currentPage);
          }
        } catch (error: any) {
          showNotification.error(
            "Failed to unban user",
            error.message || "An unexpected error occurred"
          );
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleDeleteUser = (userId: string, email: string) => {
    confirm({
      title: t("admin.users.deleteUser") || "Delete User",
      icon: <ExclamationCircleOutlined />,
      width: 600,
      content: (
        <div>
          <p style={{ marginBottom: 16 }}>
            <Text strong>
              {t("admin.users.deleteUserConfirm") ||
                "Are you sure you want to permanently delete"}{" "}
              {email}?
            </Text>
          </p>
          <div style={{ marginBottom: 16 }}>
            <Text type="warning" strong>
              {t("admin.users.deleteUserWarning") ||
                "This action cannot be undone."}
            </Text>
          </div>
          <div style={{ marginTop: 16 }}>
            <Text strong>
              {t("admin.users.deleteCascadeWarning") ||
                "The following data will also be deleted:"}
            </Text>
            <ul style={{ marginTop: 8, marginLeft: 20 }}>
              <li>
                {t("admin.users.deleteCascadeBookings") ||
                  "All bookings associated with this user"}
              </li>
              <li>
                {t("admin.users.deleteCascadeTransactions") ||
                  "All transactions and payment records"}
              </li>
              <li>
                {t("admin.users.deleteCascadeWorkerProfile") ||
                  "Worker profile (if applicable)"}
              </li>
              <li>
                {t("admin.users.deleteCascadeReviews") ||
                  "All reviews and ratings"}
              </li>
              <li>
                {t("admin.users.deleteCascadeMessages") ||
                  "All messages and conversations"}
              </li>
            </ul>
          </div>
        </div>
      ),
      okText: t("admin.users.yesDelete") || "Yes, Delete",
      okType: "danger",
      cancelText: t("common.cancel") || "Cancel",
      okButtonProps: {
        loading: actionLoading === `delete-${userId}`,
      },
      onOk: async () => {
        setActionLoading(`delete-${userId}`);
        try {
          const response = await adminUserAPI.deleteUser(userId);
          if (response.error) {
            showNotification.error(
              "Failed to delete user",
              response.error
            );
          } else {
            showNotification.success(
              "User deleted successfully",
              response.message || `User ${email} has been permanently deleted`
            );
            fetchUsers(currentPage);
          }
        } catch (error: any) {
          showNotification.error(
            "Failed to delete user",
            error.message || "An unexpected error occurred"
          );
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleApproveWorker = async (userId: string) => {
    const worker = pendingWorkers.find((w) => w.user_id === userId);
    const workerEmail = worker?.user?.email || userId;

    confirm({
      title: t("admin.users.approveWorker") || "Approve Worker",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            {t("admin.users.approveWorkerConfirm") ||
              "Are you sure you want to approve worker application for"}{" "}
            <Text strong>{workerEmail}</Text>?
          </p>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
            {t("admin.users.approveWorkerHint") ||
              "This will publish the worker profile and make it visible to clients."}
          </Text>
        </div>
      ),
      okText: t("admin.users.yesApprove") || "Yes, Approve",
      okType: "primary",
      cancelText: t("common.cancel") || "Cancel",
      okButtonProps: {
        loading: actionLoading === `approve-${userId}`,
      },
      onOk: async () => {
        setActionLoading(`approve-${userId}`);
        try {
          const response = await adminUserAPI.approveWorker(userId);
          if (response.error) {
            showNotification.error(
              "Failed to approve worker",
              response.error
            );
          } else {
            showNotification.success(
              "Worker approved successfully",
              response.message || `Worker ${workerEmail} has been approved and published`
            );
            fetchPendingWorkers();
            fetchUsers(currentPage);
          }
        } catch (error: any) {
          showNotification.error(
            "Failed to approve worker",
            error.message || "An unexpected error occurred"
          );
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleRejectWorker = (userId: string, email: string) => {
    setRejectUserId(userId);
    setRejectUserEmail(email);
    setRejectReason("");
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectUserId) return;

    setActionLoading(`reject-${rejectUserId}`);
    try {
      const response = await adminUserAPI.rejectWorker(
        rejectUserId,
        rejectReason
      );
      if (response.error) {
        showNotification.error(
          "Failed to reject worker",
          response.error
        );
      } else {
        showNotification.success(
          "Worker application rejected",
          response.message || `Worker ${rejectUserEmail} application has been rejected`
        );
        setRejectModalVisible(false);
        setRejectUserId(null);
        setRejectUserEmail("");
        setRejectReason("");
        fetchPendingWorkers();
        fetchUsers(currentPage);
      }
    } catch (error: any) {
      showNotification.error(
        "Failed to reject worker",
        error.message || "An unexpected error occurred"
      );
    } finally {
      setActionLoading(null);
    }
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
        // Check role from user_profiles (single source of truth)
        const isAdmin =
          record.profile?.role === "admin" ||
          record.user_metadata?.role === "admin";

        return (
          <Space>
            {!isAdmin && (
              <Fragment>
                {isBanned ? (
                <Button
                  type="link"
                  onClick={() => handleUnbanUser(record.id)}
                  loading={actionLoading === `unban-${record.id}`}
                >
                  {t("admin.users.unban") || "Unban"}
                </Button>
                ) : (
                  <Button
                    type="link"
                    danger
                    onClick={() => handleBanUser(record.id, record.email)}
                    loading={actionLoading === `ban-${record.id}`}
                  >
                    {t("admin.users.ban") || "Ban"}
                  </Button>
                )}
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteUser(record.id, record.email)}
                  loading={actionLoading === `delete-${record.id}`}
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
            loading={actionLoading === `approve-${record.user_id}`}
          >
            {t("admin.users.approve") || "Approve"}
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => handleRejectWorker(record.id, record.user?.email)}
            loading={actionLoading === `reject-${record.id}`}
          >
            {t("admin.users.reject") || "Reject"}
          </Button>
        </Space>
      ),
    },
  ];

  // Remove client-side filtering since we're using server-side now

  return (
    <div>
      <Title level={2}>{t("admin.users.title") || "User Management"}</Title>

      <Card style={{ marginTop: 24 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "users",
              label: `${t("admin.users.allUsers") || "All Users"} (${
                totalUsers
              })`,
              children: (
                <>
                  <Card
                    size="small"
                    style={{ marginBottom: 16, backgroundColor: "#fafafa" }}
                  >
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <Input
                          placeholder={
                            t("admin.users.searchUsers") || "Search users..."
                          }
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          allowClear
                        />
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={4}>
                        <Select
                          style={{ width: "100%" }}
                          value={roleFilter}
                          onChange={setRoleFilter}
                          placeholder={t("admin.users.filterByRole") || "Role"}
                        >
                          <Select.Option value="all">
                            {t("admin.users.allRoles") || "All Roles"}
                          </Select.Option>
                          <Select.Option value="admin">Admin</Select.Option>
                          <Select.Option value="worker">Worker</Select.Option>
                          <Select.Option value="client">Client</Select.Option>
                        </Select>
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={4}>
                        <Select
                          style={{ width: "100%" }}
                          value={statusFilter}
                          onChange={setStatusFilter}
                          placeholder={
                            t("admin.users.filterByStatus") || "Status"
                          }
                        >
                          <Select.Option value="all">
                            {t("admin.users.allStatuses") || "All Statuses"}
                          </Select.Option>
                          <Select.Option value="active">
                            {t("admin.users.active") || "Active"}
                          </Select.Option>
                          <Select.Option value="banned">
                            {t("admin.users.banned") || "Banned"}
                          </Select.Option>
                        </Select>
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={8}>
                        <RangePicker
                          style={{ width: "100%" }}
                          value={dateRange}
                          onChange={(dates) =>
                            setDateRange(
                              dates as [Dayjs | null, Dayjs | null]
                            )
                          }
                          placeholder={[
                            t("admin.users.dateFrom") || "From",
                            t("admin.users.dateTo") || "To",
                          ]}
                          format="YYYY-MM-DD"
                        />
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={2}>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={() => fetchUsers(1)}
                          style={{ width: "100%" }}
                        >
                          {t("common.refresh") || "Refresh"}
                        </Button>
                      </Col>
                    </Row>
                  </Card>

                  <Table
                    columns={userColumns}
                    dataSource={users}
                    loading={loading}
                    rowKey="id"
                    scroll={{ x: "max-content" }}
                    pagination={{
                      current: currentPage,
                      pageSize: pageSize,
                      total: totalUsers,
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} ${t("admin.users.of") || "of"} ${total} ${t("admin.users.users") || "users"}`,
                      showSizeChanger: true,
                      pageSizeOptions: ["10", "20", "50", "100"],
                      onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size || 20);
                      },
                      onShowSizeChange: (current, size) => {
                        setCurrentPage(1);
                        setPageSize(size);
                      },
                    }}
                  />
                </>
              ),
            },
            {
              key: "pending-workers",
              label: `${t("admin.users.pendingWorkers") || "Pending Workers"} (${
                pendingWorkers.length
              })`,
              children: (
                <>
                  <Space style={{ marginBottom: 16, width: "100%" }} wrap>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={fetchPendingWorkers}
                    >
                      {t("common.refresh") || "Refresh"}
                    </Button>
                  </Space>

                  <Table
                    columns={pendingWorkerColumns}
                    dataSource={pendingWorkers}
                    loading={pendingLoading}
                    rowKey="id"
                    scroll={{ x: "max-content" }}
                    pagination={{
                      pageSize: 10,
                      showTotal: (total) =>
                        `${t("admin.users.total") || "Total"} ${total} ${
                          t("admin.users.pendingApplications") ||
                          "pending applications"
                        }`,
                    }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      {/* Ban User Modal */}
      <Modal
        title={t("admin.users.banUser") || "Ban User"}
        open={banModalVisible}
        onOk={handleConfirmBan}
        onCancel={() => {
          setBanModalVisible(false);
          setBanUserId(null);
          setBanUserEmail("");
          setBanReason("");
        }}
        okText={t("admin.users.yesBan") || "Yes, Ban"}
        okType="danger"
        cancelText={t("common.cancel") || "Cancel"}
        width="90%"
        style={{ maxWidth: 600 }}
        okButtonProps={{
          loading: actionLoading === "ban",
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Text strong>
              {t("admin.users.banUserConfirm") || "Ban user"}: {banUserEmail}
            </Text>
          </div>
          <div>
            <Text strong>
              {t("admin.users.banDuration") || "Ban Duration"}:
            </Text>
            <Select
              value={banDuration}
              onChange={setBanDuration}
              style={{ width: "100%", marginTop: 8 }}
            >
              <Select.Option value="1d">
                {t("admin.users.banDuration1Day") || "1 Day"}
              </Select.Option>
              <Select.Option value="1w">
                {t("admin.users.banDuration1Week") || "1 Week"}
              </Select.Option>
              <Select.Option value="1m">
                {t("admin.users.banDuration1Month") || "1 Month"}
              </Select.Option>
              <Select.Option value="1y">
                {t("admin.users.banDuration1Year") || "1 Year"}
              </Select.Option>
              <Select.Option value="permanent">
                {t("admin.users.banDurationPermanent") || "Permanent"}
              </Select.Option>
            </Select>
          </div>
          <div>
            <Text strong>
              {t("admin.users.banReason") || "Reason"} (
              {t("common.optional") || "Optional"}):
            </Text>
            <Input.TextArea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder={
                t("admin.users.banReasonPlaceholder") ||
                "Enter reason for banning this user..."
              }
              rows={3}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>

      {/* Reject Worker Modal */}
      <Modal
        title={t("admin.users.rejectWorker") || "Reject Worker Application"}
        open={rejectModalVisible}
        onOk={handleConfirmReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectUserId(null);
          setRejectUserEmail("");
          setRejectReason("");
        }}
        okText={t("admin.users.yesReject") || "Yes, Reject"}
        okType="danger"
        cancelText={t("common.cancel") || "Cancel"}
        width="90%"
        style={{ maxWidth: 600 }}
        okButtonProps={{
          loading: actionLoading === `reject-${rejectUserId}`,
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Text strong>
              {t("admin.users.rejectWorkerConfirm") ||
                "Reject worker application for"}{" "}
              {rejectUserEmail}?
            </Text>
          </div>
          <div>
            <Text strong>
              {t("admin.users.rejectionReason") || "Rejection Reason"} (
              {t("common.optional") || "Optional"}):
            </Text>
            <Input.TextArea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={
                t("admin.users.rejectionReasonPlaceholder") ||
                "Enter reason for rejecting this worker application..."
              }
              rows={4}
              style={{ marginTop: 8 }}
            />
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
              {t("admin.users.rejectionReasonHint") ||
                "This reason will be saved and can be viewed by the worker."}
            </Text>
          </div>
        </Space>
      </Modal>

      {/* Worker Details Modal */}
      <Modal
        title={t("admin.users.workerDetails") || "Worker Profile Details"}
        open={workerModalVisible}
        onCancel={() => setWorkerModalVisible(false)}
        width="95%"
        style={{ maxWidth: 800 }}
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
                  selectedWorker.user_id,
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
                                  service?.slug,
                                  service?.name_key
                                )}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {getServiceDescription(
                                  service?.slug,
                                  service?.name_key,
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
