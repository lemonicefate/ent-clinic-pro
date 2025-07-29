# 監控指南

## 📋 概述

本指南詳細說明 Astro Clinical Platform 的監控系統設置、指標收集、警報配置和故障排除流程，確保系統的可觀測性和穩定運行。

## 🎯 監控目標

### 關鍵指標 (KPIs)
- **可用性**: 99.9% 正常運行時間
- **效能**: 頁面載入時間 < 2秒
- **響應時間**: API 響應 < 500ms
- **錯誤率**: < 0.1% 錯誤率
- **使用者體驗**: Core Web Vitals 達標

### 監控層級
1. **基礎設施監控**: 伺服器、網路、儲存
2. **應用程式監控**: 效能、錯誤、使用者體驗
3. **業務監控**: 計算機使用率、使用者行為
4. **安全監控**: 威脅檢測、合規性

## 🔧 監控架構

### 系統架構圖
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │────│   Prometheus    │────│    Grafana      │
│   (Metrics)     │    │   (Collection)  │    │  (Visualization)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   AlertManager  │              │
         └──────────────│   (Alerting)    │──────────────┘
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │  Notification   │
                        │   Services      │
                        └─────────────────┘
```

### 技術堆疊
- **指標收集**: Prometheus
- **視覺化**: Grafana
- **警報管理**: AlertManager
- **日誌聚合**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **錯誤追蹤**: Sentry
- **正常運行時間監控**: UptimeRobot
- **效能監控**: New Relic / DataDog

## 📊 指標收集

### 應用程式指標
```javascript
// metrics.js
import client from 'prom-client';

// 創建指標註冊表
const register = new client.Registry();

// HTTP 請求指標
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// 計算機使用指標
const calculatorUsage = new client.Counter({
  name: 'calculator_usage_total',
  help: 'Total number of calculator calculations',
  labelNames: ['calculator_type', 'specialty']
});

const calculatorErrors = new client.Counter({
  name: 'calculator_errors_total',
  help: 'Total number of calculator errors',
  labelNames: ['calculator_type', 'error_type']
});

// 資料庫指標
const dbConnectionsActive = new client.Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections'
});

const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5]
});

// 註冊指標
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(calculatorUsage);
register.registerMetric(calculatorErrors);
register.registerMetric(dbConnectionsActive);
register.registerMetric(dbQueryDuration);

export {
  register,
  httpRequestDuration,
  httpRequestsTotal,
  calculatorUsage,
  calculatorErrors,
  dbConnectionsActive,
  dbQueryDuration
};
```

### 中介軟體設置
```javascript
// monitoring-middleware.js
import { httpRequestDuration, httpRequestsTotal } from './metrics.js';

export function monitoringMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode.toString();
    
    // 記錄請求持續時間
    httpRequestDuration
      .labels(method, route, statusCode)
      .observe(duration);
    
    // 記錄請求總數
    httpRequestsTotal
      .labels(method, route, statusCode)
      .inc();
  });
  
  next();
}
```

### 指標端點
```javascript
// src/pages/api/metrics.ts
import type { APIRoute } from 'astro';
import { register } from '../../utils/metrics.js';

export const GET: APIRoute = async () => {
  try {
    const metrics = await register.metrics();
    return new Response(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType
      }
    });
  } catch (error) {
    return new Response('Error generating metrics', {
      status: 500
    });
  }
};
```

## 🎨 Grafana 儀表板

### 主要儀表板配置
```json
{
  "dashboard": {
    "id": null,
    "title": "Astro Clinical Platform - Overview",
    "tags": ["astro", "clinical", "overview"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "System Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"astro-clinical-platform\"}",
            "legendFormat": "Application Status"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "green", "value": 1}
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "id": 3,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "id": 4,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])",
            "legendFormat": "5xx Errors"
          },
          {
            "expr": "rate(http_requests_total{status_code=~\"4..\"}[5m])",
            "legendFormat": "4xx Errors"
          }
        ]
      },
      {
        "id": 5,
        "title": "Calculator Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(calculator_usage_total[5m])",
            "legendFormat": "{{calculator_type}}"
          }
        ]
      },
      {
        "id": 6,
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "db_connections_active",
            "legendFormat": "Active Connections"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

### 專科儀表板
```json
{
  "dashboard": {
    "title": "Medical Calculators - Usage Analytics",
    "panels": [
      {
        "title": "Calculator Usage by Specialty",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum by (specialty) (rate(calculator_usage_total[1h]))",
            "legendFormat": "{{specialty}}"
          }
        ]
      },
      {
        "title": "Most Popular Calculators",
        "type": "table",
        "targets": [
          {
            "expr": "topk(10, sum by (calculator_type) (rate(calculator_usage_total[24h])))",
            "format": "table"
          }
        ]
      },
      {
        "title": "Calculator Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(calculator_errors_total[5m]) / rate(calculator_usage_total[5m])",
            "legendFormat": "{{calculator_type}}"
          }
        ]
      }
    ]
  }
}
```

## 🚨 警報配置

### AlertManager 配置
```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@your-domain.com'
  smtp_auth_username: 'alerts@your-domain.com'
  smtp_auth_password: 'your-app-password'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
    - match:
        severity: warning
      receiver: 'warning-alerts'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://localhost:5001/'

  - name: 'critical-alerts'
    email_configs:
      - to: 'oncall@your-domain.com'
        subject: '🚨 Critical Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts'
        title: '🚨 Critical Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

  - name: 'warning-alerts'
    email_configs:
      - to: 'team@your-domain.com'
        subject: '⚠️ Warning: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}
```

### 警報規則
```yaml
# alert-rules.yml
groups:
  - name: astro-clinical-platform.rules
    rules:
      # 應用程式可用性
      - alert: ApplicationDown
        expr: up{job="astro-clinical-platform"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Application is down"
          description: "The Astro Clinical Platform application has been down for more than 1 minute."

      # 高響應時間
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"

      # 高錯誤率
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      # 計算機錯誤率高
      - alert: CalculatorHighErrorRate
        expr: rate(calculator_errors_total[5m]) / rate(calculator_usage_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High calculator error rate"
          description: "Calculator {{ $labels.calculator_type }} error rate is {{ $value | humanizePercentage }}"

      # 資料庫連接數高
      - alert: DatabaseConnectionsHigh
        expr: db_connections_active > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "Database has {{ $value }} active connections"

      # 磁碟空間不足
      - alert: DiskSpaceHigh
        expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Disk space usage high"
          description: "Disk usage is {{ $value | humanizePercentage }}"

      # 記憶體使用率高
      - alert: MemoryUsageHigh
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Memory usage high"
          description: "Memory usage is {{ $value | humanizePercentage }}"

      # SSL 憑證即將過期
      - alert: SSLCertificateExpiringSoon
        expr: probe_ssl_earliest_cert_expiry - time() < 86400 * 30
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "SSL certificate expiring soon"
          description: "SSL certificate for {{ $labels.instance }} expires in {{ $value | humanizeDuration }}"
```

## 📋 日誌管理

### 日誌配置
```javascript
// logger.js
import winston from 'winston';
import 'winston-daily-rotate-file';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'astro-clinical-platform',
    version: process.env.npm_package_version
  },
  transports: [
    // 控制台輸出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // 檔案輸出 - 錯誤日誌
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    
    // 檔案輸出 - 所有日誌
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

// 生產環境不輸出到控制台
if (process.env.NODE_ENV === 'production') {
  logger.remove(winston.transports.Console);
}

export default logger;
```

### 結構化日誌
```javascript
// structured-logging.js
import logger from './logger.js';

export class StructuredLogger {
  static logCalculatorUsage(calculatorType, specialty, userId, duration) {
    logger.info('Calculator usage', {
      event: 'calculator_used',
      calculator_type: calculatorType,
      specialty: specialty,
      user_id: userId,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    });
  }

  static logError(error, context = {}) {
    logger.error('Application error', {
      event: 'error',
      error_message: error.message,
      error_stack: error.stack,
      context: context,
      timestamp: new Date().toISOString()
    });
  }

  static logPerformance(operation, duration, metadata = {}) {
    logger.info('Performance metric', {
      event: 'performance',
      operation: operation,
      duration_ms: duration,
      metadata: metadata,
      timestamp: new Date().toISOString()
    });
  }

  static logSecurityEvent(eventType, details) {
    logger.warn('Security event', {
      event: 'security',
      event_type: eventType,
      details: details,
      timestamp: new Date().toISOString()
    });
  }
}
```

### ELK Stack 配置
```yaml
# logstash.conf
input {
  file {
    path => "/var/log/astro-clinical-platform/*.log"
    start_position => "beginning"
    codec => "json"
  }
}

filter {
  if [service] == "astro-clinical-platform" {
    mutate {
      add_field => { "environment" => "${NODE_ENV:development}" }
    }
    
    if [event] == "calculator_used" {
      mutate {
        add_tag => ["calculator", "usage"]
      }
    }
    
    if [level] == "error" {
      mutate {
        add_tag => ["error", "alert"]
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "astro-clinical-platform-%{+YYYY.MM.dd}"
  }
  
  if "alert" in [tags] {
    http {
      url => "http://alertmanager:9093/api/v1/alerts"
      http_method => "post"
      format => "json"
    }
  }
}
```

## 🔍 錯誤追蹤

### Sentry 配置
```javascript
// sentry.config.js
import * as Sentry from '@sentry/astro';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // 效能監控
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // 會話重播
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // 整合
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', /^https:\/\/your-domain\.com\/api/]
    }),
    new Sentry.Replay()
  ],
  
  // 錯誤過濾
  beforeSend(event, hint) {
    // 過濾掉已知的非關鍵錯誤
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message && error.message.includes('Non-Error promise rejection')) {
        return null;
      }
    }
    return event;
  },
  
  // 標籤和上下文
  initialScope: {
    tags: {
      component: 'astro-clinical-platform'
    },
    user: {
      id: 'anonymous'
    }
  }
});
```

### 錯誤邊界
```tsx
// ErrorBoundary.tsx
import React from 'react';
import * as Sentry from '@sentry/react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 發送錯誤到 Sentry
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', true);
      scope.setContext('errorInfo', errorInfo);
      Sentry.captureException(error);
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>出現了一些問題</h2>
          <p>我們已經記錄了這個錯誤，請稍後再試。</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="retry-button"
          >
            重試
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default Sentry.withErrorBoundary(ErrorBoundary, {
  fallback: ({ error, resetError }) => (
    <div className="error-fallback">
      <h2>應用程式錯誤</h2>
      <pre>{error.message}</pre>
      <button onClick={resetError}>重置</button>
    </div>
  )
});
```

## 📈 效能監控

### Core Web Vitals 追蹤
```javascript
// web-vitals.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // 發送到 Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      non_interaction: true,
      custom_map: {
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta
      }
    });
  }

  // 發送到自定義分析端點
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      url: window.location.href,
      timestamp: Date.now()
    })
  }).catch(console.error);
}

// 初始化 Web Vitals 追蹤
export function initWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}
```

### 使用者體驗監控
```javascript
// user-experience-monitoring.js
export class UserExperienceMonitor {
  static init() {
    this.trackPageLoadTime();
    this.trackInteractionTime();
    this.trackErrorRate();
    this.trackFeatureUsage();
  }

  static trackPageLoadTime() {
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      
      fetch('/api/analytics/page-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: window.location.href,
          loadTime: loadTime,
          timestamp: Date.now()
        })
      });
    });
  }

  static trackInteractionTime() {
    let startTime = Date.now();
    
    ['click', 'keydown', 'scroll'].forEach(event => {
      document.addEventListener(event, () => {
        const interactionTime = Date.now() - startTime;
        
        if (interactionTime > 100) { // 只追蹤有意義的互動
          fetch('/api/analytics/interaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: event,
              duration: interactionTime,
              url: window.location.href,
              timestamp: Date.now()
            })
          });
        }
        
        startTime = Date.now();
      });
    });
  }

  static trackFeatureUsage() {
    // 追蹤計算機使用
    document.addEventListener('calculator-used', (event) => {
      fetch('/api/analytics/feature-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'calculator',
          calculator_type: event.detail.type,
          specialty: event.detail.specialty,
          timestamp: Date.now()
        })
      });
    });
  }
}
```

## 🔒 安全監控

### 安全事件追蹤
```javascript
// security-monitoring.js
export class SecurityMonitor {
  static init() {
    this.trackFailedLogins();
    this.trackSuspiciousActivity();
    this.trackCSRFAttempts();
    this.trackRateLimitViolations();
  }

  static trackFailedLogins() {
    document.addEventListener('login-failed', (event) => {
      fetch('/api/security/failed-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: event.detail.username,
          ip: event.detail.ip,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      });
    });
  }

  static trackSuspiciousActivity() {
    // 追蹤異常的頁面訪問模式
    let pageViews = [];
    
    window.addEventListener('beforeunload', () => {
      if (pageViews.length > 50) { // 異常高的頁面訪問
        fetch('/api/security/suspicious-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'excessive_page_views',
            count: pageViews.length,
            pages: pageViews,
            timestamp: Date.now()
          })
        });
      }
    });
  }

  static trackCSRFAttempts() {
    // 監控 CSRF 令牌驗證失敗
    document.addEventListener('csrf-violation', (event) => {
      fetch('/api/security/csrf-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: window.location.href,
          referer: document.referrer,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      });
    });
  }
}
```

### 合規性監控
```javascript
// compliance-monitoring.js
export class ComplianceMonitor {
  static init() {
    this.trackDataAccess();
    this.trackUserConsent();
    this.trackDataRetention();
  }

  static trackDataAccess() {
    // 追蹤敏感資料訪問
    document.addEventListener('sensitive-data-access', (event) => {
      fetch('/api/compliance/data-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataType: event.detail.dataType,
          userId: event.detail.userId,
          purpose: event.detail.purpose,
          timestamp: Date.now()
        })
      });
    });
  }

  static trackUserConsent() {
    // 追蹤使用者同意狀態
    document.addEventListener('consent-changed', (event) => {
      fetch('/api/compliance/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: event.detail.userId,
          consentType: event.detail.type,
          granted: event.detail.granted,
          timestamp: Date.now()
        })
      });
    });
  }
}
```

## 📱 正常運行時間監控

### 外部監控設置
```javascript
// uptime-monitoring.js
export class UptimeMonitor {
  static setupChecks() {
    return [
      {
        name: 'Main Website',
        url: 'https://your-domain.com',
        method: 'GET',
        expectedStatus: 200,
        timeout: 30000,
        interval: 60000 // 1 minute
      },
      {
        name: 'API Health Check',
        url: 'https://your-domain.com/api/health',
        method: 'GET',
        expectedStatus: 200,
        timeout: 10000,
        interval: 30000 // 30 seconds
      },
      {
        name: 'Calculator API',
        url: 'https://your-domain.com/api/calculators',
        method: 'GET',
        expectedStatus: 200,
        timeout: 15000,
        interval: 120000 // 2 minutes
      },
      {
        name: 'CMS API',
        url: 'https://cms.your-domain.com/api/health',
        method: 'GET',
        expectedStatus: 200,
        timeout: 10000,
        interval: 300000 // 5 minutes
      }
    ];
  }

  static async performCheck(check) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(check.url, {
        method: check.method,
        timeout: check.timeout
      });
      
      const responseTime = Date.now() - startTime;
      const isUp = response.status === check.expectedStatus;
      
      await this.recordResult({
        name: check.name,
        url: check.url,
        status: isUp ? 'up' : 'down',
        responseTime: responseTime,
        statusCode: response.status,
        timestamp: Date.now()
      });
      
      if (!isUp) {
        await this.sendAlert({
          type: 'downtime',
          service: check.name,
          url: check.url,
          statusCode: response.status,
          responseTime: responseTime
        });
      }
      
    } catch (error) {
      await this.recordResult({
        name: check.name,
        url: check.url,
        status: 'down',
        error: error.message,
        timestamp: Date.now()
      });
      
      await this.sendAlert({
        type: 'error',
        service: check.name,
        url: check.url,
        error: error.message
      });
    }
  }
}
```

## 📊 報告和分析

### 自動化報告生成
```javascript
// reporting.js
export class MonitoringReporter {
  static async generateDailyReport() {
    const report = {
      date: new Date().toISOString().split('T')[0],
      summary: await this.getDailySummary(),
      performance: await this.getPerformanceMetrics(),
      errors: await this.getErrorSummary(),
      usage: await this.getUsageStatistics(),
      security: await this.getSecurityEvents()
    };
    
    await this.sendReport(report);
    return report;
  }

  static async getDailySummary() {
    return {
      uptime: '99.95%',
      totalRequests: 15420,
      averageResponseTime: '245ms',
      errorRate: '0.02%',
      uniqueUsers: 3240
    };
  }

  static async getPerformanceMetrics() {
    return {
      coreWebVitals: {
        lcp: '1.2s',
        fid: '45ms',
        cls: '0.05'
      },
      apiResponseTimes: {
        p50: '180ms',
        p95: '450ms',
        p99: '800ms'
      },
      databasePerformance: {
        averageQueryTime: '25ms',
        slowQueries: 3,
        connectionPoolUsage: '65%'
      }
    };
  }

  static async sendReport(report) {
    // 發送郵件報告
    await fetch('/api/reports/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: ['team@your-domain.com'],
        subject: `Daily Monitoring Report - ${report.date}`,
        template: 'daily-monitoring-report',
        data: report
      })
    });
    
    // 儲存到資料庫
    await fetch('/api/reports/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    });
  }
}
```

### 趨勢分析
```javascript
// trend-analysis.js
export class TrendAnalyzer {
  static async analyzeWeeklyTrends() {
    const trends = {
      performance: await this.analyzePerformanceTrends(),
      usage: await this.analyzeUsageTrends(),
      errors: await this.analyzeErrorTrends(),
      security: await this.analyzeSecurityTrends()
    };
    
    const insights = await this.generateInsights(trends);
    return { trends, insights };
  }

  static async analyzePerformanceTrends() {
    // 分析效能趨勢
    return {
      responseTime: {
        trend: 'improving',
        change: '-12%',
        recommendation: 'Continue current optimization efforts'
      },
      errorRate: {
        trend: 'stable',
        change: '+0.1%',
        recommendation: 'Monitor for any increases'
      }
    };
  }

  static async generateInsights(trends) {
    const insights = [];
    
    if (trends.performance.responseTime.trend === 'degrading') {
      insights.push({
        type: 'performance',
        priority: 'high',
        message: 'Response times are increasing, investigate potential causes',
        actions: ['Check database performance', 'Review recent deployments', 'Analyze traffic patterns']
      });
    }
    
    if (trends.usage.calculators.growth > 0.2) {
      insights.push({
        type: 'capacity',
        priority: 'medium',
        message: 'Calculator usage is growing rapidly, consider scaling',
        actions: ['Review server capacity', 'Optimize calculator algorithms', 'Implement caching']
      });
    }
    
    return insights;
  }
}
```

## 🛠️ 故障排除指南

### 常見監控問題

#### 1. 指標收集失敗
```bash
# 檢查 Prometheus 狀態
systemctl status prometheus

# 檢查指標端點
curl http://localhost:4321/api/metrics

# 檢查 Prometheus 配置
promtool check config /etc/prometheus/prometheus.yml

# 重新載入配置
curl -X POST http://localhost:9090/-/reload
```

#### 2. Grafana 儀表板問題
```bash
# 檢查 Grafana 狀態
systemctl status grafana-server

# 檢查資料來源連接
curl -H "Authorization: Bearer YOUR_API_KEY" \
     http://localhost:3000/api/datasources/proxy/1/api/v1/query?query=up

# 重新啟動 Grafana
systemctl restart grafana-server
```

#### 3. 警報不工作
```bash
# 檢查 AlertManager 狀態
systemctl status alertmanager

# 檢查警報規則
promtool check rules /etc/prometheus/alert-rules.yml

# 測試警報
curl -XPOST http://localhost:9093/api/v1/alerts \
     -H "Content-Type: application/json" \
     -d '[{"labels":{"alertname":"TestAlert"}}]'
```

### 監控系統維護
```bash
#!/bin/bash
# monitoring-maintenance.sh

echo "🔧 Monitoring System Maintenance"

# 1. 清理舊的指標資料
echo "Cleaning up old metrics..."
find /var/lib/prometheus -name "*.db" -mtime +30 -delete

# 2. 重新索引 Elasticsearch
echo "Reindexing Elasticsearch..."
curl -X POST "localhost:9200/_reindex" -H 'Content-Type: application/json' -d'
{
  "source": {
    "index": "astro-clinical-platform-*",
    "query": {
      "range": {
        "@timestamp": {
          "gte": "now-7d"
        }
      }
    }
  },
  "dest": {
    "index": "astro-clinical-platform-current"
  }
}'

# 3. 備份 Grafana 儀表板
echo "Backing up Grafana dashboards..."
curl -H "Authorization: Bearer YOUR_API_KEY" \
     http://localhost:3000/api/search?type=dash-db | \
     jq -r '.[] | .uri' | \
     xargs -I {} curl -H "Authorization: Bearer YOUR_API_KEY" \
     http://localhost:3000/api/dashboards/{} > grafana-backup.json

# 4. 檢查監控系統健康
echo "Checking monitoring system health..."
curl -f http://localhost:9090/-/healthy || echo "❌ Prometheus unhealthy"
curl -f http://localhost:3000/api/health || echo "❌ Grafana unhealthy"
curl -f http://localhost:9093/-/healthy || echo "❌ AlertManager unhealthy"

echo "✅ Monitoring maintenance completed"
```

## 📋 監控檢查清單

### 每日檢查
- [ ] 檢查所有服務狀態
- [ ] 檢查警報狀態
- [ ] 檢查儀表板數據
- [ ] 檢查日誌錯誤
- [ ] 檢查效能指標

### 每週檢查
- [ ] 檢查監控系統效能
- [ ] 清理舊的日誌和指標
- [ ] 檢查警報規則有效性
- [ ] 更新儀表板
- [ ] 檢查備份狀態

### 每月檢查
- [ ] 檢查監控系統容量
- [ ] 更新監控配置
- [ ] 檢查合規性要求
- [ ] 優化查詢效能
- [ ] 檢查安全設置

---

這份監控指南提供了完整的監控系統設置和維護流程，確保 Astro Clinical Platform 的可觀測性和穩定運行。定期檢查和更新監控配置，以適應系統的變化和需求。