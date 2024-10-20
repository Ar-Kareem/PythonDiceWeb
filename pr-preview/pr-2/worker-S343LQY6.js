function y(){import("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js")}var _="https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",f="https://files.pythonhosted.org/packages/b2/76/62b455504dacf48146450d62324c5354d482cb7930bcd34c0d727877287f/dice_calc-0.3.0-py3-none-any.whl",c,o=null,a=null,g=new Promise(e=>{a=e});async function l(){if(o)throw new Error("Should not happen");if(typeof c>"u")return console.log("loadPyodide retrying..."),await new Promise(n=>setTimeout(n,250)),await l();if(o=await c({indexURL:_}),await o.loadPackage("micropip"),await o.pyimport("micropip").install(f),console.log("Pyodide loaded"),!a)throw new Error("Should not happen");a()}onmessage=async({data:e})=>{if(e==="init"){await l();return}if(e=="doimport"){console.log("doimport"),y(),console.log("doimport done");return}await g,console.log("ready to execute code!!!");let{code:n}=e;try{let t=o.toPy({code:n}),r=o.runPython(d.EXEC_DICE_CODE,{globals:t}).toJs(),i=r.get("rvs");i.forEach((s,p)=>{let u=s[0].get_vals_probs().toJs(),m=s.length>1?s[1]:void 0;i[p]=[u,m]}),postMessage({rvs:i,parsed:r.get("parsed"),time:1.1234,result:"Not yet implemented"}),console.log("Worker done")}catch(t){postMessage({error:t})}};var d=class{static{this.EXEC_DICE_CODE=`
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
