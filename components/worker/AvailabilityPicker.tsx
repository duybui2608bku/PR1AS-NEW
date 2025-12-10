"use client";

import { useState, useEffect } from "react";
import { Card, Checkbox, Radio, TimePicker, Space, Typography, Row, Col } from "antd";
import { useTranslation } from "react-i18next";
import { DayOfWeek, AvailabilityType } from "@/lib/utils/enums";
import dayjs, { Dayjs } from "dayjs";

const { Title, Text } = Typography;

interface AvailabilityItem {
  day_of_week: DayOfWeek;
  availability_type: AvailabilityType;
  start_time?: string;
  end_time?: string;
  notes?: string;
}

interface AvailabilityPickerProps {
  value?: AvailabilityItem[];
  onChange?: (availabilities: AvailabilityItem[]) => void;
}

const DAY_NAMES: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "Monday",
  [DayOfWeek.TUESDAY]: "Tuesday",
  [DayOfWeek.WEDNESDAY]: "Wednesday",
  [DayOfWeek.THURSDAY]: "Thursday",
  [DayOfWeek.FRIDAY]: "Friday",
  [DayOfWeek.SATURDAY]: "Saturday",
  [DayOfWeek.SUNDAY]: "Sunday",
};

const ALL_DAYS = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

export default function AvailabilityPicker({
  value = [],
  onChange,
}: AvailabilityPickerProps) {
  const { t } = useTranslation();
  const [selectedDays, setSelectedDays] = useState<Set<DayOfWeek>>(
    new Set(value.map((a) => a.day_of_week))
  );
  const [availabilityMap, setAvailabilityMap] = useState<
    Map<DayOfWeek, AvailabilityItem>
  >(
    new Map(
      value.map((a) => [
        a.day_of_week,
        {
          day_of_week: a.day_of_week,
          availability_type: a.availability_type,
          start_time: a.start_time,
          end_time: a.end_time,
          notes: a.notes,
        },
      ])
    )
  );

  // Update availability map when value prop changes
  useEffect(() => {
    const newMap = new Map(
      value.map((a) => [
        a.day_of_week,
        {
          day_of_week: a.day_of_week,
          availability_type: a.availability_type,
          start_time: a.start_time,
          end_time: a.end_time,
          notes: a.notes,
        },
      ])
    );
    setAvailabilityMap(newMap);
    setSelectedDays(new Set(value.map((a) => a.day_of_week)));
  }, [value]);

  const handleDayToggle = (day: DayOfWeek, checked: boolean) => {
    const newSelectedDays = new Set(selectedDays);
    if (checked) {
      newSelectedDays.add(day);
      // Set default availability type
      const newMap = new Map(availabilityMap);
      newMap.set(day, {
        day_of_week: day,
        availability_type: AvailabilityType.ALL_DAY,
      });
      setAvailabilityMap(newMap);
    } else {
      newSelectedDays.delete(day);
      const newMap = new Map(availabilityMap);
      newMap.delete(day);
      setAvailabilityMap(newMap);
    }
    setSelectedDays(newSelectedDays);
    notifyChange(newSelectedDays, availabilityMap);
  };

  const handleAvailabilityTypeChange = (
    day: DayOfWeek,
    type: AvailabilityType
  ) => {
    const newMap = new Map(availabilityMap);
    const current = newMap.get(day) || {
      day_of_week: day,
      availability_type: AvailabilityType.ALL_DAY,
    };
    newMap.set(day, {
      ...current,
      availability_type: type,
      // Clear time if switching to ALL_DAY
      start_time: type === AvailabilityType.ALL_DAY ? undefined : current.start_time,
      end_time: type === AvailabilityType.ALL_DAY ? undefined : current.end_time,
    });
    setAvailabilityMap(newMap);
    notifyChange(selectedDays, newMap);
  };

  const handleTimeChange = (
    day: DayOfWeek,
    field: "start_time" | "end_time",
    time: Dayjs | null
  ) => {
    const newMap = new Map(availabilityMap);
    const current = newMap.get(day);
    if (current) {
      newMap.set(day, {
        ...current,
        [field]: time ? time.format("HH:mm:ss") : undefined,
      });
      setAvailabilityMap(newMap);
      notifyChange(selectedDays, newMap);
    }
  };

  const notifyChange = (
    days: Set<DayOfWeek>,
    map: Map<DayOfWeek, AvailabilityItem>
  ) => {
    if (onChange) {
      const availabilities: AvailabilityItem[] = Array.from(days).map((day) => {
        const item = map.get(day);
        return (
          item || {
            day_of_week: day,
            availability_type: AvailabilityType.ALL_DAY,
          }
        );
      });
      onChange(availabilities);
    }
  };

  return (
    <Card>
      <Title level={5} style={{ marginBottom: 16 }}>
        {t("worker.profile.availability")}
      </Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
        {t("worker.profile.availabilityDesc")}
      </Text>

      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {ALL_DAYS.map((day) => {
          const isSelected = selectedDays.has(day);
          const availability = availabilityMap.get(day);
          const availabilityType =
            availability?.availability_type || AvailabilityType.ALL_DAY;

          return (
            <Card
              key={day}
              size="small"
              style={{
                border: isSelected ? "1px solid #1890ff" : "1px solid #d9d9d9",
                backgroundColor: isSelected ? "#f0f8ff" : undefined,
              }}
            >
              <Row gutter={16} align="middle">
                <Col xs={24} sm={6}>
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => handleDayToggle(day, e.target.checked)}
                  >
                    <Text strong>{DAY_NAMES[day]}</Text>
                  </Checkbox>
                </Col>

                {isSelected && (
                  <Col xs={24} sm={18}>
                    <Radio.Group
                      value={availabilityType}
                      onChange={(e) =>
                        handleAvailabilityTypeChange(day, e.target.value)
                      }
                      style={{ width: "100%" }}
                    >
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <Radio value={AvailabilityType.ALL_DAY}>
                          {t("worker.profile.allDay")}
                        </Radio>
                        <Radio value={AvailabilityType.TIME_RANGE}>
                          {t("worker.profile.timeRange")}
                        </Radio>
                        {availabilityType === AvailabilityType.TIME_RANGE && (
                          <Space style={{ marginLeft: 24 }}>
                            <TimePicker
                              placeholder={t("worker.profile.startTime")}
                              value={
                                availability?.start_time
                                  ? dayjs(availability.start_time, "HH:mm:ss")
                                  : null
                              }
                              onChange={(time) =>
                                handleTimeChange(day, "start_time", time)
                              }
                              format="HH:mm"
                            />
                            <span>-</span>
                            <TimePicker
                              placeholder={t("worker.profile.endTime")}
                              value={
                                availability?.end_time
                                  ? dayjs(availability.end_time, "HH:mm:ss")
                                  : null
                              }
                              onChange={(time) =>
                                handleTimeChange(day, "end_time", time)
                              }
                              format="HH:mm"
                            />
                          </Space>
                        )}
                      </Space>
                    </Radio.Group>
                  </Col>
                )}
              </Row>
            </Card>
          );
        })}
      </Space>
    </Card>
  );
}

