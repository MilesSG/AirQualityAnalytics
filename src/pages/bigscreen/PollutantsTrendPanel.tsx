import React, { useState } from 'react';
import { Spin, Empty, Radio } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { Station, AirQualityData } from '../../types';

interface PollutantsTrendPanelProps {
  historicalData: Record<string, AirQualityData[]>;
  stations: Station[];
  loading: boolean;
}

const PollutantsTrendPanel: React.FC<PollutantsTrendPanelProps> = ({ 
  historicalData, 
  stations, 
  loading 
}) => {
  const [pollutant, setPollutant] = useState<string>('pm25');
  
  // 获取趋势图配置
  const getTrendChartOption = () => {
    const stationIds = Object.keys(historicalData);
    if (stationIds.length === 0) return {};
    
    // 获取站点名称映射
    const stationNameMap: Record<string, string> = {};
    stations.forEach(station => {
      stationNameMap[station.id] = station.name;
    });
    
    // 准备X轴时间数据（取第一个站点的时间数据）
    const firstStationData = historicalData[stationIds[0]] || [];
    const timeData = firstStationData.map(data => {
      const date = new Date(data.timestamp);
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
    });
    
    // 污染物类型的名称映射
    const pollutantNameMap: Record<string, string> = {
      'pm25': 'PM2.5',
      'pm10': 'PM10',
      'o3': 'O₃',
      'no2': 'NO₂',
      'so2': 'SO₂',
      'co': 'CO'
    };
    
    // 准备系列数据
    const series = stationIds.map(stationId => {
      const stationData = historicalData[stationId] || [];
      
      // 获取指定污染物的数据
      const pollutantData = stationData.map(data => {
        if (pollutant === 'aqi') {
          return data.aqi;
        } else {
          return data.pollutants[pollutant as keyof typeof data.pollutants];
        }
      });
      
      return {
        name: stationNameMap[stationId] || stationId,
        type: 'line',
        smooth: true,
        data: pollutantData,
        showSymbol: false,
        emphasis: {
          focus: 'series'
        }
      };
    });
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: stationIds.map(id => stationNameMap[id] || id),
        textStyle: {
          color: '#fff'
        },
        type: 'scroll',
        pageIconColor: '#fff',
        pageTextStyle: {
          color: '#fff'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timeData,
        axisLabel: {
          color: '#fff',
          rotate: 45,
          formatter: (value: string) => {
            // 只显示整点小时
            if (value.endsWith('0:00')) {
              return value;
            }
            return '';
          }
        }
      },
      yAxis: {
        type: 'value',
        name: pollutant === 'aqi' ? 'AQI' : 
              pollutant === 'co' ? 'ppm' : 
              pollutant === 'o3' || pollutant === 'no2' || pollutant === 'so2' ? 'ppb' : 
              'μg/m³',
        nameTextStyle: {
          color: '#fff'
        },
        axisLabel: {
          color: '#fff'
        }
      },
      series
    };
  };
  
  // 处理污染物类型切换
  const handlePollutantChange = (e: any) => {
    setPollutant(e.target.value);
  };
  
  // 判断是否有历史数据
  const hasHistoricalData = Object.keys(historicalData).length > 0 && 
                          Object.values(historicalData).some(arr => arr.length > 0);
  
  return (
    <div className="panel-container">
      <div className="panel-header">
        <div className="panel-title">
          <LineChartOutlined className="panel-title-icon" />
          污染物趋势分析
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
            <div style={{ marginBottom: '10px' }}>
              <Radio.Group 
                value={pollutant} 
                onChange={handlePollutantChange}
                size="small"
                buttonStyle="solid"
              >
                <Radio.Button value="aqi">AQI</Radio.Button>
                <Radio.Button value="pm25">PM2.5</Radio.Button>
                <Radio.Button value="pm10">PM10</Radio.Button>
                <Radio.Button value="o3">O₃</Radio.Button>
                <Radio.Button value="no2">NO₂</Radio.Button>
                <Radio.Button value="so2">SO₂</Radio.Button>
                <Radio.Button value="co">CO</Radio.Button>
              </Radio.Group>
            </div>
            
            <ReactECharts 
              option={getTrendChartOption()} 
              style={{ height: 'calc(100% - 40px)', width: '100%' }}
              theme="dark"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PollutantsTrendPanel; 