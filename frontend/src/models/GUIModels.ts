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

class INTERNAL_ParseError extends Error  {
  constructor(message: string, public node: XmlElement) {
    super(message);
  }
}


function getVarNamesAndDefaults(params: GUIElement) {
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


function xmldocToGUIElement(rootxml: string): GUIElement {
  const xmlDoc = new xmldoc.XmlDocument(rootxml);
  try {
    return xmldocToGUIElement_helper(xmlDoc);
  }
  catch (error) {
    if (error instanceof INTERNAL_ParseError) {
      console.log('ParseError:');
      console.log(error.node);
      console.log(error.message);
      const problemLineNo = error.node.line;
      // to calc column need startTagPosition (count from begining of rootxml)
      const lenIgnore = rootxml.split('\n').slice(0, problemLineNo).join('\n').length;
      const problemCol = error.node.startTagPosition - lenIgnore;
      const problemLine = rootxml.split('\n')[problemLineNo].substring(0, problemCol+20);
      error.message = `GUI Rendering Error:\n${error.message}\nLine ${problemLineNo+1}, Column ${problemCol+1}\n${problemLine}\n${'-'.repeat(problemCol)}^`;
      throw new ParseError(error.message, error.node, problemLineNo);
    }
    throw error;
  }
}


function xmldocToGUIElement_helper(node: XmlElement): GUIElement{
  switch (node.name.toLowerCase()) {
    case 'root':  // root same as box
    case ElemTypes.Box.toLowerCase(): {
      let direction = getAttribute(node, 'direction', 'column');
      if (direction === 'col' || direction === 'c') direction = 'column';
      if (direction === 'r') direction = 'row';
      assertAttrValues(node, 'direction', direction, ['row', 'column']);
      const children: GUIElement[] = Array.from(node.children)
        .filter(child => child.type === 'element')
        .map(child => xmldocToGUIElement_helper(child));
      return new BoxElement(direction as ('row' | 'column'), children);
    }
    case ElemTypes.Checkbox.toLowerCase(): {
      const label = getAttribute(node, 'label');
      const varname = getAttribute(node, 'var');
      const valStr = getAttribute(node, 'default', 'false');
      assertAttrValues(node, 'default', valStr, ['true', 'false', '1', '0', 'on', 'off']);
      const defaultVal = (valStr === 'true') || (valStr === '1') || (valStr === 'on');
      return new CheckboxElement(label, varname, defaultVal);
    }
    case ElemTypes.Input.toLowerCase(): {
      const label = getAttribute(node, 'label');
      const varname = getAttribute(node, 'var');
      const valStr = getAttribute(node, 'default', '0');
      assertAttrValuesFn(node, 'default', valStr, value => !isNaN(Number(value)));
      const defaultVal = Number(valStr);
      return new InputElement(label, varname, defaultVal);
    }
    case ElemTypes.Output.toLowerCase(): {
      const label = getAttribute(node, 'label');
      const varname = getAttribute(node, 'var');
      return new OutputElement(label, varname);
    }
    case ElemTypes.Radio.toLowerCase(): {
      const label = getAttribute(node, 'label');
      const varname = getAttribute(node, 'var');
      const options = Array.from(node.children)
        .filter(child => child.type === 'element')
        .map(option => {
          assertName(option, 'option');
          return new DropdownOption(getAttribute(option, 'label'), getAttribute(option, 'value'));
      });
      if (options.length === 0) {
        throw new INTERNAL_ParseError(`<Radio> must have at least 1 <option>`, node);
      }
      const defaultVal = getAttribute(node, 'default', options[0].value);
      // assert that default value is one of the options
      assertAttrValues(node, 'default', defaultVal, options.map(option => option.value));
      return new RadioElement(label, varname, defaultVal, options);
    }
    case ElemTypes.Dropdown.toLowerCase(): {
      const label = getAttribute(node, 'label');
      const varname = getAttribute(node, 'var');
      const options = Array.from(node.children)
        .filter(child => child.type === 'element')
        .map(option => {
          assertName(option, 'option');
          return new DropdownOption(getAttribute(option, 'label'), getAttribute(option, 'value'));
      });
      if (options.length === 0) {
        throw new INTERNAL_ParseError(`<Dropdown> must have at least 1 <option>`, node);
      }
      const defaultVal = getAttribute(node, 'default', options[0].value);
      // assert that default value is one of the options
      assertAttrValues(node, 'default', defaultVal, options.map(option => option.value));
      return new DropdownElement(label, varname, defaultVal, options);
    }
    default:
      throw new INTERNAL_ParseError(`Unknown <${node.name}>`, node);
  }
}

function assertName(node: XmlElement, ...names: string[]) {
  if (!names.includes(node.name)) {
    throw new INTERNAL_ParseError(`<${node.name}> invalid. Must be <${names.join(', ')}>`, node);
  }
}
function getAttribute(node: XmlElement, attribute: string, defaultVal?: string): string {
  if (node.attr[attribute] === undefined) {
    if (defaultVal !== undefined) {
      return defaultVal;
    }
    throw new INTERNAL_ParseError(`<${node.name}> missing ${attribute}.`, node);
  }
  return node.attr[attribute];
}
function assertAttrValues(node: XmlElement, attribute: string, value: string, values: string[]) {
  if (!values.includes(value)) {
    throw new INTERNAL_ParseError(`Invalid value of '${attribute}' in <${node.name}>. Must be one of ${values.join(', ')}`, node);
  }
}
function assertAttrValuesFn(node: XmlElement, attribute: string, value: string, valfn: (value: string) => boolean) {
  if (!valfn(value)) {
    throw new INTERNAL_ParseError(`Invalid value of '${attribute}' in <${node.name}>.`, node);
  }
}

export type GUIElement = BoxElement | CheckboxElement | InputElement | OutputElement | RadioElement | DropdownElement;
export { xmldocToGUIElement, ElemTypes, ParseError, getVarNamesAndDefaults };
