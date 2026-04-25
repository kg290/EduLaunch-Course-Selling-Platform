const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

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
    thumbnailUrl: "",
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
    thumbnailUrl: "",
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
    thumbnailUrl: "",
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
    thumbnailUrl: "",
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
    thumbnailUrl: "",
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
    thumbnailUrl: "",
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
    title: "Digital Marketing Bootcamp",
    description:
      "Get practical skills in content, SEO, email, and social growth strategy.",
    category: "Marketing",
    price: 949,
    thumbnailUrl: "",
    chapters: [
      {
        title: "Marketing Funnel Fundamentals",
        youtubeUrl: "https://www.youtube.com/watch?v=7YxNfPVIMMs",
        summary: "Acquire, activate, and retain users with clear funnel design."
      },
      {
        title: "SEO and Content Strategy",
        youtubeUrl: "https://www.youtube.com/watch?v=xsVTqzratPs",
        summary: "Rank content and build long-term organic traffic."
      },
      {
        title: "Email Campaign Playbook",
        youtubeUrl: "https://www.youtube.com/watch?v=2vMK-p6-M5E",
        summary: "Write emails that convert and retain customers."
      }
    ]
  },
  {
    title: "Performance Marketing with Ads",
    description:
      "Run high-converting campaigns on Google and Meta with budget discipline.",
    category: "Marketing",
    price: 1199,
    thumbnailUrl: "",
    chapters: [
      {
        title: "Ad Account Setup and Tracking",
        youtubeUrl: "https://www.youtube.com/watch?v=7n4u7M8N1kA",
        summary: "Set campaign goals, pixels, and conversion events."
      },
      {
        title: "Creative and Targeting Strategy",
        youtubeUrl: "https://www.youtube.com/watch?v=KJgsSFOSQv0",
        summary: "Build ad creative and audience segments that perform."
      },
      {
        title: "Optimization and Scaling",
        youtubeUrl: "https://www.youtube.com/watch?v=Wf2V8hTVQYw",
        summary: "Improve ROAS using data-driven experimentation."
      }
    ]
  },
  {
    title: "Startup & Product Strategy",
    description:
      "Build products customers want using MVP strategy, user feedback, and growth loops.",
    category: "Business",
    price: 1099,
    thumbnailUrl: "",
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
    title: "Freelance Client Acquisition",
    description:
      "Systematically get high-quality freelance clients and close projects consistently.",
    category: "Business",
    price: 749,
    thumbnailUrl: "",
    chapters: [
      {
        title: "Positioning and Niche Selection",
        youtubeUrl: "https://www.youtube.com/watch?v=8aGhZQkoFbQ",
        summary: "Choose a niche and define a compelling service offer."
      },
      {
        title: "Outbound Outreach that Works",
        youtubeUrl: "https://www.youtube.com/watch?v=YQHsXMglC9A",
        summary: "Write outreach messages that get replies."
      },
      {
        title: "Pricing and Sales Calls",
        youtubeUrl: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
        summary: "Structure proposals and close profitable deals."
      }
    ]
  },
  {
    title: "Communication & Presentation Skills",
    description:
      "Speak clearly, structure ideas, and present confidently in interviews and meetings.",
    category: "General",
    price: 599,
    thumbnailUrl: "",
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
    thumbnailUrl: "",
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

const withThumbnail = (courseData) => {
  if (String(courseData.thumbnailUrl || "").trim()) {
    return courseData;
  }

  const firstVideoId = extractYoutubeVideoId(courseData.chapters?.[0]?.youtubeUrl);
  if (!firstVideoId) {
    return {
      ...courseData,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
    };
  }

  return {
    ...courseData,
    thumbnailUrl: `https://img.youtube.com/vi/${firstVideoId}/hqdefault.jpg`
  };
};

const ensureUser = async (userData) => {
  const existing = await User.findOne({ email: userData.email });
  if (existing) return existing;
  return User.create(userData);
};

const upsertCourse = async (educatorId, courseData) => {
  const query = { title: courseData.title, educator: educatorId };
  const update = { ...withThumbnail(courseData), educator: educatorId };
  return Course.findOneAndUpdate(query, update, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true
  });
};

const seedDemoData = async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/course_platform";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const educator = await ensureUser(demoEducator);
  const student = await ensureUser(demoStudent);

  const createdCourses = [];
  for (const courseData of demoCourses) {
    const course = await upsertCourse(educator._id, courseData);
    createdCourses.push(course);
  }

  if (createdCourses[0]) {
    await Enrollment.findOneAndUpdate(
      { student: student._id, course: createdCourses[0]._id },
      {
        student: student._id,
        educator: educator._id,
        course: createdCourses[0]._id,
        payment: {
          provider: "razorpay",
          transactionId: `demo_seed_${createdCourses[0]._id}`,
          status: "captured",
          amount: createdCourses[0].price,
          currency: "INR"
        },
        progress: {
          completedChapterIndexes: [0],
          completedPercent: Math.round((1 / createdCourses[0].chapters.length) * 100),
          lastWatchedAt: new Date()
        },
        status: "active"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Demo educator: ${demoEducator.email} / ${demoEducator.password}`);
  console.log(`Demo student: ${demoStudent.email} / ${demoStudent.password}`);
  console.log(`Seeded courses: ${createdCourses.length}`);

  await mongoose.disconnect();
  console.log("Demo data seeding complete.");
};

seedDemoData().catch((error) => {
  console.error("Failed to seed demo data:", error.message);
  process.exit(1);
});
