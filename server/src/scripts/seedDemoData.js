const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const {
  localEducatorAccount,
  localCourseDefinitions,
  mapLocalCourseForStorage
} = require("./localCourseCatalog");

const demoEducator = {
  name: "Demo Educator",
  email: "educator.demo@edulaunch.com",
  password: "educator123",
  role: "educator"
};

const demoStudent = {
  name: "Demo Student",
  email: "student.demo@edulaunch.com",
  password: "student123",
  role: "student"
};

const demoCourses = [
  {
    title: "React from Zero to Deployment",
    description:
      "Build modern React apps with routing, auth, APIs, and deployment practices.",
    category: "Programming",
    price: 899,
    chapters: [
      {
        title: "React Fundamentals",
        youtubeUrl: "https://www.youtube.com/watch?v=Ke90Tje7VS0",
        summary: "Components, props, and state essentials."
      },
      {
        title: "Routing and Protected Pages",
        youtubeUrl: "https://www.youtube.com/watch?v=Law7wfdg_ls",
        summary: "Navigation patterns with React Router."
      },
      {
        title: "Deploying Production Builds",
        youtubeUrl: "https://www.youtube.com/watch?v=NhWg7AQLI_8",
        summary: "Prepare and deploy a production-ready app."
      }
    ]
  },
  {
    title: "Node.js API Engineering",
    description:
      "Create secure and scalable REST APIs using Node.js, Express, and MongoDB.",
    category: "Programming",
    price: 1099,
    chapters: [
      {
        title: "API Project Architecture",
        youtubeUrl: "https://www.youtube.com/watch?v=l8WPWK9mS5M",
        summary: "Structure APIs for maintainability and scale."
      },
      {
        title: "JWT Auth + Role Access",
        youtubeUrl: "https://www.youtube.com/watch?v=mbsmsi7l3r4",
        summary: "Implement robust authentication and authorization."
      },
      {
        title: "Error Handling and Validation",
        youtubeUrl: "https://www.youtube.com/watch?v=2jqok-WgelI",
        summary: "Build resilient APIs with clean error contracts."
      }
    ]
  },
  {
    title: "JavaScript Interview Mastery",
    description:
      "Strengthen JS core concepts, async logic, and coding patterns for interviews.",
    category: "Programming",
    price: 799,
    chapters: [
      {
        title: "Execution Context and Closures",
        youtubeUrl: "https://www.youtube.com/watch?v=uDwSnnhl1Ng",
        summary: "Deep dive into closures and lexical scope."
      },
      {
        title: "Promises and Async/Await",
        youtubeUrl: "https://www.youtube.com/watch?v=PoRJizFvM7s",
        summary: "Master async control flow in JavaScript."
      },
      {
        title: "Problem Solving Patterns",
        youtubeUrl: "https://www.youtube.com/watch?v=RBSGKlAvoiM",
        summary: "Learn patterns used in common coding interviews."
      }
    ]
  },
  {
    title: "Data Structures & Algorithms in JS",
    description:
      "Solve real interview questions using arrays, maps, recursion, and dynamic programming.",
    category: "Programming",
    price: 999,
    chapters: [
      {
        title: "Big-O and Problem Solving Mindset",
        youtubeUrl: "https://www.youtube.com/watch?v=8hly31xKli0",
        summary: "Understand complexity and optimize code confidently."
      },
      {
        title: "Core DSA Patterns",
        youtubeUrl: "https://www.youtube.com/watch?v=RBSGKlAvoiM",
        summary: "Two pointers, sliding window, hashing and recursion."
      },
      {
        title: "Mock Interview Round",
        youtubeUrl: "https://www.youtube.com/watch?v=2ZLl8GAk1X4",
        summary: "Apply patterns to timed interview-style questions."
      }
    ]
  },
  {
    title: "UI/UX Design Essentials",
    description:
      "Learn visual hierarchy, typography, spacing, and user flow design from scratch.",
    category: "Design",
    price: 849,
    chapters: [
      {
        title: "Design Principles that Matter",
        youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU",
        summary: "Color, contrast, alignment, and hierarchy for interfaces."
      },
      {
        title: "Wireframes to High-Fidelity Screens",
        youtubeUrl: "https://www.youtube.com/watch?v=FTFaQWZBqQ8",
        summary: "Transform rough layouts into polished UI."
      },
      {
        title: "User Testing Basics",
        youtubeUrl: "https://www.youtube.com/watch?v=3vVZ9bI8nbs",
        summary: "Validate design assumptions with lightweight tests."
      }
    ]
  },
  {
    title: "Figma to Frontend Workflow",
    description:
      "Convert design files into reusable components and production-ready frontend layouts.",
    category: "Design",
    price: 899,
    chapters: [
      {
        title: "Organizing Figma Files for Developers",
        youtubeUrl: "https://www.youtube.com/watch?v=jk1T0CdLxwU",
        summary: "Structure pages, components, and design tokens."
      },
      {
        title: "Auto Layout and Responsive Design",
        youtubeUrl: "https://www.youtube.com/watch?v=1pW_sk-2y40",
        summary: "Build responsive systems directly in Figma."
      },
      {
        title: "Handoff to React Components",
        youtubeUrl: "https://www.youtube.com/watch?v=G8tOQg0kjY8",
        summary: "Implement designs quickly with clean component structure."
      }
    ]
  },
  {
    title: "Startup & Product Strategy",
    description:
      "Build products customers want using MVP strategy, user feedback, and growth loops.",
    category: "Business",
    price: 1099,
    chapters: [
      {
        title: "Validating Product Ideas",
        youtubeUrl: "https://www.youtube.com/watch?v=H14bBuluwB8",
        summary: "Find problems worth solving and test demand early."
      },
      {
        title: "MVP Scoping and Prioritization",
        youtubeUrl: "https://www.youtube.com/watch?v=5fvlKkZuxjE",
        summary: "Ship quickly without overbuilding features."
      },
      {
        title: "Metrics and Product Iteration",
        youtubeUrl: "https://www.youtube.com/watch?v=9YffrCViTVk",
        summary: "Use feedback and analytics to iterate with confidence."
      }
    ]
  },
  {
    title: "Communication & Presentation Skills",
    description:
      "Speak clearly, structure ideas, and present confidently in interviews and meetings.",
    category: "General",
    price: 599,
    chapters: [
      {
        title: "Structuring Your Message",
        youtubeUrl: "https://www.youtube.com/watch?v=Unzc731iCUY",
        summary: "Use frameworks to communicate with clarity."
      },
      {
        title: "Public Speaking Confidence",
        youtubeUrl: "https://www.youtube.com/watch?v=HAnw168huqA",
        summary: "Reduce anxiety and improve delivery."
      },
      {
        title: "Storytelling for Impact",
        youtubeUrl: "https://www.youtube.com/watch?v=Nj-hdQMa3uA",
        summary: "Tell stories that make your points memorable."
      }
    ]
  },
  {
    title: "Productivity Systems for Developers",
    description:
      "Build deep-work routines, planning habits, and execution systems that scale output.",
    category: "General",
    price: 699,
    chapters: [
      {
        title: "Time Blocking and Focus Sessions",
        youtubeUrl: "https://www.youtube.com/watch?v=IlU-zDU6aQ0",
        summary: "Plan your day to maximize meaningful output."
      },
      {
        title: "Task Prioritization Frameworks",
        youtubeUrl: "https://www.youtube.com/watch?v=tT89OZ7TNwc",
        summary: "Choose what to do first with confidence."
      },
      {
        title: "Avoiding Burnout While Scaling",
        youtubeUrl: "https://www.youtube.com/watch?v=arj7oStGLkU",
        summary: "Sustainable high-performance routines for long-term growth."
      }
    ]
  }
];

const extractYoutubeVideoId = (url) => {
  const rawUrl = String(url || "").trim();
  if (!rawUrl) return "";

  const watchMatch = rawUrl.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) {
    return watchMatch[1];
  }

  const shortMatch = rawUrl.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch?.[1]) {
    return shortMatch[1];
  }

  const embedMatch = rawUrl.match(/\/embed\/([^?&/]+)/);
  if (embedMatch?.[1]) {
    return embedMatch[1];
  }

  return "";
};

const createInlineThumbnail = (title, category) => {
  const safeTitle = String(title || "Course").slice(0, 48);
  const safeCategory = String(category || "General").slice(0, 24).toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="1200" height="675" rx="24" fill="url(#bg)" />
      <circle cx="1030" cy="120" r="120" fill="rgba(255,255,255,0.08)" />
      <circle cx="120" cy="590" r="150" fill="rgba(255,255,255,0.06)" />
      <text x="72" y="118" fill="#f8fafc" font-family="Arial, sans-serif" font-size="34" font-weight="700">${safeCategory}</text>
      <text x="72" y="290" fill="#ffffff" font-family="Arial, sans-serif" font-size="66" font-weight="800">${safeTitle}</text>
      <text x="72" y="380" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="28">EduLaunch curated demo course</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const withThumbnail = (courseData) => {
  const explicitThumbnail = String(courseData.thumbnailUrl || "").trim();
  if (explicitThumbnail) {
    return {
      ...courseData,
      thumbnailUrl: explicitThumbnail
    };
  }

  const firstVideoId = extractYoutubeVideoId(courseData.chapters?.[0]?.youtubeUrl);
  if (firstVideoId) {
    return {
      ...courseData,
      thumbnailUrl: `https://img.youtube.com/vi/${firstVideoId}/hqdefault.jpg`
    };
  }

  return {
    ...courseData,
    thumbnailUrl: createInlineThumbnail(courseData.title, courseData.category)
  };
};

const ensureUser = async (userData) => {
  const existing = await User.findOne({ email: userData.email });
  if (existing) return existing;
  return User.create(userData);
};

const syncCoursesForEducator = async (educatorId, coursePayloads) => {
  const syncedCourses = [];

  for (const coursePayload of coursePayloads) {
    const course = await Course.findOneAndUpdate(
      { title: coursePayload.title, educator: educatorId },
      coursePayload,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );
    syncedCourses.push(course);
  }

  const syncedIds = syncedCourses.map((course) => course._id);
  const staleCourses = await Course.find({
    educator: educatorId,
    _id: { $nin: syncedIds }
  }).select("_id");

  if (staleCourses.length) {
    const staleIds = staleCourses.map((course) => course._id);
    await Enrollment.deleteMany({ course: { $in: staleIds } });
    await Course.deleteMany({ _id: { $in: staleIds } });
  }

  return syncedCourses;
};

const seedDemoData = async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/course_platform";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const educator = await ensureUser(demoEducator);
  const student = await ensureUser(demoStudent);
  const localEducator = await ensureUser(localEducatorAccount);

  const mappedDemoCourses = demoCourses.map((courseData) => ({
    ...withThumbnail(courseData),
    educator: educator._id
  }));
  const createdDemoCourses = await syncCoursesForEducator(educator._id, mappedDemoCourses);

  const mappedLocalCourses = localCourseDefinitions.map((courseDefinition) =>
    mapLocalCourseForStorage(courseDefinition, localEducator._id)
  );
  const createdLocalCourses = await syncCoursesForEducator(
    localEducator._id,
    mappedLocalCourses
  );

  if (createdDemoCourses[0]) {
    await Enrollment.findOneAndUpdate(
      { student: student._id, course: createdDemoCourses[0]._id },
      {
        student: student._id,
        educator: educator._id,
        course: createdDemoCourses[0]._id,
        payment: {
          provider: "razorpay",
          transactionId: `demo_seed_${createdDemoCourses[0]._id}`,
          status: "captured",
          amount: createdDemoCourses[0].price,
          currency: "INR"
        },
        progress: {
          completedChapterIndexes: [0],
          completedPercent: Math.round((1 / createdDemoCourses[0].chapters.length) * 100),
          lastWatchedAt: new Date()
        },
        status: "active"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Demo educator: ${demoEducator.email} / ${demoEducator.password}`);
  console.log(`Demo student: ${demoStudent.email} / ${demoStudent.password}`);
  console.log(`Local educator: ${localEducatorAccount.email} / ${localEducatorAccount.password}`);
  console.log(`Seeded YouTube courses: ${createdDemoCourses.length}`);
  console.log(`Seeded local courses: ${createdLocalCourses.length}`);

  await mongoose.disconnect();
  console.log("Demo data seeding complete.");
};

seedDemoData().catch((error) => {
  console.error("Failed to seed demo data:", error.message);
  process.exit(1);
});
