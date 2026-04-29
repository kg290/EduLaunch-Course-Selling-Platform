import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const CertificatePage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [enrollment, setEnrollment] = useState(null);
  const [certificateData, setCertificateData] = useState(null);
  const [recipientName, setRecipientName] = useState(user?.name || "");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCertificateState = async () => {
      setLoading(true);
      setError("");
      try {
        const enrollmentResponse = await api.get(`/enrollments/course/${courseId}`);
        setEnrollment(enrollmentResponse.data.enrollment);

        try {
          const certificateResponse = await api.get(
            `/enrollments/course/${courseId}/certificate`
          );
          setCertificateData(certificateResponse.data);
          setRecipientName(
            certificateResponse.data.certificate?.recipientName || user?.name || ""
          );
        } catch (certificateError) {
          if (certificateError.response?.status !== 404) {
            throw certificateError;
          }
          setCertificateData(null);
        }
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Failed to load certificate");
      } finally {
        setLoading(false);
      }
    };

    loadCertificateState();
  }, [courseId, user?.name]);

  const generateCertificate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await api.post(`/enrollments/course/${courseId}/certificate`, {
        recipientName
      });
      setCertificateData(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not generate certificate");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="skeleton" style={{ height: 420 }} />;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!enrollment) {
    return <p className="error">Enrollment not found.</p>;
  }

  if (enrollment.status !== "completed") {
    return (
      <div className="panel empty-state">
        <div className="empty-icon">🎓</div>
        <p>Complete all course videos first. Your certificate unlocks after full completion.</p>
        <Link className="btn btn-primary" to={`/courses/${courseId}`}>
          Back to Course
        </Link>
      </div>
    );
  }

  if (!certificateData) {
    return (
      <section className="panel certificate-setup">
        <h2>Generate Your Certificate</h2>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Enter the exact name you want printed on the official completion certificate.
        </p>
        <form className="stacked-form" onSubmit={generateCertificate} style={{ marginTop: "1rem" }}>
          <label>
            Printed Name
            <input
              type="text"
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
              placeholder="Enter your full name"
              required
            />
          </label>
          <button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>
            {submitting ? "Generating..." : "Generate Certificate"}
          </button>
        </form>
      </section>
    );
  }

  const certificate = certificateData.certificate;
  const course = certificateData.course;
  const educator = certificateData.educator;
  const completionDate = certificateData.completedAt || certificate.issuedAt;

  return (
    <section className="certificate-page">
      <div className="row-between wrap screen-only" style={{ marginBottom: "1rem" }}>
        <div>
          <h2>Certificate of Completion</h2>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            A polished certificate view prepared for printing or PDF save.
          </p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </div>

      <div className="certificate-shell">
        <div className="certificate-frame">
          <div className="certificate-topline">EduLaunch Learning Certification</div>
          <h1>Certificate of Completion</h1>
          <p className="certificate-subline">This certifies that</p>
          <h2>{certificate.recipientName}</h2>
          <p className="certificate-subline">
            has successfully completed the course
          </p>
          <h3>{course.title}</h3>
          <p className="certificate-subline">
            under the guidance of <strong>{educator.name}</strong>
          </p>

          <div className="certificate-meta-grid">
            <div>
              <span className="certificate-meta-label">Completion Date</span>
              <strong>{new Date(completionDate).toLocaleDateString()}</strong>
            </div>
            <div>
              <span className="certificate-meta-label">Certificate ID</span>
              <strong>{certificate.certificateId}</strong>
            </div>
          </div>

          <div className="certificate-signature-row">
            <div className="signature-block">
              <span className="signature-line" />
              <strong>{educator.name}</strong>
              <span className="muted" style={{ fontSize: "0.82rem" }}>Course Educator</span>
            </div>
            <div className="signature-block">
              <span className="signature-line" />
              <strong>EduLaunch Academy</strong>
              <span className="muted" style={{ fontSize: "0.82rem" }}>Authorized Issuer</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CertificatePage;
