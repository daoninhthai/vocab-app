# VocabMaster - macOS Desktop App

> Smart Vocabulary Learning with Spaced Repetition

## Chạy ứng dụng Desktop

### Cách 1: Chạy trực tiếp (Development mode)
```bash
npm run electron
```

### Cách 2: Chạy với logging (để debug)
```bash
npm run electron-dev
```

### Cách 3: Build thành file .app (để cài đặt)
```bash
# Build cho macOS (tạo file .dmg và .zip)
npm run build:mac

# File .dmg sẽ được tạo trong thư mục dist/
# Kéo file .app vào thư mục Applications để cài đặt
```

## Tính năng Desktop App

✅ **Chạy độc lập**: Không cần mở trình duyệt, app sẽ tự động khởi động server backend
✅ **Tự động khởi động server**: Express server sẽ tự động start khi mở app
✅ **Tự động tắt server**: Server sẽ tự động dừng khi đóng app
✅ **Giao diện riêng**: App có cửa sổ riêng, không phụ thuộc vào browser
✅ **Database local**: Dữ liệu được lưu tại `server/db.json`

## Cấu trúc Project

```
vocabmaster/
├── electron.js          # Main process của Electron
├── server/              # Backend Express server
│   ├── index.js        # Server chính
│   ├── database.js     # Kết nối database
│   └── db.json         # Database file
├── public/             # Frontend
│   └── index.html      # UI của app
└── package.json        # Config và scripts
```

## Build Distribution

Sau khi build (`npm run build:mac`), bạn sẽ có:

- **dist/VocabMaster-1.0.0.dmg**: File cài đặt cho macOS
- **dist/VocabMaster-1.0.0-mac.zip**: File nén chứa .app

### Cài đặt:
1. Mở file .dmg
2. Kéo app vào thư mục Applications
3. Mở app từ Applications hoặc Launchpad

## Lưu ý

- App sẽ tự động khởi động server ở port 8688
- Database được lưu tại `server/db.json` trong thư mục app
- Để xem logs khi chạy, dùng `npm run electron-dev`
- Nếu port 8688 bị chiếm, cần đổi port trong `server/index.js` và `electron.js`

## Shortcuts

- **Cmd + R**: Reload app
- **Cmd + Q**: Quit app
- **Cmd + W**: Đóng cửa sổ

## Troubleshooting

### App không khởi động
- Kiểm tra port 8688 có bị chiếm không
- Chạy `npm run electron-dev` để xem logs chi tiết

### Database không lưu
- Kiểm tra quyền write vào thư mục `server/`
- Xem file `server/db.json` có tồn tại không

### Build thất bại
- Đảm bảo đã cài đủ dependencies: `npm install`
- Kiểm tra Node.js version >= 18
