import React from 'react';
import { Card, Row, Col, Typography, Table, Tag, Progress, Descriptions } from 'antd';
import ReactECharts from 'echarts-for-react';
import { SourceAttributionAnalysis } from '../../types';

const { Title, Paragraph, Text } = Typography;

interface SourceAttributionPanelProps {
  data: SourceAttributionAnalysis;
}

// 辅助函数：源类型对应的颜色
function getSourceColor(sourceType: string): string {
  const colorMap: Record<string, string> = {
    '交通排放': '#e74c3c',
    '工业活动': '#3498db',
    '燃煤': '#8e44ad',
    '建筑施工': '#f39c12',
    '区域传输': '#27ae60',
    '二次污染': '#2c3e50',
    '生物源排放': '#16a085'
  };
  
  return colorMap[sourceType] || '#95a5a6';
}

// 辅助函数：源类型对应的图标
function getSourceIcon(sourceType: string): string {
  const iconMap: Record<string, string> = {
    '交通排放': 'path://M12,0C7.58,0,4,1.79,4,4v3H2C0.9,7,0,7.9,0,9v12c0,1.1,0.9,2,2,2h1c0.55,0,1-0.45,1-1v-1h12v1c0,0.55,0.45,1,1,1h1c1.1,0,2-0.9,2-2V9c0-1.1-0.9-2-2-2h-2V4C16,1.79,12.42,0,8,0ZM6,4c0-1.1,2.69-2,6-2s6,0.9,6,2v3H6V4ZM9,15.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5s-0.67,1.5-1.5,1.5Z',
    '工业活动': 'path://M8,0 H16 V8 H24 V32 H0 V8 H8 V0 z M4,12 V16 M8,12 V16 M12,12 V16 M16,12 V16 M20,12 V16',
    '燃煤': 'path://M0,16 C0,11 2.5,6 9,4 C14,2.5 18,0 20,0 C20,2 19.5,5 18,7 C24,7 30,9 30,16 C30,23 24,30 16,30 C8,30 0,23 0,16 z',
    '建筑施工': 'path://M2,12 L15,2 L28,12 L28,30 L2,30 L2,12 z M10,30 L10,22 L20,22 L20,30',
    '区域传输': 'path://M9.4,2L20.6,2A1,1 0 0,1 21.6,3L21.6,14.2A1,1 0 0,1 20.6,15.2L9.4,15.2A1,1 0 0,1 8.4,14.2L8.4,3A1,1 0 0,1 9.4,2z M7.7,16.7L26.3,16.7 L22.1,30 L11.9,30 L7.7,16.7 z',
    '二次污染': 'path://M15.2,0.3c-3,0-5.8,1-8.1,2.9c-2.3,1.9-4,4.3-5.1,7.2c-1.1,2.9-1.5,5.9-1.3,9c0.2,3,1.2,5.9,2.9,8.5l1.4,0L4.8,28 l11.5-10.3c-1.4-0.4-2.8-1.1-4.2-2.1c-1.3-1-2.5-2.2-3.5-3.6c-1-1.4-1.8-2.9-2.4-4.6c-0.6-1.7-0.9-3.4-0.9-5.2H3.9 c0,1.6,0.3,3.1,0.8,4.7c0.5,1.5,1.2,2.9,2.1,4.2c0.9,1.3,2,2.5,3.3,3.4c1.3,1,2.6,1.7,4.1,2.1L25.5,6.1l-0.9-0.7 c-1.4-1.2-2.9-2-4.6-2.7C18.4,2.1,16.8,1.8,15.2,0.3L15.2,0.3z',
    '生物源排放': 'path://M3,1 L17,1 L30,14 L30,29 L3,29 L3,1 Z M7.5,24 A4.5,4.5 0 1,0 16.5,24 A4.5,4.5 0 1,0 7.5,24 M21,9 A6,6 0 1,0 9,9 A6,6 0 1,0 21,9'
  };
  
  return iconMap[sourceType] || '';
}

const SourceAttributionPanel: React.FC<SourceAttributionPanelProps> = ({ data }) => {
  // 气源排放饼图配置
  const getPieChartOption = () => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c}% ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        data: data.sources.map(s => s.sourceType)
      },
      series: [
        {
          name: '污染源贡献率',
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
              fontSize: '15',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: data.sources.map(s => ({
            value: (s.contribution * 100).toFixed(1),
            name: s.sourceType,
            itemStyle: {
              color: getSourceColor(s.sourceType)
            }
          }))
        }
      ]
    };
  };
  
  // 来源贡献柱状图配置
  const getBarChartOption = () => {
    // 对源按贡献率排序
    const sortedSources = [...data.sources].sort((a, b) => b.contribution - a.contribution);
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: '{b}: {c}%'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      yAxis: {
        type: 'category',
        data: sortedSources.map(s => s.sourceType),
        axisLabel: {
          interval: 0,
          rotate: 0
        }
      },
      series: [
        {
          name: '贡献率',
          type: 'bar',
          data: sortedSources.map(s => ({
            value: (s.contribution * 100).toFixed(1),
            itemStyle: {
              color: getSourceColor(s.sourceType)
            }
          })),
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%'
          }
        }
      ]
    };
  };
  
  // 可信度仪表盘配置
  const getGaugeChartOption = () => {
    return {
      tooltip: {
        formatter: '{a} <br/>{b} : {c}%'
      },
      series: [
        {
          name: '分析可信度',
          type: 'gauge',
          detail: { formatter: '{value}%' },
          data: [{ value: ((1 - data.uncertainty) * 100).toFixed(0), name: '可信度' }],
          axisLine: {
            lineStyle: {
              width: 10,
              color: [
                [0.3, '#ff4500'],
                [0.7, '#ffb800'],
                [1, '#5cb85c']
              ]
            }
          },
          pointer: {
            itemStyle: {
              color: 'auto'
            }
          }
        }
      ]
    };
  };
  
  // 表格列定义
  const columns = [
    {
      title: '污染源类型',
      dataIndex: 'sourceType',
      key: 'sourceType',
      render: (text: string) => (
        <Tag color={getSourceColor(text)} key={text}>
          {text}
        </Tag>
      )
    },
    {
      title: '贡献率',
      dataIndex: 'contribution',
      key: 'contribution',
      render: (value: number) => (
        <Progress 
          percent={Number((value * 100).toFixed(1))} 
          size="small" 
          strokeColor={getSourceColor('交通排放')}
        />
      ),
      sorter: (a, b) => b.contribution - a.contribution
    },
    {
      title: '可信度',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (value: number) => (
        <Progress 
          percent={Number((value * 100).toFixed(1))} 
          size="small" 
          strokeColor="#1890ff"
        />
      )
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details'
    }
  ];
  
  return (
    <div className="source-attribution-panel">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Title level={4}>污染源归因分析结果</Title>
            <Paragraph>
              分析时间: {new Date(data.generatedAt).toLocaleString()}
            </Paragraph>
            <Paragraph>
              分析站点ID: {data.stationId}
            </Paragraph>
            <Paragraph>
              分析方法: {data.methodology}
            </Paragraph>
            <Paragraph>
              分析不确定性: {(data.uncertainty * 100).toFixed(1)}%
            </Paragraph>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="污染源贡献率分布">
            <ReactECharts 
              option={getPieChartOption()}
              style={{ height: '400px' }}
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="污染源贡献率排序">
            <ReactECharts 
              option={getBarChartOption()}
              style={{ height: '400px' }}
            />
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="污染源详细信息">
            <Table 
              dataSource={data.sources.map((item, index) => ({ ...item, key: index }))} 
              columns={columns}
              pagination={false}
              bordered
            />
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="分析可信度">
            <ReactECharts 
              option={getGaugeChartOption()}
              style={{ height: '300px' }}
            />
          </Card>
        </Col>
        
        <Col span={16}>
          <Card title="污染源解读与建议">
            <Descriptions bordered>
              <Descriptions.Item label="主要污染源" span={3}>
                {data.sources[0].sourceType} 
                <Tag color="green" style={{ marginLeft: 10 }}>
                  贡献率 {(data.sources[0].contribution * 100).toFixed(1)}%
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="次要污染源" span={3}>
                {data.sources.length > 1 && data.sources[1].sourceType}
                {data.sources.length > 1 && (
                  <Tag color="blue" style={{ marginLeft: 10 }}>
                    贡献率 {(data.sources[1].contribution * 100).toFixed(1)}%
                  </Tag>
                )}
              </Descriptions.Item>
              
              <Descriptions.Item label="主要特征" span={3}>
                {data.sources[0].details}
              </Descriptions.Item>
              
              <Descriptions.Item label="污染控制建议" span={3}>
                {data.sources[0].sourceType === '交通排放' && 
                  '建议实施交通管制，减少高峰期车流量，鼓励使用公共交通工具。'}
                
                {data.sources[0].sourceType === '工业活动' && 
                  '建议加强工业排放监管，对高污染企业实施限产或错峰生产。'}
                
                {data.sources[0].sourceType === '燃煤' && 
                  '建议推广清洁能源使用，减少燃煤消耗，特别是在供暖季节。'}
                
                {data.sources[0].sourceType === '建筑施工' && 
                  '建议对施工工地加强扬尘管控，落实湿法作业和工地围挡等措施。'}
                
                {data.sources[0].sourceType === '区域传输' && 
                  '建议加强区域联防联控，协同上风向城市共同治理空气污染。'}
                
                {data.sources[0].sourceType === '二次污染' && 
                  '建议减少前体物排放，特别是挥发性有机物和氮氧化物的控制。'}
                
                {data.sources[0].sourceType === '生物源排放' && 
                  '建议加强城市绿化管理，选择低致敏植物，减少花粉排放。'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SourceAttributionPanel; 