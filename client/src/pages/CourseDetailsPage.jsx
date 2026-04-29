import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api, { toAssetUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import ReviewSection from "../components/ReviewSection";

const extractEmbedUrl = (url) => {
  const rawUrl = String(url || "").trim();
  if (!rawUrl) return "";
  if (rawUrl.includes("/embed/")) return rawUrl;

  const watchIndex = rawUrl.indexOf("v=");
  if (watchIndex !== -1) {
    const id = rawUrl.slice(watchIndex + 2).split("&")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  if (rawUrl.includes("youtu.be/")) {
    const id = rawUrl.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  return rawUrl;
};

const CourseDetailsPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("loading");
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [paying, setPaying] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  const isStudent = user?.role === "student";
  const isAdmin = user?.role === "admin";
  const userId = user?.id || user?._id;
  const isOwner =
    user?.role === "educator" &&
    String(course?.educator?._id || course?.educator || "") === String(userId || "");
  const chapterCount = course?.chapters?.length || 0;
  const canAccessCourseContent = Boolean(
    course?.access?.hasFullAccess || enrollment || isOwner || isAdmin
  );

  const previewChapterCount = useMemo(() => {
    if (!chapterCount) return 0;
    if (canAccessCourseContent) return chapterCount;

    const apiPreviewCount = Number(course?.access?.previewChapterCount);
    if (!Number.isNaN(apiPreviewCount)) {
      return Math.max(0, Math.min(apiPreviewCount, chapterCount));
    }

    // Fallback preview rule when API metadata is stale/missing.
    return Math.min(1, chapterCount);
  }, [course, chapterCount, canAccessCourseContent]);

  const chaptersForView = useMemo(() => {
    if (!course?.chapters?.length) return [];

    return course.chapters.map((chapter, index) => {
      if (canAccessCourseContent) {
        return {
          ...chapter,
          isLocked: false,
          isPreview: false
        };
      }

      const isFallbackLocked = index >= previewChapterCount;
      return {
        ...chapter,
        isLocked: Boolean(chapter.isLocked || isFallbackLocked),
        isPreview: !isFallbackLocked
      };
    });
  }, [course, canAccessCourseContent, previewChapterCount]);

  const lockedChapterCount = Math.max(chapterCount - previewChapterCount, 0);
  const shouldShowEnrollmentCta = !canAccessCourseContent && isStudent;

  const loadCourse = async () => {
    setStatus("loading");
    setError("");
    try {
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data.course);
      setStatus("ready");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not load course");
      setStatus("error");
    }
  };

  const loadEnrollment = async () => {
    if (!isAuthenticated || !isStudent) {
      setEnrollment(null);
      return;
    }
    try {
      const response = await api.get(`/enrollments/course/${id}`);
      setEnrollment(response.data.enrollment);
    } catch {
      setEnrollment(null);
    }
  };

  const loadPaymentConfig = async () => {
    try {
      const response = await api.get("/enrollments/payment-config");
      setPaymentConfig(response.data);
    } catch {
      setPaymentConfig({ razorpayConfigured: false });
    }
  };

  useEffect(() => {
    loadCourse();
    loadPaymentConfig();
  }, [id]);

  useEffect(() => {
    loadEnrollment();
  }, [id, isAuthenticated, isStudent]);

  useEffect(() => {
    if (enrollment?.progress?.lastChapterIndex !== undefined) {
      const safeIndex = Math.max(
        0,
        Math.min(Number(enrollment.progress.lastChapterIndex) || 0, chapterCount - 1)
      );
      setSelectedChapter(safeIndex);
    }
  }, [enrollment?._id, enrollment?.progress?.lastChapterIndex, chapterCount]);

  const selectedChapterData = useMemo(() => {
    if (!chaptersForView.length) return null;
    return chaptersForView[selectedChapter] || chaptersForView[0];
  }, [chaptersForView, selectedChapter]);

  const isSelectedChapterLocked = Boolean(
    selectedChapterData?.isLocked && !canAccessCourseContent
  );

  const completedIndexes = enrollment?.progress?.completedChapterIndexes || [];
  const bookmarkedIndexes = enrollment?.progress?.bookmarkedChapterIndexes || [];
  const isBookmarked = bookmarkedIndexes.includes(selectedChapter);
  const hasCertificate = Boolean(enrollment?.certificate?.certificateId);

  // Razorpay real payment flow
  const startRazorpayPayment = async () => {
    setError("");
    setPaying(true);
    try {
      if (!window.Razorpay) {
        throw new Error("Razorpay checkout SDK failed to load. Please refresh and try again.");
      }

      const response = await api.post("/enrollments/razorpay/order", { courseId: id });
      const { order, razorpayKeyId } = response.data;

      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "EduLaunch",
        description: `Enroll in: ${course.title}`,
        order_id: order.id,
        handler: async (paymentResponse) => {
          try {
            await api.post("/enrollments/razorpay/verify", {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              courseId: id
            });
            await Promise.all([loadEnrollment(), loadCourse()]);
          } catch (verifyError) {
            setError(verifyError.response?.data?.message || "Payment verification failed");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || ""
        },
        theme: { color: "#f5a623" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        setError(`Payment failed: ${resp.error.description}`);
      });
      rzp.open();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not create order");
    } finally {
      setPaying(false);
    }
  };

  // Mock payment flow (fallback)
  const startMockPayment = async () => {
    setError("");
    setPaying(true);
    try {
      await api.post("/enrollments/mock-payment/intent", { courseId: id });
      await api.post("/enrollments/mock-payment/confirm", { courseId: id });
      await Promise.all([loadEnrollment(), loadCourse()]);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Mock payment failed");
    } finally {
      setPaying(false);
    }
  };

  const handleEnroll = () => {
    if (paymentConfig?.razorpayConfigured) {
      startRazorpayPayment();
    } else {
      startMockPayment();
    }
  };

  const toggleChapterCompletion = async (chapterIndex, checked, options = {}) => {
    try {
      const response = await api.patch(`/enrollments/course/${id}/progress`, {
        chapterIndex,
        completed: checked
      });
      setEnrollment((prev) => ({
        ...prev,
        progress: response.data.progress,
        status: response.data.status
      }));

      if (options.advanceToNext && checked) {
        if (chapterIndex < chaptersForView.length - 1) {
          setSelectedChapter(chapterIndex + 1);
        }
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not update progress");
    }
  };

  const toggleBookmark = async () => {
    if (!enrollment) {
      return;
    }

    setBookmarkBusy(true);
    setError("");
    try {
      const nextBookmarked = !isBookmarked;
      const response = await api.patch(`/enrollments/course/${id}/bookmarks`, {
        chapterIndex: selectedChapter,
        bookmarked: nextBookmarked
      });

      setEnrollment((prev) => ({
        ...prev,
        progress: {
          ...prev.progress,
          bookmarkedChapterIndexes: response.data.bookmarks
        }
      }));
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not update bookmark");
    } finally {
      setBookmarkBusy(false);
    }
  };

  const toggleWishlist = async () => {
    setWishlistBusy(true);
    setError("");
    try {
      if (course.isWishlisted) {
        await api.delete(`/courses/${id}/wishlist`);
      } else {
        await api.post(`/courses/${id}/wishlist`);
      }

      setCourse((prev) => ({ ...prev, isWishlisted: !prev.isWishlisted }));
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not update wishlist");
    } finally {
      setWishlistBusy(false);
    }
  };

  const onLocalVideoEnded = async () => {
    if (!enrollment || completedIndexes.includes(selectedChapter)) {
      return;
    }
    await toggleChapterCompletion(selectedChapter, true, { advanceToNext: true });
  };

  if (status === "loading") {
    return (
      <div style={{ display: "grid", gap: "1.4rem" }}>
        <div className="skeleton" style={{ height: 200 }} />
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    );
  }

  if (status === "error") {
    return <p className="error">{error}</p>;
  }

  return (
    <section className="course-details">
      {/* Course Header */}
      <div className="panel">
        <div className="row-between wrap">
          <div>
            <span className="label">{course.category}</span>
            <h2 style={{ marginTop: "0.5rem", marginBottom: "0.3rem" }}>{course.title}</h2>
            <p className="muted">{course.description}</p>
            <p className="muted" style={{ marginTop: "0.3rem" }}>
              By <strong style={{ color: "var(--text-primary)" }}>{course.educator?.name}</strong>
            </p>
            {isStudent && (
              <button
                className={`btn btn-sm ${course.isWishlisted ? "btn-primary" : "btn-ghost"}`}
                type="button"
                onClick={toggleWishlist}
                disabled={wishlistBusy}
                style={{ marginTop: "0.8rem" }}
              >
                {course.isWishlisted ? "Saved to Wishlist" : "Save for Later"}
              </button>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: "2.2rem",
              fontWeight: 800,
              color: "var(--accent-dark)"
            }}>
              ₹{Number(course.price).toFixed(0)}
            </div>
            <p className="muted" style={{ fontSize: "0.82rem" }}>
              {course.chapters?.length || 0} chapters
            </p>
          </div>
        </div>
      </div>

      {/* Enrollment CTA */}
      {shouldShowEnrollmentCta && (
        <div className="panel payment-panel">
          <h3>🎯 Unlock Full Course Access</h3>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            {paymentConfig?.razorpayConfigured
              ? "Secure checkout powered by Razorpay."
              : "Demo mode - payment is simulated."}
          </p>
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            {previewChapterCount > 0
              ? `Preview ${previewChapterCount} chapter${previewChapterCount === 1 ? "" : "s"} now and unlock ${lockedChapterCount} locked chapter${lockedChapterCount === 1 ? "" : "s"} after payment.`
              : "This course has no free video previews. Complete payment to unlock all chapters."}
          </p>
          <div>
            <button
              className="btn btn-primary btn-lg"
              type="button"
              onClick={handleEnroll}
              disabled={paying}
            >
              {paying
                ? "Processing..."
                : paymentConfig?.razorpayConfigured
                ? "💳 Pay & Unlock"
                : "🧪 Unlock (Demo Payment)"}
            </button>
          </div>
        </div>
      )}

      {!canAccessCourseContent && !isStudent && (
        <div className="panel payment-panel">
          <h3>🔐 Unlock This Course</h3>
          {!isAuthenticated ? (
            <>
              <p className="muted" style={{ fontSize: "0.9rem" }}>
                Sign in as a student to continue with payment and unlock full access.
              </p>
              <div>
                <Link className="btn btn-primary" to="/login">
                  Login as Student
                </Link>
              </div>
            </>
          ) : (
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              Only student accounts can purchase courses. Switch to a student account to continue.
            </p>
          )}
        </div>
      )}

      {!canAccessCourseContent && (
        <div className="panel subtle">
          <p>
            You are in preview mode. Watch available preview chapters and complete payment to unlock the full course learning path.
          </p>
        </div>
      )}

      {/* Owner badge */}
      {isOwner && (
        <div className="panel subtle">
          <p style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            ✨ You are the creator of this course.
          </p>
        </div>
      )}

      {/* Progress */}
      {enrollment && (
        <div className="panel">
          <div className="row-between">
            <h3>📈 My Progress</h3>
            <span style={{ fontWeight: 700, color: "var(--accent-dark)" }}>
              {enrollment.progress?.completedPercent || 0}%
            </span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${enrollment.progress?.completedPercent || 0}%` }}
            />
          </div>
          {enrollment.status === "completed" && (
            <div style={{ marginTop: "0.8rem" }}>
              <p className="success">🎉 Congratulations! You've completed this course.</p>
              <Link className="btn btn-primary" to={`/certificates/${id}`} style={{ marginTop: "0.7rem" }}>
                {hasCertificate ? "View Certificate" : "Generate Certificate"}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Chapters + Video */}
      <div className="grid-main">
        <div className="panel">
          <h3 style={{ marginBottom: "0.8rem" }}>Chapters</h3>
          <div className="chapter-menu">
            {chaptersForView.map((chapter, index) => (
              <div key={index} className="chapter-row">
                <button
                  className={`chapter-nav ${index === selectedChapter ? "active" : ""} ${chapter.isLocked && !canAccessCourseContent ? "locked" : ""}`}
                  type="button"
                  onClick={() => setSelectedChapter(index)}
                >
                  <div className="row-between" style={{ width: "100%" }}>
                    <span>
                      <span style={{ color: "var(--text-muted)", marginRight: "0.4rem" }}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {chapter.title}
                    </span>
                    {!canAccessCourseContent && chapter.isPreview && (
                      <span className="label" style={{ fontSize: "0.62rem" }}>
                        Preview
                      </span>
                    )}
                    {!canAccessCourseContent && chapter.isLocked && (
                      <span className="chapter-lock">Locked</span>
                    )}
                  </div>
                </button>
                {enrollment && (
                  <label className="checkbox-inline">
                    <input
                      type="checkbox"
                      checked={completedIndexes.includes(index)}
                      onChange={(event) =>
                        toggleChapterCompletion(index, event.target.checked)
                      }
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          {selectedChapterData ? (
            isSelectedChapterLocked ? (
              <div className="empty-state">
                <div className="empty-icon">🔒</div>
                <h3>Chapter Locked</h3>
                <p>
                  Complete payment to unlock this chapter and the rest of the full course content.
                </p>
                {shouldShowEnrollmentCta && (
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={handleEnroll}
                    disabled={paying}
                  >
                    {paying ? "Processing..." : "Unlock Full Course"}
                  </button>
                )}
              </div>
            ) : (
            <>
              <div className="row-between wrap" style={{ marginBottom: "0.3rem" }}>
                <h3>{selectedChapterData.title}</h3>
                <div className="row-gap">
                  {enrollment && (
                    <button
                      className={`btn btn-sm ${isBookmarked ? "btn-primary" : "btn-ghost"}`}
                      type="button"
                      onClick={toggleBookmark}
                      disabled={bookmarkBusy}
                    >
                      {isBookmarked ? "Bookmarked" : "Bookmark"}
                    </button>
                  )}
                  {!canAccessCourseContent && selectedChapterData.isPreview && (
                    <span className="label">Preview Lesson</span>
                  )}
                </div>
              </div>
              <p className="muted" style={{ marginBottom: "0.5rem" }}>
                {selectedChapterData.summary || "No summary provided."}
              </p>
              {selectedChapterData.videoPath ? (
                <div className="video-wrap">
                  <video
                    key={`${selectedChapter}-${selectedChapterData.videoPath}`}
                    controls
                    preload="metadata"
                    onEnded={onLocalVideoEnded}
                  >
                    <source src={toAssetUrl(selectedChapterData.videoPath)} />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : selectedChapterData.youtubeUrl ? (
                <div className="video-wrap">
                  <iframe
                    src={extractEmbedUrl(selectedChapterData.youtubeUrl)}
                    title={selectedChapterData.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="empty-state" style={{ padding: "1.5rem" }}>
                  <p>Video is not available for this chapter preview.</p>
                </div>
              )}

              {selectedChapterData.videoPath && enrollment && (
                <p className="muted" style={{ marginTop: "0.7rem", fontSize: "0.85rem" }}>
                  This local uploaded lesson auto-marks as complete and advances to the next chapter when the video ends.
                </p>
              )}

              {!canAccessCourseContent && (
                <p className="muted" style={{ marginTop: "0.7rem", fontSize: "0.85rem" }}>
                  This is a free preview. Purchase this course to unlock all chapters and progress tracking.
                </p>
              )}
            </>
            )
          ) : (
            <p className="muted">No chapters available.</p>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {/* Reviews Section */}
      <ReviewSection courseId={id} isEnrolled={Boolean(enrollment)} />
    </section>
  );
};

export default CourseDetailsPage;
