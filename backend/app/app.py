from flask import Flask
from flask import request

from dice_calc import randvar
from dice_calc.parser.parse_and_exec import pipeline

app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/post_echo', methods=['POST'])
def post_echo():
    data = request.get_json()
    if 'message' in data:
        data['message'] = 'Echo: ' + data['message']
    return data


@app.route('/parse_and_exec', methods=['POST'])
def parse_and_exec():
    data = request.get_json()
    code = data['code']
    pipeline_result = pipeline(to_parse=code, do_exec=True)
    parsed = pipeline(to_parse=code, do_exec=False)
    if pipeline_result is None:
        return 'Error'
    result = []
    for (args, kwargs) in pipeline_result:
        result.append(randvar.output(*args, **kwargs, print_=False, blocks_width=120))
    response = {
        'result': '\n'.join(result),
        'parsed': parsed,
    }
    return response
