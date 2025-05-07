# 🚀 Cài đặt VocabMaster trên macOS

## ✅ App đã được build thành công!

File cài đặt nằm tại: `dist/VocabMaster-1.0.0-arm64.dmg`

## 📦 Cách cài đặt:

### Bước 1: Mở file DMG
Tôi đã mở file DMG cho bạn rồi. Nếu chưa mở, double-click vào file:
```
dist/VocabMaster-1.0.0-arm64.dmg
```

### Bước 2: Kéo app vào Applications
1. Một cửa sổ Finder sẽ hiện ra
2. Kéo icon **VocabMaster.app** vào thư mục **Applications**
3. Đợi quá trình copy hoàn tất

### Bước 3: Chạy app
Có 3 cách để mở:

**Cách 1: Từ Applications**
- Mở Finder → Applications
- Tìm VocabMaster.app
- Double-click để mở

**Cách 2: Từ Launchpad**
- Nhấn F4 hoặc pinch 4 ngón tay trên trackpad
- Tìm VocabMaster
- Click vào icon

**Cách 3: Từ Spotlight**
- Nhấn Cmd + Space
- Gõ "VocabMaster"
- Enter để mở

## ✅ Mở app sau khi cài đặt

App VocabMaster bây giờ có thể mở bằng nhiều cách:

1. **Từ Dock**: Nếu app đang chạy, click vào icon trong Dock
2. **Từ Applications**: Finder → Applications → Double-click VocabMaster.app
3. **Từ Spotlight**: Cmd+Space → Gõ "VocabMaster" → Enter
4. **Từ Launchpad**: F4 → Tìm VocabMaster → Click

## ⚠️ Lưu ý quan trọng

### Lần đầu mở app
macOS có thể cảnh báo: **"VocabMaster can't be opened because it is from an unidentified developer"**

**Cách xử lý:**
1. Đóng cảnh báo
2. Mở **System Settings** (hoặc System Preferences)
3. Vào **Privacy & Security**
4. Cuộn xuống dưới, tìm dòng: **"VocabMaster was blocked from use because it is not from an identified developer"**
5. Click nút **"Open Anyway"**
6. Xác nhận **"Open"** trong popup tiếp theo

Hoặc cách nhanh hơn:
1. Click chuột phải vào VocabMaster.app
2. Chọn **"Open"**
3. Click **"Open"** trong popup xác nhận

### App hoạt động như thế nào?
- App sẽ tự động khởi động server backend (port 8688)
- Cửa sổ app sẽ mở với giao diện đầy đủ
- Khi đóng app, server sẽ tự động dừng
- Database được lưu trong app, không mất dữ liệu

## 🎉 Hoàn tất!

Bây giờ bạn có thể dùng VocabMaster như một app thông thường trên Mac:
- Click vào icon trong Dock để mở
- Cmd + Q để thoát
- Cmd + W để đóng cửa sổ
- Cmd + M để minimize

## 📂 Vị trí file

- **App installed**: `/Applications/VocabMaster.app`
- **Database**: Nằm trong app bundle
- **File DMG gốc**: `/Users/macbook/code dạo/bot/english/dist/VocabMaster-1.0.0-arm64.dmg`

## 🔄 Update app

Khi có version mới:
1. Build lại: `npm run build:mac`
2. Xóa app cũ trong Applications
3. Cài đặt app mới từ file DMG mới

## ❓ Troubleshooting

### App không mở được
- Kiểm tra Privacy & Security settings
- Thử click chuột phải → Open

### Port 8688 đã bị chiếm
- Tắt app/server khác đang dùng port 8688
- Hoặc đổi port trong `server/index.js` và `electron.js`

### App chạy chậm
- Check Activity Monitor xem có process nào đang chiếm CPU
- Restart app

---

**Chúc bạn học vui với VocabMaster! 🎓✨**
