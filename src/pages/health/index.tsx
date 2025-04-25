import React, { useState, useEffect } from 'react';
import { 
  Card, Spin, Row, Col, Select, Slider, Button, 
  Steps, Collapse, Alert, Typography, Tag, Divider, Space,
  List, Radio, Statistic
} from 'antd';
import {
  ExperimentOutlined,
  AlertOutlined,
  MedicineBoxOutlined,
  UserOutlined,
  InfoCircleOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getRealtimeAirQuality, getHealthImpacts } from '../../services/api';
import { AirQualityData, HealthImpact } from '../../types';
import { mockStations } from '../../mock/airQualityData';

const { Option } = Select;
const { Step } = Steps;
const { Panel } = Collapse;
const { Title, Text, Paragraph } = Typography;

// 辅助函数：根据AQI指数返回颜色
function getAqiColor(aqi: number): string {
  if (aqi <= 50) return '#00e400'; // 优
  if (aqi <= 100) return '#ffff00'; // 良
  if (aqi <= 150) return '#ff7e00'; // 轻度污染
  if (aqi <= 200) return '#ff0000'; // 中度污染
  if (aqi <= 300) return '#99004c'; // 重度污染
  return '#7e0023'; // 严重污染
}

// 辅助函数：根据健康风险级别返回颜色
function getRiskColor(level: 'Low' | 'Medium' | 'High' | 'Very High'): string {
  switch (level) {
    case 'Low': return '#00e400';
    case 'Medium': return '#ffff00';
    case 'High': return '#ff7e00';
    case 'Very High': return '#ff0000';
    default: return '#000';
  }
}

// 辅助函数：计算暴露时间对健康的影响
function calculateExposureRisk(aqi: number, hours: number): number {
  // 简化的计算模型：AQI与暴露时间的乘积
  let baseRisk = aqi * hours / 24;
  
  // 考虑AQI非线性影响
  if (aqi > 300) baseRisk *= 1.5;
  else if (aqi > 200) baseRisk *= 1.3;
  else if (aqi > 150) baseRisk *= 1.2;
  else if (aqi > 100) baseRisk *= 1.1;
  
  return Math.min(100, Math.round(baseRisk)); // 最大风险为100%
}

const HealthAssessment: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<string>(mockStations[0].id);
  const [selectedGroup, setSelectedGroup] = useState<string>('General');
  const [exposureHours, setExposureHours] = useState<number>(8);
  const [realtimeData, setRealtimeData] = useState<AirQualityData | null>(null);
  const [healthImpacts, setHealthImpacts] = useState<HealthImpact[]>([]);
  const [activeStep, setActiveStep] = useState<number>(0);

  // 加载实时数据
  useEffect(() => {
    async function fetchRealtimeData() {
      try {
        setLoading(true);
        const response = await getRealtimeAirQuality();
        if (response.success && response.data) {
          const stationData = response.data.find(data => data.stationId === selectedStation);
          if (stationData) {
            setRealtimeData(stationData);
          }
        }
      } catch (error) {
        console.error("获取实时数据失败:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRealtimeData();
  }, [selectedStation]);

  // 加载健康影响数据
  useEffect(() => {
    async function fetchHealthImpacts() {
      if (!realtimeData) return;
      
      try {
        setLoading(true);
        // 获取主要污染物的健康影响
        const pollutant = realtimeData.dominantPollutant;
        const concentration = realtimeData.pollutants[pollutant as keyof typeof realtimeData.pollutants];
        
        const response = await getHealthImpacts(pollutant, concentration, selectedGroup);
        if (response.success && response.data) {
          setHealthImpacts(response.data);
        }
      } catch (error) {
        console.error("获取健康影响数据失败:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHealthImpacts();
  }, [realtimeData, selectedGroup]);

  // 获取污染物单位
  const getPollutantUnit = (pollutant: string): string => {
    if (pollutant === 'pm25' || pollutant === 'pm10') return 'μg/m³';
    if (pollutant === 'co') return 'ppm';
    return 'ppb';
  };

  // 生成人群暴露风险雷达图
  const getExposureRiskRadarOption = () => {
    if (!realtimeData) return {};
    
    const aqi = realtimeData.aqi;
    
    // 不同人群的风险权重
    const populationWeights = {
      'General': 1.0,
      'Children': 1.3,
      'Elderly': 1.25,
      'Respiratory': 1.4,
      'Cardiovascular': 1.35
    };
    
    // 计算不同人群的暴露风险
    const generalRisk = calculateExposureRisk(aqi, exposureHours);
    const childrenRisk = Math.min(100, Math.round(generalRisk * populationWeights['Children']));
    const elderlyRisk = Math.min(100, Math.round(generalRisk * populationWeights['Elderly']));
    const respiratoryRisk = Math.min(100, Math.round(generalRisk * populationWeights['Respiratory']));
    const cardiovascularRisk = Math.min(100, Math.round(generalRisk * populationWeights['Cardiovascular']));
    
    return {
      title: {
        text: '不同人群暴露风险评估',
        left: 'center'
      },
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        data: ['暴露风险 (%)']
      },
      radar: {
        radius: '60%',
        indicator: [
          { name: '一般人群', max: 100 },
          { name: '儿童', max: 100 },
          { name: '老年人', max: 100 },
          { name: '呼吸系统疾病患者', max: 100 },
          { name: '心血管疾病患者', max: 100 }
        ]
      },
      series: [
        {
          name: '暴露风险',
          type: 'radar',
          data: [
            {
              value: [generalRisk, childrenRisk, elderlyRisk, respiratoryRisk, cardiovascularRisk],
              name: '暴露风险 (%)',
              areaStyle: {
                color: 'rgba(255, 99, 71, 0.6)'
              },
              lineStyle: {
                color: 'rgb(255, 99, 71)'
              }
            }
          ]
        }
      ]
    };
  };

  // 生成暴露时间与风险关系图
  const getExposureTimeRiskOption = () => {
    if (!realtimeData) return {};
    
    const aqi = realtimeData.aqi;
    const hours = [1, 2, 4, 6, 8, 12, 24];
    const risks = hours.map(hour => calculateExposureRisk(aqi, hour));
    
    return {
      title: {
        text: '暴露时间与健康风险关系',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}小时: {c}%'
      },
      xAxis: {
        type: 'category',
        data: hours.map(h => `${h}h`),
        name: '暴露时间 (小时)'
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        name: '风险指数 (%)'
      },
      series: [
        {
          name: '风险指数',
          type: 'line',
          smooth: true,
          data: risks,
          markPoint: {
            data: [
              { type: 'max', name: '最大值' }
            ]
          },
          markLine: {
            data: [
              { type: 'average', name: '平均值' },
              { yAxis: 50, name: '中等风险', lineStyle: { color: '#ff7e00' } }
            ]
          },
          lineStyle: {
            color: '#ff4500'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255,69,0,0.7)' },
                { offset: 1, color: 'rgba(255,69,0,0.1)' }
              ]
            }
          }
        }
      ]
    };
  };

  // 获取当前选择的站点信息
  const getSelectedStationName = () => {
    const station = mockStations.find(s => s.id === selectedStation);
    return station ? station.name : '';
  };

  // 获取AQI健康提示
  const getAqiHealthTips = () => {
    if (!realtimeData) return [];
    
    const aqi = realtimeData.aqi;
    if (aqi <= 50) {
      return [
        '空气质量令人满意，基本无空气污染',
        '各类人群可正常活动'
      ];
    } else if (aqi <= 100) {
      return [
        '空气质量可接受，但某些污染物可能对极少数异常敏感人群健康有较弱影响',
        '极少数异常敏感人群应减少户外活动'
      ];
    } else if (aqi <= 150) {
      return [
        '空气质量轻度污染，可能对敏感人群健康有轻微影响',
        '儿童、老人及心脏病、呼吸系统疾病患者应减少长时间、高强度的户外锻炼'
      ];
    } else if (aqi <= 200) {
      return [
        '空气质量中度污染，可能对敏感人群健康有影响，对健康人群的舒适度有一定影响',
        '儿童、老人及心脏病、呼吸系统疾病患者应避免长时间、高强度的户外锻炼，一般人群应适量减少户外活动'
      ];
    } else if (aqi <= 300) {
      return [
        '空气质量重度污染，对敏感人群健康有较大影响，对健康人群的舒适度有明显影响',
        '儿童、老人及心脏病、呼吸系统疾病患者应停留在室内，避免户外活动，一般人群应避免户外运动，尽量减少户外活动'
      ];
    } else {
      return [
        '空气质量严重污染，对所有人群的健康都会产生严重影响，可能导致提前死亡',
        '儿童、老人及心脏病、呼吸系统疾病患者应当留在室内，并减少活动，一般人群应当尽量避免户外活动'
      ];
    }
  };

  // 获取推荐的健康措施
  const getRecommendedMeasures = () => {
    if (!realtimeData) return [];
    
    const aqi = realtimeData.aqi;
    const basicMeasures = [
      '关注空气质量指数变化',
      '保持良好的个人卫生习惯'
    ];
    
    if (aqi <= 100) {
      return [
        ...basicMeasures,
        '正常进行户外活动'
      ];
    } else if (aqi <= 150) {
      return [
        ...basicMeasures,
        '敏感人群减少户外锻炼',
        '外出时佩戴普通口罩',
        '关闭门窗，开启空气净化器'
      ];
    } else if (aqi <= 200) {
      return [
        ...basicMeasures,
        '减少户外活动',
        '外出时佩戴专业防霾口罩',
        '关闭门窗，开启空气净化器',
        '回家后清洗面部和裸露的皮肤'
      ];
    } else {
      return [
        ...basicMeasures,
        '避免户外活动',
        '外出必须佩戴N95或更高级别口罩',
        '密闭门窗，开启空气净化器',
        '考虑使用加湿器增加室内湿度',
        '多喝水，多食用富含维生素的食物',
        '如出现不适症状，及时就医'
      ];
    }
  };

  return (
    <div className="health-assessment">
      <Spin spinning={loading && !realtimeData}>
        <Card>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Steps current={activeStep} onChange={setActiveStep}>
                <Step 
                  title="当前空气质量" 
                  description="查看实时数据" 
                  icon={<AlertOutlined />} 
                />
                <Step 
                  title="健康影响评估" 
                  description="了解潜在风险" 
                  icon={<MedicineBoxOutlined />} 
                />
                <Step 
                  title="暴露风险计算" 
                  description="评估暴露时间影响" 
                  icon={<ClockCircleOutlined />} 
                />
                <Step 
                  title="保护建议" 
                  description="预防措施推荐" 
                  icon={<SafetyOutlined />} 
                />
              </Steps>
            </Col>
            
            <Col span={24}>
              <Card>
                {/* 第一步：当前空气质量 */}
                {activeStep === 0 && realtimeData && (
                  <div>
                    <Title level={4}>当前空气质量状况</Title>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <Card>
                          <Statistic
                            title={`${getSelectedStationName()}当前AQI`}
                            value={realtimeData.aqi}
                            valueStyle={{ color: getAqiColor(realtimeData.aqi) }}
                            suffix={realtimeData.category}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <Card>
                          <Statistic
                            title="主要污染物"
                            value={realtimeData.dominantPollutant.toUpperCase()}
                            valueStyle={{ color: '#cf1322' }}
                            suffix={`${realtimeData.pollutants[realtimeData.dominantPollutant as keyof typeof realtimeData.pollutants]} ${getPollutantUnit(realtimeData.dominantPollutant)}`}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <Card>
                          <Statistic
                            title="PM2.5浓度"
                            value={realtimeData.pollutants.pm25}
                            suffix="μg/m³"
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <Card>
                          <Statistic
                            title="更新时间"
                            value={new Date(realtimeData.timestamp).toLocaleString()}
                          />
                        </Card>
                      </Col>
                    </Row>
                    
                    <Divider />
                    
                    <Alert
                      message="健康提示"
                      description={getAqiHealthTips().map((tip, index) => (
                        <p key={index}>{tip}</p>
                      ))}
                      type={realtimeData.aqi > 150 ? "warning" : realtimeData.aqi > 100 ? "info" : "success"}
                      showIcon
                    />
                    
                    <div style={{ marginTop: 16, textAlign: 'right' }}>
                      <Button type="primary" onClick={() => setActiveStep(1)}>
                        下一步：查看健康影响
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* 第二步：健康影响评估 */}
                {activeStep === 1 && realtimeData && (
                  <div>
                    <Title level={4}>健康影响评估</Title>
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <Space>
                          <Text strong>选择人群:</Text>
                          <Radio.Group value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
                            <Radio.Button value="General">一般人群</Radio.Button>
                            <Radio.Button value="Children">儿童</Radio.Button>
                            <Radio.Button value="Elderly">老年人</Radio.Button>
                            <Radio.Button value="Respiratory">呼吸系统疾病患者</Radio.Button>
                            <Radio.Button value="Cardiovascular">心血管疾病患者</Radio.Button>
                          </Radio.Group>
                        </Space>
                      </Col>
                      
                      <Col span={24}>
                        <Collapse defaultActiveKey={['1']} accordion>
                          {healthImpacts.map((impact, index) => (
                            <Panel 
                              header={
                                <Space>
                                  <ExperimentOutlined />
                                  <span>{impact.pollutant.toUpperCase()} 健康影响评估</span>
                                  <Tag color={getRiskColor(impact.riskLevel)}>{impact.riskLevel}</Tag>
                                </Space>
                              } 
                              key={String(index + 1)}
                            >
                              <Row gutter={[16, 16]}>
                                <Col span={24}>
                                  <Title level={5}>短期健康影响</Title>
                                  <List
                                    bordered
                                    dataSource={impact.shortTermEffects}
                                    renderItem={item => (
                                      <List.Item>
                                        <Text>{item}</Text>
                                      </List.Item>
                                    )}
                                  />
                                </Col>
                                
                                <Col span={24}>
                                  <Title level={5}>长期健康影响</Title>
                                  <List
                                    bordered
                                    dataSource={impact.longTermEffects}
                                    renderItem={item => (
                                      <List.Item>
                                        <Text>{item}</Text>
                                      </List.Item>
                                    )}
                                  />
                                </Col>
                                
                                <Col span={24}>
                                  <Title level={5}>建议措施</Title>
                                  <List
                                    bordered
                                    dataSource={impact.recommendations}
                                    renderItem={item => (
                                      <List.Item>
                                        <Text>{item}</Text>
                                      </List.Item>
                                    )}
                                  />
                                </Col>
                              </Row>
                            </Panel>
                          ))}
                        </Collapse>
                      </Col>
                    </Row>
                    
                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                      <Button onClick={() => setActiveStep(0)}>
                        上一步：当前空气质量
                      </Button>
                      <Button type="primary" onClick={() => setActiveStep(2)}>
                        下一步：暴露风险计算
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* 第三步：暴露风险计算 */}
                {activeStep === 2 && realtimeData && (
                  <div>
                    <Title level={4}>暴露风险计算</Title>
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Text strong>暴露时间 (小时):</Text>
                          <Slider
                            min={1}
                            max={24}
                            value={exposureHours}
                            onChange={setExposureHours}
                            marks={{
                              1: '1h',
                              8: '8h',
                              16: '16h',
                              24: '24h'
                            }}
                          />
                        </Space>
                      </Col>
                      
                      <Col xs={24} md={12}>
                        <ReactECharts option={getExposureRiskRadarOption()} style={{ height: 400 }} />
                      </Col>
                      
                      <Col xs={24} md={12}>
                        <ReactECharts option={getExposureTimeRiskOption()} style={{ height: 400 }} />
                      </Col>
                      
                      <Col span={24}>
                        <Alert
                          message="暴露风险分析"
                          description={
                            <div>
                              <Paragraph>
                                当前AQI为 <Text strong>{realtimeData.aqi}</Text>，暴露时间为 <Text strong>{exposureHours}</Text> 小时。
                              </Paragraph>
                              <Paragraph>
                                一般人群暴露风险指数为 <Text strong>{calculateExposureRisk(realtimeData.aqi, exposureHours)}%</Text>。
                              </Paragraph>
                              <Paragraph>
                                <InfoCircleOutlined /> 暴露风险随着AQI值和暴露时间的增加而增加。减少户外活动时间可以有效降低健康风险。
                              </Paragraph>
                            </div>
                          }
                          type="info"
                          showIcon
                        />
                      </Col>
                    </Row>
                    
                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                      <Button onClick={() => setActiveStep(1)}>
                        上一步：健康影响评估
                      </Button>
                      <Button type="primary" onClick={() => setActiveStep(3)}>
                        下一步：保护建议
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* 第四步：保护建议 */}
                {activeStep === 3 && realtimeData && (
                  <div>
                    <Title level={4}>保护建议</Title>
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <Alert
                          message={`当前空气质量: ${realtimeData.category} (AQI ${realtimeData.aqi})`}
                          description="根据当前空气质量状况，我们提供以下健康保护建议："
                          type={realtimeData.aqi > 150 ? "warning" : realtimeData.aqi > 100 ? "info" : "success"}
                          showIcon
                        />
                      </Col>
                      
                      <Col span={24}>
                        <Title level={5}>推荐保护措施</Title>
                        <List
                          bordered
                          dataSource={getRecommendedMeasures()}
                          renderItem={item => (
                            <List.Item>
                              <Text>{item}</Text>
                            </List.Item>
                          )}
                        />
                      </Col>
                      
                      <Col span={24}>
                        <Title level={5}>不同人群建议</Title>
                        <Collapse defaultActiveKey={['1']}>
                          <Panel header={<Space><UserOutlined /> 一般人群</Space>} key="1">
                            <Paragraph>
                              {realtimeData.aqi <= 100 ? (
                                "可以正常进行户外活动，享受户外时光。"
                              ) : realtimeData.aqi <= 150 ? (
                                "可以适度进行户外活动，但避免长时间高强度运动。"
                              ) : realtimeData.aqi <= 200 ? (
                                "建议减少户外活动，户外活动时佩戴口罩，回家后及时清洁面部和裸露的皮肤。"
                              ) : (
                                "建议尽量避免户外活动，必须外出时佩戴专业防霾口罩，缩短户外停留时间。"
                              )}
                            </Paragraph>
                          </Panel>
                          
                          <Panel header={<Space><TeamOutlined /> 敏感人群 (儿童、老人、孕妇)</Space>} key="2">
                            <Paragraph>
                              {realtimeData.aqi <= 100 ? (
                                "可以适度进行户外活动，但注意避免在交通高峰期出行。"
                              ) : realtimeData.aqi <= 150 ? (
                                "建议减少户外活动，尤其是高强度运动，外出时佩戴口罩。"
                              ) : (
                                "建议留在室内，避免户外活动，保持室内空气清新，开启空气净化设备。"
                              )}
                            </Paragraph>
                          </Panel>
                          
                          <Panel header={<Space><MedicineBoxOutlined /> 呼吸系统和心血管疾病患者</Space>} key="3">
                            <Paragraph>
                              {realtimeData.aqi <= 100 ? (
                                "可以适度进行户外活动，但应随身携带相关药物，注意观察身体反应。"
                              ) : (
                                "建议留在室内，避免户外活动，保持室内空气清新，开启空气净化设备，随身携带急救药物，如有不适及时就医。"
                              )}
                            </Paragraph>
                          </Panel>
                        </Collapse>
                      </Col>
                    </Row>
                    
                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                      <Button onClick={() => setActiveStep(2)}>
                        上一步：暴露风险计算
                      </Button>
                      <Button type="primary" onClick={() => setActiveStep(0)}>
                        返回首页
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </Card>
      </Spin>
    </div>
  );
};

export default HealthAssessment; 