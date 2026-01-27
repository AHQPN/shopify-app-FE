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
// Extract SPRING_API_URL (handling optional quotes or whitespace)
const match = envContent.match(/^SPRING_API_URL=["']?(.*?)["']?\s*$/m);
const apiUrl = match ? match[1].trim() : null;

if (!apiUrl) {
    console.error('❌ Could not find SPRING_API_URL in .env');
    process.exit(1);
}

console.log(`Found Backend URL: ${apiUrl}`);

// 2. Update Liquid file
const liquidPath = path.resolve(process.cwd(), 'extensions/discount-badge/blocks/product-reviews.liquid');

if (!fs.existsSync(liquidPath)) {
    console.error(`❌ Liquid file not found at: ${liquidPath}`);
    process.exit(1);
}

let content = fs.readFileSync(liquidPath, 'utf-8');
const regex = /const API_URL = '.*';/;

if (!regex.test(content)) {
    console.error('❌ Could not find "const API_URL = ...;" pattern in liquid file.');
    process.exit(1);
}

const newContent = content.replace(regex, `const API_URL = '${apiUrl}/api';`);

if (content !== newContent) {
    fs.writeFileSync(liquidPath, newContent);
    console.log(`✅ Successfully updated API_URL in product-reviews.liquid`);
} else {
    console.log('✨ Theme Extension URL is already up to date.');
}
