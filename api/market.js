/**
 * 全市场行情 API - Vercel Serverless Function
 * 文件路径: api/market.js
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
    const { type = 'cn', limit } = req.query;

    // 验证市场类型
    const validTypes = ['cn', 'hk', 'us'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MARKET_TYPE',
          message: `Market type must be one of: ${validTypes.join(', ')}`
        }
      });
    }

    // 获取全市场行情（使用批量接口）
    let results;
    let total = 0;

    if (type === 'cn') {
      results = await sdk.batch.cn({ concurrency: 5 });
      total = results.length;
    } else if (type === 'hk') {
      results = await sdk.batch.hk({ concurrency: 5 });
      total = results.length;
    } else if (type === 'us') {
      results = await sdk.batch.us({ concurrency: 5 });
      total = results.length;
    }

    // 如果指定了 limit，截取前 N 条
    if (limit && parseInt(limit) > 0) {
      results = results.slice(0, parseInt(limit));
    }

    return res.status(200).json({
      success: true,
      data: results,
      total,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Market API Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch market data'
      }
    });
  }
}
