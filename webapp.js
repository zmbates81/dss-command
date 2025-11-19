/**
 * Dataiku DSS Project Command Center - JavaScript
 * Handles UI interactions and backend API calls
 */

// Global state
let autoRefreshInterval = null;
let projectData = null;
let scenariosData = null;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('Initializing DSS Command Center...');

    // Set up event listeners
    setupEventListeners();

    // Load initial data
    loadAllData();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadAllData();
        });
    }

    // Auto-refresh toggle
    const autoRefresh = document.getElementById('autoRefresh');
    if (autoRefresh) {
        autoRefresh.addEventListener('change', function(e) {
            toggleAutoRefresh(e.target.checked);
        });
    }

    // Build dataset button
    const buildDatasetBtn = document.getElementById('buildDatasetBtn');
    if (buildDatasetBtn) {
        buildDatasetBtn.addEventListener('click', buildSelectedDataset);
    }

    // Dataset selection
    const datasetSelect = document.getElementById('datasetSelect');
    if (datasetSelect) {
        datasetSelect.addEventListener('change', function(e) {
            buildDatasetBtn.disabled = !e.target.value;
        });
    }
}

/**
 * Load all data from the backend
 */
function loadAllData() {
    showLoading(true);
    hideError();

    Promise.all([
        loadProjectInfo(),
        loadScenarios(),
        loadJobs()
    ])
    .then(() => {
        showLoading(false);
        updateLastRefreshTime();
    })
    .catch(error => {
        showLoading(false);
        showError('Failed to load data: ' + error.message);
    });
}

/**
 * Load project information
 */
function loadProjectInfo() {
    return getBackendData('/project-info')
        .then(data => {
            if (data.success) {
                projectData = data;
                displayProjectInfo(data);
                populateDatasetSelect(data.datasets);
            } else {
                throw new Error(data.error || 'Failed to load project info');
            }
        });
}

/**
 * Load scenarios
 */
function loadScenarios() {
    return getBackendData('/scenarios')
        .then(data => {
            if (data.success) {
                scenariosData = data;
                displayScenarios(data.scenarios);
            } else {
                throw new Error(data.error || 'Failed to load scenarios');
            }
        });
}

/**
 * Load jobs
 */
function loadJobs() {
    return getBackendData('/jobs')
        .then(data => {
            if (data.success) {
                displayJobs(data);
            } else {
                throw new Error(data.error || 'Failed to load jobs');
            }
        });
}

/**
 * Display project information
 */
function displayProjectInfo(data) {
    const project = data.project;
    const stats = data.stats;

    setElementText('projectKey', project.key);
    setElementText('projectName', project.name);
    setElementText('projectDescription', project.description || project.shortDesc || 'No description available');
    setElementText('datasetCount', stats.datasets);
    setElementText('recipeCount', stats.recipes);
    setElementText('scenarioCount', stats.scenarios);
    setElementText('nodeCount', stats.nodes);
}

/**
 * Display scenarios in table
 */
function displayScenarios(scenarios) {
    const container = document.getElementById('scenariosContainer');
    const table = document.getElementById('scenariosTable');
    const tbody = document.getElementById('scenariosTableBody');
    const badge = document.getElementById('scenarioBadge');

    // Update badge
    badge.textContent = `${scenarios.length} scenario${scenarios.length !== 1 ? 's' : ''}`;

    if (scenarios.length === 0) {
        container.innerHTML = '<p class="empty-state">No scenarios found in this project</p>';
        table.style.display = 'none';
        return;
    }

    // Clear existing rows
    tbody.innerHTML = '';

    // Add scenario rows
    scenarios.forEach(scenario => {
        const row = createScenarioRow(scenario);
        tbody.appendChild(row);
    });

    // Show table
    table.style.display = 'table';
    container.querySelector('.loading-text')?.remove();
}

/**
 * Create a table row for a scenario
 */
function createScenarioRow(scenario) {
    const row = document.createElement('tr');

    // Scenario name
    const nameCell = document.createElement('td');
    nameCell.textContent = scenario.name;
    nameCell.className = 'scenario-name';
    row.appendChild(nameCell);

    // Status (running or not)
    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = scenario.runningState ? 'status-badge status-running' : 'status-badge status-idle';
    statusBadge.textContent = scenario.runningState ? 'Running' : 'Idle';
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);

    // Active status
    const activeCell = document.createElement('td');
    const activeBadge = document.createElement('span');
    activeBadge.className = scenario.active ? 'badge badge-success' : 'badge badge-secondary';
    activeBadge.textContent = scenario.active ? 'Active' : 'Inactive';
    activeCell.appendChild(activeBadge);
    row.appendChild(activeCell);

    // Last run time
    const lastRunCell = document.createElement('td');
    if (scenario.lastRunInfo) {
        lastRunCell.textContent = formatTimestamp(scenario.lastRunInfo.start);
    } else {
        lastRunCell.textContent = 'Never';
        lastRunCell.className = 'text-muted';
    }
    row.appendChild(lastRunCell);

    // Outcome
    const outcomeCell = document.createElement('td');
    if (scenario.lastRunInfo) {
        const outcomeBadge = document.createElement('span');
        outcomeBadge.className = `status-badge status-${scenario.lastRunInfo.outcome.toLowerCase()}`;
        outcomeBadge.textContent = scenario.lastRunInfo.outcome;
        outcomeCell.appendChild(outcomeBadge);
    } else {
        outcomeCell.textContent = '-';
    }
    row.appendChild(outcomeCell);

    // Duration
    const durationCell = document.createElement('td');
    if (scenario.lastRunInfo && scenario.lastRunInfo.duration) {
        durationCell.textContent = formatDuration(scenario.lastRunInfo.duration);
    } else {
        durationCell.textContent = '-';
    }
    row.appendChild(durationCell);

    // Actions
    const actionsCell = document.createElement('td');
    actionsCell.className = 'actions-cell';

    if (scenario.runningState) {
        // Abort button for running scenarios
        const abortBtn = createButton('Abort', 'btn-danger btn-sm', () => abortScenario(scenario.id));
        actionsCell.appendChild(abortBtn);
    } else {
        // Run button for idle scenarios
        const runBtn = createButton('Run', 'btn-primary btn-sm', () => runScenario(scenario.id));
        actionsCell.appendChild(runBtn);
    }

    // History button
    const historyBtn = createButton('History', 'btn-secondary btn-sm', () => showRunHistory(scenario.id, scenario.name));
    actionsCell.appendChild(historyBtn);

    row.appendChild(actionsCell);

    return row;
}

/**
 * Display jobs
 */
function displayJobs(data) {
    const runningJobs = data.running || [];
    const recentJobs = data.recent || [];

    // Update counts
    setElementText('runningJobCount', runningJobs.length);
    setElementText('recentJobCount', recentJobs.length);

    // Display running jobs
    const runningContainer = document.getElementById('runningJobsList');
    const noRunningJobs = document.getElementById('noRunningJobs');

    if (runningJobs.length === 0) {
        noRunningJobs.style.display = 'block';
        runningContainer.innerHTML = '';
    } else {
        noRunningJobs.style.display = 'none';
        runningContainer.innerHTML = runningJobs.map(job => createJobCard(job, true)).join('');
    }

    // Display recent jobs
    const recentContainer = document.getElementById('recentJobsList');
    const noRecentJobs = document.getElementById('noRecentJobs');

    if (recentJobs.length === 0) {
        noRecentJobs.style.display = 'block';
        recentContainer.innerHTML = '';
    } else {
        noRecentJobs.style.display = 'none';
        recentContainer.innerHTML = recentJobs.map(job => createJobCard(job, false)).join('');
    }
}

/**
 * Create job card HTML
 */
function createJobCard(job, isRunning) {
    const stateClass = getJobStateClass(job.state);
    const duration = job.endTime ? formatDuration(job.endTime - job.startTime) : 'In progress...';

    return `
        <div class="job-card ${isRunning ? 'job-running' : ''}">
            <div class="job-header">
                <span class="job-type">${job.type || 'Unknown'}</span>
                <span class="status-badge ${stateClass}">${job.state}</span>
            </div>
            <div class="job-info">
                <div class="job-detail">
                    <span class="label">Job ID:</span>
                    <span class="value">${job.id}</span>
                </div>
                <div class="job-detail">
                    <span class="label">Started:</span>
                    <span class="value">${formatTimestamp(job.startTime)}</span>
                </div>
                <div class="job-detail">
                    <span class="label">Duration:</span>
                    <span class="value">${duration}</span>
                </div>
                <div class="job-detail">
                    <span class="label">Initiator:</span>
                    <span class="value">${job.initiator}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Run a scenario
 */
function runScenario(scenarioId) {
    if (!confirm(`Are you sure you want to run this scenario?`)) {
        return;
    }

    showLoading(true);

    postBackendData('/run-scenario', { scenarioId: scenarioId })
        .then(data => {
            showLoading(false);
            if (data.success) {
                showSuccess(`Scenario started successfully. Outcome: ${data.outcome}`);
                // Refresh scenarios and jobs
                setTimeout(() => {
                    loadScenarios();
                    loadJobs();
                }, 2000);
            } else {
                showError(data.error || 'Failed to run scenario');
            }
        })
        .catch(error => {
            showLoading(false);
            showError('Error running scenario: ' + error.message);
        });
}

/**
 * Abort a running scenario
 */
function abortScenario(scenarioId) {
    if (!confirm('Are you sure you want to abort this running scenario?')) {
        return;
    }

    showLoading(true);

    postBackendData('/abort-scenario', { scenarioId: scenarioId })
        .then(data => {
            showLoading(false);
            if (data.success) {
                showSuccess('Scenario aborted successfully');
                // Refresh scenarios
                setTimeout(() => {
                    loadScenarios();
                    loadJobs();
                }, 1000);
            } else {
                showError(data.error || 'Failed to abort scenario');
            }
        })
        .catch(error => {
            showLoading(false);
            showError('Error aborting scenario: ' + error.message);
        });
}

/**
 * Build selected dataset
 */
function buildSelectedDataset() {
    const select = document.getElementById('datasetSelect');
    const datasetName = select.value;

    if (!datasetName) {
        return;
    }

    if (!confirm(`Build dataset "${datasetName}"?`)) {
        return;
    }

    showLoading(true);

    postBackendData('/build-dataset', { datasetName: datasetName })
        .then(data => {
            showLoading(false);
            if (data.success) {
                showSuccess(data.message);
                // Refresh jobs
                setTimeout(() => loadJobs(), 1000);
            } else {
                showError(data.error || 'Failed to build dataset');
            }
        })
        .catch(error => {
            showLoading(false);
            showError('Error building dataset: ' + error.message);
        });
}

/**
 * Show run history for a scenario
 */
function showRunHistory(scenarioId, scenarioName) {
    const modal = document.getElementById('runHistoryModal');
    const modalScenarioName = document.getElementById('modalScenarioName');
    const content = document.getElementById('runHistoryContent');

    modalScenarioName.textContent = scenarioName;
    content.innerHTML = '<p>Loading run history...</p>';
    modal.style.display = 'flex';

    getBackendData(`/scenario-runs?scenarioId=${scenarioId}&limit=10`)
        .then(data => {
            if (data.success && data.runs) {
                content.innerHTML = createRunHistoryHTML(data.runs);
            } else {
                content.innerHTML = '<p class="error">Failed to load run history</p>';
            }
        })
        .catch(error => {
            content.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        });
}

/**
 * Close run history modal
 */
function closeRunHistoryModal() {
    const modal = document.getElementById('runHistoryModal');
    modal.style.display = 'none';
}

/**
 * Create run history HTML
 */
function createRunHistoryHTML(runs) {
    if (!runs || runs.length === 0) {
        return '<p class="empty-state">No run history available</p>';
    }

    return runs.map(run => `
        <div class="run-history-item">
            <div class="run-header">
                <span class="status-badge status-${run.outcome ? run.outcome.toLowerCase() : 'unknown'}">
                    ${run.outcome || 'UNKNOWN'}
                </span>
                <span class="run-time">${formatTimestamp(run.start)}</span>
            </div>
            <div class="run-details">
                <span>Duration: ${formatDuration(run.duration)}</span>
                <span>Trigger: ${run.trigger?.type || 'manual'}</span>
            </div>
        </div>
    `).join('');
}

/**
 * Populate dataset select dropdown
 */
function populateDatasetSelect(datasets) {
    const select = document.getElementById('datasetSelect');
    if (!select) return;

    // Clear existing options except the first one
    select.innerHTML = '<option value="">Select a dataset...</option>';

    if (datasets && datasets.length > 0) {
        datasets.forEach(dataset => {
            const option = document.createElement('option');
            option.value = dataset.name;
            option.textContent = `${dataset.name} (${dataset.type})`;
            select.appendChild(option);
        });
    }
}

/**
 * Toggle auto-refresh
 */
function toggleAutoRefresh(enabled) {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }

    if (enabled) {
        autoRefreshInterval = setInterval(() => {
            console.log('Auto-refreshing data...');
            loadAllData();
        }, 30000); // 30 seconds
        showSuccess('Auto-refresh enabled (30s interval)');
    } else {
        showSuccess('Auto-refresh disabled');
    }
}

/**
 * Make GET request to backend
 */
function getBackendData(route) {
    return fetch(`/backend${route}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        });
}

/**
 * Make POST request to backend
 */
function postBackendData(route, data) {
    return fetch(`/backend${route}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    });
}

/**
 * Utility Functions
 */

function setElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function showError(message) {
    const alert = document.getElementById('errorAlert');
    const messageSpan = document.getElementById('errorMessage');
    if (alert && messageSpan) {
        messageSpan.textContent = message;
        alert.style.display = 'block';
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    }
}

function hideError() {
    const alert = document.getElementById('errorAlert');
    if (alert) {
        alert.style.display = 'none';
    }
}

function showSuccess(message) {
    const alert = document.getElementById('successAlert');
    const messageSpan = document.getElementById('successMessage');
    if (alert && messageSpan) {
        messageSpan.textContent = message;
        alert.style.display = 'block';
        setTimeout(() => {
            alert.style.display = 'none';
        }, 3000);
    }
}

function updateLastRefreshTime() {
    const now = new Date();
    setElementText('lastUpdated', now.toLocaleString());
}

function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
}

function formatDuration(ms) {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

function getJobStateClass(state) {
    const stateMap = {
        'DONE': 'status-success',
        'FAILED': 'status-failed',
        'ABORTED': 'status-aborted',
        'RUNNING': 'status-running',
        'WAITING': 'status-waiting'
    };
    return stateMap[state] || 'status-unknown';
}

function createButton(text, className, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = `btn ${className}`;
    button.addEventListener('click', onClick);
    return button;
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('runHistoryModal');
    if (event.target === modal) {
        closeRunHistoryModal();
    }
});
