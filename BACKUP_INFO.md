# 🔄 Auto-Backup - VocabMaster

## Tính năng Tự động Backup

VocabMaster tự động backup dữ liệu của bạn hàng tuần để đảm bảo an toàn.

## 📅 Lịch Backup

- **Tần suất**: 1 lần/tuần (7 ngày)
- **Thời điểm**: Tự động kiểm tra khi khởi động app và mỗi 24 giờ
- **Lưu trữ**: Giữ lại 10 bản backup gần nhất, tự động xóa backup cũ

## 📁 Vị trí Lưu Backup

### macOS App:
```
~/Library/Application Support/vocabmaster/backups/
```

### Development Mode:
```
/Users/macbook/code dạo/bot/english/backups/
```

## 📦 Format File Backup

File backup có định dạng:
```
backup_YYYY-MM-DDTHH-MM-SS.json
```

Ví dụ: `backup_2026-01-23T22-30-45.json`

## 📊 Nội dung Backup

Mỗi file backup chứa:
```json
{
  "words": [...],
  "nextId": 123,
  "backupMetadata": {
    "createdAt": "2026-01-23T22:30:45.123Z",
    "wordCount": 50,
    "version": "1.0.0"
  }
}
```

## 🔧 Cách Hoạt Động

1. **Kiểm tra tự động**: App kiểm tra backup gần nhất khi khởi động
2. **Tạo backup**: Nếu đã qua 7 ngày kể từ backup cuối, tạo backup mới
3. **Dọn dẹp**: Tự động xóa backup cũ, chỉ giữ 10 bản gần nhất
4. **Thông báo**: Console log hiển thị trạng thái backup

## 💾 Backup Thủ Công

Ngoài auto-backup, bạn có thể backup thủ công:

1. **Từ UI**: Click nút "💾 Backup" trên header
   - Tải file JSON về máy
   - Đồng thời tạo backup trên server

2. **API Endpoint**:
   ```bash
   POST http://localhost:8688/api/backup
   ```

## 📖 Xem Logs

Khi app khởi động, bạn sẽ thấy logs:
```
🔄 Starting auto-backup scheduler...
📅 Days since last backup: X
✅ Auto-backup not needed yet
```

Hoặc khi backup được tạo:
```
🔄 Running weekly auto-backup...
✅ Backup created: backup_2026-01-23T22-30-45.json
📁 Location: ~/Library/Application Support/vocabmaster/backups/backup_2026-01-23T22-30-45.json
📊 Words backed up: 50
```

## 🔄 Khôi Phục từ Backup

### Cách 1: Qua UI
1. Click nút "📥 Import"
2. Chọn file backup (.json)
3. Xác nhận import

### Cách 2: Manual
1. Mở file backup trong thư mục backups
2. Copy nội dung `words` array
3. Import qua UI hoặc API

## ⚠️ Lưu Ý Quan Trọng

1. **Không xóa thư mục backups**: Thư mục này chứa bản sao an toàn dữ liệu của bạn
2. **Backup chỉ tạo khi có dữ liệu**: Nếu database trống, không tạo backup
3. **10 backups gần nhất**: Hệ thống tự động giữ 10 bản mới nhất
4. **Check hàng ngày**: App kiểm tra mỗi 24 giờ, không phải đúng 7 ngày kể từ lần backup trước

## 🛡️ Bảo Mật

- Backup lưu local trên máy bạn
- Không upload lên cloud
- Chỉ có bạn mới truy cập được
- Dữ liệu được lưu dạng JSON plain text (có thể đọc được)

## 🔍 Troubleshooting

### Backup không được tạo?
1. Check console logs khi khởi động app
2. Kiểm tra quyền write vào thư mục Application Support
3. Đảm bảo database có ít nhất 1 từ

### Không tìm thấy folder backups?
- Folder chỉ được tạo khi backup đầu tiên được thực hiện
- Thử click nút "💾 Backup" để tạo backup thủ công

### Muốn backup ngay lập tức?
- Click nút "💾 Backup" trên header
- File sẽ được tải về máy VÀ lưu vào folder backups

---

**Happy Learning with VocabMaster! 📚✨**
