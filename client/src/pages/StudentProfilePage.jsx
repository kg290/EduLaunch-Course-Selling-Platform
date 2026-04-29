import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client";

const StudentProfilePage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/analytics/student/dashboard");
        setDashboard(response.data);
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = [
    { label: "Enrolled Courses", value: dashboard?.metrics?.enrolledCourses || 0, icon: "📚" },
    { label: "Completed Courses", value: dashboard?.metrics?.completedCourses || 0, icon: "✅" },
    { label: "Certificates", value: dashboard?.metrics?.certificatesEarned || 0, icon: "🏅" },
    { label: "Learning Progress", value: `${dashboard?.metrics?.totalLearningProgress || 0}%`, icon: "📈" }
  ];

  return (
    <section className="educator-layout">
      <div className="panel">
        <h2>Student Profile Dashboard</h2>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Track your progress, saved courses, and certificates from one place.
        </p>

        {loading ? (
          <div className="stats-grid">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="skeleton" style={{ height: 100 }} />
            ))}
          </div>
        ) : (
          <div className="stats-grid">
            {stats.map((stat) => (
              <article key={stat.label} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </article>
            ))}
          </div>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {!loading && dashboard && (
        <>
          <div className="panel">
            <div className="row-between wrap">
              <h3>Continue Learning</h3>
              <Link className="btn btn-ghost btn-sm" to="/my-learning">
                Open My Learning
              </Link>
            </div>
            <div className="dashboard-stack" style={{ marginTop: "1rem" }}>
              {dashboard.continueLearning?.length ? (
                dashboard.continueLearning.map((enrollment) => (
                  <div key={enrollment._id} className="dashboard-row">
                    <div>
                      <h4>{enrollment.course?.title}</h4>
                      <p className="muted" style={{ fontSize: "0.84rem" }}>
                        {enrollment.progress?.completedPercent || 0}% complete
                        {enrollment.progress?.completedPercent > 0
                          ? ` • Chapter ${(enrollment.progress?.lastChapterIndex || 0) + 1}`
                          : " • Not started yet"}
                      </p>
                    </div>
                    <Link className="btn btn-primary btn-sm" to={`/courses/${enrollment.course?._id}`}>
                      Continue
                    </Link>
                  </div>
                ))
              ) : (
                <p className="muted">No active in-progress courses right now.</p>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="row-between wrap">
              <h3>Certificates</h3>
              <Link className="btn btn-ghost btn-sm" to="/wishlist">
                Wishlist ({dashboard.metrics?.wishlistCount || 0})
              </Link>
            </div>
            <div className="dashboard-stack" style={{ marginTop: "1rem" }}>
              {dashboard.certificates?.length ? (
                dashboard.certificates.map((certificate) => (
                  <div key={certificate.certificateId} className="dashboard-row">
                    <div>
                      <h4>{certificate.courseTitle}</h4>
                      <p className="muted" style={{ fontSize: "0.84rem" }}>
                        {certificate.certificateId} • Issued{" "}
                        {new Date(certificate.issuedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      className="btn btn-primary btn-sm"
                      to={`/certificates/${certificate.courseId}`}
                    >
                      View
                    </Link>
                  </div>
                ))
              ) : (
                <p className="muted">Complete a course to unlock certificates here.</p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default StudentProfilePage;
