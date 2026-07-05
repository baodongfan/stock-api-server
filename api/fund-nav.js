/**
 * 基金/ETF 历史净值 API - Vercel Serverless Function
 * 文件路径: api/fund-nav.js
 * SDK: sdk.fund.navHistory(symbol, options)
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
    const { symbol, limit = 100 } = req.query;
    if (!symbol) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbol" is required' } });
    }

    const results = await sdk.fund.navHistory(symbol, { limit: parseInt(limit) });

    return res.status(200).json({
      success: true,
      data: { symbol, navHistory: results || [] },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fund NAV API Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
