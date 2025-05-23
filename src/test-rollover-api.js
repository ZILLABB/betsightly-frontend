// Simple test script to check the rollover predictions API endpoint
console.log('Testing rollover predictions API endpoint...');

// Fetch data from the API endpoint
fetch('http://localhost:8000/api/predictions/categories')
  .then(response => {
    console.log('Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('API response data structure:', Object.keys(data));
    
    // Check if categories exist
    if (data.categories) {
      console.log('Categories available:', Object.keys(data.categories));
      
      // Check if rollover category exists
      if (data.categories.rollover) {
        console.log('Rollover category found!');
        console.log('Rollover data:', data.categories.rollover);
        
        // Check if days exist in rollover
        if (data.categories.rollover.days) {
          console.log('Days in rollover:', data.categories.rollover.days.length);
          
          // Log the first day as an example
          if (data.categories.rollover.days.length > 0) {
            console.log('First day example:', data.categories.rollover.days[0]);
          } else {
            console.log('No days found in rollover data');
          }
        } else {
          console.log('No days property found in rollover data');
        }
      } else {
        console.log('No rollover category found in the API response');
      }
    } else {
      console.log('No categories found in the API response');
    }
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });
