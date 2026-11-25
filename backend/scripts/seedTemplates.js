const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Template = require('../src/models/Template');

const templates = [
  {
    name: 'Full Stack - Application',
    type: 'application',
    roleType: 'fullstack',
    subject: 'Application for {{role}} - {{your_name}}',
    body: `Hi {{hr_name}},

I came across the {{role}} opening at {{company}} and would like to apply. I am a full-stack developer with around 2 years of experience building production applications with the MERN stack (MongoDB, Express, React, Node.js), including REST APIs, authentication and multi-tenant systems.

I have attached my resume for your review. I would be glad to discuss how I can contribute to your team.

Thank you for your time.

Regards,
{{your_name}}
{{phone}}
{{linkedin}}`,
  },
  {
    name: 'Agent Integration - Application',
    type: 'application',
    roleType: 'agent',
    subject: 'Application for {{role}} - {{your_name}}',
    body: `Hi {{hr_name}},

I am applying for the {{role}} position at {{company}}. I am an AI-integrated full-stack developer with around 2 years of experience. Alongside the MERN stack, I build agentic AI systems using LangChain, LangGraph, RAG pipelines, FastAPI and ChromaDB, including a no-code multi-agent workflow automation platform.

I have attached my resume. I would love to discuss how I can help {{company}} build and ship AI-powered features.

Thank you for your time.

Regards,
{{your_name}}
{{phone}}
{{linkedin}}`,
  },
  {
    name: 'Follow-up 1',
    type: 'follow_up_1',
    roleType: 'general',
    subject: 'Re: Follow-up', // ignored: follow-ups always use "Re: <original subject>"
    body: `Hi {{hr_name}},

I wanted to follow up on my application for the {{role}} position at {{company}}. I remain very interested in the role and would be happy to share any additional details about my experience.

Thank you for your time and consideration.

Regards,
{{your_name}}
{{phone}}`,
  },
  {
    name: 'Follow-up 2',
    type: 'follow_up_2',
    roleType: 'general',
    subject: 'Re: Follow-up', // ignored: follow-ups always use "Re: <original subject>"
    body: `Hi {{hr_name}},

I am following up once more regarding the {{role}} position at {{company}}. If the role is still open, I would love the opportunity to speak with you. If it has been filled, I would appreciate it if you could keep my profile in mind for future openings.

Thank you again for your time.

Regards,
{{your_name}}
{{phone}}`,
  },
];

(async () => {
  await connectDB();

  for (const template of templates) {
    await Template.findOneAndUpdate({ name: template.name }, template, {
      upsert: true,
      new: true,
      runValidators: true,
    });
    console.log(`Seeded: ${template.name}`);
  }

  await mongoose.disconnect();
})().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
