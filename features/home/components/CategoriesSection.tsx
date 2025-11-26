"use client";

import { Fragment, memo, useState } from "react";
import {
  UserOutlined,
  TeamOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  LaptopOutlined,
  HeartOutlined,
  SmileOutlined,
  SafetyCertificateOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Button, Modal, Typography } from "antd";

const { Title, Paragraph } = Typography;

interface CategoriesSectionProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const CategoriesSection = memo(function CategoriesSection({ selectedCategory, onSelectCategory }: CategoriesSectionProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  const CATEGORIES = [
    // Assistance
    {
      id: "personal",
      icon: <UserOutlined />,
      nameKey: "home.categories.items.assistance.personal.name",
      descKey: "home.categories.items.assistance.personal.description",
      group: "assistance"
    },
    {
      id: "onsite",
      icon: <EnvironmentOutlined />,
      nameKey: "home.categories.items.assistance.onsite.name",
      descKey: "home.categories.items.assistance.onsite.description",
      group: "assistance"
    },
    {
      id: "remote",
      icon: <LaptopOutlined />,
      nameKey: "home.categories.items.assistance.remote.name",
      descKey: "home.categories.items.assistance.remote.description",
      group: "assistance"
    },
    {
      id: "tourGuide",
      icon: <GlobalOutlined />,
      nameKey: "home.categories.items.assistance.tourGuide.name",
      descKey: "home.categories.items.assistance.tourGuide.description",
      group: "assistance"
    },
    {
      id: "interpreter",
      icon: <TeamOutlined />,
      nameKey: "home.categories.items.assistance.interpreter.name",
      descKey: "home.categories.items.assistance.interpreter.description",
      group: "assistance"
    },
    // Companionship
    {
      id: "level1",
      icon: <SmileOutlined />,
      nameKey: "home.categories.items.companionship.level1.name",
      descKey: "home.categories.items.companionship.level1.description",
      group: "companionship"
    },
    {
      id: "level2",
      icon: <HeartOutlined />,
      nameKey: "home.categories.items.companionship.level2.name",
      descKey: "home.categories.items.companionship.level2.description",
      group: "companionship"
    },
    {
      id: "level3",
      icon: <SafetyCertificateOutlined />,
      nameKey: "home.categories.items.companionship.level3.name",
      descKey: "home.categories.items.companionship.level3.description",
      group: "companionship"
    },
  ];

  const handleCategoryClick = (category: any) => {
    if (selectedCategory === category.id) {
      onSelectCategory(null);
    } else {
      onSelectCategory(category.id);
    }
    setSelectedService(category);
    setIsModalOpen(true);
  };

  return (
    <Fragment>
      <section className="sticky top-[80px] z-40 bg-white shadow-sm pt-4 pb-0">
        <div className="max-w-[2520px] mx-auto xl:px-20 md:px-10 sm:px-2 px-4">
          <div className="flex flex-row items-center justify-between overflow-x-auto pt-4 pb-2 gap-8 no-scrollbar">
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className={`
                    flex flex-col items-center justify-center gap-2 p-3 border-b-2 hover:text-neutral-800 transition cursor-pointer min-w-fit
                    ${isSelected ? "border-neutral-800 text-neutral-800" : "border-transparent text-neutral-500"}
                  `}
                >
                  <div className="text-2xl">{category.icon}</div>
                  <div className="font-medium text-xs">
                    {t(category.nameKey)}
                  </div>
                </div>
              );
            })}

            <div className="hidden md:flex items-center ml-auto pl-4">
              <Button
                icon={<FilterOutlined />}
                className="flex items-center gap-2 !rounded-xl !border-gray-300 !h-12 !px-4 !text-xs !font-semibold"
              >
                {t("common.filter")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Modal
        title={selectedService ? t(selectedService.nameKey) : ""}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>
            {t("common.close")}
          </Button>,
          <Button key="book" type="primary">
            {t("home.hero.slide1.primaryCTA")}
          </Button>
        ]}
      >
        {selectedService && (
          <div className="py-4">
            <div className="text-4xl text-[#FF385C] mb-4 flex justify-center">
              {selectedService.icon}
            </div>
            <Paragraph className="text-lg text-center">
              {t(selectedService.descKey)}
            </Paragraph>
          </div>
        )}
      </Modal>
    </Fragment>
  );
});

export default CategoriesSection;
