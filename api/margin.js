/**
 * 融资融券 API - Vercel Serverless Function
 * 文件路径: api/margin.js
 * Endpoints:
 *   ?type=account-info     - 融资融券账户信息
 *   ?type=target-list      - 融资融券标的列表
 * SDK: sdk.margin.*
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
      case 'account-info':
        result = await sdk.margin.accountInfo();
        break;
      case 'target-list':
        result = await sdk.margin.targetList();
        break;
      default:
        return res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: 'type must be: account-info or target-list' } });
    }

    return res.status(200).json({
      success: true,
      data: result || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Margin API Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
