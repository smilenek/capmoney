# CapMoney — GitHub Pages và sao lưu theo lịch

Chạy `node build-pages.cjs` để tạo dist (không cần Node trên website). Đưa nội dung dist hoặc ZIP capmoney-github-pages-v4 lên thư mục GitHub Pages. Đường dẫn tương đối hỗ trợ cả repository và tên miền riêng.

## Sao lưu
Vào Hồ sơ → Sao lưu và lịch tự động (cũng có trong Cài đặt và Xuất báo cáo).
- Bật/tắt lịch, chọn chu kỳ 1/2/3/4/6/8/12/24 tiếng, giờ bắt đầu trên thiết bị.
- 6 tiếng từ 06:00: 06:00, 12:00, 18:00, 00:00.
- 12 tiếng từ 06:00: 06:00, 18:00.
- Chọn giữ 3/5/10 bản. Khi thêm bản mới thành công, tự loại bản cũ vượt giới hạn.
- Tạo bản ngay lưu trong kho ứng dụng; Tải sao lưu ngay xuất JSON trực tiếp.
- Các bản theo lịch gồm sổ, cài đặt, ảnh và video, dùng cùng định dạng khôi phục có sẵn.
- Bản chưa tải ra ngoài vẫn nằm trong dữ liệu trình duyệt. Nhấn Tải JSON và lưu vào Files/ổ đĩa khác để có bản độc lập.

Khi PWA đóng, trình duyệt không bảo đảm chạy nền. Khi mở lại, tạo một bản bù cho mốc gần nhất đã quá hạn bằng dữ liệu hiện tại; không thể tái tạo các trạng thái lịch sử lúc app đóng. Lịch chỉ bắt đầu từ lúc bật/lưu lịch; không tạo bù mốc trước khi bật.

## Bản v4
Đã xóa mã Google/Firebase, cấu hình và giao diện đăng nhập Google. Giữ sao lưu/khôi phục thủ công, UI/tuần đã sửa trước đó. Không cần dịch vụ ngoài cho sao lưu. Các tính năng máy chủ riêng cũ không thuộc đăng nhập Google.

PWA cache v10. Khi phát hành lần sau, tăng phiên bản CACHE trong sw.js. Có nút cập nhật, không xóa dữ liệu trình duyệt để nâng cấp.

## Kiểm tra
Chạy `node --test tests/backup-schedule.test.cjs` trong bản mã nguồn.
