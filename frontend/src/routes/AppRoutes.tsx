import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { PublicLayout } from "../components/layout/PublicLayout";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { ClientDashboardPage } from "../pages/ClientDashboardPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { PaymentPage } from "../pages/PaymentPage";
import { PlansPage } from "../pages/PlansPage";
import { ProfessionalDashboardPage } from "../pages/ProfessionalDashboardPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { RewardsPage } from "../pages/RewardsPage";
import { StorePage } from "../pages/StorePage";
import { TermsPage } from "../pages/TermsPage";
import { PublicOnlyRoute } from "./PublicOnlyRoute";
import { RequireAuth } from "./RequireAuth";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/termos" element={<TermsPage />} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth allowedRoles={["CLIENT"]} />}>
        <Route element={<AppLayout />}>
          <Route element={<RequireAuth allowedRoles={["CLIENT"]} />}>
            <Route path="/cliente" element={<ClientDashboardPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/pagamento/:appointmentId" element={<PaymentPage />} />
            <Route path="/planos" element={<PlansPage />} />
            <Route path="/loja" element={<StorePage />} />
            <Route path="/premios" element={<RewardsPage />} />
          </Route>
        </Route>
      </Route>

      <Route element={<RequireAuth allowedRoles={["PROFESSIONAL"]} />}>
        <Route path="/colaborador" element={<ProfessionalDashboardPage />} />
      </Route>

      <Route element={<RequireAuth allowedRoles={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/:section" element={<AdminDashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
