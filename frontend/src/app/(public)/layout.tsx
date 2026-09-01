import Footer from "@/src/layouts/public/footer/Footer";
import Header from "@/src/layouts/public/header/Header";

type Props = {
  children: React.ReactNode;
};

export default function PublicLayout({ children }: Props) {
  return (
    <>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <Footer />
    </>
  );
}