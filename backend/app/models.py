

class InvalidAPIUsage(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        super().__init__()
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload
    def to_dict(self):
        return {
            'message': self.message,
            'payload': self.payload,
        }

class ExecPythonModel:
    def __init__(self):
        self.is_empty = False
        self.is_timeout = False
        self.is_error = False
        self.error_payload: dict|None = None
        
        self.data = []
        self.resp_time: float|None = None

class ParseExecModel(ExecPythonModel):
    def __init__(self):
        super().__init__()
        self.is_lex_illegal = False
        self.is_yacc_illegal = False
        self.is_resolver_illegal = False
        self.parsed_python: str|None = None

