import logging
from multiprocessing import Pool, TimeoutError
import time

from dice_calc import randvar
import dice_calc.parser.parse_and_exec as parse_and_exec

import models


logger = logging.getLogger(__name__)


def ParseService(to_parse):
    s = time.time()
    res = models.ParseExecModel()
    if to_parse is None or to_parse.strip() == '':
        res.is_empty = True
        logger.debug('Empty string')
        return res
    lexer, yaccer = parse_and_exec.build_lex_yacc()
    parse_and_exec.do_lex(to_parse, lexer)
    if lexer.LEX_ILLEGAL_CHARS:
        res.is_lex_illegal = True
        res.error_payload = lexer.LEX_ILLEGAL_CHARS
        logger.debug('Lex Illegal characters found: ' + str(lexer.LEX_ILLEGAL_CHARS))
        return res
    yacc_ret = parse_and_exec.do_yacc(to_parse, lexer, yaccer)
    if lexer.YACC_ILLEGALs or yacc_ret is None:
        res.is_yacc_illegal = True
        res.error_payload = lexer.YACC_ILLEGALs
        logger.debug('Yacc Illegal tokens found: ' + str(lexer.YACC_ILLEGALs))
        return res
    try:
        python_str = parse_and_exec.do_resolve(yacc_ret)
    except Exception as e:
        res.is_resolver_illegal = True
        res.error_payload = {'message': str(e)}
        logger.debug('Resolver error: ' + str(e))
        return res
    res.parsed_python = python_str
    res.resp_time = time.time() - s
    return res


def ParseExecService(to_parse) -> models.ParseExecModel:
    res = ParseService(to_parse)
    if res.parsed_python is None:
        return res
    res = ExecPythonService(res.parsed_python, res)
    assert isinstance(res, models.ParseExecModel), 'Should never error'
    return res


def ExecPythonService(python_str: str|None, obj: models.ParseExecModel|None = None):
    s = time.time()
    res = models.ExecPythonModel() if (obj is None) else obj
    if python_str is None or python_str.strip() == '':
        res.is_empty = True
        logger.debug('Empty string')
        return res
    try:
        exec_res = parse_and_exec.safe_exec(python_str, global_vars={})
    except (SyntaxError, NameError, ValueError, ImportError) as e:
        res.is_error = True
        res.error_payload = {'message': str(e)}
        logger.debug('Exec error: ' + str(e))
        return res
    for (args, kwargs) in exec_res:
        res.data.append(randvar.output(*args, **kwargs, print_=False, blocks_width=100))
    res.resp_time = time.time() - s
    return res

