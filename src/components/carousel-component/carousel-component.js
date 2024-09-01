document.addEventListener('DOMContentLoaded', function() {
  const carouselInner = document.querySelector('.carousel-inner');
  const items = document.querySelectorAll('.carousel-item');
  const itemCount = items.length;
  const angle = 360 / itemCount; // Calculate the angle based on the number of items
  let currentIndex = 0;

  // Apply initial transforms to each item
  items.forEach((item, index) => {
    const rotateY = index * angle;
    item.style.transform = `rotateY(${rotateY}deg) translateZ(300px)`; // Adjusted translateZ value
  });

  function updateCarousel() {
    const rotateY = currentIndex * -angle;
    carouselInner.style.transform = `translateZ(-300px) rotateY(${rotateY}deg)`;
  }

  function showNextItem() {
    currentIndex = (currentIndex + 1) % itemCount;
    updateCarousel();
  }

  setInterval(showNextItem, 3000); // Change item every 3 seconds
  updateCarousel(); // Initial update
});