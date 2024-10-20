importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");var y="https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",m="https://files.pythonhosted.org/packages/76/7d/10720c87f834c6c8e4eec7bd4590b8de6da24678e140553e9733c6db5860/dice_calc-0.2.12-py3-none-any.whl",o=null,s=null,_=new Promise(e=>{s=e});async function c(){if(o)throw new Error("Should not happen");if(typeof loadPyodide>"u")return console.log("loadPyodide retrying..."),await new Promise(n=>setTimeout(n,250)),await c();if(o=await loadPyodide({indexURL:y}),await o.loadPackage("micropip"),await o.pyimport("micropip").install(m),console.log("Pyodide loaded"),!s)throw new Error("Should not happen");s()}onmessage=async({data:e})=>{if(e==="init"){await c();return}await _,console.log("ready to execute code!!!");let{code:n}=e;try{let d=o.toPy({code:n}),r=o.runPython(i.EXEC_DICE_CODE,{globals:d}).toJs(),t=r.get("rvs");t.forEach((a,l)=>{let p=a[0].get_vals_probs().toJs(),u=a.length>1?a[1]:void 0;t[l]=[p,u]}),postMessage({rvs:t,parsed:r.get("parsed"),time:1.1234,result:"Not yet implemented"}),console.log("Worker done")}catch(d){postMessage({error:d})}};var i=class{static{this.EXEC_DICE_CODE=`
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
`}};
