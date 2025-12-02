"use client";

import { Typography, Card } from "antd";
import MainLayout from "@/components/layout/MainLayout";
import { useTranslation } from "react-i18next";

const { Title, Paragraph } = Typography;

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="!shadow-lg">
            <Title level={1} className="!text-center !mb-8">
              Chính Sách Bảo Mật
            </Title>
            <Paragraph className="!text-gray-500 !text-center !mb-12">
              Cập nhật lần cuối: 17/11/2025
            </Paragraph>

            {/* Section 1 */}
            <Title level={2} className="!mt-8 !mb-4">
              1. Giới Thiệu
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              PR1AS cam kết bảo vệ quyền riêng tư và bảo mật thông tin cá nhân
              của bạn. Chính sách bảo mật này giải thích cách chúng tôi thu
              thập, sử dụng, lưu trữ và bảo vệ thông tin của bạn khi sử dụng nền
              tảng của chúng tôi.
            </Paragraph>

            {/* Section 2 */}
            <Title level={2} className="!mt-8 !mb-4">
              2. Thông Tin Chúng Tôi Thu Thập
            </Title>
            <Title level={3} className="!mt-6 !mb-3 !text-lg">
              2.1. Thông tin cá nhân
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Khi bạn đăng ký tài khoản, chúng tôi thu thập:
            </Paragraph>
            <ul className="list-disc list-inside ml-4 mb-4">
              <li>Họ và tên</li>
              <li>Địa chỉ email</li>
              <li>Số điện thoại</li>
              <li>Địa chỉ</li>
              <li>Ảnh đại diện (tùy chọn)</li>
            </ul>

            <Title level={3} className="!mt-6 !mb-3 !text-lg">
              2.2. Thông tin thanh toán
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Để xử lý giao dịch, chúng tôi có thể thu thập thông tin thẻ tín
              dụng/ghi nợ hoặc thông tin tài khoản ngân hàng. Tất cả thông tin
              thanh toán được mã hóa và xử lý thông qua các cổng thanh toán bảo
              mật.
            </Paragraph>

            <Title level={3} className="!mt-6 !mb-3 !text-lg">
              2.3. Thông tin sử dụng
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Chúng tôi tự động thu thập thông tin về cách bạn sử dụng nền tảng
              của chúng tôi, bao gồm:
            </Paragraph>
            <ul className="list-disc list-inside ml-4 mb-4">
              <li>Lịch sử tìm kiếm và đặt chỗ</li>
              <li>Địa chỉ IP và vị trí</li>
              <li>Loại thiết bị và trình duyệt</li>
              <li>Thời gian và tần suất truy cập</li>
            </ul>

            {/* Section 3 */}
            <Title level={2} className="!mt-8 !mb-4">
              3. Cách Chúng Tôi Sử Dụng Thông Tin
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Chúng tôi sử dụng thông tin của bạn để:
            </Paragraph>
            <ul className="list-disc list-inside ml-4 mb-4">
              <li>Cung cấp và cải thiện dịch vụ của chúng tôi</li>
              <li>Xử lý giao dịch và thanh toán</li>
              <li>Gửi thông báo về dịch vụ và cập nhật</li>
              <li>Cá nhân hóa trải nghiệm người dùng</li>
              <li>Phát hiện và ngăn chặn gian lận</li>
              <li>Tuân thủ các yêu cầu pháp lý</li>
            </ul>

            {/* Section 4 */}
            <Title level={2} className="!mt-8 !mb-4">
              4. Chia Sẻ Thông Tin
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Chúng tôi không bán thông tin cá nhân của bạn. Chúng tôi chỉ chia
              sẻ thông tin của bạn trong các trường hợp sau:
            </Paragraph>
            <ul className="list-disc list-inside ml-4 mb-4">
              <li>
                <strong>Với Workers:</strong> Khi bạn đặt dịch vụ, chúng tôi
                chia sẻ thông tin cần thiết với worker để hoàn thành công việc
              </li>
              <li>
                <strong>Với đối tác thanh toán:</strong> Để xử lý giao dịch một
                cách an toàn
              </li>
              <li>
                <strong>Theo yêu cầu pháp lý:</strong> Khi được yêu cầu bởi luật
                pháp hoặc cơ quan chức năng
              </li>
              <li>
                <strong>Với sự đồng ý của bạn:</strong> Trong các trường hợp
                khác với sự cho phép rõ ràng của bạn
              </li>
            </ul>

            {/* Section 5 */}
            <Title level={2} className="!mt-8 !mb-4">
              5. Bảo Mật Thông Tin
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Chúng tôi sử dụng các biện pháp bảo mật tiêu chuẩn ngành để bảo vệ
              thông tin của bạn, bao gồm:
            </Paragraph>
            <ul className="list-disc list-inside ml-4 mb-4">
              <li>Mã hóa SSL/TLS cho dữ liệu truyền tải</li>
              <li>Mã hóa dữ liệu nhạy cảm khi lưu trữ</li>
              <li>Kiểm soát truy cập nghiêm ngặt</li>
              <li>Giám sát bảo mật thường xuyên</li>
              <li>Đào tạo nhân viên về bảo mật dữ liệu</li>
            </ul>

            {/* Section 6 */}
            <Title level={2} className="!mt-8 !mb-4">
              6. Quyền Của Bạn
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Bạn có các quyền sau đối với dữ liệu cá nhân của mình:
            </Paragraph>
            <ul className="list-disc list-inside ml-4 mb-4">
              <li>
                <strong>Quyền truy cập:</strong> Yêu cầu xem thông tin chúng tôi
                có về bạn
              </li>
              <li>
                <strong>Quyền chỉnh sửa:</strong> Cập nhật hoặc sửa thông tin
                không chính xác
              </li>
              <li>
                <strong>Quyền xóa:</strong> Yêu cầu xóa thông tin cá nhân của
                bạn
              </li>
              <li>
                <strong>Quyền từ chối:</strong> Từ chối việc xử lý dữ liệu của
                bạn trong một số trường hợp nhất định
              </li>
              <li>
                <strong>Quyền di chuyển dữ liệu:</strong> Nhận bản sao dữ liệu
                của bạn ở định dạng có thể đọc được
              </li>
            </ul>

            {/* Section 7 */}
            <Title level={2} className="!mt-8 !mb-4">
              7. Cookies và Công Nghệ Theo Dõi
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Chúng tôi sử dụng cookies và các công nghệ tương tự để cải thiện
              trải nghiệm của bạn, phân tích việc sử dụng nền tảng và cá nhân
              hóa nội dung. Bạn có thể kiểm soát cookies thông qua cài đặt trình
              duyệt của mình.
            </Paragraph>

            {/* Section 8 */}
            <Title level={2} className="!mt-8 !mb-4">
              8. Lưu Trữ Dữ Liệu
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Chúng tôi lưu trữ thông tin của bạn miễn là tài khoản của bạn còn
              hoạt động hoặc cần thiết để cung cấp dịch vụ. Sau khi bạn xóa tài
              khoản, chúng tôi sẽ xóa hoặc ẩn danh hóa thông tin của bạn, trừ
              khi cần giữ lại theo quy định pháp luật.
            </Paragraph>

            {/* Section 9 */}
            <Title level={2} className="!mt-8 !mb-4">
              9. Quyền Riêng Tư Của Trẻ Em
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Dịch vụ của chúng tôi không dành cho người dưới 18 tuổi. Chúng tôi
              không cố ý thu thập thông tin cá nhân từ trẻ em. Nếu bạn phát hiện
              chúng tôi đã thu thập thông tin từ trẻ em, vui lòng liên hệ với
              chúng tôi để xóa.
            </Paragraph>

            {/* Section 10 */}
            <Title level={2} className="!mt-8 !mb-4">
              10. Thay Đổi Chính Sách
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian.
              Chúng tôi sẽ thông báo cho bạn về bất kỳ thay đổi quan trọng nào
              bằng cách đăng chính sách mới trên trang này và cập nhật ngày
              &quot;Cập nhật lần cuối&quot;.
            </Paragraph>

            {/* Section 11 */}
            <Title level={2} className="!mt-8 !mb-4">
              11. Liên Hệ
            </Title>
            <Paragraph className="!text-base !leading-relaxed">
              Nếu bạn có câu hỏi về chính sách bảo mật này hoặc muốn thực hiện
              quyền của mình, vui lòng liên hệ với chúng tôi:
            </Paragraph>
            <ul className="list-none ml-4 mb-4">
              <li>
                <strong>Email:</strong> privacy@pr1as.com
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
                Bằng cách sử dụng nền tảng PR1AS, bạn đồng ý với chính sách bảo
                mật này và việc thu thập, sử dụng và chia sẻ thông tin của bạn
                như được mô tả trong chính sách này.
              </Paragraph>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
