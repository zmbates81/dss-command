# Dataiku DSS Project Command Center

A lightweight, utility-focused web app for Dataiku DSS power users to monitor and manage project information, scenarios, and jobs from a single dashboard.

## Features

### For Advanced DSS Users
- **Project Overview**: Real-time view of project metadata, datasets, and flow status
- **Scenario Manager**: Monitor all scenarios with status, last run info, and one-click execution
- **Job Monitor**: Track running and recent jobs with detailed status information
- **Quick Actions**: Execute common tasks without navigating through multiple screens

## Architecture

This is a **standard Dataiku DSS web app** using the four core file types:

1. **backend.py** - Python backend using Flask and Dataiku APIs
2. **webapp.html** - HTML body content (DSS provides the document wrapper)
3. **webapp.js** - JavaScript for dynamic interactions and API calls
4. **webapp.css** - CSS styling focused on utility and readability

### How DSS Standard Webapps Work

**DSS Provides Automatically:**
- HTML document structure (`<!DOCTYPE>`, `<html>`, `<head>`, `<body>` tags)
- Flask `app` object for backend routes
- JavaScript API functions like `getWebAppBackendUrl()`
- Hosting and user authentication

**You Provide:**
- **HTML tab:** Body content only (no document structure tags)
- **Backend tab:** Route handlers using `@app.route()` decorators
- **JavaScript tab:** Your application logic
- **CSS tab:** Styling for your content

## Installation

### In Dataiku DSS:

1. Navigate to your DSS project
2. Go to the **Webapps** section
3. Click **New Webapp** → **Standard Webapp**
4. Name it "Project Command Center" or similar
5. Copy the contents of each file into the corresponding tabs:
   - **Backend tab** → Copy from `backend.py`
   - **HTML tab** → Copy from `webapp.html` *(body content only - no DOCTYPE, html, or body tags)*
   - **JavaScript tab** → Copy from `webapp.js`
   - **CSS tab** → Copy from `webapp.css`
6. Click **Save**
7. Click **Reload Preview** to view the webapp

### Important Notes:
- **HTML Structure:** DSS automatically provides the HTML document wrapper. The HTML tab should contain only body content.
- **Backend:** DSS automatically provides the Flask `app` object. Don't create your own.
- **JavaScript API:** DSS provides `getWebAppBackendUrl()` function automatically.

## Usage

### Dashboard Sections

#### 1. Project Information
- Project key, name, and description
- Dataset count and types
- Flow summary

#### 2. Scenario Manager
- List all scenarios in the project
- View status: idle, running, success, failed
- See last run time and duration
- **Run** button for each scenario (requires appropriate permissions)
- **Abort** button for running scenarios

#### 3. Job Monitor
- Real-time status of running jobs
- Recent job history with outcomes
- Job details: type, start time, duration

#### 4. Quick Actions
- Build dataset
- Refresh dashboard
- Clear caches

## API Endpoints

The Python backend uses **Flask routes** to provide these endpoints:

- `GET /project-info` - Project metadata and summary
- `GET /scenarios` - List all scenarios with status
- `POST /run-scenario` - Trigger a scenario run
- `POST /abort-scenario` - Abort a running scenario
- `GET /jobs` - Get job status and history
- `GET /scenario-runs` - Get detailed run history for a scenario
- `POST /build-dataset` - Build a specific dataset

### Technical Implementation

**Backend (Python):**
```python
from flask import request, jsonify
import dataiku

# Note: 'app' object is automatically provided by DSS
# Do NOT create it with app = Flask(__name__)

@app.route('/project-info')
def route_project_info():
    return get_project_info()
```

**Frontend (JavaScript):**
```javascript
// Use Dataiku's getWebAppBackendUrl() function
fetch(getWebAppBackendUrl('/project-info'))
    .then(response => response.json())
    .then(data => console.log(data));
```

## Design Philosophy

Built for DSS power users who value:
- **Speed**: Quick access to essential information
- **Clarity**: Clean, scannable interface with clear status indicators
- **Efficiency**: Common actions accessible in one place
- **Reliability**: Accurate, real-time data from DSS APIs

## Requirements

- Dataiku DSS (tested on DSS 11+)
- User permissions to view project information
- Scenario run permissions (for triggering scenarios)
- Dataset build permissions (for build actions)

## Customization

The modular structure allows easy customization:
- Add new API endpoints in `backend.py`
- Extend the UI in `webapp.html`
- Add new features in `webapp.js`
- Customize appearance in `webapp.css`

## Troubleshooting

### Webapp won't load / blank page
**Symptom:** Preview shows blank page or webapp doesn't render

**Cause:** HTML tab contains full HTML document structure instead of body content only

**Solution:**
1. DSS provides the HTML wrapper automatically - you only need body content
2. **REMOVE** these tags from HTML tab:
   - `<!DOCTYPE html>`
   - `<html>` and `</html>`
   - `<head>` and `</head>`
   - `<body>` and `</body>`
3. Keep only the content that goes **inside** the body
4. Save and click "Reload Preview"

**Correct HTML tab structure:**
```html
<!-- Just your content, no document structure -->
<header class="app-header">
    <h1>Project Command Center</h1>
</header>
<main class="container">
    <!-- Your app content here -->
</main>
```

### Backend won't start - "__ping" 404 errors in logs
**Symptom:** Logs show repeated `GET /__ping HTTP/1.1" 404` errors, backend fails health checks

**Cause:** Creating your own Flask app instance instead of using DSS-provided one

**Solution:**
1. **REMOVE** any `app = Flask(__name__)` line from backend.py
2. DSS automatically provides the `app` object - just use `@app.route()` directly
3. Add the health check endpoint:
   ```python
   @app.route('/__ping')
   def health_check():
       return jsonify({'status': 'ok'}), 200
   ```
4. Save and restart the backend

### 404 Error - Data not loading
**Symptom:** "Failed to load data: HTTP error! status: 404"

**Cause:** Incorrect webapp configuration

**Solution:**
1. Ensure backend.py does NOT create Flask app (no `app = Flask(__name__)`)
2. Verify all routes use `@app.route()` decorators (not `do_get`/`do_post`)
3. Confirm JavaScript uses `getWebAppBackendUrl()` function
4. Save the webapp and refresh your browser

### Scenarios won't run
- Check dashboard authorization in Project Settings
- Ensure scenario has "Run" permission enabled
- Verify you have execution rights for the project

### Data not loading (permissions)
- Verify user has appropriate project permissions
- Check browser console for JavaScript errors (F12)
- Review DSS logs for backend errors
- Ensure the webapp backend is running (check backend status in DSS)

### JavaScript errors mentioning "getWebAppBackendUrl"
**Cause:** The Dataiku JavaScript API may not be loaded

**Solution:**
- This function is automatically provided by DSS in standard webapps
- If testing locally, you'll need to run this within DSS environment
- Cannot be tested outside of DSS platform

## Contributing

This is an open-source template. Customize it for your team's specific needs.

## License

MIT License - Free to use and modify
