# Animation Files

Để sử dụng animation thật, bạn có thể:

1. **Copy từ book-store-react-vite:**
   - Copy các file từ `C:/Courses/pj/book-store/book-store-react-vite/src/assets/animation/`
   - Paste vào thư mục này

2. **Download từ LottieFiles:**
   - Truy cập: https://lottiefiles.com/
   - Tìm animation phù hợp (404, 403, 401, login)
   - Download file JSON
   - Đặt vào thư mục này

3. **Sau khi có file animation:**
   - Import vào các component:
   ```typescript
   import animationData from '@/assets/animation/your-animation.json';
   ```
   - Sử dụng trong Lottie component:
   ```tsx
   <Lottie animationData={animationData} />
   ```

## Files cần thiết:
- `loadingAnimation.json` - cho 404 page
- `protectedAnimation.json` - cho 403 và 401 page  
- `loginAnimation.json` - cho login page

