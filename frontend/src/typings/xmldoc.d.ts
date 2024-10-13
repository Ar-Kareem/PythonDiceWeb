declare global {
  class XmlElement {
    name: string;
    type: 'element';

    column: number;
    line: number;
    startTagPosition: number;

    attr: { [key: string]: string };
    children: (XmlElement|XmlTextNode)[];
  }

  class XmlDocument extends XmlElement {
    constructor(xml: string);
  }

  class XmlTextNode {
    text: string;
    type: 'text';
  }

  const xmldoc: {
    XmlDocument: typeof XmlDocument;
    XmlElement: typeof XmlElement;
    XmlTextNode: typeof XmlTextNode;
    XmlCDataNode: typeof XmlCDataNode;
    XmlCommentNode: typeof XmlCommentNode;
  };
}
export { };