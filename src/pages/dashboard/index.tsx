import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Progress, Table, Alert as AntdAlert, Select, Divider } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloudOutlined,
  CompassOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getRealtimeAirQuality, getStationHistoricalData } from '../../services/api';
import { AirQualityData, Station } from '../../types';
import { mockStations } from '../../mock/airQualityData';

const { Option } = Select;

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

// 仪表板组件
const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [realtimeData, setRealtimeData] = useState<AirQualityData[]>([]);
  const [historicalData, setHistoricalData] = useState<AirQualityData[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>(mockStations[0].id);

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

  // 加载选定站点的历史数据
  useEffect(() => {
    async function fetchHistoricalData() {
      if (!selectedStation) return;
      
      try {
        setLoading(true);
        const response = await getStationHistoricalData(selectedStation);
        if (response.success && response.data) {
          setHistoricalData(response.data);
        }
      } catch (error) {
        console.error("获取历史数据失败:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistoricalData();
  }, [selectedStation]);

  // 获取选定站点的实时数据
  const getSelectedStationData = (): AirQualityData | undefined => {
    return realtimeData.find(data => data.stationId === selectedStation);
  };

  // 获取所有站点的平均AQI
  const getAverageAQI = (): number => {
    if (realtimeData.length === 0) return 0;
    const sum = realtimeData.reduce((acc, data) => acc + data.aqi, 0);
    return Math.round(sum / realtimeData.length);
  };

  // 24小时趋势图配置
  const getTrendChartOption = () => {
    const timestamps = historicalData.map(data => {
      const date = new Date(data.timestamp);
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    });
    
    const aqiValues = historicalData.map(data => data.aqi);
    const pm25Values = historicalData.map(data => data.pollutants.pm25);
    const pm10Values = historicalData.map(data => data.pollutants.pm10);
    const o3Values = historicalData.map(data => data.pollutants.o3);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['AQI', 'PM2.5', 'PM10', 'O3']
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
        data: timestamps
      },
      yAxis: [
        {
          type: 'value',
          name: 'AQI',
          position: 'left'
        },
        {
          type: 'value',
          name: '浓度',
          position: 'right'
        }
      ],
      series: [
        {
          name: 'AQI',
          type: 'line',
          data: aqiValues,
          itemStyle: {
            color: '#FF4500'
          },
          yAxisIndex: 0,
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: 'PM2.5',
          type: 'line',
          data: pm25Values,
          itemStyle: {
            color: '#4169E1'
          },
          yAxisIndex: 1,
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: 'PM10',
          type: 'line',
          data: pm10Values,
          itemStyle: {
            color: '#9400D3'
          },
          yAxisIndex: 1,
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: 'O3',
          type: 'line',
          data: o3Values,
          itemStyle: {
            color: '#32CD32'
          },
          yAxisIndex: 1,
          emphasis: {
            focus: 'series'
          }
        }
      ]
    };
  };

  // 污染物浓度雷达图配置
  const getRadarChartOption = () => {
    const selectedData = getSelectedStationData();
    if (!selectedData) return {};

    const { pm25, pm10, o3, no2, so2, co } = selectedData.pollutants;
    // 标准值（参考值）
    const pm25Ref = 35; // μg/m³
    const pm10Ref = 70; // μg/m³
    const o3Ref = 160; // ppb
    const no2Ref = 100; // ppb
    const so2Ref = 150; // ppb
    const coRef = 9;    // ppm

    // 计算百分比（超过100%表示超标）
    const pm25Percent = Math.min(Math.round((pm25 / pm25Ref) * 100), 200);
    const pm10Percent = Math.min(Math.round((pm10 / pm10Ref) * 100), 200);
    const o3Percent = Math.min(Math.round((o3 / o3Ref) * 100), 200);
    const no2Percent = Math.min(Math.round((no2 / no2Ref) * 100), 200);
    const so2Percent = Math.min(Math.round((so2 / so2Ref) * 100), 200);
    const coPercent = Math.min(Math.round((co / coRef) * 100), 200);

    return {
      radar: {
        indicator: [
          { name: 'PM2.5', max: 200 },
          { name: 'PM10', max: 200 },
          { name: 'O3', max: 200 },
          { name: 'NO2', max: 200 },
          { name: 'SO2', max: 200 },
          { name: 'CO', max: 200 }
        ],
        radius: '65%'
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: [pm25Percent, pm10Percent, o3Percent, no2Percent, so2Percent, coPercent],
              name: '污染物占标率(%)',
              symbol: 'circle',
              symbolSize: 6,
              areaStyle: {
                color: 'rgba(255, 69, 0, 0.3)'
              },
              lineStyle: {
                color: 'rgba(255, 69, 0, 0.8)',
                width: 2
              }
            }
          ]
        }
      ],
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const values = params.value;
          return `
            PM2.5: ${pm25} μg/m³ (${values[0]}%)<br/>
            PM10: ${pm10} μg/m³ (${values[1]}%)<br/>
            O3: ${o3} ppb (${values[2]}%)<br/>
            NO2: ${no2} ppb (${values[3]}%)<br/>
            SO2: ${so2} ppb (${values[4]}%)<br/>
            CO: ${co} ppm (${values[5]}%)
          `;
        }
      }
    };
  };

  // 环形图配置
  const getDoughnutChartOption = () => {
    const selectedData = getSelectedStationData();
    if (!selectedData) return {};

    const { pm25, pm10, o3, no2, so2, co } = selectedData.pollutants;
    const total = pm25 + pm10 + o3 + no2 + so2 + co;
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        data: ['PM2.5', 'PM10', 'O3', 'NO2', 'SO2', 'CO']
      },
      series: [
        {
          name: '污染物占比',
          type: 'pie',
          radius: ['50%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: pm25, name: 'PM2.5', itemStyle: { color: '#FF4500' } },
            { value: pm10, name: 'PM10', itemStyle: { color: '#9400D3' } },
            { value: o3, name: 'O3', itemStyle: { color: '#32CD32' } },
            { value: no2, name: 'NO2', itemStyle: { color: '#1E90FF' } },
            { value: so2, name: 'SO2', itemStyle: { color: '#FF8C00' } },
            { value: co, name: 'CO', itemStyle: { color: '#8B008B' } }
          ]
        }
      ]
    };
  };

  const selectedData = getSelectedStationData();
  const averageAQI = getAverageAQI();

  return (
    <div className="dashboard">
      <Spin spinning={loading && realtimeData.length === 0}>
        {realtimeData.length > 0 && (
          <>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <AntdAlert
                  message="实时空气质量概览"
                  description={`当前显示全国${realtimeData.length}个监测站点的实时空气质量数据。上次更新时间: ${new Date().toLocaleString()}`}
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                />
              </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 16]}>
              {/* 站点选择器 */}
              <Col span={24}>
                <Select
                  style={{ width: 200, marginBottom: 16 }}
                  placeholder="选择监测站点"
                  value={selectedStation}
                  onChange={setSelectedStation}
                >
                  {mockStations.map(station => (
                    <Option key={station.id} value={station.id}>{station.name}</Option>
                  ))}
                </Select>
              </Col>

              {/* 主要统计卡片 */}
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="当前AQI"
                    value={selectedData?.aqi || 0}
                    valueStyle={{ color: selectedData ? getAqiColor(selectedData.aqi) : '#000' }}
                    suffix={selectedData ? getAqiDescription(selectedData.aqi) : ''}
                    prefix={selectedData && selectedData.aqi > 100 ? <WarningOutlined /> : <CheckCircleOutlined />}
                  />
                  <Progress 
                    percent={Math.min(selectedData?.aqi || 0, 500) / 5} 
                    showInfo={false} 
                    strokeColor={selectedData ? getAqiColor(selectedData.aqi) : '#ccc'} 
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="主要污染物"
                    value={selectedData?.dominantPollutant || 'N/A'}
                    valueStyle={{ color: '#cf1322' }}
                  />
                  <div style={{ marginTop: 10 }}>
                    浓度: {selectedData?.pollutants[selectedData?.dominantPollutant as keyof typeof selectedData.pollutants] || 0}
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="平均AQI"
                    value={averageAQI}
                    valueStyle={{ color: getAqiColor(averageAQI) }}
                    suffix={getAqiDescription(averageAQI)}
                  />
                  <div style={{ marginTop: 10 }}>
                    全部站点平均值
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="气象状况"
                    value={`${selectedData?.weather.temperature || 0}°C`}
                    prefix={<CloudOutlined />}
                  />
                  <div style={{ marginTop: 10 }}>
                    湿度: {selectedData?.weather.humidity || 0}% | 
                    风速: {selectedData?.weather.windSpeed.toFixed(1) || 0} m/s
                  </div>
                </Card>
              </Col>
            </Row>

            <Divider />

            {/* 图表行 */}
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="24小时AQI趋势">
                  <Spin spinning={loading}>
                    <ReactECharts option={getTrendChartOption()} style={{ height: 350 }} />
                  </Spin>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card title="污染物雷达图">
                  <Spin spinning={loading}>
                    <ReactECharts option={getRadarChartOption()} style={{ height: 350 }} />
                  </Spin>
                </Card>
              </Col>
            </Row>

            <Divider />

            {/* 详细数据行 */}
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="污染物占比">
                  <Spin spinning={loading}>
                    <ReactECharts option={getDoughnutChartOption()} style={{ height: 300 }} />
                  </Spin>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card title="站点详细数据">
                  <Spin spinning={loading}>
                    {selectedData && (
                      <div>
                        <p><strong>站点名称:</strong> {mockStations.find(s => s.id === selectedData.stationId)?.name}</p>
                        <p><strong>更新时间:</strong> {new Date(selectedData.timestamp).toLocaleString()}</p>
                        <p><strong>AQI类别:</strong> {selectedData.category}</p>
                        <p><strong>温度:</strong> {selectedData.weather.temperature}°C</p>
                        <p><strong>湿度:</strong> {selectedData.weather.humidity}%</p>
                        <p><strong>风向:</strong> {selectedData.weather.windDirection}° <CompassOutlined /></p>
                        <p><strong>气压:</strong> {selectedData.weather.pressure} hPa</p>
                        <p><strong>降水量:</strong> {selectedData.weather.precipitation.toFixed(1)} mm</p>
                      </div>
                    )}
                  </Spin>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Spin>
    </div>
  );
};

export default Dashboard; 