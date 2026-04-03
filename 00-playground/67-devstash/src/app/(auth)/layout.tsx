import { TopBar } from "@/components/home/top-bar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopBar showNav={false} />
      {children}
    </>
  );
}
