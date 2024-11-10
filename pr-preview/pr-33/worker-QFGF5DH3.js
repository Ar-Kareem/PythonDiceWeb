importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");var g="https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",b="https://files.pythonhosted.org/packages/4c/14/10a748dbb68d9174ccf653746bd1716a5a2bc2b3bd8ff2c6fa5c31b78cd5/dice_calc-0.3.4-py3-none-any.whl",s=null,p,A=new Promise(t=>{p=t});async function u(){if(s)throw new Error("Should not happen");if(typeof loadPyodide>"u")return console.log("loadPyodide retrying..."),await new Promise(r=>setTimeout(r,100)),await u();s=await loadPyodide({indexURL:g}),await s.loadPackage("micropip"),await s.pyimport("micropip").install(b)}onmessage=async({data:t})=>{let r=t.key,o=t.api,n=t.api_data;try{if(o==="INIT"){await u(),postMessage({key:r,result:"init_done"}),p();return}await A;let e,a=performance.now();switch(o){case"EXEC_DICE_CODE":e=v(n);break;case"EXEC_PYTHON_CODE":e=_(n);break;case"TRANSLATE_DICE_CODE":e=f(n);break;default:throw new Error("Invalid API")}e.time=performance.now()-a,e.key=r,postMessage(e)}catch(e){console.error("Error in web worker",e),postMessage({key:r,error:e})}};function f(t,r=!0){let o=s.toPy({code:t}),n=c.TRANSLATE_NO_FLAGS,e=s.runPython(n,{globals:o});if(typeof e.get("error")<"u")throw new Error(e.get("error"));return{result:e.toJs().get("result")}}function _(t){let r=s.toPy({code:t}),o=s.runPython(c.EXEC_PYTHON_CODE,{globals:r});if(typeof o.get("error")<"u")throw new Error(o.get("error"));let n=o.toJs(),e=n.get("rvs");return e.forEach((a,y)=>{let d=a[0].get_vals_probs().toJs();d.forEach(([i,l],E)=>{console.assert(typeof l=="number",`Invalid prob type: ${typeof l}`),console.assert(typeof i=="number"||typeof i=="object",`Invalid val type: ${typeof i}`),typeof i=="object"&&(d[E][0]=i.toString())});let m=a.length>1?a[1]:void 0;e[y]=[d,m]}),{rvs:e,result:n.get("output")}}function v(t){let r=f(t).result;return{..._(r),parsed:r}}var c=class t{static{this.SHARED_CODE=`
def coerce_to_rv(rv):
  from dice_calc import RV
  from typing import Iterable
  if isinstance(rv, RV):
    return rv
  if rv is None or isinstance(rv, int) or isinstance(rv, bool):
    return RV.from_seq([rv])
  if isinstance(rv, Iterable):
    return RV.from_seq(rv)
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

`}static{this.EXEC_PYTHON_CODE=t.SHARED_CODE+"main(lambda: run_python(code))"}static{this.TRANSLATE_YES_FLAGS=t.SHARED_CODE+"main(lambda: compile(code, flags=True))"}static{this.TRANSLATE_NO_FLAGS=t.SHARED_CODE+"main(lambda: compile(code, flags=False))"}};
