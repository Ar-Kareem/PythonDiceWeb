enum ElemTypes {
  Box = 'Box',
  Checkbox = 'Checkbox',
  Input = 'Input',
  Output = 'Output',
  Radio = 'Radio',
  Dropdown = 'Dropdown',
}
interface BaseElement {
  readonly label: string;
  readonly varname: string;
}
interface DefaultVal {
  readonly defaultVal: any;
}
function hasDefaultVal(element: unknown): element is DefaultVal {
  return (element as DefaultVal).defaultVal !== undefined;
}
class BoxElement {
  readonly type = ElemTypes.Box;
  constructor(readonly direction: 'row' | 'column', readonly children: GUIElement[]) {}
}

class CheckboxElement implements BaseElement, DefaultVal {
  readonly type = ElemTypes.Checkbox;
  constructor(readonly label: string, readonly varname: string, readonly defaultVal: boolean) {}
}

class InputElement implements BaseElement, DefaultVal {
  readonly type = ElemTypes.Input;
  constructor(readonly label: string, readonly varname: string, readonly defaultVal: number) {}
}

class OutputElement implements BaseElement {
  readonly type = ElemTypes.Output;
  constructor(readonly label: string, readonly varname: string) {}
}

class RadioElement implements BaseElement, DefaultVal {
  readonly type = ElemTypes.Radio;
  constructor(readonly label: string, readonly varname: string, readonly defaultVal: string, readonly options: RadioOption[]) {}
}
class RadioOption {
  constructor(readonly label: string, readonly value: string) {}
}

class DropdownElement implements BaseElement, DefaultVal {
  readonly type = ElemTypes.Dropdown;
  constructor(readonly label: string, readonly varname: string, readonly defaultVal: string, readonly options: DropdownOption[]) {}
}
class DropdownOption {
  constructor(readonly label: string, readonly value: string) {}
}


class ParseError extends Error  {
  constructor(message: string, public node: XmlElement, public lineNo: number) {
    super(message);
  }
}

function getVarNamesAndDefaults(params: GUIElement) {
  // Recursively go through the GUIElement and return a map of varnames and their default values
  const varNamesAndDefaults = new Map<string, any>();
  getVarNames_helper(params, varNamesAndDefaults);
  return varNamesAndDefaults;
}
function getVarNames_helper(params: GUIElement, varNamesAndDefaults: Map<string, any>) {
  if (hasDefaultVal(params)) {
    varNamesAndDefaults.set(params.varname, params.defaultVal);
  } else if (params.type === ElemTypes.Box) {
    params.children.forEach(child => getVarNames_helper(child, varNamesAndDefaults));
  }
  return varNamesAndDefaults;
}

export type GUIElement = BoxElement | CheckboxElement | InputElement | OutputElement | RadioElement | DropdownElement;
export { ElemTypes, ParseError, getVarNamesAndDefaults };
export { BoxElement, CheckboxElement, InputElement, OutputElement, RadioElement, DropdownOption, DropdownElement }
