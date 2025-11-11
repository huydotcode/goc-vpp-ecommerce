# Hướng dẫn làm việc với dự án Client React

## 📋 Mục lục

- [Setup ban đầu](#setup-ban-đầu)
- [Các lệnh thường dùng](#các-lệnh-thường-dùng)
- [Workflow làm việc](#workflow-làm-việc)
- [Code Conventions](#code-conventions)
- [Git Workflow](#git-workflow)
- [Environment Variables](#environment-variables)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Lưu ý quan trọng](#lưu-ý-quan-trọng)

## 🚀 Setup ban đầu

### 1. Clone repository và cài dependencies

```bash
npm install
```

### 2. Tạo file `.env` từ template

```bash
cp example.env .env
```

### 3. Cấu hình Environment Variables

Chỉnh sửa file `.env` theo môi trường của bạn:

```env
VITE_API_URL=http://localhost:8080
```

### 4. Setup Husky (Git Hooks)

```bash
npm run prepare
```

Hoặc Husky sẽ tự động setup khi chạy `npm install` (vì có script `prepare`).

### 5. Chạy development server

```bash
npm run dev
```

## 📝 Các lệnh thường dùng

| Lệnh               | Mô tả                                          |
| ------------------ | ---------------------------------------------- |
| `npm run dev`      | Chạy development server                        |
| `npm run build`    | Build production (kiểm tra TypeScript + build) |
| `npm run lint`     | Kiểm tra lỗi ESLint                            |
| `npm run lint:fix` | Tự động sửa lỗi ESLint                         |
| `npm run format`   | Format code với Prettier                       |
| `npm run preview`  | Preview build production                       |

## 🔄 Workflow làm việc

### 1. Trước khi bắt đầu code

```bash
# Pull latest code
git pull origin main

# Tạo branch mới
git checkout -b feat/your-feature-name
# hoặc
git checkout -b fix/bug-description
```

### 2. Khi code

- ✅ Sử dụng **TypeScript** (không dùng JavaScript)
- ✅ Tuân thủ **ESLint rules**
- ✅ Code sẽ tự động được format khi commit (Prettier)
- ✅ Sử dụng path aliases `@/` thay vì relative paths

### 3. Trước khi commit

Code sẽ tự động được kiểm tra và format qua **Husky pre-commit hooks**:

- ESLint sẽ tự động fix các lỗi có thể fix được
- Prettier sẽ format code
- Nếu có lỗi ESLint không thể tự fix, commit sẽ bị chặn

### 4. Commit message

Sử dụng [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add login page
fix: resolve button styling issue
chore: update dependencies
docs: update README
refactor: optimize component structure
```

**Prefix:**

- `feat:` - Tính năng mới
- `fix:` - Sửa lỗi
- `chore:` - Công việc bảo trì
- `docs:` - Cập nhật documentation
- `refactor:` - Refactor code
- `style:` - Thay đổi formatting
- `test:` - Thêm/sửa tests

## 💻 Code Conventions

### 1. Path Aliases

Sử dụng `@/` thay vì relative paths:

```typescript
// ✅ Đúng
import Button from "@/components/Button";
import { apiClient } from "@/services/api";
import { User } from "@/types";

// ❌ Sai
import Button from "../../components/Button";
import { apiClient } from "../../../services/api";
```

### 2. Import Order

Thứ tự import:

```typescript
// 1. React imports
import { useState, useEffect } from "react";

// 2. Third-party libraries
import { Button } from "antd";
import { useNavigate } from "react-router-dom";

// 3. Internal imports (dùng @/)
import { apiClient } from "@/services/api";
import { User } from "@/types";

// 4. Relative imports
import "./styles.css";
```

### 3. TypeScript

- ✅ **Strict mode** đã được bật
- ✅ Không dùng `any` (trừ trường hợp đặc biệt cần comment giải thích)
- ✅ Định nghĩa types/interfaces rõ ràng
- ✅ Sử dụng type inference khi có thể

```typescript
// ✅ Đúng
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = { id: 1, name: "John", email: "john@example.com" };

// ❌ Sai
const user: any = { id: 1, name: "John" };
```

### 4. Styling

- ✅ Ưu tiên **Tailwind CSS** classes
- ✅ Sử dụng **Ant Design** components khi phù hợp
- ✅ Custom CSS chỉ khi thực sự cần thiết

```typescript
// ✅ Đúng - Tailwind
<div className="flex items-center justify-center p-4 bg-blue-500">

// ✅ Đúng - Ant Design
<Button type="primary" onClick={handleClick}>
  Click me
</Button>

// ⚠️ Hạn chế - Custom CSS
<div className="custom-wrapper">
```

### 5. Component Structure

```typescript
// ✅ Component structure mẫu
import { useState } from 'react'
import { Button } from 'antd'

interface Props {
  title: string
  onClick: () => void
}

export default function MyComponent({ title, onClick }: Props) {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={onClick}>Click</Button>
    </div>
  )
}
```

## 🔀 Git Workflow

### Branch naming

- `feat/feature-name` - Tính năng mới
- `fix/bug-description` - Sửa lỗi
- `chore/task-description` - Công việc bảo trì
- `refactor/description` - Refactor code

### Pull Request Process

1. Tạo branch từ `main` hoặc `develop`
2. Code và commit
3. Push branch lên remote
4. Tạo Pull Request
5. Đợi review và approve
6. Merge vào main branch

## 🌍 Environment Variables

### Setup

1. Copy `example.env` thành `.env`:

```bash
cp example.env .env
```

2. Chỉnh sửa `.env` với giá trị của bạn:

```env
VITE_API_URL=http://localhost:8080
```

### Sử dụng

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

### Lưu ý

- ⚠️ File `.env` **KHÔNG** được commit (đã ignore)
- ✅ File `example.env` được commit làm template
- ✅ Type definitions có trong `src/vite-env.d.ts`

## 🪝 Pre-commit Hooks

### Hoạt động tự động

Khi bạn commit code, **Husky** sẽ tự động:

1. ✅ Chạy ESLint và tự động fix các lỗi có thể fix
2. ✅ Format code với Prettier
3. ⚠️ Nếu có lỗi ESLint không thể tự fix → commit bị chặn

### Xử lý khi commit bị chặn

```bash
# Chạy lệnh này để xem lỗi
npm run lint

# Tự động fix các lỗi có thể fix
npm run lint:fix

# Format code
npm run format

# Commit lại
git add .
git commit -m "your message"
```

## 🛠️ Công nghệ sử dụng

- **React 19.2** - UI Framework
- **TypeScript 5.9** - Type safety
- **Vite 7.2** - Build tool
- **Ant Design 5.28** - UI Component Library
- **Tailwind CSS 4.1** - Utility-first CSS
- **React Router DOM 7.9** - Routing
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Run linters on staged files

## ⚠️ Lưu ý quan trọng

### ❌ KHÔNG được làm

- ❌ Commit file `.env`
- ❌ Commit `node_modules/`
- ❌ Commit `dist/` folder
- ❌ Sử dụng `any` type không cần thiết
- ❌ Bỏ qua ESLint errors
- ❌ Commit code chưa được format

### ✅ NÊN làm

- ✅ Luôn chạy `npm run lint` trước khi push
- ✅ Code phải pass ESLint và TypeScript checks
- ✅ Sử dụng TypeScript cho tất cả files
- ✅ Tuân thủ code style (Prettier + EditorConfig)
- ✅ Viết commit message rõ ràng
- ✅ Review code trước khi merge

## 🐛 Troubleshooting

### Lỗi ESLint khi commit

```bash
# Chạy lệnh này để fix
npm run lint:fix
```

### Lỗi TypeScript

```bash
# Kiểm tra type errors
npm run build
```

### Prettier không format

```bash
# Format thủ công
npm run format
```

### Husky không hoạt động

```bash
# Setup lại Husky
npm run prepare
```

## 📚 Tài liệu tham khảo

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Ant Design Documentation](https://ant.design/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com/)
- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)

## ❓ Cần hỗ trợ?

Nếu có bất kỳ câu hỏi nào:

1. Kiểm tra file `README.md`
2. Xem config trong các file: `.prettierrc`, `eslint.config.js`, `tsconfig.json`
3. Hỏi team lead hoặc team members
4. Tạo issue trên repository

---

**Chúc mọi người làm việc hiệu quả! 🚀**
