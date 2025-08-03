// backend/test-multer.js

const path = require('path');
const fs = require('fs');

console.log('🔍 Testing multer setup...');

// Check if multer is installed
try {
  const multer = require('multer');
  console.log('✅ Multer is installed');
} catch (error) {
  console.error('❌ Multer is NOT installed:', error.message);
  console.log('🛠️ Install multer with: npm install multer');
  process.exit(1);
}

// Check upload directory
const uploadPath = path.join(__dirname, 'public/uploads');
console.log('📁 Upload path:', uploadPath);

try {
  if (!fs.existsSync(uploadPath)) {
    console.log('📁 Creating uploads directory...');
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log('✅ Uploads directory created');
  } else {
    console.log('✅ Uploads directory exists');
  }
  
  // Test write permissions
  const testFile = path.join(uploadPath, 'test.txt');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('✅ Directory is writable');
  
} catch (error) {
  console.error('❌ Directory error:', error.message);
  process.exit(1);
}

console.log('🎉 All tests passed! Multer setup is ready.');
console.log('📝 Next steps:');
console.log('   1. Make sure your products route file is updated');
console.log('   2. Restart your server');
console.log('   3. Test the upload again');