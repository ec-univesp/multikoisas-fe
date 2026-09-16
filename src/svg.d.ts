// svg.d.ts
declare module "*.svg" {
  import * as React from "react";
  type SvgComponent = React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  export const ReactComponent: SvgComponent;
  const SvgIcon: SvgComponent;
  export default SvgIcon;
}
