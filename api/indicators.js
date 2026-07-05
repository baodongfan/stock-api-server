/**
 * 技术指标 API - Vercel Serverless Function
 * 文件路径: api/indicators.js
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
    const { 
      symbol, 
      indicators = 'ma,macd', 
      period = 'daily', 
      limit = 100 
    } = req.query;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Parameter "symbol" is required'
        }
      });
    }

    // 解析指标列表
    const indicatorList = indicators.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    
    const validIndicators = ['ma', 'macd', 'kdj', 'rsi', 'boll', 'wr', 'bias', 'cci', 'atr', 'obv', 'roc', 'dmi', 'sar', 'kc'];
    const invalidIndicators = indicatorList.filter(i => !validIndicators.includes(i));
    
    if (invalidIndicators.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INDICATORS',
          message: `Invalid indicators: ${invalidIndicators.join(', ')}. Valid options: ${validIndicators.join(', ')}`
        }
      });
    }

    // 构建指标配置
    const indicatorConfig = {};
    
    if (indicatorList.includes('ma')) {
      indicatorConfig.ma = { periods: [5, 10, 20, 60] };
    }
    if (indicatorList.includes('macd')) {
      indicatorConfig.macd = {};
    }
    if (indicatorList.includes('kdj')) {
      indicatorConfig.kdj = {};
    }
    if (indicatorList.includes('rsi')) {
      indicatorConfig.rsi = { period: 14 };
    }
    if (indicatorList.includes('boll')) {
      indicatorConfig.boll = {};
    }
    if (indicatorList.includes('wr')) {
      indicatorConfig.wr = {};
    }
    if (indicatorList.includes('bias')) {
      indicatorConfig.bias = {};
    }
    if (indicatorList.includes('cci')) {
      indicatorConfig.cci = {};
    }
    if (indicatorList.includes('atr')) {
      indicatorConfig.atr = {};
    }
    if (indicatorList.includes('obv')) {
      indicatorConfig.obv = {};
    }
    if (indicatorList.includes('roc')) {
      indicatorConfig.roc = {};
    }
    if (indicatorList.includes('dmi')) {
      indicatorConfig.dmi = {};
    }
    if (indicatorList.includes('sar')) {
      indicatorConfig.sar = {};
    }
    if (indicatorList.includes('kc')) {
      indicatorConfig.kc = {};
    }

    // 获取带指标的K线数据
    const result = await sdk.kline.withIndicators(symbol, {
      period,
      indicators: indicatorConfig,
      limit: parseInt(limit)
    });

    return res.status(200).json({
      success: true,
      data: {
        symbol,
        period,
        klines: result.klines || [],
        indicators: result.indicators || {}
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Indicators API Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to calculate indicators'
      }
    });
  }
}
