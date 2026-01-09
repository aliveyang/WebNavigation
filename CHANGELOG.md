# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-01-09

### Documentation
- Updated `README.md` to reflect latest features (i18n, Card Appearance customization).
- Cleaned up obsolete documentation files (DEPLOYMENT, ENGINEERING reports, etc.).
- Updated `CLAUDE.md` to reflect the modular architecture.

## [1.1.0] - 2026-01-02

### Added

#### Architecture
- Modular architecture with organized src/ directory structure
- Separated components (BookmarkCard, Header, SearchWidget)
- Organized constants (icons, gradients, searchEngines, storage)
- TypeScript type definitions in dedicated types/ directory
- Utility modules (performance, imageOptimization, security, crypto, rateLimit)

#### Performance
- React.memo with custom comparison for BookmarkCard component
- useCallback for 12 event handler functions
- useMemo for 6 computed values
- Performance utilities: debounce, throttle, rafThrottle
- Image compression (800x800, quality 0.8)
- Image lazy loading (loading="lazy", decoding="async")
- Code splitting (react-vendor, utils, constants chunks)
- Service Worker caching for Tailwind CSS, React CDN, and favicons

#### Security
- XSS protection with URL validation and sanitization
- HTML escaping for special characters
- Image URL validation
- Input validation for titles, URLs, and PINs
- PIN encryption using SHA-256 hashing
- Rate limiting (10 requests/minute for sync, 30 requests/minute for API)
- Content Security Policy (CSP) configuration
- Security response headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Preconnect and DNS prefetch for CDN resources

#### Documentation
- ENGINEERING_RECOMMENDATIONS.md - Comprehensive improvement guide
- PERFORMANCE_OPTIMIZATION_REPORT.md - Detailed performance analysis
- SECURITY_IMPLEMENTATION_REPORT.md - Security measures documentation
- SECURITY_PERFORMANCE.md - Security and performance best practices
- SECURITY_PERFORMANCE_CHECKLIST.md - Quick reference checklist
- DEPLOYMENT_SUMMARY.md - Deployment summary report
- DEPLOYMENT_VERIFICATION.md - Deployment verification guide
- CHANGELOG.md - Version history

#### Configuration
- .eslintrc.json for code quality
- .prettierrc.json for code formatting
- vitest.config.ts for testing setup
- vercel.json for Vercel deployment configuration

### Changed

#### Performance Improvements
- Bundle size reduced from ~200KB to 73.57KB (gzipped) - 63% reduction
- Build time optimized to ~1.6s
- Vite build configuration with Terser minification
- Removed console.log and debugger statements in production

#### Security Improvements
- PIN storage changed from plaintext to SHA-256 hash
- localStorage key changed from `navhub_sync_pin` to `navhub_sync_pin_hash`
- All user inputs now validated and sanitized
- Dangerous URL protocols (javascript:, data:, vbscript:, file:) blocked

#### Architecture
- Split monolithic index.tsx (~930 lines) into modular components
- Organized code into logical directories
- Improved code maintainability and readability

### Updated
- README.md to reflect new architecture
- CLAUDE.md with updated project instructions
- index.html with CSP headers and preconnect links
- vite.config.ts with build optimization and caching strategies

### Breaking Changes
- **PIN Storage**: Users need to re-enable cloud sync as PIN codes are now stored as SHA-256 hashes instead of plaintext
- **localStorage Key**: Changed from `navhub_sync_pin` to `navhub_sync_pin_hash`

### Security Fixes
- Fixed XSS vulnerability in URL input
- Fixed XSS vulnerability in title input
- Fixed plaintext PIN storage vulnerability
- Fixed missing rate limiting on API calls
- Fixed missing Content Security Policy

### Performance Fixes
- Fixed unnecessary component re-renders
- Fixed unoptimized image uploads
- Fixed large bundle size
- Fixed missing code splitting

---

## [1.0.0] - 2025-12-XX

### Added
- Initial release
- Mobile-first personal navigation dashboard
- PWA support with offline functionality
- Cloud sync with PIN-based authentication
- Bookmark management (add, edit, delete)
- Four background styles (gradient, library, icon, image)
- Customizable grid layout (2-6 columns)
- Multiple search engines (Google, Bing, Baidu, DuckDuckGo)
- Long-press interaction for bookmark actions
- Dark theme by default

### Features
- Local storage for bookmarks and settings
- Vercel KV for cloud synchronization
- Responsive design for mobile and desktop
- Touch-optimized interactions
- Haptic feedback support
- Custom scrollbar styling

---

## Version History

- **1.1.0** (2026-01-02) - Major refactoring with performance and security improvements
- **1.0.0** (2025-12-XX) - Initial release

---

## Upgrade Guide

### From 1.0.0 to 1.1.0

#### Breaking Changes

**Cloud Sync PIN:**
- PIN codes are now stored as SHA-256 hashes for security
- Users will need to re-enable cloud sync after upgrading
- Old PIN data will not be migrated automatically

**Steps:**
1. Users should backup their bookmarks before upgrading (optional)
2. After upgrade, go to Cloud Sync settings
3. Enter PIN code again to re-enable sync
4. Data will be synced from cloud if available

#### New Features

**Performance:**
- Enjoy 63% smaller bundle size and faster loading
- Improved rendering performance with React optimizations
- Automatic image compression for uploads

**Security:**
- Enhanced XSS protection
- Encrypted PIN storage
- Rate limiting on API calls
- Content Security Policy enabled

#### No Action Required

- All existing bookmarks and settings are preserved
- UI and functionality remain the same
- No changes to bookmark data structure

---

## Contributing

When contributing, please:
1. Update this CHANGELOG.md with your changes
2. Follow [Semantic Versioning](https://semver.org/)
3. Use [Conventional Commits](https://www.conventionalcommits.org/)

### Version Number Guidelines

- **Major (X.0.0)**: Breaking changes, major features
- **Minor (1.X.0)**: New features, non-breaking changes
- **Patch (1.0.X)**: Bug fixes, minor improvements

---

## Links

- [GitHub Repository](https://github.com/aliveyang/WebNavigation)
- [Vercel Deployment](https://your-project.vercel.app)
- [Documentation](./README.md)
