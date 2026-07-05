/**
 * 板块实时行情 & 成分股 API - Vercel Serverless Function
 * 文件路径: api/board-spot.js
 * Endpoints:
 *   ?type=industry      - 行业板块实时行情
 *   ?type=concept       - 概念板块实时行情
 * SDK: sdk.board.industry.spot() / sdk.board.concept.spot()
 */
/** 
 * 板块成分股 API - Vercel Serverless Function
 * 文件路径: api/board-constituents.js
 * Endpoints:
 *   ?board=industry&code=X  - 行业板块成分股
 *   ?board=concept&code=X   - 概念板块成分股
 * SDK: sdk.board.industry.constituents(code) / sdk.board.concept.constituents(code)
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
    const { type, board, code } = req.query;

    let result;
    let mode = 'spot'; // default

    // Board spot quotes
    if (type && ['industry', 'concept'].includes(type)) {
      if (type === 'industry') {
        result = await sdk.board.industry.spot();
      } else {
        result = await sdk.board.concept.spot();
      }
      mode = 'spot';
    }
    // Board constituents
    else if (board && code) {
      if (board === 'industry') {
        result = await sdk.board.industry.constituents(code);
      } else if (board === 'concept') {
        result = await sdk.board.concept.constituents(code);
      } else {
        return res.status(400).json({ success: false, error: { code: 'INVALID_BOARD', message: 'board must be: industry or concept' } });
      }
      mode = 'constituents';
    }
    else {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETER', message: 'Provide ?type=industry|concept for spot data, or ?board=industry|concept&code=xxx for constituents' } });
    }

    return res.status(200).json({
      success: true,
      data: { mode, result: result || [] },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Board Spot API Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
