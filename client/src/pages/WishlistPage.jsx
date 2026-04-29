import { useEffect, useState } from "react";

import api from "../api/client";
import CourseCard from "../components/CourseCard";

const WishlistPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyCourseId, setBusyCourseId] = useState("");

  const loadWishlist = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/courses/wishlist/mine");
      setCourses(response.data.courses || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const removeFromWishlist = async (course) => {
    setBusyCourseId(course._id);
    setError("");
    try {
      await api.delete(`/courses/${course._id}/wishlist`);
      setCourses((prev) => prev.filter((item) => item._id !== course._id));
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to update wishlist");
    } finally {
      setBusyCourseId("");
    }
  };

  return (
    <section>
      <div style={{ marginBottom: "1.2rem" }}>
        <h2>My Wishlist</h2>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Save interesting courses here and come back when you're ready to enroll.
        </p>
      </div>

      {error && <p className="error">{error}</p>}

      {loading && (
        <div className="list-view">
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton" style={{ height: 202 }} />
          ))}
        </div>
      )}

      {!loading && courses.length === 0 && (
        <div className="panel empty-state">
          <div className="empty-icon">💛</div>
          <p>Your wishlist is empty right now.</p>
        </div>
      )}

      <div className="list-view">
        {courses.map((course) => (
          <CourseCard
            key={course._id}
            course={course}
            layout="horizontal"
            onToggleWishlist={removeFromWishlist}
            wishlistLoading={busyCourseId === course._id}
          />
        ))}
      </div>
    </section>
  );
};

export default WishlistPage;
