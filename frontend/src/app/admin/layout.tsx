import Header from "@/src/layouts/public/header/Header";
import Footer from "@/src/layouts/public/footer/Footer";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </>
  );
}
