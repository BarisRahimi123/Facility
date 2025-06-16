const fs = require('fs');
const path = require('path');

function restoreMaintenanceContact() {
  const filePath = path.join(__dirname, '..', 'src', 'app', 'actions', 'buildings.ts');
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Restore maintenance_contact in createBuildingSystem
    content = content.replace(
      /status: 'operational'\s+\/\/ Note: maintenance_contact column will be added after migration/g,
      `maintenance_contact: contactInfo,
      status: 'operational'`
    );
    
    // Restore maintenance_contact in updateBuildingSystem
    content = content.replace(
      /updated_at: new Date\(\)\.toISOString\(\)\s+\/\/ Note: maintenance_contact column will be added after migration/g,
      `maintenance_contact: contactInfo,
      updated_at: new Date().toISOString()`
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log('✅ Maintenance contact functionality restored!');
    console.log('Building systems will now save contact information properly.');
    
  } catch (error) {
    console.error('❌ Error restoring maintenance contact:', error);
  }
}

restoreMaintenanceContact(); 