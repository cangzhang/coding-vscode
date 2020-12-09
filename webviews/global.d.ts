declare const acquireVsCodeApi: any;
declare module 'styled-components';

declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
}
