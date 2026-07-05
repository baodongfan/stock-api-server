# Stock API

股票数据 API 服务，基于 [stock-sdk](https://github.com/baodongfan/stock-sdk) 封装，覆盖 SDK **全部 17 个命名空间**。

## 功能特性

- ✅ A股/港股/美股实时行情
- ✅ K线数据（日/周/月/分钟）
- ✅ 技术指标计算（14 种指标全支持）
- ✅ 全市场批量查询
- ✅ 🔥 **基金/ETF 实时行情、净值、估值、分红**
- ✅ 🔥 **资金流向（个股/大盘/板块）**
- ✅ 🔥 **北向资金、涨停板、龙虎榜、盘口异动**
- ✅ 🔥 **板块实时行情 & 成分股**
- ✅ 🔥 **ETF 期权、期货、大宗交易、融资融券、交易日历**
- ✅ 支持 Vercel / Render 一键部署
- ✅ RESTful API 接口

## 快速开始

```bash
npm install
npm run dev  # 或 vercel dev
```

访问 http://localhost:3000

---

## API 接口文档

基础路径：
```
https://your-domain.vercel.app/api
```

### 📊 基础数据

| 端点 | 说明 | 示例 |
|------|------|------|
| `GET /api/quote` | 实时行情（A/港/美股） | `?symbols=600519,000858,00700` |
| `GET /api/kline` | K线数据 | `?symbol=600519&period=daily` |
| `GET /api/indicators` | 技术指标（14种） | `?symbol=600519&indicators=ma,macd,kdj` |
| `GET /api/search` | 股票搜索 | `?keyword=茅台` |
| `GET /api/market` | 全市场行情 | `?type=cn` |
| `GET /api/board` | 板块列表 | `?type=industry` |

### 🔥 基金/ETF（高优）

| 端点 | 说明 | 示例 |
|------|------|------|
| `GET /api/quote-fund` | 基金/ETF实时行情 | `?symbols=510050,159915,110011` |
| `GET /api/codes-fund` | 基金代码列表 | (无参数) |
| `GET /api/fund-nav` | 基金历史净值 | `?symbol=110011&limit=100` |
| `GET /api/fund-dividend` | 基金/ETF分红记录 | `?symbol=510050` |
| `GET /api/fund-estimate` | 基金实时估值 | `?symbol=110011` |
| `GET /api/fund-profile` | 基金详细资料 | `?symbol=110011` |
| `GET /api/fund-rank` | 基金同类排名走势 | `?symbol=110011` |

### 📈 市场深度数据

| 端点 | 说明 | 示例 |
|------|------|------|
| `GET /api/timeline` | 当日分时图 | `?symbol=600519` |
| `GET /api/fund-flow` | 资金流向 | `?type=individual&symbol=600519` |
| `GET /api/northbound` | 北向资金 | `?type=summary` |
| `GET /api/market-event` | 涨停板/盘口异动 | `?type=zt-pool` |
| `GET /api/dragon-tiger` | 龙虎榜 | `?type=detail` |
| `GET /api/board-spot` | 板块实时行情/成分股 | `?type=industry` 或 `?board=industry&code=BK0001` |

### 🎯 专项数据

| 端点 | 说明 | 示例 |
|------|------|------|
| `GET /api/options-etf` | ETF期权 | `?action=months` |
| `GET /api/futures` | 期货 | `?type=global-spot` |
| `GET /api/block-trade` | 大宗交易 | `?type=market-stat` |
| `GET /api/margin` | 融资融券 | `?type=target-list` |
| `GET /api/calendar` | 交易日历 | `?type=market-status` |

---

### 资金流向 (`/api/fund-flow`) 子类型

| `type` | 功能 | 额外参数 |
|--------|------|---------|
| `individual` | 个股资金流向 | `symbol=600519` |
| `market` | 大盘资金流向 | — |
| `rank` | 资金流向排名 | — |
| `sector-rank` | 板块资金流向排名 | `market=cn` |
| `sector-history` | 板块资金流向历史 | `code=BK0001` |

### 北向资金 (`/api/northbound`) 子类型

| `type` | 功能 | 额外参数 |
|--------|------|---------|
| `minute` | 北向分时 | — |
| `summary` | 北向汇总 | — |
| `holding-rank` | 北向持股排名 | — |
| `history` | 北向历史 | — |
| `individual` | 个股北向数据 | `symbol=600519` |

### 盘口异动 (`/api/market-event`) 子类型

| `type` | 功能 |
|--------|------|
| `zt-pool` | 涨停板池 |
| `stock-changes` | 个股异动 |
| `board-changes` | 板块异动 |

### 龙虎榜 (`/api/dragon-tiger`) 子类型

| `type` | 功能 | 额外参数 |
|--------|------|---------|
| `detail` | 龙虎榜详情 | `date` |
| `stock-stats` | 个股龙虎榜统计 | `symbol=600519` |
| `institution` | 机构龙虎榜 | — |
| `branch-rank` | 营业部排名 | `date` |
| `seat-detail` | 席位详情 | `code=X` |

### ETF 期权 (`/api/options-etf`) 子类型

| `action` | 功能 | 额外参数 |
|----------|------|---------|
| `months` | 合约月份列表 | — |
| `expire-day` | 到期日 | — |
| `minute` | 分钟K线 | `code=X` |
| `daily-kline` | 日K线 | `code=X` |
| `five-day-minute` | 五日分钟线 | `code=X` |
| `lhb` | 期权龙虎榜 | — |

### 期货 (`/api/futures`) 子类型

| `type` | 功能 | 额外参数 |
|--------|------|---------|
| `kline` | 国内期货K线 | `symbol=X&period=daily` |
| `global-spot` | 全球期货行情 | — |
| `global-kline` | 全球期货K线 | `symbol=X&period=daily` |
| `inventory-symbols` | 库存品种列表 | — |
| `inventory` | 国内期货库存 | — |
| `comex-inventory` | COMEX库存 | — |

### 大宗交易 (`/api/block-trade`) 子类型

| `type` | 功能 | 额外参数 |
|--------|------|---------|
| `market-stat` | 市场统计 | — |
| `detail` | 交易详情 | `date` |
| `daily-stat` | 每日数据 | — |

### 交易日历 (`/api/calendar`) 子类型

| `type` | 功能 | 额外参数 |
|--------|------|---------|
| `is-trading-day` | 判断是否交易日 | `date=2026-07-05` |
| `next-trading-day` | 下一交易日 | `date=2026-07-05` |
| `prev-trading-day` | 上一交易日 | `date=2026-07-05` |
| `market-status` | 当前市场状态 | — |

---

## 响应格式

成功：
```json
{ "success": true, "data": ..., "timestamp": "..." }
```

错误：
```json
{ "success": false, "error": { "code": "INVALID_SYMBOL", "message": "..." } }
```

## 部署

### Vercel

```bash
vercel --prod
```

### Render

- Build: `npm install`
- Start: `npm start`

---

## 技术栈

- **[stock-sdk](https://stock-sdk.linkdiary.cn)** v2 — 股票数据 SDK
- **Express** — Web 框架（Render）
- **Vercel Serverless Functions** — 无服务器部署

## 许可证

ISC
