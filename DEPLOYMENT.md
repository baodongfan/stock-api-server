# Stock API 部署指南

完整的股票数据 API 部署文档，支持 Vercel 和 Render 两种部署方式。

## 📦 项目结构

```
stock-api/
├── api/                    # Vercel Serverless Functions
│   ├── quote.js           # 实时行情接口
│   ├── kline.js           # K线数据接口
│   ├── indicators.js      # 技术指标接口
│   ├── search.js          # 搜索接口
│   ├── market.js          # 全市场接口
│   └── board.js           # 板块接口
├── server.js              # Express 服务器（Render 部署用）
├── package.json
├── vercel.json            # Vercel 配置
├── render.yaml            # Render 配置
└── README.md
```

---

## 🚀 方案一：Vercel 部署（推荐）

### 优点
- ✅ 免费额度充足（100GB 流量/月）
- ✅ 自动 HTTPS + 全球 CDN
- ✅ 零运维，推送代码自动部署
- ✅ 支持自定义域名
- ✅ 内置日志和监控

### 缺点
- ⚠️ Serverless 有冷启动（1-3 秒）
- ⚠️ 单次请求超时限制（免费版 10 秒）

### 部署步骤

#### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 登录 Vercel

```bash
vercel login
```

按照提示完成登录（支持 GitHub/GitLab/Bitbucket/Email）。

#### 3. 部署项目

**方式 A：命令行部署**

```bash
# 进入项目目录
cd stock-api

# 部署到生产环境
vercel --prod
```

首次部署会提示：
- Link to existing project? → **No**
- Project name? → **stock-api** (或自定义)
- Framework? → **Other**

**方式 B：GitHub 自动部署**

1. 将代码推送到 GitHub 仓库
2. 访问 https://vercel.com/new
3. 选择你的 GitHub 仓库
4. 点击 **Import**
5. 点击 **Deploy**

#### 4. 获取 API 地址

部署完成后，Vercel 会提供一个域名：
```
https://stock-api-xxx.vercel.app
```

#### 5. 测试接口

```bash
# 实时行情
curl "https://stock-api-xxx.vercel.app/api/quote?symbols=600519,000858"

# K线数据
curl "https://stock-api-xxx.vercel.app/api/kline?symbol=600519&period=daily&limit=100"

# 搜索
curl "https://stock-api-xxx.vercel.app/api/search?keyword=茅台"
```

#### 6. 配置自定义域名（可选）

1. 在 Vercel 项目设置中，点击 **Domains**
2. 添加你的域名（例如：`api.yourdomain.com`）
3. 在域名服务商处添加 CNAME 记录：
   ```
   CNAME api → cname.vercel-dns.com
   ```

---

## 🌐 方案二：Render 部署

### 优点
- ✅ 免费版 750 小时/月（足够跑一个实例）
- ✅ 无冷启动，响应更快
- ✅ 支持 WebSocket
- ✅ 提供 PostgreSQL/Redis 等数据库

### 缺点
- ⚠️ 免费版实例会休眠（15 分钟无请求）
- ⚠️ 自定义域名配置稍复杂

### 部署步骤

#### 1. 准备 GitHub 仓库

```bash
# 初始化 Git
git init

# 添加文件
git add .

# 提交
git commit -m "Initial commit"

# 推送到 GitHub
git remote add origin https://github.com/YOUR_USERNAME/stock-api.git
git push -u origin main
```

#### 2. 创建 Render 账号

访问 https://render.com 并注册账号（可用 GitHub 登录）。

#### 3. 创建 Web Service

1. 点击 **New +** → **Web Service**
2. 选择你的 GitHub 仓库
3. 配置服务：
   - **Name**: `stock-api`
   - **Region**: Singapore（或最近的区域）
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

4. 点击 **Create Web Service**

#### 4. 等待部署完成

首次部署约需 2-3 分钟，部署成功后会显示：
```
🚀 Stock API server running on port 3000
```

#### 5. 获取 API 地址

Render 会提供一个域名：
```
https://stock-api-xxx.onrender.com
```

#### 6. 测试接口

```bash
# 实时行情
curl "https://stock-api-xxx.onrender.com/api/quote?symbols=600519"

# K线数据
curl "https://stock-api-xxx.onrender.com/api/kline?symbol=600519"
```

#### 7. 防止休眠（可选）

免费版会在 15 分钟无请求后休眠，首次访问需要 10-30 秒唤醒。

**解决方案**：
- 使用 UptimeRobot 等监控服务，每 5 分钟 ping 一次
- 升级到付费版（$7/月）

---

## 🔧 本地开发

### 安装依赖

```bash
npm install
```

### Vercel 本地开发

```bash
vercel dev
```

访问 http://localhost:3000

### Express 本地开发

```bash
npm start
```

访问 http://localhost:3000

---

## 📊 性能优化建议

### 1. 添加缓存

```javascript
// 使用内存缓存（适合 Vercel）
const cache = new Map();

app.get('/api/quote', async (req, res) => {
  const cacheKey = `quote_${req.query.symbols}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.time < 60000) { // 1分钟缓存
    return res.json(cached.data);
  }
  
  const data = await fetchQuote(req.query.symbols);
  cache.set(cacheKey, { data, time: Date.now() });
  res.json(data);
});
```

### 2. 限流

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100 // 最多 100 次请求
});

app.use('/api/', limiter);
```

### 3. 错误处理

```javascript
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
```

---

## 🔐 安全建议

### 1. API Key 认证（可选）

```javascript
const API_KEY = process.env.API_KEY;

app.use((req, res, next) => {
  const key = req.headers['x-api-key'];
  if (API_KEY && key !== API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  next();
});
```

### 2. CORS 配置

```javascript
import cors from 'cors';

app.use(cors({
  origin: ['https://yourdomain.com'], // 只允许指定域名
  methods: ['GET'],
  maxAge: 86400
}));
```

### 3. 输入验证

```javascript
// 验证股票代码格式
if (!/^[036]\d{5}$/.test(symbol)) {
  return res.status(400).json({ error: 'Invalid symbol format' });
}
```

---

## 📈 监控和日志

### Vercel

- 在项目页面查看实时日志
- 支持 Analytics 和 Speed Insights

### Render

- 在服务页面查看日志
- 支持 Log Streams

---

## 🐛 常见问题

### 1. 冷启动慢

**问题**：Vercel 首次访问需要 1-3 秒

**解决**：
- 使用定时任务预热（每 5 分钟访问一次）
- 使用 Render 部署（无冷启动）

### 2. 超时错误

**问题**：全市场查询超时

**解决**：
```javascript
// Vercel 免费版超时 10 秒
// 限制返回数量
app.get('/api/market', async (req, res) => {
  const results = await sdk.batch.cn({ concurrency: 5 });
  return res.json({ 
    data: results.slice(0, 100), // 只返回前 100 条
    total: results.length 
  });
});
```

### 3. 内存不足

**问题**：Render 免费版内存 512MB

**解决**：
- 限制并发请求
- 使用流式处理大数据

---

## 📚 相关资源

- [stock-sdk 官方文档](https://stock-sdk.linkdiary.cn)
- [stock-sdk GitHub](https://github.com/baodongfan/stock-sdk)
- [Vercel 文档](https://vercel.com/docs)
- [Render 文档](https://render.com/docs)

---

## 🎯 总结

| 特性 | Vercel | Render |
|------|--------|--------|
| 免费额度 | 100GB/月 | 750小时/月 |
| 冷启动 | 1-3秒 | 无 |
| 超时限制 | 10秒 | 无 |
| 自定义域名 | ✅ | ✅ |
| HTTPS | ✅ | ✅ |
| 部署难度 | ⭐⭐ | ⭐⭐⭐ |
| 适合场景 | 轻量API | 常驻服务 |

**推荐选择**：
- 如果只是偶尔查询 → **Vercel**
- 如果需要高频访问 → **Render**
- 如果预算充足 → **Vercel Pro**（$20/月，无冷启动）

---

部署完成后，你就可以通过 HTTP 请求获取股票数据了！🎉
