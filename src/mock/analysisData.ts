import { 
  ClusterAnalysis, 
  CorrelationAnalysis, 
  SourceAttributionAnalysis, 
  TrendAnalysis,
  Forecast
} from '../types';
import { mockStations } from './airQualityData';

// 生成聚类分析结果
export function generateClusterAnalysis(
  stationIds: string[],
  startDate: string,
  endDate: string
): ClusterAnalysis {
  const now = new Date();
  const clusterCount = Math.floor(Math.random() * 3) + 2; // 2-4个聚类
  const clusters = [];
  
  for (let i = 0; i < clusterCount; i++) {
    // 选择部分站点分配到这个聚类
    const clusterStations = stationIds.filter(() => Math.random() > 0.5);
    if (clusterStations.length === 0) {
      clusterStations.push(stationIds[Math.floor(Math.random() * stationIds.length)]);
    }
    
    // 特征描述
    const characteristicTemplates = [
      '工业区空气质量特征',
      '商业区空气质量模式',
      '居民区典型污染特征',
      '交通枢纽附近污染模式',
      '高温天气下的污染累积',
      '风向对污染物传播的影响',
      '夜间/日间污染差异明显',
      '雨后空气质量改善显著'
    ];
    
    const characteristics = [];
    for (let j = 0; j < 2; j++) {
      const idx = Math.floor(Math.random() * characteristicTemplates.length);
      characteristics.push(characteristicTemplates[idx]);
      characteristicTemplates.splice(idx, 1);
    }
    
    // 生成聚类中心点
    clusters.push({
      id: i + 1,
      size: clusterStations.length,
      centroid: {
        aqi: Math.floor(Math.random() * 200) + 30,
        pollutants: {
          pm25: Math.floor(Math.random() * 150),
          pm10: Math.floor(Math.random() * 200),
          o3: Math.floor(Math.random() * 120),
          no2: Math.floor(Math.random() * 100),
          so2: Math.floor(Math.random() * 50),
          co: Math.random() * 10
        },
        weather: {
          temperature: Math.floor(Math.random() * 35) - 5,
          humidity: Math.floor(Math.random() * 100),
          windSpeed: Math.random() * 15
        }
      },
      characteristics,
      stations: clusterStations
    });
  }
  
  return {
    id: `cluster-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    generatedAt: now.toISOString(),
    stationIds,
    timeRange: {
      start: startDate,
      end: endDate
    },
    clusters,
    algorithm: 'K-means聚类算法',
    parameters: {
      k: clusterCount,
      iterations: Math.floor(Math.random() * 100) + 100,
      distanceMetric: 'euclidean'
    },
    quality: {
      silhouetteScore: 0.65 + Math.random() * 0.3,
      daviesBouldinIndex: 0.3 + Math.random() * 0.5
    }
  };
}

// 生成相关性分析结果
export function generateCorrelationAnalysis(
  stationIds: string[],
  startDate: string,
  endDate: string,
  method: 'Pearson' | 'Spearman' | 'Kendall' = 'Pearson'
): CorrelationAnalysis {
  const now = new Date();
  const correlations = [];
  
  // 变量对
  const variablePairs = [
    { v1: 'pm25', v2: 'temperature' },
    { v1: 'pm25', v2: 'humidity' },
    { v1: 'pm25', v2: 'windSpeed' },
    { v1: 'pm10', v2: 'pm25' },
    { v1: 'o3', v2: 'temperature' },
    { v1: 'o3', v2: 'so2' },
    { v1: 'no2', v2: 'traffic_flow' },
    { v1: 'so2', v2: 'industrial_activity' },
    { v1: 'aqi', v2: 'precipitation' },
    { v1: 'co', v2: 'traffic_congestion' }
  ];
  
  for (const pair of variablePairs) {
    // 随机生成相关系数
    const coefficient = (Math.random() * 2 - 1) * 0.95; // -0.95 to 0.95
    const pValue = Math.random() * 0.1;
    const significant = pValue < 0.05;
    
    let relationship: 'Strong Positive' | 'Moderate Positive' | 'Weak Positive' | 'No Correlation' | 'Weak Negative' | 'Moderate Negative' | 'Strong Negative';
    
    if (coefficient > 0.7) relationship = 'Strong Positive';
    else if (coefficient > 0.3) relationship = 'Moderate Positive';
    else if (coefficient > 0) relationship = 'Weak Positive';
    else if (coefficient > -0.3) relationship = 'Weak Negative';
    else if (coefficient > -0.7) relationship = 'Moderate Negative';
    else relationship = 'Strong Negative';
    
    if (Math.abs(coefficient) < 0.1) relationship = 'No Correlation';
    
    correlations.push({
      variable1: pair.v1,
      variable2: pair.v2,
      coefficient,
      pValue,
      relationship,
      significant
    });
  }
  
  return {
    id: `corr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    generatedAt: now.toISOString(),
    stationIds,
    timeRange: {
      start: startDate,
      end: endDate
    },
    correlations,
    method
  };
}

// 生成污染源归因分析
export function generateSourceAttribution(
  stationId: string,
  timestamp: string
): SourceAttributionAnalysis {
  const now = new Date();
  
  // 定义潜在污染源类型及其详情
  const potentialSources = [
    {
      sourceType: '交通排放',
      details: '主要来自机动车尾气，包括氮氧化物和颗粒物'
    },
    {
      sourceType: '工业活动',
      details: '周边工业园区排放，含重金属和挥发性有机物'
    },
    {
      sourceType: '燃煤',
      details: '电厂和居民冬季取暖排放的二氧化硫和颗粒物'
    },
    {
      sourceType: '建筑施工',
      details: '工地扬尘导致PM10和PM2.5升高'
    },
    {
      sourceType: '区域传输',
      details: '上风向城市或工业区污染物经风力传输'
    },
    {
      sourceType: '二次污染',
      details: '阳光照射下原始污染物发生化学反应形成的臭氧等二次污染物'
    },
    {
      sourceType: '生物源排放',
      details: '植物释放的挥发性有机物和花粉'
    }
  ];
  
  // 随机选择3-5个污染源
  const sourceCount = Math.floor(Math.random() * 3) + 3;
  const shuffledSources = [...potentialSources].sort(() => 0.5 - Math.random());
  const selectedSources = shuffledSources.slice(0, sourceCount);
  
  // 生成随机贡献率，总和为100%
  const contributions: number[] = [];
  let remainingPercentage = 100;
  
  for (let i = 0; i < sourceCount - 1; i++) {
    const contribution = i === sourceCount - 2 
      ? remainingPercentage
      : Math.floor(Math.random() * remainingPercentage * 0.8);
    
    contributions.push(contribution / 100);
    remainingPercentage -= contribution;
  }
  
  contributions.push(remainingPercentage / 100);
  
  // 生成源归因结果
  const sources = selectedSources.map((source, index) => ({
    sourceType: source.sourceType,
    contribution: contributions[index],
    confidence: 0.6 + Math.random() * 0.3,
    details: source.details
  }));
  
  return {
    id: `attr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    generatedAt: now.toISOString(),
    stationId,
    timestamp,
    sources,
    methodology: '受体模型与源分析相结合',
    uncertainty: 0.1 + Math.random() * 0.15
  };
}

// 生成长期趋势分析
export function generateTrendAnalysis(
  stationId: string,
  pollutant: string,
  startDate: string,
  endDate: string,
  interval: 'day' | 'week' | 'month' | 'year' = 'day'
): TrendAnalysis {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 计算时间间隔内的数据点数量
  let dataPointsCount;
  switch (interval) {
    case 'day':
      dataPointsCount = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
      break;
    case 'week':
      dataPointsCount = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      break;
    case 'month':
      dataPointsCount = 
        (end.getFullYear() - start.getFullYear()) * 12 + 
        (end.getMonth() - start.getMonth());
      break;
    case 'year':
      dataPointsCount = end.getFullYear() - start.getFullYear() + 1;
      break;
  }
  
  // 确保至少有10个数据点
  dataPointsCount = Math.max(dataPointsCount, 10);
  
  // 趋势方向和变化率
  const trendOptions = ['increasing', 'decreasing', 'stable'] as const;
  const direction = trendOptions[Math.floor(Math.random() * 3)];
  const changeRate = direction === 'stable' 
    ? Math.random() * 0.05 
    : (direction === 'increasing' ? 1 : -1) * (Math.random() * 0.3 + 0.05);
  
  // 是否有季节性
  const seasonality = Math.random() > 0.3;
  
  // 断点（重大变化点）
  const breakpointsCount = Math.floor(Math.random() * 2); // 0-1个断点
  const breakpoints = [];
  
  if (breakpointsCount > 0) {
    const breakpointIndex = Math.floor(dataPointsCount * 0.3) + 
                          Math.floor(Math.random() * (dataPointsCount * 0.4));
    const breakpointDate = new Date(start);
    
    switch (interval) {
      case 'day':
        breakpointDate.setDate(breakpointDate.getDate() + breakpointIndex);
        break;
      case 'week':
        breakpointDate.setDate(breakpointDate.getDate() + breakpointIndex * 7);
        break;
      case 'month':
        breakpointDate.setMonth(breakpointDate.getMonth() + breakpointIndex);
        break;
      case 'year':
        breakpointDate.setFullYear(breakpointDate.getFullYear() + breakpointIndex);
        break;
    }
    
    const causes = [
      '环保政策实施', 
      '重大工业项目投产',
      '交通管制措施',
      '气象条件剧变',
      '季节性污染源增加'
    ];
    
    breakpoints.push({
      timestamp: breakpointDate.toISOString(),
      significance: 0.7 + Math.random() * 0.3,
      possibleCause: causes[Math.floor(Math.random() * causes.length)]
    });
  }
  
  // 生成数据点
  const dataPoints = [];
  const baseValue = 30 + Math.random() * 50; // 基准值
  const seasonalAmplitude = seasonality ? baseValue * 0.3 : 0; // 季节性振幅
  
  for (let i = 0; i < dataPointsCount; i++) {
    const pointDate = new Date(start);
    
    switch (interval) {
      case 'day':
        pointDate.setDate(pointDate.getDate() + i);
        break;
      case 'week':
        pointDate.setDate(pointDate.getDate() + i * 7);
        break;
      case 'month':
        pointDate.setMonth(pointDate.getMonth() + i);
        break;
      case 'year':
        pointDate.setFullYear(pointDate.getFullYear() + i);
        break;
    }
    
    // 计算趋势值
    const trendValue = baseValue + baseValue * changeRate * (i / dataPointsCount);
    
    // 计算季节性分量
    const seasonal = seasonality 
      ? seasonalAmplitude * Math.sin(i * (2 * Math.PI / (dataPointsCount / 4)))
      : 0;
    
    // 计算随机残差
    const residual = (Math.random() * 2 - 1) * baseValue * 0.1;
    
    // 断点影响
    let breakpointEffect = 0;
    if (breakpoints.length > 0) {
      const breakpointIndex = Math.floor(dataPointsCount * 0.3) + 
                            Math.floor(Math.random() * (dataPointsCount * 0.4));
      if (i > breakpointIndex) {
        breakpointEffect = direction === 'increasing' 
          ? baseValue * 0.2
          : direction === 'decreasing' 
            ? -baseValue * 0.2
            : 0;
      }
    }
    
    // 最终值
    const value = Math.max(0, trendValue + seasonal + residual + breakpointEffect);
    
    dataPoints.push({
      timestamp: pointDate.toISOString(),
      value: Math.round(value * 10) / 10,
      trend: Math.round(trendValue * 10) / 10,
      seasonal: Math.round(seasonal * 10) / 10,
      residual: Math.round(residual * 10) / 10
    });
  }
  
  return {
    id: `trend-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    generatedAt: now.toISOString(),
    stationId,
    pollutant,
    timeRange: {
      start: startDate,
      end: endDate,
      interval
    },
    trend: {
      direction,
      changeRate,
      seasonality,
      breakpoints
    },
    dataPoints,
    methodology: '时间序列分解与趋势分析'
  };
}

// 生成高级AQI预测
export function generateAQIPrediction(
  stationId: string,
  days: number = 7
): Forecast {
  const now = new Date();
  const predictions = [];
  
  // 基础AQI值，有轻微上升趋势
  let baseAQI = 70 + Math.floor(Math.random() * 30);
  // 随机选择主要污染物
  const pollutants = ['pm25', 'pm10', 'o3', 'no2', 'so2'];
  const dominantPollutantIndex = Math.floor(Math.random() * pollutants.length);
  
  for (let i = 0; i < days * 24; i++) { // 每小时一个数据点
    const timeOffset = i * 60 * 60 * 1000;
    const timestamp = new Date(now.getTime() + timeOffset);
    
    // 日变化模式：下午污染较重，凌晨较轻
    const hourFactor = Math.sin((timestamp.getHours() - 6) * Math.PI / 12) * 0.3 + 1;
    
    // 天气模式：假设第3-4天有雨，空气质量改善
    const dayIndex = Math.floor(i / 24);
    const rainFactor = (dayIndex === 2 || dayIndex === 3) ? 0.7 : 1;
    
    // 周末交通模式：周末交通减少，NOx降低
    const isWeekend = (timestamp.getDay() === 0 || timestamp.getDay() === 6);
    const weekendFactor = isWeekend ? 0.8 : 1;
    
    // 计算当前AQI
    const currentAQI = Math.round(baseAQI * hourFactor * rainFactor * weekendFactor);
    baseAQI += Math.random() * 2 - 1; // 微小随机波动
    
    // 确定AQI类别
    let category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' = 'Good';
    if (currentAQI > 300) category = 'Hazardous';
    else if (currentAQI > 200) category = 'Very Unhealthy';
    else if (currentAQI > 150) category = 'Unhealthy';
    else if (currentAQI > 100) category = 'Unhealthy for Sensitive Groups';
    else if (currentAQI > 50) category = 'Moderate';
    
    // 生成各污染物浓度
    // 优先主导污染物浓度较高
    const pm25 = pollutants[dominantPollutantIndex] === 'pm25' 
      ? currentAQI * 0.6 
      : currentAQI * 0.3 * Math.random();
      
    const pm10 = pollutants[dominantPollutantIndex] === 'pm10' 
      ? currentAQI * 1.2 
      : currentAQI * 0.7 * Math.random();
      
    const o3 = pollutants[dominantPollutantIndex] === 'o3' 
      ? 40 + currentAQI * 0.7 
      : 20 + currentAQI * 0.3 * Math.random();
      
    const no2 = pollutants[dominantPollutantIndex] === 'no2' 
      ? 30 + currentAQI * 0.5 
      : 10 + currentAQI * 0.2 * Math.random();
      
    const so2 = pollutants[dominantPollutantIndex] === 'so2' 
      ? 20 + currentAQI * 0.4 
      : 5 + currentAQI * 0.1 * Math.random();
      
    const co = 0.5 + currentAQI * 0.02 * Math.random();
    
    // 预测置信度随时间递减
    const confidence = 0.95 - (i / (days * 24)) * 0.5;
    
    predictions.push({
      timestamp: timestamp.toISOString(),
      aqi: currentAQI,
      category,
      dominantPollutant: pollutants[dominantPollutantIndex],
      pollutants: {
        pm25: Math.round(pm25),
        pm10: Math.round(pm10),
        o3: Math.round(o3),
        no2: Math.round(no2),
        so2: Math.round(so2),
        co: Math.round(co * 10) / 10
      },
      confidence: Math.round(confidence * 100) / 100
    });
  }
  
  return {
    stationId,
    generatedAt: now.toISOString(),
    predictions,
    forecastMethod: '深度学习模型 + 气象数据 + 交通数据 + 历史模式分析',
    accuracy: {
      historical: 0.82 + (Math.random() * 0.08),
      recent: 0.88 + (Math.random() * 0.07)
    }
  };
} 