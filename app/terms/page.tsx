"use client";

import { Typography, Card } from "antd";
import MainLayout from "@/components/layout/MainLayout";
import { useTranslation } from "react-i18next";

const { Title, Paragraph } = Typography;

export default function TermsOfServicePage() {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="!shadow-lg">
            <Title level={1} className="!text-center !mb-8">
              Điều Khoản Sử Dụng Dịch Vụ
            </Title>
            <Paragraph className="!text-gray-500 !text-center !mb-12">
              Cập nhật lần cuối: 17/11/2025
            </Paragraph>

            {/* Section 1 */}
            <Title level={2} className="!mt-8 !mb-4">
              1. Chấp Nhận Điều Khoản
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Bằng cách truy cập và sử dụng nền tảng PR1AS, bạn đồng ý tuân thủ
              và bị ràng buộc bởi các điều khoản và điều kiện sử dụng này. Nếu
              bạn không đồng ý với bất kỳ phần nào của các điều khoản này, bạn
              không được phép sử dụng dịch vụ của chúng tôi.
            </Paragraph>

            {/* Section 2 */}
            <Title level={2} className="!mt-8 !mb-4">
              2. Định Nghĩa
            </Title>
            <ul className="list-disc list-inside ml-4 mb-4">
              <li>
                <strong>"Nền tảng"</strong> hoặc <strong>"Dịch vụ"</strong>{" "}
                nghĩa là website, ứng dụng di động và các dịch vụ liên quan của
                PR1AS
              </li>
              <li>
                <strong>"Client"</strong> là người dùng tìm kiếm và thuê workers
              </li>
              <li>
                <strong>"Worker"</strong> là người cung cấp dịch vụ thông qua
                nền tảng
              </li>
              <li>
                <strong>"Chúng tôi"</strong>, <strong>"của chúng tôi"</strong>{" "}
                nghĩa là công ty PR1AS
              </li>
              <li>
                <strong>"Bạn"</strong>, <strong>"của bạn"</strong> nghĩa là
                người dùng nền tảng
              </li>
            </ul>

            {/* Section 3 */}
            <Title level={2} className="!mt-8 !mb-4">
              3. Tài Khoản Người Dùng
            </Title>
            <Title level={3} className="!mt-6 !mb-3 !text-lg">
              3.1. Đăng ký tài khoản
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Để sử dụng dịch vụ, bạn phải tạo tài khoản và cung cấp thông tin
              chính xác, đầy đủ và cập nhật. Bạn chịu trách nhiệm duy trì tính
              bảo mật của tài khoản và mật khẩu của mình.
            </Paragraph>

            <Title level={3} className="!mt-6 !mb-3 !text-lg">
              3.2. Điều kiện sử dụng
            </Title>
            <ul className="list-disc list-inside ml-4 mb-4">
              <li>Bạn phải từ 18 tuổi trở lên</li>
              <li>Bạn có năng lực pháp lý để ký kết hợp đồng</li>
              <li>Bạn không bị cấm sử dụng dịch vụ theo pháp luật</li>
              <li>Một người chỉ được tạo một tài khoản</li>
            </ul>

            <Title level={3} className="!mt-6 !mb-3 !text-lg">
              3.3. Bảo mật tài khoản
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Bạn chịu trách nhiệm cho tất cả các hoạt động xảy ra dưới tài
              khoản của bạn. Bạn phải thông báo ngay cho chúng tôi về bất kỳ
              việc sử dụng trái phép nào đối với tài khoản của bạn.
            </Paragraph>

            {/* Section 4 */}
            <Title level={2} className="!mt-8 !mb-4">
              4. Sử Dụng Dịch Vụ
            </Title>
            <Title level={3} className="!mt-6 !mb-3 !text-lg">
              4.1. Quyền sử dụng
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Chúng tôi cấp cho bạn quyền không độc quyền, không thể chuyển
              nhượng, có thể thu hồi để truy cập và sử dụng dịch vụ cho mục đích
              cá nhân, phi thương mại.
            </Paragraph>

            <Title level={3} className="!mt-6 !mb-3 !text-lg">
              4.2. Hành vi bị cấm
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Bạn đồng ý không:
            </Paragraph>
            <ul className="list-disc list-inside ml-4 mb-4">
              <li>Vi phạm bất kỳ luật pháp hoặc quy định nào</li>
              <li>Sử dụng dịch vụ cho mục đích bất hợp pháp hoặc gian lận</li>
              <li>
                Tải lên nội dung vi phạm bản quyền hoặc quyền sở hữu trí tuệ
              </li>
              <li>Quấy rối, đe dọa hoặc lạm dụng người dùng khác</li>
              <li>Gửi spam hoặc nội dung quảng cáo không được phép</li>
              <li>Can thiệp vào hoạt động bình thường của nền tảng</li>
              <li>Cố gắng truy cập trái phép vào hệ thống</li>
            </ul>

            {/* Section 5 */}
            <Title level={2} className="!mt-8 !mb-4">
              5. Đặt Chỗ và Thanh Toán
            </Title>
            <Title level={3} className="!mt-6 !mb-3 !text-lg">
              5.1. Quy trình đặt chỗ
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Khi bạn đặt worker, bạn đồng ý thanh toán các khoản phí đã thỏa
              thuận. Việc đặt chỗ tạo ra hợp đồng ràng buộc giữa bạn và worker.
            </Paragraph>

            <Title level={3} className="!mt-6 !mb-3 !text-lg">
              5.2. Phí dịch vụ
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              PR1AS thu phí dịch vụ cho mỗi giao dịch. Phí này sẽ được hiển thị
              rõ ràng trước khi bạn xác nhận đặt chỗ.
            </Paragraph>

            <Title level={3} className="!mt-6 !mb-3 !text-lg">
              5.3. Thanh toán
            </Title>
            <ul className="list-disc list-inside ml-4 mb-4">
              <li>
                Tất cả các khoản thanh toán phải được thực hiện qua nền tảng
              </li>
              <li>
                Chúng tôi chấp nhận các phương thức thanh toán được liệt kê trên
                nền tảng
              </li>
              <li>Bạn có trách nhiệm thanh toán đúng hạn</li>
              <li>Việc không thanh toán có thể dẫn đến đình chỉ tài khoản</li>
            </ul>

            {/* Section 6 */}
            <Title level={2} className="!mt-8 !mb-4">
              6. Chính Sách Hủy và Hoàn Tiền
            </Title>
            <Title level={3} className="!mt-6 !mb-3 !text-lg">
              6.1. Hủy bởi Client
            </Title>
            <ul className="list-disc list-inside ml-4 mb-4">
              <li>
                <strong>Hủy trước 24 giờ:</strong> Hoàn tiền 100%
              </li>
              <li>
                <strong>Hủy 12-24 giờ trước:</strong> Hoàn tiền 50%
              </li>
              <li>
                <strong>Hủy dưới 12 giờ:</strong> Không hoàn tiền
              </li>
            </ul>

            <Title level={3} className="!mt-6 !mb-3 !text-lg">
              6.2. Hủy bởi Worker
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Nếu worker hủy đặt chỗ, client sẽ được hoàn tiền 100%. Worker có
              thể bị phạt hoặc đình chỉ tài khoản nếu hủy thường xuyên.
            </Paragraph>

            {/* Section 7 */}
            <Title level={2} className="!mt-8 !mb-4">
              7. Đánh Giá và Xếp Hạng
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Sau khi hoàn thành dịch vụ, cả client và worker có thể đánh giá
              nhau. Đánh giá phải:
            </Paragraph>
            <ul className="list-disc list-inside ml-4 mb-4">
              <li>Trung thực và chính xác</li>
              <li>Dựa trên trải nghiệm thực tế</li>
              <li>Không chứa ngôn từ xúc phạm hoặc phân biệt đối xử</li>
              <li>Không vi phạm quyền riêng tư</li>
            </ul>

            {/* Section 8 */}
            <Title level={2} className="!mt-8 !mb-4">
              8. Trách Nhiệm và Miễn Trừ
            </Title>
            <Title level={3} className="!mt-6 !mb-3 !text-lg">
              8.1. Vai trò của PR1AS
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              PR1AS là nền tảng kết nối và không phải là nhà cung cấp dịch vụ.
              Chúng tôi không chịu trách nhiệm cho chất lượng, an toàn hoặc tính
              hợp pháp của dịch vụ được cung cấp bởi workers.
            </Paragraph>

            <Title level={3} className="!mt-6 !mb-3 !text-lg">
              8.2. Giới hạn trách nhiệm
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Trong phạm vi pháp luật cho phép, PR1AS không chịu trách nhiệm cho
              bất kỳ thiệt hại trực tiếp, gián tiếp, ngẫu nhiên, đặc biệt hoặc
              hậu quả nào phát sinh từ việc sử dụng hoặc không thể sử dụng dịch
              vụ.
            </Paragraph>

            {/* Section 9 */}
            <Title level={2} className="!mt-8 !mb-4">
              9. Sở Hữu Trí Tuệ
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Tất cả nội dung, thiết kế, logo, và thương hiệu trên nền tảng là
              tài sản của PR1AS và được bảo vệ bởi luật sở hữu trí tuệ. Bạn
              không được sao chép, sửa đổi hoặc sử dụng mà không có sự cho phép
              bằng văn bản.
            </Paragraph>

            {/* Section 10 */}
            <Title level={2} className="!mt-8 !mb-4">
              10. Chấm Dứt
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Chúng tôi có quyền đình chỉ hoặc chấm dứt tài khoản của bạn bất cứ
              lúc nào nếu bạn vi phạm các điều khoản này hoặc có hành vi gian
              lận, lạm dụng hoặc bất hợp pháp.
            </Paragraph>

            {/* Section 11 */}
            <Title level={2} className="!mt-8 !mb-4">
              11. Luật Áp Dụng và Giải Quyết Tranh Chấp
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi
              tranh chấp sẽ được giải quyết thông qua thương lượng, hòa giải
              hoặc tại tòa án có thẩm quyền tại Việt Nam.
            </Paragraph>

            {/* Section 12 */}
            <Title level={2} className="!mt-8 !mb-4">
              12. Thay Đổi Điều Khoản
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Chúng tôi có quyền sửa đổi các điều khoản này bất cứ lúc nào. Các
              thay đổi sẽ có hiệu lực ngay khi được đăng trên nền tảng. Việc
              tiếp tục sử dụng dịch vụ sau khi thay đổi có nghĩa là bạn chấp
              nhận các điều khoản mới.
            </Paragraph>

            {/* Section 13 */}
            <Title level={2} className="!mt-8 !mb-4">
              13. Liên Hệ
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Nếu bạn có câu hỏi về điều khoản sử dụng này, vui lòng liên hệ:
            </Paragraph>
            <ul className="list-none ml-4 mb-4">
              <li>
                <strong>Email:</strong> legal@pr1as.com
              </li>
              <li>
                <strong>Điện thoại:</strong> 1900-xxxx
              </li>
              <li>
                <strong>Địa chỉ:</strong> [Địa chỉ công ty]
              </li>
            </ul>

            <div className="!mt-12 !p-6 !bg-gray-50 !rounded-lg">
              <Paragraph className="!mb-0 !text-sm !text-gray-600">
                Bằng cách sử dụng nền tảng PR1AS, bạn xác nhận rằng bạn đã đọc,
                hiểu và đồng ý bị ràng buộc bởi các điều khoản sử dụng này.
              </Paragraph>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
