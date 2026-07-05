/**
 * Express 服务器 - 用于 Render 部署
 * 文件路径: server.js
 */

import express from 'express';
import cors from 'cors';
import { StockSDK } from 'stock-sdk';

const app = express();
const sdk = new StockSDK();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 文档首页
app.get('/', (req, res) => {
  res.json({
    name: 'Stock API',
    version: '1.0.0',
    description: '股票数据 API 服务',
    endpoints: {
      quote: '/api/quote?symbols=600519,000858',
      kline: '/api/kline?symbol=600519&period=daily&limit=100',
      indicators: '/api/indicators?symbol=600519&indicators=ma,macd',
      search: '/api/search?keyword=茅台',
      market: '/api/market?type=cn',
      board: '/api/board?type=industry'
    },
    docs: 'https://github.com/baodongfan/stock-sdk'
  });
});

// 1. 实时行情
app.get('/api/quote', async (req, res) => {
  try {
    const { symbols } = req.query;
    
    if (!symbols) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbols" is required' }
      });
    }

    const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);
    const results = [];

    for (const symbol of symbolList) {
      try {
        // A股
        if (/^[036]\d{5}$/.test(symbol)) {
          const quotes = await sdk.quotes.cnSimple([symbol]);
          if (quotes?.length > 0) results.push(quotes[0]);
        }
        // 港股
        else if (/^\d{5}$/.test(symbol) || symbol.toLowerCase().startsWith('hk')) {
          const hkSymbol = symbol.toLowerCase().replace(/^hk/, '');
          const quotes = await sdk.quotes.hk([hkSymbol]);
          if (quotes?.length > 0) results.push(quotes[0]);
        }
        // 美股
        else if (/^[A-Z]+$/i.test(symbol)) {
          const quotes = await sdk.quotes.us([symbol.toUpperCase()]);
          if (quotes?.length > 0) results.push(quotes[0]);
        }
      } catch (error) {
        results.push({ symbol, error: 'Failed to fetch quote', message: error.message });
      }
    }

    res.json({ success: true, data: results, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// 2. K线数据
app.get('/api/kline', async (req, res) => {
  try {
    const { symbol, period = 'daily', limit = 100 } = req.query;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbol" is required' }
      });
    }

    const isMinute = ['1', '5', '15', '30', '60'].includes(period);
    let klines;

    if (/^[036]\d{5}$/.test(symbol)) {
      klines = isMinute 
        ? await sdk.kline.cnMinute(symbol, { period, limit: parseInt(limit) })
        : await sdk.kline.cn(symbol, { period, limit: parseInt(limit) });
    } else if (/^\d{5}$/.test(symbol) || symbol.toLowerCase().startsWith('hk')) {
      const hkSymbol = symbol.toLowerCase().replace(/^hk/, '');
      klines = isMinute 
        ? await sdk.kline.hkMinute(hkSymbol, { period, limit: parseInt(limit) })
        : await sdk.kline.hk(hkSymbol, { period, limit: parseInt(limit) });
    } else if (/^[A-Z]+$/i.test(symbol)) {
      klines = isMinute 
        ? await sdk.kline.usMinute(symbol.toUpperCase(), { period, limit: parseInt(limit) })
        : await sdk.kline.us(symbol.toUpperCase(), { period, limit: parseInt(limit) });
    }

    res.json({ success: true, data: { symbol, period, klines }, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// 3. 技术指标
app.get('/api/indicators', async (req, res) => {
  try {
    const { symbol, indicators = 'ma,macd', period = 'daily', limit = 100 } = req.query;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbol" is required' }
      });
    }

    const indicatorList = indicators.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const indicatorConfig = {};

    if (indicatorList.includes('ma')) indicatorConfig.ma = { periods: [5, 10, 20, 60] };
    if (indicatorList.includes('macd')) indicatorConfig.macd = {};
    if (indicatorList.includes('kdj')) indicatorConfig.kdj = {};
    if (indicatorList.includes('rsi')) indicatorConfig.rsi = { period: 14 };
    if (indicatorList.includes('boll')) indicatorConfig.boll = {};

    const result = await sdk.kline.withIndicators(symbol, {
      period,
      indicators: indicatorConfig,
      limit: parseInt(limit)
    });

    res.json({ 
      success: true, 
      data: { symbol, period, klines: result.klines, indicators: result.indicators },
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// 4. 搜索
app.get('/api/search', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'Parameter "keyword" is required' }
      });
    }

    const results = await sdk.search(keyword);
    res.json({ success: true, data: results, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// 5. 全市场
app.get('/api/market', async (req, res) => {
  try {
    const { type = 'cn', limit } = req.query;

    let results;
    if (type === 'cn') results = await sdk.batch.cn({ concurrency: 5 });
    else if (type === 'hk') results = await sdk.batch.hk({ concurrency: 5 });
    else if (type === 'us') results = await sdk.batch.us({ concurrency: 5 });

    if (limit && parseInt(limit) > 0) {
      results = results.slice(0, parseInt(limit));
    }

    res.json({ success: true, data: results, total: results.length, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// 6. 板块
app.get('/api/board', async (req, res) => {
  try {
    const { type = 'industry' } = req.query;

    const boards = type === 'industry' 
      ? await sdk.board.industry.list()
      : await sdk.board.concept.list();

    res.json({ success: true, data: boards, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Stock API server running on port ${PORT}`);
  console.log(`📖 API docs: http://localhost:${PORT}/`);
});
