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
2. **webapp.html** - HTML structure for the user interface
3. **webapp.js** - JavaScript for dynamic interactions and API calls
4. **webapp.css** - CSS styling focused on utility and readability

## Installation

### In Dataiku DSS:

1. Navigate to your DSS project
2. Go to the **Webapps** section
3. Click **New Webapp** → **Standard Webapp**
4. Name it "Project Command Center" or similar
5. Copy the contents of each file:
   - `backend.py` → Backend tab
   - `webapp.html` → HTML tab
   - `webapp.js` → JavaScript tab
   - `webapp.css` → CSS tab
6. Click **Save** and then **Preview**

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

The Python backend provides these Flask endpoints:

- `GET /project-info` - Project metadata and summary
- `GET /scenarios` - List all scenarios with status
- `POST /run-scenario` - Trigger a scenario run
- `POST /abort-scenario` - Abort a running scenario
- `GET /jobs` - Get job status and history
- `POST /build-dataset` - Build a specific dataset

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

### Scenarios won't run
- Check dashboard authorization in Project Settings
- Ensure scenario has "Run" permission enabled

### Data not loading
- Verify user has appropriate project permissions
- Check browser console for JavaScript errors
- Review DSS logs for backend errors

## Contributing

This is an open-source template. Customize it for your team's specific needs.

## License

MIT License - Free to use and modify
