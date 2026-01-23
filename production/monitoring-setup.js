// Monitoring & Alerting Setup
// Implements server-side performance metrics and error tracking

const { createClient } = require('@supabase/supabase-js');

class MonitoringSystem {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.metrics = new Map();
    this.alerts = [];
    this.thresholds = {
      apiResponseTime: 1000, // 1 second
      errorRate: 0.05, // 5%
      concurrentUsers: 1000,
      databaseQueryTime: 500, // 500ms
      memoryUsage: 0.8, // 80%
      cpuUsage: 0.8 // 80%
    };
  }

  async initializeMonitoring() {
    console.log('🔧 Initializing Monitoring System...');
    
    // Create monitoring tables
    await this.createMonitoringTables();
    
    // Start metrics collection
    this.startMetricsCollection();
    
    // Setup alert handlers
    this.setupAlertHandlers();
    
    console.log('✅ Monitoring system initialized');
  }

  async createMonitoringTables() {
    const tables = [
      {
        name: 'system_metrics',
        sql: `
          CREATE TABLE IF NOT EXISTS system_metrics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            metric_type TEXT NOT NULL,
            metric_value NUMERIC NOT NULL,
            metric_unit TEXT,
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            metadata JSONB
          );
          
          CREATE INDEX IF NOT EXISTS idx_system_metrics_type_time 
          ON system_metrics(metric_type, timestamp);
        `
      },
      {
        name: 'performance_metrics',
        sql: `
          CREATE TABLE IF NOT EXISTS performance_metrics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            endpoint TEXT NOT NULL,
            method TEXT NOT NULL,
            response_time INTEGER NOT NULL,
            status_code INTEGER NOT NULL,
            user_id TEXT,
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            metadata JSONB
          );
          
          CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint_time 
          ON performance_metrics(endpoint, timestamp);
          
          CREATE INDEX IF NOT EXISTS idx_performance_metrics_status 
          ON performance_metrics(status_code);
        `
      },
      {
        name: 'error_logs',
        sql: `
          CREATE TABLE IF NOT EXISTS error_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            error_type TEXT NOT NULL,
            error_message TEXT NOT NULL,
            stack_trace TEXT,
            user_id TEXT,
            endpoint TEXT,
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            severity TEXT DEFAULT 'error',
            metadata JSONB
          );
          
          CREATE INDEX IF NOT EXISTS idx_error_logs_type_time 
          ON error_logs(error_type, timestamp);
          
          CREATE INDEX IF NOT EXISTS idx_error_logs_severity 
          ON error_logs(severity);
        `
      },
      {
        name: 'alert_notifications',
        sql: `
          CREATE TABLE IF NOT EXISTS alert_notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            alert_type TEXT NOT NULL,
            alert_message TEXT NOT NULL,
            severity TEXT NOT NULL,
            resolved BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            resolved_at TIMESTAMPTZ,
            metadata JSONB
          );
          
          CREATE INDEX IF NOT EXISTS idx_alert_notifications_type_resolved 
          ON alert_notifications(alert_type, resolved);
        `
      }
    ];

    for (const table of tables) {
      try {
        await this.supabase.rpc('exec_sql', { sql: table.sql });
        console.log(`✅ Created monitoring table: ${table.name}`);
      } catch (error) {
        console.log(`ℹ️  Table ${table.name} already exists or error: ${error.message}`);
      }
    }
  }

  startMetricsCollection() {
    // API Performance Monitoring
    setInterval(async () => {
      await this.collectAPIMetrics();
    }, 60000); // Every minute

    // System Resource Monitoring
    setInterval(async () => {
      await this.collectSystemMetrics();
    }, 300000); // Every 5 minutes

    // Error Rate Monitoring
    setInterval(async () => {
      await this.checkErrorRates();
    }, 300000); // Every 5 minutes

    // Database Performance Monitoring
    setInterval(async () => {
      await this.checkDatabasePerformance();
    }, 600000); // Every 10 minutes
  }

  setupAlertHandlers() {
    // Setup real-time monitoring for critical metrics
    this.supabase
      .channel('system-alerts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'error_logs' },
        (payload) => {
          this.handleNewError(payload.new);
        }
      )
      .subscribe();

    this.supabase
      .channel('performance-alerts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'performance_metrics' },
        (payload) => {
          this.handlePerformanceIssue(payload.new);
        }
      )
      .subscribe();
  }

  async collectAPIMetrics() {
    try {
      const endTime = new Date(Date.now() - 60000); // Last minute
      const startTime = new Date(endTime.getTime() - 300000); // Last 5 minutes for baseline

      // Get recent API calls
      const { data: recentCalls } = await this.supabase
        .from('performance_metrics')
        .select('endpoint, response_time, status_code')
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', endTime.toISOString());

      if (!recentCalls || recentCalls.length === 0) return;

      // Calculate metrics
      const avgResponseTime = recentCalls.reduce((sum, call) => sum + call.response_time, 0) / recentCalls.length;
      const errorRate = recentCalls.filter(call => call.status_code >= 400).length / recentCalls.length;
      const slowCalls = recentCalls.filter(call => call.response_time > this.thresholds.apiResponseTime).length;

      // Store aggregated metrics
      await this.supabase
        .from('system_metrics')
        .insert([
          {
            metric_type: 'api_avg_response_time',
            metric_value: avgResponseTime,
            metric_unit: 'milliseconds',
            metadata: { total_calls: recentCalls.length }
          },
          {
            metric_type: 'api_error_rate',
            metric_value: errorRate,
            metric_unit: 'percentage',
            metadata: { total_calls: recentCalls.length, errors: recentCalls.filter(call => call.status_code >= 400).length }
          },
          {
            metric_type: 'api_slow_calls',
            metric_value: slowCalls,
            metric_unit: 'count',
            metadata: { threshold: this.thresholds.apiResponseTime }
          }
        ]);

      // Check for alerts
      if (avgResponseTime > this.thresholds.apiResponseTime) {
        await this.createAlert('performance', 'API response time exceeded threshold', 'warning', {
          current: avgResponseTime,
          threshold: this.thresholds.apiResponseTime,
          timeWindow: '5 minutes'
        });
      }

      if (errorRate > this.thresholds.errorRate) {
        await this.createAlert('error', 'API error rate exceeded threshold', 'critical', {
          current: errorRate,
          threshold: this.thresholds.errorRate,
          timeWindow: '5 minutes'
        });
      }

    } catch (error) {
      console.error('Failed to collect API metrics:', error);
    }
  }

  async collectSystemMetrics() {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // Memory metrics
      const memoryUsageMB = memUsage.heapUsed / 1024 / 1024;
      const memoryUsagePercent = memoryUsageMB / (memUsage.heapTotal / 1024 / 1024);

      // CPU metrics (simplified)
      const cpuUsagePercent = cpuUsage.user / 1000000; // Convert to percentage

      // Store system metrics
      await this.supabase
        .from('system_metrics')
        .insert([
          {
            metric_type: 'memory_usage',
            metric_value: memoryUsagePercent,
            metric_unit: 'percentage',
            metadata: { heap_used_mb: memoryUsageMB }
          },
          {
            metric_type: 'cpu_usage',
            metric_value: cpuUsagePercent,
            metric_unit: 'percentage',
            metadata: { user_cpu: cpuUsage.user }
          }
        ]);

      // Check for alerts
      if (memoryUsagePercent > this.thresholds.memoryUsage) {
        await this.createAlert('system', 'Memory usage exceeded threshold', 'warning', {
          current: memoryUsagePercent,
          threshold: this.thresholds.memoryUsage
        });
      }

      if (cpuUsagePercent > this.thresholds.cpuUsage) {
        await this.createAlert('system', 'CPU usage exceeded threshold', 'warning', {
          current: cpuUsagePercent,
          threshold: this.thresholds.cpuUsage
        });
      }

    } catch (error) {
      console.error('Failed to collect system metrics:', error);
    }
  }

  async checkErrorRates() {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 300000); // Last 5 minutes

      const { count } = await this.supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', endTime.toISOString());

      // Error rate per 5 minutes
      const errorRate = count > 0 ? count / 5 : 0; // errors per minute

      if (errorRate > 10) { // More than 10 errors per minute
        await this.createAlert('error', 'High error rate detected', 'critical', {
          current: errorRate,
          threshold: 10,
          timeWindow: '5 minutes'
        });
      }

    } catch (error) {
      console.error('Failed to check error rates:', error);
    }
  }

  async checkDatabasePerformance() {
    try {
      // Test database query performance
      const startTime = Date.now();
      
      await this.supabase
        .from('student_module_instances')
        .select('*, student_profiles!inner(user_id), modules_catalog!inner(code, name)')
        .limit(100);
      
      const queryTime = Date.now() - startTime;

      // Store database performance metric
      await this.supabase
        .from('system_metrics')
        .insert({
          metric_type: 'db_query_time',
          metric_value: queryTime,
          metric_unit: 'milliseconds',
          metadata: { query_type: 'complex_join', limit: 100 }
        });

      if (queryTime > this.thresholds.databaseQueryTime) {
        await this.createAlert('performance', 'Database query time exceeded threshold', 'warning', {
          current: queryTime,
          threshold: this.thresholds.databaseQueryTime,
          query_type: 'complex_join'
        });
      }

    } catch (error) {
      console.error('Failed to check database performance:', error);
      await this.createAlert('system', 'Database performance check failed', 'error', {
        error: error.message
      });
    }
  }

  async handleNewError(error) {
    // Check for critical errors
    const criticalErrors = ['database_connection', 'authentication', 'authorization'];
    
    if (criticalErrors.includes(error.error_type)) {
      await this.createAlert('critical', `Critical error: ${error.error_type}`, 'critical', {
        error_type: error.error_type,
        error_message: error.error_message,
        user_id: error.user_id
      });
    }

    // Check for repeated errors from same user
    const recentErrors = await this.supabase
      .from('error_logs')
      .select('error_type, user_id')
      .eq('user_id', error.user_id)
      .gte('timestamp', new Date(Date.now() - 300000).toISOString()) // Last 5 minutes
      .limit(10);

    if (recentErrors && recentErrors.length > 5) {
      await this.createAlert('security', 'Multiple errors from same user', 'warning', {
        user_id: error.user_id,
        error_count: recentErrors.length,
        timeWindow: '5 minutes'
      });
    }
  }

  async handlePerformanceIssue(metric) {
    if (metric.response_time > this.thresholds.apiResponseTime * 2) {
      await this.createAlert('performance', 'Very slow API response detected', 'critical', {
        endpoint: metric.endpoint,
        response_time: metric.response_time,
        threshold: this.thresholds.apiResponseTime * 2
      });
    }
  }

  async createAlert(type, message, severity, metadata = {}) {
    try {
      const { data } = await this.supabase
        .from('alert_notifications')
        .insert({
          alert_type: type,
          alert_message: message,
          severity,
          metadata
        })
        .select()
        .single();

      console.log(`🚨 ALERT: ${type} - ${message}`);

      // Send immediate notification for critical alerts
      if (severity === 'critical') {
        await this.sendImmediateNotification(data);
      }

    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  }

  async sendImmediateNotification(alert) {
    // Send to Slack/Teams/email
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    
    if (!webhookUrl) return;

    const message = {
      text: `🚨 ${alert.alert_type.toUpperCase()}: ${alert.alert_message}`,
      attachments: [{
        color: alert.severity === 'critical' ? 'danger' : 'warning',
        fields: Object.entries(alert.metadata || {}).map(([key, value]) => ({
          title: key,
          value: value,
          short: true
        }))
      }]
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async getMonitoringDashboard() {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 3600000); // Last hour

      // Get recent metrics
      const { data: metrics } = await this.supabase
        .from('system_metrics')
        .select('*')
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', endTime.toISOString())
        .order('timestamp', { ascending: false });

      // Get recent alerts
      const { data: alerts } = await this.supabase
        .from('alert_notifications')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get recent errors
      const { data: errors } = await this.supabase
        .from('error_logs')
        .select('*')
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', endTime.toISOString())
        .order('timestamp', { ascending: false })
        .limit(20);

      return {
        metrics: metrics || [],
        alerts: alerts || [],
        errors: errors || [],
        summary: this.generateSummary(metrics, alerts, errors)
      };

    } catch (error) {
      console.error('Failed to get monitoring dashboard:', error);
      return { error: error.message };
    }
  }

  generateSummary(metrics, alerts, errors) {
    const summary = {
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      totalErrors: errors.length,
      systemHealth: 'healthy',
      lastUpdated: new Date().toISOString()
    };

    if (summary.criticalAlerts > 0) {
      summary.systemHealth = 'critical';
    } else if (summary.totalAlerts > 5 || summary.totalErrors > 20) {
      summary.systemHealth = 'degraded';
    } else if (summary.totalAlerts > 0 || summary.totalErrors > 5) {
      summary.systemHealth = 'warning';
    }

    return summary;
  }
}

// Initialize monitoring if this file is executed directly
if (require.main === module) {
  const monitoring = new MonitoringSystem();
  monitoring.initializeMonitoring().catch(console.error);
}

module.exports = { MonitoringSystem };
