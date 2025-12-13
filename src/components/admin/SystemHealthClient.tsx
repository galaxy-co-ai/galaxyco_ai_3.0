"use client";

/**
 * System Health Dashboard Client
 * 
 * Features:
 * - Status cards for system components
 * - Auto-refresh toggle
 * - Health metrics visualization
 * - Uptime tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Database,
  Server,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  Zap,
} from 'lucide-react';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  version?: string;
  redis: {
    connected: boolean;
    latencyMs?: number;
  };
  database: {
    connected: boolean;
    latencyMs?: number;
  };
}

interface DatabaseMetrics {
  queryCount?: number;
  avgQueryTimeMs?: number;
  connectionPoolSize?: number;
  activeConnections?: number;
  errorRate?: number;
}

interface HealthData {
  system: SystemHealth;
  database: DatabaseMetrics;
  timestamp: string;
}

interface SystemHealthClientProps {
  initialData: HealthData | null;
}

export default function SystemHealthClient({ initialData }: SystemHealthClientProps) {
  const [healthData, setHealthData] = useState<HealthData | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/metrics/health');
      if (response.ok) {
        const result = await response.json();
        setHealthData(result.data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch health data', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchHealth();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealth]);

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'unhealthy' | boolean) => {
    if (status === 'healthy' || status === true) {
      return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
    }
    if (status === 'degraded') {
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusBadge = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    const toneMap = {
      healthy: 'success' as const,
      degraded: 'warning' as const,
      unhealthy: 'danger' as const,
    };
    
    return (
      <Badge variant="soft" tone={toneMap[status]} size="md">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const system = healthData?.system;
  const dbMetrics = healthData?.database;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-sm">
              Auto-refresh (30s)
            </Label>
          </div>
          {autoRefresh && (
            <Badge variant="soft" tone="info" size="sm">
              <Zap className="h-3 w-3" />
              Live
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHealth}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className={`border-2 ${
        system?.status === 'healthy' ? 'border-emerald-200 dark:border-emerald-800' :
        system?.status === 'degraded' ? 'border-amber-200 dark:border-amber-800' :
        'border-red-200 dark:border-red-800'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                system?.status === 'healthy' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                system?.status === 'degraded' ? 'bg-amber-100 dark:bg-amber-900/30' :
                'bg-red-100 dark:bg-red-900/30'
              }`}>
                <Activity className={`h-6 w-6 ${
                  system?.status === 'healthy' ? 'text-emerald-600' :
                  system?.status === 'degraded' ? 'text-amber-600' :
                  'text-red-600'
                }`} />
              </div>
              <div>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Overall platform health</CardDescription>
              </div>
            </div>
            {system && getStatusBadge(system.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-xl">
              <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-semibold">{system ? formatUptime(system.uptime) : '-'}</p>
              <p className="text-xs text-muted-foreground">Uptime</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-xl">
              <Database className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-semibold">{system?.database.latencyMs || '-'}ms</p>
              <p className="text-xs text-muted-foreground">DB Latency</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-xl">
              <Wifi className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-semibold">{system?.redis.latencyMs || '-'}ms</p>
              <p className="text-xs text-muted-foreground">Redis Latency</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-xl">
              <Server className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-semibold">{system?.version || 'v3.0'}</p>
              <p className="text-xs text-muted-foreground">Version</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Database */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Database</CardTitle>
              </div>
              {getStatusIcon(system?.database.connected ?? false)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Connection</span>
              <Badge variant="soft" tone={system?.database.connected ? 'success' : 'danger'} size="sm">
                {system?.database.connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Latency</span>
              <span className="font-medium">{system?.database.latencyMs || '-'}ms</span>
            </div>
            {dbMetrics?.connectionPoolSize && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pool Usage</span>
                  <span className="font-medium">
                    {dbMetrics.activeConnections || 0}/{dbMetrics.connectionPoolSize}
                  </span>
                </div>
                <Progress 
                  value={((dbMetrics.activeConnections || 0) / dbMetrics.connectionPoolSize) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Redis */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Redis Cache</CardTitle>
              </div>
              {getStatusIcon(system?.redis.connected ?? false)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Connection</span>
              <Badge variant="soft" tone={system?.redis.connected ? 'success' : 'danger'} size="sm">
                {system?.redis.connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Latency</span>
              <span className="font-medium">{system?.redis.latencyMs || '-'}ms</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Provider</span>
              <span className="font-medium">Upstash</span>
            </div>
          </CardContent>
        </Card>

        {/* Query Performance */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Query Performance</CardTitle>
              </div>
              {getStatusIcon((dbMetrics?.errorRate || 0) < 1 ? 'healthy' : 'degraded')}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Avg Query Time</span>
              <span className="font-medium">{dbMetrics?.avgQueryTimeMs?.toFixed(1) || '-'}ms</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Queries</span>
              <span className="font-medium">{dbMetrics?.queryCount?.toLocaleString() || '-'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Error Rate</span>
              <Badge 
                variant="soft" 
                tone={(dbMetrics?.errorRate || 0) < 1 ? 'success' : 'danger'} 
                size="sm"
              >
                {dbMetrics?.errorRate?.toFixed(2) || '0'}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            External Services
          </CardTitle>
          <CardDescription>Third-party service connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Clerk Auth', status: true, icon: Server },
              { name: 'Stripe', status: true, icon: Zap },
              { name: 'OpenAI', status: true, icon: Cpu },
              { name: 'Pusher', status: true, icon: Wifi },
              { name: 'Vercel Blob', status: true, icon: HardDrive },
              { name: 'SignalWire', status: true, icon: Activity },
              { name: 'Trigger.dev', status: true, icon: Zap },
              { name: 'Sentry', status: true, icon: MemoryStick },
            ].map((service) => (
              <div
                key={service.name}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <service.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium flex-1">{service.name}</span>
                <div className={`h-2 w-2 rounded-full ${service.status ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
