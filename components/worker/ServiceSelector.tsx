"use client";

import { useState, useEffect } from "react";

import {
  Modal,
  Form,
  Select,
  InputNumber,
  Button,
  Space,
  Typography,
  Alert,
  Collapse,
  Card,
  Row,
  Col,
} from "antd";
import { useTranslation } from "react-i18next";
import { showMessage } from "@/lib/utils/toast";
import { getErrorMessage } from "@/lib/utils/common";
import {
  servicesAPI,
  workerServicesAPI,
  calculatePriceTiers,
} from "@/lib/worker/api-client";
import {
  Service,
  ServiceOption,
  AddWorkerServiceRequest,
} from "@/lib/worker/types";
import { Currency } from "@/lib/utils/enums";

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface ServiceSelectorProps {
  visible: boolean;
  services: Service[];
  onClose: () => void;
  onServiceAdded: () => void;
}

const CURRENCIES = [
  { value: Currency.USD, label: "USD ($)", symbol: "$" },
  { value: Currency.VND, label: "VND (₫)", symbol: "₫" },
  { value: Currency.JPY, label: "JPY (¥)", symbol: "¥" },
  { value: Currency.KRW, label: "KRW (₩)", symbol: "₩" },
  { value: Currency.CNY, label: "CNY (¥)", symbol: "¥" },
];

export default function ServiceSelector({
  visible,
  services,
  onClose,
  onServiceAdded,
}: ServiceSelectorProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [hourlyRate, setHourlyRate] = useState<number>(20);
  const [currency, setCurrency] = useState<Currency>(Currency.USD);
  const [dailyDiscount, setDailyDiscount] = useState(0);
  const [weeklyDiscount, setWeeklyDiscount] = useState(0);
  const [monthlyDiscount, setMonthlyDiscount] = useState(0);

  useEffect(() => {
    if (selectedService?.has_options) {
      loadServiceOptions(selectedService.id);
    } else {
      setServiceOptions([]);
    }
  }, [selectedService]);

  const loadServiceOptions = async (serviceId: string) => {
    try {
      const service = await servicesAPI.getServiceById(serviceId);
      setServiceOptions(service.options || []);
    } catch (error) {
      console.error("Failed to load service options:", error);
    }
  };

  const priceTiers = calculatePriceTiers(
    hourlyRate,
    dailyDiscount,
    weeklyDiscount,
    monthlyDiscount
  );

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    setSelectedService(service || null);
    form.setFieldsValue({ service_option_id: undefined });
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const requestData: AddWorkerServiceRequest = {
        service_id: values.service_id,
        service_option_id: values.service_option_id,
        pricing: {
          hourly_rate: values.hourly_rate,
          primary_currency: values.primary_currency,
          daily_discount_percent: values.daily_discount || 0,
          weekly_discount_percent: values.weekly_discount || 0,
          monthly_discount_percent: values.monthly_discount || 0,
        },
      };

      await workerServicesAPI.addService(requestData);
      showMessage.success(t("worker.profile.serviceAddedSuccess"));
      form.resetFields();
      onServiceAdded();
    } catch (error) {
      showMessage.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t("worker.profile.selectService")}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          primary_currency: Currency.USD,
          hourly_rate: 20,
          daily_discount: 0,
          weekly_discount: 0,
          monthly_discount: 0,
        }}
      >
        <Alert
          message={t("worker.profile.selectServiceHint")}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Service Selection */}
        <Form.Item
          label={t("worker.profile.service")}
          name="service_id"
          rules={[
            { required: true, message: t("worker.profile.serviceRequired") },
          ]}
        >
          <Select
            size="large"
            placeholder={t("worker.profile.selectServicePlaceholder")}
            onChange={handleServiceChange}
            showSearch
            optionFilterProp="children"
          >
            {services.map((service) => (
              <Select.Option key={service.id} value={service.id}>
                {t(`services.${service.name_key}`)}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Service Options (if applicable) */}
        {selectedService?.has_options && serviceOptions.length > 0 && (
          <Form.Item
            label={t("worker.profile.serviceOption")}
            name="service_option_id"
            rules={[
              {
                required: true,
                message: t("worker.profile.serviceOptionRequired"),
              },
            ]}
          >
            <Select
              size="large"
              placeholder={t("worker.profile.selectOptionPlaceholder")}
            >
              {serviceOptions.map((option) => (
                <Select.Option key={option.id} value={option.id}>
                  {t(`services.options.${option.option_key}`)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Card title={t("worker.profile.pricing")} style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t("worker.profile.hourlyRate")}
                name="hourly_rate"
                rules={[
                  {
                    required: true,
                    message: t("worker.profile.hourlyRateRequired"),
                  },
                  {
                    type: "number",
                    min: 1,
                    message: t("worker.profile.hourlyRateMin"),
                  },
                ]}
              >
                <InputNumber
                  size="large"
                  style={{ width: "100%" }}
                  min={1}
                  placeholder="20"
                  onChange={(value) => setHourlyRate(value || 20)}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={t("worker.profile.currency")}
                name="primary_currency"
                rules={[{ required: true }]}
              >
                <Select size="large" onChange={(value) => setCurrency(value)}>
                  {CURRENCIES.map((curr) => (
                    <Select.Option key={curr.value} value={curr.value}>
                      {curr.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Discounts */}
          <Collapse ghost style={{ marginTop: 16 }}>
            <Panel header={t("worker.profile.optionalDiscounts")} key="1">
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={t("worker.profile.dailyDiscount")}
                    name="daily_discount"
                  >
                    <InputNumber
                      size="large"
                      style={{ width: "100%" }}
                      min={0}
                      max={100}
                      addonAfter="%"
                      onChange={(value) => setDailyDiscount(value || 0)}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label={t("worker.profile.weeklyDiscount")}
                    name="weekly_discount"
                  >
                    <InputNumber
                      size="large"
                      style={{ width: "100%" }}
                      min={0}
                      max={100}
                      addonAfter="%"
                      onChange={(value) => setWeeklyDiscount(value || 0)}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label={t("worker.profile.monthlyDiscount")}
                    name="monthly_discount"
                  >
                    <InputNumber
                      size="large"
                      style={{ width: "100%" }}
                      min={0}
                      max={100}
                      addonAfter="%"
                      onChange={(value) => setMonthlyDiscount(value || 0)}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Panel>
          </Collapse>

          {/* Price Preview */}
          <Card size="small" style={{ marginTop: 16, background: "#f5f5f5" }}>
            <Title level={5}>{t("worker.profile.pricePreview")}</Title>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>{t("worker.profile.hourly")}:</Text>
                <Text strong>
                  {CURRENCIES.find((c) => c.value === currency)?.symbol}
                  {priceTiers.hourly}
                </Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>{t("worker.profile.daily")} (8h):</Text>
                <Text strong>
                  {CURRENCIES.find((c) => c.value === currency)?.symbol}
                  {priceTiers.daily}
                </Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>{t("worker.profile.weekly")} (56h):</Text>
                <Text strong>
                  {CURRENCIES.find((c) => c.value === currency)?.symbol}
                  {priceTiers.weekly}
                </Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>{t("worker.profile.monthly")} (160h):</Text>
                <Text strong>
                  {CURRENCIES.find((c) => c.value === currency)?.symbol}
                  {priceTiers.monthly}
                </Text>
              </div>
            </Space>
          </Card>
        </Card>

        <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={onClose}>{t("common.cancel")}</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {t("worker.profile.addService")}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
