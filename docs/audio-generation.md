# Tiêu chuẩn audio phát âm

## Hiện trạng v2

| Thuộc tính | Giá trị |
|---|---|
| Giọng | Samantha, English (US) — giọng tự nhiên tốt nhất đang có trên máy build |
| Số từ | 109 |
| File | 327 MP3: word + phrase + sentence |
| Tốc độ | word 128, phrase 135, sentence 138 từ/phút |
| Loudness | mục tiêu -17 LUFS, true peak -2 dBTP |
| Khoảng nghỉ | 140ms đầu, 280ms cuối |
| Encoding | mono, 44.1kHz, 64kbps MP3 |
| Fallback | Web Speech API nếu file không tải được |

Bản v1 dùng cùng tốc độ 145 cho mọi loại và không thêm khoảng nghỉ. Từ đơn trung vị chỉ 0,49 giây, dễ tạo cảm giác gấp và có thể bị hụt đầu/đuôi trên loa tablet. Bản v2 có từ đơn trung vị khoảng 0,91 giây và câu khoảng 1,53 giây.

## Generate

Yêu cầu macOS có `say`, voice Samantha, `ffmpeg`, Node và dependency của dự án.

```bash
# Chỉ tạo file còn thiếu
npm run audio:generate

# Regenerate toàn bộ sau khi đổi cấu hình
npm run audio:generate -- --force

# Dùng voice khác đã cài trên máy
npm run audio:generate -- --force --voice="Ava"
```

Script ghi metadata cấu hình vào `public/audio/manifest.json`. Không chỉnh MP3 thủ công mà không cập nhật manifest.

## Kiểm tra kỹ thuật bắt buộc

1. Đủ đúng ba file cho mỗi mục: `-word`, `-phrase`, `-sentence`.
2. Tất cả file giải mã bằng FFmpeg mà không có lỗi.
3. Từ đơn không ngắn hơn 0,65 giây sau khi thêm padding.
4. Không clipping; true peak mục tiêu không vượt -2 dBTP.
5. Server trả `Content-Type: audio/mpeg`, `Accept-Ranges: bytes` và request range trả 206.
6. Thử thật trên Chrome Android với màn hình khóa/mở, loa ngoài và tai nghe.

## Kiểm tra ngôn ngữ bằng tai người

Kiểm tra kỹ các nhóm có khả năng TTS đọc sai:

- sight words đứng riêng: `a`, `the`;
- từ có hai cách đọc: `read`;
- âm không có trong tiếng Việt: /θ/ (`three`, `mouth`), /ð/ (`the`, `this`), /ʃ/ (`fish`);
- âm cuối dễ mất: `desk`, `milk`, `hands`, `legs`;
- trọng âm từ dài: `elephant`, `vegetable`, `bathroom`;
- cặp dễ nhầm: `ship/sheep`, `sit/seat`, `full/fool` khi được thêm sau này.

Mỗi đợt thêm từ phải có một người lớn nghe toàn bộ file mới trước khi phát hành. Phân tích kỹ thuật không thể đánh giá hoàn toàn độ tự nhiên hoặc đúng âm vị.

## Khi cần chất lượng neural voice

Samantha là giọng hệ thống, chưa phải neural TTS hiện đại. Nếu cần giọng tự nhiên hơn nữa:

1. Chọn một nhà cung cấp TTS có quyền sử dụng audio trong ứng dụng.
2. Dùng một voice English (US) duy nhất để trẻ không phải thích nghi liên tục.
3. Giữ tốc độ và padding như v2.
4. Không gửi tên hoặc dữ liệu của trẻ đến dịch vụ TTS; chỉ gửi nội dung từ/câu giáo trình.
5. Generate vào thư mục tạm, audit đủ 327 file rồi mới thay bản production.
6. A/B test 20 từ khó trên tablet với phụ huynh và bé trước khi đổi toàn bộ.

Ưu tiên độ rõ và ổn định hơn cảm giác “giống người thật”. Giọng quá biểu cảm hoặc thay đổi cao độ mạnh có thể làm trẻ khó bắt chước âm.
