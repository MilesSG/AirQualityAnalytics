import React from 'react';
import { Card, Row, Col, Typography, Statistic, Divider, Timeline, Tag, Alert } from 'antd';
import ReactECharts from 'echarts-for-react';
import { TrendAnalysis } from '../../types';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface TrendAnalysisPanelProps {
  data: TrendAnalysis;
}

// 辅助函数：格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

// 辅助函数：获取趋势标签和颜色
function getTrendTag(direction: string) {
  switch (direction) {
    case 'increasing':
      return <Tag color="red">上升趋势 <ArrowUpOutlined /></Tag>;
    case 'decreasing':
      return <Tag color="green">下降趋势 <ArrowDownOutlined /></Tag>;
    case 'stable':
      return <Tag color="blue">稳定趋势 <MinusOutlined /></Tag>;
    default:
      return <Tag>未知趋势</Tag>;
  }
}

const TrendAnalysisPanel: React.FC<TrendAnalysisPanelProps> = ({ data }) => {
  // 准备趋势图数据
  const getTrendChartOption = () => {
    const timestamps = data.dataPoints.map(p => formatDate(p.timestamp));
    const values = data.dataPoints.map(p => p.value);
    const trendValues = data.dataPoints.map(p => p.trend);
    
    // 添加季节性和残差数据（如果有）
    const seasonalValues = data.dataPoints.map(p => p.seasonal || null);
    const residualValues = data.dataPoints.map(p => p.residual || null);
    
    // 标记断点位置
    const markPoints = data.trend.breakpoints.map(bp => {
      const index = data.dataPoints.findIndex(p => p.timestamp === bp.timestamp);
      return {
        name: bp.possibleCause || '变化点',
        coord: [index, data.dataPoints[index]?.value || 0],
        value: bp.possibleCause || '变化点',
        symbolSize: 20,
        itemStyle: {
          color: '#ff4500'
        }
      };
    });
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: function(params: any) {
          const date = params[0].axisValue;
          let html = `<div>${date}</div>`;
          
          params.forEach((param: any) => {
            if (param.value !== null && param.value !== undefined) {
              const color = param.color;
              const seriesName = param.seriesName;
              const value = param.value;
              html += `<div style="color: ${color}">${seriesName}: ${value}</div>`;
            }
          });
          
          return html;
        }
      },
      legend: {
        data: ['实际值', '趋势', '季节性', '残差']
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
      yAxis: {
        type: 'value',
        name: getPollutantUnit(data.pollutant)
      },
      series: [
        {
          name: '实际值',
          type: 'line',
          data: values,
          smooth: true,
          lineStyle: {
            width: 3
          },
          markPoint: {
            data: markPoints
          }
        },
        {
          name: '趋势',
          type: 'line',
          data: trendValues,
          smooth: true,
          lineStyle: {
            width: 2,
            type: 'dashed'
          }
        },
        {
          name: '季节性',
          type: 'line',
          data: seasonalValues,
          smooth: true,
          lineStyle: {
            width: 2,
            type: 'dotted'
          }
        },
        {
          name: '残差',
          type: 'scatter',
          data: residualValues,
          symbolSize: 5,
          emphasis: {
            scale: true
          }
        }
      ]
    };
  };
  
  // 准备季节性图表（如果有）
  const getSeasonalChartOption = () => {
    if (!data.trend.seasonality) return null;
    
    const timestamps = data.dataPoints.map(p => formatDate(p.timestamp));
    const seasonalValues = data.dataPoints.map(p => p.seasonal || 0);
    
    return {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: timestamps
      },
      yAxis: {
        type: 'value',
        name: '季节性波动'
      },
      series: [
        {
          data: seasonalValues,
          type: 'line',
          name: '季节性波动',
          smooth: true,
          areaStyle: {},
          itemStyle: {
            color: '#91cc75'
          },
          markLine: {
            data: [{ type: 'average', name: '平均值' }]
          }
        }
      ]
    };
  };
  
  // 获取污染物的单位
  function getPollutantUnit(pollutant: string): string {
    switch (pollutant) {
      case 'pm25':
      case 'pm10':
        return '浓度 (μg/m³)';
      case 'o3':
      case 'no2':
      case 'so2':
        return '浓度 (ppb)';
      case 'co':
        return '浓度 (ppm)';
      default:
        return '浓度';
    }
  }
  
  // 获取污染物的中文名称
  function getPollutantName(pollutant: string): string {
    switch (pollutant) {
      case 'pm25': return 'PM2.5';
      case 'pm10': return 'PM10';
      case 'o3': return '臭氧 (O₃)';
      case 'no2': return '二氧化氮 (NO₂)';
      case 'so2': return '二氧化硫 (SO₂)';
      case 'co': return '一氧化碳 (CO)';
      default: return pollutant.toUpperCase();
    }
  }
  
  // 获取趋势的描述文本
  function getTrendDescription() {
    const direction = data.trend.direction;
    const rate = Math.abs(data.trend.changeRate * 100).toFixed(2);
    const pollutantName = getPollutantName(data.pollutant);
    
    if (direction === 'increasing') {
      return `分析期间，${pollutantName}浓度呈上升趋势，平均每个时间单位上升${rate}%。`;
    } else if (direction === 'decreasing') {
      return `分析期间，${pollutantName}浓度呈下降趋势，平均每个时间单位下降${rate}%。`;
    } else {
      return `分析期间，${pollutantName}浓度保持相对稳定，变化率约为${rate}%。`;
    }
  }
  
  // 获取季节性描述
  function getSeasonalityDescription() {
    if (data.trend.seasonality) {
      const pollutantName = getPollutantName(data.pollutant);
      return `分析检测到${pollutantName}浓度存在明显的周期性波动模式，表明该污染物受到季节性因素的影响。`;
    } else {
      return '分析未检测到明显的季节性波动模式。';
    }
  }
  
  return (
    <div className="trend-analysis-panel">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Title level={4}>{getPollutantName(data.pollutant)}浓度趋势分析</Title>
            <Paragraph>
              分析时间: {new Date(data.generatedAt).toLocaleString()}
            </Paragraph>
            <Paragraph>
              数据范围: {formatDate(data.timeRange.start)} - {formatDate(data.timeRange.end)} ({data.timeRange.interval}ly)
            </Paragraph>
            <Paragraph>
              分析方法: {data.methodology}
            </Paragraph>
            
            <Row gutter={16}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="趋势方向"
                    value={data.trend.direction === 'increasing' ? '上升' : data.trend.direction === 'decreasing' ? '下降' : '稳定'}
                    prefix={
                      data.trend.direction === 'increasing' ? <ArrowUpOutlined /> : 
                      data.trend.direction === 'decreasing' ? <ArrowDownOutlined /> : 
                      <MinusOutlined />
                    }
                    valueStyle={{ 
                      color: data.trend.direction === 'increasing' ? '#cf1322' : 
                             data.trend.direction === 'decreasing' ? '#3f8600' : 
                             '#1890ff'
                    }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="变化率"
                    value={Math.abs(data.trend.changeRate * 100).toFixed(2)}
                    suffix="%"
                    precision={2}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="季节性波动"
                    value={data.trend.seasonality ? '存在' : '不存在'}
                    valueStyle={{ 
                      color: data.trend.seasonality ? '#1890ff' : '#595959'
                    }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card>
            <Title level={4}>趋势图</Title>
            <ReactECharts 
              option={getTrendChartOption()}
              style={{ height: '400px' }}
            />
          </Card>
        </Col>
        
        {data.trend.seasonality && (
          <Col span={24}>
            <Card>
              <Title level={4}>季节性波动分析</Title>
              <ReactECharts 
                option={getSeasonalChartOption() || {}}
                style={{ height: '300px' }}
              />
            </Card>
          </Col>
        )}
        
        <Col span={24}>
          <Card>
            <Title level={4}>趋势解读</Title>
            <Paragraph>
              <Text strong>{getTrendDescription()}</Text>
            </Paragraph>
            <Paragraph>
              {getSeasonalityDescription()}
            </Paragraph>
            
            {data.trend.breakpoints.length > 0 && (
              <>
                <Title level={5}>检测到的重大变化点</Title>
                <Timeline>
                  {data.trend.breakpoints.map((bp, index) => (
                    <Timeline.Item key={index} color="red">
                      <p><strong>{formatDate(bp.timestamp)}</strong></p>
                      <p>显著性: {(bp.significance * 100).toFixed(0)}%</p>
                      {bp.possibleCause && <p>可能原因: {bp.possibleCause}</p>}
                    </Timeline.Item>
                  ))}
                </Timeline>
              </>
            )}
            
            <Divider />
            
            <Title level={5}>趋势预测</Title>
            {data.trend.direction === 'increasing' && (
              <Alert
                message="污染物浓度呈上升趋势"
                description={`如果当前趋势持续，${getPollutantName(data.pollutant)}浓度将继续升高。建议密切关注并采取适当的污染控制措施。`}
                type="warning"
                showIcon
              />
            )}
            
            {data.trend.direction === 'decreasing' && (
              <Alert
                message="污染物浓度呈下降趋势"
                description={`当前${getPollutantName(data.pollutant)}浓度呈下降趋势，表明空气质量正在改善。建议继续保持当前的污染控制措施。`}
                type="success"
                showIcon
              />
            )}
            
            {data.trend.direction === 'stable' && (
              <Alert
                message="污染物浓度保持稳定"
                description={`${getPollutantName(data.pollutant)}浓度在分析期间保持相对稳定。建议监控是否有季节性变化以及其他污染物的趋势。`}
                type="info"
                showIcon
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TrendAnalysisPanel; 