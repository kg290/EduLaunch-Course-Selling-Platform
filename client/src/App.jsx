import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailsPage from "./pages/CourseDetailsPage";
import EducatorDashboardPage from "./pages/EducatorDashboardPage";
import MyLearningPage from "./pages/MyLearningPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import WishlistPage from "./pages/WishlistPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import CertificatePage from "./pages/CertificatePage";

const App = () => {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailsPage />} />

          <Route element={<ProtectedRoute allowedRoles={["educator"]} />}>
            <Route path="/educator" element={<EducatorDashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route path="/my-learning" element={<MyLearningPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/profile" element={<StudentProfilePage />} />
            <Route path="/certificates/:courseId" element={<CertificatePage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
