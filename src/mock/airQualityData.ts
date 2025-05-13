import { AirQualityData, Station, Alert, Forecast } from '../types';

// 模拟站点数据
export const mockStations: Station[] = [
  {
    id: 'S001',
    name: '北京市朝阳区监测站',
    location: {
      latitude: 39.9219,
      longitude: 116.4429,
      address: '北京市朝阳区建国路甲92号',
      district: '朝阳区',
      city: '北京市'
    },
    active: true,
    installationDate: '2018-01-15',
    lastMaintenance: '2022-11-10'
  },
  {
    id: 'S002',
    name: '北京市海淀区监测站',
    location: {
      latitude: 40.0096,
      longitude: 116.3312,
      address: '北京市海淀区中关村南大街5号',
      district: '海淀区',
      city: '北京市'
    },
    active: true,
    installationDate: '2017-06-20',
    lastMaintenance: '2023-01-15'
  },
  {
    id: 'S003',
    name: '上海市浦东新区监测站',
    location: {
      latitude: 31.2240,
      longitude: 121.5412,
      address: '上海市浦东新区张杨路800号',
      district: '浦东新区',
      city: '上海市'
    },
    active: true,
    installationDate: '2019-03-10',
    lastMaintenance: '2022-12-05'
  },
  {
    id: 'S004',
    name: '上海市徐汇区监测站',
    location: {
      latitude: 31.1895,
      longitude: 121.4365,
      address: '上海市徐汇区虹桥路1号',
      district: '徐汇区',
      city: '上海市'
    },
    active: true,
    installationDate: '2018-09-25',
    lastMaintenance: '2022-10-30'
  },
  {
    id: 'S005',
    name: '广州市天河区监测站',
    location: {
      latitude: 23.1354,
      longitude: 113.3254,
      address: '广州市天河区天河路385号',
      district: '天河区',
      city: '广州市'
    },
    active: true,
    installationDate: '2019-05-15',
    lastMaintenance: '2023-02-20'
  },
  {
    id: 'S006',
    name: '深圳市南山区监测站',
    location: {
      latitude: 22.5310,
      longitude: 113.9257,
      address: '深圳市南山区深南大道10000号',
      district: '南山区',
      city: '深圳市'
    },
    active: true,
    installationDate: '2019-11-10',
    lastMaintenance: '2023-03-05'
  },
  {
    id: 'S007',
    name: '成都市锦江区监测站',
    location: {
      latitude: 30.6551,
      longitude: 104.0809,
      address: '成都市锦江区红星路三段1号',
      district: '锦江区',
      city: '成都市'
    },
    active: true,
    installationDate: '2020-02-18',
    lastMaintenance: '2023-01-25'
  },
  {
    id: 'S008',
    name: '重庆市渝中区监测站',
    location: {
      latitude: 29.5625,
      longitude: 106.5682,
      address: '重庆市渝中区解放碑步行街88号',
      district: '渝中区',
      city: '重庆市'
    },
    active: true,
    installationDate: '2020-04-10',
    lastMaintenance: '2023-02-10'
  }
];

// 根据AQI值确定空气质量类别
function getAqiCategory(aqi: number): 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

// 根据AQI和其他污染物数据确定主要污染物
function getDominantPollutant(pollutants: AirQualityData['pollutants']): string {
  const { pm25, pm10, o3, no2, so2, co } = pollutants;
  
  // 简化的主要污染物判断逻辑
  const normalizedLevels = {
    pm25: pm25 / 35,  // PM2.5标准为35
    pm10: pm10 / 150, // PM10标准为150
    o3: o3 / 160,     // O3标准为160ppb
    no2: no2 / 100,   // NO2标准为100ppb
    so2: so2 / 150,   // SO2标准为150ppb
    co: co / 4        // CO标准为4ppm
  };
  
  // 找出最高的污染物
  let maxPollutant = 'pm25';
  let maxValue = normalizedLevels.pm25;
  
  for (const [pollutant, value] of Object.entries(normalizedLevels)) {
    if (value > maxValue) {
      maxValue = value;
      maxPollutant = pollutant;
    }
  }
  
  return maxPollutant;
}

// 生成随机的空气质量数据
function generateRandomAirQualityData(stationId: string, timestamp: string = new Date().toISOString()): AirQualityData {
  // 生成合理范围的污染物数据
  const pm25 = Math.round(Math.random() * 150);
  const pm10 = Math.round(pm25 * (1 + Math.random() * 1.5));
  const o3 = Math.round(Math.random() * 120);
  const no2 = Math.round(Math.random() * 100);
  const so2 = Math.round(Math.random() * 50);
  const co = Math.round(Math.random() * 9 * 10) / 10;
  
  // 粗略计算AQI（实际中AQI计算更复杂）
  const aqi = Math.max(
    pm25 * 2,
    pm10 * 1,
    o3 * 1.2,
    no2 * 1.5,
    so2 * 2,
    co * 30
  );
  
  const roundedAqi = Math.round(aqi);
  
  // 确定空气质量类别
  const category = getAqiCategory(roundedAqi);
  
  // 确定主要污染物
  const pollutants = { pm25, pm10, o3, no2, so2, co };
  const dominantPollutant = getDominantPollutant(pollutants);
  
  // 生成随机气象数据
  const weather = {
    temperature: Math.round((Math.random() * 30 - 5) * 10) / 10, // -5 到 25 摄氏度
    humidity: Math.round(Math.random() * 100), // 0-100%
    windSpeed: Math.round(Math.random() * 10 * 10) / 10, // 0-10 m/s
    windDirection: Math.round(Math.random() * 360), // 0-360 度
    pressure: Math.round(1000 + Math.random() * 30), // 1000-1030 hPa
    precipitation: Math.round(Math.random() * 20 * 10) / 10 // 0-20 mm
  };
  
  return {
    id: `AQ-${stationId}-${Date.now()}`,
    stationId,
    timestamp,
    aqi: roundedAqi,
    category,
    dominantPollutant,
    pollutants,
    weather
  };
}

// 生成实时空气质量数据
export function generateRealtimeData(): AirQualityData[] {
  return mockStations.map(station => 
    generateRandomAirQualityData(station.id)
  );
}

// 生成过去24小时的历史数据
export function generatePast24HoursData(stationId: string): AirQualityData[] {
  const data = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString();
    data.push(generateRandomAirQualityData(stationId, timestamp));
  }
  
  return data;
}

// 生成预测数据
export function generateForecastData(stationId: string): Forecast {
  const now = new Date();
  const predictions = [];
  
  // 基础AQI值，有轻微上升趋势
  let baseAQI = 70 + Math.floor(Math.random() * 30);
  
  // 随机选择主要污染物
  const pollutants = ['pm25', 'pm10', 'o3', 'no2', 'so2'];
  const dominantPollutantIndex = Math.floor(Math.random() * pollutants.length);
  
  for (let i = 1; i <= 72; i++) { // 未来72小时
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
    const category = getAqiCategory(currentAQI);
    
    // 生成各污染物浓度
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
    const confidence = 0.95 - (i / 72) * 0.5;
    
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
    forecastMethod: '多模型集成预测 + 气象数据',
    accuracy: {
      historical: 0.82 + (Math.random() * 0.08),
      recent: 0.88 + (Math.random() * 0.07)
    }
  };
}

// 生成告警数据
export function generateAlerts(): Alert[] {
  const mockAlerts: Alert[] = [];
  const now = new Date();
  const realtimeData = generateRealtimeData();
  
  // 筛选AQI超过100的站点生成告警
  const highAqiStations = realtimeData.filter(data => data.aqi > 150);
  
  highAqiStations.forEach(data => {
    const alertTypes: ('Warning' | 'Danger' | 'Emergency')[] = ['Warning', 'Danger', 'Emergency'];
    const alertType = data.aqi > 300 ? 'Emergency' : data.aqi > 200 ? 'Danger' : 'Warning';
    
    const stationInfo = mockStations.find(s => s.id === data.stationId);
    
    if (!stationInfo) return;
    
    mockAlerts.push({
      id: `ALT-${data.stationId}-${Date.now()}`,
      stationId: data.stationId,
      timestamp: now.toISOString(),
      type: alertType,
      pollutant: data.dominantPollutant,
      level: data.aqi,
      message: `${stationInfo.location.city}${stationInfo.location.district}空气质量${alertType === 'Emergency' ? '严重' : alertType === 'Danger' ? '重度' : '中度'}污染`,
      recommendations: [
        '敏感人群避免户外活动',
        '一般人群减少户外运动',
        '幼儿园和学校暂停户外活动'
      ],
      affected: {
        districts: [stationInfo.location.district],
        population: ['敏感人群', '儿童', '老人']
      },
      expectedDuration: Math.round(Math.random() * 24 + 6) // 6-30小时
    });
  });
  
  return mockAlerts;
} 