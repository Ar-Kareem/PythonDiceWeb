import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, firstValueFrom, from, Observable, of, take } from 'rxjs';



declare let loadPyodide: any;

enum PyodideStatus {
  NOT_LOADED,
  LOADING,
  LOADED
}
type RV = [val: number, prob: number][]

@Injectable({
  providedIn: 'root'
})
export class PyodideService {
  // BASE URLS
  private readonly BASE_PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/';
  private readonly BASE_CALC_DICE_URL = 'https://files.pythonhosted.org/packages/76/7d/10720c87f834c6c8e4eec7bd4590b8de6da24678e140553e9733c6db5860/dice_calc-0.2.12-py3-none-any.whl';

  private pyodide: any = null;
  private loadStatus: BehaviorSubject<PyodideStatus> = new BehaviorSubject<PyodideStatus>(PyodideStatus.NOT_LOADED);

  constructor() {  }

  private loopCount = 0;
  /**
   * Will load pyodide and set the status accordingly to LOADED or NOT_LOADED
   */
  async initLoadPyodide() {
    const intervalId = setInterval(() => {
      this.loadStatus.next(PyodideStatus.LOADING);
      if (typeof loadPyodide === 'undefined') {
        console.log('loadPyodide again');
        this.loopCount++;
        if (this.loopCount > 100) {
          clearInterval(intervalId);
          console.error('pyodide not found');
          this.loadStatus.next(PyodideStatus.NOT_LOADED);
        }
        return;
      }
      console.log('pyodide found');
      clearInterval(intervalId);
      loadPyodide({ indexURL: this.BASE_PYODIDE_URL }).then((pyodide: any) => {
        console.log('pyodide loaded');
        this.pyodide = pyodide;
        this.loadStatus.next(PyodideStatus.LOADED);
      }).catch((err: any) => {
        console.error('Error loading pyodide:', err);
        this.loadStatus.next(PyodideStatus.NOT_LOADED);
      });
    }, 100);
  }
  /**
   * Ensures that pyodide load is either complete or failed and return the status
   * @returns Promise<PyodideStatus.LOADED | PyodideStatus.NOT_LOADED>
   */
  private ensureLoaded(): Promise<PyodideStatus.LOADED | PyodideStatus.NOT_LOADED> {
    if (this.loadStatus.value === PyodideStatus.NOT_LOADED) {  // if not loaded or even trying, make request to load
      this.loadStatus.next(PyodideStatus.LOADING);  // not needed but just to make sure other threads don't try to load again
      this.initLoadPyodide();
    }
    return firstValueFrom(this.loadStatus.pipe(filter(status => status !== PyodideStatus.LOADING)))
  }

  private async _exec_dice_code(code: string) {
    if (await this.ensureLoaded() === PyodideStatus.NOT_LOADED) {
      console.warn('Pyodide not loaded, SKIPING REQUEST');
      throw new Error('Pyodide not loaded');
    }

    await this.pyodide.loadPackage("micropip");
    const micropip = this.pyodide.pyimport("micropip");
    await micropip.install(this.BASE_CALC_DICE_URL);

    const globals = this.pyodide.toPy({ code });
    const pyResult = this.pyodide.runPython(PYTHON_CODE_REPO.EXEC_DICE_CODE, { globals });
    const result: Map<string, any> = pyResult.toJs();
    const rvs: [RV, string|undefined][] = result.get('rvs');
    rvs.forEach((rv_output, i) => {
      const rv: RV = (rv_output[0] as any).get_vals_probs().toJs();
      const named = rv_output.length > 1 ? rv_output[1] : undefined;
      rvs[i] = [rv, named];
    });
    return {
      rvs: rvs,
      parsed: result.get('parsed'),
      time: 1.1234,
      result: 'Not yet implemented'
    }
  }


  exec_dice_code(code: string): Observable<any> {
    return from(this._exec_dice_code(code));
  }

}


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
  unsafe_exec(parsed, global_vars={'output': lambda x, named=None: outputs.append((x, named))})
  return {'rvs': outputs, 'parsed': code}

pipeline(code)
`


}