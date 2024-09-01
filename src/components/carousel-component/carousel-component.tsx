import { Component, h, State, Element, Prop, Watch } from '@stencil/core';

@Component({
  tag: 'carousel-component',
  styleUrl: 'carousel-component.css',
  shadow: true,
})
export class CarouselComponent {
  @State() currentIndex: number = 0;
  @Element() el: HTMLElement;
  items: { src: string; delay: number }[] = [];
  timer: number;

  @Prop() width: string = '300px'; // Default width
  @Prop() height: string = '400px'; // Default height
  @Prop() itemsProp: string; // Items prop as a string

  @Watch('itemsProp')
  parseItemsProp(newValue: string) {
    console.log('itemsProp changed:', newValue); // Log itemsProp change
    if (newValue) {
      try {
        this.items = JSON.parse(newValue);
        console.log('Parsed items:', this.items); // Log parsed items
      } catch (e) {
        console.error('Failed to parse itemsProp:', e);
      }
    }
  }

  componentWillLoad() {
    console.log('componentWillLoad itemsProp:', this.itemsProp); // Log itemsProp before component loads
    this.parseItemsProp(this.itemsProp);
  }

  componentDidLoad() {
    this.el.style.setProperty('--admir-carousel-width', this.width);
    this.el.style.setProperty('--admir-carousel-height', this.height);

    console.log(`Carousel width set to: ${this.width}`); // Console log the width

    this.updateCarousel();
    this.startTimer();
  }

  disconnectedCallback() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  startTimer() {
    const currentDelay = this.items[this.currentIndex].delay;
    this.timer = window.setTimeout(() => this.showNextItem(), currentDelay);
  }

  updateCarousel() {
    const itemCount = this.items.length;
    const angle = 360 / itemCount; // Calculate the angle based on the number of items
    const rotateY = this.currentIndex * -angle;
    const carouselInner = this.el.shadowRoot.querySelector('.carousel-inner') as HTMLElement;
    carouselInner.style.transform = `translateZ(calc(var(--admir-carousel-width) / -2)) rotateY(${rotateY}deg)`; // Adjusted translateZ value

    // Apply initial transforms to each item
    this.items.forEach((_item, index) => {
      const itemRotateY = index * angle;
      const carouselItem = this.el.shadowRoot.querySelector(`.carousel-item:nth-child(${index + 1})`) as HTMLElement;
      carouselItem.style.transform = `rotateY(${itemRotateY}deg) translateZ(calc(var(--admir-carousel-width) / 2))`; // Adjusted translateZ value
    });
  }

  showNextItem() {
    this.currentIndex = (this.currentIndex + 1) % this.items.length;
    this.updateCarousel();
    this.startTimer(); // Restart the timer with the new item's delay
  }

  render() {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple']; // Define colors for items

    return (
      <div class="carousel">
        <div class="carousel-inner">
          {this.items.map((item, index) => (
            <div 
              class="carousel-item" 
              style={{ 
                backgroundColor: colors[index % colors.length],
                backgroundImage: item.src ? `url(${item.src})` : 'none',
                backgroundBlendMode: 'multiply',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontSize: '24px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              <div>Item {index + 1}</div>
              <div style={{ fontSize: '18px', marginTop: '10px' }}>
                Delay: {item.delay}ms
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}