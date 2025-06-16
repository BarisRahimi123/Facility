export default function SimpleTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="bg-white p-4 shadow rounded-lg mb-6">
        <h1 className="text-xl font-bold">Simple Test Layout</h1>
        <p className="text-gray-500">This layout is used for testing basic page rendering</p>
      </header>
      <main className="bg-white p-6 shadow rounded-lg">
        {children}
      </main>
    </div>
  );
} 