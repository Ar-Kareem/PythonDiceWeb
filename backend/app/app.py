import logging
from multiprocessing import Pool
import time
from pathlib import Path

from flask import Flask, stream_with_context
from flask import jsonify, request, json
from werkzeug.exceptions import HTTPException

import models
from models import InvalidAPIUsage
import services


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
    return generic_stream_generator(_ParseExecController, args=(code,))
def _ParseExecController(code):
    model = services.ParseExecService(code)
    if model.is_empty:
        raise InvalidAPIUsage("EMPTY", status_code=400)
    if model.is_lex_illegal:
        raise InvalidAPIUsage("LEX", status_code=400, payload=model.error_payload)
    if model.is_yacc_illegal:
        raise InvalidAPIUsage("YACC", status_code=400, payload=model.error_payload)
    if model.is_resolver_illegal:
        raise InvalidAPIUsage("RESOLVER", status_code=400, payload=model.error_payload)
    if model.is_error:
        raise InvalidAPIUsage("PYTHONERROR", status_code=400, payload=model.error_payload)
    return {
        'result': '\n'.join(model.data),
        'parsed': model.parsed_python,
        'time': model.resp_time,
    }


@app.route('/ExecPython', methods=['POST'])
def ExecPythonController():
    data = request.get_json()
    code = data['code']
    return generic_stream_generator(_ExecPythonController, args=(code,))
def _ExecPythonController(code):
    model = services.ExecPythonService(code)
    if model.is_empty:
        raise InvalidAPIUsage("EMPTY", status_code=400)
    if model.is_error:
        raise InvalidAPIUsage("PYTHONERROR", status_code=400, payload=model.error_payload)
    return {
        'result': '\n'.join(model.data),
        'time': model.resp_time,
    }


@app.route('/Translate', methods=['POST'])
def TranslateController():
    data = request.get_json()
    code = data['code']
    return generic_stream_generator(_TranslateController, args=(code,))
def _TranslateController(code):
    model = services.ParseService(code)
    if model.is_empty:
        raise InvalidAPIUsage("EMPTY", status_code=400)
    if model.is_lex_illegal:
        raise InvalidAPIUsage("LEX", status_code=400, payload=model.error_payload)
    if model.is_yacc_illegal:
        raise InvalidAPIUsage("YACC", status_code=400, payload=model.error_payload)
    if model.is_resolver_illegal:
        raise InvalidAPIUsage("RESOLVER", status_code=400, payload=model.error_payload)
    return {
        'result': model.parsed_python,
    }



def generic_stream_generator(fn, timeout: int = 5, args=None, kwargs=None):
    return stream_with_context(generic_generator(fn, timeout, args, kwargs))

def generic_generator(fn, timeout: int = 5, args=None, kwargs=None):
    YIELD_INTERVAL = 0.05
    YIELD_COUNT = int(timeout / YIELD_INTERVAL)
    if args is None:
        args = ()
    if kwargs is None:
        kwargs = {}
    cur_yield = 0
    pool = Pool(processes=1)
    try:
        result = pool.apply_async(fn, args=args, kwds=kwargs)
        while True:
            if cur_yield >= YIELD_COUNT:  # timeout
                raise InvalidAPIUsage('TIMEOUT', status_code=400)
            if not result.ready():  # not ready, make sure connection is alive
                yield ' '
                cur_yield += 1
            else:
                yield json.dumps(result.get(timeout=timeout))
                return
            time.sleep(0.05)
    except GeneratorExit:
        logger.debug('GeneratorExit Raised, user closed connection')
    except InvalidAPIUsage as e:
        logger.info('got InvalidAPIUsage: ' + str(e))
        yield json.dumps(e.to_dict())
    except Exception as e:
        logger.error('Unexpected internal error: ' + str(e))
        yield json.dumps(InvalidAPIUsage('Internal Error', status_code=500).to_dict())
    finally:
        pool.terminate()
