"""
Ultra-Minimal Backend - NO Dataiku API calls
This tests if routing works at all
"""

from flask import jsonify

# Health check
@app.route('/__ping')
def health_check():
    return jsonify({'status': 'ok'}), 200


# HARDCODED data - no API calls
@app.route('/project-info')
def project_info():
    return jsonify({
        'success': True,
        'project': {
            'key': 'HARDCODED_KEY',
            'name': 'Test Project',
            'description': 'If you see this, routing works!',
            'shortDesc': ''
        },
        'stats': {
            'datasets': 5,
            'recipes': 3,
            'scenarios': 2,
            'nodes': 10
        },
        'datasets': [
            {'name': 'test_dataset_1', 'type': 'SQL'},
            {'name': 'test_dataset_2', 'type': 'filesystem'}
        ]
    })


@app.route('/scenarios')
def scenarios():
    return jsonify({
        'success': True,
        'scenarios': [
            {
                'id': 'test_scenario_1',
                'name': 'Test Scenario',
                'active': True,
                'type': 'step_based',
                'lastRunInfo': {
                    'outcome': 'SUCCESS',
                    'start': 1700000000000,
                    'end': 1700000060000,
                    'duration': 60000,
                    'trigger': 'manual'
                },
                'runningState': False
            }
        ]
    })


@app.route('/jobs')
def jobs():
    return jsonify({
        'success': True,
        'running': [],
        'recent': [
            {
                'id': 'job_123',
                'type': 'BUILD_DATASET',
                'state': 'DONE',
                'startTime': 1700000000000,
                'endTime': 1700000060000,
                'initiator': 'test_user',
                'aborted': False
            }
        ]
    })
