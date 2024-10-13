
interface BaseElement {
  type: string;
  label: string;
  varname: string;
}

class BoxElement {
  type = 'Box';
  constructor(public direction: 'row' | 'column', public children: GUIElement[]) {}
}

class CheckboxElement implements BaseElement {
  type = 'Checkbox';
  constructor(public label: string, public varname: string, public defaultVal: boolean) {}
}

class InputElement implements BaseElement {
  type = 'Input';
  constructor(public label: string, public varname: string, public defaultVal: number) {}
}

class OutputElement implements BaseElement {
  type = 'Output';
  constructor(public label: string, public varname: string) {}
}

class RadioElement implements BaseElement {
  type = 'Radio';
  constructor(public label: string, public varname: string, public defaultVal: string, public options: RadioOption[]) {}
}
class RadioOption {
  constructor(public label: string, public value: string) {}
}

class DropdownElement implements BaseElement {
  type = 'Dropdown';
  constructor(public label: string, public varname: string, public defaultVal: string, public options: DropdownOption[]) {}
}
class DropdownOption {
  constructor(public label: string, public value: string) {}
}


export type GUIElement = BoxElement | CheckboxElement | InputElement | OutputElement | RadioElement | DropdownElement;


export class ParseError extends Error  {
  constructor(message: string, public node: XmlElement, public lineNo: number) {
    super(message);
  }
}

class INTERNAL_ParseError extends Error  {
  constructor(message: string, public node: XmlElement) {
    super(message);
  }
}

export class GUIElementRenderer {
  xmlDoc: XmlElement;
  constructor(private rootxml: string) {
    this.xmlDoc = new xmldoc.XmlDocument(rootxml);
  }
  render(): GUIElement {
    try{
      return xmldocToGUIElement(this.xmlDoc);
    }
    catch (error) {
      if (error instanceof INTERNAL_ParseError) {
        console.log('ParseError:');
        console.log(error.node);
        console.log(error.message);
        const problemLineNo = error.node.line;
        // need to startTagPosition (count from begining of rootxml) to get the correct column
        const startTagPosition = error.node.startTagPosition;
        const lenIgnore = this.rootxml.split('\n').slice(0, problemLineNo).join('\n').length;
        const problemCol = startTagPosition - lenIgnore;
        const problemLine = this.rootxml.split('\n')[problemLineNo].substring(0, problemCol+20);
        error.message = `GUI Rendering Error:\n${error.message}\nLine ${problemLineNo+1}, Column ${problemCol+1}\n${problemLine}\n${'-'.repeat(problemCol)}^`;
        throw new ParseError(error.message, error.node, problemLineNo);
      }
      throw error;
    }
  }
}


function xmldocToGUIElement(node: XmlElement): GUIElement{
  switch (node.name.toLowerCase()) {
    case 'box': {
      const direction = getAttribute(node, 'direction') || 'row';
      assertAttrValues(node, 'direction', direction, ['row', 'column']);
      const children: GUIElement[] = Array.from(node.children)
        .filter(child => child.type === 'element')
        .map(child => xmldocToGUIElement(child));
      return new BoxElement(direction as ('row' | 'column'), children);
    }
    case 'checkbox': {
      const label = getAttribute(node, 'label');
      const varname = getAttribute(node, 'var');
      const valStr = getAttribute(node, 'default') || 'false';
      assertAttrValues(node, 'default', valStr, ['true', 'false', '1', '0', 'on', 'off']);
      const defaultVal = (valStr === 'true') || (valStr === '1') || (valStr === 'on');
      return new CheckboxElement(label, varname, defaultVal);
    }
    case 'input': {
      const label = getAttribute(node, 'label');
      const varname = getAttribute(node, 'var');
      const valStr = getAttribute(node, 'default') || '0';
      assertAttrValuesFn(node, 'default', valStr, value => !isNaN(Number(value)));
      const defaultVal = Number(valStr);
      return new InputElement(label, varname, defaultVal);
    }
    case 'output': {
      const label = getAttribute(node, 'label');
      const varname = getAttribute(node, 'var');
      return new OutputElement(label, varname);
    }
    case 'radio': {
      const label = getAttribute(node, 'label');
      const varname = getAttribute(node, 'var');
      const options = Array.from(node.children)
        .filter(child => child.type === 'element')
        .map(option => {
          assertName(option, 'option');
          return new DropdownOption(getAttribute(option, 'label'), getAttribute(option, 'value'));
      });
      const defaultVal = getAttribute(node, 'default');
      // assert that default value is one of the options
      assertAttrValues(node, 'default', defaultVal, options.map(option => option.value));
      return new RadioElement(label, varname, defaultVal, options);
    }
    case 'dropdown': {
      const label = getAttribute(node, 'label');
      const varname = getAttribute(node, 'var');
      const options = Array.from(node.children)
        .filter(child => child.type === 'element')
        .map(option => {
          assertName(option, 'option');
          return new DropdownOption(getAttribute(option, 'label'), getAttribute(option, 'value'));
      });
      const defaultVal = getAttribute(node, 'default');
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
    throw new INTERNAL_ParseError(`<${node.name}> invalid. Must be ${names.join(', ')}`, node);
  }
}
function getAttribute(node: XmlElement, attribute: string): string {
  if (node.attr[attribute] === undefined) {
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
