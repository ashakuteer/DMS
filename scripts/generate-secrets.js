#!/usr/bin/env node

/**
 * Generate Strong Secrets for Deployment
 * 
 * Run this script to generate secure random strings for:
 * - JWT_SECRET
 * - JWT_REFRESH_SECRET
 * 
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('base64url');
}

console.log('\n🔐 Generated Secrets for Deployment\n');
console.log('Copy these to your Railway environment variables:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('JWT_SECRET:');
console.log(generateSecret());
console.log('\n');

console.log('JWT_REFRESH_SECRET:');
console.log(generateSecret());
console.log('\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('⚠️  IMPORTANT:');
console.log('   - Keep these secrets secure');
console.log('   - Never commit them to Git');
console.log('   - Use different secrets for each environment');
console.log('   - Store them safely (password manager recommended)');
console.log('\n');
