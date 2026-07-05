/**
 * K线数据 API - Vercel Serverless Function
 * 文件路径: api/kline.js
 */

import { StockSDK } from 'stock-sdk';

const sdk = new StockSDK();

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method is supported'
      }
    });
  }

  try {
    const { symbol, period = 'daily', limit = 100 } = req.query;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Parameter "symbol" is required'
        }
      });
    }

    // 验证 period 参数
    const validPeriods = ['daily', 'weekly', 'monthly', '1', '5', '15', '30', '60'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PERIOD',
          message: `Period must be one of: ${validPeriods.join(', ')}`
        }
      });
    }

    // 根据 period 选择合适的 API
    let klines;
    const isMinute = ['1', '5', '15', '30', '60'].includes(period);

    // A股
    if (/^[036]\d{5}$/.test(symbol)) {
      if (isMinute) {
        klines = await sdk.kline.cnMinute(symbol, { period, limit: parseInt(limit) });
      } else {
        klines = await sdk.kline.cn(symbol, { period, limit: parseInt(limit) });
      }
    }
    // 港股
    else if (/^\d{5}$/.test(symbol) || symbol.toLowerCase().startsWith('hk')) {
      const hkSymbol = symbol.toLowerCase().replace(/^hk/, '');
      if (isMinute) {
        klines = await sdk.kline.hkMinute(hkSymbol, { period, limit: parseInt(limit) });
      } else {
        klines = await sdk.kline.hk(hkSymbol, { period, limit: parseInt(limit) });
      }
    }
    // 美股
    else if (/^[A-Z]+$/i.test(symbol)) {
      if (isMinute) {
        klines = await sdk.kline.usMinute(symbol.toUpperCase(), { period, limit: parseInt(limit) });
      } else {
        klines = await sdk.kline.us(symbol.toUpperCase(), { period, limit: parseInt(limit) });
      }
    }
    else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SYMBOL',
          message: 'Invalid stock symbol format'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        symbol,
        period,
        klines: Array.isArray(klines) ? klines : []
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Kline API Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch kline data'
      }
    });
  }
}
