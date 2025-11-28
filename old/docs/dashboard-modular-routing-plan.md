# Dashboard Modular Routing Refactor Plan

## Current Problem
The `Dashboard.tsx` component is doing too much:
- Handling all route params for projects, channels, and events
- Managing data fetching for projects, channels, and events
- Orchestrating URL ↔ state synchronization
- Rendering different views (overview, settings, project content)

This creates a monolithic component that's hard to maintain and test.

## Proposed Modular Structure

### Route Distribution Strategy

```
App.tsx (Route Definitions)
├── /dashboard → DashboardLayout (Shell with ProjectsBar)
│   ├── /dashboard (index) → OverviewPage
│   ├── /dashboard/settings → SettingsPage
│   └── /dashboard/projects/:projectId → ProjectLayout
│       ├── /dashboard/projects/:projectId (index) → ProjectHome (all channels)
│       ├── /dashboard/projects/:projectId/channels/:channelId → ChannelPage
│       └── /dashboard/projects/:projectId/channels/:channelId/events/:eventId → EventDetailPage
```

### Component Responsibilities

#### 1. **DashboardLayout** (Outer Shell)
- **Route**: `/dashboard/*` (wraps all dashboard routes)
- **Responsibility**: 
  - Fetch and provide projects/channels data to context
  - Render `ProjectsBar` (always visible)
  - Render nested route content via `<Outlet />`
- **Location**: `apps/frontend/src/pages/app/DashboardLayout.tsx`

#### 2. **OverviewPage** (Landing & At-a-Glance)
- **Route**: `/dashboard` (index route)
- **Responsibility**: 
  - Render `AtGlance` component
  - Show cross-project overview
  - Default landing page when no project is selected
- **Location**: `apps/frontend/src/pages/app/OverviewPage.tsx`

#### 3. **SettingsPage**
- **Route**: `/dashboard/settings`
- **Responsibility**: 
  - Render `Settings` component
  - Handle settings navigation
- **Location**: `apps/frontend/src/pages/app/SettingsPage.tsx`

#### 4. **ProjectLayout** (Project-Level Shell)
- **Route**: `/dashboard/projects/:projectId/*`
- **Responsibility**: 
  - Extract `projectId` from URL params
  - Sync project to context (validate, redirect if invalid)
  - Render `ChannelBar` (always visible for this project)
  - Render nested route content via `<Outlet />`
- **Location**: `apps/frontend/src/pages/app/ProjectLayout.tsx`

#### 5. **ProjectHome** (All Channels View)
- **Route**: `/dashboard/projects/:projectId` (index)
- **Responsibility**: 
  - Show all events for the selected project
  - Equivalent to "all channels" view
- **Location**: `apps/frontend/src/pages/app/ProjectHome.tsx`

#### 6. **ChannelPage**
- **Route**: `/dashboard/projects/:projectId/channels/:channelId`
- **Responsibility**: 
  - Extract `channelId` from URL params
  - Sync channel to context (validate, redirect if invalid)
  - Fetch and display events for this channel
  - Render `ChannelEventsList`
- **Location**: `apps/frontend/src/pages/app/ChannelPage.tsx`

#### 7. **EventDetailPage**
- **Route**: `/dashboard/projects/:projectId/channels/:channelId/events/:eventId`
- **Responsibility**: 
  - Extract `eventId` from URL params
  - Sync event to context (validate, redirect if invalid)
  - Render `EventDetails` component
- **Location**: `apps/frontend/src/pages/app/EventDetailPage.tsx`

---

## Benefits of This Approach

1. **Separation of Concerns**: Each component handles only its own route params and data
2. **Easier Testing**: Smaller, focused components are easier to unit test
3. **Better Code Organization**: Related logic stays together
4. **Clearer Data Flow**: Each level of nesting handles its own validation/fetching
5. **Improved Maintainability**: Changes to one route don't affect others
6. **Better Error Boundaries**: Can add error boundaries at each layout level
7. **Lazy Loading**: Can code-split routes more easily

---

## Data Fetching Strategy

### DashboardLayout Level
- Fetch projects and channels once (shared across all views)
- Store in context for all child routes

### ProjectLayout Level
- Validate project exists
- No additional data fetching (uses context)

### ChannelPage Level
- Fetch events for the selected channel
- Handle polling/refresh

### EventDetailPage Level
- Validate event exists
- No additional fetching (event already loaded by ChannelPage)

---

## Migration Steps

### Step 1: Create Layout Components
1. Create `DashboardLayout.tsx` - move projects/channels fetching here
2. Create `ProjectLayout.tsx` - handle project param validation

### Step 2: Create Page Components
1. Create `OverviewPage.tsx` - wrap `AtGlance` (landing page)
2. Create `SettingsPage.tsx` - wrap `Settings`
3. Create `ProjectHome.tsx` - all channels view
4. Create `ChannelPage.tsx` - move channel events logic
5. Create `EventDetailPage.tsx` - wrap `EventDetails`

### Step 3: Update App.tsx Routes
- Replace single `/dashboard` route with nested structure
- Use `<Outlet />` for nested rendering

### Step 4: Update Context (if needed)
- May need to adjust how data is stored/accessed
- Ensure context works with new component hierarchy

### Step 5: Clean Up
- Remove old `Dashboard.tsx`
- Update imports across the app
- Test all routes

---

## File Structure After Refactor

```
apps/frontend/src/pages/app/
├── DashboardLayout.tsx        # Shell with ProjectsBar + data fetching
├── OverviewPage.tsx           # Overview view (landing page)
├── SettingsPage.tsx           # Settings view
├── ProjectLayout.tsx          # Project shell with ChannelBar
├── ProjectHome.tsx            # All channels for project
├── ChannelPage.tsx            # Single channel events
└── EventDetailPage.tsx        # Event details
```

---

## Implementation Priority

1. **High Priority**: DashboardLayout, ProjectLayout (core structure)
2. **Medium Priority**: ChannelPage, EventDetailPage (main user flows)
3. **Low Priority**: OverviewPage, SettingsPage (simpler views)
