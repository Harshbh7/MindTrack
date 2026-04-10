const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, push } = require('firebase/database');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const starterDecks = [
    {
        title: "React Hooks Mastery",
        author: "MindTrack Admin",
        authorUid: "admin",
        downloads: 42,
        createdAt: Date.now(),
        cards: [
            { front: "What does useEffect do?", back: "It allows you to perform side effects in function components." },
            { front: "What are the rules of Hooks?", back: "1. Only call hooks at the top level. 2. Only call hooks from React function components." },
            { front: "When does useMemo run?", back: "It runs during rendering and only recomputes accurately when dependencies change." }
        ]
    },
    {
        title: "JavaScript ES6 Essentials",
        author: "TechTutor",
        authorUid: "tutor1",
        downloads: 128,
        createdAt: Date.now() - 86400000,
        cards: [
            { front: "Difference between let and var?", back: "let is block-scoped, var is function-scoped." },
            { front: "What is a Template Literal?", back: "String literals allowing embedded expressions using backticks." },
            { front: "What does 'this' refer to in an arrow function?", back: "It inherits 'this' from the surrounding lexical scope." }
        ]
    },
    {
        title: "Python 101: Basics",
        author: "PyGuru",
        authorUid: "pyguru",
        downloads: 75,
        createdAt: Date.now() - 172800000,
        cards: [
            { front: "How to define a function in Python?", back: "Using the 'def' keyword followed by function name and colon." },
            { front: "What is a List Comprehension?", back: "A concise way to create lists based on existing lists." }
        ]
    }
];

async function seed() {
    console.log("Seeding community decks...");
    const communityRef = ref(db, 'communityDecks');
    for (const deck of starterDecks) {
        await push(communityRef, deck);
    }
    console.log("Seeding complete!");
    process.exit(0);
}

seed();
