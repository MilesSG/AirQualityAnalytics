import React from 'react';
import { Spin, Empty, List, Badge, Tag } from 'antd';
import { AlertOutlined } from '@ant-design/icons';
import { AirQualityData } from '../../types';

interface AlarmAlertPanelProps {
  data: AirQualityData[];
  loading: boolean;
}

const AlarmAlertPanel: React.FC<AlarmAlertPanelProps> = ({ data, loading }) => {
  // 根据AQI值获取告警等级和信息
  const getAlarmInfo = (aqiData: AirQualityData) => {
    const { aqi, category, dominantPollutant } = aqiData;
    
    // 污染物中文名称映射
    const pollutantNames: Record<string, string> = {
      'pm25': 'PM2.5',
      'pm10': 'PM10',
      'o3': '臭氧(O₃)',
      'no2': '二氧化氮(NO₂)',
      'so2': '二氧化硫(SO₂)',
      'co': '一氧化碳(CO)'
    };
    
    let alarmLevel: 'success' | 'warning' | 'error';
    let alarmTitle: string;
    let alarmMessage: string;
    let recommendations: string[] = [];
    
    if (aqi <= 50) {
      alarmLevel = 'success';
      alarmTitle = '空气质量优';
      alarmMessage = '空气质量令人满意，基本无空气污染。';
      recommendations = ['各类人群可正常活动'];
    } else if (aqi <= 100) {
      alarmLevel = 'success';
      alarmTitle = '空气质量良';
      alarmMessage = '空气质量可接受，但某些污染物可能对少数异常敏感人群健康有较弱影响。';
      recommendations = ['极少数敏感人群应减少户外活动'];
    } else if (aqi <= 150) {
      alarmLevel = 'warning';
      alarmTitle = '轻度污染';
      alarmMessage = `主要污染物为${pollutantNames[dominantPollutant] || dominantPollutant}，可能对敏感人群健康产生影响。`;
      recommendations = [
        '儿童、老人及呼吸系统、心脏病患者应减少长时间、高强度的户外活动'
      ];
    } else if (aqi <= 200) {
      alarmLevel = 'warning';
      alarmTitle = '中度污染';
      alarmMessage = `主要污染物为${pollutantNames[dominantPollutant] || dominantPollutant}，可能对所有人群健康都产生影响。`;
      recommendations = [
        '儿童、老人及心脏病、肺病患者应停止户外活动',
        '一般人群减少户外活动'
      ];
    } else if (aqi <= 300) {
      alarmLevel = 'error';
      alarmTitle = '重度污染';
      alarmMessage = `主要污染物为${pollutantNames[dominantPollutant] || dominantPollutant}，对所有人群健康产生较严重影响。`;
      recommendations = [
        '儿童、老人及患有心脏病、肺病患者应停留在室内，避免体力消耗',
        '一般人群应避免户外活动'
      ];
    } else {
      alarmLevel = 'error';
      alarmTitle = '严重污染';
      alarmMessage = `主要污染物为${pollutantNames[dominantPollutant] || dominantPollutant}，对所有人群健康产生严重影响。`;
      recommendations = [
        '儿童、老人和病人应停留在室内，避免体力消耗',
        '一般人群应避免户外活动'
      ];
    }
    
    return {
      alarmLevel,
      alarmTitle,
      alarmMessage,
      recommendations
    };
  };
  
  // 筛选需要告警的数据（AQI > 100）
  const getAlarmData = () => {
    return data
      .filter(item => item.aqi > 100)
      .sort((a, b) => b.aqi - a.aqi); // 按AQI值降序排序
  };
  
  const alarmData = getAlarmData();
  
  return (
    <div className="panel-container">
      <div className="panel-header">
        <div className="panel-title">
          <AlertOutlined className="panel-title-icon" />
          空气质量预警
          {alarmData.length > 0 && (
            <Badge count={alarmData.length} style={{ marginLeft: 8 }} />
          )}
        </div>
      </div>
      
      <div className="panel-content">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : alarmData.length === 0 ? (
          <Empty description="当前无预警信息" />
        ) : (
          <List
            className="data-list"
            dataSource={alarmData}
            renderItem={item => {
              const { alarmLevel, alarmTitle, alarmMessage, recommendations } = getAlarmInfo(item);
              const stationName = item.stationId;
              
              // 获取对应的告警颜色
              const alertColor = alarmLevel === 'error' ? '#ff4d4f' : 
                              alarmLevel === 'warning' ? '#faad14' : '#52c41a';
              
              return (
                <div className="alert-item" style={{ borderLeftColor: alertColor }}>
                  <div className="alert-title">
                    {stationName} - {alarmTitle} (AQI: {item.aqi})
                  </div>
                  <div className="alert-info">
                    {alarmMessage}
                  </div>
                  <div style={{ marginTop: 5 }}>
                    {recommendations.map((rec, index) => (
                      <Tag key={index} color={alarmLevel}>{rec}</Tag>
                    ))}
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AlarmAlertPanel; 