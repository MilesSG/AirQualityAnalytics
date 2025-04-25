import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, Spin, Row, Col, DatePicker, Select, Button, 
  Tabs, Table, Space, Tooltip, Typography, Radio, Divider
} from 'antd';
import {
  DownloadOutlined,
  FilterOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getHistoricalData } from '../../api/airQualityService';
import { AirQualityData } from '../../types';
import { mockStations } from '../../mock/airQualityData';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

// 生成30天的模拟数据
function generateMonthData(stationId: string): AirQualityData[] {
  const data: AirQualityData[] = [];
  const now = new Date();
  
  // 生成30天的数据，每天一个点
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(12, 0, 0, 0); // 中午12点
    
    // 生成随机AQI (50-200)
    const aqi = Math.floor(Math.random() * 150) + 50;
    
    // 根据AQI确定类别
    let category: AirQualityData['category'] = 'Good';
    if (aqi > 300) category = 'Hazardous';
    else if (aqi > 200) category = 'Very Unhealthy';
    else if (aqi > 150) category = 'Unhealthy';
    else if (aqi > 100) category = 'Unhealthy for Sensitive Groups';
    else if (aqi > 50) category = 'Moderate';
    
    // 生成随机污染物数据
    const pm25 = Math.floor(Math.random() * 100) + 10;
    const pm10 = pm25 + Math.floor(Math.random() * 50);
    const o3 = Math.floor(Math.random() * 80) + 20;
    const no2 = Math.floor(Math.random() * 50) + 10;
    const so2 = Math.floor(Math.random() * 30) + 5;
    const co = (Math.random() * 5) + 0.5;
    
    // 确定主要污染物
    const pollutants = { pm25, pm10, o3, no2, so2, co };
    const pollutantValues = [
      { name: 'pm25', value: pm25 / 35 },
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
      temperature: Math.floor(Math.random() * 30) - 5,
      humidity: Math.floor(Math.random() * 100),
      windSpeed: Math.random() * 15,
      windDirection: Math.floor(Math.random() * 360),
      pressure: Math.floor(Math.random() * 50) + 970,
      precipitation: Math.random() * 20
    };
    
    data.push({
      id: `data-${date.getTime()}`,
      stationId,
      timestamp: date.toISOString(),
      aqi,
      category,
      dominantPollutant,
      pollutants,
      weather
    });
  }
  
  return data;
}

// 表格列定义
const tableColumns: ColumnsType<AirQualityData> = [
  {
    title: '日期',
    dataIndex: 'timestamp',
    key: 'timestamp',
    render: (text: string) => new Date(text).toLocaleString(),
    sorter: (a: AirQualityData, b: AirQualityData) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  },
  {
    title: 'AQI',
    dataIndex: 'aqi',
    key: 'aqi',
    sorter: (a: AirQualityData, b: AirQualityData) => a.aqi - b.aqi,
  },
  {
    title: '类别',
    dataIndex: 'category',
    key: 'category',
    filters: [
      { text: '优', value: 'Good' },
      { text: '良', value: 'Moderate' },
      { text: '轻度污染', value: 'Unhealthy for Sensitive Groups' },
      { text: '中度污染', value: 'Unhealthy' },
      { text: '重度污染', value: 'Very Unhealthy' },
      { text: '严重污染', value: 'Hazardous' },
    ],
    onFilter: (value: any, record: AirQualityData) => record.category === value,
  },
  {
    title: '主要污染物',
    dataIndex: 'dominantPollutant',
    key: 'dominantPollutant',
    filters: [
      { text: 'PM2.5', value: 'pm25' },
      { text: 'PM10', value: 'pm10' },
      { text: 'O3', value: 'o3' },
      { text: 'NO2', value: 'no2' },
      { text: 'SO2', value: 'so2' },
      { text: 'CO', value: 'co' },
    ],
    onFilter: (value: any, record: AirQualityData) => record.dominantPollutant === value,
  },
  {
    title: 'PM2.5',
    dataIndex: ['pollutants', 'pm25'],
    key: 'pm25',
    sorter: (a: AirQualityData, b: AirQualityData) => a.pollutants.pm25 - b.pollutants.pm25,
  },
  {
    title: 'PM10',
    dataIndex: ['pollutants', 'pm10'],
    key: 'pm10',
    sorter: (a: AirQualityData, b: AirQualityData) => a.pollutants.pm10 - b.pollutants.pm10,
  },
  {
    title: 'O3',
    dataIndex: ['pollutants', 'o3'],
    key: 'o3',
    sorter: (a: AirQualityData, b: AirQualityData) => a.pollutants.o3 - b.pollutants.o3,
  },
  {
    title: '温度',
    dataIndex: ['weather', 'temperature'],
    key: 'temperature',
    render: (text: number) => `${text}°C`,
    sorter: (a: AirQualityData, b: AirQualityData) => a.weather.temperature - b.weather.temperature,
  },
  {
    title: '湿度',
    dataIndex: ['weather', 'humidity'],
    key: 'humidity',
    render: (text: number) => `${text}%`,
    sorter: (a: AirQualityData, b: AirQualityData) => a.weather.humidity - b.weather.humidity,
  }
];

const HistoricalAnalysis: React.FC = () => {
  // 设置状态
  const [loading, setLoading] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [selectedStation, setSelectedStation] = useState<string>(mockStations[0].id);
  const [selectedPollutant, setSelectedPollutant] = useState<string>('aqi');
  const [chartType, setChartType] = useState<string>('line');
  const [airQualityData, setAirQualityData] = useState<AirQualityData[]>([]);
  const [activeTab, setActiveTab] = useState<string>('chart');

  // 加载数据
  useEffect(() => {
    fetchHistoricalData();
  }, []);
  
  // 获取历史数据
  const fetchHistoricalData = async () => {
    if (!dateRange[0] || !dateRange[1]) return;
    
    setLoading(true);
    try {
      // 转换日期为字符串格式
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      const response = await getHistoricalData(selectedStation, startDate, endDate);
      
      if (response && response.data) {
        setAirQualityData(response.data);
      }
    } catch (error) {
      console.error('获取历史数据失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理日期变更
  const handleDateChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setDateRange([dates[0], dates[1]]);
    }
  };
  
  // 处理站点变更
  const handleStationChange = (value: string) => {
    setSelectedStation(value);
  };
  
  // 处理污染物变更
  const handlePollutantChange = (value: string) => {
    setSelectedPollutant(value);
  };
  
  // 处理图表类型变更
  const handleChartTypeChange = (e: any) => {
    setChartType(e.target.value);
  };
  
  // 处理数据过滤和应用
  const handleApplyFilter = () => {
    fetchHistoricalData();
  };
  
  // 格式化图表数据
  const chartData = useMemo(() => {
    if (!airQualityData || airQualityData.length === 0) {
      return { dates: [], values: [] };
    }
    
    const sortedData = [...airQualityData].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const dates = sortedData.map(item => 
      new Date(item.timestamp).toLocaleDateString()
    );
    
    let values: number[] = [];
    
    if (selectedPollutant === 'aqi') {
      values = sortedData.map(item => item.aqi);
    } else if (selectedPollutant.startsWith('pm')) {
      values = sortedData.map(item => item.pollutants[selectedPollutant as keyof typeof item.pollutants] as number);
    } else if (Object.keys(sortedData[0].pollutants).includes(selectedPollutant)) {
      values = sortedData.map(item => item.pollutants[selectedPollutant as keyof typeof item.pollutants] as number);
    } else if (selectedPollutant === 'temperature') {
      values = sortedData.map(item => item.weather.temperature);
    } else if (selectedPollutant === 'humidity') {
      values = sortedData.map(item => item.weather.humidity);
    }
    
    return { dates, values };
  }, [airQualityData, selectedPollutant]);
  
  // 图表配置
  const getChartOption = () => {
    const { dates, values } = chartData;
    
    if (dates.length === 0 || values.length === 0) {
      return {
        title: {
          text: '暂无数据',
          left: 'center',
          top: 'center'
        }
      };
    }
    
    const baseOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const dataIndex = params[0].dataIndex;
          return `日期: ${dates[dataIndex]}<br/>
                  ${getPollutantLabel(selectedPollutant)}: ${values[dataIndex]}${getPollutantUnit(selectedPollutant)}`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      toolbox: {
        feature: {
          saveAsImage: {}
        }
      },
      xAxis: {
        type: 'category',
        boundaryGap: chartType !== 'line',
        data: dates
      },
      yAxis: {
        type: 'value',
        name: getPollutantLabel(selectedPollutant) + getPollutantUnit(selectedPollutant),
        nameLocation: 'end'
      }
    };
    
    // 根据图表类型设置不同的系列配置
    let series: any[] = [];
    
    if (chartType === 'line') {
      series = [{
        name: getPollutantLabel(selectedPollutant),
        type: 'line',
        data: values,
        smooth: true,
        markPoint: {
          data: [
            { type: 'max', name: '最大值' },
            { type: 'min', name: '最小值' }
          ]
        },
        markLine: {
          data: [
            { type: 'average', name: '平均值' }
          ]
        }
      }];
    } else if (chartType === 'bar') {
      series = [{
        name: getPollutantLabel(selectedPollutant),
        type: 'bar',
        data: values,
        markPoint: {
          data: [
            { type: 'max', name: '最大值' },
            { type: 'min', name: '最小值' }
          ]
        },
        markLine: {
          data: [
            { type: 'average', name: '平均值' }
          ]
        }
      }];
    } else if (chartType === 'area') {
      series = [{
        name: getPollutantLabel(selectedPollutant),
        type: 'line',
        data: values,
        areaStyle: {},
        smooth: true
      }];
    }
    
    return {
      ...baseOption,
      series
    };
  };
  
  // 获取污染物标签
  const getPollutantLabel = (pollutant: string): string => {
    const pollutantMap: Record<string, string> = {
      'aqi': 'AQI',
      'pm25': 'PM2.5',
      'pm10': 'PM10',
      'o3': 'O3',
      'no2': 'NO2',
      'so2': 'SO2',
      'co': 'CO',
      'temperature': '温度',
      'humidity': '湿度'
    };
    return pollutantMap[pollutant] || pollutant;
  };
  
  // 获取污染物单位
  const getPollutantUnit = (pollutant: string): string => {
    if (pollutant === 'temperature') {
      return ' (°C)';
    } else if (pollutant === 'humidity') {
      return ' (%)';
    } else if (pollutant !== 'aqi') {
      return ' (μg/m³)';
    }
    return '';
  };
  
  // 导出数据
  const handleExportData = () => {
    if (airQualityData.length === 0) return;
    
    const headers = ['日期', 'AQI', '类别', '主要污染物', 'PM2.5', 'PM10', 'O3', 'NO2', 'SO2', 'CO', '温度', '湿度'];
    
    const csvContent = [
      headers.join(','),
      ...airQualityData.map(item => [
        new Date(item.timestamp).toLocaleString(),
        item.aqi,
        item.category,
        item.dominantPollutant,
        item.pollutants.pm25,
        item.pollutants.pm10,
        item.pollutants.o3,
        item.pollutants.no2,
        item.pollutants.so2,
        item.pollutants.co,
        item.weather.temperature,
        item.weather.humidity
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `空气质量历史数据_${dateRange[0].format('YYYYMMDD')}_${dateRange[1].format('YYYYMMDD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="historical-analysis">
      <Card
        title="历史数据分析"
        className="mb-4"
        extra={
          <Tooltip title="导出数据">
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              onClick={handleExportData}
              disabled={airQualityData.length === 0}
            >
              导出数据
            </Button>
          </Tooltip>
        }
      >
        <Spin spinning={loading}>
          <div className="filter-section mb-4">
            <Row gutter={16} align="middle">
              <Col xs={24} sm={24} md={8} lg={7}>
                <div className="mb-2 font-medium">选择时间范围:</div>
                <RangePicker 
                  style={{ width: '100%' }} 
                  value={dateRange}
                  onChange={handleDateChange}
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                />
              </Col>
              
              <Col xs={24} sm={12} md={6} lg={5}>
                <div className="mb-2 font-medium">选择监测站:</div>
                <Select
                  style={{ width: '100%' }}
                  value={selectedStation}
                  onChange={handleStationChange}
                >
                  {mockStations.map(station => (
                    <Select.Option key={station.id} value={station.id}>
                      {station.name}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              
              <Col xs={24} sm={12} md={6} lg={5}>
                <div className="mb-2 font-medium">选择数据类型:</div>
                <Select
                  style={{ width: '100%' }}
                  value={selectedPollutant}
                  onChange={handlePollutantChange}
                >
                  <Select.Option value="aqi">AQI</Select.Option>
                  <Select.Option value="pm25">PM2.5</Select.Option>
                  <Select.Option value="pm10">PM10</Select.Option>
                  <Select.Option value="o3">O3</Select.Option>
                  <Select.Option value="no2">NO2</Select.Option>
                  <Select.Option value="so2">SO2</Select.Option>
                  <Select.Option value="co">CO</Select.Option>
                  <Select.Option value="temperature">温度</Select.Option>
                  <Select.Option value="humidity">湿度</Select.Option>
                </Select>
              </Col>
              
              <Col xs={24} sm={24} md={4} lg={3} className="flex items-end">
                <Button
                  type="primary"
                  icon={<FilterOutlined />}
                  onClick={handleApplyFilter}
                  style={{ marginTop: '23px', width: '100%' }}
                >
                  应用筛选
                </Button>
              </Col>
              
              <Col xs={24} sm={24} md={24} lg={4} className="flex items-end">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchHistoricalData}
                  style={{ marginTop: '23px', width: '100%' }}
                >
                  重新加载
                </Button>
              </Col>
            </Row>
          </div>
          
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            items={[
              {
                key: 'chart',
                label: '图表视图',
                children: (
                  <div>
                    <div className="mb-4">
                      <div className="mb-2 font-medium">图表类型:</div>
                      <Radio.Group value={chartType} onChange={handleChartTypeChange}>
                        <Radio.Button value="line">
                          <LineChartOutlined /> 折线图
                        </Radio.Button>
                        <Radio.Button value="bar">
                          <BarChartOutlined /> 柱状图
                        </Radio.Button>
                        <Radio.Button value="area">
                          <PieChartOutlined /> 面积图
                        </Radio.Button>
                      </Radio.Group>
                    </div>
                    
                    <div className="chart-container" style={{ height: '400px' }}>
                      <ReactECharts
                        option={getChartOption()}
                        style={{ height: '100%', width: '100%' }}
                        notMerge={true}
                        lazyUpdate={true}
                      />
                    </div>
                    
                    <div className="mt-4">
                      <Divider>
                        <Space>
                          <Typography.Text type="secondary">
                            <InfoCircleOutlined /> 图表显示的是 {getPollutantLabel(selectedPollutant)} 在所选时间段内的趋势
                          </Typography.Text>
                        </Space>
                      </Divider>
                    </div>
                  </div>
                )
              },
              {
                key: 'table',
                label: '表格视图',
                children: (
                  <div>
                    <Table
                      columns={tableColumns}
                      dataSource={airQualityData.map(item => ({ ...item, key: item.timestamp }))}
                      scroll={{ x: 1200 }}
                      pagination={{ pageSize: 10, showSizeChanger: true }}
                    />
                  </div>
                )
              }
            ]}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default HistoricalAnalysis;