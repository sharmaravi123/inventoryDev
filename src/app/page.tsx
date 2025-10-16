// src/app/page.tsx (Server Component)
import LoginPage from "./components/login/Login"; // Login is a client component

export const metadata = {
  title: "Login | Aakash Inventory",
  description:
    "Login to Aakash Inventory to manage your stock, billing, and operations efficiently.",
};

export default function Page() {
  return <LoginPage />; // fine: server component rendering client component
}
