import React from 'react';
import { Card, Table, Row, Col, Typography, Tag, Divider } from 'antd';
import ReactECharts from 'echarts-for-react';
import { CorrelationAnalysis } from '../../types';

const { Title, Paragraph, Text } = Typography;

interface CorrelationAnalysisPanelProps {
  data: CorrelationAnalysis;
}

// 辅助函数：获取相关性颜色
function getCorrelationColor(coefficient: number): string {
  const absCoef = Math.abs(coefficient);
  if (absCoef < 0.1) return '#909399'; // 无相关
  if (coefficient > 0) {
    if (absCoef > 0.7) return '#f56c6c'; // 强正相关
    if (absCoef > 0.3) return '#e6a23c'; // 中等正相关
    return '#67c23a'; // 弱正相关
  } else {
    if (absCoef > 0.7) return '#409eff'; // 强负相关
    if (absCoef > 0.3) return '#909399'; // 中等负相关
    return '#c0c4cc'; // 弱负相关
  }
}

// 辅助函数：获取相关性描述Tag
function getCorrelationTag(relationship: string) {
  let color = 'default';
  
  switch (relationship) {
    case 'Strong Positive':
      color = 'red';
      break;
    case 'Moderate Positive':
      color = 'orange';
      break;
    case 'Weak Positive':
      color = 'green';
      break;
    case 'No Correlation':
      color = 'default';
      break;
    case 'Weak Negative':
      color = 'cyan';
      break;
    case 'Moderate Negative':
      color = 'blue';
      break;
    case 'Strong Negative':
      color = 'geekblue';
      break;
  }
  
  return <Tag color={color}>{relationship}</Tag>;
}

const CorrelationAnalysisPanel: React.FC<CorrelationAnalysisPanelProps> = ({ data }) => {
  // 准备热力图数据
  const getHeatmapOption = () => {
    // 从相关性数据中提取所有不同的变量
    const allVariables = Array.from(new Set([
      ...data.correlations.map(c => c.variable1),
      ...data.correlations.map(c => c.variable2)
    ]));
    
    // 重命名变量为更友好的显示名称
    const variableLabels: Record<string, string> = {
      'pm25': 'PM2.5',
      'pm10': 'PM10',
      'o3': 'O3',
      'no2': 'NO2',
      'so2': 'SO2',
      'co': 'CO',
      'aqi': 'AQI',
      'temperature': '温度',
      'humidity': '湿度',
      'windSpeed': '风速',
      'precipitation': '降水量',
      'traffic_flow': '交通流量',
      'industrial_activity': '工业活动',
      'traffic_congestion': '交通拥堵'
    };
    
    // 准备热力图数据
    const heatmapData: [string, string, number][] = [];
    
    // 遍历所有可能的变量对，寻找它们的相关系数
    for (let i = 0; i < allVariables.length; i++) {
      for (let j = 0; j < allVariables.length; j++) {
        if (i === j) {
          // 对角线上的元素，自相关为1
          heatmapData.push([
            variableLabels[allVariables[i]] || allVariables[i],
            variableLabels[allVariables[j]] || allVariables[j],
            1
          ]);
        } else {
          // 查找两个变量间的相关系数
          const correlation = data.correlations.find(c => 
            (c.variable1 === allVariables[i] && c.variable2 === allVariables[j]) ||
            (c.variable1 === allVariables[j] && c.variable2 === allVariables[i])
          );
          
          if (correlation) {
            heatmapData.push([
              variableLabels[allVariables[i]] || allVariables[i],
              variableLabels[allVariables[j]] || allVariables[j],
              correlation.coefficient
            ]);
          } else {
            // 没有数据的情况下，填充null
            heatmapData.push([
              variableLabels[allVariables[i]] || allVariables[i],
              variableLabels[allVariables[j]] || allVariables[j],
              null as any
            ]);
          }
        }
      }
    }
    
    const displayLabels = allVariables.map(v => variableLabels[v] || v);
    
    return {
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          return `${params.value[0]} 与 ${params.value[1]} 的相关系数: ${params.value[2]?.toFixed(2) || 'N/A'}`;
        }
      },
      grid: {
        top: 40,
        right: 80,
        bottom: 30,
        left: 80
      },
      xAxis: {
        type: 'category',
        data: displayLabels,
        splitArea: {
          show: true
        }
      },
      yAxis: {
        type: 'category',
        data: displayLabels,
        splitArea: {
          show: true
        }
      },
      visualMap: {
        min: -1,
        max: 1,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: {
          color: ['#2B73AF', '#A1C4DC', '#FFFFFF', '#FCAE91', '#CB181D']
        }
      },
      series: [{
        name: '相关系数',
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: true,
          formatter: (params: any) => {
            return params.value[2]?.toFixed(2) || '';
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  };
  
  // 表格列定义
  const columns = [
    {
      title: '变量1',
      dataIndex: 'variable1',
      key: 'variable1',
      render: (text: string) => {
        const variableLabels: Record<string, string> = {
          'pm25': 'PM2.5',
          'pm10': 'PM10',
          'o3': 'O3',
          'no2': 'NO2',
          'so2': 'SO2',
          'co': 'CO',
          'aqi': 'AQI',
          'temperature': '温度',
          'humidity': '湿度',
          'windSpeed': '风速',
          'precipitation': '降水量',
          'traffic_flow': '交通流量',
          'industrial_activity': '工业活动',
          'traffic_congestion': '交通拥堵'
        };
        return variableLabels[text] || text;
      }
    },
    {
      title: '变量2',
      dataIndex: 'variable2',
      key: 'variable2',
      render: (text: string) => {
        const variableLabels: Record<string, string> = {
          'pm25': 'PM2.5',
          'pm10': 'PM10',
          'o3': 'O3',
          'no2': 'NO2',
          'so2': 'SO2',
          'co': 'CO',
          'aqi': 'AQI',
          'temperature': '温度',
          'humidity': '湿度',
          'windSpeed': '风速',
          'precipitation': '降水量',
          'traffic_flow': '交通流量',
          'industrial_activity': '工业活动',
          'traffic_congestion': '交通拥堵'
        };
        return variableLabels[text] || text;
      }
    },
    {
      title: '相关系数',
      dataIndex: 'coefficient',
      key: 'coefficient',
      render: (coef: number) => (
        <span style={{ color: getCorrelationColor(coef) }}>
          {coef.toFixed(3)}
        </span>
      ),
      sorter: (a: any, b: any) => Math.abs(b.coefficient) - Math.abs(a.coefficient)
    },
    {
      title: '关系',
      dataIndex: 'relationship',
      key: 'relationship',
      render: (text: string) => getCorrelationTag(text),
      filters: [
        { text: '强正相关', value: 'Strong Positive' },
        { text: '中等正相关', value: 'Moderate Positive' },
        { text: '弱正相关', value: 'Weak Positive' },
        { text: '无相关性', value: 'No Correlation' },
        { text: '弱负相关', value: 'Weak Negative' },
        { text: '中等负相关', value: 'Moderate Negative' },
        { text: '强负相关', value: 'Strong Negative' }
      ],
      onFilter: (value: string, record: any) => record.relationship === value
    },
    {
      title: 'p值',
      dataIndex: 'pValue',
      key: 'pValue',
      render: (value: number) => value.toFixed(4)
    },
    {
      title: '统计显著性',
      dataIndex: 'significant',
      key: 'significant',
      render: (sig: boolean) => sig ? 
        <Tag color="green">显著</Tag> : 
        <Tag color="orange">不显著</Tag>,
      filters: [
        { text: '显著', value: true },
        { text: '不显著', value: false }
      ],
      onFilter: (value: boolean, record: any) => record.significant === value
    }
  ];
  
  return (
    <div className="correlation-analysis-panel">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Title level={4}>相关性分析结果</Title>
            <Paragraph>
              分析时间: {new Date(data.generatedAt).toLocaleString()}
            </Paragraph>
            <Paragraph>
              数据范围: {new Date(data.timeRange.start).toLocaleDateString()} - {new Date(data.timeRange.end).toLocaleDateString()}
            </Paragraph>
            <Paragraph>
              分析方法: {data.method === 'Pearson' ? '皮尔逊相关系数(Pearson)' : 
                        data.method === 'Spearman' ? '斯皮尔曼等级相关系数(Spearman)' : 
                        '肯德尔等级相关系数(Kendall)'}
            </Paragraph>
            <Paragraph>
              <Text strong>相关性强度等级解释:</Text>
              <br />
              <Tag color="red">强正相关</Tag> - 当一个变量增加时，另一个变量也明显增加 (相关系数 {'>'}  0.7)
              <br />
              <Tag color="orange">中等正相关</Tag> - 当一个变量增加时，另一个变量有一定程度的增加 (相关系数 0.3-0.7)
              <br />
              <Tag color="green">弱正相关</Tag> - 当一个变量增加时，另一个变量略有增加 (相关系数 0-0.3)
              <br />
              <Tag color="default">无相关性</Tag> - 两个变量没有线性关系 (相关系数接近0)
              <br />
              <Tag color="cyan">弱负相关</Tag> - 当一个变量增加时，另一个变量略有减少 (相关系数 0 到 -0.3)
              <br />
              <Tag color="blue">中等负相关</Tag> - 当一个变量增加时，另一个变量有一定程度的减少 (相关系数 -0.3 到 -0.7)
              <br />
              <Tag color="geekblue">强负相关</Tag> - 当一个变量增加时，另一个变量明显减少 (相关系数 {'<'} -0.7)
            </Paragraph>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card>
            <Title level={4}>相关性热力图</Title>
            <ReactECharts 
              option={getHeatmapOption()}
              style={{ height: '600px' }}
            />
          </Card>
        </Col>
        
        <Col span={24}>
          <Card>
            <Title level={4}>相关性详细数据</Title>
            <Table 
              columns={columns} 
              dataSource={data.correlations.map((item, index) => ({ ...item, key: index }))}
              pagination={{ pageSize: 10 }}
              bordered
            />
          </Card>
        </Col>
        
        <Col span={24}>
          <Card>
            <Title level={4}>相关性分析发现</Title>
            <Divider />
            
            <Title level={5}>正相关关系</Title>
            <ul>
              {data.correlations
                .filter(c => c.coefficient > 0.3 && c.significant)
                .map((c, index) => {
                  const variableLabels: Record<string, string> = {
                    'pm25': 'PM2.5',
                    'pm10': 'PM10',
                    'o3': 'O3',
                    'no2': 'NO2',
                    'so2': 'SO2',
                    'co': 'CO',
                    'aqi': 'AQI',
                    'temperature': '温度',
                    'humidity': '湿度',
                    'windSpeed': '风速',
                    'precipitation': '降水量',
                    'traffic_flow': '交通流量',
                    'industrial_activity': '工业活动',
                    'traffic_congestion': '交通拥堵'
                  };
                  
                  const v1 = variableLabels[c.variable1] || c.variable1;
                  const v2 = variableLabels[c.variable2] || c.variable2;
                  
                  return (
                    <li key={`pos-${index}`}>
                      <Text strong>{v1}</Text> 与 <Text strong>{v2}</Text> 存在 
                      <Text type="danger">{c.relationship}</Text> 关系 
                      (相关系数: {c.coefficient.toFixed(3)})，表明这两者之间有明显的同向变化趋势。
                    </li>
                  );
                })
              }
              {data.correlations.filter(c => c.coefficient > 0.3 && c.significant).length === 0 && (
                <li>无显著正相关关系。</li>
              )}
            </ul>
            
            <Divider />
            
            <Title level={5}>负相关关系</Title>
            <ul>
              {data.correlations
                .filter(c => c.coefficient < -0.3 && c.significant)
                .map((c, index) => {
                  const variableLabels: Record<string, string> = {
                    'pm25': 'PM2.5',
                    'pm10': 'PM10',
                    'o3': 'O3',
                    'no2': 'NO2',
                    'so2': 'SO2',
                    'co': 'CO',
                    'aqi': 'AQI',
                    'temperature': '温度',
                    'humidity': '湿度',
                    'windSpeed': '风速',
                    'precipitation': '降水量',
                    'traffic_flow': '交通流量',
                    'industrial_activity': '工业活动',
                    'traffic_congestion': '交通拥堵'
                  };
                  
                  const v1 = variableLabels[c.variable1] || c.variable1;
                  const v2 = variableLabels[c.variable2] || c.variable2;
                  
                  return (
                    <li key={`neg-${index}`}>
                      <Text strong>{v1}</Text> 与 <Text strong>{v2}</Text> 存在 
                      <Text type="success">{c.relationship}</Text> 关系 
                      (相关系数: {c.coefficient.toFixed(3)})，表明当一个增加时，另一个通常会减少。
                    </li>
                  );
                })
              }
              {data.correlations.filter(c => c.coefficient < -0.3 && c.significant).length === 0 && (
                <li>无显著负相关关系。</li>
              )}
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CorrelationAnalysisPanel; 