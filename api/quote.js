/**
 * 股票行情 API - Vercel Serverless Function
 * 文件路径: api/quote.js
 */

import { StockSDK } from 'stock-sdk';

const sdk = new StockSDK();

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 GET 请求
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
    const { symbols } = req.query;

    if (!symbols) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Parameter "symbols" is required'
        }
      });
    }

    // 解析股票代码（支持逗号分隔）
    const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);

    if (symbolList.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SYMBOLS',
          message: 'No valid symbols provided'
        }
      });
    }

    // 智能识别市场并获取行情
    const results = [];
    
    for (const symbol of symbolList) {
      try {
        // A股：6位数字开头（0/3/6）
        if (/^[036]\d{5}$/.test(symbol)) {
          const quotes = await sdk.quotes.cnSimple([symbol]);
          if (quotes && quotes.length > 0) {
            results.push(quotes[0]);
          }
        }
        // 港股：5位数字开头（0-9）或 hk 前缀
        else if (/^\d{5}$/.test(symbol) || symbol.toLowerCase().startsWith('hk')) {
          const hkSymbol = symbol.toLowerCase().replace(/^hk/, '');
          const quotes = await sdk.quotes.hk([hkSymbol]);
          if (quotes && quotes.length > 0) {
            results.push(quotes[0]);
          }
        }
        // 美股：字母开头
        else if (/^[A-Z]+$/i.test(symbol)) {
          const quotes = await sdk.quotes.us([symbol.toUpperCase()]);
          if (quotes && quotes.length > 0) {
            results.push(quotes[0]);
          }
        }
        else {
          // 尝试作为 A股处理
          const quotes = await sdk.quotes.cnSimple([symbol]);
          if (quotes && quotes.length > 0) {
            results.push(quotes[0]);
          }
        }
      } catch (error) {
        console.error(`Error fetching quote for ${symbol}:`, error.message);
        // 单个股票失败不影响其他股票
        results.push({
          symbol,
          error: 'Failed to fetch quote',
          message: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Quote API Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch stock quotes'
      }
    });
  }
}
