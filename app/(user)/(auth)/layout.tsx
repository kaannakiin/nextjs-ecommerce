const UserLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <header className="h-20 border-b-gray-500 border-b"></header>
      <main className="flex-1">{children}</main>
      <footer className="h-40 border-t-red-500 border-t"></footer>
    </>
  );
};

export default UserLayout;
