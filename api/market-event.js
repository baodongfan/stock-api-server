/**
 * 盘口异动 / 涨停板 API - Vercel Serverless Function
 * 文件路径: api/market-event.js
 * Endpoints:
 *   ?type=zt-pool           - 涨停板池
 *   ?type=stock-changes     - 个股异动
 *   ?type=board-changes     - 板块异动
 * SDK: sdk.marketEvent.*
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

    return res.status(200).json({
      success: true,
      data: result || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Market Event API Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
