importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");var y="https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",m="https://files.pythonhosted.org/packages/b2/76/62b455504dacf48146450d62324c5354d482cb7930bcd34c0d727877287f/dice_calc-0.3.0-py3-none-any.whl",a=null,c,E=new Promise(r=>{c=r});async function d(){if(a)throw new Error("Should not happen");if(typeof loadPyodide>"u")return console.log("loadPyodide retrying..."),await new Promise(t=>setTimeout(t,100)),await d();a=await loadPyodide({indexURL:y}),await a.loadPackage("micropip"),await a.pyimport("micropip").install(m)}onmessage=async({data:r})=>{let t=r.key,o=r.api,n=r.api_data;try{if(o==="INIT"){await d(),postMessage({key:t,result:"init_done"}),c();return}await E;let e,s=performance.now();switch(o){case"EXEC_DICE_CODE":e=g(n);break;case"EXEC_PYTHON_CODE":e=p(n);break;case"TRANSLATE_DICE_CODE":e=l(n);break;default:throw new Error("Invalid API")}e.time=performance.now()-s,e.key=t,postMessage(e)}catch(e){console.error("Error in web worker",e),postMessage({key:t,error:e})}};function l(r,t=!0){let o=a.toPy({code:r}),n=i.TRANSLATE_NO_FLAGS,e=a.runPython(n,{globals:o});if(typeof e.get("error")<"u")throw new Error(e.get("error"));return{result:e.toJs().get("result")}}function p(r){let t=a.toPy({code:r}),o=a.runPython(i.EXEC_PYTHON_CODE,{globals:t});if(typeof o.get("error")<"u")throw new Error(o.get("error"));let n=o.toJs(),e=n.get("rvs");return e.forEach((s,u)=>{let _=s[0].get_vals_probs().toJs(),f=s.length>1?s[1]:void 0;e[u]=[_,f]}),{rvs:e,result:n.get("output")}}function g(r){let t=l(r).result;return{...p(t),parsed:t}}var i=class r{static{this.SHARED_CODE=`
def coerce_to_rv(rv):
  from dice_calc import RV
  from typing import Iterable
  if isinstance(rv, RV):
    return rv
  if rv is None or isinstance(rv, int) or isinstance(rv, Iterable) or isinstance(rv, bool):
    return RV.from_seq([rv])
  assert False, f'Invalid rv: {type(rv)}'

def compile(code, flags):
  from dice_calc.parser import compile_anydice
  compiler_flags = {'COMPILER_FLAG_NON_LOCAL_SCOPE': True, 'COMPILER_FLAG_OPERATOR_ON_INT': True} if flags else {}
  return {'result': compile_anydice(code, compiler_flags)}
def run_python(parsed):
  from dice_calc import output
  from dice_calc.parser.parse_and_exec import unsafe_exec
  outputs = []
  unsafe_exec(parsed, global_vars={'output': lambda x, named=None: outputs.append((coerce_to_rv(x), named))})
  out_str = '\\n'.join([output(r, named=n, print_=False, blocks_width=80) for r, n in outputs])
  return {'rvs': outputs, 'parsed': parsed, 'output': out_str}

def main(f):
  try:
    return f()
  except Exception as e:
    return {'error': repr(e)}
# executable here

`}static{this.EXEC_PYTHON_CODE=r.SHARED_CODE+"main(lambda: run_python(code))"}static{this.TRANSLATE_YES_FLAGS=r.SHARED_CODE+"main(lambda: compile(code, flags=True))"}static{this.TRANSLATE_NO_FLAGS=r.SHARED_CODE+"main(lambda: compile(code, flags=False))"}};
