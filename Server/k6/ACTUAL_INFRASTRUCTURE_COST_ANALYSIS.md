# Precise Infrastructure Cost Analysis - Your Actual Setup

## Your Actual Infrastructure Configuration

Based on your IaC repository analysis:

### ECS Configuration
- **Launch Type**: Fargate
- **Task Definition**:
  - CPU: **2048** (2 vCPU)
  - Memory: **4096 MB** (4 GB)
- **Auto-scaling**:
  - Min tasks: **1**
  - Max tasks: **20**
  - Target CPU: **75%**
  - Target Memory: **75%**
  - Target RPS per task: **150**
  - Scale-out cooldown: **60s** (CPU/Memory), **30s** (RPS)
  - Scale-in cooldown: **300s** (5 minutes)

### ALB Configuration
- Type: Application Load Balancer
- Access logs: Enabled (S3)
- Health check: `/api/health` every 30s

### ElastiCache Redis
- **Node Type**: From variables (typically cache.t3.small or cache.t3.medium)
- **Replication**: Single node (non-production)
- **Eviction Policy**: noeviction
- **Enabled**: Yes

---

## Accurate Cost Calculations

### Cost Per Fargate Task

**Your Task Size: 2 vCPU,4 GB RAM**

Fargate Pricing (us-east-1):
- vCPU: $0.04048 per vCPU-hour
- Memory: $0.004445 per GB-hour

```
Cost per task-hour = (2 × $0.04048) + (4 × $0.004445)
                    = $0.08096 + $0.01778
                    = $0.09874 per hour
```

**Per minute**: $0.001646

---

## Load Test Scaling Predictions

### Based on Your Auto-Scaling Config

**Key Finding**: With **150 RPS target per task**, your infrastructure will scale as follows:

| VU Count | Est. RPS | Tasks Needed | Cost/Hour | Cost/30min |
|----------|----------|--------------|-----------|------------|
| 100      | 16       | 1            | $0.10     | $0.05      |
| 1,000    | 166      | 2            | $0.20     | $0.10      |
| 5,000    | 833      | 6            | $0.59     | $0.30      |
| 10,000   | 1,666    | 12           | $1.18     | $0.59      |
| 15,000   | 2,500    | 17           | $1.68     | $0.84      |
| 20,000   | 3,333    | **20 (max)** | **$1.97** | **$0.99**  |

**Critical Point**: At **22,500 RPS** (150 × 20 tasks), you'll hit your max capacity!

### Detailed Scaling Timeline

**Scenario: Full Load Test (0 → 20k VUs over 25 minutes)**

```
T+0:00  - Start: 1 task
T+2:00  - 1k VUs (166 RPS): Scale to 2 tasks
T+4:00  - 2k VUs (333 RPS): Scale to 3 tasks
T+6:00  - 5k VUs (833 RPS): Scale to 6 tasks
T+10:00 - 10k VUs (1,666 RPS): Scale to 12 tasks
T+15:00 - 15k VUs (2,500 RPS): Scale to 17 tasks
T+20:00 - 20k VUs (3,333 RPS): Scale to 20 tasks (MAX)
T+30:00 - Sustained at 20 tasks
T+40:00 - Ramp down begins
T+42:00 - Still at 20 tasks (scale-in cooldown)
T+47:00 - Scale to 10 tasks
T+52:00 - Scale to 5 tasks
T+57:00 - Scale to 2 tasks
T+62:00 - Back to 1 task
```

**Key Insight**: Your 5-minute scale-in cooldown means you'll pay for extra capacity for ~22 minutes after peak load ends.

---

## Total Cost Breakdown

### Comprehensive Load Test (30min at 20k VUs)

**ECS Fargate Costs:**
```
Peak period (10 min at 20 tasks):  20 × $0.09874 × (10/60) = $0.329
Ramp-up (10 min avg 8 tasks):      8 × $0.09874 × (10/60)  = $0.132
Sustained (10 min at 20 tasks):    20 × $0.09874 × (10/60) = $0.329
Cooldown (22 min avg 12 tasks):    12 × $0.09874 × (22/60) = $0.434

Total ECS: $1.22 per test
```

**ALB Costs:**

LCU Calculation at 20k VUs:
- New connections/sec: ~555 (20k/60 × 1.67 req/min)
- Active connections: ~20,000
- Processed bytes: ~350 GB/hour → 5.8 GB/minute

LCUs needed: Max of:
- Connections: 555/25 = `22.2 LCUs`
- Active: 20,000/3,000 = `6.67 LCUs`
- Bandwidth: 350/1 = `350 LCUs` ← **This drives cost!**

**LCU Cost**: 350 LCUs × $0.008/hour × 0.5 hours = **$1.40**

**ALB Fixed Cost**: $0.0225 × 0.5 hours = **$0.01**

**Total ALB**: **$1.41**

**Data Transfer Costs:**

Assuming average response size: 50 KB per request
```
Total requests (30 min, 20k VUs, 2 req/min): ~600,000 requests
Total data: 600,000 × 55 KB = 33 GB

Internet data transfer: 33 GB × $0.09 = $2.97
Cross-AZ (assume 30%): 10 GB × $0.01 = $0.10

Total Data Transfer: $3.07
```

**CloudWatch Costs:**

```
Container logs (30 min): ~0.5 GB × $0.50 = $0.25
ALB access logs: ~0.3 GB × $0.50 = $0.15
Custom metrics: ~$0.05
API requests: ~$0.05

Total CloudWatch: $0.50
```

**ElastiCache Redis:**

Actual: **cache.t4g.micro** (Graviton2): $0.016/hour
```
Test duration cost: $0.016 × 0.5 = $0.008 ≈ $0.01
```

(Monthly cost ~$11.52 already budgeted) ✅ Even cheaper!

**k6 Test Runner (EC2):**
```
c5.4xlarge Spot: ~$0.20/hour × 0.5 hours = $0.10
```

### Single 30-Min Test at 20k VUs: **$6.31**

| Component | Cost |
|-----------|------|
| ECS Fargate | $1.22 |
| ALB (LCUs) | $1.40 |
| ALB (Fixed) | $0.01 |
| Data Transfer | $3.07 |
| CloudWatch | $0.50 |
| ElastiCache (t4g.micro) | $0.01 |
| k6 Runner | $0.10 |
| **TOTAL** | **$6.31** |

---

## Full Test Suite Costs

**All 6 tests (auth, game-read, game-write, user, admin, comprehensive):**

Assuming staged execution over 3 hours:
- Individual tests: 5 × 25 min @ varying VUs (avg 10k) = **$15**
- Comprehensive test: 1 × 30 min @ 20k VUs = **$6.32**
- Cooldown overhead: Additional **$5-7**

**Total Full Suite: $26-28** 🎯

---

## Monthly Cost Scenarios

### Weekly Regression Testing

Running full suite 1x per week:
```
$27 per run × 4 weeks = $108/month
```

### Daily Smoke Tests

Running smoke tests (10 VUs, 1 min) daily:
```
1 task × 1 min × 30 days = 30 min total = $0.05/month
```

### Bi-Weekly Load Tests

Running 20k VU test every 2 weeks:
```
$6.32 per run × 2 per month = $12.64/month
```

---

## Scaling Pattern Analysis

### Your 150 RPS Target Is Aggressive

**Comparison**:
- Your config: 150 RPS per task
- Typical: 50-100 RPS per task
- Conservative: 30-50 RPS per task

**Impact at 20k VUs**:
```
150 RPS target: 20 tasks needed (at max limit)
75 RPS target:  40 tasks needed (would exceed max!)
50 RPS target:  60 tasks needed (would exceed max!)
```

**This is GOOD for cost** but may risk performance degradation if sustained RPS exceeds 150/task.

### Request Distribution Analysis

With comprehensive test's weighted journey distribution:
- 70% casual browsers: ~1-2 requests/journey
- 20% active players: ~5-8 requests/journey
- 10% admin users: ~6-10 requests/journey

**Average**: ~3 requests per complete user journey

**At 20k concurrent VUs**:
```
If journey takes 2 minutes:
20,000 users ÷ 2 min = 10,000 journeys/min
10,000 journeys × 3 requests = 30,000 requests/min
30,000 req/min ÷ 60 = 500 RPS

With 20 tasks: 500 ÷ 20 = 25 RPS per task
```

**✅ Well within 150 RPS target!**

### CPU/Memory Scaling

With 2 vCPU per task:

**Expected CPU usage pattern**:
- Idle: 5-10% CPU
- Light load (25 RPS): 30-40% CPU
- Medium load (75 RPS): 50-60% CPU
- Heavy load (150 RPS): 70-80% CPU

**Memory usage**:
- Node.js base: 100-200 MB
- Per connection: ~1-2 MB
- Typical steady state: 1-2 GB RAM
- Under load: 2-3 GB RAM

**✅ Your 4 GB RAM allocation is appropriate**

---

## Cost Optimization Opportunities

### 1. Reduce Response Sizes (HIGH IMPACT)

Current assumption: 50 KB average response

**If you compress and optimize to 25 KB**:
```
Data transfer savings: 50%
New data cost: $3.07 → $1.53
Savings per test: $1.54
```

**How to achieve**:
```javascript
// In Express.js
const compression = require('compression');
app.use(compression({ level: 6 }));
```

**LCU Impact**: Also reduces LCU bandwidth charges significantly!

### 2. Adjust Scale-In Cooldown

Current: 300 seconds (5 minutes)

**If reduced to 120 seconds (2 minutes)**:
```
Cooldown overhead: $0.43 → $0.17
Savings per test: $0.26
```

**Tradeoff**: More frequent scaling events, but likely acceptable for steady ramp-down patterns.

### 3. Increase Max Tasks (If Budget Allows)

Current max: 20 tasks

**If increased to 30 tasks**:
- More headroom for traffic spikes
- Better redundancy
- Cost increase: Minimal if not triggered
- Added confidence for production Black Friday scenarios

### 4. Strategic Test Timing

**Run tests during overlapping baseline**:
```
Baseline cost: 1 task × 24 hours × $0.09874 = $2.37/day

If you run tests during normal business hours when 1-2 tasks
are already running for dev/test traffic, you're only paying
for the INCREMENTAL tasks.

Potential savings: $0.10-0.20 per test
```

### 5. Enable ALB Access Log Sampling

Instead of logging 100% of requests:
```
Sample rate: 10%
Current log cost: $0.15
Optimized: $0.015
Savings: $0.13 per test

Still provides sufficient data for load test analysis.
```

---

## Risk Assessment & Safeguards

### High-Cost Scenarios

**Scenario 1: Runaway Scaling (UNLIKELY with your config)**
- Your max_capacity = 20 limits damage
- Worst case: 20 tasks × $0.09874 × 1 hour = **$1.97/hour**
- Daily cap if stuck: **$47.28**

**Mitigation**: Set CloudWatch alarm at 15 tasks

**Scenario 2: Large Response Payloads**
- If responses balloon to 200 KB average (4x):
- Data transfer: $3.07 → **$12.28** per test
- LCU bandwidth charges also 4x

**Mitigation**: Monitor response sizes in logs

**Scenario 3: Extended Test Duration**
- If test runs 2 hours instead of 30 min:
- ECS cost: $1.22 → **$4.88**
- Total: $6.32 → **$12-14**

**Mitigation**: Set test max duration in k6 config

### Recommended Budget Alerts

```terraform
# Add to your IaC
resource "aws_budgets_budget" "load_test_alert" {
  name              = "load-test-cost-alert"
  budget_type       = "COST"
  limit_amount      = "10"
  limit_unit        = "USD"
  time_period_start = "2025-12-01_00:00"
  time_unit         = "DAILY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 50  # Alert at $5
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["your-email@example.com"]
  }
}
```

---

## Database Connection Analysis (Supabase Micro)

### Your Configuration Impact

**Supabase Micro**: 1,000 pooler connections

**With your ECS scaling**:
```
Max tasks: 20
Connections per task (typical pool): 10
Total potential connections: 200

Pooler usage: 200/1,000 = 20% ✅
```

**Even at 20k VUs, you're only using 20% of database capacity!**

This is **EXCELLENT** - no database bottleneck expected.

### Connection Pattern During Test

```
Phase                Tasks   Connections   Pooler %
-------------------------------------------------------
Baseline             1       10            1%
Light (1k VUs)       2       20            2%
Medium (5k VUs)      6       60            6%
Heavy (10k VUs)      12      120           12%
Peak (20k VUs)       20      200           20% ✅
```

**Recommendation**: Supabase Micro is perfectly sized for your testing needs.

---

## Monitoring Checklist

### Pre-Test Setup

```bash
# Set up CloudWatch dashboard for test monitoring
aws cloudwatch put-dashboard --dashboard-name load-test-monitoring \
  --dashboard-body file://dashboard-config.json

# Enable ECS Container Insights (already enabled in your config ✅)
# Enhanced monitoring is set: containerInsights = "enhanced"

# Set budget alert
aws budgets create-budget --account-id XXXXX \
  --budget file://budget-alert.json --notifications-with-subscribers file://subscribers.json
```

### During Test - CloudWatch Metrics to Monitor

1. **ECS Service Metrics**:
   - `CPUUtilization` (target: < 75%)
   - `MemoryUtilization` (target: < 75%)
   - `DesiredTaskCount` (watch scaling)
   - `RunningTaskCount` (should match desired)

2. **ALB Metrics**:
   - `RequestCount` (total load)
   - `TargetResponseTime` (p95 < 1000ms)
   - `HTTPCode_Target_4XX_Count` (should be low)
   - `HTTPCode_Target_5XX_Count` (should be minimal)
   - `ActiveConnectionCount`
   - `ProcessedBytes` (for LCU calculation)

3. **ElastiCache Metrics**:
   - `CacheHits` vs `CacheMisses` (hit rate)
   - `CPUUtilization` (should be low)
   - `NetworkBytesIn/Out`
   - `CurrConnections` (track connection usage)

4. **Cost Metrics** (CloudWatch Billing):
   - `EstimatedCharges` (by service)
   - Track hourly cost accumulation

### Post-Test Analysis

```bash
# Get cost breakdown
aws ce get-cost-and-usage \
  --time-period Start=2025-12-17,End=2025-12-18 \
  --granularity HOURLY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE

# Get ECS task metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=your-service-name \
  --start-time 2025-12-17T02:00:00Z \
  --end-time 2025-12-17T03:00:00Z \
  --period 60 \
  --statistics Maximum,Average
```

---

## Supabase Micro - Connection Deep Dive

### Pooler Capabilities

Supabase Mico pooler can handle:
- **1,000 client connections**
- **120 direct database connections**
- Connection multiplexing ratio: ~8:1

### Your Application Connection Pattern

Based on typical Node.js + TypeORM setup:

```javascript
// Typical connection pool config
{
  type: 'postgres',
  poolSize: 10,          // Max connections per instance
  acquireTimeout: 60000,
  waitForConnections: true
}
```

**At peak load (20 tasks)**:
```
20 ECS tasks × 10 connections = 200 app connections
200 app connections → Supavisor pooler → 25-50 actual DB connections
```

**Database connection load**: 5-10% of capacity ✅

### Query Performance Under Load

Expected query patterns:
- **Read-heavy** (70%): Games list, details, categories
- **Write-medium** (20%): Analytics, likes, user updates
- **Admin-light** (10%): Dashboard queries

**Cache strategy impact**:
```
Cache hit rate: 60-80% (from Redis)
Database queries: Only 20-40% of requests
Actual DB load: Very manageable
```

### Scaling Database If Needed

**Keep Micro if**:
- Connection pool usage < 50%
- Query p95 latency < 500ms
- No connection timeout errors

**Upgrade to Supabase Small ($125/mo) if**:
- Connection pool usage > 70%
- Query p95 latency > 1000ms
- Seeing connection queuing

**Current assessment**: Micro is perfect for 20k VU testing ✅

---

## Final Recommendations

### Immediate Actions

1. **Start Small**: Run smoke test (10 VUs) first
   - Cost: < $0.05
   - Validates setup
   - No risk

2. **Gradual Ramp**: 100 → 1k → 5k → 10k → 20k
   - Each step: ~$0.50-3.00
   - Identify issues early
   - Total phased approach: ~$8-12

3. **Enable Compression**: Add gzip compression
   ```javascript
   app.use(compression({ level: 6, threshold: 1024 }));
   ```
   - Reduces costs by ~50%
   - Improves response times

4. **Set Budget Alerts**: $5, $10, $15 thresholds
   - Prevents cost surprises
   - Automatic notifications

5. **Monitor Key Metrics**:
  - ECS task count (should scale smoothly)
   - CPU/Memory (should stay < 75%)
   - ALB response times (p95 < 1s)
   - Data transfer (watch for spikes)

### Cost Summary

|Test Type | Duration | VUs | Cost |
|----------|----------|-----|------|
| Smoke test | 1 min | 10 | $0.02 |
| Light load | 10 min | 1k | $0.40 |
| Medium load | 20 min | 5k | $1.80 |
| Heavy load | 30 min | 10k | $3.50 |
| **Full load** | **30 min** | **20k** | **$6.32** |
| **Full suite** | **3 hrs** | **varied** | **$26-28** |

### Value Proposition

**Investment**: $6-28 per test run
**Returns**:
- Identify breaking points BEFORE production issues
- Validate 20k user capacity for Black Friday
- Optimize resource allocation
- Prevent downtime (potential $1000s in lost revenue)
- Build confidence in infrastructure

**ROI**: One prevented outage pays for 10-100 test runs

---

## Conclusion

Your infrastructure is **well-configured** for load testing:

✅ Aggressive but reasonable RPS target (150/task)
✅ Sufficient max capacity (20 tasks)
✅ Good auto-scaling config (CPU, Memory, RPS)
✅ Supabase Micro has plenty of headroom
✅ Redis cache will help reduce database load
✅ Cost is predictable and manageable ($6-7 per test)

**Primary Cost Driver**: Data transfer ($3/test)
**Optimization Opportunity**: Enable compression (saves ~$1.50/test)

**You're ready to load test!** 🚀

---

**Analysis Date**: 2025-12-17
**Based On**: Actual IaC configuration from `/home/kkfergie22/iac-arcadesbox`
**Infrastructure**: ECS Fargate (2vCPU/4GB) + ALB + ElastiCache + Supabase Micro
