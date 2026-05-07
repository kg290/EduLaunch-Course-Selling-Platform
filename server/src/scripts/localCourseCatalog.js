const fs = require("fs");
const path = require("path");

const {
  buildLibraryVideoPath,
  localCourseLibraryRoot
} = require("../config/media");

const localEducatorAccount = {
  name: "Local Library Educator",
  email: "local.educator@edulaunch.com",
  password: "educator123",
  role: "educator"
};

const localCourseDefinitions = [
  {
    folder: "Javascript",
    title: "JavaScript Web Foundations",
    description:
      "Learn core JavaScript concepts, DOM interaction, and React fundamentals through a practical three-part local video course.",
    category: "Programming",
    price: 899,
    thumbnailUrl: "https://img.youtube.com/vi/PkZNo7MFNFg/hqdefault.jpg",
    chapters: [
      {
        fileName: "Learn JavaScript - Full Course for Beginners.webm",
        title: "JavaScript Foundations",
        summary: "Understand variables, functions, arrays, objects, and core syntax patterns.",
        youtubeUrl: "https://www.youtube.com/watch?v=PkZNo7MFNFg"
      },
      {
        fileName: "JavaScript Crash Course For Beginners.webm",
        title: "JavaScript in Practice",
        summary: "Reinforce the fundamentals with hands-on examples and browser-focused patterns.",
        youtubeUrl: "https://www.youtube.com/watch?v=hdI2bqOjy3c"
      },
      {
        fileName: "React JS Crash Course.webm",
        title: "React Starter Project",
        summary: "Bridge modern JavaScript knowledge into component-based frontend development.",
        youtubeUrl: "https://www.youtube.com/watch?v=w7ejDZ8SWv8"
      }
    ]
  },
  {
    folder: "Marketing",
    title: "Marketing Hub Campaign Essentials",
    description:
      "Build a strong digital marketing foundation with campaign setup, email automation, and social media execution.",
    category: "Marketing",
    price: 799,
    thumbnailUrl: "https://img.youtube.com/vi/68mC70jSbek/hqdefault.jpg",
    chapters: [
      {
        fileName: "HubSpot Marketing Hub Tutorial For Beginners (2024).webm",
        title: "Marketing Hub Setup",
        summary: "Get comfortable with the overall campaign workspace and beginner marketing workflows.",
        youtubeUrl: "https://www.youtube.com/watch?v=68mC70jSbek"
      },
      {
        fileName: "Email Marketing Tutorial ｜ HubSpot Marketing Hub.webm",
        title: "Email Campaign Execution",
        summary: "Create and manage email sequences that support awareness, nurturing, and conversion.",
        youtubeUrl: "https://www.youtube.com/watch?v=-4VPi-a8jkQ"
      },
      {
        fileName: "Social Media Management Software Tutorial ｜ HubSpot Marketing Hub.webm",
        title: "Social Media Workflow",
        summary: "Plan content, publish efficiently, and organize channel-level social media activity.",
        youtubeUrl: "https://www.youtube.com/watch?v=so_J2lTejIA"
      }
    ]
  },
  {
    folder: "Self Improvement",
    title: "Study Smarter Blueprint",
    description:
      "Develop a repeatable study system with evidence-based revision, masterclass strategies, and flashcard discipline.",
    category: "General",
    price: 699,
    thumbnailUrl: "https://img.youtube.com/vi/ukLnPbIffxE/hqdefault.jpg",
    chapters: [
      {
        fileName: "How to study for exams - Evidence-based revision tips.mp4",
        title: "Evidence-Based Revision Basics",
        summary: "Start with the principles behind efficient revision and better retention.",
        youtubeUrl: "https://www.youtube.com/watch?v=ukLnPbIffxE"
      },
      {
        fileName: "How to Study for Exams - An Evidence-Based Masterclass.mp4",
        title: "Full Study Masterclass",
        summary: "Build a structured exam-prep workflow from planning through active recall.",
        youtubeUrl: "https://www.youtube.com/watch?v=Lt54CX9DmS4"
      },
      {
        fileName: "How to Study for Exams with Flashcards (Anki Masterclass).mp4",
        title: "Flashcards and Active Recall",
        summary: "Turn your study process into a consistent memory system with flashcards.",
        youtubeUrl: "https://www.youtube.com/watch?v=8zaKVFC9Eu4"
      }
    ]
  },
  {
    folder: "General",
    title: "Office Productivity Essentials",
    description:
      "Master everyday office tools with a practical workflow through Word, PowerPoint, and Excel.",
    category: "General",
    price: 749,
    thumbnailUrl: "https://img.youtube.com/vi/5Im87VPQZ_0/hqdefault.jpg",
    chapters: [
      {
        fileName: "Microsoft Word Tutorial for Beginners.mp4",
        title: "Word Basics",
        summary: "Learn document formatting, page layouts, and productivity workflows in Word.",
        youtubeUrl: "https://www.youtube.com/watch?v=5Im87VPQZ_0"
      },
      {
        fileName: "PowerPoint Tutorial for Beginners.mp4",
        title: "Presentation Design in PowerPoint",
        summary: "Create clean decks, work with slide layouts, and prepare strong presentations.",
        youtubeUrl: "https://www.youtube.com/watch?v=l5Ij7nUy9UQ"
      },
      {
        fileName: "Excel Tutorial for Beginners.mp4",
        title: "Excel Foundations",
        summary: "Work with cells, formulas, tables, and practical spreadsheet workflows.",
        youtubeUrl: "https://www.youtube.com/watch?v=LgXzzu68j7M"
      }
    ]
  }
];

const assertVideoFileExists = (folder, fileName) => {
  const absolutePath = path.join(localCourseLibraryRoot, folder, fileName);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing local video file: ${absolutePath}`);
  }
};

const mapLocalCourseForStorage = (courseDefinition, educatorId) => ({
  title: courseDefinition.title,
  description: courseDefinition.description,
  category: courseDefinition.category,
  price: courseDefinition.price,
  thumbnailUrl: courseDefinition.thumbnailUrl,
  educator: educatorId,
  chapters: courseDefinition.chapters.map((chapter) => {
    assertVideoFileExists(courseDefinition.folder, chapter.fileName);
    return {
      title: chapter.title,
      summary: chapter.summary,
      youtubeUrl: chapter.youtubeUrl,
      videoPath: buildLibraryVideoPath(path.join(courseDefinition.folder, chapter.fileName)),
      originalVideoName: chapter.fileName
    };
  })
});

module.exports = {
  localEducatorAccount,
  localCourseDefinitions,
  mapLocalCourseForStorage
};
