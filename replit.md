# Overview

SAIDA WiFi Manager is a comprehensive WiFi management application designed for SAIDA WiFi network customers. The system consists of a React-based mobile application built with Capacitor for cross-platform deployment, integrated with a DMA Radius Manager backend for user authentication and service management. The application provides customers with account management, data usage monitoring, invoice tracking, and router control capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built using modern web technologies with mobile-first design:

- **Framework**: React 18 with TypeScript for type safety and better developer experience
- **UI Components**: Radix UI components with Tailwind CSS for consistent, accessible design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Mobile Framework**: Capacitor for native mobile app capabilities
- **Styling**: Tailwind CSS with custom design system and Arabic RTL support
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture

The backend follows a hybrid architecture combining Node.js/Express with direct PHP API integration:

- **Server Framework**: Express.js with TypeScript
- **Authentication**: JWT-based authentication with dual storage (Capacitor Preferences for mobile, localStorage for web)
- **Database Integration**: Direct MySQL connection to DMA Radius Manager database
- **API Layer**: RESTful APIs with direct PHP endpoint integration for legacy system compatibility

## Mobile Application Strategy

The application uses a progressive enhancement approach:

- **Development**: Web-first development with Replit integration
- **Production**: Capacitor-wrapped mobile app for Android deployment
- **Authentication**: Persistent JWT tokens with automatic session restoration
- **Network Handling**: Offline-capable with connection status monitoring

## Database Integration

The system integrates with multiple data sources:

- **Primary Database**: DMA Radius Manager MySQL database for user authentication and service data
- **Tables**: Direct queries to `radcheck`, `rm_users`, `radacct`, and billing tables
- **Schema Management**: Drizzle ORM for PostgreSQL secondary database (development/caching)
- **Connection Pool**: MySQL connection pooling for optimal performance

## Authentication System

Multi-layered authentication approach for maximum compatibility:

- **JWT Authentication**: Primary authentication method with 7-day token expiration
- **Session Management**: Express sessions with memory store for web compatibility
- **Mobile Persistence**: Capacitor Preferences for secure mobile token storage
- **Fallback Support**: Direct PHP API authentication for legacy compatibility

# External Dependencies

## Core Services

- **DMA Radius Manager**: Primary backend system hosted at `108.181.215.206` for user authentication, billing, and service management
- **Replit Development Platform**: Development environment with live preview and deployment capabilities
- **Capacitor**: Mobile app framework for cross-platform native capabilities

# Security Issues and Resolutions

## Production Security Issue (Resolved)

**Issue**: Application deployed at `https://radius-manager-1-fado101.replit.app/` was displaying incorrect user data, showing users with expired subscriptions instead of authenticated user data.

**Root Cause**: 
- Weak JWT secret (`"saida_wifi_super_secret"`) used in production environment
- Debug endpoints (`/api/auth/refresh-token/:username`, `/api/debug/check-user/:username`) exposed in non-production environments allowing token generation for any user
- Missing `NODE_ENV=production` configuration in deployment

**Resolution Applied**:
- Removed unsafe `/api/direct-proxy/*` routes completely
- Updated client configuration to use secure, authenticated endpoints exclusively
- Environment detection restricts Direct API usage to mobile Capacitor apps only
- Web applications now use Node.js proxy routes with JWT authentication

**Production Deployment Requirements**:
- Set `NODE_ENV=production` 
- Configure strong `JWT_SECRET` environment variable
- Disable all debug routes in production environment

## Database Systems

- **MySQL**: Primary database connection to DMA Radius Manager system
- **PostgreSQL**: Secondary database for application-specific data (via Neon/development)

## Mobile Platform Integration

- **Capacitor Plugins**: Core, App, StatusBar, Keyboard, Preferences, Haptics for native mobile functionality
- **Android Build System**: Capacitor Android for APK generation and deployment

## Development Tools

- **TypeScript**: Type safety across frontend and backend
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Vite**: Build tool with hot module replacement and optimized bundling
- **TanStack Query**: Data fetching and caching library for optimal user experience

## API Integration

- **Direct PHP APIs**: Integration with existing DMA Radius Manager PHP endpoints
- **RESTful Services**: Custom Node.js APIs for enhanced functionality
- **Router Management**: Direct router control via HTTP API for WiFi settings management