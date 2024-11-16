interface BlockscoutLinkProps {
  address: string;
  children?: React.ReactNode;
  className?: string;
  type?: string;
}

export function BlockscoutLink({
  address,
  type,
  children,
  className
}: BlockscoutLinkProps) {
  const href = `https://base.blockscout.com/${type || 'address'}/${address}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-blue-600 hover:text-blue-800 hover:underline ${
        className ?? ''
      }`}
    >
      {children ?? address}
    </a>
  );
}
