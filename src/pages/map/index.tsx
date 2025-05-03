import React, { useState, useEffect, useRef } from 'react';
import { Card, Spin, Radio, Slider, Space, Switch, Select, Tooltip, Typography, Button, Row, Col } from 'antd';
import { InfoCircleOutlined, EnvironmentOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { getRealtimeAirQuality } from '../../services/api';
import { AirQualityData, Station } from '../../types';
import { mockStations } from '../../mock/airQualityData';

const { Option } = Select;
const { Title, Text } = Typography;

// 辅助函数：根据AQI指数返回颜色
function getAqiColor(aqi: number): string {
  if (aqi <= 50) return '#00e400'; // 优
  if (aqi <= 100) return '#ffff00'; // 良
  if (aqi <= 150) return '#ff7e00'; // 轻度污染
  if (aqi <= 200) return '#ff0000'; // 中度污染
  if (aqi <= 300) return '#99004c'; // 重度污染
  return '#7e0023'; // 严重污染
}

// 辅助函数：根据AQI指数返回描述
function getAqiDescription(aqi: number): string {
  if (aqi <= 50) return '优';
  if (aqi <= 100) return '良';
  if (aqi <= 150) return '轻度污染';
  if (aqi <= 200) return '中度污染';
  if (aqi <= 300) return '重度污染';
  return '严重污染';
}

// 初始地图中心点
const DEFAULT_CENTER: [number, number] = [35.8617, 104.1954]; // 中国中心点
const DEFAULT_ZOOM = 4;

const MapVisualization: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [realtimeData, setRealtimeData] = useState<AirQualityData[]>([]);
  const [displayMode, setDisplayMode] = useState<'aqi' | 'pm25' | 'pm10' | 'o3' | 'no2' | 'so2' | 'co'>('aqi');
  const [showLabels, setShowLabels] = useState(true);
  const [show3D, setShow3D] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const chartRef = useRef<any>(null);

  // 加载实时数据
  useEffect(() => {
    async function fetchRealtimeData() {
      try {
        setLoading(true);
        const response = await getRealtimeAirQuality();
        if (response.success && response.data) {
          setRealtimeData(response.data);
        }
      } catch (error) {
        console.error("获取实时数据失败:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRealtimeData();
    // 每5分钟更新一次数据
    const intervalId = setInterval(fetchRealtimeData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // 获取展示的值单位
  const getValueUnit = () => {
    switch (displayMode) {
      case 'pm25':
      case 'pm10':
        return 'μg/m³';
      case 'o3':
      case 'no2':
      case 'so2':
        return 'ppb';
      case 'co':
        return 'ppm';
      default:
        return '';
    }
  };

  // 获取展示的值范围
  const getValueRange = () => {
    switch (displayMode) {
      case 'pm25':
        return [0, 150];
      case 'pm10':
        return [0, 200];
      case 'o3':
        return [0, 120];
      case 'no2':
        return [0, 100];
      case 'so2':
        return [0, 50];
      case 'co':
        return [0, 10];
      default:
        return [0, 300];
    }
  };

  // 准备散点图数据
  const prepareScatterData = () => {
    return mockStations.map(station => {
      const stationData = realtimeData.find(data => data.stationId === station.id);
      let value = 0;
      
      if (stationData) {
        switch (displayMode) {
          case 'pm25':
            value = stationData.pollutants.pm25;
            break;
          case 'pm10':
            value = stationData.pollutants.pm10;
            break;
          case 'o3':
            value = stationData.pollutants.o3;
            break;
          case 'no2':
            value = stationData.pollutants.no2;
            break;
          case 'so2':
            value = stationData.pollutants.so2;
            break;
          case 'co':
            value = stationData.pollutants.co;
            break;
          default:
            value = stationData.aqi;
        }
      }
      
      return {
        name: station.name,
        value: value,
        city: station.location.city,
        itemStyle: stationData ? { color: getAqiColor(stationData.aqi) } : undefined
      };
    });
  };

  // 获取图表配置
  const getChartOption = () => {
    const unit = getValueUnit();
    const displayName = {
      aqi: 'AQI',
      pm25: 'PM2.5',
      pm10: 'PM10',
      o3: 'O₃',
      no2: 'NO₂',
      so2: 'SO₂',
      co: 'CO'
    }[displayMode];
    
    const data = prepareScatterData();
    const valueRange = getValueRange();
    
    // 简单柱状图，不需要地图数据
    return {
      title: {
        text: `各监测站点${displayName}数值`,
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          lineHeight: 30
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const stationData = realtimeData.find(
            data => data.stationId === mockStations.find(s => s.name === params.name)?.id
          );
          
          if (!stationData) return params.name;
          
          return `
            <div style="font-weight: bold; margin-bottom: 5px;">${params.name}</div>
            <div>AQI: ${stationData.aqi} (${getAqiDescription(stationData.aqi)})</div>
            <div>${displayName}: ${params.value}${unit ? ` ${unit}` : ''}</div>
            <div>城市: ${mockStations.find(s => s.name === params.name)?.location.city}</div>
          `;
        }
      },
      legend: {
        data: ['监测站点']
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.name),
        axisLabel: {
          rotate: 45,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        name: unit ? `${displayName} (${unit})` : displayName
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          type: 'slider'
        }
      ],
      series: [
        {
          name: '监测站点',
          type: 'bar',
          data: data.map(item => ({
            value: item.value,
            name: item.name,
            itemStyle: item.itemStyle
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          animation: animationEnabled
        }
      ]
    };
  };

  // 提取所有城市列表
  const cityList = Array.from(new Set(mockStations.map(station => station.location.city)));

  // 过滤特定城市数据
  const filterByCity = (city: string | null) => {
    setSelectedCity(city);
  };

  return (
    <div className="map-visualization">
      <Spin spinning={loading && realtimeData.length === 0}>
        <Card>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space style={{ marginBottom: 16 }}>
                  <Text strong>数据类型:</Text>
                  <Radio.Group 
                    value={displayMode} 
                    onChange={e => setDisplayMode(e.target.value)}
                    optionType="button"
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
                  
                  <Tooltip title="刷新数据">
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={() => window.location.reload()}
                      type="primary"
                      ghost
                    />
                  </Tooltip>
                </Space>
                
                <Space>
                  <Text strong>显示标签:</Text>
                  <Switch checked={showLabels} onChange={setShowLabels} />
                  
                  <Text strong style={{ marginLeft: 16 }}>动画效果:</Text>
                  <Switch checked={animationEnabled} onChange={setAnimationEnabled} />
                  
                  <Text strong style={{ marginLeft: 16 }}>城市筛选:</Text>
                  <Select
                    style={{ width: 150 }}
                    value={selectedCity}
                    onChange={filterByCity}
                    allowClear
                    placeholder="选择城市"
                  >
                    {cityList.map(city => (
                      <Option key={city} value={city}>{city}</Option>
                    ))}
                  </Select>
                </Space>
              </Space>
            </Col>
            
            <Col span={24} style={{ height: 500 }}>
              <ReactECharts
                ref={chartRef}
                option={getChartOption()}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            </Col>
            
            <Col span={24}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <InfoCircleOutlined />
                  <Text type="secondary">
                    提示: 使用鼠标滚轮可以缩放图表，拖动可以平移图表
                  </Text>
                </Space>
                <Text type="secondary">
                  最后更新时间: {new Date().toLocaleString()}
                </Text>
              </div>
            </Col>
          </Row>
        </Card>
      </Spin>
    </div>
  );
};

export default MapVisualization; 