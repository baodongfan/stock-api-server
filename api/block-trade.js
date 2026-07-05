/**
 * 大宗交易 API - Vercel Serverless Function
 * 文件路径: api/block-trade.js
 * Endpoints:
 *   ?type=market-stat       - 大宗交易市场统计
 *   ?type=detail            - 大宗交易详情
 *   ?type=daily-stat        - 每日大宗交易
 * SDK: sdk.blockTrade.*
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

    return res.status(200).json({
      success: true,
      data: result || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Block Trade API Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
