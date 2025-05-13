import React, { useState } from 'react';
import { Card, Row, Col, Typography, Table, Tag, Divider, Radio, Space, Descriptions, Collapse } from 'antd';
import ReactECharts from 'echarts-for-react';
import { ClusterAnalysis } from '../../types';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

interface ClusterAnalysisPanelProps {
  data: ClusterAnalysis;
}

const ClusterAnalysisPanel: React.FC<ClusterAnalysisPanelProps> = ({ data }) => {
  const [selectedDimensions, setSelectedDimensions] = useState<string>('pm25_pm10');
  
  // 生成聚类散点图
  const getScatterOption = () => {
    // 从选择的维度确定X和Y轴参数
    let xAxis = 'pm25';
    let yAxis = 'pm10';
    
    if (selectedDimensions === 'pm25_o3') {
      xAxis = 'pm25';
      yAxis = 'o3';
    } else if (selectedDimensions === 'aqi_temperature') {
      xAxis = 'aqi';
      yAxis = 'temperature';
    } else if (selectedDimensions === 'pm25_humidity') {
      xAxis = 'pm25';
      yAxis = 'humidity';
    }
    
    // 准备散点图数据
    const series = data.clusters.map(cluster => {
      let xValue, yValue;
      
      if (xAxis === 'aqi') {
        xValue = cluster.centroid.aqi;
      } else {
        xValue = cluster.centroid.pollutants[xAxis as keyof typeof cluster.centroid.pollutants];
      }
      
      if (yAxis === 'temperature' || yAxis === 'humidity' || yAxis === 'windSpeed') {
        yValue = cluster.centroid.weather?.[yAxis as keyof typeof cluster.centroid.weather] || 0;
      } else {
        yValue = cluster.centroid.pollutants[yAxis as keyof typeof cluster.centroid.pollutants];
      }
      
      return {
        name: `聚类${cluster.id}`,
        type: 'scatter',
        data: [[xValue, yValue]],
        symbolSize: Math.sqrt(cluster.size) * 10,
        label: {
          show: true,
          position: 'right',
          formatter: `聚类${cluster.id} (${cluster.size}站)`
        },
        emphasis: {
          focus: 'series',
          label: {
            show: true,
            position: 'right',
            formatter: (params: any) => {
              return `聚类${cluster.id}\n站点数:${cluster.size}`;
            }
          }
        }
      };
    });
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const clusterIndex = params.seriesIndex;
          const cluster = data.clusters[clusterIndex];
          return `
            <div>聚类${cluster.id}</div>
            <div>站点数: ${cluster.size}</div>
            <div>${getAxisLabel(xAxis)}: ${params.data[0].toFixed(2)}</div>
            <div>${getAxisLabel(yAxis)}: ${params.data[1].toFixed(2)}</div>
          `;
        }
      },
      xAxis: {
        name: getAxisLabel(xAxis),
        nameLocation: 'center',
        nameGap: 30,
        type: 'value'
      },
      yAxis: {
        name: getAxisLabel(yAxis),
        nameLocation: 'center',
        nameGap: 30,
        type: 'value'
      },
      series
    };
  };
  
  // 获取坐标轴标签
  const getAxisLabel = (dimension: string): string => {
    const labels: Record<string, string> = {
      'pm25': 'PM2.5 (μg/m³)',
      'pm10': 'PM10 (μg/m³)',
      'o3': 'O3 (ppb)',
      'no2': 'NO2 (ppb)',
      'so2': 'SO2 (ppb)',
      'co': 'CO (ppm)',
      'aqi': 'AQI',
      'temperature': '温度 (°C)',
      'humidity': '湿度 (%)',
      'windSpeed': '风速 (m/s)'
    };
    
    return labels[dimension] || dimension;
  };
  
  // 生成聚类特征雷达图
  const getRadarOption = () => {
    const indicators = [
      { name: 'PM2.5', max: 150 },
      { name: 'PM10', max: 200 },
      { name: 'O3', max: 120 },
      { name: 'NO2', max: 100 },
      { name: 'SO2', max: 50 },
      { name: 'CO', max: 10 }
    ];
    
    const series = {
      type: 'radar',
      data: data.clusters.map(cluster => ({
        value: [
          cluster.centroid.pollutants.pm25,
          cluster.centroid.pollutants.pm10,
          cluster.centroid.pollutants.o3,
          cluster.centroid.pollutants.no2,
          cluster.centroid.pollutants.so2,
          cluster.centroid.pollutants.co
        ],
        name: `聚类${cluster.id}`,
        areaStyle: {
          opacity: 0.2
        }
      }))
    };
    
    return {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: data.clusters.map(c => `聚类${c.id}`)
      },
      radar: {
        indicator: indicators,
        radius: '65%'
      },
      series: [series]
    };
  };
  
  // 生成聚类分布扇形图
  const getPieOption = () => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        data: data.clusters.map(c => `聚类${c.id}`)
      },
      series: [
        {
          name: '聚类分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            formatter: '{b}: {c}站'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '15',
              fontWeight: 'bold'
            }
          },
          data: data.clusters.map(c => ({
            value: c.size,
            name: `聚类${c.id}`
          }))
        }
      ]
    };
  };
  
  // 聚类特征表格的列
  const columns = [
    {
      title: '聚类ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => `聚类${id}`
    },
    {
      title: '站点数量',
      dataIndex: 'size',
      key: 'size'
    },
    {
      title: 'AQI',
      dataIndex: ['centroid', 'aqi'],
      key: 'aqi',
      render: (aqi: number) => aqi.toFixed(1)
    },
    {
      title: 'PM2.5',
      dataIndex: ['centroid', 'pollutants', 'pm25'],
      key: 'pm25',
      render: (pm25: number) => pm25.toFixed(1)
    },
    {
      title: 'PM10',
      dataIndex: ['centroid', 'pollutants', 'pm10'],
      key: 'pm10',
      render: (pm10: number) => pm10.toFixed(1)
    },
    {
      title: 'O3',
      dataIndex: ['centroid', 'pollutants', 'o3'],
      key: 'o3',
      render: (o3: number) => o3.toFixed(1)
    },
    {
      title: '特征描述',
      dataIndex: 'characteristics',
      key: 'characteristics',
      render: (characteristics: string[]) => (
        <span>
          {characteristics.map(item => (
            <Tag color="blue" key={item}>
              {item}
            </Tag>
          ))}
        </span>
      )
    }
  ];
  
  return (
    <div className="cluster-analysis-panel">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Title level={4}>空气质量数据聚类分析结果</Title>
            <Paragraph>
              分析时间: {new Date(data.generatedAt).toLocaleString()}
            </Paragraph>
            <Paragraph>
              数据范围: {new Date(data.timeRange.start).toLocaleDateString()} - {new Date(data.timeRange.end).toLocaleDateString()}
            </Paragraph>
            <Paragraph>
              分析方法: {data.algorithm}，聚类数量: {data.clusters.length}
            </Paragraph>
            <Paragraph>
              聚类质量评估:
              <ul>
                <li>轮廓系数: {data.quality.silhouetteScore.toFixed(3)} (越接近1表示聚类效果越好)</li>
                <li>戴维斯-布尔丁指数: {data.quality.daviesBouldinIndex.toFixed(3)} (越小表示聚类效果越好)</li>
              </ul>
            </Paragraph>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="聚类散点图">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio.Group 
                value={selectedDimensions}
                onChange={e => setSelectedDimensions(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="pm25_pm10">PM2.5 vs PM10</Radio.Button>
                <Radio.Button value="pm25_o3">PM2.5 vs O3</Radio.Button>
                <Radio.Button value="aqi_temperature">AQI vs 温度</Radio.Button>
                <Radio.Button value="pm25_humidity">PM2.5 vs 湿度</Radio.Button>
              </Radio.Group>
              
              <ReactECharts 
                option={getScatterOption()}
                style={{ height: '350px' }}
              />
            </Space>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="聚类特征雷达图">
            <ReactECharts 
              option={getRadarOption()}
              style={{ height: '400px' }}
            />
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="聚类特征详情">
            <Table 
              columns={columns}
              dataSource={data.clusters}
              pagination={false}
              rowKey="id"
              bordered
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="聚类分布">
            <ReactECharts 
              option={getPieOption()}
              style={{ height: '350px' }}
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="聚类解读">
            <Collapse defaultActiveKey={['1']}>
              {data.clusters.map((cluster, index) => (
                <Panel header={`聚类${cluster.id} 解读`} key={String(index + 1)}>
                  <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label="站点数量">{cluster.size}个监测站点</Descriptions.Item>
                    <Descriptions.Item label="AQI水平">{cluster.centroid.aqi.toFixed(1)}</Descriptions.Item>
                    <Descriptions.Item label="主要特征">
                      {cluster.characteristics.map(item => (
                        <Tag color="blue" key={item}>{item}</Tag>
                      ))}
                    </Descriptions.Item>
                    <Descriptions.Item label="重点站点">
                      {cluster.stations.slice(0, 3).map(stationId => (
                        <Tag color="green" key={stationId}>{stationId}</Tag>
                      ))}
                      {cluster.stations.length > 3 && <Tag>等{cluster.stations.length}个站点</Tag>}
                    </Descriptions.Item>
                    <Descriptions.Item label="数据解读">
                      <p>
                        该聚类中的监测站点表现出相似的空气质量特征，AQI平均值为{cluster.centroid.aqi.toFixed(1)}，
                        PM2.5平均浓度为{cluster.centroid.pollutants.pm25.toFixed(1)}μg/m³，
                        PM10平均浓度为{cluster.centroid.pollutants.pm10.toFixed(1)}μg/m³。
                      </p>
                      <p>
                        {cluster.characteristics[0] && `这些站点的主要特点是${cluster.characteristics[0]}，`}
                        {cluster.characteristics[1] && `同时表现出${cluster.characteristics[1]}，`}
                        体现了区域内空气质量的共性和地域分布特征。
                      </p>
                    </Descriptions.Item>
                  </Descriptions>
                </Panel>
              ))}
              
              <Panel header="聚类综合分析" key={String(data.clusters.length + 1)}>
                <Paragraph>
                  <Text strong>主要发现：</Text>
                </Paragraph>
                <ul>
                  <li>
                    <Text>
                      通过{data.algorithm}算法，将{data.stationIds.length}个监测站点的空气质量数据分为{data.clusters.length}个聚类。
                    </Text>
                  </li>
                  <li>
                    <Text>
                      最大的聚类是聚类{data.clusters.sort((a, b) => b.size - a.size)[0].id}，
                      包含{data.clusters.sort((a, b) => b.size - a.size)[0].size}个站点，
                      主要特征是"{data.clusters.sort((a, b) => b.size - a.size)[0].characteristics[0]}"。
                    </Text>
                  </li>
                  <li>
                    <Text>
                      AQI值最高的是聚类{data.clusters.sort((a, b) => b.centroid.aqi - a.centroid.aqi)[0].id}，
                      平均AQI为{data.clusters.sort((a, b) => b.centroid.aqi - a.centroid.aqi)[0].centroid.aqi.toFixed(1)}，
                      主要特征是"{data.clusters.sort((a, b) => b.centroid.aqi - a.centroid.aqi)[0].characteristics[0]}"。
                    </Text>
                  </li>
                </ul>
                <Divider />
                <Paragraph>
                  <Text strong>管理建议：</Text>
                </Paragraph>
                <ul>
                  <li>
                    <Text>
                      针对聚类{data.clusters.sort((a, b) => b.centroid.aqi - a.centroid.aqi)[0].id}中的站点，
                      建议重点关注并加强污染控制措施，这些区域可能受到类似污染源的影响。
                    </Text>
                  </li>
                  <li>
                    <Text>
                      不同聚类之间的差异表明，空气质量管理需要因地制宜，针对不同区域的特点采取差异化策略。
                    </Text>
                  </li>
                </ul>
              </Panel>
            </Collapse>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ClusterAnalysisPanel; 