Set up the page structure according to the following prompt:
   
<page-structure-prompt>
Next.js route structure based on navigation menu items (excluding main route). Make sure to wrap all routes with the component:

Routes:
- /field-management-plans
- /specifications
- /tasks
- /photos
- /forms
- /files
- /search
- /new-plan
- /new-folder
- /actions-dropdown

Page Implementations:
/field-management-plans:
Core Purpose: Display and manage agricultural field plans
Key Components
- Interactive map view
- Plan list with filtering

/sorting
- Status indicators
- Quick action buttons
Layout Structure:
- Split view with map and list
- Collapsible sidebar for filters
- Grid/List view toggle

/specifications:
Core Purpose: Define and manage crop specifications
Key Components
- Specification templates
- Input fields for measurements
- Version history
Layout Structure
- Card-based grid layout
- Form wizard for new specs
- Tabbed interface for categories

/tasks:
Core Purpose: Task management and assignment
Key Components
- Task board (Kanban style)
- Priority indicators
- Due date calendar
- Assignment controls
Layout Structure
- Board view with columns
- List view option
- Mobile-friendly task cards

/photos:
Core Purpose: Photo management and documentation
Key Components
- Photo grid

/gallery
- Upload interface
- Tagging system
- Image viewer
Layout Structure:
- Masonry grid layout
- Modal viewer
- Filter sidebar

/forms:
Core Purpose: Digital form management
Key Components
- Form templates
- Form builder
- Submission tracking
Layout Structure
- Two-column layout
- Preview pane
- Mobile-first forms

/files:
Core Purpose: Document management system
Key Components
- File browser
- Upload zone
- Version control
- Search functionality
Layout Structure
- Folder tree structure
- List

/search:
Core Purpose: Global search functionality
Key Components
- Search bar
- Filters
- Results display
- Quick preview
Layout Structure
- Full-width search bar
- Faceted search sidebar
- Results grid

/new-plan:
Core Purpose: Create new field management plans
Key Components
- Multi-step form
- Map selection tool
- Template picker
Layout Structure
- Stepper interface
- Split panels
- Progress indicator

/new-folder:
Core Purpose: Create organizational folders
Key Components
- Folder naming
- Permission settings
- Location selector
Layout Structure
- Modal dialog
- Simple form layout
- Preview section

/actions-dropdown:
Core Purpose: Context-specific actions menu
Key Components
- Action list
- Quick access buttons
- Permission checks
Layout Structure
- Dropdown menu
- Icon + text items
- Mobile-optimized touch targets

Layouts:
MainLayout:
- Applicable routes: All except modals
- Core components
  - Navigation header
  - Sidebar
  - Content area
  - Footer
- Responsive behavior
  - Collapsible sidebar
  - Stack navigation on mobile
  - Fluid content area

ModalLayout
- Applicable routes: /new-folder, /actions-dropdown
- Core components
  - Modal container
  - Header
  - Content
  - Action buttons
- Responsive behavior
  - Full screen on mobile
  - Centered overlay on desktop
  - Flexible width/height

DashboardLayout
- Applicable routes: /field-management-plans, /tasks
- Core components
  - Quick stats
  - Action bar
  - Main content
  - Side panels
- Responsive behavior
  - Responsive grid system
  - Collapsible panels
  - Priority content stacking
</page-structure-prompt>