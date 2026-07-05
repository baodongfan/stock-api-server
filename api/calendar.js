/**
 * 交易日历 API - Vercel Serverless Function
 * 文件路径: api/calendar.js
 * Endpoints:
 *   ?type=is-trading-day&date=YYYY-MM-DD    - 判断是否交易日
 *   ?type=next-trading-day&date=YYYY-MM-DD   - 下一交易日
 *   ?type=prev-trading-day&date=YYYY-MM-DD   - 上一交易日
 *   ?type=market-status                      - 当前市场状态
 * SDK: sdk.calendar.*
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
    const { type, date } = req.query;

    let result;

    switch (type) {
      case 'is-trading-day':
        if (!date) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "date" is required (YYYY-MM-DD)' } });
        result = await sdk.calendar.isTradingDay(date);
        break;
      case 'next-trading-day':
        if (!date) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "date" is required (YYYY-MM-DD)' } });
        result = await sdk.calendar.nextTradingDay(date);
        break;
      case 'prev-trading-day':
        if (!date) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "date" is required (YYYY-MM-DD)' } });
        result = await sdk.calendar.prevTradingDay(date);
        break;
      case 'market-status':
        result = await sdk.calendar.marketStatus();
        break;
      default:
        return res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: 'type must be: is-trading-day, next-trading-day, prev-trading-day, or market-status' } });
    }

    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Calendar API Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
