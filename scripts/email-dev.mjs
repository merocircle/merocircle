#!/usr/bin/env node

/**
 * Email Development Server
 * A custom dev server for previewing all email templates
 * Uses Next.js API routes instead of react-email CLI to avoid compatibility issues
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('\nStarting Email Development Server...\n');

// Start Next.js dev server
const nextDev = spawn('npm', ['run', 'dev'], {
  cwd: projectRoot,
  shell: true,
  stdio: 'inherit',
});

nextDev.on('spawn', () => {
  setTimeout(() => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Email Development Server is running!\n');
    console.log('Available email previews:\n');
    console.log('   • Post Notification:');
    console.log('     http://localhost:3000/api/email-preview?type=post\n');
    console.log('   • Poll Notification:');
    console.log('     http://localhost:3000/api/email-preview?type=poll\n');
    console.log('   • Welcome Email:');
    console.log('     http://localhost:3000/api/email-preview?type=welcome\n');
    console.log('   • Payment Success:');
    console.log('     http://localhost:3000/api/email-preview?type=payment-success\n');
    console.log('   • Payment Failed:');
    console.log('     http://localhost:3000/api/email-preview?type=payment-failed\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Tip: Edit templates in emails/templates/ and refresh to see changes\n');
    console.log('Press Ctrl+C to stop\n');
  }, 3000);
});

nextDev.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\nShutting down email dev server...\n');
  nextDev.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  nextDev.kill('SIGTERM');
  process.exit(0);
});
