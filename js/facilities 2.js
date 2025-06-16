// Sample facility data (in a real application, this would come from a database)
const sampleFacilities = [
  {
    id: 1,
    name: 'Main Office Building',
    address: '123 Business Ave, Suite 100, New York, NY 10001',
    image: 'images/office-building.jpg',
    squareFootage: '25,000 sq ft',
    floors: 5,
    occupancy: '250 people'
  },
  {
    id: 2,
    name: 'Manufacturing Plant',
    address: '456 Industrial Blvd, Chicago, IL 60007',
    image: 'images/manufacturing-plant.jpg',
    squareFootage: '75,000 sq ft',
    floors: 2,
    occupancy: '120 people'
  },
  {
    id: 3,
    name: 'Research Center',
    address: '789 Innovation Way, San Francisco, CA 94103',
    image: 'images/research-center.jpg',
    squareFootage: '30,000 sq ft',
    floors: 3,
    occupancy: '85 people'
  },
  {
    id: 4,
    name: 'Distribution Warehouse',
    address: '101 Logistics Pkwy, Dallas, TX 75001',
    image: 'images/warehouse.jpg',
    squareFootage: '100,000 sq ft',
    floors: 1,
    occupancy: '60 people'
  }
];

// Function to display facilities
function displayFacilities() {
  const facilitiesContainer = document.querySelector('.facilities-container');
  
  // Clear existing content
  if (facilitiesContainer) {
    facilitiesContainer.innerHTML = '';
    
    // Add each facility card
    sampleFacilities.forEach(facility => {
      const facilityCard = document.createElement('div');
      facilityCard.className = 'facility-card';
      
      // Use a placeholder image if the actual image doesn't exist
      const imageSrc = facility.image || 'images/placeholder.jpg';
      
      facilityCard.innerHTML = `
        <img src="${imageSrc}" alt="${facility.name}" class="facility-image" onerror="this.src='images/placeholder.jpg'">
        <div class="facility-info">
          <h3 class="facility-name">${facility.name}</h3>
          <p class="facility-address">${facility.address}</p>
          <div class="facility-stats">
            <span>${facility.squareFootage}</span>
            <span>${facility.floors} ${facility.floors > 1 ? 'floors' : 'floor'}</span>
            <span>${facility.occupancy}</span>
          </div>
        </div>
      `;
      
      // Add click event to view facility details
      facilityCard.addEventListener('click', () => {
        viewFacilityDetails(facility.id);
      });
      
      facilitiesContainer.appendChild(facilityCard);
    });
  }
}

// Function to view facility details (placeholder for future implementation)
function viewFacilityDetails(facilityId) {
  console.log(`Viewing details for facility ID: ${facilityId}`);
  // In a real application, this would navigate to a details page or open a modal
  alert(`Viewing details for: ${sampleFacilities.find(f => f.id === facilityId).name}`);
}

// Function to handle the add facility form submission
function handleAddFacilityForm() {
  const addFacilityForm = document.getElementById('add-facility-form');
  
  if (addFacilityForm) {
    addFacilityForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form values
      const name = document.getElementById('facility-name').value;
      const address = document.getElementById('facility-address').value;
      const squareFootage = document.getElementById('square-footage').value + ' sq ft';
      const floors = document.getElementById('floors').value;
      const occupancy = document.getElementById('occupancy').value + ' people';
      
      // Create new facility object
      const newFacility = {
        id: sampleFacilities.length + 1,
        name,
        address,
        image: 'images/placeholder.jpg', // Use placeholder for new facilities
        squareFootage,
        floors,
        occupancy
      };
      
      // Add to sample data
      sampleFacilities.push(newFacility);
      
      // Refresh the display
      displayFacilities();
      
      // Reset form
      addFacilityForm.reset();
      
      // Show success message
      alert('Facility added successfully!');
      
      // Redirect back to facilities list (in a real app, this would navigate to the facilities page)
      window.location.href = 'facilities.html';
    });
  }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  // Display facilities if we're on the facilities list page
  if (document.querySelector('.facilities-container')) {
    displayFacilities();
  }
  
  // Set up form handler if we're on the add facility page
  handleAddFacilityForm();
}); 