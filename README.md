# 🎯 今天吃什么大转盘

一个有趣的外卖选择工具，通过大转盘的形式帮助用户解决"今天吃什么"的世纪难题！

## ✨ 功能特性

### 🎡 核心功能
- **大转盘随机选择**: 点击转动按钮，转盘开始旋转并随机停止，指针指向的选项即为推荐餐食
- **多套餐管理**: 支持创建多个转盘套餐（如中餐、西餐、快餐等），每个套餐最多15个选项
- **自定义选项**: 可以添加、编辑、删除餐食选项，支持拖拽排序
- **实时预览**: 在管理页面可以实时预览转盘效果
- **背景音乐**: 内置轻音乐背景，提升使用体验

### 🎨 用户体验
- **流畅动画**: 转盘旋转动画流畅自然，具有逐渐减速的物理效果
- **响应式设计**: 完美适配桌面端和移动端
- **直观界面**: 简洁美观的界面设计，操作简单易懂
- **数据持久化**: 使用浏览器本地存储，数据不会丢失

## 🚀 技术栈

- **前端框架**: Vue 3 (Composition API)
- **开发语言**: TypeScript
- **构建工具**: Vite
- **路由管理**: Vue Router 4
- **状态管理**: Pinia
- **UI 组件库**: Element Plus
- **样式预处理器**: SCSS
- **代码规范**: ESLint + Prettier

## 📦 安装与使用（前端）

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖
```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

### 开发模式
```bash
# 启动开发服务器
npm run dev

# 或
yarn dev
```

### 构建生产版本
```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 代码检查
```bash
# 类型检查
npm run typecheck

# 代码规范检查
npm run lint

# 代码格式化
npm run format
```

## 🏗️ 项目结构

```
order-takeout-turntable/
├── public/                    # 静态资源
├── src/                       # 源代码
│   ├── assets/               # 静态资源
│   │   └── styles/           # 全局样式
│   ├── components/           # 组件
│   │   └── wheel/            # 转盘相关组件
│   ├── views/                # 页面组件
│   │   ├── Home.vue          # 首页（转盘页面）
│   │   └── Management.vue    # 管理页面
│   ├── stores/               # Pinia 状态管理
│   ├── router/               # 路由配置
│   ├── App.vue               # 根组件
│   └── main.ts               # 应用入口
├── docs/                     # 项目文档
├── package.json              # 项目配置
└── README.md                 # 项目说明
```

## 🎮 使用说明

### 首页 - 大转盘
1. 在顶部选择要使用的转盘套餐
2. 点击"开始转动"按钮，转盘开始旋转
3. 转盘停止后，查看推荐结果
4. 可以点击"管理转盘"进入管理页面

### 管理页面 - 转盘配置
1. **套餐管理**:
   - 左侧显示所有套餐列表
   - 点击"新建"创建新套餐
   - 可以删除不需要的套餐

2. **选项管理**:
   - 选择套餐后，右侧显示编辑界面
   - 可以修改套餐名称
   - 添加、编辑、删除餐食选项
   - 支持拖拽排序选项
   - 实时预览转盘效果

3. **数据限制**:
   - 套餐名称最多20个字符
   - 餐食选项最多10个字符
   - 每个套餐最多15个选项

## 🔧 开发指南

### 添加新的转盘选项
1. 进入管理页面
2. 选择或创建套餐
3. 在"新增选项"输入框中输入餐食名称
4. 点击"添加"按钮

### 自定义转盘样式
转盘组件位于 `src/components/wheel/WheelCanvas.vue`，可以修改：
- 转盘大小和颜色
- 扇形样式和文字
- 旋转动画效果

### 状态管理
使用 Pinia 进行状态管理，主要 store 文件：
- `stores/wheel.ts`: 转盘数据和状态管理
- `stores/app.ts`: 应用全局状态

## 📱 浏览器兼容性

- Chrome >= 88
- Firefox >= 85
- Safari >= 14
- Edge >= 88

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- 感谢所有为这个项目做出贡献的开发者
- 特别感谢 Vue.js 和 Element Plus 团队提供的优秀框架和组件库

## 📞 联系我们

- 项目地址: [GitHub](https://github.com/372798735/order-takeout-turntable)
- 问题反馈: [Issues](https://github.com/372798735/order-takeout-turntable/issues)

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！

---

## 🗄️ 后端 API（NestJS + Prisma）

仓库内新增 `apps/api` 提供数据库存储与同步能力。

### 快速开始

```bash
cd apps/api
npm i

# 在 apps/api 目录创建 .env
echo DATABASE_URL=mysql://root:password@localhost:3306/turntable > .env
echo JWT_SECRET=change_me_in_prod >> .env
echo CORS_ORIGINS=http://localhost:5173 >> .env
echo PORT=3001 >> .env

npm run prisma:generate
npm run prisma:migrate
npm run dev
```

基础路径：`/api/v1`

- 认证
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`

- 套餐 WheelSet
  - `GET /wheel-sets`
  - `POST /wheel-sets` { name }
  - `GET /wheel-sets/:id`
  - `PATCH /wheel-sets/:id` { name, version? }
  - `DELETE /wheel-sets/:id`
  - `POST /wheel-sets/:id/items`
  - `PATCH /wheel-sets/:id/items/:itemId`
  - `DELETE /wheel-sets/:id/items/:itemId`
  - `POST /wheel-sets/:id/items:reorder` { items: [{ id, order }] }
  - `POST /wheel-sets/import`  从前端本地存储导入

前端本地存储键名：`wheel-turntable-data`

导入 payload 示例（与前端 `src/stores/wheel.ts` 的 `AppState` 对齐，但仅使用 `wheelSets` 字段，忽略 `id/createdAt/updatedAt`）：

```json
{
  "wheelSets": [
    {
      "name": "今天吃什么",
      "items": [
        { "name": "汉堡" },
        { "name": "披萨" }
      ]
    }
  ]
}
```

导入规则：
- 仅读取 `wheelSets[*].name` 与 `wheelSets[*].items[*].name|color`；顺序写入 `order`。
- 数据按当前登录用户归属，旧的本地 `id` 与时间戳不会沿用。
