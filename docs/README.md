# MeroCircle Documentation

Welcome to the MeroCircle documentation. This directory contains comprehensive documentation for the entire codebase.

## Documentation Index

### 1. [Technical Overview](./01-TECHNICAL-OVERVIEW.md)
Complete overview of the project, technology stack, features, and architecture.

**Topics Covered**:
- Project description and purpose
- Technology stack
- Project structure
- Key features
- Database schema
- Security features
- Performance optimizations

### 2. [Architecture Documentation](./02-ARCHITECTURE.md)
Detailed system architecture, data flow, and design patterns.

**Topics Covered**:
- High-level architecture
- Frontend architecture
- Backend architecture
- Data flow diagrams
- Authentication flow
- Payment flow
- Database architecture
- Caching strategy
- Security architecture
- Performance optimizations
- Scalability considerations

### 3. [Third-Party Integrations](./03-THIRD-PARTY-INTEGRATIONS.md)
Comprehensive guide to all third-party services integrated into MeroCircle.

**Services Covered**:
- **Supabase**: Database, authentication, storage
- **Stream Chat**: Real-time messaging
- **SendGrid**: Email notifications
- **eSewa**: Payment gateway
- **Khalti**: Payment gateway

**For Each Service**:
- Setup instructions
- Configuration
- Implementation details
- Usage examples
- Troubleshooting

### 4. [Deployment Guide](./04-DEPLOYMENT.md)
Step-by-step guide for deploying MeroCircle to Vercel.

**Topics Covered**:
- Prerequisites
- Deployment steps
- Environment variables
- Post-deployment configuration
- Monitoring and analytics
- Scaling considerations
- Security best practices
- Troubleshooting

### 5. [Code Best Practices](./05-CODE-BEST-PRACTICES.md)
Coding standards, patterns, and best practices used throughout the codebase.

**Topics Covered**:
- TypeScript standards
- React patterns
- API route patterns
- Component organization
- State management
- Error handling
- Performance optimization
- Security practices
- Code style guidelines

### 6. [API Routes Documentation](./06-API-ROUTES.md)
Complete reference for all API endpoints.

**Topics Covered**:
- Authentication endpoints
- Creator endpoints
- Post management
- Payment processing
- Social features
- Notifications
- Dashboard
- Stream Chat integration
- Community features

**For Each Endpoint**:
- HTTP method and path
- Authentication requirements
- Request parameters
- Request body
- Response format
- Error responses

### 7. [Database Schema Documentation](./07-DATABASE-SCHEMA.md)
Comprehensive reference for the PostgreSQL database schema.

**Topics Covered**:
- All database tables with complete column definitions
- Table relationships and foreign keys
- Indexes and performance optimizations
- Triggers and automatic functions
- Database functions (stored procedures)
- Row Level Security (RLS) policies
- Migration history
- Best practices for querying and modifications

## Quick Start

1. **New to the project?** Start with [Technical Overview](./01-TECHNICAL-OVERVIEW.md)
2. **Understanding the system?** Read [Architecture Documentation](./02-ARCHITECTURE.md)
3. **Setting up integrations?** Check [Third-Party Integrations](./03-THIRD-PARTY-INTEGRATIONS.md)
4. **Deploying?** Follow [Deployment Guide](./04-DEPLOYMENT.md)
5. **Writing code?** Review [Code Best Practices](./05-CODE-BEST-PRACTICES.md)
6. **Working with APIs?** Reference [API Routes Documentation](./06-API-ROUTES.md)
7. **Working with database?** Reference [Database Schema Documentation](./07-DATABASE-SCHEMA.md)

## Documentation Standards

- **Markdown Format**: All documentation is in Markdown
- **Code Examples**: Include TypeScript/JavaScript examples
- **Diagrams**: ASCII diagrams for architecture
- **Links**: Cross-references between documents
- **Updates**: Last updated date on each document

## Contributing to Documentation

When updating documentation:
1. Update the relevant document
2. Update the "Last Updated" date
3. Ensure code examples are accurate
4. Test any commands or procedures
5. Cross-reference related documents

## Additional Resources

- **Main README**: See root `README.md` for quick setup
- **Migration Files**: See `supabase/migrations/` for database schema
- **Type Definitions**: See `lib/types.ts` and `lib/supabase.ts` for TypeScript types
- **Configuration**: See `lib/config.ts` for app configuration

## Support

For questions or issues:
1. Check the relevant documentation
2. Review code examples
3. Check GitHub issues (if applicable)
4. Contact the development team

---

**Last Updated**: January 2025
