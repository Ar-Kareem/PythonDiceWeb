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
  if (data === 'init') {
    await loadPyodideAndPackages();
    return;
  }
  await isLoading;  // wait until loading is done
  console.log('ready to execute code!!!');

  const { code } = data;

  try {
    const globals = pyodide.toPy({ code });
    const pyResult = pyodide.runPython(PYTHON_CODE_REPO.EXEC_DICE_CODE, { globals });
    const result = pyResult.toJs();

    const rvs: [RV, string | undefined][] = result.get('rvs');
    rvs.forEach((rv_output, i) => {
      const rv: RV = (rv_output[0] as any).get_vals_probs().toJs();
      const named = rv_output.length > 1 ? rv_output[1] : undefined;
      rvs[i] = [rv, named];
    });

    postMessage({
      rvs,
      parsed: result.get('parsed'),
      time: 1.1234,
      result: 'Not yet implemented'
    });
    console.log('Worker done');
  } catch (error) {
    postMessage({ error });
  }
};

abstract class PYTHON_CODE_REPO {
  static readonly EXEC_DICE_CODE = `
from dice_calc.parser import compile_anydice
from dice_calc.parser.parse_and_exec import unsafe_exec
def compile(code):
  compiler_flags = {'COMPILER_FLAG_NON_LOCAL_SCOPE': True, 'COMPILER_FLAG_OPERATOR_ON_INT': True}
  return compile_anydice(code, compiler_flags)
def pipeline(code):
  outputs = []
  parsed = compile(code)
  print('inside unsafe exec')
  unsafe_exec(parsed, global_vars={'output': lambda x, named=None: outputs.append((x, named))})
  print('done unsafe exec')
  return {'rvs': outputs, 'parsed': code}

pipeline(code)
`
}