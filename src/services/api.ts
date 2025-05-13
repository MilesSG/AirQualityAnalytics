import { 
  AirQualityData, 
  Station, 
  Alert, 
  Forecast, 
  HealthImpact,
  ApiResponse,
  ClusterAnalysis,
  CorrelationAnalysis,
  SourceAttributionAnalysis,
  TrendAnalysis
} from '../types';

import { 
  mockStations, 
  generateRealtimeData, 
  generatePast24HoursData, 
  generateForecastData, 
  generateAlerts 
} from '../mock/airQualityData';

import {
  generateClusterAnalysis,
  generateCorrelationAnalysis,
  generateSourceAttribution,
  generateTrendAnalysis,
  generateAQIPrediction
} from '../mock/analysisData';

// 模拟API延迟
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 创建API响应
function createResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}

// 获取所有监测站点
export async function getAllStations(): Promise<ApiResponse<Station[]>> {
  await delay(300);
  return createResponse(mockStations);
}

// 获取单个监测站点
export async function getStation(stationId: string): Promise<ApiResponse<Station>> {
  await delay(200);
  const station = mockStations.find(s => s.id === stationId);
  
  if (!station) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `站点 ${stationId} 不存在`
      },
      timestamp: new Date().toISOString()
    };
  }
  
  return createResponse(station);
}

// 获取实时空气质量数据
export async function getRealtimeAirQuality(): Promise<ApiResponse<AirQualityData[]>> {
  await delay(500);
  return createResponse(generateRealtimeData());
}

// 获取指定站点的实时空气质量数据
export async function getStationRealtimeData(stationId: string): Promise<ApiResponse<AirQualityData>> {
  await delay(300);
  const allData = generateRealtimeData();
  const stationData = allData.find(d => d.stationId === stationId);
  
  if (!stationData) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `站点 ${stationId} 数据不存在`
      },
      timestamp: new Date().toISOString()
    };
  }
  
  return createResponse(stationData);
}

// 获取指定站点的24小时历史数据
export async function getStationHistoricalData(stationId: string): Promise<ApiResponse<AirQualityData[]>> {
  await delay(700);
  return createResponse(generatePast24HoursData(stationId));
}

// 获取指定站点的预测数据
export async function getStationForecast(stationId: string): Promise<ApiResponse<Forecast>> {
  await delay(800);
  return createResponse(generateForecastData(stationId));
}

// 获取当前所有告警
export async function getCurrentAlerts(): Promise<ApiResponse<Alert[]>> {
  await delay(400);
  return createResponse(generateAlerts());
}

// 模拟健康影响数据
const healthImpacts: HealthImpact[] = [
  {
    pollutant: 'pm25',
    concentrationRange: { min: 0, max: 35 },
    populationGroup: 'General',
    shortTermEffects: ['一般没有明显影响'],
    longTermEffects: ['长期暴露可能会略微增加呼吸系统疾病风险'],
    recommendations: ['正常活动'],
    riskLevel: 'Low'
  },
  {
    pollutant: 'pm25',
    concentrationRange: { min: 35, max: 150 },
    populationGroup: 'General',
    shortTermEffects: ['可能出现轻微咳嗽', '眼睛不适'],
    longTermEffects: ['增加呼吸系统疾病风险', '心血管健康可能受到影响'],
    recommendations: ['减少长时间户外活动', '关闭门窗'],
    riskLevel: 'Medium'
  },
  {
    pollutant: 'pm25',
    concentrationRange: { min: 150, max: 999 },
    populationGroup: 'General',
    shortTermEffects: ['咳嗽', '呼吸困难', '眼睛刺激'],
    longTermEffects: ['显著增加呼吸系统疾病风险', '心血管疾病风险增加'],
    recommendations: ['避免户外活动', '佩戴口罩', '使用空气净化器'],
    riskLevel: 'High'
  },
  {
    pollutant: 'pm25',
    concentrationRange: { min: 35, max: 150 },
    populationGroup: 'Respiratory',
    shortTermEffects: ['加重哮喘症状', '呼吸不适'],
    longTermEffects: ['肺功能下降', '慢性呼吸系统疾病恶化'],
    recommendations: ['避免户外活动', '随身携带哮喘药物', '佩戴N95口罩'],
    riskLevel: 'High'
  },
  {
    pollutant: 'o3',
    concentrationRange: { min: 0, max: 70 },
    populationGroup: 'General',
    shortTermEffects: ['一般没有明显影响'],
    longTermEffects: ['可能轻微影响肺部健康'],
    recommendations: ['正常活动'],
    riskLevel: 'Low'
  },
  {
    pollutant: 'o3',
    concentrationRange: { min: 70, max: 999 },
    populationGroup: 'General',
    shortTermEffects: ['咳嗽', '胸痛', '呼吸困难'],
    longTermEffects: ['肺功能损伤', '增加呼吸道感染风险'],
    recommendations: ['避免剧烈户外活动', '特别是在下午高温时段'],
    riskLevel: 'Medium'
  }
];

// 获取健康影响评估
export async function getHealthImpacts(
  pollutant: string, 
  concentration: number, 
  populationGroup: string = 'General'
): Promise<ApiResponse<HealthImpact[]>> {
  await delay(400);
  
  const impacts = healthImpacts.filter(
    impact => 
      impact.pollutant === pollutant && 
      impact.concentrationRange.min <= concentration && 
      impact.concentrationRange.max >= concentration &&
      (impact.populationGroup === populationGroup || impact.populationGroup === 'General')
  );
  
  return createResponse(impacts);
}

// 获取聚类分析结果
export async function getClusterAnalysis(
  stationIds: string[],
  startDate: string,
  endDate: string
): Promise<ApiResponse<ClusterAnalysis>> {
  await delay(1200);
  return createResponse(generateClusterAnalysis(stationIds, startDate, endDate));
}

// 获取变量相关性分析
export async function getCorrelationAnalysis(
  stationIds: string[],
  startDate: string,
  endDate: string,
  method: 'Pearson' | 'Spearman' | 'Kendall' = 'Pearson'
): Promise<ApiResponse<CorrelationAnalysis>> {
  await delay(900);
  return createResponse(generateCorrelationAnalysis(stationIds, startDate, endDate, method));
}

// 获取污染源归因分析
export async function getSourceAttribution(
  stationId: string,
  timestamp: string
): Promise<ApiResponse<SourceAttributionAnalysis>> {
  await delay(1500);
  return createResponse(generateSourceAttribution(stationId, timestamp));
}

// 获取长期趋势分析
export async function getTrendAnalysis(
  stationId: string,
  pollutant: string,
  startDate: string,
  endDate: string,
  interval: 'day' | 'week' | 'month' | 'year' = 'day'
): Promise<ApiResponse<TrendAnalysis>> {
  await delay(1000);
  return createResponse(generateTrendAnalysis(stationId, pollutant, startDate, endDate, interval));
}

// 获取AQI预测（高级预测）
export async function getAdvancedAQIPrediction(
  stationId: string,
  days: number = 7
): Promise<ApiResponse<Forecast>> {
  await delay(1800);
  return createResponse(generateAQIPrediction(stationId, days));
} 