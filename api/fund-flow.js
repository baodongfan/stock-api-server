/**
 * 资金流向 API - Vercel Serverless Function
 * 文件路径: api/fund-flow.js
 * Endpoints:
 *   ?type=individual&symbol=xxx  - 个股资金流向
 *   ?type=market                 - 大盘资金流向
 *   ?type=rank                   - 个股资金流向排名
 *   ?type=sector-rank            - 板块资金流向排名
 *   ?type=sector-history&code=X  - 板块资金流向历史
 * SDK: sdk.fundFlow.*
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
    const { type, symbol, code, market = 'cn' } = req.query;

    let result;

    switch (type) {
      case 'individual':
        if (!symbol) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "symbol" is required for individual fund flow' } });
        result = await sdk.fundFlow.individual(symbol);
        break;
      case 'market':
        result = await sdk.fundFlow.market();
        break;
      case 'rank':
        result = await sdk.fundFlow.rank();
        break;
      case 'sector-rank':
        result = await sdk.fundFlow.sectorRank({ market });
        break;
      case 'sector-history':
        if (!code) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Parameter "code" is required for sector history' } });
        result = await sdk.fundFlow.sectorHistory(code);
        break;
      default:
        return res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: 'type must be: individual, market, rank, sector-rank, or sector-history' } });
    }

    return res.status(200).json({
      success: true,
      data: result || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fund Flow API Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
