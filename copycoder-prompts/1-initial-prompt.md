Initialize Next.js in current directory:
```bash
create the newest version of nextjs project in the current directory
```

Now let's move back to the parent directory and move all files except prompt.md.

For Windows (PowerShell):
```powershell
cd ..; Move-Item -Path "temp*" -Destination . -Force; Remove-Item -Path "temp" -Recurse -Force
```

For Mac/Linux (bash):
```bash
cd .. && mv temp/* temp/.* . 2>/dev/null || true && rm -rf temp
```

Set up the frontend according to the following prompt:
<frontend-prompt>
Create detailed components with these requirements:
1. Use 'use client' directive for client-side components
2. Make sure to concatenate strings correctly using backslash
3. Style with Tailwind CSS utility classes for responsive design
4. Use Lucide React for icons (from lucide-react package). Do NOT use other UI libraries unless requested
5. Use stock photos from picsum.photos where appropriate, only valid URLs you know exist
6. Configure next.config.js image remotePatterns to enable stock photos from picsum.photos
7. Create root layout.tsx page that wraps necessary navigation items to all pages
8. MUST implement the navigation elements items in their rightful place i.e. Left sidebar, Top header
9. Accurately implement necessary grid layouts
10. Follow proper import practices:
   - Use @/ path aliases
   - Keep component imports organized
   - Update current src/app/page.tsx with new comprehensive code
   - Don't forget root route (page.tsx) handling
   - You MUST complete the entire prompt before stopping

<summary_title>
Construction Plan Management Dashboard UI
</summary_title>

<image_analysis>

1. Navigation Elements:
- Left sidebar with: Field Management (Plans, Specifications, Tasks, Photos, Forms, Files)
- Project Management section with task categories
- Top bar with: Search, New plan, New folder, Actions dropdown
- User profile and settings in top right


2. Layout Components:
- Left sidebar: 250px width, dark theme
- Main content area: Fluid width with grid layout
- Top bar: 60px height
- Plan thumbnails: ~200px x 150px each


3. Content Sections:
- Plan categories with expandable sections
- Grid view of plan thumbnails
- Plan numbering system (001_01, 002_02, etc.)
- Empty states shown with "+ New plan" placeholder


4. Interactive Controls:
- Expandable/collapsible section headers
- Filterable plan views
- Search functionality
- Version control toggle
- Filter plans dropdown


5. Colors:
- Primary: #1a73e8 (Blue accent)
- Background: #FFFFFF
- Sidebar: #2F3437
- Text: #333333
- Border: #E0E0E0


6. Grid/Layout Structure:
- Responsive grid system for plan thumbnails
- 4-column layout for desktop view
- 20px gutters between items
- Consistent padding (16px) around containers
</image_analysis>

<development_planning>

1. Project Structure:
```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar
│   │   ├── TopBar
│   │   └── PlanGrid
│   ├── features/
│   │   ├── PlanViewer
│   │   ├── SearchBar
│   │   └── FilterControls
│   └── shared/
├── assets/
├── styles/
├── hooks/
└── utils/
```


2. Key Features:
- Plan thumbnail generation and display
- Category-based plan organization
- Search and filtering system
- Version control management
- Plan metadata handling


3. State Management:
```typescript
interface AppState {
├── plans: {
│   ├── items: Plan[]
│   ├── selectedCategory: string
│   ├── filters: FilterOptions
│   └── searchQuery: string
├── }
├── ui: {
│   ├── sidebarOpen: boolean
│   ├── currentView: ViewType
│   └── loading: boolean
├── }
}
```


4. Routes:
```typescript
const routes = [
├── '/plans',
├── '/plans/:categoryId',
├── '/plans/:categoryId/:planId',
└── '/settings/*'
]
```


5. Component Architecture:
- PlanGridContainer (Smart component)
- PlanThumbnail (Presentational)
- CategoryList (Smart component)
- FilterBar (Presentational)
- SearchInput (Presentational)


6. Responsive Breakpoints:
```scss
$breakpoints: (
├── 'sm': 576px,
├── 'md': 768px,
├── 'lg': 992px,
└── 'xl': 1200px
);
```
</development_planning>
</frontend-prompt>

IMPORTANT: Please ensure that (1) all KEY COMPONENTS and (2) the LAYOUT STRUCTURE are fully implemented as specified in the requirements. Ensure that the color hex code specified in image_analysis are fully implemented as specified in the requirements.