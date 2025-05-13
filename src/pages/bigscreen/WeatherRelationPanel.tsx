import React, { useState } from 'react';
import { Spin, Empty, Select } from 'antd';
import { CloudOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { Station, AirQualityData } from '../../types';

const { Option } = Select;

interface WeatherRelationPanelProps {
  historicalData: Record<string, AirQualityData[]>;
  stations: Station[];
  loading: boolean;
}

const WeatherRelationPanel: React.FC<WeatherRelationPanelProps> = ({ 
  historicalData, 
  stations, 
  loading 
}) => {
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [selectedWeatherFactor, setSelectedWeatherFactor] = useState<string>('temperature');
  const [selectedPollutant, setSelectedPollutant] = useState<string>('pm25');
  
  // 获取散点图配置
  const getScatterOption = () => {
    if (!selectedStation || !historicalData[selectedStation]) {
      return {};
    }
    
    const stationData = historicalData[selectedStation];
    
    // 获取天气因素的数据点
    const weatherData = stationData.map(data => {
      return data.weather[selectedWeatherFactor as keyof typeof data.weather];
    });
    
    // 获取污染物数据点
    const pollutantData = stationData.map(data => {
      if (selectedPollutant === 'aqi') {
        return data.aqi;
      } else {
        return data.pollutants[selectedPollutant as keyof typeof data.pollutants];
      }
    });
    
    // 合并为散点图数据
    const scatterData = weatherData.map((weather, index) => [weather, pollutantData[index]]);
    
    // 计算相关系数
    const correlation = calculateCorrelation(weatherData, pollutantData);
    
    // 配置坐标轴标签
    const weatherFactorLabel = getWeatherFactorLabel(selectedWeatherFactor);
    const pollutantLabel = getPollutantLabel(selectedPollutant);
    
    return {
      title: {
        text: `相关系数: ${correlation.toFixed(2)}`,
        textStyle: {
          color: '#fff',
          fontSize: 14
        },
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${weatherFactorLabel}: ${params.value[0]}<br/>${pollutantLabel}: ${params.value[1]}`;
        }
      },
      grid: {
        left: '10%',
        right: '5%',
        top: '15%',
        bottom: '10%'
      },
      xAxis: {
        type: 'value',
        name: weatherFactorLabel,
        nameLocation: 'middle',
        nameGap: 25,
        nameTextStyle: {
          color: '#fff'
        },
        axisLabel: {
          color: '#fff'
        }
      },
      yAxis: {
        type: 'value',
        name: pollutantLabel,
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          color: '#fff'
        },
        axisLabel: {
          color: '#fff'
        }
      },
      series: [
        {
          name: '相关性',
          type: 'scatter',
          symbolSize: 8,
          data: scatterData,
          itemStyle: {
            color: function(params: any) {
              // 根据相关系数决定颜色
              if (correlation > 0.5) return '#ff4d4f';
              if (correlation > 0.2) return '#faad14';
              if (correlation > -0.2) return '#52c41a';
              if (correlation > -0.5) return '#1890ff';
              return '#722ed1';
            }
          }
        }
      ]
    };
  };
  
  // 计算皮尔逊相关系数
  const calculateCorrelation = (x: number[], y: number[]): number => {
    if (x.length !== y.length || x.length === 0) return 0;
    
    // 计算平均值
    const xMean = x.reduce((a, b) => a + b, 0) / x.length;
    const yMean = y.reduce((a, b) => a + b, 0) / y.length;
    
    // 计算分子（协方差）
    let numerator = 0;
    for (let i = 0; i < x.length; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean);
    }
    
    // 计算分母（标准差的乘积）
    let denomX = 0;
    let denomY = 0;
    for (let i = 0; i < x.length; i++) {
      denomX += Math.pow(x[i] - xMean, 2);
      denomY += Math.pow(y[i] - yMean, 2);
    }
    
    const denominator = Math.sqrt(denomX * denomY);
    
    // 防止除以零
    if (denominator === 0) return 0;
    
    return numerator / denominator;
  };
  
  // 获取天气因素名称标签
  const getWeatherFactorLabel = (factor: string): string => {
    const factorLabels: Record<string, string> = {
      'temperature': '温度 (°C)',
      'humidity': '湿度 (%)',
      'windSpeed': '风速 (m/s)',
      'windDirection': '风向 (度)',
      'pressure': '气压 (hPa)',
      'precipitation': '降水量 (mm)'
    };
    
    return factorLabels[factor] || factor;
  };
  
  // 获取污染物名称标签
  const getPollutantLabel = (pollutant: string): string => {
    const pollutantLabels: Record<string, string> = {
      'aqi': 'AQI',
      'pm25': 'PM2.5 (μg/m³)',
      'pm10': 'PM10 (μg/m³)',
      'o3': 'O₃ (ppb)',
      'no2': 'NO₂ (ppb)',
      'so2': 'SO₂ (ppb)',
      'co': 'CO (ppm)'
    };
    
    return pollutantLabels[pollutant] || pollutant;
  };
  
  // 根据相关系数获取关系描述
  const getRelationDescription = (correlation: number): string => {
    const absCorr = Math.abs(correlation);
    
    if (absCorr < 0.1) return '无明显相关性';
    if (absCorr < 0.3) return '弱相关性';
    if (absCorr < 0.5) return '中等相关性';
    if (absCorr < 0.7) return '强相关性';
    return '极强相关性';
  };
  
  // 判断是否有历史数据
  const hasHistoricalData = Object.keys(historicalData).length > 0 && 
                          Object.values(historicalData).some(arr => arr.length > 0);
  
  // 如果没有选择站点但有历史数据，自动选择第一个站点
  if (!selectedStation && hasHistoricalData) {
    const stationIds = Object.keys(historicalData);
    if (stationIds.length > 0) {
      setSelectedStation(stationIds[0]);
    }
  }
  
  // 获取当前选择的相关系数
  const getCurrentCorrelation = (): number => {
    if (!selectedStation || !historicalData[selectedStation]) return 0;
    
    const stationData = historicalData[selectedStation];
    
    // 获取天气因素的数据点
    const weatherData = stationData.map(data => {
      return data.weather[selectedWeatherFactor as keyof typeof data.weather];
    });
    
    // 获取污染物数据点
    const pollutantData = stationData.map(data => {
      if (selectedPollutant === 'aqi') {
        return data.aqi;
      } else {
        return data.pollutants[selectedPollutant as keyof typeof data.pollutants];
      }
    });
    
    return calculateCorrelation(weatherData, pollutantData);
  };
  
  return (
    <div className="panel-container">
      <div className="panel-header">
        <div className="panel-title">
          <CloudOutlined className="panel-title-icon" />
          天气因素相关性
        </div>
      </div>
      
      <div className="panel-content">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : !hasHistoricalData ? (
          <Empty description="暂无历史数据" />
        ) : (
          <>
            <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
              <Select
                placeholder="选择站点"
                style={{ flex: 1 }}
                value={selectedStation}
                onChange={setSelectedStation}
                size="small"
              >
                {stations.map(station => (
                  <Option key={station.id} value={station.id}>{station.name}</Option>
                ))}
              </Select>
              
              <Select
                placeholder="天气因素"
                style={{ flex: 1 }}
                value={selectedWeatherFactor}
                onChange={setSelectedWeatherFactor}
                size="small"
              >
                <Option value="temperature">温度</Option>
                <Option value="humidity">湿度</Option>
                <Option value="windSpeed">风速</Option>
                <Option value="pressure">气压</Option>
                <Option value="precipitation">降水量</Option>
              </Select>
              
              <Select
                placeholder="污染物"
                style={{ flex: 1 }}
                value={selectedPollutant}
                onChange={setSelectedPollutant}
                size="small"
              >
                <Option value="aqi">AQI</Option>
                <Option value="pm25">PM2.5</Option>
                <Option value="pm10">PM10</Option>
                <Option value="o3">O₃</Option>
                <Option value="no2">NO₂</Option>
                <Option value="so2">SO₂</Option>
                <Option value="co">CO</Option>
              </Select>
            </div>
            
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '15px', 
              color: '#fff',
              fontSize: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              padding: '5px',
              borderRadius: '4px'
            }}>
              {getWeatherFactorLabel(selectedWeatherFactor)} 与 {getPollutantLabel(selectedPollutant)} 关系: 
              <span style={{ 
                fontWeight: 'bold', 
                marginLeft: '5px',
                color: Math.abs(getCurrentCorrelation()) > 0.5 ? '#ff4d4f' : 
                      Math.abs(getCurrentCorrelation()) > 0.3 ? '#faad14' : '#52c41a'
              }}>
                {getRelationDescription(getCurrentCorrelation())}
                ({getCurrentCorrelation() >= 0 ? '正相关' : '负相关'})
              </span>
            </div>
            
            <ReactECharts 
              option={getScatterOption()} 
              style={{ height: 'calc(100% - 75px)', width: '100%' }}
              theme="dark"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default WeatherRelationPanel; 