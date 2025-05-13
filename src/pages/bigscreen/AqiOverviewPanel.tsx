import React, { useEffect } from 'react';
import { Row, Col, Spin, Empty, Card, Statistic, Button } from 'antd';
import { DashboardOutlined, ArrowUpOutlined, ArrowDownOutlined, DotChartOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { AirQualityData } from '../../types';

interface AqiOverviewPanelProps {
  data: AirQualityData[];
  loading: boolean;
}

const AqiOverviewPanel: React.FC<AqiOverviewPanelProps> = ({ data, loading }) => {
  // 添加键盘事件监听器 - 按下F5强制刷新
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F5') {
        console.log('触发F5刷新');
        window.location.reload();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 计算AQI分布
  const getAqiDistributionOption = () => {
    // 统计各级别的AQI数量
    const aqiLevels = {
      '优': 0,
      '良': 0,
      '轻度污染': 0,
      '中度污染': 0,
      '重度污染': 0,
      '严重污染': 0,
    };
    
    // 如果有数据就统计，没有数据就使用示例数据
    if (data.length > 0) {
      data.forEach(item => {
        switch (item.category) {
          case 'Good':
            aqiLevels['优']++;
            break;
          case 'Moderate':
            aqiLevels['良']++;
            break;
          case 'Unhealthy for Sensitive Groups':
            aqiLevels['轻度污染']++;
            break;
          case 'Unhealthy':
            aqiLevels['中度污染']++;
            break;
          case 'Very Unhealthy':
            aqiLevels['重度污染']++;
            break;
          case 'Hazardous':
            aqiLevels['严重污染']++;
            break;
        }
      });
    } else {
      // 添加示例数据以便显示图表
      aqiLevels['优'] = 5;
      aqiLevels['良'] = 7;
      aqiLevels['轻度污染'] = 3;
      aqiLevels['中度污染'] = 2;
      aqiLevels['重度污染'] = 1;
      aqiLevels['严重污染'] = 0;
    }
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: {
          color: '#1d1d1f'
        },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 10
      },
      color: ['#00e400', '#ffcc00', '#ff7e00', '#ff0000', '#99004c', '#7e0023'],
      series: [
        {
          name: 'AQI分布',
          type: 'pie',
          radius: ['40%', '65%'],
          center: ['30%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '14',
              fontWeight: 'bold',
              color: '#1d1d1f'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: aqiLevels['优'], name: '优' },
            { value: aqiLevels['良'], name: '良' },
            { value: aqiLevels['轻度污染'], name: '轻度污染' },
            { value: aqiLevels['中度污染'], name: '中度污染' },
            { value: aqiLevels['重度污染'], name: '重度污染' },
            { value: aqiLevels['严重污染'], name: '严重污染' }
          ]
        }
      ]
    };
  };
  
  // 获取平均AQI仪表盘配置
  const getAqiGaugeOption = () => {
    // 计算平均AQI
    let avgAqi = 0;
    
    if (data.length > 0) {
      const totalAqi = data.reduce((sum, item) => sum + item.aqi, 0);
      avgAqi = Math.round(totalAqi / data.length);
    } else {
      // 示例数据，确保图表能显示
      avgAqi = 120; 
    }
    
    // 确定等级和颜色
    let aqiLevel, color;
    if (avgAqi <= 50) {
      aqiLevel = '优';
      color = '#00e400';
    } else if (avgAqi <= 100) {
      aqiLevel = '良';
      color = '#ffcc00';
    } else if (avgAqi <= 150) {
      aqiLevel = '轻度污染';
      color = '#ff7e00';
    } else if (avgAqi <= 200) {
      aqiLevel = '中度污染';
      color = '#ff0000';
    } else if (avgAqi <= 300) {
      aqiLevel = '重度污染';
      color = '#99004c';
    } else {
      aqiLevel = '严重污染';
      color = '#7e0023';
    }
    
    return {
      series: [
        {
          type: 'gauge',
          radius: '85%',
          startAngle: 180,
          endAngle: 0,
          center: ['50%', '65%'],
          min: 0,
          max: 500,
          splitNumber: 5,
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [0.1, '#00e400'],
                [0.2, '#ffcc00'],
                [0.3, '#ff7e00'],
                [0.4, '#ff0000'],
                [0.6, '#99004c'],
                [1, '#7e0023']
              ]
            }
          },
          pointer: {
            icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
            length: '12%',
            width: 10,
            offsetCenter: [0, '-60%'],
            itemStyle: {
              color: 'auto'
            }
          },
          axisTick: {
            length: 12,
            lineStyle: {
              color: 'auto',
              width: 2
            }
          },
          splitLine: {
            length: 20,
            lineStyle: {
              color: 'auto',
              width: 3
            }
          },
          axisLabel: {
            color: '#1d1d1f',
            fontSize: 11,
            distance: -65,
            formatter: function(value: number) {
              if (value === 0) return '0';
              if (value === 50) return '50';
              if (value === 100) return '100';
              if (value === 150) return '150';
              if (value === 300) return '300';
              if (value === 500) return '500';
              return '';
            }
          },
          title: {
            offsetCenter: [0, '-15%'],
            fontSize: 14,
            color: '#1d1d1f'
          },
          detail: {
            fontSize: 30,
            offsetCenter: [0, '30%'],
            valueAnimation: true,
            formatter: function() {
              return '{value|' + avgAqi + '}\n{level|' + aqiLevel + '}';
            },
            rich: {
              value: {
                fontSize: 36,
                fontWeight: 'bold',
                color: color,
                padding: [0, 0, 10, 0]
              },
              level: {
                fontSize: 16,
                fontWeight: 'normal',
                color: color,
                padding: [10, 0, 0, 0]
              }
            }
          },
          data: [
            {
              value: avgAqi,
              name: '平均AQI'
            }
          ]
        }
      ]
    };
  };
  
  // 获取主要污染物分布图
  const getPollutantDistributionOption = () => {
    // 统计主要污染物分布
    const pollutants: Record<string, number> = {
      'pm25': 0,
      'pm10': 0,
      'o3': 0,
      'no2': 0,
      'so2': 0,
      'co': 0
    };
    
    if (data.length > 0) {
      data.forEach(item => {
        if (pollutants.hasOwnProperty(item.dominantPollutant)) {
          pollutants[item.dominantPollutant]++;
        }
      });
    } else {
      // 示例数据
      pollutants['pm25'] = 5;
      pollutants['pm10'] = 3;
      pollutants['o3'] = 7;
      pollutants['no2'] = 2;
      pollutants['so2'] = 1;
      pollutants['co'] = 0;
    }
    
    // 转换为名称
    const pollutantNames: Record<string, string> = {
      'pm25': 'PM2.5',
      'pm10': 'PM10',
      'o3': 'O₃',
      'no2': 'NO₂',
      'so2': 'SO₂',
      'co': 'CO'
    };
    
    const chartData = Object.entries(pollutants).map(([key, value]) => ({
      name: pollutantNames[key] || key,
      value
    }));
    
    return {
      tooltip: {
        trigger: 'item'
      },
      color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'],
      legend: {
        orient: 'vertical',
        right: 5,
        top: 'center',
        textStyle: {
          color: '#1d1d1f',
          fontSize: 10
        },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 6
      },
      series: [
        {
          name: '主要污染物',
          type: 'pie',
          radius: '55%',
          center: ['30%', '50%'],
          data: chartData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: false
          },
          labelLine: {
            show: false
          }
        }
      ]
    };
  };

  // 计算各站点AQI最大、最小、平均值
  const getAqiStats = () => {
    if (data.length === 0) return { max: 0, min: 0, avg: 0 };
    
    const aqiValues = data.map(item => item.aqi);
    const max = Math.max(...aqiValues);
    const min = Math.min(...aqiValues);
    const avg = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
    
    return { max, min, avg };
  };
  
  const aqiStats = getAqiStats();
  
  // 获取AQI对应的颜色和描述
  const getAqiColorAndDesc = (value: number) => {
    if (value <= 50) return { color: '#00e400', desc: '优' };
    if (value <= 100) return { color: '#ffcc00', desc: '良' };
    if (value <= 150) return { color: '#ff7e00', desc: '轻度污染' };
    if (value <= 200) return { color: '#ff0000', desc: '中度污染' };
    if (value <= 300) return { color: '#99004c', desc: '重度污染' };
    return { color: '#7e0023', desc: '严重污染' };
  };

  const minAqiInfo = getAqiColorAndDesc(aqiStats.min);
  const avgAqiInfo = getAqiColorAndDesc(aqiStats.avg);
  const maxAqiInfo = getAqiColorAndDesc(aqiStats.max);
  
  return (
    <div className="panel-container">
      <div className="panel-header">
        <div className="panel-title">
          <DashboardOutlined className="panel-title-icon" />
          空气质量指数概览
        </div>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          size="small"
          onClick={() => window.location.reload()}
          loading={loading}
        >
          刷新数据
        </Button>
      </div>
      
      <div className="panel-content">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <div className="loading-text">数据加载中...</div>
          </div>
        ) : (
          <>
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
              <Col xs={24} sm={8}>
                <Card bordered={false} className="aqi-card" hoverable>
                  <Statistic
                    title="最低AQI"
                    value={data.length > 0 ? aqiStats.min : "--"}
                    valueStyle={{ color: data.length > 0 ? minAqiInfo.color : '#86868b' }}
                    prefix={<ArrowDownOutlined />}
                    suffix={data.length > 0 ? <span style={{ fontSize: '14px', marginLeft: '8px' }}>{minAqiInfo.desc}</span> : null}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card bordered={false} className="aqi-card" hoverable>
                  <Statistic
                    title="平均AQI"
                    value={data.length > 0 ? aqiStats.avg : "--"}
                    valueStyle={{ color: data.length > 0 ? avgAqiInfo.color : '#86868b' }}
                    prefix={<DotChartOutlined />}
                    suffix={data.length > 0 ? <span style={{ fontSize: '14px', marginLeft: '8px' }}>{avgAqiInfo.desc}</span> : null}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card bordered={false} className="aqi-card" hoverable>
                  <Statistic
                    title="最高AQI"
                    value={data.length > 0 ? aqiStats.max : "--"}
                    valueStyle={{ color: data.length > 0 ? maxAqiInfo.color : '#86868b' }}
                    prefix={<ArrowUpOutlined />}
                    suffix={data.length > 0 ? <span style={{ fontSize: '14px', marginLeft: '8px' }}>{maxAqiInfo.desc}</span> : null}
                  />
                </Card>
              </Col>
            </Row>
            
            {data.length === 0 && (
              <div className="data-alert">
                <Empty description="暂无实时数据，显示模拟数据" style={{ marginBottom: '16px' }} />
              </div>
            )}
            
            <Row gutter={[24, 24]} style={{ flex: 1 }}>
              <Col xs={24} lg={12} style={{ height: '300px' }}>
                <Card 
                  title="AQI指数仪表盘" 
                  bordered={false} 
                  className="chart-card"
                  style={{ height: '100%' }}
                >
                  <div className="echarts-container">
                    <ReactECharts 
                      option={getAqiGaugeOption()} 
                      style={{ height: '100%', width: '100%' }}
                      opts={{ renderer: 'canvas' }}
                      notMerge={true}
                      lazyUpdate={false}
                    />
                  </div>
                </Card>
              </Col>
              <Col xs={24} lg={12} style={{ height: '300px' }}>
                <Row gutter={[24, 24]} style={{ height: '100%' }}>
                  <Col span={24} style={{ height: '50%' }}>
                    <Card 
                      title="AQI等级分布" 
                      bordered={false} 
                      className="chart-card"
                      style={{ height: '100%' }}
                    >
                      <div className="echarts-container">
                        <ReactECharts 
                          option={getAqiDistributionOption()} 
                          style={{ height: '100%', width: '100%' }}
                          opts={{ renderer: 'canvas' }}
                          notMerge={true}
                          lazyUpdate={false}
                        />
                      </div>
                    </Card>
                  </Col>
                  <Col span={24} style={{ height: '50%' }}>
                    <Card 
                      title="主要污染物分布" 
                      bordered={false} 
                      className="chart-card"
                      style={{ height: '100%' }}
                    >
                      <div className="echarts-container">
                        <ReactECharts 
                          option={getPollutantDistributionOption()} 
                          style={{ height: '100%', width: '100%' }}
                          opts={{ renderer: 'canvas' }}
                          notMerge={true}
                          lazyUpdate={false}
                        />
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
          </>
        )}
      </div>
    </div>
  );
};

export default AqiOverviewPanel; 