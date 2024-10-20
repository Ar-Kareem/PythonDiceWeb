/// <reference lib="webworker" />
importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js');

const BASE_PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/';
const BASE_CALC_DICE_URL = 'https://files.pythonhosted.org/packages/b2/76/62b455504dacf48146450d62324c5354d482cb7930bcd34c0d727877287f/dice_calc-0.3.0-py3-none-any.whl';

type RV = [val: number, prob: number][]


declare let loadPyodide: any;
let pyodide: any = null;

let isLoadingResolve: (() => void) | null = null;
const isLoading = new Promise<void>((resolve) => {
  isLoadingResolve = resolve;
});


async function loadPyodideAndPackages() {
  if (!!pyodide) {
    throw new Error('Should not happen');
  }
  if (typeof loadPyodide === 'undefined') {
    // wait and retry
    console.log('loadPyodide retrying...');
    await new Promise((resolve) => setTimeout(resolve, 250));
    return await loadPyodideAndPackages();
  }
  pyodide = await loadPyodide({ indexURL: BASE_PYODIDE_URL });
  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  await micropip.install(BASE_CALC_DICE_URL);
  console.log('Pyodide loaded');
  if (!isLoadingResolve) {
    throw new Error('Should not happen');
  } 
  isLoadingResolve(); // Resolves the isLoading promise
}

onmessage = async ({ data }) => {
  try {
    if (data === 'init') {
      await loadPyodideAndPackages();
      return;
    }
    await isLoading;  // wait until loading is done
    console.log('ready to execute code!!!');

    let result: any;
    const start_time = performance.now();
    const { code, api } = data;
    switch (api) {
      case 'EXEC_DICE_CODE':
        result = exec_dice_code(code);
        break;
      case 'EXEC_PYTHON_CODE':
        result = exec_python_code(code);
        break;
      case 'TRANSLATE_DICE_CODE':
        result = translate(code);
        break;
      default:
        throw new Error('Invalid API');
    }
    result.time = performance.now() - start_time;
    postMessage(result);
  } catch (error) {
    console.error('Error in web worker', error);
    postMessage({ error });
  }
};

function translate(code:string, flags=true) {
  const globals = pyodide.toPy({ code });
  const PYCODE = flags ? PYTHON_CODE_REPO.TRANSLATE_NO_FLAGS : PYTHON_CODE_REPO.TRANSLATE_NO_FLAGS
  const pyResult = pyodide.runPython(PYCODE, { globals });
  if (pyResult.get('error')) {
    return { error: pyResult.get('error') }
  }
  const result = pyResult.toJs().get('result');
  return {
    result: result,
  }
}

function exec_python_code(code:string) {
  const globals = pyodide.toPy({ code });
  const pyResult = pyodide.runPython(PYTHON_CODE_REPO.EXEC_PYTHON_CODE, { globals });
  if (pyResult.get('error')) {
    return { error: pyResult.get('error') }
  }
  const result = pyResult.toJs();
  const rvs: [RV, string | undefined][] = result.get('rvs');
  rvs.forEach((rv_output, i) => {
    const rv: RV = (rv_output[0] as any).get_vals_probs().toJs();
    const named = rv_output.length > 1 ? rv_output[1] : undefined;
    rvs[i] = [rv, named];
  });
  return {
    rvs,
    result: result.get('output'),
  }
}

function exec_dice_code(code:string) {
  const parsed = translate(code).result;
  return {...exec_python_code(parsed), parsed}
}

abstract class PYTHON_CODE_REPO {
  static readonly SHARED_CODE = `
def compile(code, flags):
  from dice_calc.parser import compile_anydice
  compiler_flags = {'COMPILER_FLAG_NON_LOCAL_SCOPE': True, 'COMPILER_FLAG_OPERATOR_ON_INT': True} if flags else {}
  return {'result': compile_anydice(code, compiler_flags)}
def run_python(parsed):
  from dice_calc import output
  from dice_calc.parser.parse_and_exec import unsafe_exec
  outputs = []
  print('inside unsafe exec')
  unsafe_exec(parsed, global_vars={'output': lambda x, named=None: outputs.append((x, named))})
  out_str = ''.join([output(r, named=n, print_=False, blocks_width=100) for r, n in outputs])
  print('done unsafe exec')
  return {'rvs': outputs, 'parsed': parsed, 'output': out_str}

def main(f):
  try:
    return f()
  except Exception as e:
    return {'error': str(e)}
# executable here

`
  static readonly EXEC_PYTHON_CODE = PYTHON_CODE_REPO.SHARED_CODE + `main(lambda: run_python(code))`
  static readonly TRANSLATE_YES_FLAGS = PYTHON_CODE_REPO.SHARED_CODE + `main(lambda: compile(code, flags=True))`
  static readonly TRANSLATE_NO_FLAGS = PYTHON_CODE_REPO.SHARED_CODE + `main(lambda: compile(code, flags=False))`

}