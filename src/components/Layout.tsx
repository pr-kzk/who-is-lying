interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return <div className="min-h-screen flex flex-col">{children}</div>;
}
