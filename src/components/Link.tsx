import type { AnchorHTMLAttributes } from "react";

/**
 * Plain link that always does a normal page load.
 * The site is fully static, so pages load fast, and a normal load can never
 * get stuck on files left over from an older version of the site.
 */
export default function Link({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
