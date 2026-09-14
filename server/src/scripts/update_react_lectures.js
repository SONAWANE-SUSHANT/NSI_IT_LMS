const { Lecture, LectureNote, CourseModule } = require('../models');

async function updateReactLectures() {
  console.log('--- Updating React Lectures in Module 1 ---');

  const lecturesData = [
    {
      id: 1,
      display_order: 1,
      title: 'Introduction to React Js + Installation | Complete React Course in Hindi #1',
      description: 'Getting started with React Js, understanding why React is used, setting up the development environment, and installing Node.js.',
      session_type: 'RECORDED',
      lecture_type: 'RECORDED',
      status: 'PUBLISHED',
      duration_minutes: 14,
      recording_url: 'https://www.youtube.com/watch?v=-mJFZp84TIY',
      session_url: 'https://www.youtube.com/watch?v=-mJFZp84TIY',
      recording_provider: null,
      recording_status: 'AVAILABLE',
      noteTitle: 'Introduction to React Js + Installation — Setup Guide & Notes'
    },
    {
      id: 2,
      display_order: 2,
      title: 'Creating our first react app using create-react-app | Complete React Course in Hindi #2',
      description: 'Bootstrapping our first React app with create-react-app, exploring the project directory structure, package.json, and React scripts.',
      session_type: 'RECORDED',
      lecture_type: 'RECORDED',
      status: 'PUBLISHED',
      duration_minutes: 21,
      recording_url: 'https://www.youtube.com/watch?v=hnVOvvbQrwA',
      session_url: 'https://www.youtube.com/watch?v=hnVOvvbQrwA',
      recording_provider: null,
      recording_status: 'AVAILABLE',
      noteTitle: 'Creating Our First React App with create-react-app — Architecture Notes'
    },
    {
      id: 3,
      display_order: 3,
      title: 'JavaScript Refresher | Complete React Course in Hindi #3',
      description: 'Essential JavaScript refresher for React: ES6 syntax, arrow functions, destructuring, map, filter, reduce, and async/await.',
      session_type: 'RECORDED',
      lecture_type: 'RECORDED',
      status: 'PUBLISHED',
      duration_minutes: 27,
      recording_url: 'https://www.youtube.com/watch?v=kFe-RRaOy48',
      session_url: 'https://www.youtube.com/watch?v=kFe-RRaOy48',
      recording_provider: null,
      recording_status: 'AVAILABLE',
      noteTitle: 'JavaScript Refresher for React — Cheatsheet & Modern ES6 Reference'
    },
    {
      id: 4,
      display_order: 4,
      title: 'Understanding JSX | Complete React Course in Hindi #4',
      description: 'Mastering JSX (JavaScript XML), how JSX compiles to React.createElement, embedding expressions, and JSX styling conventions.',
      session_type: 'RECORDED',
      lecture_type: 'RECORDED',
      status: 'PUBLISHED',
      duration_minutes: 27,
      recording_url: 'https://www.youtube.com/watch?v=JvC7aA24m4Q',
      session_url: 'https://www.youtube.com/watch?v=JvC7aA24m4Q',
      recording_provider: null,
      recording_status: 'AVAILABLE',
      noteTitle: 'Understanding JSX & React Elements — Cheatsheet & Code Examples'
    },
    {
      display_order: 5,
      title: 'Project 1: Setup + Adding Bootstrap to React | Complete React Course in Hindi #5',
      description: 'Building our first real-world React project: setting up the component architecture and integrating Bootstrap for styling.',
      session_type: 'RECORDED',
      lecture_type: 'RECORDED',
      status: 'PUBLISHED',
      duration_minutes: 19,
      recording_url: 'https://www.youtube.com/watch?v=wa0IVAIqbo0',
      session_url: 'https://www.youtube.com/watch?v=wa0IVAIqbo0',
      recording_provider: null,
      recording_status: 'AVAILABLE',
      noteTitle: 'Project Setup + Adding Bootstrap to React — Architecture & Component Guide'
    }
  ];

  for (let i = 0; i < 4; i++) {
    const data = lecturesData[i];
    const lec = await Lecture.findByPk(data.id);
    if (lec) {
      await lec.update({
        title: data.title,
        description: data.description,
        session_type: data.session_type,
        lecture_type: data.lecture_type,
        status: data.status,
        duration_minutes: data.duration_minutes,
        display_order: data.display_order,
        recording_url: data.recording_url,
        session_url: data.session_url,
        recording_provider: data.recording_provider,
        recording_status: data.recording_status,
        published_at: lec.published_at || new Date()
      });
      console.log(`Updated Lecture ${data.id}: ${data.title}`);

      // Update associated note
      const note = await LectureNote.findOne({ where: { session_id: data.id } });
      if (note) {
        await note.update({ title: data.noteTitle });
        console.log(`  Updated Note for Lecture ${data.id}`);
      }
    }
  }

  // Handle 5th lecture
  const fifth = lecturesData[4];
  let lec5 = await Lecture.findOne({
    where: {
      module_id: 1,
      recording_url: fifth.recording_url
    }
  });

  if (!lec5) {
    lec5 = await Lecture.create({
      module_id: 1,
      instructor_id: 2,
      title: fifth.title,
      description: fifth.description,
      session_type: fifth.session_type,
      lecture_type: fifth.lecture_type,
      status: fifth.status,
      display_order: fifth.display_order,
      duration_minutes: fifth.duration_minutes,
      recording_url: fifth.recording_url,
      session_url: fifth.session_url,
      recording_provider: fifth.recording_provider,
      recording_status: fifth.recording_status,
      published_at: new Date(),
      created_by: 2,
      updated_by: 2
    });
    console.log(`Created Lecture 5 (ID: ${lec5.id}): ${lec5.title}`);
  } else {
    await lec5.update({
      title: fifth.title,
      description: fifth.description,
      session_type: fifth.session_type,
      lecture_type: fifth.lecture_type,
      status: fifth.status,
      display_order: fifth.display_order,
      duration_minutes: fifth.duration_minutes,
      recording_url: fifth.recording_url,
      session_url: fifth.session_url,
      recording_provider: fifth.recording_provider,
      recording_status: fifth.recording_status,
      published_at: new Date()
    });
    console.log(`Updated Lecture 5 (ID: ${lec5.id}): ${lec5.title}`);
  }

  // Check or create note for lecture 5
  let note5 = await LectureNote.findOne({ where: { session_id: lec5.id } });
  if (!note5) {
    await LectureNote.create({
      session_id: lec5.id,
      title: fifth.noteTitle,
      note_type: 'PDF',
      file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      external_url: 'https://react.dev',
      display_order: 1,
      status: 'ACTIVE',
      created_by: 2,
      updated_by: 2
    });
    console.log(`Created Note for Lecture 5`);
  }

  console.log('--- All 5 React lectures successfully synced! ---');
}

updateReactLectures()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error updating React lectures:', err);
    process.exit(1);
  });
