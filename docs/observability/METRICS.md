# Neptune Metrics Guide

**Last Updated:** 2024-12-11  
**Version:** Phase 4A Complete  
**Status:** Production Ready

---

## Overview

Neptune observability provides comprehensive performance tracking using Sentry events and custom admin APIs. This guide covers all available metrics, how to view them, and how to interpret the data.

## Available Metrics

### Performance Metrics

#### `Neptune Request Tracking`
Tracks every Neptune AI request with full context.

**Tracked in:** Sentry events  
**Event name:** `Neptune Request`  
**Tags:**
- `metric_type: response_time`
- `cached: true/false`
- `workspace: {workspaceId}`
- `has_rag: true/false`

**Extra data:**
- `duration` - Response time in milliseconds
- `tokensUsed` - Tokens consumed by request
- `ragResultsCount` - Number of RAG results returned

**View in:** Sentry > Issues > Filter by `component:neptune`

---

#### `Cache Performance`
Tracks cache hit/miss events for performance analysis.

**Tracked in:** Sentry events + Redis counters  
**Event name:** `Neptune Cache Access`  
**Tags:**
- `metric_type: cache_access`
- `cache_type: context | rag | user_prefs`
- `hit: true/false`

**Redis counters:**
- `metrics:cache:hits` - Total cache hits
- `metrics:cache:misses` - Total cache misses

**Calculated metrics:**
- Cache hit rate = `hits / (hits + misses)`
- Target: >70% hit rate

---

#### `Database Query Performance`
Tracks slow queries and database health.

**Tracked in:** Sentry events  
**Event name:** `Neptune Database Query`  
**Tags:**
- `metric_type: db_query`
- `query: {queryName}`
- `slow_query: true/false`

**Extra data:**
- `duration` - Query execution time in milliseconds

**Thresholds:**
- Logged: Queries >100ms
- Flagged: Queries >500ms (warning level)

---

#### `Error Tracking`
Captures Neptune errors with full context.

**Tracked in:** Sentry exceptions  
**Tags:**
- `component: neptune`
- `error_type: {ErrorName}`
- `workspace: {workspaceId}`

**Extra data:**
- Full error context (varies by error type)

---

## Viewing Metrics

### Method 1: Sentry Dashboard

**Access:** https://sentry.io > Your Project > Issues

**Filtering:**

```
# All Neptune metrics
component:neptune

# Response time metrics
component:neptune metric_type:response_time

# Cache access metrics
component:neptune metric_type:cache_access

# Slow queries
component:neptune metric_type:db_query slow_query:true

# Cached requests only
component:neptune cached:true

# Workspace-specific
component:neptune workspace:YOUR_WORKSPACE_ID
```

**Viewing Trends:**
1. Go to Sentry > Performance
2. Filter by `component:neptune`
3. View response time distributions
4. Check p50, p95, p99 percentiles

---

### Method 2: Admin API

**Authentication:** Requires admin whitelisted email

#### Get Comprehensive Metrics
```bash
curl https://galaxyco.ai/api/admin/metrics

# With time range
curl https://galaxyco.ai/api/admin/metrics?range=hour
curl https://galaxyco.ai/api/admin/metrics?range=day
curl https://galaxyco.ai/api/admin/metrics?range=week
```

**Response:**
```json
{
  "success": true,
  "data": {
    "neptune": {
      "performance": {
        "avgResponseTime": 1800,
        "p95ResponseTime": 3200,
        "totalRequests": 145,
        "requestsPerHour": 6.0
      },
      "cache": {
        "hitRate": 0.73,
        "totalHits": 106,
        "totalMisses": 39,
        "totalAccesses": 145
      },
      "tokens": {
        "totalUsed": 87000,
        "avgPerRequest": 600,
        "costEstimate": 0.87
      },
      "rag": {
        "avgResultsReturned": 5,
        "searchCount": 44
      },
      "conversations": {
        "total": 42,
        "activeToday": 18
      }
    },
    "database": {
      "avgQueryTime": 125,
      "slowQueries": 0,
      "totalQueries": 0,
      "errorRate": 0
    },
    "system": {
      "status": "healthy",
      "uptime": 86400,
      "checks": {
        "redis": true,
        "database": true
      }
    },
    "targets": {
      "responseTime": {
        "target": 2000,
        "actual": 1800,
        "met": true,
        "status": "✅"
      },
      "cacheHitRate": {
        "target": 0.70,
        "actual": 0.73,
        "met": true,
        "status": "✅"
      }
    },
    "timeRange": "day"
  },
  "timestamp": "2025-12-11T20:30:00.000Z"
}
```

---

#### Get Neptune-Specific Metrics
```bash
curl https://galaxyco.ai/api/admin/metrics/neptune?range=week
```

**Response:** Same as `neptune` object above, plus `targets`

---

#### Check System Health
```bash
curl https://galaxyco.ai/api/admin/metrics/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "system": {
      "status": "healthy",
      "uptime": 86400,
      "timestamp": "2025-12-11T20:30:00.000Z",
      "checks": {
        "redis": true,
        "database": true
      }
    },
    "database": {
      "avgQueryTime": 125,
      "slowQueries": 0,
      "totalQueries": 0,
      "errorRate": 0
    }
  },
  "timestamp": "2025-12-11T20:30:00.000Z"
}
```

**HTTP Status Codes:**
- `200` - Healthy or degraded
- `503` - Unhealthy (database down)
- `403` - Unauthorized (not admin)

---

### Method 3: Redis Counters (Direct)

For real-time cache metrics:

```typescript
import { redis } from '@/lib/upstash';

const hits = await redis.get('metrics:cache:hits');
const misses = await redis.get('metrics:cache:misses');
const hitRate = hits / (hits + misses);
```

---

## Performance Targets

From Neptune Optimization Plan (Phase 1-3 goals):

| Metric | Target | Pre-Optimization | Phase 1-3 Goal |
|--------|--------|------------------|----------------|
| Response Time | <2s average | ~4-6s | 2-3x improvement ✅ |
| Cache Hit Rate | >70% | N/A (new) | Enable caching ✅ |
| Token Efficiency | 30% reduction | Baseline | Context pruning ✅ |
| RAG Accuracy | 35-40% improvement | Baseline | Hybrid search ✅ |

**Automatic Checking:**

All admin API responses include `targets` object:
```json
{
  "targets": {
    "responseTime": {
      "target": 2000,
      "actual": 1800,
      "met": true,
      "status": "✅"
    },
    "cacheHitRate": {
      "target": 0.70,
      "actual": 0.73,
      "met": true,
      "status": "✅"
    }
  }
}
```

---

## Troubleshooting

### High Response Times (>2s average)

**Check:**
1. Cache hit rate - should be >70%
   ```bash
   curl https://galaxyco.ai/api/admin/metrics/neptune | jq '.data.metrics.cache.hitRate'
   ```
2. Slow queries in Sentry
   - Filter: `component:neptune metric_type:db_query slow_query:true`
3. RAG result counts - should be 5-10 per search
4. Token usage - check for context bloat

**Common causes:**
- Cache warming period (first ~100 requests)
- Database index missing
- RAG returning too many results
- Context not being pruned

---

### Low Cache Hit Rate (<50%)

**Check:**
1. Redis connection
   ```bash
   curl https://galaxyco.ai/api/admin/metrics/health | jq '.data.system.checks.redis'
   ```
2. TTL settings in `src/lib/cache.ts`
   - Context: 5 min
   - RAG: 10 min
   - User prefs: 15 min
3. Cache invalidation frequency
   - Check if mutations are over-invalidating

**Common causes:**
- Redis connection issues
- TTL too short for usage pattern
- Unique queries (no repeat requests)
- Cache warming period

---

### High Token Usage

**Check:**
1. Context pruning active
   - Look for `context_pruning` implementation
2. Conversation history limits
   - Should be max 30 messages
3. RAG results excessive
   - Should be 5-10 max

**Common causes:**
- Context pruning disabled
- Too many conversation messages
- RAG returning full documents

---

### Unhealthy System Status

**Check:**
```bash
curl https://galaxyco.ai/api/admin/metrics/health
```

**Responses:**
- `"status": "healthy"` - All systems operational
- `"status": "degraded"` - Redis down (non-critical)
- `"status": "unhealthy"` - Database down (critical)

**Actions:**
1. Check `issues` array in response
2. For database: Check Neon dashboard
3. For Redis: Check Upstash dashboard
4. Review logs in Sentry

---

## Validation Testing

Run comprehensive test suite:

```bash
# Local
npx tsx scripts/test-metrics.ts

# Production
BASE_URL=https://galaxyco.ai npx tsx scripts/test-metrics.ts
```

**Tests:**
- Redis connection
- Cache counter initialization
- All admin API endpoints
- Time range parameters
- Performance target validation

---

## Cost Tracking

Token costs are automatically calculated:

**Formula:** `tokens * $0.00001` (GPT-4o pricing)

**View in API:**
```bash
curl https://galaxyco.ai/api/admin/metrics/neptune | jq '.data.metrics.tokens'
```

**Example:**
```json
{
  "totalUsed": 87000,
  "avgPerRequest": 600,
  "costEstimate": 0.87
}
```

**Interpretation:**
- 87,000 tokens used in period
- Average 600 tokens per request
- Estimated $0.87 in costs

**Monthly estimates:**
- 1K requests/day = ~600K tokens/month = ~$6/month
- 10K requests/day = ~6M tokens/month = ~$60/month

---

## Integration with Mission Control (Phase 4B)

**Future enhancement:**

When Mission Control visual dashboard is built, these metrics will be displayed:

**Performance Tab:**
- Real-time response time chart (7-day trend)
- Cache hit rate gauge
- Active conversations count
- Token usage + cost tracking

**Health Tab:**
- System status indicator
- Redis connection status
- Database connection status
- Recent alerts history

**Target:** Phase 4B (backlogged) - 1-2 weeks when prioritized

---

## Reference

**Related Documentation:**
- `docs/plans/NEPTUNE_OPTIMIZATION_PLAN_V2.md` - Full optimization plan
- `src/lib/observability.ts` - Tracking implementation
- `src/lib/admin/metrics.ts` - Metrics calculation
- `scripts/test-metrics.ts` - Validation tests

**External Resources:**
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Events](https://docs.sentry.io/platforms/javascript/enriching-events/)

---

## Questions or Issues?

1. Check Sentry dashboard for detailed events
2. Run validation tests: `npx tsx scripts/test-metrics.ts`
3. Review logs in Sentry for errors
4. Check health endpoint: `/api/admin/metrics/health`

**Remember:** Metrics collection happens in real-time. First ~100 requests will be cache warming period with lower hit rates.
