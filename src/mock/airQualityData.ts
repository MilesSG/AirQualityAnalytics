import { AirQualityData, Station, Alert, Forecast } from '../types';

// 模拟监测站点数据
export const mockStations: Station[] = [
  {
    id: 'station-001',
    name: '北京市朝阳区监测站',
    location: {
      latitude: 39.9219,
      longitude: 116.4419,
      address: '北京市朝阳区东三环北路',
      district: '朝阳区',
      city: '北京市'
    },
    active: true,
    installationDate: '2020-01-15',
    lastMaintenance: '2023-03-22'
  },
  {
    id: 'station-002',
    name: '北京市海淀区监测站',
    location: {
      latitude: 39.9631,
      longitude: 116.3039,
      address: '北京市海淀区清华园',
      district: '海淀区',
      city: '北京市'
    },
    active: true,
    installationDate: '2019-10-10',
    lastMaintenance: '2023-02-15'
  },
  {
    id: 'station-003',
    name: '上海市浦东新区监测站',
    location: {
      latitude: 31.2246,
      longitude: 121.5438,
      address: '上海市浦东新区世纪大道',
      district: '浦东新区',
      city: '上海市'
    },
    active: true,
    installationDate: '2020-05-20',
    lastMaintenance: '2023-01-30'
  },
  {
    id: 'station-004',
    name: '广州市天河区监测站',
    location: {
      latitude: 23.1255,
      longitude: 113.3552,
      address: '广州市天河区天河路',
      district: '天河区',
      city: '广州市'
    },
    active: true,
    installationDate: '2021-02-08',
    lastMaintenance: '2023-04-10'
  },
  {
    id: 'station-005',
    name: '深圳市南山区监测站',
    location: {
      latitude: 22.5324,
      longitude: 113.9292,
      address: '深圳市南山区科技园',
      district: '南山区',
      city: '深圳市'
    },
    active: true,
    installationDate: '2019-08-25',
    lastMaintenance: '2023-03-15'
  }
];

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

// 生成过去24小时的数据
export function generatePast24HoursData(stationId: string): AirQualityData[] {
  const data: AirQualityData[] = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
    data.push(generateRandomAQIData(stationId, time.toISOString()));
  }
  
  return data.reverse(); // 返回从旧到新排序的数据
}

// 生成实时数据
export function generateRealtimeData(): AirQualityData[] {
  const now = new Date().toISOString();
  return mockStations.map(station => generateRandomAQIData(station.id, now));
}

// 生成未来预测数据
export function generateForecastData(stationId: string): Forecast {
  const now = new Date();
  const predictions = [];
  
  for (let i = 1; i <= 24; i++) {
    const time = new Date(now.getTime() + (i * 60 * 60 * 1000));
    const data = generateRandomAQIData(stationId, time.toISOString());
    
    predictions.push({
      timestamp: data.timestamp,
      aqi: data.aqi,
      category: data.category,
      dominantPollutant: data.dominantPollutant,
      pollutants: data.pollutants,
      confidence: 0.5 + (Math.random() * 0.5) // 0.5-1 范围内的置信度
    });
  }
  
  return {
    stationId,
    generatedAt: now.toISOString(),
    predictions,
    forecastMethod: '深度学习模型 + 气象数据融合分析',
    accuracy: {
      historical: 0.78 + (Math.random() * 0.1),
      recent: 0.85 + (Math.random() * 0.1)
    }
  };
}

// 生成告警数据
export function generateAlerts(): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();
  const realtimeData = generateRealtimeData();
  
  // 找出AQI超过100的站点生成警报
  realtimeData.forEach(data => {
    if (data.aqi > 100) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        stationId: data.stationId,
        timestamp: now,
        type: data.aqi > 200 ? 'Emergency' : data.aqi > 150 ? 'Danger' : 'Warning',
        pollutant: data.dominantPollutant,
        level: data.aqi,
        message: `${data.stationId}站点${data.dominantPollutant}浓度超标，当前AQI为${data.aqi}。`,
        recommendations: [
          '敏感人群应减少户外活动',
          '建议佩戴口罩出行',
          '关闭门窗，使用空气净化器'
        ],
        affected: {
          districts: [mockStations.find(s => s.id === data.stationId)?.location.district || '未知'],
          population: ['儿童', '老人', '呼吸系统疾病患者']
        },
        expectedDuration: Math.floor(Math.random() * 24) + 1 // 1-24小时
      });
    }
  });
  
  return alerts;
} 