/**
 * 板块行情 API - Vercel Serverless Function
 * 文件路径: api/board.js
 */

import { StockSDK } from 'stock-sdk';

const sdk = new StockSDK();

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method is supported'
      }
    });
  }

  try {
    const { type = 'industry' } = req.query;

    // 验证板块类型
    const validTypes = ['industry', 'concept'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BOARD_TYPE',
          message: `Board type must be one of: ${validTypes.join(', ')}`
        }
      });
    }

    // 获取板块列表
    let boards;
    if (type === 'industry') {
      boards = await sdk.board.industry.list();
    } else {
      boards = await sdk.board.concept.list();
    }

    return res.status(200).json({
      success: true,
      data: boards || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Board API Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch board data'
      }
    });
  }
}
