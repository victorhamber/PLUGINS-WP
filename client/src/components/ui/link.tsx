import * as React from "react";
import { Link as WouterLink } from "wouter";
import type { LinkProps as WouterLinkProps } from "wouter";

export interface LinkProps extends WouterLinkProps {
  children?: React.ReactNode;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ children, ...props }, ref) => {
    return (
      <WouterLink {...props} ref={ref}>
        {children}
      </WouterLink>
    );
  }
);

Link.displayName = "Link";

export { Link };