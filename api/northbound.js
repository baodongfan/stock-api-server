/**
 * 北向资金（沪深港通）API - Vercel Serverless Function
 * 文件路径: api/northbound.js
 * Endpoints:
 *   ?type=minute              - 北向分时
 *   ?type=summary             - 北向汇总
 *   ?type=holding-rank        - 北向持股排名
 *   ?type=history             - 北向历史数据
 *   ?type=individual&symbol=X - 个股北向数据
 * SDK: sdk.northbound.*
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
        if (!symbol) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbol" is required for individual northbound' } });
        result = await sdk.northbound.individual(symbol);
        break;
      default:
        return res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: 'type must be: minute, summary, holding-rank, history, or individual' } });
    }

    return res.status(200).json({
      success: true,
      data: result || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Northbound API Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
