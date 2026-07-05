/**
 * 期货 API - Vercel Serverless Function
 * 文件路径: api/futures.js
 * Endpoints:
 *   ?type=kline&symbol=X&period=daily&limit=100  - 期货K线
 *   ?type=global-spot       - 全球期货实时行情
 *   ?type=global-kline&symbol=X&period=daily - 全球期货K线
 *   ?type=inventory-symbols - 库存品种列表
 *   ?type=inventory         - 国内期货库存
 *   ?type=comex-inventory   - COMEX库存
 * SDK: sdk.futures.*
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
    const { type, symbol, period = 'daily', limit = 100 } = req.query;

    let result;

    switch (type) {
      case 'kline':
        if (!symbol) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbol" is required' } });
        result = await sdk.futures.kline(symbol, { period, limit: parseInt(limit) });
        break;
      case 'global-spot':
        result = await sdk.futures.globalSpot();
        break;
      case 'global-kline':
        if (!symbol) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbol" is required' } });
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

    return res.status(200).json({
      success: true,
      data: (type === 'kline' || type === 'global-kline') ? { symbol, period, klines: result || [] } : (result || []),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Futures API Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
