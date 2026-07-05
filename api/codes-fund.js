/**
 * 基金代码列表 API - Vercel Serverless Function
 * 文件路径: api/codes-fund.js
 * SDK: sdk.codes.fund()
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
    const results = await sdk.codes.fund();

    return res.status(200).json({
      success: true,
      data: results || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Codes Fund API Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
