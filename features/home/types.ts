export interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  comment: string;
}

export interface Category {
  icon: React.ReactNode;
  name: string;
  count: string;
}

export interface Step {
  number: string;
  title: string;
  description: string;
}

export interface StatisticItem {
  title: string;
  value: number;
  suffix?: string;
}
