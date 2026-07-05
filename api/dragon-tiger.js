/**
 * 龙虎榜 API - Vercel Serverless Function
 * 文件路径: api/dragon-tiger.js
 * Endpoints:
 *   ?type=detail              - 龙虎榜详情
 *   ?type=stock-stats&symbol=X- 个股龙虎榜统计
 *   ?type=institution         - 机构龙虎榜
 *   ?type=branch-rank         - 营业部排名
 *   ?type=seat-detail&code=X  - 席位详情
 * SDK: sdk.dragonTiger.*
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
    const { type, symbol, code, date } = req.query;

    let result;

    switch (type) {
      case 'detail':
        result = await sdk.dragonTiger.detail({ date });
        break;
      case 'stock-stats':
        if (!symbol) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbol" is required for stock stats' } });
        result = await sdk.dragonTiger.stockStats(symbol);
        break;
      case 'institution':
        result = await sdk.dragonTiger.institution();
        break;
      case 'branch-rank':
        result = await sdk.dragonTiger.branchRank({ date });
        break;
      case 'seat-detail':
        if (!code) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "code" is required for seat detail' } });
        result = await sdk.dragonTiger.seatDetail(code);
        break;
      default:
        return res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: 'type must be: detail, stock-stats, institution, branch-rank, or seat-detail' } });
    }

    return res.status(200).json({
      success: true,
      data: result || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dragon Tiger API Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
