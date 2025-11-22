"use client";

import { memo } from "react";
import { Typography, Card, Carousel, Avatar, Rate } from "antd";
import { useTranslation } from "react-i18next";

const { Title, Paragraph, Text } = Typography;

const TestimonialsSection = memo(function TestimonialsSection() {
  const { t } = useTranslation();

  const TESTIMONIALS = [
    {
      id: "testimonial1",
      nameKey: "home.testimonials.items.testimonial1.name",
      roleKey: "home.testimonials.items.testimonial1.role",
      commentKey: "home.testimonials.items.testimonial1.comment",
      avatar: "https://i.pravatar.cc/150?img=1",
      rating: 5,
    },
    {
      id: "testimonial2",
      nameKey: "home.testimonials.items.testimonial2.name",
      roleKey: "home.testimonials.items.testimonial2.role",
      commentKey: "home.testimonials.items.testimonial2.comment",
      avatar: "https://i.pravatar.cc/150?img=2",
      rating: 5,
    },
    {
      id: "testimonial3",
      nameKey: "home.testimonials.items.testimonial3.name",
      roleKey: "home.testimonials.items.testimonial3.role",
      commentKey: "home.testimonials.items.testimonial3.comment",
      avatar: "https://i.pravatar.cc/150?img=3",
      rating: 5,
    },
    {
      id: "testimonial4",
      nameKey: "home.testimonials.items.testimonial4.name",
      roleKey: "home.testimonials.items.testimonial4.role",
      commentKey: "home.testimonials.items.testimonial4.comment",
      avatar: "https://i.pravatar.cc/150?img=4",
      rating: 5,
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-[#690F0F] via-[#8B1818] to-[#690F0F] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <Title
            level={2}
            className="!text-white !text-3xl sm:!text-4xl md:!text-5xl !font-bold !mb-3 sm:!mb-4"
          >
            {t("home.testimonials.title")}
          </Title>
          <Paragraph className="!text-white !text-base sm:!text-lg md:!text-xl max-w-2xl mx-auto opacity-90 px-4">
            {t("home.testimonials.subtitle")}
          </Paragraph>
        </div>

        <Carousel
          autoplay
          dots={true}
          slidesToShow={1}
          responsive={[
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: 2,
              },
            },
            {
              breakpoint: 640,
              settings: {
                slidesToShow: 1,
              },
            },
          ]}
          className="testimonial-carousel"
        >
          {TESTIMONIALS.map((testimonial) => (
            <div key={testimonial.id} className="px-2 sm:px-3">
              <Card className="!bg-white/10 !backdrop-blur-lg !border-white/20 !text-white !h-full mx-2">
                <div className="text-center mb-3 sm:mb-4">
                  <Avatar
                    size={60}
                    src={testimonial.avatar}
                    className="!mb-3 sm:!mb-4 sm:w-20 sm:h-20"
                  />
                  <Title
                    level={4}
                    className="!text-white !mb-1 !text-base sm:!text-lg"
                  >
                    {t(testimonial.nameKey)}
                  </Title>
                  <Text className="!text-white/80 !text-xs sm:!text-sm">
                    {t(testimonial.roleKey)}
                  </Text>
                </div>
                <div className="text-center mb-3 sm:mb-4">
                  <Rate
                    disabled
                    defaultValue={testimonial.rating}
                    className="!text-yellow-400 text-sm sm:text-base"
                  />
                </div>
                <Paragraph className="!text-white/90 !text-center !text-sm sm:!text-base !italic">
                  &ldquo;{t(testimonial.commentKey)}&rdquo;
                </Paragraph>
              </Card>
            </div>
          ))}
        </Carousel>
      </div>
    </section>
  );
});

export default TestimonialsSection;
