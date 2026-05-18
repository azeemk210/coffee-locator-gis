# Visual Architecture Diagrams (Mermaid)

## System Architecture Diagram

```mermaid
graph TB
    Client["🌐 Client Browser<br/>192.168.120.65"]
    
    Client -->|Port 80<br/>HTTP| Nginx["⚙️ Nginx Reverse Proxy<br/>Port 80<br/>172.18.0.2"]
    
    Nginx -->|/| Frontend["🎨 Frontend Container<br/>Next.js 14.2.35<br/>Port 3000<br/>172.18.0.4"]
    Nginx -->|/api/*<br>/shops<br/>/auth| Backend["🚀 Backend Container<br/>FastAPI 0.104.1<br/>Port 8000<br/>172.18.0.3"]
    
    Backend -->|SQL Queries<br/>PostgreSQL Protocol| Database["🗄️ Database Container<br/>PostgreSQL 17<br/>+ PostGIS 3.4<br/>Port 5432<br/>172.18.0.5"]
    
    Frontend -->|API Calls<br/>http://api/...| Backend
    
    Database -->|User Data<br/>Shop Locations<br/>Spatial Data| Backend
    
    Frontend -->|HTML/CSS/JS<br/>Maps/UI| Client
    
    style Client fill:#e1f5ff
    style Nginx fill:#fff9c4
    style Frontend fill:#f3e5f5
    style Backend fill:#e8f5e9
    style Database fill:#ffe0b2
```

---

## Detailed Component Interaction Diagram

```mermaid
graph LR
    subgraph "Ubuntu Server 192.168.120.65"
        subgraph "Docker Container Network (gis-network)"
            subgraph "Nginx"
                NGX["Nginx Alpine<br/>Port 80"]
            end
            
            subgraph "Frontend"
                FE["Next.js<br/>React App<br/>Port 3000"]
                FEENV["Environment<br/>NEXT_PUBLIC_API_URL"]
            end
            
            subgraph "Backend"
                BE["FastAPI<br/>Python<br/>Port 8000"]
                BEENV["Environment<br/>DATABASE_URL"]
            end
            
            subgraph "Database"
                DB["PostgreSQL<br/>+ PostGIS"]
                DBDATA["Persistent<br/>Volume"]
            end
        end
    end
    
    NGX -->|Routes /| FE
    NGX -->|Routes /api/*| BE
    FE --> FEENV
    BE --> BEENV
    BE --> DB
    DB --> DBDATA
    
    style NGX fill:#fff9c4
    style FE fill:#f3e5f5
    style FEENV fill:#f8bbd0
    style BE fill:#e8f5e9
    style BEENV fill:#c8e6c9
    style DB fill:#ffe0b2
    style DBDATA fill:#ffcc80
```

---

## Data Flow: Registration Process

```mermaid
sequenceDiagram
    participant Browser as 🌐 Browser
    participant Nginx as ⚙️ Nginx<br/>Port 80
    participant Frontend as 🎨 Frontend<br/>Port 3000
    participant Backend as 🚀 Backend<br/>Port 8000
    participant Database as 🗄️ PostgreSQL<br/>Port 5432
    
    Browser->>Nginx: GET /register
    Nginx->>Frontend: Route to Port 3000
    Frontend->>Browser: Return registration form HTML
    
    Browser->>Browser: User fills form<br/>(email, password, name)
    
    Browser->>Nginx: POST /api/auth/register<br/>{email, password, name}
    Nginx->>Backend: Route to /auth/register
    
    Backend->>Backend: Validate input<br/>Hash password<br/>Generate JWT token
    
    Backend->>Database: INSERT INTO users<br/>(email, password_hash, ...)
    Database->>Database: Execute & Commit
    Database->>Backend: Return user_id, record
    
    Backend->>Nginx: 200 OK<br/>{user_id, email, token}
    Nginx->>Browser: Return JSON response
    
    Browser->>Browser: Store token<br/>Redirect to /login
    Browser->>Browser: Show success message
```

---

## Data Flow: Map Data Loading

```mermaid
sequenceDiagram
    participant Browser as 🌐 Browser
    participant Nginx as ⚙️ Nginx<br/>Port 80
    participant Frontend as 🎨 Frontend<br/>Port 3000
    participant Backend as 🚀 Backend<br/>Port 8000
    participant Database as 🗄️ PostgreSQL<br/>+ PostGIS
    
    Browser->>Nginx: GET /dashboard
    Nginx->>Frontend: Route to Port 3000
    Frontend->>Browser: Return dashboard page<br/>+Map component
    
    Browser->>Browser: React mounts Map<br/>useEffect hook runs
    
    Browser->>Nginx: GET /api/shops<br/>Authorization: Bearer token
    Nginx->>Backend: Route to /shops
    
    Backend->>Backend: Verify JWT token<br/>Extract user_id
    Backend->>Database: SELECT id, name,<br/>latitude, longitude,<br/>ST_AsGeoJSON(geometry)
    
    Database->>Database: Spatial index lookup<br/>Convert geometry<br/>to GeoJSON
    Database->>Backend: Return shop records<br/>with coordinates
    
    Backend->>Backend: Format as GeoJSON<br/>FeatureCollection
    Backend->>Nginx: 200 OK<br/>{type: "FeatureCollection",<br/>features: [...]}
    
    Nginx->>Browser: Return JSON response
    Browser->>Browser: MapLibre GL renders<br/>shop markers on map
    Browser->>Browser: User sees interactive<br/>map with coffee shops
```

---

## Port Mapping Architecture

```mermaid
graph TB
    ClientBrowser["🌐 Client Browser<br/>External Network<br/>192.168.120.65"]
    
    ClientBrowser -->|Port 80| ExternalPort["🔌 Port 80<br/>(External/Published)"]
    
    ExternalPort -->|Maps to| Docker["Docker Container Port 80"]
    
    Docker -->|Internal Network| NginxContainer["Nginx Container<br/>172.18.0.2:80<br/>Listening"]
    
    NginxContainer -->|Forward| Frontend3000["Frontend<br/>172.18.0.4:3000"]
    NginxContainer -->|Forward| Backend8000["Backend<br/>172.18.0.3:8000"]
    
    Backend8000 -->|Connect| Database5432["Database<br/>172.18.0.5:5432"]
    
    style ClientBrowser fill:#e1f5ff,stroke:#01579b
    style ExternalPort fill:#fff9c4,stroke:#f57f17
    style Docker fill:#fff9c4,stroke:#f57f17
    style NginxContainer fill:#fff9c4,stroke:#f57f17
    style Frontend3000 fill:#f3e5f5,stroke:#512da8
    style Backend8000 fill:#e8f5e9,stroke:#1b5e20
    style Database5432 fill:#ffe0b2,stroke:#e65100
```

---

## Service Dependencies

```mermaid
graph TD
    ComposeUp["docker-compose up"] -->|Evaluates| DB["Database Service<br/>(gis-portal-db)"]
    
    DB -->|Health Check<br/>pg_isready| DBReady{"DB<br/>Ready?"}
    
    DBReady -->|Yes| Backend["Backend Service<br/>(gis-portal-backend)<br/>depends_on: db"]
    DBReady -->|No| DBWait["Wait..."]
    DBWait -->|Retry| DBReady
    
    Backend -->|Connects to<br/>172.18.0.5:5432| DB
    
    Backend -->|Running?| FrontendStart["Frontend Service<br/>(gis-portal-frontend)<br/>depends_on: backend"]
    
    FrontendStart -->|HTTP at<br/>172.18.0.4:3000| Frontend["Frontend Ready"]
    
    DB -->|Independent| Nginx["Nginx Service<br/>(gis-portal-nginx)"]
    Frontend -->|All Ready| Nginx
    Backend -->|All Ready| Nginx
    
    Nginx -->|Port 0.0.0.0:80| Complete["All Services<br/>Running &<br/>Healthy ✅"]
    
    style DB fill:#ffe0b2
    style Backend fill:#e8f5e9
    style FrontendStart fill:#f3e5f5
    style Nginx fill:#fff9c4
    style Complete fill:#c8e6c9
    style DBReady fill:#ffccbc
```

---

## Environment Variable Flow

```mermaid
graph LR
    subgraph "Files on Disk"
        RootEnv[".env<br/>Root environment"]
        BackendEnv["backend/.env<br/>Backend-specific"]
        FrontendEnv["frontend/.env<br/>Frontend-specific"]
    end
    
    subgraph "docker-compose.yml"
        Compose["Docker Compose<br/>Configuration"]
    end
    
    subgraph "Containers at Runtime"
        BackendContainer["Backend Container<br/>Loads:<br/>- root .env<br/>- backend/.env"]
        FrontendContainer["Frontend Container<br/>Loads:<br/>- frontend/.env"]
        DBContainer["Database Container<br/>Loads:<br/>- root .env"]
    end
    
    RootEnv -->|env_file:<br/>- .env| Compose
    BackendEnv -->|env_file:<br/>- .env<br/>- backend/.env| Compose
    FrontendEnv -->|env_file:<br/>- frontend/.env| Compose
    
    Compose -->|Applies to| BackendContainer
    Compose -->|Applies to| FrontendContainer
    Compose -->|Applies to| DBContainer
    
    BackendContainer -->|DATABASE_URL=<br/>postgresql://...| DBContainer
    FrontendContainer -->|NEXT_PUBLIC_API_URL=<br/>http://192.../api| BackendContainer
    
    style RootEnv fill:#ffebee
    style BackendEnv fill:#e8f5e9
    style FrontendEnv fill:#f3e5f5
    style Compose fill:#fff9c4
    style BackendContainer fill:#e8f5e9
    style FrontendContainer fill:#f3e5f5
    style DBContainer fill:#ffe0b2
```

---

## Complete Request/Response Cycle

```mermaid
graph TB
    A["1️⃣ User in Browser<br/>at 192.168.120.65"]
    B["2️⃣ Browser makes request<br/>POST /api/auth/register"]
    C["3️⃣ Network packet<br/>Port 80"]
    D["4️⃣ Server receives<br/>on Port 80"]
    E["5️⃣ Nginx container<br/>accepts connection"]
    F["6️⃣ Nginx evaluates<br/>routing rules"]
    G["7️⃣ Match: /api/* →<br/>Backend:8000"]
    H["8️⃣ Internal network<br/>DNS: backend → 172.18.0.3"]
    I["9️⃣ Backend container<br/>receives on :8000"]
    J["🔟 FastAPI processes<br/>register route"]
    K["1️⃣1️⃣ Python validates<br/>hashes password"]
    L["1️⃣2️⃣ Backend connects<br/>to DB 172.18.0.5:5432"]
    M["1️⃣3️⃣ PostgreSQL<br/>executes INSERT"]
    N["1️⃣4️⃣ Returns user record<br/>+ JWT token"]
    O["1️⃣5️⃣ Backend formats<br/>JSON response"]
    P["1️⃣6️⃣ Nginx forwards<br/>response"]
    Q["1️⃣7️⃣ Browser receives<br/>JSON response"]
    R["1️⃣8️⃣ Frontend processes<br/>stores token"]
    S["1️⃣9️⃣ User redirected<br/>to login page"]
    T["✅ Success!"]
    
    A --> B --> C --> D --> E --> F --> G --> H --> I --> J --> K --> L --> M --> N --> O --> P --> Q --> R --> S --> T
    
    style A fill:#e1f5ff
    style T fill:#c8e6c9
    style M fill:#ffe0b2
```

---

## Docker Container Lifecycle

```mermaid
graph LR
    Start["Start <br/>docker-compose up -d<br/>--build"]
    
    Start -->|Build Phase| BuildFE["Build Frontend<br/>Docker image"]
    Start -->|Build Phase| BuildBE["Build Backend<br/>Docker image"]
    Start -->|Pull Phase| PullNGX["Pull Nginx<br/>Image"]
    Start -->|Pull Phase| PullDB["Pull PostgreSQL<br/>Image"]
    
    BuildFE -->|Create| FEIMG["Frontend Image<br/>Ready"]
    BuildBE -->|Create| BEIMG["Backend Image<br/>Ready"]
    PullNGX -->|Downloaded| NGXIMG["Nginx Image<br/>Ready"]
    PullDB -->|Downloaded| DBIMG["PostgreSQL Image<br/>Ready"]
    
    FEIMG -->|Create Container| FEC["Frontend<br/>Container<br/>172.18.0.4"]
    BEIMG -->|Create Container| BEC["Backend<br/>Container<br/>172.18.0.3"]
    NGXIMG -->|Create Container| NGC["Nginx<br/>Container<br/>172.18.0.2"]
    DBIMG -->|Create Container| DBC["Database<br/>Container<br/>172.18.0.5"]
    
    DBC -->|Start| DBStart["Running<br/>Port 5432<br/>Health Check<br/>Active"]
    BEC -->|Start| BEStart["Running<br/>Port 8000<br/>Connected to DB"]
    FEC -->|Start| FEStart["Running<br/>Port 3000<br/>Ready"]
    NGC -->|Start| NGStart["Running<br/>Port 80<br/>Routing Active"]
    
    DBStart --> Ready["All Services<br/>Ready<br/>running (healthy)"]
    BEStart --> Ready
    FEStart --> Ready
    NGStart --> Ready
    
    Ready -->|User Access| Access["http://192.168.120.65<br/>Application Active"]
    
    style Start fill:#fff9c4
    style Ready fill:#c8e6c9
    style Access fill:#a5d6a7
```

---

## Network & Routing Summary

```mermaid
graph TB
    Client["Browser Client<br/>192.168.120.65:random_port"]
    
    Client -->|SYN to<br/>192.168.120.65:80| OS["Ubuntu OS<br/>Network Stack"]
    
    OS -->|Route to<br/>Container Interface| Docker["Docker Bridge<br/>gis-network"]
    
    Docker -->|Port 80<br/>Exposed| Nginx["Nginx<br/>172.18.0.2:80"]
    
    Nginx -->|Evaluate<br/>HTTP Path| Route{"Which<br/>Route?"}
    
    Route -->|GET /<br/>Static Pages| Frontend["Frontend<br/>172.18.0.4:3000"]
    Route -->|GET /api/**<br/>Dynamic API| Backend["Backend<br/>172.18.0.3:8000"]
    Route -->|POST /api/**<br/>API Calls| Backend
    Route -->|GET /dashboard<br/>etc| Frontend
    
    Frontend -->|SQL/Connect| Database["Database<br/>172.18.0.5:5432"]
    Backend -->|SQL/Connect| Database
    
    Backend -->|Response| Nginx
    Frontend -->|Response| Nginx
    Database -->|Data| Backend
    
    Nginx -->|Port 80<br/>HTTP Response| Client
    
    style Client fill:#e1f5ff
    style OS fill:#f5f5f5
    style Docker fill:#fff9c4
    style Nginx fill:#fff9c4
    style Frontend fill:#f3e5f5
    style Backend fill:#e8f5e9
    style Database fill:#ffe0b2
    style Route fill:#ffccbc
```

---

## Summary Table: What Runs Where

| Component | Type | Image/Language | Port(s) | IP Address | Volume | Status |
|-----------|------|----------------|---------|-----------|--------|--------|
| **Nginx** | Container | nginx:alpine | 80:80 | 172.18.0.2 | nginx/default.conf | running |
| **Frontend** | Container | Node:20 + Next.js | 3000:3000 | 172.18.0.4 | None | running (healthy) |
| **Backend** | Container | Python:3.11 + FastAPI | 8000:8000 | 172.18.0.3 | None | running (healthy) |
| **Database** | Container | postgis/postgis:17-3.4 | 5432:5432 | 172.18.0.5 | postgres_data | running (healthy) |
| **Host OS** | Virtual Machine | Ubuntu 22.04 LTS | N/A | 192.168.120.65 | Server disk | running |

---

**For printable/shareable diagrams:** Export these mermaid diagrams using:
- [mermaid.live](https://mermaid.live) - Copy/paste content
- [mermaid.ink](https://mermaid.ink) - Create custom SVG URLs
- VS Code Mermaid Preview extension

