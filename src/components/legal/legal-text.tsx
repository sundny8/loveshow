import type { ReactNode } from 'react';

const EMAIL_PATTERN = /([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})/gi;

type LegalTextProps = {
  children: string;
};

/**
 * Render legal copy while keeping email addresses visible to compliance
 * crawlers. Cloudflare Email Address Obfuscation rewrites a contiguous email
 * text node to a generic protected-email label, which can be mistaken for a
 * template placeholder. Splitting the address across inline elements
 * preserves the rendered address without exposing a contiguous address in
 * the HTML text.
 */
export function LegalText({ children }: LegalTextProps) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of children.matchAll(EMAIL_PATTERN)) {
    const index = match.index;
    const [email, localPart, domain] = match;

    if (index > lastIndex) {
      nodes.push(children.slice(lastIndex, index));
    }

    nodes.push(
      <span key={`${email}-${index}`} data-contact-address="email">
        <span>{localPart}</span>
        <span>@</span>
        <span>{domain}</span>
      </span>
    );

    lastIndex = index + email.length;
  }

  if (lastIndex === 0) {
    return children;
  }

  if (lastIndex < children.length) {
    nodes.push(children.slice(lastIndex));
  }

  return <>{nodes}</>;
}
