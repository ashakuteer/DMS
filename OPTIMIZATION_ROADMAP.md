# 🚀 Performance Optimization Roadmap

## Current Status
- Dashboard load time: 5-6 seconds
- Staff actions: 10-15 seconds
- Analytics queries: 5-10 seconds

## Target
- Dashboard: 1.5-2 seconds (3-4x faster)
- Staff actions: 0.5-1 second (15-30x faster)
- Analytics: 1-2 seconds (5-10x faster)

---

## Phase 1: Database Indexes ✅ (SAFE - Already in Schema)

**Status**: Indexes already added to schema, need migration
**Risk**: ⭐ Very Low
**Impact**: 2-5x faster across all queries
**Time**: 5 minutes

### Indexes to Apply:
```sql
-- Donor table
CREATE INDEX IF NOT EXISTS "donors_isDeleted_donationFrequency_idx" ON "donors"("isDeleted", "donationFrequency");
CREATE INDEX IF NOT EXISTS "donors_isDeleted_updatedAt_idx" ON "donors"("isDeleted", "updatedAt");

-- Donation table
CREATE INDEX IF NOT EXISTS "donations_isDeleted_donationDate_idx" ON "donations"("isDeleted", "donationDate");
CREATE INDEX IF NOT EXISTS "donations_donorId_isDeleted_donationDate_idx" ON "donations"("donorId", "isDeleted", "donationDate");
CREATE INDEX IF NOT EXISTS "donations_donationMode_idx" ON "donations"("donationMode");
CREATE INDEX IF NOT EXISTS "donations_donationType_idx" ON "donations"("donationType");

-- Sponsorship table
CREATE INDEX IF NOT EXISTS "sponsorships_isActive_status_idx" ON "sponsorships"("isActive", "status");
CREATE INDEX IF NOT EXISTS "sponsorships_frequency_dueDayOfMonth_idx" ON "sponsorships"("frequency", "dueDayOfMonth");
CREATE INDEX IF NOT EXISTS "sponsorships_isActive_frequency_idx" ON "sponsorships"("isActive", "frequency");
```

### Action Required:
```bash
cd apps/api
npx prisma migrate dev --name add_performance_indexes
```

---

## Phase 2: Optimize Dashboard Actions Query 🎯 (NEXT)

**File**: `apps/api/src/dashboard/dashboard.actions.service.ts`
**Method**: `getStaffActions()`
**Current Issue**: Fetches ALL donors, processes in memory
**Impact**: 10-30x faster

### Current Code Problem:
```typescript
// ❌ BAD: Fetches ALL donors
const allDonors = await this.prisma.donor.findMany({
  where: { deletedAt: null },
  // ... then filters in JavaScript loop
});
```

### Optimized Approach:
```typescript
// ✅ GOOD: Filter in database
const followUpDonors = await this.prisma.donor.findMany({
  where: {
    deletedAt: null,
    donations: {
      some: {
        deletedAt: null,
        donationDate: {
          lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
        }
      }
    }
  },
  take: 50, // Limit results
  orderBy: {
    donations: {
      _max: {
        donationDate: 'asc' // Oldest donation first
      }
    }
  }
});
```

---

## Phase 3: Parallelize Dashboard Insights

**File**: `apps/api/src/dashboard/dashboard.insights.service.ts`
**Current Issue**: Sequential queries (one after another)
**Impact**: 3-5x faster

### Current Pattern:
```typescript
// ❌ BAD: Sequential
const donors = await this.prisma.donor.count();
const donations = await this.prisma.donation.count();
const beneficiaries = await this.prisma.beneficiary.count();
// ... 6+ queries one by one
```

### Optimized Pattern:
```typescript
// ✅ GOOD: Parallel
const [donors, donations, beneficiaries, ...] = await Promise.all([
  this.prisma.donor.count(),
  this.prisma.donation.count(),
  this.prisma.beneficiary.count(),
  // ... all queries at once
]);
```

---

## Phase 4: Optimize Analytics At-Risk Query

**File**: `apps/api/src/analytics/analytics.service.ts`
**Method**: `computeAtRiskDonors()`
**Current Issue**: Likely fetching all donors, processing in loop
**Impact**: 5-10x faster

### Optimization Strategy:
1. Use database aggregations
2. Filter at database level
3. Use indexes from Phase 1

---

## Phase 5: Add Caching (Optional - Later)

**Risk**: ⭐⭐⭐ Medium (caused issues before)
**Impact**: 100x faster for cached data
**Note**: Only after Phases 1-4 are stable

### Safe Caching Strategy:
1. Cache only read-heavy, slow-changing data
2. Short TTL (30-60 seconds)
3. Easy to disable if issues
4. Cache dashboard stats, not user-specific data

---

## Implementation Order

### Week 1: Foundation
- [x] Create backup branch
- [ ] Apply Phase 1 (indexes)
- [ ] Test and measure improvement
- [ ] Deploy to production

### Week 2: Core Optimizations
- [ ] Implement Phase 2 (dashboard actions)
- [ ] Test locally
- [ ] Deploy and monitor
- [ ] Implement Phase 3 (parallelization)
- [ ] Test and deploy

### Week 3: Advanced
- [ ] Implement Phase 4 (analytics)
- [ ] Full testing
- [ ] Deploy and monitor

### Week 4: Polish (Optional)
- [ ] Consider caching if needed
- [ ] Monitor and tune
- [ ] Document learnings

---

## Testing Checklist

After each phase:
- [ ] Run locally and test dashboard
- [ ] Check browser DevTools Network tab for timing
- [ ] Test login and navigation
- [ ] Check for errors in console
- [ ] Run on staging (if available)
- [ ] Deploy to production
- [ ] Monitor for 24 hours

---

## Rollback Plan

If any phase causes issues:

```bash
# Revert last commit
git revert HEAD
git push

# Or switch to backup
git checkout backup-before-optimization
git push -f origin main
```

---

## Success Metrics

### Phase 1 (Indexes)
- Dashboard: 5-6s → 3-4s
- All queries: 2-5x faster

### Phase 2 (Actions Query)
- Staff actions: 10-15s → 0.5-1s
- Dashboard: 3-4s → 2-3s

### Phase 3 (Parallelization)
- Insights: 3-4s → 0.8-1s
- Dashboard: 2-3s → 1.5-2s

### Phase 4 (Analytics)
- Analytics: 5-10s → 1-2s
- At-risk report: Much faster

---

## Notes

- Each phase is independent and safe
- Can stop at any phase if satisfied
- Indexes (Phase 1) give biggest bang for buck
- Phases 2-3 are low-risk, high-reward
- Phase 4 depends on actual analytics code
- Caching (Phase 5) only if really needed

---

**Created**: March 7, 2026
**Status**: Phase 1 Ready to Apply
**Next Action**: Run migration for indexes
