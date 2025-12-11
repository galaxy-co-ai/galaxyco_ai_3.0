# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Phone Number Provisioning System** (Tasks 1-4 Complete)
  - Edit Number Modal: Edit friendly name and number type for provisioned numbers
  - Conversations Integration: Phone number badge displays in Conversations header with formatted number
  - Department Routing: Incoming messages/calls are tagged with `department:{type}` and `number:{friendlyName}` 
  - Conversation Filtering: iOS-style department filter (All, Main, Sales, Support) with badge counts
  - Multi-workspace support: Handles both Clerk organizations and legacy workspace UUIDs
  - SignalWire webhook handlers for SMS, WhatsApp, and voice calls
  - Auto-provisioning on workspace creation
  - Professional tier requirement enforced (upgrade banner shown for free tier)

### Changed
- Phone number API routes now support Clerk organization IDs (format: `org_*`)
- Lazy-loaded SignalWire SDK to prevent lodash dependency errors on every request
- Updated all phone number routes to use Next.js 15 async params pattern
- Replaced Twilio references with SignalWire in UI components
- Department filter UI matches existing design system (glassmorphism, rounded-full buttons, iOS-style)

### Fixed
- **Critical**: Fixed `Cannot find module 'lodash'` error by lazy-loading auto-provisioning logic
- **Critical**: Fixed 500 errors when accessing phone numbers with Clerk organization IDs
- **Critical**: Fixed "invalid input syntax for type uuid" by separating Clerk org ID lookup from workspace UUID
- Fixed TypeScript errors with nullable `numberType` field
- Fixed Next.js 15 async params deprecation warnings in all phone number API routes
- Fixed phone numbers not loading in Galaxy Co workspace due to membership check issues

### Technical Details
- **Database**: Uses `workspace_phone_numbers` table with `numberType`, `friendlyName`, `status` fields
- **Routing**: SignalWire webhooks configured at `/api/webhooks/signalwire/*` (voice, SMS, status)
- **Tags**: Conversations use `tags` array field for department routing: `["department:primary", "number:Main Office"]`
- **Dependencies**: Requires SignalWire 10DLC campaign approval for SMS (voice calls work immediately)
- **Production**: Live on Vercel with phone number `(405) 705-2345` in Galaxy Co workspace

### Security
- No environment variables exposed in logs (reference by name only)
- SignalWire credentials stored securely in environment variables
- Debug logging added for troubleshooting (to be removed after stability confirmed)

### Pending
- **SignalWire 10DLC Campaign Approval** (1-3 business days)
  - SMS testing blocked until approved
  - Voice calls functional immediately
  - Post-approval testing checklist created (7 TODO items)

## [Previous] - 2024-12-10
- Initial phone number provisioning implementation (Phases 1-5)
- Core SignalWire integration
- Basic UI for viewing provisioned numbers
- Workspace phone number management endpoints
