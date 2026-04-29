import Navigation from "@/components/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <main className="max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </>
  );
}
