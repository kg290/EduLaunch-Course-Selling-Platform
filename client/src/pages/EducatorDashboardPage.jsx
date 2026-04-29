import { useEffect, useState } from "react";

import api from "../api/client";
import ChapterFormList from "../components/ChapterFormList";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  price: "",
  thumbnailUrl: "",
  chapters: [{ title: "", youtubeUrl: "", videoPath: "", originalVideoName: "", summary: "" }]
};

const EducatorDashboardPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploadingChapterIndex, setUploadingChapterIndex] = useState(-1);

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const [coursesRes, analyticsRes] = await Promise.all([
        api.get("/courses/educator/mine"),
        api.get("/analytics/educator/dashboard")
      ]);
      setCourses(coursesRes.data.courses || []);
      setAnalytics(analyticsRes.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateChapter = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chapter, chapterIndex) =>
        chapterIndex === index ? { ...chapter, [key]: value } : chapter
      )
    }));
  };

  const addChapter = () => {
    setForm((prev) => ({
      ...prev,
      chapters: [
        ...prev.chapters,
        { title: "", youtubeUrl: "", videoPath: "", originalVideoName: "", summary: "" }
      ]
    }));
  };

  const removeChapter = (index) => {
    setForm((prev) => ({
      ...prev,
      chapters: prev.chapters.filter((_, chapterIndex) => chapterIndex !== index)
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await api.post("/courses", {
        ...form,
        price: Number(form.price)
      });
      setSuccess("Course published successfully! 🎉");
      setForm(emptyForm);
      setShowForm(false);
      await loadDashboardData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to create course");
    } finally {
      setSubmitting(false);
    }
  };

  const uploadChapterVideo = async (index, file) => {
    if (!file) {
      return;
    }

    setError("");
    setUploadingChapterIndex(index);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/courses/upload-video", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setForm((prev) => ({
        ...prev,
        chapters: prev.chapters.map((chapter, chapterIndex) =>
          chapterIndex === index
            ? {
                ...chapter,
                videoPath: response.data.asset.videoPath,
                originalVideoName: response.data.asset.originalVideoName
              }
            : chapter
        )
      }));
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to upload video");
    } finally {
      setUploadingChapterIndex(-1);
    }
  };

  const stats = [
    { icon: "📚", label: "Total Courses", value: analytics?.metrics?.totalCourses || 0 },
    { icon: "👥", label: "Total Enrollments", value: analytics?.metrics?.totalStudents || 0 },
    { icon: "💰", label: "Revenue", value: `₹${(analytics?.metrics?.totalRevenue || 0).toFixed(0)}` },
    { icon: "📊", label: "Avg Completion", value: `${analytics?.metrics?.avgCompletion || 0}%` }
  ];

  return (
    <section className="educator-layout">
      {/* Header & Stats */}
      <div className="panel">
        <div className="row-between wrap">
          <div>
            <h2>Educator Dashboard</h2>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              Create courses, manage content, and monitor performance.
            </p>
          </div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Create Course"}
          </button>
        </div>

        {loading ? (
          <div className="stats-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 100 }} />
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

      {/* Course Creation Form */}
      {showForm && (
        <div className="panel">
          <h3 style={{ marginBottom: "1rem" }}>📝 Create New Course</h3>
          <form onSubmit={onSubmit} className="stacked-form">
            <div className="grid-2">
              <label>
                Title
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => onField("title", event.target.value)}
                  placeholder="e.g. Introduction to JavaScript"
                  required
                />
              </label>
              <label>
                Category
                <input
                  type="text"
                  value={form.category}
                  onChange={(event) => onField("category", event.target.value)}
                  placeholder="Programming, Design, Marketing..."
                />
              </label>
            </div>

            <label>
              Description
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => onField("description", event.target.value)}
                placeholder="Describe what students will learn..."
                required
              />
            </label>

            <div className="grid-2">
              <label>
                Price (INR)
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) => onField("price", event.target.value)}
                  placeholder="499"
                  required
                />
              </label>
              <label>
                Thumbnail URL (optional)
                <input
                  type="url"
                  value={form.thumbnailUrl}
                  onChange={(event) => onField("thumbnailUrl", event.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </label>
            </div>

            <ChapterFormList
              chapters={form.chapters}
              onChange={updateChapter}
              onAdd={addChapter}
              onRemove={removeChapter}
              onUpload={uploadChapterVideo}
              uploadingChapterIndex={uploadingChapterIndex}
            />

            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}

            <button className="btn btn-primary btn-lg" disabled={submitting} type="submit">
              {submitting ? "Publishing..." : "🚀 Publish Course"}
            </button>
          </form>
        </div>
      )}

      {/* Course Performance Table */}
      {analytics?.courseBreakdown?.length > 0 && (
        <div className="panel">
          <h3 style={{ marginBottom: "0.8rem" }}>📊 Course Performance</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Enrollments</th>
                  <th>Revenue</th>
                  <th>Completion</th>
                </tr>
              </thead>
              <tbody>
                {analytics.courseBreakdown.map((item) => (
                  <tr key={item.courseId}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{item.title}</td>
                    <td>{item.enrollments}</td>
                    <td>₹{item.revenue.toFixed(0)}</td>
                    <td>{item.avgCompletion}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* My Courses List */}
      <div className="panel">
        <h3 style={{ marginBottom: "0.8rem" }}>My Courses</h3>
        {loading ? (
          <div className="skeleton" style={{ height: 100 }} />
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>You haven't created any courses yet.</p>
            <button className="btn btn-primary" type="button" onClick={() => setShowForm(true)}>
              Create Your First Course
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Chapters</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course._id}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{course.title}</td>
                    <td><span className="label">{course.category}</span></td>
                    <td>₹{Number(course.price).toFixed(0)}</td>
                    <td>{course.chapters?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default EducatorDashboardPage;
