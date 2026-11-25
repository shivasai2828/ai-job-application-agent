const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Template = require('../src/models/Template');
const Resume = require('../src/models/Resume');
const Application = require('../src/models/Application');
const Settings = require('../src/models/Settings');
const applicationService = require('../src/services/applicationService');
const fs = require('fs');
const path = require('path');

const TARGET_EMAIL = 'shivasai.dev2026@gmail.com';

(async () => {
  console.log('Connecting to MongoDB...');
  await connectDB();

  // 1. Ensure Settings exist
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      yourName: 'Boddu Shivasai',
      phone: '+91 9876543210',
      linkedin: 'https://linkedin.com/in/shivasai',
    });
    console.log('Settings created');
  } else {
    console.log('Settings found for:', settings.yourName);
  }

  // 2. Ensure Resume exists in DB
  let resume = await Resume.findOne({ isDefault: true }) || await Resume.findOne();
  if (!resume) {
    const resumesDir = path.join(__dirname, '../uploads/resumes');
    const files = fs.readdirSync(resumesDir).filter(f => !fs.statSync(path.join(resumesDir, f)).isDirectory());
    if (files.length === 0) {
      throw new Error('No resume file found in uploads/resumes');
    }
    const fileName = files[0];
    const filePath = path.join(resumesDir, fileName);
    const stats = fs.statSync(filePath);

    resume = await Resume.create({
      label: 'Shiva Sai Full Stack Developer Resume',
      roleType: 'fullstack',
      originalName: 'shiva_sai_full_stack__developer.pdf',
      fileName: fileName,
      filePath: filePath,
      mimeType: 'application/pdf',
      size: stats.size,
      isDefault: true,
    });
    console.log('Registered resume in DB:', resume.label);
  } else {
    console.log('Using existing resume from DB:', resume.label, `(${resume.filePath})`);
  }

  // 3. Create or update Test Template
  const templateData = {
    name: 'Test Outreach Template',
    type: 'application',
    roleType: 'fullstack',
    subject: 'Application for {{role}} - {{your_name}} (Test)',
    body: `Hi {{hr_name}},

I am reaching out regarding the {{role}} opening at {{company}}.
This is a test email sent from the Job Outreach automation platform.

I have attached my resume for your review.

Best regards,
{{your_name}}
{{phone}}
{{linkedin}}`,
    defaultResume: resume._id,
    isActive: true,
  };

  const template = await Template.findOneAndUpdate(
    { name: templateData.name },
    templateData,
    { upsert: true, new: true, runValidators: true }
  );
  console.log('Template ready:', template.name);

  // 4. Create an Application draft
  console.log(`Creating test application for ${TARGET_EMAIL}...`);
  const { application } = await applicationService.createApplication({
    company: 'Test Company',
    role: 'Full Stack Developer',
    hrName: 'Shivasai',
    hrEmail: TARGET_EMAIL,
    jobDescription: 'Full Stack Developer position test description',
    template: template._id,
    resume: resume._id,
  });
  console.log('Application draft created with ID:', application._id);

  // 5. Send Application
  console.log('Sending email via Gmail API...');
  const sentApplication = await applicationService.sendApplication(application._id);
  console.log('\n=== SUCCESS! ===');
  console.log('Status:', sentApplication.status);
  console.log('Gmail Message ID:', sentApplication.gmailMessageId);
  console.log('Gmail Thread ID:', sentApplication.gmailThreadId);
  console.log('Sent at:', sentApplication.sentAt);

  await mongoose.disconnect();
  console.log('Disconnected from DB.');
  process.exit(0);
})().catch(async (error) => {
  console.error('\n=== TEST FAILED ===');
  console.error('Error message:', error.message);
  if (error.stack) console.error(error.stack);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
