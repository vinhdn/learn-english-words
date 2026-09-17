# Ghi âm và đánh giá đọc theo

## Mục tiêu

Giúp bé nghe mẫu, tự đọc, nghe lại giọng của mình và nhận phản hồi nhẹ nhàng. Điểm số chỉ là tín hiệu tham khảo từ nhận dạng giọng nói của trình duyệt, không phải đánh giá chuẩn phát âm lâm sàng.

## Luồng sử dụng

1. Bé bấm **Nghe mẫu**.
2. Bé bấm **Bắt đầu ghi âm** và cho phép micro.
3. Bé đọc từ tiếng Anh; hệ thống tự dừng sau tối đa 7 giây hoặc bé bấm Dừng.
4. Nếu trình duyệt hỗ trợ nhận dạng English (US), hệ thống so sánh transcript với từ mẫu.
5. Bé có thể bấm **Nghe giọng con** và **Làm lại**.

## Cách tính điểm

- Chuẩn hóa chữ thường, dấu câu và khoảng trắng.
- So khớp chính xác trước; sau đó dùng normalized Levenshtein similarity.
- 90–100: Rất rõ.
- 65–89: Gần đúng.
- Dưới 65: Thử lại.

Điểm không phân tích trực tiếp từng phoneme. Với trẻ nhỏ, microphone, tiếng ồn và chất lượng dịch vụ nhận dạng có thể ảnh hưởng lớn.

## Quyền riêng tư

- Website tạo bản ghi tạm bằng `MediaRecorder` và không tải file đó lên API/database của dự án.
- URL bản ghi được thu hồi khi bé làm lại hoặc rời component.
- Chrome/Android có thể gửi âm thanh đến dịch vụ nhận dạng giọng nói của trình duyệt để tạo transcript.
- Phụ huynh có thể từ chối micro; bài học vẫn tiếp tục được.

## Yêu cầu trình duyệt

- HTTPS.
- `getUserMedia` và `MediaRecorder` để ghi/nghe lại.
- `SpeechRecognition` hoặc `webkitSpeechRecognition` để chấm tự động.
- Nếu thiếu SpeechRecognition, vẫn ghi âm/nghe lại được nhưng không có điểm tự động.

## Kiểm tra thực tế

Thử trên tablet Android trong phòng yên tĩnh với các nhóm: short vowels (`cat`, `bed`, `pig`), âm cuối (`desk`, `milk`) và âm khó (`three`, `mouth`, `this`). Không dùng một lần nhận dạng sai để kết luận bé phát âm sai.
