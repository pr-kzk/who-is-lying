interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return <div className="h-screen flex flex-col">{children}</div>;
}
