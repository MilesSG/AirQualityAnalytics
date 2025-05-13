import React from 'react';
import { Spin, Empty, Row, Col, Tag } from 'antd';
import { FundProjectionScreenOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { Forecast } from '../../types';

interface PredictionForecastPanelProps {
  data: Forecast | null;
  loading: boolean;
}

const PredictionForecastPanel: React.FC<PredictionForecastPanelProps> = ({ 
  data, 
  loading 
}) => {
  // 辅助函数：获取AQI分类对应的颜色
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Good': return '#00e400';
      case 'Moderate': return '#ffff00';
      case 'Unhealthy for Sensitive Groups': return '#ff7e00';
      case 'Unhealthy': return '#ff0000';
      case 'Very Unhealthy': return '#99004c';
      case 'Hazardous': return '#7e0023';
      default: return '#cccccc';
    }
  };

  // 辅助函数：获取AQI分类的中文名称
  const getCategoryName = (category: string): string => {
    switch (category) {
      case 'Good': return '优';
      case 'Moderate': return '良';
      case 'Unhealthy for Sensitive Groups': return '轻度污染';
      case 'Unhealthy': return '中度污染';
      case 'Very Unhealthy': return '重度污染';
      case 'Hazardous': return '严重污染';
      default: return '未知';
    }
  };
  
  // 获取预测趋势图
  const getPredictionChartOption = () => {
    if (!data || !data.predictions || data.predictions.length === 0) {
      return {};
    }
    
    // 取未来24小时的数据
    const predictions = data.predictions.slice(0, 24);
    
    // 准备时间数据
    const timeData = predictions.map(p => {
      const date = new Date(p.timestamp);
      return `${date.getHours()}:00`;
    });
    
    // 准备AQI数据
    const aqiData = predictions.map(p => p.aqi);
    
    // 准备信心度数据
    const confidenceData = predictions.map(p => p.confidence * 100);
    
    // 准备污染物数据
    const pm25Data = predictions.map(p => p.pollutants.pm25);
    const pm10Data = predictions.map(p => p.pollutants.pm10);
    const o3Data = predictions.map(p => p.pollutants.o3);
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: ['AQI', 'PM2.5', 'PM10', 'O₃', '置信度'],
        textStyle: {
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
          color: '#fff'
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '指数/浓度',
          position: 'left',
          axisLabel: {
            color: '#fff'
          },
          nameTextStyle: {
            color: '#fff'
          }
        },
        {
          type: 'value',
          name: '置信度(%)',
          min: 0,
          max: 100,
          position: 'right',
          axisLabel: {
            color: '#fff',
            formatter: '{value}%'
          },
          nameTextStyle: {
            color: '#fff'
          }
        }
      ],
      series: [
        {
          name: 'AQI',
          type: 'line',
          smooth: true,
          data: aqiData,
          itemStyle: {
            color: '#ff4d4f'
          },
          lineStyle: {
            width: 3
          }
        },
        {
          name: 'PM2.5',
          type: 'line',
          smooth: true,
          data: pm25Data,
          itemStyle: {
            color: '#faad14'
          }
        },
        {
          name: 'PM10',
          type: 'line',
          smooth: true,
          data: pm10Data,
          itemStyle: {
            color: '#722ed1'
          }
        },
        {
          name: 'O₃',
          type: 'line',
          smooth: true,
          data: o3Data,
          itemStyle: {
            color: '#52c41a'
          }
        },
        {
          name: '置信度',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: confidenceData,
          itemStyle: {
            color: '#1890ff'
          },
          lineStyle: {
            type: 'dashed'
          }
        }
      ]
    };
  };
  
  // 获取未来24小时内的最高、最低和平均AQI
  const getAqiStats = () => {
    if (!data || !data.predictions || data.predictions.length === 0) {
      return { min: 0, max: 0, avg: 0 };
    }
    
    const predictions = data.predictions.slice(0, 24);
    const aqiValues = predictions.map(p => p.aqi);
    
    const min = Math.min(...aqiValues);
    const max = Math.max(...aqiValues);
    const avg = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
    
    return { min, max, avg };
  };
  
  // 获取未来24小时AQI等级分布
  const getCategoryDistribution = () => {
    if (!data || !data.predictions || data.predictions.length === 0) {
      return [];
    }
    
    const predictions = data.predictions.slice(0, 24);
    const categories = predictions.map(p => p.category);
    
    // 统计各等级数量
    const distribution: Record<string, number> = {
      'Good': 0,
      'Moderate': 0,
      'Unhealthy for Sensitive Groups': 0,
      'Unhealthy': 0,
      'Very Unhealthy': 0,
      'Hazardous': 0
    };
    
    categories.forEach(category => {
      if (distribution.hasOwnProperty(category)) {
        distribution[category]++;
      }
    });
    
    // 转换为图表需要的格式
    return Object.entries(distribution).map(([category, count]) => ({
      name: getCategoryName(category),
      value: count,
      itemStyle: {
        color: getCategoryColor(category)
      }
    }));
  };
  
  // 获取AQI等级饼图配置
  const getCategoryPieOption = () => {
    const data = getCategoryDistribution();
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} 小时 ({d}%)'
      },
      series: [
        {
          name: 'AQI等级分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            color: '#fff',
            formatter: '{b}: {c}h'
          },
          labelLine: {
            show: true
          },
          data
        }
      ]
    };
  };
  
  const aqiStats = getAqiStats();
  
  return (
    <div className="panel-container">
      <div className="panel-header">
        <div className="panel-title">
          <FundProjectionScreenOutlined className="panel-title-icon" />
          空气质量预测预报
        </div>
      </div>
      
      <div className="panel-content">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : !data || !data.predictions || data.predictions.length === 0 ? (
          <Empty description="暂无预测数据" />
        ) : (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: '10px' }}>
              <Col span={8}>
                <div className="data-item" style={{ backgroundColor: 'rgba(0, 228, 0, 0.1)', borderRadius: '4px', padding: '8px' }}>
                  <div className="data-label">预测最低AQI</div>
                  <div className="data-value" style={{ fontSize: '18px' }}>{aqiStats.min}</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="data-item" style={{ backgroundColor: 'rgba(255, 126, 0, 0.1)', borderRadius: '4px', padding: '8px' }}>
                  <div className="data-label">预测平均AQI</div>
                  <div className="data-value" style={{ fontSize: '18px' }}>{aqiStats.avg}</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="data-item" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', borderRadius: '4px', padding: '8px' }}>
                  <div className="data-label">预测最高AQI</div>
                  <div className="data-value" style={{ fontSize: '18px' }}>{aqiStats.max}</div>
                </div>
              </Col>
            </Row>
            
            <Row style={{ flex: 1, height: 'calc(100% - 60px)' }}>
              <Col span={24} style={{ height: '60%' }}>
                <ReactECharts 
                  option={getPredictionChartOption()} 
                  style={{ height: '100%', width: '100%' }}
                  theme="dark"
                />
              </Col>
              <Col span={24} style={{ height: '40%' }}>
                <ReactECharts 
                  option={getCategoryPieOption()} 
                  style={{ height: '100%', width: '100%' }}
                  theme="dark"
                />
              </Col>
            </Row>
          </>
        )}
      </div>
    </div>
  );
};

export default PredictionForecastPanel; 