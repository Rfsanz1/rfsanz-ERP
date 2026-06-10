# POS Module - Setup & Configuration Guide

## Prerequisites

### Backend Requirements
- Node.js 18+
- PostgreSQL 14+
- NestJS 10+
- Prisma 5+

### Frontend Requirements
- Node.js 18+
- Next.js 14+
- React 18+
- pnpm workspace

---

## Installation Steps

### 1. Install Dependencies

```bash
# Root directory
pnpm install

# Backend setup
cd apps/backend
pnpm install
npm run build

# Frontend setup
cd apps/pos-app
pnpm install
```

### 2. Database Setup

```bash
# Generate Prisma client
cd apps/backend
npx prisma generate

# Create/update database
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

### 3. Environment Variables

#### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/gentong_mas"
JWT_SECRET="your-super-secret-key-here"
JWT_EXPIRATION="24h"
NODE_ENV="development"
API_PORT=3001
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_APP_NAME="POS Gentong MAS"
```

### 4. Run Services

```bash
# Terminal 1: Backend
cd apps/backend
npm run start:dev

# Terminal 2: Frontend (POS App)
cd apps/pos-app
npm run dev
```

Access at: `http://localhost:3000`

---

## Configuration Files

### Tailwind CSS (`tailwind.config.ts`)
```typescript
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'pos-primary': '#059669',
        'pos-light': '#ECFDF5',
        'pos-bg': '#F0FDF4',
      },
    },
  },
  plugins: [],
};
```

### PostCSS (`postcss.config.js`)
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### Next.js (`next.config.mjs`)
```javascript
export default {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
};
```

---

## Service Worker Registration

Add to your layout root:

```typescript
'use client';
import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('SW registration failed:', err);
      });
    }
  }, []);
  return null;
}
```

Usage in layout.tsx:
```typescript
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

export default function RootLayout() {
  return (
    <html>
      <body>
        <ServiceWorkerRegister />
        {/* ... */}
      </body>
    </html>
  );
}
```

---

## Database Schema

### Core Tables

**pos_sales**
```sql
CREATE TABLE pos_sales (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  kasir_id UUID REFERENCES users(id),
  session_id UUID REFERENCES pos_sessions(id),
  items JSONB NOT NULL,
  subtotal DECIMAL NOT NULL,
  diskon DECIMAL DEFAULT 0,
  pajak DECIMAL NOT NULL,
  grand_total DECIMAL NOT NULL,
  bayar DECIMAL NOT NULL,
  metode_bayar VARCHAR(50) NOT NULL,
  split_payments JSONB,
  status VARCHAR(20) DEFAULT 'selesai',
  no_struk VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**pos_sessions**
```sql
CREATE TABLE pos_sessions (
  id UUID PRIMARY KEY,
  kasir_id UUID REFERENCES users(id),
  opened_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  cash_float DECIMAL NOT NULL,
  total_sales DECIMAL DEFAULT 0,
  total_transactions INT DEFAULT 0,
  payment_breakdown JSONB,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**loyalty_configs**
```sql
CREATE TABLE loyalty_configs (
  id UUID PRIMARY KEY,
  point_per_rupiah DECIMAL DEFAULT 0.001,
  min_points_redeem INT DEFAULT 1000,
  point_value DECIMAL DEFAULT 1000,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Authentication

### JWT Token Flow

1. **Login**
   ```bash
   POST /auth/login
   Body: { email, password }
   Response: { access_token, user, ... }
   ```

2. **Store Token**
   ```javascript
   localStorage.setItem('token', access_token);
   ```

3. **Use in Requests**
   ```javascript
   axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
   ```

4. **Token Refresh** (if implemented)
   ```bash
   POST /auth/refresh
   Header: Authorization: Bearer {token}
   ```

---

## Error Handling

### Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Continue |
| 400 | Bad Request | Fix request data |
| 401 | Unauthorized | Re-login |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Check resource ID |
| 422 | Validation Error | Fix validation errors |
| 500 | Server Error | Retry or contact support |

### Error Response Format
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["Email already exists"],
    "password": ["Min 8 characters"]
  }
}
```

---

## Performance Optimization

### Caching Strategy

**Service Worker Cache:**
```javascript
// Static assets: Cache first
/app/*.js
/public/static/*

// API: Network first
/api/*

// HTML: Network first with cache fallback
index.html, *.html
```

### LocalStorage Usage

```javascript
// Pending transactions (max 50 items)
pos_pending_transactions: Array<Transaction>

// Auth token
token: string
user: Object

// Preferences
pos_user_preferences: Object
```

### Bundle Size

- Main app: ~200KB gzip
- With dependencies: ~500KB gzip
- Service Worker: ~20KB

---

## Testing

### Unit Tests

```bash
# Backend
cd apps/backend
npm run test
npm run test:e2e

# Frontend
cd apps/pos-app
npm run test
```

### Manual Testing Checklist

- [ ] Add product to cart
- [ ] Modify quantity (add/remove)
- [ ] Apply discount
- [ ] Select payment method
- [ ] Process checkout online
- [ ] Hold transaction
- [ ] Resume transaction
- [ ] Offline mode (disconnect network)
- [ ] Create transaction offline
- [ ] Reconnect & auto-sync
- [ ] Print receipt
- [ ] View order history
- [ ] Open/close session

---

## Deployment

### Build for Production

```bash
# Frontend
cd apps/pos-app
npm run build
npm run export  # For static export

# Backend
cd apps/backend
npm run build
npm run start:prod
```

### Docker Setup

```dockerfile
# apps/pos-app/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

```bash
docker build -t pos-app .
docker run -p 3000:3000 pos-app
```

### Environment for Production

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_APP_NAME=POS Gentong MAS
```

---

## Maintenance

### Regular Tasks

- **Daily**: Close session, backup transaction data
- **Weekly**: Review error logs, update inventory
- **Monthly**: Archive old transactions, loyalty cleanup
- **Quarterly**: Update dependencies, security patches

### Backup Strategy

```bash
# Database backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20250115.sql

# Archive old transactions (older than 6 months)
DELETE FROM pos_sales WHERE created_at < NOW() - INTERVAL '6 months';
```

---

## Monitoring

### Logs

- **Backend**: `/logs/app.log`
- **Frontend**: Browser console (F12)
- **Database**: PostgreSQL logs

### Metrics to Monitor

- Transaction success rate
- Average response time
- Failed sync attempts
- Service worker cache hits
- User session duration

---

## Troubleshooting Deployment

### Issue: API unreachable from frontend
```bash
# Check backend is running
curl http://localhost:3001/api/health

# Check CORS is enabled
# In NestJS main.ts
app.enableCors();
```

### Issue: Database migration fails
```bash
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Or run specific migration
npx prisma migrate deploy --name=fix_schema
```

### Issue: Service Worker not updating
```bash
# Clear cache
chrome://cache/
chrome://apps-internals/

# Or unregister in code
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
```

---

## Support & Resources

- **Documentation**: `/apps/pos-app/POS_FEATURES.md`
- **API Docs**: Swagger at `/api/docs`
- **Issues**: GitHub repository issues
- **Changelog**: `/CHANGELOG.md`

---

**Last Updated:** January 2025  
**Version:** 1.0.0
