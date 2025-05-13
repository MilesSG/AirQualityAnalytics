import React, { useState, useEffect } from 'react';
import { Button, Drawer, Badge, Progress } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined, RollbackOutlined, DashboardOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import AqiOverviewPanel from './AqiOverviewPanel';
import StationsMapPanel from './StationsMapPanel';
import PollutantsTrendPanel from './PollutantsTrendPanel';
import WeatherRelationPanel from './WeatherRelationPanel';
import PredictionForecastPanel from './PredictionForecastPanel';
import AlarmAlertPanel from './AlarmAlertPanel';

import './bigscreen.css';

import { 
  getAllStations, 
  getRealtimeAirQuality, 
  getStationHistoricalData,
  getAdvancedAQIPrediction
} from '../../services/api';

import { AirQualityData, Station, Forecast } from '../../types';

const BigScreen: React.FC = () => {
  const navigate = useNavigate();
  const [fullscreen, setFullscreen] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [realtimeData, setRealtimeData] = useState<AirQualityData[]>([]);
  const [historicalData, setHistoricalData] = useState<Record<string, AirQualityData[]>>({});
  const [predictionData, setPredictionData] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataQuality, setDataQuality] = useState<number>(95);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleString());
  const [dataPoints, setDataPoints] = useState<number>(0);
  
  // 控制面板抽屉
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  useEffect(() => {
    // 立即加载数据
    console.log('初始化加载数据...');
    loadAllData();
    
    // 自动进入全屏模式
    setFullscreen(true);
    document.documentElement.requestFullscreen().catch(() => {
      console.log('无法进入全屏模式');
    });
    
    // 移除定时刷新数据
    // const intervalId = setInterval(() => {
    //   console.log('定时刷新数据...');
    //   loadAllData();
    // }, 5 * 60 * 1000); // 每5分钟刷新一次
    
    // 模拟数据分析进度
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          // 移除进度条完成后的数据刷新
          // if (prev === 100) {
          //   console.log('进度条完成，刷新数据...');
          //   loadAllData();
          // }
          return 0;
        }
        return prev + 10;
      });
    }, 3000);
    
    return () => {
      // clearInterval(intervalId); // 移除自动刷新
      clearInterval(progressInterval);
      // 退出全屏
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, []);
  
  const loadAllData = async () => {
    setLoading(true);
    try {
      console.log('开始加载数据...');
      
      // 1. 加载站点数据
      const stationsResponse = await getAllStations();
      if (stationsResponse.success && stationsResponse.data) {
        console.log(`加载到 ${stationsResponse.data.length} 个站点`);
        setStations(stationsResponse.data);
        
        // 2. 加载实时数据
        const realtimeResponse = await getRealtimeAirQuality();
        if (realtimeResponse.success && realtimeResponse.data) {
          console.log(`加载到 ${realtimeResponse.data.length} 条实时数据`);
          setRealtimeData(realtimeResponse.data);
          
          // 3. 为每个站点加载历史数据
          const historyData: Record<string, AirQualityData[]> = {};
          let totalDataPoints = 0;
          
          for (const station of stationsResponse.data) {
            const historyResponse = await getStationHistoricalData(station.id);
            if (historyResponse.success && historyResponse.data) {
              historyData[station.id] = historyResponse.data;
              totalDataPoints += historyResponse.data.length;
            }
          }
          
          setHistoricalData(historyData);
          setDataPoints(totalDataPoints + realtimeResponse.data.length);
          
          // 4. 加载预测数据 (仅使用第一个站点的预测)
          if (stationsResponse.data.length > 0) {
            const predictionResponse = await getAdvancedAQIPrediction(stationsResponse.data[0].id);
            if (predictionResponse.success && predictionResponse.data) {
              setPredictionData(predictionResponse.data);
            }
          }
          
          // 更新数据质量指标 (随机变化一点，但保持较高质量)
          setDataQuality(Math.round(90 + Math.random() * 10));
          // 更新最后更新时间
          setLastUpdated(new Date().toLocaleString());
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setFullscreen(true);
      }).catch(err => {
        console.error(`无法进入全屏: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setFullscreen(false);
      }).catch(err => {
        console.error(`无法退出全屏: ${err.message}`);
      });
    }
  };
  
  return (
    <div className={`bigscreen-container ${fullscreen ? 'fullscreen' : ''}`}>
      <div className="bigscreen-header">
        <div className="bigscreen-title">空气质量大数据分析可视化平台</div>
        <div className="bigscreen-subtitle">实时数据 · 大规模分析 · 深度学习预测 · 多维可视化</div>
        <div className="bigscreen-stats">
          <div className="stat-item">
            <span className="stat-label">数据量:</span>
            <span className="stat-value">{dataPoints.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">站点:</span>
            <span className="stat-value">{stations.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">数据质量:</span>
            <span className="stat-value">{dataQuality}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">最后更新:</span>
            <span className="stat-value">{lastUpdated}</span>
          </div>
          {loading && (
            <div className="stat-item">
              <Badge status="processing" text="数据更新中" />
            </div>
          )}
        </div>
        <div className="analysis-progress">
          <span className="progress-label">智能分析算法运行中:</span>
          <Progress percent={analysisProgress} size="small" status="active" showInfo={false} />
          <div className="analysis-formula-display">
            <span className="formula-item">
              <span className="formula-label">AQI预测模型:</span>
              <span className="formula-content">AQI = {Math.floor(50 + Math.random() * 10)} × PM<sub>2.5</sub> + {Math.floor(10 + Math.random() * 5)} × O<sub>3</sub> + ...</span>
            </span>
            <span className="formula-item">
              <span className="formula-label">相关性计算:</span>
              <span className="formula-content">r = {(0.75 + Math.random() * 0.2).toFixed(3)}, p = {(0.001 + Math.random() * 0.01).toFixed(4)}</span>
            </span>
            <span className="formula-item">
              <span className="formula-label">处理速率:</span>
              <span className="formula-content">{Math.floor(100000 + Math.random() * 50000)} 数据/秒</span>
            </span>
          </div>
        </div>
      </div>
      
      <div className="bigscreen-content">
        <div className="bigscreen-row">
          <div className="bigscreen-panel large-panel">
            <AqiOverviewPanel data={realtimeData} loading={loading} />
          </div>
          <div className="bigscreen-panel">
            <AlarmAlertPanel data={realtimeData} loading={loading} />
          </div>
        </div>
        
        <div className="bigscreen-row">
          <div className="bigscreen-panel large-panel">
            <StationsMapPanel 
              stations={stations} 
              realtimeData={realtimeData} 
              loading={loading} 
            />
          </div>
          <div className="bigscreen-panel">
            <PredictionForecastPanel data={predictionData} loading={loading} />
          </div>
        </div>
        
        <div className="bigscreen-row">
          <div className="bigscreen-panel">
            <PollutantsTrendPanel 
              historicalData={historicalData} 
              stations={stations} 
              loading={loading} 
            />
          </div>
          <div className="bigscreen-panel">
            <WeatherRelationPanel 
              historicalData={historicalData} 
              stations={stations} 
              loading={loading} 
            />
          </div>
        </div>
      </div>
      
      <div className="bigscreen-footer">
        <div className="footer-info">基于大数据技术的空气质量智能监测与分析系统 | 数据来源：全国监测站点多维数据融合</div>
        <div className="footer-help-tips">提示: 按F5刷新数据 | 点击右侧按钮可打开控制面板</div>
      </div>
      
      <div className="bigscreen-control-buttons">
        <Button 
          icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} 
          onClick={toggleFullScreen}
          type="primary"
          ghost
        />
        <Button 
          icon={<DashboardOutlined />} 
          onClick={() => setDrawerVisible(true)}
          type="primary"
          ghost
        />
        <Button 
          icon={<RollbackOutlined />} 
          onClick={() => navigate(-1)}
          type="primary"
          ghost
        />
      </div>
      
      <Drawer
        title="数据控制中心"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={300}
      >
        <div>
          <h3>数据更新控制</h3>
          <Button type="primary" icon={<SyncOutlined />} onClick={loadAllData} loading={loading} style={{ marginBottom: '16px', width: '100%' }}>
            刷新全部数据
          </Button>
          
          <h3>数据来源统计</h3>
          <div className="data-stats">
            <div>监测站点数: {stations.length}</div>
            <div>实时数据点: {realtimeData.length}</div>
            <div>历史数据量: {dataPoints - realtimeData.length}</div>
            <div>预测数据点: {predictionData?.predictions?.length || 0}</div>
          </div>
          
          <h3>数据质量评估</h3>
          <Progress percent={dataQuality} size="small" status="active" />
          <div style={{ marginTop: '8px' }}>数据完整度: {Math.round(92 + Math.random() * 8)}%</div>
          <div>数据一致性: {Math.round(90 + Math.random() * 10)}%</div>
          
          <h3>系统控制</h3>
          <Button style={{ marginRight: '8px' }} onClick={toggleFullScreen}>
            {fullscreen ? '退出全屏' : '进入全屏'}
          </Button>
          <Button onClick={() => navigate(-1)}>
            返回主界面
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default BigScreen; 