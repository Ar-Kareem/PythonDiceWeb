declare global {
  class XmlDocument {
    constructor(xml: string);
    children: XmlElement[];
    childNamed(name: string): XmlElement | null;
    childWithAttribute(name: string, value: string): XmlElement | null;
    descendantsWithPath(path: string): XmlElement[];
    toString(): string;
  }

  class XmlElement {
    name: string;
    attr: { [key: string]: string };
    children: XmlElement[];
    valueWithPath(path: string): string;
    toString(): string;
  }

  class XmlTextNode {
    text: string;
  }

  class XmlCDataNode {
    cdata: string;
  }

  class XmlCommentNode {
    comment: string;
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