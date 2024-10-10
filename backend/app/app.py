import logging

from flask import Flask
from flask import jsonify, request, json
from werkzeug.exceptions import HTTPException

import models
from models import InvalidAPIUsage
from services import ParseExecService


def setup_logging():
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )


setup_logging()
logger = logging.getLogger(__name__)
app = Flask(__name__)


@app.errorhandler(HTTPException)
def handle_exception(e):
    """Return JSON instead of HTML for HTTP errors."""
    # start with the correct headers and status code from the error
    response = e.get_response()
    # replace the body with JSON
    response.data = json.dumps({
        "code": e.code,
        "name": e.name,
        "description": e.description,
    })
    response.content_type = "application/json"
    return response

@app.errorhandler(models.InvalidAPIUsage)
def invalid_api_usage(e):
    return jsonify(e.to_dict()), e.status_code


@app.route('/')
def hello_world():
    return 'Hello, World!'



@app.route('/ParseExec', methods=['POST'])
def ParseExecController():
    data = request.get_json()
    code = data['code']
    model = ParseExecService(code)
    if model.is_empty:
        raise InvalidAPIUsage("EMPTY", status_code=400)
    if model.is_lex_illegal:
        raise InvalidAPIUsage("LEX", status_code=400, payload=model.error_payload)
    if model.is_yacc_illegal:
        raise InvalidAPIUsage("YACC", status_code=400, payload=model.error_payload)
    if model.is_resolver_illegal:
        raise InvalidAPIUsage("RESOLVER", status_code=400, payload=model.error_payload)
    if model.is_timeout:
        raise InvalidAPIUsage("TIMEOUT", status_code=400)
    return {
        'result': '\n'.join(model.data),
        'parsed': model.parsed_python,
        'time': model.resp_time,
    }

