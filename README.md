# Stock API

股票数据 API 服务，基于 [stock-sdk](https://github.com/baodongfan/stock-sdk) 封装。

## 功能特性

- ✅ A股/港股/美股实时行情
- ✅ K线数据（日/周/月/分钟）
- ✅ 技术指标计算（MA/MACD/KDJ等）
- ✅ 全市场批量查询
- ✅ RESTful API 接口
- ✅ 支持 Vercel / Render 一键部署

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
# 或
vercel dev
```

访问 http://localhost:3000

### 部署到 Vercel

1. 安装 Vercel CLI：
```bash
npm i -g vercel
```

2. 登录 Vercel：
```bash
vercel login
```

3. 部署：
```bash
vercel --prod
```

## API 接口文档

### 基础路径

```
https://your-domain.vercel.app/api
```

### 1. 获取实时行情

**GET** `/api/quote?symbols=600519,000858,00700`

**参数**：
- `symbols`: 股票代码，多个用逗号分隔（支持A股/港股/美股）

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "symbol": "600519",
      "name": "贵州茅台",
      "price": 1658.00,
      "change": 12.50,
      "changePercent": 0.76,
      "open": 1645.00,
      "high": 1665.00,
      "low": 1640.00,
      "volume": 123456,
      "amount": 203456789.12,
      "pe": 35.6,
      "pb": 12.3
    }
  ],
  "timestamp": "2026-07-05T10:30:00.000Z"
}
```

### 2. 获取K线数据

**GET** `/api/kline?symbol=600519&period=daily&limit=100`

**参数**：
- `symbol`: 股票代码（必填）
- `period`: K线周期，可选 `daily`/`weekly`/`monthly`/`1`/`5`/`15`/`30`/`60`（默认 daily）
- `limit`: 返回条数，默认 100

**响应示例**：
```json
{
  "success": true,
  "data": {
    "symbol": "600519",
    "period": "daily",
    "klines": [
      {
        "date": "2026-07-04",
        "open": 1645.00,
        "high": 1665.00,
        "low": 1640.00,
        "close": 1658.00,
        "volume": 123456,
        "amount": 203456789.12
      }
    ]
  }
}
```

### 3. 获取技术指标

**GET** `/api/indicators?symbol=600519&indicators=ma,macd,kdj`

**参数**：
- `symbol`: 股票代码（必填）
- `indicators`: 指标名称，多个用逗号分隔
  - 支持：`ma`, `macd`, `kdj`, `rsi`, `boll`, `wr`, `bias`, `cci`, `atr`, `obv`, `roc`, `dmi`, `sar`, `kc`
- `period`: K线周期，默认 daily
- `limit`: K线条数，默认 100

**响应示例**：
```json
{
  "success": true,
  "data": {
    "symbol": "600519",
    "klines": [...],
    "indicators": {
      "ma": {
        "ma5": [1650, 1655, ...],
        "ma10": [1645, 1650, ...],
        "ma20": [1635, 1640, ...]
      },
      "macd": {
        "dif": [2.5, 3.1, ...],
        "dea": [1.8, 2.2, ...],
        "macd": [1.4, 1.8, ...]
      },
      "kdj": {
        "k": [75.2, 78.5, ...],
        "d": [70.1, 72.3, ...],
        "j": [85.4, 90.9, ...]
      }
    }
  }
}
```

### 4. 搜索股票

**GET** `/api/search?keyword=茅台`

**参数**：
- `keyword`: 搜索关键词（必填）

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "symbol": "600519",
      "name": "贵州茅台",
      "market": "cn"
    }
  ]
}
```

### 5. 获取全市场行情

**GET** `/api/market?type=cn`

**参数**：
- `type`: 市场类型，可选 `cn`/`hk`/`us`（默认 cn）

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "symbol": "600519",
      "name": "贵州茅台",
      "price": 1658.00,
      "changePercent": 0.76
    }
  ],
  "total": 5000
}
```

### 6. 获取板块行情

**GET** `/api/board?type=industry`

**参数**：
- `type`: 板块类型，可选 `industry`/`concept`

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "code": "BK0001",
      "name": "白酒",
      "changePercent": 2.35,
      "stocks": [...]
    }
  ]
}
```

## 错误处理

所有错误响应格式：

```json
{
  "success": false,
  "error": {
    "code": "INVALID_SYMBOL",
    "message": "Invalid stock symbol format"
  }
}
```

## 部署到 Render

1. 创建 Render 账号：https://render.com

2. 创建 Web Service：
   - Build Command: `npm install`
   - Start Command: `npm start`

3. 添加环境变量（可选）：
   - `PORT`: 端口号（默认 3000）
   - `NODE_ENV`: production

4. 部署完成后获取 URL

## 技术栈

- **stock-sdk**: 股票数据 SDK
- **Express**: Web 框架（用于 Render）
- **Vercel Serverless Functions**: 无服务器部署（用于 Vercel）

## 许可证

ISC

## 相关链接

- [stock-sdk GitHub](https://github.com/baodongfan/stock-sdk)
- [stock-sdk 官方文档](https://stock-sdk.linkdiary.cn)
