# VocabMaster

<div align="center">
  <img src="public/icon.svg" alt="VocabMaster Logo" width="120" height="120">
  <p><strong>Smart Vocabulary Learning with Spaced Repetition</strong></p>
</div>

Ứng dụng học từ vựng tiếng Anh thông minh với phương pháp Spaced Repetition (lặp lại ngắt quãng). Có thể chạy trên web hoặc như một ứng dụng desktop độc lập trên macOS.

## ✨ Tính năng

- ✅ **Auto-fill thông tin từ**: Tự động điền IPA, nghĩa, ví dụ khi nhập từ mới
- ✅ **Dịch tiếng Việt**: Dịch nghĩa và ví dụ sang tiếng Việt
- ✅ **Từ đồng nghĩa & trái nghĩa**: Hiển thị và thêm nhanh các từ liên quan
- ✅ **Phát âm UK/US**: Text-to-Speech cho cả giọng Anh và Mỹ
- ✅ **Spaced Repetition**: Hệ thống 7 cấp độ với lịch ôn tập tự động
- ✅ **Thống kê chi tiết**: Theo dõi tiến độ học tập
- ✅ **Import/Export**: Sao lưu và khôi phục dữ liệu (JSON, CSV)
- ✅ **Desktop App**: Chạy như ứng dụng độc lập trên macOS
- ✅ **Giao diện đẹp**: Modern UI với gradient và glassmorphism

## 🔧 Công nghệ

- **Backend**: Node.js + Express
- **Database**: LowDB (JSON-based)
- **Frontend**: React (vanilla JSX via Babel)
- **Styling**: TailwindCSS
- **Desktop**: Electron
- **APIs**: Free Dictionary API, Google Translate, Web Speech API

## 🚀 Cài đặt và Chạy

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Chạy ứng dụng

#### Option A: Chạy như Web App

**Chế độ development (tự động restart khi có thay đổi):**
```bash
npm run dev
```

**Chế độ production:**
```bash
npm start
```

Sau đó mở trình duyệt tại `http://localhost:8688`

#### Option B: Chạy như Desktop App (macOS)

**Chạy trực tiếp:**
```bash
npm run electron
```

**Build file .app để cài đặt:**
```bash
npm run build:mac
```

File .dmg sẽ được tạo trong thư mục `dist/`.

📖 **Xem hướng dẫn cài đặt chi tiết tại [CAI_DAT.md](CAI_DAT.md)**

Hoặc xem hướng dẫn development tại [DESKTOP_APP.md](DESKTOP_APP.md)

### 3. Tạo icon PNG (tùy chọn)

Mở file `create-icon.html` trong trình duyệt và click các nút để tải xuống icon PNG với kích thước khác nhau.

Truy cập: http://localhost:3000

## 📊 Quy tắc Spaced Repetition

| Cấp độ | Tên | Khoảng thời gian ôn lại |
|--------|-----|-------------------------|
| 0 | Từ mới | Chưa học |
| 1 | Lần 1 | 3 ngày |
| 2 | Lần 2 | 1 tuần |
| 3 | Lần 3 | 2 tuần |
| 4 | Lần 4 | 1 tháng |
| 5 | Lần 5 | 2 tháng |
| 6 | Lần 6 | 3 tháng (lặp lại) |

## 🗂️ Cấu trúc Database

### Table: words
- `id`: ID tự tăng
- `word`: Từ vựng
- `ipaUK`: Phiên âm UK
- `ipaUS`: Phiên âm US
- `meaningEN`: Nghĩa tiếng Anh
- `meaningVI`: Nghĩa tiếng Việt
- `example`: Câu ví dụ
- `level`: Cấp độ hiện tại (0-6)
- `dateAdded`: Ngày thêm
- `lastLearnedDate`: Ngày học lần cuối
- `nextReviewDate`: Ngày ôn tập tiếp theo

### Table: learning_history
- `id`: ID tự tăng
- `wordId`: ID của từ
- `date`: Ngày học
- `fromLevel`: Từ cấp độ
- `toLevel`: Đến cấp độ

## 🛠️ API Endpoints

### Words
- `GET /api/words` - Lấy tất cả từ
- `GET /api/words/:id` - Lấy chi tiết một từ
- `POST /api/words` - Thêm từ mới
- `PUT /api/words/:id` - Cập nhật từ
- `DELETE /api/words/:id` - Xóa từ

### Actions
- `POST /api/words/:id/learn` - Đánh dấu đã học (tăng level)
- `POST /api/words/:id/reset` - Reset về level 0

### Data
- `GET /api/export` - Export tất cả dữ liệu
- `POST /api/import` - Import dữ liệu
- `GET /api/stats` - Lấy thống kê

## 📝 Ghi chú

- Database được lưu tại `server/vocabulary.db`
- Ứng dụng tự động kiểm tra và reset các từ cần ôn tập mỗi khi tải dữ liệu
- Dữ liệu được lưu trữ vĩnh viễn trong database, không bị mất khi tắt trình duyệt

## 📄 License

MIT
# VocabMaster
