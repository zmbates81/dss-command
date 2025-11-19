"""
Dataiku DSS Project Command Center - Python Backend
Provides Flask API endpoints for project info, scenarios, and jobs management.
"""

from flask import Flask, request, jsonify
import dataiku
from dataiku import pandasutils as pdu
from datetime import datetime
import json

# Initialize Flask app
app = Flask(__name__)

# Initialize Dataiku client
client = dataiku.api_client()


def get_project_info():
    """Get current project information and metadata."""
    try:
        project = dataiku.Project(dataiku.default_project_key())
        project_info = project.get_settings()

        # Get datasets
        datasets = project.list_datasets()

        # Get flow information
        flow = project.get_flow()
        flow_graph = flow.get_graph()

        # Count different object types
        recipes = project.list_recipes()
        scenarios = project.list_scenarios()

        return jsonify({
            'success': True,
            'project': {
                'key': dataiku.default_project_key(),
                'name': project_info.settings.get('name', 'N/A'),
                'description': project_info.settings.get('description', ''),
                'shortDesc': project_info.settings.get('shortDesc', ''),
            },
            'stats': {
                'datasets': len(datasets),
                'recipes': len(recipes),
                'scenarios': len(scenarios),
                'nodes': len(flow_graph.get('nodes', []))
            },
            'datasets': [
                {
                    'name': ds['name'],
                    'type': ds.get('type', 'unknown')
                } for ds in datasets[:10]  # Limit to first 10 for performance
            ]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def get_scenarios():
    """Get all scenarios with their status and last run information."""
    try:
        project = dataiku.Project(dataiku.default_project_key())
        scenarios = project.list_scenarios()

        scenario_details = []
        for scenario_info in scenarios:
            try:
                scenario = project.get_scenario(scenario_info['id'])
                settings = scenario.get_settings()
                status = scenario.get_status()

                # Get last runs
                last_runs = scenario.get_last_runs(limit=1)
                last_run_info = None

                if last_runs:
                    last_run = last_runs[0]
                    last_run_info = {
                        'outcome': last_run.get('outcome', 'UNKNOWN'),
                        'start': last_run.get('start', 0),
                        'end': last_run.get('end', 0),
                        'duration': last_run.get('duration', 0),
                        'trigger': last_run.get('trigger', {}).get('type', 'manual')
                    }

                scenario_details.append({
                    'id': scenario_info['id'],
                    'name': scenario_info.get('name', scenario_info['id']),
                    'active': settings.get_raw()['active'],
                    'type': settings.get_raw().get('type', 'step_based'),
                    'lastRunInfo': last_run_info,
                    'runningState': status.get('running', False)
                })
            except Exception as e:
                # If we can't get details for one scenario, continue with others
                scenario_details.append({
                    'id': scenario_info['id'],
                    'name': scenario_info.get('name', scenario_info['id']),
                    'error': str(e)
                })

        return jsonify({
            'success': True,
            'scenarios': scenario_details
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def run_scenario():
    """Run a specific scenario."""
    try:
        data = request.get_json()
        scenario_id = data.get('scenarioId')

        if not scenario_id:
            return jsonify({
                'success': False,
                'error': 'Missing scenarioId parameter'
            }), 400

        project = dataiku.Project(dataiku.default_project_key())
        scenario = project.get_scenario(scenario_id)

        # Trigger the scenario
        run = scenario.run_and_wait()

        return jsonify({
            'success': True,
            'message': f'Scenario {scenario_id} started',
            'outcome': run.get('outcome', 'UNKNOWN')
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def abort_scenario():
    """Abort a running scenario."""
    try:
        data = request.get_json()
        scenario_id = data.get('scenarioId')

        if not scenario_id:
            return jsonify({
                'success': False,
                'error': 'Missing scenarioId parameter'
            }), 400

        project = dataiku.Project(dataiku.default_project_key())
        scenario = project.get_scenario(scenario_id)

        # Abort the scenario
        scenario.abort()

        return jsonify({
            'success': True,
            'message': f'Scenario {scenario_id} aborted'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def get_jobs():
    """Get current and recent jobs information."""
    try:
        project = dataiku.Project(dataiku.default_project_key())

        # Get recent jobs (limit to 20 for performance)
        jobs = project.list_jobs(limit=20)

        job_list = []
        for job_info in jobs:
            try:
                job_list.append({
                    'id': job_info.get('def', {}).get('id', 'N/A'),
                    'type': job_info.get('def', {}).get('type', 'unknown'),
                    'state': job_info.get('state', 'UNKNOWN'),
                    'startTime': job_info.get('startTime', 0),
                    'endTime': job_info.get('endTime', 0),
                    'initiator': job_info.get('initiator', 'unknown'),
                    'aborted': job_info.get('aborted', False)
                })
            except Exception as e:
                # Skip problematic jobs
                continue

        # Separate running and completed jobs
        running_jobs = [j for j in job_list if j['state'] in ['RUNNING', 'WAITING']]
        completed_jobs = [j for j in job_list if j['state'] not in ['RUNNING', 'WAITING']]

        return jsonify({
            'success': True,
            'running': running_jobs,
            'recent': completed_jobs[:10]  # Last 10 completed
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def build_dataset():
    """Build a specific dataset."""
    try:
        data = request.get_json()
        dataset_name = data.get('datasetName')

        if not dataset_name:
            return jsonify({
                'success': False,
                'error': 'Missing datasetName parameter'
            }), 400

        project = dataiku.Project(dataiku.default_project_key())
        dataset = project.get_dataset(dataset_name)

        # Build the dataset
        job = dataset.build()

        return jsonify({
            'success': True,
            'message': f'Build started for dataset {dataset_name}',
            'jobId': job.id if hasattr(job, 'id') else 'N/A'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def get_scenario_runs():
    """Get detailed run history for a specific scenario."""
    try:
        scenario_id = request.args.get('scenarioId')
        limit = int(request.args.get('limit', 10))

        if not scenario_id:
            return jsonify({
                'success': False,
                'error': 'Missing scenarioId parameter'
            }), 400

        project = dataiku.Project(dataiku.default_project_key())
        scenario = project.get_scenario(scenario_id)

        runs = scenario.get_last_runs(limit=limit)

        return jsonify({
            'success': True,
            'runs': runs
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# Flask routes - DSS webapp endpoints
@app.route('/project-info')
def route_project_info():
    """GET endpoint for project information."""
    return get_project_info()


@app.route('/scenarios')
def route_scenarios():
    """GET endpoint for scenarios list."""
    return get_scenarios()


@app.route('/jobs')
def route_jobs():
    """GET endpoint for jobs information."""
    return get_jobs()


@app.route('/scenario-runs')
def route_scenario_runs():
    """GET endpoint for scenario run history."""
    return get_scenario_runs()


@app.route('/run-scenario', methods=['POST'])
def route_run_scenario():
    """POST endpoint to run a scenario."""
    return run_scenario()


@app.route('/abort-scenario', methods=['POST'])
def route_abort_scenario():
    """POST endpoint to abort a scenario."""
    return abort_scenario()


@app.route('/build-dataset', methods=['POST'])
def route_build_dataset():
    """POST endpoint to build a dataset."""
    return build_dataset()
