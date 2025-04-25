import React, { useState } from 'react';
import { Layout, Menu, Typography, Avatar, Badge, Space, Dropdown, Breadcrumb } from 'antd';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  HeartOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { generateAlerts } from '../mock/airQualityData';

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

interface MainLayoutProps {
  children?: React.ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const alerts = generateAlerts();

  // 更新时间
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 获取当前页面路径
  const getPathName = () => {
    const path = location.pathname;
    if (path === '/') return '首页';
    if (path === '/dashboard') return '仪表板';
    if (path === '/map') return '地图可视化';
    if (path === '/historical') return '历史数据分析';
    if (path === '/health') return '健康影响评估';
    return '空气质量分析';
  };

  // 生成面包屑
  const getBreadcrumbItems = () => {
    const items = [{ title: '首页', href: '/' }];
    const path = location.pathname;
    
    if (path === '/dashboard') {
      items.push({ title: '仪表板', href: '/dashboard' });
    } else if (path === '/map') {
      items.push({ title: '地图可视化', href: '/map' });
    } else if (path === '/historical') {
      items.push({ title: '历史数据分析', href: '/historical' });
    } else if (path === '/health') {
      items.push({ title: '健康影响评估', href: '/health' });
    }
    
    return items;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 左侧菜单 */}
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Title level={5} style={{ margin: 0, color: 'white' }}>
            {collapsed ? 'AQA' : '空气质量分析系统'}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[location.pathname.replace('/', '') || 'dashboard']}
          items={[
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: <Link to="/dashboard">仪表板</Link>,
            },
            {
              key: 'map',
              icon: <EnvironmentOutlined />,
              label: <Link to="/map">地图可视化</Link>,
            },
            {
              key: 'historical',
              icon: <HistoryOutlined />,
              label: <Link to="/historical">历史数据分析</Link>,
            },
            {
              key: 'health',
              icon: <HeartOutlined />,
              label: <Link to="/health">健康影响评估</Link>,
            },
          ]}
        />
      </Sider>
      
      <Layout>
        {/* 顶部导航栏 */}
        <Header style={{ padding: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => setCollapsed(!collapsed),
              style: { fontSize: '18px', padding: '0 24px', cursor: 'pointer' }
            })}
            <Breadcrumb items={getBreadcrumbItems()} />
          </div>
          
          <Space size="large" style={{ marginRight: 24 }}>
            <Dropdown
              menu={{
                items: alerts.map(alert => ({
                  key: alert.id,
                  label: alert.message
                })),
              }}
              placement="bottomRight"
            >
              <Badge count={alerts.length} overflowCount={99}>
                <BellOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
              </Badge>
            </Dropdown>
            
            <Dropdown 
              menu={{
                items: [
                  { key: 'profile', label: '个人资料' },
                  { key: 'settings', label: '设置' },
                  { key: 'logout', label: '退出登录' },
                ],
              }}
              placement="bottomRight"
            >
              <Avatar icon={<UserOutlined />} />
            </Dropdown>
            
            <SettingOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
          </Space>
        </Header>
        
        {/* 主内容区 */}
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: '#fff',
            minHeight: 280,
            overflow: 'auto',
          }}
        >
          <Outlet />
          {children}
        </Content>
        
        {/* 底部状态栏 */}
        <Footer style={{ textAlign: 'center', padding: '12px 50px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>空气质量分析系统 ©2023 Created by Your Name</div>
            <div>最后更新: {currentTime}</div>
            <div>在线监测站点: {5} | 活跃告警: {alerts.length}</div>
          </div>
        </Footer>
      </Layout>
    </Layout>
  );
}

export default MainLayout; 