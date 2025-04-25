// 监测站点信息
export interface Station {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    district: string;
    city: string;
  };
  active: boolean;
  installationDate: string;
  lastMaintenance: string;
}

// 空气质量数据
export interface AirQualityData {
  id: string;
  stationId: string;
  timestamp: string;
  aqi: number;
  category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  dominantPollutant: string;
  pollutants: {
    pm25: number; // PM2.5 (μg/m³)
    pm10: number; // PM10 (μg/m³)
    o3: number;   // 臭氧 (ppb)
    no2: number;  // 二氧化氮 (ppb)
    so2: number;  // 二氧化硫 (ppb)
    co: number;   // 一氧化碳 (ppm)
  };
  weather: {
    temperature: number; // 温度 (°C)
    humidity: number;    // 湿度 (%)
    windSpeed: number;   // 风速 (m/s)
    windDirection: number; // 风向 (度)
    pressure: number;    // 气压 (hPa)
    precipitation: number; // 降水量 (mm)
  };
}

// 警报信息
export interface Alert {
  id: string;
  stationId: string;
  timestamp: string;
  type: 'Warning' | 'Danger' | 'Emergency';
  pollutant: string;
  level: number;
  message: string;
  recommendations: string[];
  affected: {
    districts: string[];
    population: string[];
  };
  expectedDuration: number; // 单位：小时
}

// 健康影响评估
export interface HealthImpact {
  pollutant: string;
  concentrationRange: {
    min: number;
    max: number;
  };
  populationGroup: 'General' | 'Children' | 'Elderly' | 'Respiratory' | 'Cardiovascular';
  shortTermEffects: string[];
  longTermEffects: string[];
  recommendations: string[];
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
}

// 预测数据
export interface Forecast {
  stationId: string;
  generatedAt: string;
  predictions: Array<{
    timestamp: string;
    aqi: number;
    category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
    dominantPollutant: string;
    pollutants: {
      pm25: number;
      pm10: number;
      o3: number;
      no2: number;
      so2: number;
      co: number;
    };
    confidence: number; // 0-1 范围内的置信度
  }>;
  forecastMethod: string;
  accuracy: {
    historical: number; // 历史预测准确率 (0-1)
    recent: number;     // 最近预测准确率 (0-1)
  };
}

// 用户偏好设置
export interface UserPreferences {
  dashboardLayout: string[];
  favoriteStations: string[];
  alertSettings: {
    email: boolean;
    push: boolean;
    sms: boolean;
    thresholds: {
      pm25: number;
      pm10: number;
      o3: number;
      no2: number;
      so2: number;
      co: number;
    };
  };
  displayUnits: {
    temperature: 'C' | 'F';
    windSpeed: 'mps' | 'kmh' | 'mph';
    pressure: 'hPa' | 'mmHg';
  };
  mapView: {
    defaultCenter: {
      latitude: number;
      longitude: number;
    };
    defaultZoom: number;
    layers: string[];
  };
}

// 通用响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
} 