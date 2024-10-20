importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");var m="https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",_="https://files.pythonhosted.org/packages/76/7d/10720c87f834c6c8e4eec7bd4590b8de6da24678e140553e9733c6db5860/dice_calc-0.2.12-py3-none-any.whl",c,o=null,d=null,f=new Promise(e=>{d=e});async function l(){if(o)throw new Error("Should not happen");if(typeof c>"u")return console.log("loadPyodide retrying..."),await new Promise(n=>setTimeout(n,250)),await l();if(o=await c({indexURL:m}),await o.loadPackage("micropip"),await o.pyimport("micropip").install(_),console.log("Pyodide loaded"),!d)throw new Error("Should not happen");d()}onmessage=async({data:e})=>{if(e==="init"){await l();return}await f,console.log("ready to execute code!!!");let{code:n}=e;try{let t=o.toPy({code:n}),r=o.runPython(i.EXEC_DICE_CODE,{globals:t}).toJs(),s=r.get("rvs");s.forEach((a,p)=>{let u=a[0].get_vals_probs().toJs(),y=a.length>1?a[1]:void 0;s[p]=[u,y]}),postMessage({rvs:s,parsed:r.get("parsed"),time:1.1234,result:"Not yet implemented"}),console.log("Worker done")}catch(t){postMessage({error:t})}};var i=class{static{this.EXEC_DICE_CODE=`
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
