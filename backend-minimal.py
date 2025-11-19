"""
Minimal Backend for Debugging - Test which API calls work
"""

from flask import request, jsonify
import dataiku

# Health check
@app.route('/__ping')
def health_check():
    return jsonify({'status': 'ok'}), 200


# Test 1: Basic endpoint
@app.route('/test')
def test():
    return jsonify({'success': True, 'message': 'Backend is working!'})


# Test 2: Can we get project key?
@app.route('/project-info')
def project_info():
    try:
        project_key = dataiku.default_project_key()

        return jsonify({
            'success': True,
            'project': {
                'key': project_key,
                'name': 'Test',
                'description': 'If you see this, basic access works'
            },
            'stats': {
                'datasets': 0,
                'recipes': 0,
                'scenarios': 0,
                'nodes': 0
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error in project_info: {str(e)}',
            'error_type': type(e).__name__
        }), 500


# Test 3: Can we list datasets?
@app.route('/scenarios')
def scenarios():
    try:
        project = dataiku.Project(dataiku.default_project_key())
        scenarios = project.list_scenarios()

        return jsonify({
            'success': True,
            'scenarios': [{
                'id': s.get('id', 'unknown'),
                'name': s.get('name', s.get('id', 'unknown')),
                'active': False,
                'type': 'unknown',
                'lastRunInfo': None,
                'runningState': False
            } for s in scenarios]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error in scenarios: {str(e)}',
            'error_type': type(e).__name__
        }), 500


# Test 4: Jobs
@app.route('/jobs')
def jobs():
    try:
        return jsonify({
            'success': True,
            'running': [],
            'recent': []
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error in jobs: {str(e)}',
            'error_type': type(e).__name__
        }), 500
