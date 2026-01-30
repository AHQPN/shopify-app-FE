import fs from 'fs';
import path from 'path';

// 1. Read .env file manually
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Reading .env from: ${envPath}`);

if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
// Extract SPRING_API_URL and VITE_RECAPTCHA_SITE_KEY
const apiUrlMatch = envContent.match(/^VITE_SPRING_API_URL=["']?(.*?)["']?\s*$/m) || envContent.match(/^SPRING_API_URL=["']?(.*?)["']?\s*$/m);
const siteKeyMatch = envContent.match(/^VITE_RECAPTCHA_SITE_KEY=["']?(.*?)["']?\s*$/m);

const apiUrl = apiUrlMatch ? apiUrlMatch[1].trim() : null;
const siteKey = siteKeyMatch ? siteKeyMatch[1].trim() : '';

if (!apiUrl) {
    console.error('❌ Could not find VITE_SPRING_API_URL or SPRING_API_URL in .env');
    process.exit(1);
}

console.log(`Found Backend URL: ${apiUrl}`);
console.log(`Found reCAPTCHA Site Key: ${siteKey || '(empty)'}`);

// 2. Update Liquid file
const liquidPath = path.resolve(process.cwd(), 'extensions/discount-badge/blocks/product-reviews.liquid');

if (!fs.existsSync(liquidPath)) {
    console.error(`❌ Liquid file not found at: ${liquidPath}`);
    process.exit(1);
}

let content = fs.readFileSync(liquidPath, 'utf-8');

// Update API_URL
const apiRegex = /const API_URL = '.*';/;
let newContent = content.replace(apiRegex, `const API_URL = '${apiUrl}${apiUrl.endsWith('/api') ? '' : '/api'}';`);

// Update RECAPTCHA_SITE_KEY
const siteKeyRegex = /const RECAPTCHA_SITE_KEY = '.*';/;
if (siteKeyRegex.test(newContent)) {
    newContent = newContent.replace(siteKeyRegex, `const RECAPTCHA_SITE_KEY = '${siteKey}';`);
}

if (content !== newContent) {
    fs.writeFileSync(liquidPath, newContent);
    console.log(`✅ Successfully updated product-reviews.liquid`);
} else {
    console.log('✨ Theme Extension is already up to date.');
}
