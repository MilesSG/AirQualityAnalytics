import { AirQualityData, ApiResponse } from '../types';
import dayjs from 'dayjs';

// 生成随机的空气质量数据
function generateRandomAQIData(stationId: string, timestamp: string): AirQualityData {
  const pm25 = Math.floor(Math.random() * 150);
  const pm10 = Math.floor(Math.random() * 200);
  const o3 = Math.floor(Math.random() * 120);
  const no2 = Math.floor(Math.random() * 100);
  const so2 = Math.floor(Math.random() * 50);
  const co = Math.random() * 10;
  
  // 计算AQI (简化版，仅基于PM2.5)
  const aqi = Math.floor(pm25 * 1.8);
  
  // 确定AQI类别
  let category: AirQualityData['category'] = 'Good';
  if (aqi > 300) category = 'Hazardous';
  else if (aqi > 200) category = 'Very Unhealthy';
  else if (aqi > 150) category = 'Unhealthy';
  else if (aqi > 100) category = 'Unhealthy for Sensitive Groups';
  else if (aqi > 50) category = 'Moderate';
  
  // 确定主要污染物
  const pollutants = { pm25, pm10, o3, no2, so2, co };
  const pollutantValues = [
    { name: 'pm25', value: pm25 / 35 }, // 除以参考值，标准化
    { name: 'pm10', value: pm10 / 70 },
    { name: 'o3', value: o3 / 70 },
    { name: 'no2', value: no2 / 40 },
    { name: 'so2', value: so2 / 20 },
    { name: 'co', value: co / 4 }
  ];
  pollutantValues.sort((a, b) => b.value - a.value);
  const dominantPollutant = pollutantValues[0].name;
  
  // 生成随机天气数据
  const weather = {
    temperature: Math.floor(Math.random() * 35) - 5,
    humidity: Math.floor(Math.random() * 100),
    windSpeed: Math.random() * 15,
    windDirection: Math.floor(Math.random() * 360),
    pressure: Math.floor(Math.random() * 50) + 970,
    precipitation: Math.random() * 20
  };
  
  return {
    id: `data-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    stationId,
    timestamp,
    aqi,
    category,
    dominantPollutant,
    pollutants,
    weather
  };
}

// 生成指定日期范围内的历史数据
function generateHistoricalDataInRange(
  stationId: string, 
  startDate: string, 
  endDate: string
): AirQualityData[] {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const diffDays = end.diff(start, 'day');
  
  const data: AirQualityData[] = [];
  
  // 每天生成4条数据（6小时间隔）
  for (let i = 0; i <= diffDays; i++) {
    const currentDate = start.add(i, 'day');
    
    for (let hour = 0; hour < 24; hour += 6) {
      const timestamp = currentDate.hour(hour).minute(0).second(0).toISOString();
      data.push(generateRandomAQIData(stationId, timestamp));
    }
  }
  
  return data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

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

/**
 * 获取指定站点的历史数据
 * @param stationId 监测站ID
 * @param startDate 开始日期（YYYY-MM-DD格式）
 * @param endDate 结束日期（YYYY-MM-DD格式）
 * @returns 包含历史数据的API响应
 */
export async function getHistoricalData(
  stationId: string, 
  startDate: string, 
  endDate: string
): Promise<ApiResponse<AirQualityData[]>> {
  // 模拟API延迟
  await delay(800);
  
  const historicalData = generateHistoricalDataInRange(stationId, startDate, endDate);
  return createResponse(historicalData);
} 