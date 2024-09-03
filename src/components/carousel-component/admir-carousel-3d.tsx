import { Component, h, State, Prop, Element } from '@stencil/core';

@Component({
  tag: 'admir-carousel-3d',
  styleUrl: 'admir-carousel-3d.css',
  shadow: true
})
export class Carousel3D {
  @Prop() items: string; // Receive the items as a string
  @Prop() height: number; // Receive height as a prop
  @Prop() width: number;  // Receive width as a prop
  @Prop() iterationCount: number = 1; // Number of iterations

  @State() currentIndex: number = 0;
  @State() isPaused: boolean = false;
  private parsedItems: Array<{ image: string; delay: number }> = [];
  private rotationAngle: number;
  private timeoutId: any = null;
  private carouselElement!: HTMLElement;

  // Dimensions and perspective
  private basePerspective: number = 1000;
  private perspective: number;
  private translateZ: number;

  @Element() el: HTMLElement; // Reference to the component element

  componentWillLoad() {
    // Parse the items from the prop
    this.parsedItems = JSON.parse(this.items);

    this.rotationAngle = 360 / this.parsedItems.length;

    // Calculate the appropriate translateZ based on the number of items
    this.translateZ = this.calculateTranslateZ(this.parsedItems.length);

    // Adjust the perspective to keep items the same size
    this.perspective = this.calculatePerspective(this.parsedItems.length);
  }

  private calculateTranslateZ(itemCount: number): number {
    return (this.width / 2) / Math.tan(Math.PI / itemCount);
  }

  private calculatePerspective(itemCount: number): number {
    return this.basePerspective / Math.cos(Math.PI / itemCount);
  }

  componentDidLoad() {
    this.el.style.setProperty('--admir-carousel-width', `${this.width}px`);
    this.el.style.setProperty('--admir-carousel-height', `${this.height}px`);

    this.startAutoRotation(); // Start automatic rotation when the component loads
  }

  private rotateCarousel(direction: 'prev' | 'next') {
    if (this.isPaused) return;
  
    const previousIndex = this.currentIndex;
  
    if (direction === 'next') {
      this.currentIndex = (this.currentIndex + 1) % this.parsedItems.length;
    } else {
      this.currentIndex = (this.currentIndex - 1 + this.parsedItems.length) % this.parsedItems.length;
    }
  
    if (previousIndex === this.parsedItems.length - 1 && this.currentIndex === 0) {
      this.handleWrapAround('next');
    } else if (previousIndex === 0 && this.currentIndex === this.parsedItems.length - 1) {
      this.handleWrapAround('prev');
    } else {
      this.updateCarousel();
    }
  
    this.startAutoRotation();
  }
  
  

  private handleWrapAround(direction: 'next' | 'prev') {
    // Adjust rotation to +36 degrees for a smoother transition to the next slide
    const rotation = direction === 'next' ? 36 : -36;
    this.carouselElement.style.transition = 'none'; // Temporarily disable transition
    this.carouselElement.style.transform = `rotateY(${rotation}deg)`;
  
    console.log(`Handle wrap-around: rotation ${rotation} degrees`);
  
    // Force a reflow to apply the transform immediately
    this.carouselElement.getBoundingClientRect();
  
    // Re-enable transition and reset rotation
    setTimeout(() => {
      this.carouselElement.style.transition = 'transform 1s ease-in-out';
      this.updateCarousel();
    }, 20);
  }
  
  
  

  private updateCarousel() {
    const rotation = -this.currentIndex * this.rotationAngle;
    this.carouselElement.style.transition = 'transform 1s ease-in-out';
    this.carouselElement.style.transform = `rotateY(${rotation}deg)`;
  
    console.log(`Updating carousel: rotation ${rotation} degrees`);
  }
  
  

  private startAutoRotation() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    const currentItem = this.parsedItems[this.currentIndex];
    this.timeoutId = setTimeout(() => {
      this.rotateCarousel('next');
    }, currentItem.delay * 1000);

    console.log(`Starting auto-rotation. Next rotation in ${currentItem.delay} seconds`);
  }

  private pauseOnItem(index: number) {
    if (this.isPaused) return;

    this.isPaused = true;

    // Remove auto-rotation animation
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Update carousel to the paused position
    this.currentIndex = index;
    this.updateCarousel();

    // Resume animation after a short delay
    setTimeout(() => {
      this.isPaused = false;
      this.startAutoRotation(); // Restart the automatic rotation
    }, 2000); // Fixed delay for resuming

    console.log(`Paused on item ${index}`);
  }

  render() {
    const itemWidth = this.width;
    const itemHeight = this.height;
  
    return (
      <div
        class="carousel-container"
        style={{ width: `${this.width}px`, height: `${this.height}px`, perspective: `${this.perspective}px` }}
      >
        <div
          class="carousel"
          ref={el => this.carouselElement = el as HTMLElement}
        >
          {this.parsedItems.map((item, index) => (
            <div
              class="carousel-item"
              style={{
                width: `${itemWidth}px`,
                height: `${itemHeight}px`,
                backgroundColor: `hsl(${index * 60}, 100%, 50%)`,
                backgroundImage: `url(${item.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: `rotateY(${index * this.rotationAngle}deg) translateZ(${this.translateZ}px)`
              }}
              onClick={() => this.pauseOnItem(index)}
            >
              {/* Add a text element to show the delay duration */}
              <div class="duration-label">
                {item.delay} s
              </div>
            </div>
          ))}
        </div>
        <div class="controls">
          <button onClick={() => this.rotateCarousel('prev')}>Previous</button>
          <button onClick={() => this.rotateCarousel('next')}>Next</button>
        </div>
      </div>
    );
  }
  
}
