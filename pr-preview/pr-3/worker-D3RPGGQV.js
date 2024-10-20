importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");var E="https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",m="https://files.pythonhosted.org/packages/b2/76/62b455504dacf48146450d62324c5354d482cb7930bcd34c0d727877287f/dice_calc-0.3.0-py3-none-any.whl",n=null,c=null,y=new Promise(t=>{c=t});async function d(){if(n)throw new Error("Should not happen");if(typeof loadPyodide>"u")return console.log("loadPyodide retrying..."),await new Promise(e=>setTimeout(e,250)),await d();if(n=await loadPyodide({indexURL:E}),await n.loadPackage("micropip"),await n.pyimport("micropip").install(m),console.log("Pyodide loaded"),!c)throw new Error("Should not happen");c()}onmessage=async({data:t})=>{try{if(t==="init"){await d();return}await y,console.log("ready to execute code!!!");let e,a=performance.now(),{code:o,api:r}=t;switch(r){case"EXEC_DICE_CODE":e=g(o);break;case"EXEC_PYTHON_CODE":e=p(o);break;case"TRANSLATE_DICE_CODE":e=l(o);break;default:throw new Error("Invalid API")}e.time=performance.now()-a,postMessage(e)}catch(e){console.error("Error in web worker",e),postMessage({error:e})}};function l(t,e=!0){let a=n.toPy({code:t}),o=s.TRANSLATE_NO_FLAGS,r=n.runPython(o,{globals:a});return r.get("error")?{error:r.get("error")}:{result:r.toJs().get("result")}}function p(t){let e=n.toPy({code:t}),a=n.runPython(s.EXEC_PYTHON_CODE,{globals:e});if(a.get("error"))return{error:a.get("error")};let o=a.toJs(),r=o.get("rvs");return r.forEach((i,u)=>{let _=i[0].get_vals_probs().toJs(),f=i.length>1?i[1]:void 0;r[u]=[_,f]}),{rvs:r,result:o.get("output")}}function g(t){let e=l(t).result;return{...p(e),parsed:e}}var s=class t{static{this.SHARED_CODE=`
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

`}static{this.EXEC_PYTHON_CODE=t.SHARED_CODE+"main(lambda: run_python(code))"}static{this.TRANSLATE_YES_FLAGS=t.SHARED_CODE+"main(lambda: compile(code, flags=True))"}static{this.TRANSLATE_NO_FLAGS=t.SHARED_CODE+"main(lambda: compile(code, flags=False))"}};
