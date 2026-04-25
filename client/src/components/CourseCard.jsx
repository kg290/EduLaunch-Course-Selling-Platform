import { useState } from "react";
import { Link } from "react-router-dom";

const CourseCard = ({ course, layout = "grid" }) => {
  const isHorizontal = layout === "horizontal";
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const hasThumbnail = Boolean(course.thumbnailUrl) && !imageLoadFailed;

  return (
    <article className={`card course-card ${isHorizontal ? "horizontal" : ""}`}>
      {hasThumbnail ? (
        <img
          src={course.thumbnailUrl}
          alt={course.title}
          className="course-thumb"
          loading="lazy"
          onError={() => setImageLoadFailed(true)}
        />
      ) : (
        <div className="course-thumb placeholder">
          <span className="thumb-fallback-text">Course Thumbnail</span>
        </div>
      )}
      <div className="card-content">
        {!isHorizontal && <span className="label" style={{alignSelf: "flex-start"}}>{course.category || "General"}</span>}
        <h3 style={!isHorizontal ? { fontSize: "1.05rem", marginTop: "0.2rem" } : {}}>{course.title}</h3>
        
        {isHorizontal && (
          <div className="instructor-info">
            <div className="instructor-avatar">
              {course.educator?.name?.[0]?.toUpperCase() || "E"}
            </div>
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              {course.educator?.name || "Educator"} • <span className="label" style={{fontSize: "0.65rem"}}>{course.category || "General"}</span>
            </span>
          </div>
        )}

        <p className={isHorizontal ? "description-text" : "muted"} style={!isHorizontal ? { fontSize: "0.85rem", lineHeight: 1.5 } : {}}>
          {!isHorizontal && course.description?.length > 90
            ? course.description.slice(0, 90) + "..."
            : course.description}
        </p>
        
        {!isHorizontal && (
          <p className="muted" style={{ fontSize: "0.8rem" }}>
            By {course.educator?.name || "Educator"}
          </p>
        )}
        
        <div className="card-footer">
          <strong>₹{Number(course.price).toFixed(0)}</strong>
          <Link to={`/courses/${course._id}`} className="btn btn-primary btn-sm">
            Preview / View →
          </Link>
        </div>
      </div>
    </article>
  );
};

export default CourseCard;
