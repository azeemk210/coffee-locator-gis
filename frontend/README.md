# GIS Portal - Next.js Frontend

A modern, full-featured frontend for the GIS-enabled Web Portal built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, and **MapLibre GL JS**.

## Features

✅ **Next.js 14 App Router** - Modern React with file-based routing  
✅ **TypeScript** - Full type safety  
✅ **Tailwind CSS** - Utility-first styling  
✅ **MapLibre GL JS** - Vector tile mapping with free tiles  
✅ **JWT Authentication** - Secure token-based auth with context  
✅ **Protected Routes** - Automatic redirection for unauthorized access  
✅ **Real-time Shop Management** - Create and view shops on interactive map  

## Requirements

- Node.js 18+
- Backend running on `http://localhost:8000`

## Installation & Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
Create/check `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
PORT=3000
```

### 3. Run Development Server
```bash
npm run dev
```

Opens at `http://localhost:3000` 🚀

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with AuthProvider
│   ├── page.tsx           # Home (redirects to login/dashboard)
│   ├── globals.css        # Global styles + MapLibre overrides
│   ├── login/
│   │   └── page.tsx       # Login page
│   ├── register/
│   │   └── page.tsx       # Registration page
│   └── dashboard/
│       └── page.tsx       # Protected dashboard with map
├── components/
│   ├── Map.tsx           # MapLibre GL JS map component
│   └── Sidebar.tsx       # User info & logout sidebar
├── context/
│   └── AuthContext.tsx   # JWT auth state management
└── lib/
    └── api.ts            # Axios client with interceptors
```

## Usage

### 1. Register
- Navigate to `/register`
- Create account with email & password (min 8 chars)

### 2. Login
- Go to `/login`
- Enter credentials
- JWT token stored in localStorage automatically

### 3. Dashboard
- View interactive map (Salzburg, Austria by default)
- See all shops as markers
- Click markers to see shop details in popup

### 4. Create Shop
- Click anywhere on the map
- Enter shop name
- Click "Create Shop"
- Watch shop appear on map in real-time

## Authentication Flow

```
User → /register → /login → JWT Token
                             ↓
                    localStorage
                             ↓
                    AuthContext
                             ↓
                    Protected /dashboard
                             ↓
                    Automatic Bearer token
                    injection in API calls
```

## Map Configuration

- **Library**: MapLibre GL JS (free, open-source)
- **Tiles**: OpenFreeMap (free vector tiles)
- **Initial View**: Salzburg, Austria (13.04°E, 47.80°N)
- **Controls**: Navigation (zoom, rotate, pitch)
- **Interactions**: Click to select shop location

## API Endpoints Used

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/register` | POST | ❌ | Create account |
| `/auth/login-json` | POST | ❌ | Get JWT token |
| `/shops` | GET | ✅ | List user's shops |
| `/shops` | POST | ✅ | Create new shop |

## Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **MapLibre GL JS** - Vector maps library
- **Axios** - HTTP client
- **React Context** - State management

## Environment Variables

```
NEXT_PUBLIC_API_URL  # Backend API URL (public)
PORT                 # Dev server port (default: 3000)
```

## Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

**"Failed to connect to backend"**
- Ensure backend is running on `http://localhost:8000`
- Check CORS configuration in backend

**"Map not loading"**
- Verify maplibre-gl CSS is imported in globals.css
- Check browser console for errors
- Ensure no JavaScript errors

**"Token not persisting"**
- Clear localStorage: `localStorage.clear()`
- Log out and back in
- Check browser console for errors

**"Shops not appearing on map"**
- Refresh the page
- Check API response in Network tab
- Verify coordinates are valid [lat, lng]

## Development Tips

- Use browser DevTools to inspect localStorage for token
- Check Network tab to see API requests/responses
- Use MapLibre's built-in debugging: `maplibregl.accessToken = 'your-token'` (not needed for free tiles)

## License

MIT
