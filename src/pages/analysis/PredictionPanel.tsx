import React, { useState } from 'react';
import { Card, Row, Col, Typography, Statistic, Tabs, Tag, Descriptions, Button, Alert, Table, Space, Divider } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined, CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { Forecast } from '../../types';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

interface PredictionPanelProps {
  data: Forecast;
}

// 辅助函数：获取AQI分类对应的颜色
function getAqiColor(category: string): string {
  switch (category) {
    case 'Good': return '#00e400';
    case 'Moderate': return '#ffff00';
    case 'Unhealthy for Sensitive Groups': return '#ff7e00';
    case 'Unhealthy': return '#ff0000';
    case 'Very Unhealthy': return '#99004c';
    case 'Hazardous': return '#7e0023';
    default: return '#cccccc';
  }
}

// 辅助函数：获取AQI分类的中文名称
function getAqiCategoryName(category: string): string {
  switch (category) {
    case 'Good': return '优';
    case 'Moderate': return '良';
    case 'Unhealthy for Sensitive Groups': return '轻度污染';
    case 'Unhealthy': return '中度污染';
    case 'Very Unhealthy': return '重度污染';
    case 'Hazardous': return '严重污染';
    default: return '未知';
  }
}

const PredictionPanel: React.FC<PredictionPanelProps> = ({ data }) => {
  const [predictionView, setPredictionView] = useState<'aqi' | 'pollutants'>('aqi');
  
  // 获取预测数据的小时级别粒度
  const hourlyData = [...data.predictions];
  
  // 日均数据
  const dailyData = [];
  for (let i = 0; i < hourlyData.length; i += 24) {
    const daySlice = hourlyData.slice(i, i + 24);
    if (daySlice.length === 0) continue;
    
    // 计算日均值
    const avgAqi = Math.round(daySlice.reduce((sum, p) => sum + p.aqi, 0) / daySlice.length);
    const avgPm25 = Math.round(daySlice.reduce((sum, p) => sum + p.pollutants.pm25, 0) / daySlice.length);
    const avgPm10 = Math.round(daySlice.reduce((sum, p) => sum + p.pollutants.pm10, 0) / daySlice.length);
    const avgO3 = Math.round(daySlice.reduce((sum, p) => sum + p.pollutants.o3, 0) / daySlice.length);
    const avgNo2 = Math.round(daySlice.reduce((sum, p) => sum + p.pollutants.no2, 0) / daySlice.length);
    const avgSo2 = Math.round(daySlice.reduce((sum, p) => sum + p.pollutants.so2, 0) / daySlice.length);
    const avgCo = Math.round(daySlice.reduce((sum, p) => sum + p.pollutants.co, 0) * 10 / daySlice.length) / 10;
    
    // 获取主要污染物（出现次数最多的）
    const dominantPollutants = daySlice.map(p => p.dominantPollutant);
    const pollutantCounts = dominantPollutants.reduce((counts: Record<string, number>, pollutant) => {
      counts[pollutant] = (counts[pollutant] || 0) + 1;
      return counts;
    }, {});
    
    let maxCount = 0;
    let dominantPollutant = '';
    Object.entries(pollutantCounts).forEach(([pollutant, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantPollutant = pollutant;
      }
    });
    
    // 确定AQI类别
    let category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' = 'Good';
    if (avgAqi > 300) category = 'Hazardous';
    else if (avgAqi > 200) category = 'Very Unhealthy';
    else if (avgAqi > 150) category = 'Unhealthy';
    else if (avgAqi > 100) category = 'Unhealthy for Sensitive Groups';
    else if (avgAqi > 50) category = 'Moderate';
    
    const date = new Date(daySlice[0].timestamp);
    const formattedDate = date.toLocaleDateString();
    
    dailyData.push({
      date: formattedDate,
      timestamp: date.toISOString(),
      aqi: avgAqi,
      category,
      dominantPollutant,
      pollutants: {
        pm25: avgPm25,
        pm10: avgPm10,
        o3: avgO3,
        no2: avgNo2,
        so2: avgSo2,
        co: avgCo
      },
      confidence: daySlice.reduce((sum, p) => sum + p.confidence, 0) / daySlice.length
    });
  }
  
  // 准备AQI预测折线图
  const getAqiChartOption = () => {
    const timestamps = hourlyData.map(p => {
      const date = new Date(p.timestamp);
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
    });
    
    const aqiValues = hourlyData.map(p => p.aqi);
    const confidenceValues = hourlyData.map(p => p.confidence * 100);
    
    // 计算日均值的时间戳
    const dailyTimestamps = dailyData.map(d => {
      const date = new Date(d.timestamp);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    const dailyAqiValues = dailyData.map(d => d.aqi);
    
    // 根据AQI类别设置不同区域的颜色
    const visualMap = {
      show: false,
      dimension: 1,
      pieces: [
        { gte: 0, lt: 50, color: '#00e400' },
        { gte: 50, lt: 100, color: '#ffff00' },
        { gte: 100, lt: 150, color: '#ff7e00' },
        { gte: 150, lt: 200, color: '#ff0000' },
        { gte: 200, lt: 300, color: '#99004c' },
        { gte: 300, color: '#7e0023' }
      ]
    };
    
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const time = params[0].axisValue;
          const aqi = params[0].value;
          const confidence = params[1]?.value.toFixed(0) || 'N/A';
          
          let category = 'Good';
          if (aqi > 300) category = 'Hazardous';
          else if (aqi > 200) category = 'Very Unhealthy';
          else if (aqi > 150) category = 'Unhealthy';
          else if (aqi > 100) category = 'Unhealthy for Sensitive Groups';
          else if (aqi > 50) category = 'Moderate';
          
          return `
            <div>${time}</div>
            <div>AQI: ${aqi}</div>
            <div>级别: ${getAqiCategoryName(category)}</div>
            <div>预测置信度: ${confidence}%</div>
          `;
        }
      },
      legend: {
        data: ['小时AQI', '预测置信度', '日均AQI']
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
        data: timestamps,
        axisLabel: {
          formatter: (value: string) => {
            // 只在整点整小时显示标签
            const parts = value.split(' ');
            if (parts.length > 1 && parts[1] === '0:00') {
              return parts[0];
            }
            return '';
          },
          interval: 6
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'AQI',
          min: 0,
          max: 'dataMax'
        },
        {
          type: 'value',
          name: '置信度(%)',
          min: 0,
          max: 100
        }
      ],
      visualMap,
      series: [
        {
          name: '小时AQI',
          type: 'line',
          data: aqiValues,
          smooth: true,
          markArea: {
            itemStyle: {
              opacity: 0.2
            },
            data: [
              [
                { name: '优', yAxis: 0 },
                { yAxis: 50 }
              ],
              [
                { name: '良', yAxis: 50 },
                { yAxis: 100 }
              ],
              [
                { name: '轻度污染', yAxis: 100 },
                { yAxis: 150 }
              ],
              [
                { name: '中度污染', yAxis: 150 },
                { yAxis: 200 }
              ],
              [
                { name: '重度污染', yAxis: 200 },
                { yAxis: 300 }
              ],
              [
                { name: '严重污染', yAxis: 300 },
                { yAxis: 500 }
              ]
            ]
          }
        },
        {
          name: '预测置信度',
          type: 'line',
          yAxisIndex: 1,
          data: confidenceValues,
          smooth: true,
          lineStyle: {
            type: 'dashed',
            opacity: 0.7
          }
        },
        {
          name: '日均AQI',
          type: 'line',
          smooth: true,
          symbol: 'emptyCircle',
          symbolSize: 10,
          markPoint: {
            data: dailyData.map((day, index) => ({
              coord: [index * 24, day.aqi], // 将日均值点放在每天的0点
              value: day.aqi
            }))
          },
          data: dailyAqiValues.map((value, index) => ({
            value,
            name: dailyTimestamps[index]
          })),
          lineStyle: {
            width: 3
          }
        }
      ]
    };
  };
  
  // 准备污染物浓度预测折线图
  const getPollutantsChartOption = () => {
    const timestamps = hourlyData.map(p => {
      const date = new Date(p.timestamp);
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
    });
    
    const pm25Values = hourlyData.map(p => p.pollutants.pm25);
    const pm10Values = hourlyData.map(p => p.pollutants.pm10);
    const o3Values = hourlyData.map(p => p.pollutants.o3);
    const no2Values = hourlyData.map(p => p.pollutants.no2);
    
    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['PM2.5', 'PM10', 'O3', 'NO2']
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
        data: timestamps,
        axisLabel: {
          formatter: (value: string) => {
            // 只在整点整小时显示标签
            const parts = value.split(' ');
            if (parts.length > 1 && parts[1] === '0:00') {
              return parts[0];
            }
            return '';
          },
          interval: 6
        }
      },
      yAxis: {
        type: 'value',
        name: '浓度',
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: [
        {
          name: 'PM2.5',
          type: 'line',
          data: pm25Values,
          smooth: true
        },
        {
          name: 'PM10',
          type: 'line',
          data: pm10Values,
          smooth: true
        },
        {
          name: 'O3',
          type: 'line',
          data: o3Values,
          smooth: true
        },
        {
          name: 'NO2',
          type: 'line',
          data: no2Values,
          smooth: true
        }
      ]
    };
  };
  
  // 日均预测数据表格列定义
  const dailyColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: 'AQI',
      dataIndex: 'aqi',
      key: 'aqi',
      render: (aqi: number, record: any) => (
        <Space>
          {aqi}
          <Tag color={getAqiColor(record.category)}>
            {getAqiCategoryName(record.category)}
          </Tag>
        </Space>
      )
    },
    {
      title: '主要污染物',
      dataIndex: 'dominantPollutant',
      key: 'dominantPollutant',
      render: (pollutant: string) => {
        const pollutantMap: Record<string, string> = {
          'pm25': 'PM2.5',
          'pm10': 'PM10',
          'o3': 'O3',
          'no2': 'NO2',
          'so2': 'SO2',
          'co': 'CO'
        };
        return pollutantMap[pollutant] || pollutant;
      }
    },
    {
      title: 'PM2.5',
      dataIndex: ['pollutants', 'pm25'],
      key: 'pm25',
      render: (pm25: number) => `${pm25} μg/m³`
    },
    {
      title: 'PM10',
      dataIndex: ['pollutants', 'pm10'],
      key: 'pm10',
      render: (pm10: number) => `${pm10} μg/m³`
    },
    {
      title: 'O3',
      dataIndex: ['pollutants', 'o3'],
      key: 'o3',
      render: (o3: number) => `${o3} ppb`
    },
    {
      title: '预测置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence: number) => `${(confidence * 100).toFixed(0)}%`
    }
  ];
  
  // 获取今日与明日AQI对比
  const getTodayTomorrowComparison = () => {
    if (dailyData.length < 2) return null;
    
    const today = dailyData[0];
    const tomorrow = dailyData[1];
    
    const aqiChange = tomorrow.aqi - today.aqi;
    const aqiChangePercent = Math.round((aqiChange / today.aqi) * 100);
    
    return (
      <Row gutter={16}>
        <Col span={12}>
          <Card>
            <Statistic
              title="今日AQI预测"
              value={today.aqi}
              valueStyle={{ color: getAqiColor(today.category) }}
              suffix={
                <Tag color={getAqiColor(today.category)}>
                  {getAqiCategoryName(today.category)}
                </Tag>
              }
            />
            <div style={{ marginTop: 10 }}>
              主要污染物: {today.dominantPollutant === 'pm25' ? 'PM2.5' : 
                         today.dominantPollutant === 'pm10' ? 'PM10' : 
                         today.dominantPollutant.toUpperCase()}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="明日AQI预测"
              value={tomorrow.aqi}
              valueStyle={{ color: getAqiColor(tomorrow.category) }}
              suffix={
                <Tag color={getAqiColor(tomorrow.category)}>
                  {getAqiCategoryName(tomorrow.category)}
                </Tag>
              }
              prefix={aqiChange > 0 ? <CaretUpOutlined /> : aqiChange < 0 ? <CaretDownOutlined /> : null}
            />
            <div style={{ marginTop: 10 }}>
              <span style={{ marginRight: 10 }}>
                {aqiChange > 0 ? 
                  <Tag color="red">上升 {aqiChange} ({aqiChangePercent}%)</Tag> : 
                 aqiChange < 0 ? 
                  <Tag color="green">下降 {Math.abs(aqiChange)} ({Math.abs(aqiChangePercent)}%)</Tag> : 
                  <Tag color="blue">持平</Tag>}
              </span>
              主要污染物: {tomorrow.dominantPollutant === 'pm25' ? 'PM2.5' : 
                          tomorrow.dominantPollutant === 'pm10' ? 'PM10' : 
                          tomorrow.dominantPollutant.toUpperCase()}
            </div>
          </Card>
        </Col>
      </Row>
    );
  };
  
  // 获取预测高峰和低谷时段
  const getPeakAndLowPeriods = () => {
    if (hourlyData.length === 0) return null;
    
    // 找出今日的最高AQI和最低AQI时段
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const todayData = hourlyData.filter(p => {
      const timestamp = new Date(p.timestamp);
      return timestamp >= todayStart && timestamp <= todayEnd;
    });
    
    if (todayData.length === 0) return null;
    
    let peakAqi = 0;
    let peakTime = '';
    let lowAqi = Infinity;
    let lowTime = '';
    
    todayData.forEach(p => {
      if (p.aqi > peakAqi) {
        peakAqi = p.aqi;
        peakTime = new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      if (p.aqi < lowAqi) {
        lowAqi = p.aqi;
        lowTime = new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    });
    
    return (
      <Row gutter={16}>
        <Col span={12}>
          <Card>
            <Statistic
              title="今日预测污染高峰"
              value={peakAqi}
              valueStyle={{ color: '#cf1322' }}
              suffix="AQI"
              prefix={<ArrowUpOutlined />}
            />
            <div style={{ marginTop: 10 }}>
              预计时间: {peakTime}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="今日预测空气最佳"
              value={lowAqi}
              valueStyle={{ color: '#3f8600' }}
              suffix="AQI"
              prefix={<ArrowDownOutlined />}
            />
            <div style={{ marginTop: 10 }}>
              预计时间: {lowTime}
            </div>
          </Card>
        </Col>
      </Row>
    );
  };
  
  // 获取预测准确性信息
  const getPredictionAccuracyInfo = () => {
    return (
      <Card>
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="预测方法">{data.forecastMethod}</Descriptions.Item>
          <Descriptions.Item label="整体准确率">{(data.accuracy.historical * 100).toFixed(1)}%</Descriptions.Item>
          <Descriptions.Item label="近期准确率">{(data.accuracy.recent * 100).toFixed(1)}%</Descriptions.Item>
          <Descriptions.Item label="生成时间">{new Date(data.generatedAt).toLocaleString()}</Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };
  
  // 获取健康建议
  const getHealthRecommendations = () => {
    // 基于明日的预测提供建议
    if (dailyData.length < 2) return null;
    
    const tomorrow = dailyData[1];
    
    let recommendations = [];
    let alertType: 'success' | 'info' | 'warning' | 'error' = 'info';
    
    if (tomorrow.aqi <= 50) {
      alertType = 'success';
      recommendations = [
        '空气质量优良，适合所有人群进行户外活动',
        '敏感人群可以正常进行户外活动',
        '无需特别防护措施'
      ];
    } else if (tomorrow.aqi <= 100) {
      alertType = 'info';
      recommendations = [
        '空气质量可接受，但某些污染物可能对极少数敏感人群健康有弱影响',
        '极少数对空气污染特别敏感的人应减少户外活动',
        '其他人群可以正常活动'
      ];
    } else if (tomorrow.aqi <= 150) {
      alertType = 'warning';
      recommendations = [
        '空气质量轻度污染，敏感人群可能会有症状',
        '儿童、老人及呼吸系统、心脏病患者应减少长时间、高强度的户外锻炼',
        '一般人群适当减少户外活动',
        '敏感人群外出时应携带必要的药物'
      ];
    } else if (tomorrow.aqi <= 200) {
      alertType = 'error';
      recommendations = [
        '空气质量中度污染，对所有人群健康都会有影响',
        '敏感人群应避免户外活动，一般人群减少户外活动',
        '外出请佩戴口罩',
        '室内使用空气净化器',
        '减少开窗通风'
      ];
    } else if (tomorrow.aqi <= 300) {
      alertType = 'error';
      recommendations = [
        '空气质量重度污染，健康影响显著增加',
        '所有人群应避免户外活动',
        '建议关闭门窗，开启空气净化器',
        '外出必须佩戴N95口罩',
        '驾车时开启车内空气循环和空调过滤'
      ];
    } else {
      alertType = 'error';
      recommendations = [
        '空气质量严重污染，健康风险严重',
        '严格避免户外活动',
        '关闭门窗，使用空气净化器',
        '如必须外出，请佩戴高效防护口罩',
        '注意室内通风时间不宜过长',
        '有呼吸系统疾病的人群应保持必要的药物治疗'
      ];
    }
    
    return (
      <Alert
        message={`明日空气质量预测：${getAqiCategoryName(tomorrow.category)}（AQI ${tomorrow.aqi}）`}
        description={
          <div>
            <p>基于预测结果，建议采取以下措施：</p>
            <ul>
              {recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        }
        type={alertType}
        showIcon
      />
    );
  };
  
  return (
    <div className="prediction-panel">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Title level={4}>空气质量高级预测分析</Title>
            <Paragraph>
              基于深度学习模型的空气质量预测，融合气象数据、历史趋势和人类活动模式，提供未来7天的精准预测。
            </Paragraph>
            {getPredictionAccuracyInfo()}
          </Card>
        </Col>
        
        <Col span={24}>
          {getTodayTomorrowComparison()}
        </Col>
        
        <Col span={24}>
          {getPeakAndLowPeriods()}
        </Col>
        
        <Col span={24}>
          <Card>
            <Title level={4}>预测趋势图</Title>
            <Radio.Group
              value={predictionView}
              onChange={e => setPredictionView(e.target.value)}
              buttonStyle="solid"
              style={{ marginBottom: 16 }}
            >
              <Radio.Button value="aqi">AQI预测</Radio.Button>
              <Radio.Button value="pollutants">污染物浓度预测</Radio.Button>
            </Radio.Group>
            
            {predictionView === 'aqi' ? (
              <ReactECharts 
                option={getAqiChartOption()}
                style={{ height: '400px' }}
              />
            ) : (
              <ReactECharts 
                option={getPollutantsChartOption()}
                style={{ height: '400px' }}
              />
            )}
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="日均预测数据">
            <Table 
              dataSource={dailyData.map((d, i) => ({ ...d, key: i }))} 
              columns={dailyColumns}
              pagination={false}
              bordered
            />
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="健康建议">
            {getHealthRecommendations()}
            <Divider />
            <Paragraph>
              <Text type="secondary">
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                预测基于历史数据和多变量模型，准确率为 {(data.accuracy.recent * 100).toFixed(1)}%。
                实际空气质量可能会因天气变化、突发事件等因素而有所差异。
              </Text>
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PredictionPanel; 