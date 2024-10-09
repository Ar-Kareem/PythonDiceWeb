from flask import Flask
from flask import jsonify, request, json
from werkzeug.exceptions import HTTPException

import time


from dice_calc import randvar
import dice_calc.parser.parse_and_exec as parse_and_exec

import models
from models import InvalidAPIUsage

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
    s = time.time()
    data = request.get_json()
    code = data['code']
    model = ParseExecService(code)
    if model.is_empty:
        raise InvalidAPIUsage("EMPTY", status_code=400)
    if model.is_lex_illegal:
        raise InvalidAPIUsage("LEX", status_code=400, payload=model.error_payload)
    if model.is_yacc_illegal:
        raise InvalidAPIUsage("YACC", status_code=400, payload=model.error_payload)
    return {
        'result': '\n'.join(model.data),
        'parsed': model.parsed_python,
        'time': model.resp_time,
    }


def ParseExecService(to_parse):
    s = time.time()
    res = models.ParseExecModel()
    if to_parse is None or to_parse.strip() == '':
        res.is_empty = True
        app.logger.debug('Empty string')
        return res
    lexer, yaccer = parse_and_exec.build_lex_yacc()
    parse_and_exec.do_lex(to_parse, lexer)
    if lexer.LEX_ILLEGAL_CHARS:
        res.is_lex_illegal = True
        res.error_payload = lexer.LEX_ILLEGAL_CHARS
        app.logger.debug('Lex Illegal characters found: ' + str(lexer.LEX_ILLEGAL_CHARS))
        return res
    yacc_ret = parse_and_exec.do_yacc(to_parse, lexer, yaccer)
    if lexer.YACC_ILLEGALs or yacc_ret is None:
        res.is_yacc_illegal = True
        res.error_payload = lexer.YACC_ILLEGALs
        app.logger.debug('Yacc Illegal tokens found: ' + str(lexer.YACC_ILLEGALs))
        return res
    python_str = parse_and_exec.do_resolve(yacc_ret)
    res.parsed_python = python_str
    exec_res = parse_and_exec.safe_exec(python_str, global_vars={})
    for (args, kwargs) in exec_res:
        res.data.append(randvar.output(*args, **kwargs, print_=False, blocks_width=100))
    res.resp_time = time.time() - s
    return res
