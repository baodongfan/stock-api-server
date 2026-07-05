/**
 * ETF 期权 API - Vercel Serverless Function
 * 文件路径: api/options-etf.js
 * Endpoints:
 *   ?action=months            - 合约月份列表
 *   ?action=expire-day        - 到期日
 *   ?action=minute&code=X     - 分钟K线
 *   ?action=daily-kline&code=X- 日K线
 *   ?action=five-day-minute&code=X - 五日分钟线
 *   ?action=lhb               - 期权龙虎榜
 * SDK: sdk.options.etf.* | sdk.options.lhb
 */

import { StockSDK } from 'stock-sdk';

const sdk = new StockSDK();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET is supported' } });
  }

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
        if (!sym) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "code" is required' } });
        result = await sdk.options.etf.minute(sym);
        break;
      case 'daily-kline':
        if (!sym) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "code" is required' } });
        result = await sdk.options.etf.dailyKline(sym);
        break;
      case 'five-day-minute':
        if (!sym) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "code" is required' } });
        result = await sdk.options.etf.fiveDayMinute(sym);
        break;
      case 'lhb':
        result = await sdk.options.lhb();
        break;
      default:
        return res.status(400).json({ success: false, error: { code: 'INVALID_ACTION', message: 'action must be: months, expire-day, minute, daily-kline, five-day-minute, or lhb' } });
    }

    return res.status(200).json({
      success: true,
      data: result || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Options ETF API Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
