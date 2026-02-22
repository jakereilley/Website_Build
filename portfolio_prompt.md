# Tech Portfolio Website - Development Prompt

## Project Overview
Build a creative tech portfolio website for a software developer with an interactive 3D project gallery, blog system, user authentication, and contact management. The site should showcase technical work through an immersive, artistically-designed experience.

## Core Requirements

### Frontend Stack
- **Framework**: Three.js for 3D graphics and interactive elements
- **Architecture**: Multi-page SPA (Home, Projects, Blog, Contact, Admin Dashboard)
- **Build Tool**: Vite or Webpack (your choice for optimal performance)
- **Styling**: Modern CSS with light/dark mode toggle functionality
- **Design Direction**: Creative and artistic aesthetic with smooth animations

### Backend Stack
- **Framework**: Django with Django REST Framework for API endpoints
- **Database**: PostgreSQL (or SQLite for development, upgradeable)
- **Authentication**: Django built-in auth system with JWT tokens for frontend
- **File Storage**: Handle resume/CV uploads and project assets

### Key Features to Implement

#### 1. User Authentication & Authorization
- User login/registration system
- JWT-based authentication for frontend
- Admin dashboard for managing portfolio content
- Secure session management

#### 2. Project Showcase Gallery (Three.js Integration)
- Interactive 3D gallery for displaying portfolio projects
- Each project should be clickable/interactive within the 3D space
- Projects display with:
  - Title and description
  - Technologies used
  - Link to live demo or GitHub
  - Project images/previews
- Mix of animations:
  - Scroll-triggered animations (projects reveal as user scrolls)
  - Hover/interaction-based animations (3D objects respond to mouse movement)
  - Parallax effects for depth
  - Custom 3D interactions (e.g., rotating, zooming, morphing elements)
- Performance optimization: Implement LOD (Level of Detail) and lazy loading for 3D assets

#### 3. Blog System
- Create, read, update, delete (CRUD) blog posts (admin only)
- Rich text editor for blog content
- Blog post listing page with filtering/search
- Individual blog post pages with metadata (date, author, tags)
- Related posts suggestions

#### 4. Contact Form
- Contact form with validation
- Store submissions in database
- Email notification system (optional but recommended)
- Admin view of all contact submissions

#### 5. Resume/CV Management
- Admin can upload/update resume file
- Frontend displays resume download button
- Version history (keep previous versions)

#### 6. Navigation & Pages
- **Home Page**: Hero section with 3D background element, brief intro, CTA
- **Projects Page**: Main 3D gallery showcase with all projects
- **Blog Page**: Blog post listing with search/filter
- **Contact Page**: Contact form
- **About Page**: Professional bio and skills
- **Admin Dashboard**: Manage all content (projects, blog posts, resume, contact submissions)

#### 7. Theming
- Light/dark mode toggle with persistent preference storage
- Purple accent color option (user preference: heavy purple enjoyer)
- Smooth transitions between themes
- Consistent color palette across all pages

#### 8. Performance & Optimization
- Minimize bundle size
- Code splitting for routes
- Image optimization
- Three.js performance optimization (WebGL context management)
- Lazy load blog posts and project data

### Future-Proofing (Don't implement yet, but structure for)
- A-Frame VR integration pathway (keep API structure modular)
- WebXR support preparation
- Multi-environment deployment setup

## Technical Specifications

### Django Backend Structure
```
portfolio_backend/
├── manage.py
├── portfolio/
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
├── api/
│   ├── models.py (Project, BlogPost, ContactSubmission, Resume)
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── permissions.py
├── accounts/
│   ├── models.py
│   ├── views.py
│   ├── urls.py
```

### Frontend Structure
```
portfolio_frontend/
├── src/
│   ├── index.html
│   ├── main.js
│   ├── styles/
│   │   ├── global.css
│   │   ├── themes.css (light/dark mode)
│   ├── pages/
│   │   ├── home.js
│   │   ├── projects.js (Three.js gallery)
│   │   ├── blog.js
│   │   ├── contact.js
│   │   ├── about.js
│   │   └── admin/
│   ├── components/
│   │   ├── navbar.js
│   │   ├── three-gallery.js
│   │   ├── contact-form.js
│   ├── utils/
│   │   ├── api.js (API client)
│   │   ├── auth.js (JWT handling)
│   │   ├── theme.js (light/dark toggle)
```

### API Endpoints (Django REST)
- `GET /api/projects/` - List all projects
- `POST /api/projects/` - Create project (admin only)
- `GET/PUT/DELETE /api/projects/{id}/` - Project CRUD
- `GET /api/blog/` - List blog posts
- `POST /api/blog/` - Create post (admin only)
- `GET/PUT/DELETE /api/blog/{id}/` - Blog CRUD
- `POST /api/contact/` - Submit contact form
- `GET /api/contact/` - List submissions (admin only)
- `GET /api/resume/` - Get current resume file
- `POST /api/resume/` - Upload resume (admin only)
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Refresh JWT token

## Design Guidance
- **Aesthetic**: Creative and artistic with tech-forward elements
- **Color Scheme**: Primary colors with purple accents (user preference)
- **Typography**: Modern, readable fonts with good hierarchy
- **Animations**: Smooth, purposeful animations that enhance UX (not distracting)
- **Responsiveness**: Mobile-first design, works on all screen sizes
- **Accessibility**: WCAG 2.1 AA compliance, semantic HTML, keyboard navigation

## Deployment Considerations
- Frontend: Netlify, Vercel, or similar
- Backend: Heroku, Railway, PythonAnywhere, or self-hosted
- Database: PostgreSQL (managed service recommended)
- Static files: CloudFront or similar CDN
- Environment variables for API endpoints and secrets

## Development Priorities
1. Backend API structure and authentication
2. Frontend page routing and basic layout
3. Three.js project gallery implementation
4. Blog and contact form functionality
5. Admin dashboard
6. Theming and polish
7. Performance optimization

## Notes for Claude Code
- Start with backend setup (Django models, serializers, views)
- Create API endpoints first, then build frontend to consume them
- Three.js gallery should be built with modularity in mind for future A-Frame VR integration
- Use environment variables for all configuration (API URLs, etc.)
- Include error handling and validation on both frontend and backend
- Add loading states and user feedback for async operations
- Consider pagination for blog posts and projects
- Implement CORS properly for development and production
