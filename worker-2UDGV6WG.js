importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");var m="https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",_="https://files.pythonhosted.org/packages/b2/76/62b455504dacf48146450d62324c5354d482cb7930bcd34c0d727877287f/dice_calc-0.3.0-py3-none-any.whl",o=null,d=null,f=new Promise(e=>{d=e});async function p(){if(o)throw new Error("Should not happen");if(typeof loadPyodide>"u")return console.log("loadPyodide retrying..."),await new Promise(t=>setTimeout(t,250)),await p();if(o=await loadPyodide({indexURL:m}),await o.loadPackage("micropip"),await o.pyimport("micropip").install(_),console.log("Pyodide loaded"),!d)throw new Error("Should not happen");d()}onmessage=async({data:e})=>{if(e==="init"){await p();return}await f,console.log("ready to execute code!!!");let{code:t}=e;try{let n=o.toPy({code:t});try{let s=o.runPython(c.EXEC_DICE_CODE,{globals:n}).toJs(),a=s.get("rvs");a.forEach((i,l)=>{let u=i[0].get_vals_probs().toJs(),y=i.length>1?i[1]:void 0;a[l]=[u,y]}),postMessage({rvs:a,parsed:s.get("parsed"),time:1.1234,result:s.get("output")}),console.log("Worker done")}catch(r){console.error("Error in running python code",r),postMessage({error:r});return}}catch(n){postMessage({error:n})}};var c=class{static{this.EXEC_DICE_CODE=`
def main():
  from dice_calc import output
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
    out_str = ''.join([output(r, named=n, print_=False, blocks_width=100) for r, n in outputs])
    print('done unsafe exec')
    return {'rvs': outputs, 'parsed': code, 'output': out_str}
  try:
    return pipeline(code)
  except Exception as e:
    print(e)
main()
`}};
