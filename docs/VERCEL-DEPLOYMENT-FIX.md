# Vercel Deployment Checklist

## Critical Environment Variables

Ensure these are set in your Vercel project settings:

### Required Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Optional but Recommended
```
ENABLE_LOGGING=true
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable for **Production**, **Preview**, and **Development**
4. Redeploy your application after adding variables

## Common Issues and Solutions

### Issue 1: "Missing Supabase environment variables"
**Solution:** Environment variables are not set in Vercel
- Check Vercel dashboard → Settings → Environment Variables
- Ensure variables don't have extra spaces or quotes
- Redeploy after adding variables

### Issue 2: Authentication fails on Vercel
**Solution:** Cookie configuration or middleware issue
- Verify Supabase URL is accessible from Vercel
- Check that middleware is not blocking API routes
- Ensure cookies are being set properly

### Issue 3: Database connection timeouts
**Solution:** Connection pooling or slow queries
- Check Supabase dashboard for connection limits
- Verify database is not overloaded
- Review slow query logs

### Issue 4: CORS errors
**Solution:** Missing headers configuration
- Verify `vercel.json` is present and properly configured
- Check browser console for specific CORS errors
- Ensure API routes return proper headers

## Testing After Deployment

1. **Test Authentication**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "test123"}'
   ```

2. **Test Comment Creation**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/posts/{post-id}/comments \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"content": "Test comment"}'
   ```

3. **Check Logs**
   - Go to Vercel dashboard → Deployments → View Function Logs
   - Look for error messages with context
   - Check for environment variable validation errors

## Debugging Production Issues

### Enable Detailed Logging
Set this environment variable in Vercel:
```
ENABLE_LOGGING=true
```

### View Real-time Logs
```bash
vercel logs your-project-name --follow
```

### Check Function Execution
- Go to Vercel dashboard
- Click on your deployment
- Navigate to "Functions" tab
- Check execution times and error rates

## What Was Fixed

### 1. Runtime Configuration
- Added `runtime = 'nodejs'` for Vercel compatibility
- Set `dynamic = 'force-dynamic'` to prevent static optimization issues
- Added `maxDuration = 10` to prevent timeouts

### 2. Environment Variable Validation
- Added checks for required Supabase environment variables
- Logs detailed error messages when variables are missing
- Prevents cryptic "undefined" errors

### 3. Enhanced Error Logging
- Errors now always log in production
- Added error codes, details, and hints to logs
- Includes environment context for debugging

### 4. Improved Error Responses
- Return detailed error messages in development
- Include error details in response for easier debugging
- Better error categorization (auth, validation, server)

### 5. CORS Configuration
- Added `vercel.json` with proper CORS headers
- Allows cross-origin requests to API routes
- Configured for common HTTP methods

### 6. Middleware Improvements
- Added try-catch for graceful error handling
- Validates environment variables before processing
- Better error logging for debugging

## Next Steps

1. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "fix: Add Vercel deployment fixes for comments API"
   git push origin main
   ```

2. **Verify environment variables in Vercel**

3. **Redeploy from Vercel dashboard**

4. **Test the comment functionality**

5. **Monitor logs for any errors**

## Support Resources

- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Debugging Vercel Deployments](https://vercel.com/docs/observability/runtime-logs)
