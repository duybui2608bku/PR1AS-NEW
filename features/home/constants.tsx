import {
  HomeOutlined,
  ToolOutlined,
  CarOutlined,
  ShoppingOutlined,
  UserOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { Testimonial, Category, Step, StatisticItem } from "./types";

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Nguyễn Văn A",
    role: "Chủ nhà",
    avatar: "https://i.pravatar.cc/150?img=1",
    rating: 5,
    comment:
      "Tôi đã tìm được thợ sửa điện rất chuyên nghiệp qua PR1AS. Dịch vụ nhanh chóng và đáng tin cậy!",
  },
  {
    name: "Trần Thị B",
    role: "Client",
    avatar: "https://i.pravatar.cc/150?img=2",
    rating: 5,
    comment:
      "Nền tảng tuyệt vời! Tôi dễ dàng tìm được người giúp việc uy tín trong khu vực của mình.",
  },
  {
    name: "Lê Văn C",
    role: "Worker - Thợ điện",
    avatar: "https://i.pravatar.cc/150?img=3",
    rating: 5,
    comment:
      "PR1AS giúp tôi có thêm thu nhập ổn định. Hệ thống đặt lịch rất tiện lợi và chuyên nghiệp.",
  },
  {
    name: "Phạm Thị D",
    role: "Client",
    avatar: "https://i.pravatar.cc/150?img=4",
    rating: 5,
    comment:
      "An tâm khi thuê worker qua PR1AS. Đánh giá minh bạch, giá cả hợp lý!",
  },
];

export const CATEGORIES: Category[] = [
  { icon: <HomeOutlined />, name: "Sửa chữa nhà", count: "2,500+ Workers" },
  { icon: <ToolOutlined />, name: "Điện - Nước", count: "1,800+ Workers" },
  { icon: <CarOutlined />, name: "Vận chuyển", count: "3,200+ Workers" },
  { icon: <ShoppingOutlined />, name: "Giúp việc", count: "4,100+ Workers" },
  { icon: <UserOutlined />, name: "Chăm sóc", count: "1,600+ Workers" },
  { icon: <TeamOutlined />, name: "Sự kiện", count: "900+ Workers" },
];

export const STEPS: Step[] = [
  {
    number: "01",
    title: "Đăng ký tài khoản",
    description: "Tạo tài khoản miễn phí chỉ trong 30 giây",
  },
  {
    number: "02",
    title: "Tìm Worker phù hợp",
    description: "Duyệt qua hàng ngàn Worker với đánh giá thật",
  },
  {
    number: "03",
    title: "Đặt lịch & Thanh toán",
    description: "Chọn thời gian phù hợp và thanh toán an toàn",
  },
  {
    number: "04",
    title: "Hoàn thành công việc",
    description: "Worker đến đúng hẹn và hoàn thành xuất sắc",
  },
];

export const STATISTICS: StatisticItem[] = [
  { title: "Active Workers", value: 12500, suffix: "+" },
  { title: "Completed Jobs", value: 50000, suffix: "+" },
  { title: "Happy Clients", value: 25000, suffix: "+" },
  { title: "Average Rating", value: 4.9, suffix: "/5.0" },
];

export const HERO_SLIDES = [
  {
    title: "Tìm Worker Chuyên Nghiệp",
    description:
      "Kết nối với hàng ngàn worker uy tín, được xác thực và đánh giá cao trong khu vực của bạn",
    icon: "SearchOutlined",
    primaryCTA: "Tìm Worker Ngay",
    secondaryCTA: "Đăng Ký Worker",
  },
  {
    title: "An Toàn & Đáng Tin Cậy",
    description:
      "Tất cả worker đều được xác thực danh tính và có đánh giá thực từ khách hàng",
    icon: "SafetyOutlined",
    primaryCTA: "Khám Phá Ngay",
  },
  {
    title: "Nhanh Chóng & Tiện Lợi",
    description:
      "Đặt lịch online, thanh toán dễ dàng, theo dõi tiến độ mọi lúc mọi nơi",
    icon: "ThunderboltOutlined",
    primaryCTA: "Bắt Đầu Ngay",
  },
];
