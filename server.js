/**
 * Express 服务器 - 用于 Render 部署
 * 文件路径: server.js
 * 涵盖全部 stock-sdk API 端点
 */

import express from 'express';
import cors from 'cors';
import { StockSDK } from 'stock-sdk';

const app = express();
const sdk = new StockSDK();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ============================================
// 健康检查
// ============================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// API 文档首页
// ============================================
app.get('/', (req, res) => {
  res.json({
    name: 'Stock API',
    version: '1.1.0',
    description: '股票数据 API 服务 — 基于 stock-sdk v2',
    endpoints: {
      // 基础
      quote:      '/api/quote?symbols=600519,000858',
      kline:      '/api/kline?symbol=600519&period=daily&limit=100',
      indicators: '/api/indicators?symbol=600519&indicators=ma,macd',
      search:     '/api/search?keyword=茅台',
      market:     '/api/market?type=cn',
      board:      '/api/board?type=industry',
      // 🔥 高优先级 ETF/基金
      'quote-fund':  '/api/quote-fund?symbols=510050,159915',
      'codes-fund':  '/api/codes-fund',
      'fund-nav':    '/api/fund-nav?symbol=110011',
      'fund-dividend':   '/api/fund-dividend?symbol=510050',
      'fund-estimate':   '/api/fund-estimate?symbol=110011',
      'fund-profile':    '/api/fund-profile?symbol=110011',
      'fund-rank':       '/api/fund-rank?symbol=110011',
      // 📈 中优先级
      timeline:    '/api/timeline?symbol=600519',
      'fund-flow': '/api/fund-flow?type=individual&symbol=600519',
      'fund-flow-market':   '/api/fund-flow?type=market',
      northbound:  '/api/northbound?type=summary',
      'market-event': '/api/market-event?type=zt-pool',
      'dragon-tiger': '/api/dragon-tiger?type=detail',
      'board-spot':   '/api/board-spot?type=industry',
      // 🎯 专项
      'options-etf':  '/api/options-etf?action=months',
      futures:  '/api/futures?type=global-spot',
      'block-trade': '/api/block-trade?type=market-stat',
      margin:   '/api/margin?type=target-list',
      calendar: '/api/calendar?type=market-status',
    },
    docs: 'https://github.com/baodongfan/stock-api-server',
    'sdk-docs': 'https://stock-sdk.linkdiary.cn'
  });
});

// ============================================
// 1. 实时行情
// ============================================
app.get('/api/quote', async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbols" is required' } });
    }
    const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);
    const results = [];

    for (const symbol of symbolList) {
      try {
        if (/^[036]\d{5}$/.test(symbol)) {
          const quotes = await sdk.quotes.cnSimple([symbol]);
          if (quotes?.length > 0) results.push(quotes[0]);
        } else if (/^\d{5}$/.test(symbol) || symbol.toLowerCase().startsWith('hk')) {
          const hkSymbol = symbol.toLowerCase().replace(/^hk/, '');
          const quotes = await sdk.quotes.hk([hkSymbol]);
          if (quotes?.length > 0) results.push(quotes[0]);
        } else if (/^[A-Z]+$/i.test(symbol)) {
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

// ============================================
// 2. K线数据
// ============================================
app.get('/api/kline', async (req, res) => {
  try {
    const { symbol, period = 'daily', limit = 100 } = req.query;
    if (!symbol) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbol" is required' } });
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

// ============================================
// 3. 技术指标
// ============================================
app.get('/api/indicators', async (req, res) => {
  try {
    const { symbol, indicators = 'ma,macd', period = 'daily', limit = 100 } = req.query;
    if (!symbol) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbol" is required' } });
    }

    const indicatorList = indicators.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const validIndicators = ['ma', 'macd', 'kdj', 'rsi', 'boll', 'wr', 'bias', 'cci', 'atr', 'obv', 'roc', 'dmi', 'sar', 'kc'];
    const indicatorConfig = {};

    if (indicatorList.includes('ma'))   indicatorConfig.ma = { periods: [5, 10, 20, 60] };
    if (indicatorList.includes('macd')) indicatorConfig.macd = {};
    if (indicatorList.includes('kdj'))  indicatorConfig.kdj = {};
    if (indicatorList.includes('rsi'))  indicatorConfig.rsi = { period: 14 };
    if (indicatorList.includes('boll'))  indicatorConfig.boll = {};
    if (indicatorList.includes('wr'))    indicatorConfig.wr = {};
    if (indicatorList.includes('bias'))  indicatorConfig.bias = {};
    if (indicatorList.includes('cci'))   indicatorConfig.cci = {};
    if (indicatorList.includes('atr'))   indicatorConfig.atr = {};
    if (indicatorList.includes('obv'))   indicatorConfig.obv = {};
    if (indicatorList.includes('roc'))   indicatorConfig.roc = {};
    if (indicatorList.includes('dmi'))   indicatorConfig.dmi = {};
    if (indicatorList.includes('sar'))   indicatorConfig.sar = {};
    if (indicatorList.includes('kc'))    indicatorConfig.kc = {};

    const result = await sdk.kline.withIndicators(symbol, {
      period, indicators: indicatorConfig, limit: parseInt(limit)
    });

    res.json({ success: true, data: { symbol, period, klines: result.klines, indicators: result.indicators }, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 4. 搜索
// ============================================
app.get('/api/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "keyword" is required' } });
    }
    const results = await sdk.search(keyword);
    res.json({ success: true, data: results, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 5. 全市场行情
// ============================================
app.get('/api/market', async (req, res) => {
  try {
    const { type = 'cn', limit } = req.query;
    let results;

    if (type === 'cn') results = await sdk.batch.cn({ concurrency: 5 });
    else if (type === 'hk') results = await sdk.batch.hk({ concurrency: 5 });
    else if (type === 'us') results = await sdk.batch.us({ concurrency: 5 });

    const total = results?.length || 0;
    if (limit && parseInt(limit) > 0) results = results.slice(0, parseInt(limit));

    res.json({ success: true, data: results, total, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 6. 板块列表
// ============================================
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

// ============================================
// 🔥 7. 基金/ETF 实时行情
// ============================================
app.get('/api/quote-fund', async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbols" is required' } });
    }
    const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);
    const results = await sdk.quotes.fund(symbolList);
    res.json({ success: true, data: results || [], timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 🔥 8. 基金代码列表
// ============================================
app.get('/api/codes-fund', async (req, res) => {
  try {
    const results = await sdk.codes.fund();
    res.json({ success: true, data: results || [], timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 🔥 9. 基金分红记录
// ============================================
app.get('/api/fund-dividend', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbol" is required' } });
    }
    const results = await sdk.fund.dividendList(symbol);
    res.json({ success: true, data: { symbol, dividends: results || [] }, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 🔥 10. 基金历史净值
// ============================================
app.get('/api/fund-nav', async (req, res) => {
  try {
    const { symbol, limit = 100 } = req.query;
    if (!symbol) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbol" is required' } });
    }
    const results = await sdk.fund.navHistory(symbol, { limit: parseInt(limit) });
    res.json({ success: true, data: { symbol, navHistory: results || [] }, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 🔥 11. 基金实时估值
// ============================================
app.get('/api/fund-estimate', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbol" is required' } });
    }
    const result = await sdk.fund.estimate(symbol);
    res.json({ success: true, data: { symbol, estimate: result || null }, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 🔥 12. 基金详细资料
// ============================================
app.get('/api/fund-profile', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbol" is required' } });
    }
    const result = await sdk.fund.profile(symbol);
    res.json({ success: true, data: { symbol, profile: result || null }, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 🔥 13. 基金同类排名走势
// ============================================
app.get('/api/fund-rank', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbol" is required' } });
    }
    const result = await sdk.fund.rankHistory(symbol);
    res.json({ success: true, data: { symbol, rankHistory: result || null }, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 📈 14. 当日分时图
// ============================================
app.get('/api/timeline', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbol" is required' } });
    }
    const result = await sdk.quotes.timeline(symbol);
    res.json({ success: true, data: { symbol, timeline: result || [] }, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 📈 15. 资金流向
// ============================================
app.get('/api/fund-flow', async (req, res) => {
  try {
    const { type, symbol, code, market = 'cn' } = req.query;
    let result;

    switch (type) {
      case 'individual':
        if (!symbol) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: '"symbol" required for individual' } });
        result = await sdk.fundFlow.individual(symbol);
        break;
      case 'market':
        result = await sdk.fundFlow.market();
        break;
      case 'rank':
        result = await sdk.fundFlow.rank();
        break;
      case 'sector-rank':
        result = await sdk.fundFlow.sectorRank({ market });
        break;
      case 'sector-history':
        if (!code) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: '"code" required for sector-history' } });
        result = await sdk.fundFlow.sectorHistory(code);
        break;
      default:
        return res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: 'type must be: individual, market, rank, sector-rank, or sector-history' } });
    }

    res.json({ success: true, data: result || [], timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 📈 16. 北向资金（沪深港通）
// ============================================
app.get('/api/northbound', async (req, res) => {
  try {
    const { type, symbol } = req.query;
    let result;

    switch (type) {
      case 'minute':
        result = await sdk.northbound.minute();
        break;
      case 'summary':
        result = await sdk.northbound.summary();
        break;
      case 'holding-rank':
        result = await sdk.northbound.holdingRank();
        break;
      case 'history':
        result = await sdk.northbound.history();
        break;
      case 'individual':
        if (!symbol) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: '"symbol" required for individual' } });
        result = await sdk.northbound.individual(symbol);
        break;
      default:
        return res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: 'type must be: minute, summary, holding-rank, history, or individual' } });
    }

    res.json({ success: true, data: result || [], timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 📈 17. 盘口异动 / 涨停板
// ============================================
app.get('/api/market-event', async (req, res) => {
  try {
    const { type } = req.query;
    let result;

    switch (type) {
      case 'zt-pool':
        result = await sdk.marketEvent.ztPool();
        break;
      case 'stock-changes':
        result = await sdk.marketEvent.stockChanges();
        break;
      case 'board-changes':
        result = await sdk.marketEvent.boardChanges();
        break;
      default:
        return res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: 'type must be: zt-pool, stock-changes, or board-changes' } });
    }

    res.json({ success: true, data: result || [], timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 📈 18. 龙虎榜
// ============================================
app.get('/api/dragon-tiger', async (req, res) => {
  try {
    const { type, symbol, code, date } = req.query;
    let result;

    switch (type) {
      case 'detail':
        result = await sdk.dragonTiger.detail({ date });
        break;
      case 'stock-stats':
        if (!symbol) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: '"symbol" required for stock-stats' } });
        result = await sdk.dragonTiger.stockStats(symbol);
        break;
      case 'institution':
        result = await sdk.dragonTiger.institution();
        break;
      case 'branch-rank':
        result = await sdk.dragonTiger.branchRank({ date });
        break;
      case 'seat-detail':
        if (!code) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: '"code" required for seat-detail' } });
        result = await sdk.dragonTiger.seatDetail(code);
        break;
      default:
        return res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: 'type must be: detail, stock-stats, institution, branch-rank, or seat-detail' } });
    }

    res.json({ success: true, data: result || [], timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 📈 19. 板块实时行情 & 成分股
// ============================================
app.get('/api/board-spot', async (req, res) => {
  try {
    const { type, board, code } = req.query;
    let result;
    let mode = 'spot';

    if (type && ['industry', 'concept'].includes(type)) {
      result = type === 'industry'
        ? await sdk.board.industry.spot()
        : await sdk.board.concept.spot();
    } else if (board && code) {
      if (board === 'industry') {
        result = await sdk.board.industry.constituents(code);
      } else if (board === 'concept') {
        result = await sdk.board.concept.constituents(code);
      } else {
        return res.status(400).json({ success: false, error: { code: 'INVALID_BOARD', message: 'board must be: industry or concept' } });
      }
      mode = 'constituents';
    } else {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Provide ?type=industry|concept for spot, or ?board=industry|concept&code=xxx for constituents' } });
    }

    res.json({ success: true, data: { mode, result: result || [] }, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 🎯 20. ETF 期权
// ============================================
app.get('/api/options-etf', async (req, res) => {
  try {
    const { action, code, symbol } = req.query;
    const sym = code || symbol;
    let result;

    switch (action) {
      case 'months':
        result = await sdk.options.etf.months();
        break;
      case 'expire-day':
        result = await sdk.options.etf.expireDay();
        break;
      case 'minute':
        if (!sym) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: '"code" required' } });
        result = await sdk.options.etf.minute(sym);
        break;
      case 'daily-kline':
        if (!sym) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: '"code" required' } });
        result = await sdk.options.etf.dailyKline(sym);
        break;
      case 'five-day-minute':
        if (!sym) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: '"code" required' } });
        result = await sdk.options.etf.fiveDayMinute(sym);
        break;
      case 'lhb':
        result = await sdk.options.lhb();
        break;
      default:
        return res.status(400).json({ success: false, error: { code: 'INVALID_ACTION', message: 'action must be: months, expire-day, minute, daily-kline, five-day-minute, or lhb' } });
    }

    res.json({ success: true, data: result || [], timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 🎯 21. 期货
// ============================================
app.get('/api/futures', async (req, res) => {
  try {
    const { type, symbol, period = 'daily', limit = 100 } = req.query;
    let result;

    switch (type) {
      case 'kline':
        if (!symbol) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: '"symbol" required' } });
        result = await sdk.futures.kline(symbol, { period, limit: parseInt(limit) });
        break;
      case 'global-spot':
        result = await sdk.futures.globalSpot();
        break;
      case 'global-kline':
        if (!symbol) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: '"symbol" required' } });
        result = await sdk.futures.globalKline(symbol, { period, limit: parseInt(limit) });
        break;
      case 'inventory-symbols':
        result = await sdk.futures.inventorySymbols();
        break;
      case 'inventory':
        result = await sdk.futures.inventory();
        break;
      case 'comex-inventory':
        result = await sdk.futures.comexInventory();
        break;
      default:
        return res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: 'type must be: kline, global-spot, global-kline, inventory-symbols, inventory, or comex-inventory' } });
    }

    const isKline = type === 'kline' || type === 'global-kline';
    res.json({ success: true, data: isKline ? { symbol, period, klines: result || [] } : (result || []), timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 🎯 22. 大宗交易
// ============================================
app.get('/api/block-trade', async (req, res) => {
  try {
    const { type, date } = req.query;
    let result;

    switch (type) {
      case 'market-stat':
        result = await sdk.blockTrade.marketStat();
        break;
      case 'detail':
        result = await sdk.blockTrade.detail({ date });
        break;
      case 'daily-stat':
        result = await sdk.blockTrade.dailyStat();
        break;
      default:
        return res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: 'type must be: market-stat, detail, or daily-stat' } });
    }

    res.json({ success: true, data: result || [], timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 🎯 23. 融资融券
// ============================================
app.get('/api/margin', async (req, res) => {
  try {
    const { type } = req.query;
    let result;

    switch (type) {
      case 'account-info':
        result = await sdk.margin.accountInfo();
        break;
      case 'target-list':
        result = await sdk.margin.targetList();
        break;
      default:
        return res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: 'type must be: account-info or target-list' } });
    }

    res.json({ success: true, data: result || [], timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 🎯 24. 交易日历
// ============================================
app.get('/api/calendar', async (req, res) => {
  try {
    const { type, date } = req.query;
    let result;

    switch (type) {
      case 'is-trading-day':
        if (!date) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: '"date" required (YYYY-MM-DD)' } });
        result = await sdk.calendar.isTradingDay(date);
        break;
      case 'next-trading-day':
        if (!date) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: '"date" required (YYYY-MM-DD)' } });
        result = await sdk.calendar.nextTradingDay(date);
        break;
      case 'prev-trading-day':
        if (!date) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: '"date" required (YYYY-MM-DD)' } });
        result = await sdk.calendar.prevTradingDay(date);
        break;
      case 'market-status':
        result = await sdk.calendar.marketStatus();
        break;
      default:
        return res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: 'type must be: is-trading-day, next-trading-day, prev-trading-day, or market-status' } });
    }

    res.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================
// 启动服务器
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Stock API server running on port ${PORT}`);
  console.log(`📖 API docs: http://localhost:${PORT}/`);
});
