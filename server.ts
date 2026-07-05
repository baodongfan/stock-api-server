import express, { Request, Response } from 'express';
import { StockSDK } from './src/sdk'; // 引入复制过来的 SDK

const app = express();
// Render 部署时会自动注入 PORT 环境变量，必须使用 process.env.PORT
const PORT = process.env.PORT || 3000;

const sdk = new StockSDK();

app.use(express.json());

// 基础健康检查接口（Render 靠它确认服务是否成功启动）
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// 1. 获取实时行情接口：/api/quote?symbol=sh000001
app.get('/api/quote', async (req: Request, res: Response) => {
  const { symbol } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: 'Missing symbol parameter' });
  }
  try {
    const data = await sdk.quote.getQuote({ symbol: symbol as string });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. 获取历史 K 线接口：/api/kline?symbol=sh600519&period=daily
app.get('/api/kline', async (req: Request, res: Response) => {
  const { symbol, period, limit } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: 'Missing symbol parameter' });
  }
  try {
    const data = await sdk.kline.getHistoryKline({
      symbol: symbol as string,
      period: (period as any) || 'daily',
      limit: limit ? parseInt(limit as string, 10) : 100
    });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Stock API server is running on port ${PORT}`);
});