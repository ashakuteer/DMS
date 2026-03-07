# 🚀 Start Performance Optimization Here

## ✅ Safe Rollback Point Created
**Tag**: `stable-before-optimization`  
**Status**: Ready to optimize safely

---

## 🎯 Phase 1: Add Database Indexes (START HERE - SAFEST)

**Risk**: ⭐ Very Low  
**Time**: 5 minutes  
**Impact**: 2-5x faster queries  
**Rollback**: Easy

### Why This First?
- Safest optimization (just adds indexes)
- No code changes
- Biggest impact for least risk
- Can't break functionality

### What It Does
Adds indexes to speed up these slow queries:
- Donor lookups by deletedAt
- Donation queries by date
- Sponsorship queries by status

### Steps

1. **Add indexes to Prisma schema**:

Open `apps/api/prisma/schema.prisma` and add these indexes:

```prisma
model Donation {
  // ... existing fields ...
  
  @@index([deletedAt, donationDate])
  @@index([donorId, deletedAt, donationDate])
  @@index([donationMode])
}

model Donor {
  // ... existing fields ...
  
  @@index([deletedAt, donationFrequency])
  @@index([deletedAt, createdAt])
}

model Sponsorship {
  // ... existing fields ...
  
  @@index([isActive, status])
  @@index([frequency, dueDayOfMonth])
}
```

2. **Create migration**:
```bash
cd apps/api
npx prisma migrate dev --name add_performance_indexes
```

3. **Test locally**:
```bash
npm run dev
# Test: http://localhost:3001/api/dashboard/stats
```

4. **Commit and push**:
```bash
git add apps/api/prisma
git commit -m "Phase 1: Add database indexes for performance"
git push origin main
```

5. **Monitor Railway deployment**
- Wait 2-3 minutes
- Check Railway logs
- Test dashboard - should be faster!

### Expected Result
- Dashboard: 5-6s → 3-4s
- All queries: 2-5x faster
- No functionality changes

### If Something Breaks
```bash
git revert HEAD --no-edit
git push origin main
```

---

## 🎯 Phase 2: Parallelize Dashboard Insights (NEXT)

**Risk**: ⭐⭐ Low  
**Time**: 10 minutes  
**Impact**: 3-5x faster insights  

### What It Does
Changes sequential queries to run in parallel using Promise.all()

### Current Code (Slow)
```typescript
// Queries run one after another
const thisMonth = await this.prisma.donation.aggregate(...);
const lastMonth = await this.prisma.donation.aggregate(...);
// Total time: 1s + 1s + 1s = 3s
```

### Optimized Code (Fast)
```typescript
// Queries run simultaneously
const [thisMonth, lastMonth, ...] = await Promise.all([
  this.prisma.donation.aggregate(...),
  this.prisma.donation.aggregate(...),
]);
// Total time: max(1s, 1s, 1s) = 1s
```

### Steps (After Phase 1 is deployed)

1. **Modify `apps/api/src/dashboard/dashboard.insights.service.ts`**

Find the `getAIInsights()` method and change it to use Promise.all()

2. **Test locally**
3. **Commit and push**
4. **Monitor**

---

## 🎯 Phase 3: Optimize Dashboard Actions Query

**Risk**: ⭐⭐ Low  
**Time**: 15 minutes  
**Impact**: 10-30x faster  

### What It Does
Instead of fetching ALL donors and filtering in JavaScript, filter in the database

### Current Code (Slow)
```typescript
// Fetches ALL donors (1000+)
const allDonors = await this.prisma.donor.findMany({
  where: { deletedAt: null },
});

// Then filters in JavaScript loop
for (const donor of allDonors) {
  if (daysSince > 60) {
    // add to list
  }
}
```

### Optimized Code (Fast)
```typescript
// Only fetches donors who need follow-up
const donorsNeedingFollowUp = await this.prisma.donor.findMany({
  where: {
    deletedAt: null,
    donations: {
      some: {
        deletedAt: null,
        donationDate: { lt: sixtyDaysAgo },
      },
    },
  },
  take: 50, // Limit results
});
```

---

## 🎯 Phase 4: Optimize Analytics At-Risk Query

**Risk**: ⭐⭐ Medium  
**Time**: 20 minutes  
**Impact**: 5-10x faster  

### What It Does
Same as Phase 3 but for the analytics at-risk donors query

---

## 📊 Progress Tracker

- [ ] Phase 1: Database Indexes (5 min)
- [ ] Phase 2: Parallelize Insights (10 min)
- [ ] Phase 3: Optimize Actions Query (15 min)
- [ ] Phase 4: Optimize Analytics Query (20 min)

**Total Time**: ~50 minutes  
**Total Impact**: 5-6s → 1.5-2s (3-4x faster)

---

## 🚨 Safety Rules

1. **Do ONE phase at a time**
2. **Test locally before pushing**
3. **Wait for deployment to complete**
4. **Test in production**
5. **If broken → Rollback immediately**

---

## 📞 Quick Commands

**Rollback to stable**:
```bash
git reset --hard stable-before-optimization && git push origin main --force
```

**Revert last commit**:
```bash
git revert HEAD --no-edit && git push origin main
```

---

**Ready to start?** Begin with Phase 1 (Database Indexes)!
