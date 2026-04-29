import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import api from "../api/client";

const MyLearningPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEnrollments = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/enrollments/mine");
        setEnrollments(response.data.enrollments || []);
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Failed to load enrollments");
      } finally {
        setLoading(false);
      }
    };

    loadEnrollments();
  }, []);

  if (loading) {
    return (
      <div>
        <h2 style={{ marginBottom: "1rem" }}>My Learning</h2>
        <div className="card-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section>
      <div style={{ marginBottom: "1.2rem" }}>
        <h2>My Learning</h2>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Track enrolled courses and continue your journey.
        </p>
      </div>

      {error && <p className="error">{error}</p>}

      {!error && enrollments.length === 0 && (
        <div className="empty-state panel">
          <div className="empty-icon">🎓</div>
          <p>You haven't enrolled in any courses yet.</p>
          <Link to="/courses" className="btn btn-primary">
            Browse Courses
          </Link>
        </div>
      )}

      <div className="card-grid">
        {enrollments.map((enrollment) => {
          const percent = enrollment.progress?.completedPercent || 0;
          const isCompleted = enrollment.status === "completed";
          const bookmarkCount = enrollment.progress?.bookmarkedChapterIndexes?.length || 0;
          const nextChapterIndex = Number(enrollment.progress?.lastChapterIndex || 0) + 1;

          return (
            <article key={enrollment._id} className="card">
              <div className="card-content">
                <div className="row-between" style={{ marginBottom: "0.3rem" }}>
                  <span className="label">{enrollment.course.category}</span>
                  {isCompleted && (
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "var(--success)",
                      background: "var(--success-bg)",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "var(--radius-full)"
                    }}>
                      ✅ Completed
                    </span>
                  )}
                </div>
                <h3>{enrollment.course.title}</h3>
                <p className="muted" style={{ fontSize: "0.85rem" }}>
                  By {enrollment.educator?.name}
                </p>
                <p className="muted" style={{ fontSize: "0.82rem" }}>
                  Last lesson: Chapter {Math.min(nextChapterIndex, enrollment.course.chapters?.length || nextChapterIndex)}
                  {bookmarkCount > 0 ? ` • ${bookmarkCount} bookmark${bookmarkCount === 1 ? "" : "s"}` : ""}
                </p>

                <div style={{ marginTop: "0.8rem" }}>
                  <div className="row-between" style={{ marginBottom: "0.3rem" }}>
                    <span className="muted" style={{ fontSize: "0.82rem" }}>Progress</span>
                    <span style={{ fontWeight: 700, color: "var(--accent-dark)", fontSize: "0.9rem" }}>
                      {percent}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <div className="card-footer">
                  <div className="row-gap">
                    <Link className="btn btn-primary btn-sm" to={`/courses/${enrollment.course._id}`}>
                      {isCompleted ? "Review Course" : "Continue Learning →"}
                    </Link>
                    {isCompleted && (
                      <Link className="btn btn-ghost btn-sm" to={`/certificates/${enrollment.course._id}`}>
                        {enrollment.certificate?.certificateId ? "View Certificate" : "Get Certificate"}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default MyLearningPage;
