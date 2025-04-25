import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/lib/locale/zh_CN'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/dashboard'
import MapVisualization from './pages/map'
import HistoricalAnalysis from './pages/historical'
import HealthAssessment from './pages/health'

import './style.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="map" element={<MapVisualization />} />
            <Route path="historical" element={<HistoricalAnalysis />} />
            <Route path="health" element={<HealthAssessment />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
)