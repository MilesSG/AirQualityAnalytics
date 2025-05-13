import React, { useEffect } from 'react';
import { Spin, Empty } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { Station, AirQualityData } from '../../types';

// 导入中国地图JSON数据
// @ts-ignore
import chinaJson from '../../assets/china.json';

interface StationsMapPanelProps {
  stations: Station[];
  realtimeData: AirQualityData[];
  loading: boolean;
}

const StationsMapPanel: React.FC<StationsMapPanelProps> = ({ 
  stations, 
  realtimeData, 
  loading 
}) => {
  
  // 注册中国地图数据
  useEffect(() => {
    echarts.registerMap('china', chinaJson);
  }, []);
  
  // 获取地图配置
  const getMapOption = () => {
    // 合并站点数据和实时数据
    const stationData = stations.map(station => {
      const aqiData = realtimeData.find(data => data.stationId === station.id);
      return {
        ...station,
        aqi: aqiData?.aqi || 0,
        category: aqiData?.category || 'Good'
      };
    });

    // 获取AQI类别对应的颜色
    const getCategoryColor = (category: string) => {
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

    // 获取AQI类别的中文名称
    const getCategoryName = (category: string) => {
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

    // 准备散点数据
    const scatterData = stationData.map(station => ({
      name: station.name,
      value: [
        station.location.longitude,
        station.location.latitude,
        station.aqi
      ],
      itemStyle: {
        color: getCategoryColor(station.category)
      },
      category: station.category,
      stationId: station.id,
      address: station.location.address,
      district: station.location.district,
      city: station.location.city
    }));

    return {
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.2,
        center: [104.5, 38],
        itemStyle: {
          areaColor: '#323c48',
          borderColor: '#111'
        },
        emphasis: {
          itemStyle: {
            areaColor: '#2a333d'
          }
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const data = params.data;
          if (!data) return '';
          
          return `
            <div style="font-weight:bold;">${data.name}</div>
            <div>AQI: ${data.value[2]}</div>
            <div>级别: ${getCategoryName(data.category)}</div>
            <div>地址: ${data.address}</div>
            <div>区域: ${data.district}, ${data.city}</div>
          `;
        }
      },
      visualMap: {
        type: 'piecewise',
        left: 'right',
        top: 'bottom',
        min: 0,
        max: 300,
        splitNumber: 6,
        pieces: [
          {min: 0, max: 50, label: '优', color: '#00e400'},
          {min: 51, max: 100, label: '良', color: '#ffff00'},
          {min: 101, max: 150, label: '轻度污染', color: '#ff7e00'},
          {min: 151, max: 200, label: '中度污染', color: '#ff0000'},
          {min: 201, max: 300, label: '重度污染', color: '#99004c'},
          {min: 301, max: 500, label: '严重污染', color: '#7e0023'}
        ],
        textStyle: {
          color: '#fff'
        }
      },
      series: [
        {
          name: '站点AQI',
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: scatterData,
          symbolSize: (val: number[]) => Math.min(val[2] / 5 + 10, 30),
          showEffectOn: 'render',
          rippleEffect: {
            brushType: 'stroke'
          },
          hoverAnimation: true,
          zlevel: 1
        }
      ]
    };
  };

  return (
    <div className="panel-container">
      <div className="panel-header">
        <div className="panel-title">
          <EnvironmentOutlined className="panel-title-icon" />
          监测站点分布
        </div>
      </div>
      
      <div className="panel-content">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : stations.length === 0 ? (
          <Empty description="暂无站点数据" />
        ) : (
          <ReactECharts 
            option={getMapOption()} 
            style={{ height: '100%', width: '100%' }}
            theme="dark"
            className="map-container"
          />
        )}
      </div>
    </div>
  );
};

export default StationsMapPanel; 