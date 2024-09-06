import { Component, h, State, Prop, Element, Event, EventEmitter, Listen } from '@stencil/core';

@Component({
  tag: 'admir-carousel-3d',
  styleUrl: 'admir-carousel-3d.css',
  shadow: true
})
export class Carousel3D {
  @Prop() items: string;
  @Prop() height: number;
  @Prop() width: number;
  @Prop() iterationCount: number = 1;
  @Prop() timingFunction: string = 'ease-in-out';
  @Prop() animationDuration: string = '1s';
  @Prop() elevationAngle: number = 0;
  @Prop() rotateXAngle: number = 0;  // Changed from elevationAngle
  @Prop() rotateZAngle: number = 30;  // Changed from elevationAngle

  @State() currentIndex: number = 0;
  @State() currentIteration: number = 0;
  @State() isPaused: boolean = false;

  private parsedItems: Array<{ image: string; delay: number }> = [];
  private rotationAngle: number;
  private timeoutId: any = null;
  private carouselElement!: HTMLElement;
  private videoRefs: { [key: number]: HTMLVideoElement } = {};

  private basePerspective: number = 1000;
  private perspective: number;
  private translateZ: number;

  @Element() el: HTMLElement;

  @Event() slideInView: EventEmitter<number>;
  @Event() animationEndWithDelay: EventEmitter<{ index: number, delay: number }>;

  @Listen('animationEndWithDelay', { target: 'window' })
  handleAnimationEndWithDelay(event: CustomEvent) {
    const currentTime = new Date().toLocaleTimeString();
    console.log(`[${currentTime}] Animation ended for slide ${event.detail.index + 1} with a delay of ${event.detail.delay} seconds`);
  }

  componentWillLoad() {
    this.parsedItems = JSON.parse(this.items);
    this.rotationAngle = 360 / this.parsedItems.length;
    this.translateZ = this.calculateTranslateZ(this.parsedItems.length);
    this.perspective = this.calculatePerspective(this.parsedItems.length);
  }

  componentDidLoad() {
    this.currentIteration = 0;
    this.el.style.setProperty('--admir-carousel-width', `${this.width}px`);
    this.el.style.setProperty('--admir-carousel-height', `${this.height}px`);

    this.carouselElement.addEventListener('transitionend', this.onTransitionEnd.bind(this));

    this.emitSlideInView();
    this.emitAnimationEndWithDelay(true);

    this.startAutoRotation();
  }

  private calculateTranslateZ(itemCount: number): number {
    return (this.width / 2) / Math.tan(Math.PI / itemCount);
  }

  private calculatePerspective(itemCount: number): number {
    return this.basePerspective / Math.cos(Math.PI / itemCount);
  }

  private isVideo(url: string): boolean {
    const videoExtensions = ['.mp4', '.webm', '.ogg'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  }

  private renderMediaElement(item: { image: string; delay: number }, index: number) {
    if (this.isVideo(item.image)) {
      return (
        <video
          ref={(el) => {
            if (el) this.videoRefs[index] = el;
          }}
          muted
          playsInline
          loop
        >
          <source src={item.image} type={`video/${item.image.split('.').pop()}`} />
          Your browser does not support the video tag.
        </video>
      );
    } else {
      return <img src={item.image} alt="Carousel item" loading="lazy" />;
    }
  }

  private emitSlideInView() {
    const currentTime = new Date().toLocaleTimeString();
    const currentItem = this.parsedItems[this.currentIndex];
    const fileType = this.isVideo(currentItem.image) ? 'video' : 'image';
    console.log(`[${currentTime}] Slide ${this.currentIndex + 1} is fully in view. File type: ${fileType}`);
    this.slideInView.emit(this.currentIndex);

    if (fileType === 'video') {
      const video = this.videoRefs[this.currentIndex];
      if (video) {
        video.play().catch(e => console.error('Error playing video:', e));
      }
    }

    Object.entries(this.videoRefs).forEach(([index, video]) => {
      if (parseInt(index) !== this.currentIndex) {
        video.pause();
        video.currentTime = 0;
      }
    });
  }

  private emitAnimationEndWithDelay(isInitialSlide = false) {
    const currentItem = this.parsedItems[this.currentIndex];
    const delay = currentItem.delay * 1000;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.timeoutId = setTimeout(() => {
      this.animationEndWithDelay.emit({
        index: this.currentIndex,
        delay: currentItem.delay
      });

      if (isInitialSlide) {
        this.handleAnimationEndWithDelay(new CustomEvent('animationEndWithDelay', {
          detail: { index: this.currentIndex, delay: currentItem.delay }
        }));
      }

      this.rotateCarousel('next');
    }, delay);
  }

  private onTransitionEnd(_event: TransitionEvent) {
    this.emitSlideInView();
    this.emitAnimationEndWithDelay();
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
      this.currentIteration++;

      if (this.currentIteration >= this.iterationCount) {
        this.isPaused = true;
        return;
      }
    }

    if (previousIndex === this.parsedItems.length - 1 && this.currentIndex === 0) {
      this.handleWrapAround('next');
    } else if (previousIndex === 0 && this.currentIndex === this.parsedItems.length - 1) {
      this.handleWrapAround('prev');
    } else {
      this.updateCarousel();
    }
  }

  private handleWrapAround(direction: 'next' | 'prev') {
    const wrapAngle = direction === 'next' ? this.rotationAngle : -this.rotationAngle;
    const carouselRotation = -this.currentIndex * this.rotationAngle + wrapAngle;

    this.carouselElement.style.transition = 'none';
    this.carouselElement.style.transform = `rotateX(${this.rotateXAngle}deg) rotateY(${carouselRotation}deg)`;

    this.carouselElement.getBoundingClientRect();

    setTimeout(() => {
      this.carouselElement.style.transition = `transform ${this.animationDuration} ${this.timingFunction}`;
      this.updateCarousel();
    }, 20);
  }

  private updateCarousel() {
    const carouselRotation = -this.currentIndex * this.rotationAngle;
    this.carouselElement.style.transition = `transform ${this.animationDuration} ${this.timingFunction}`;
    this.carouselElement.style.transform = `rotateX(${this.rotateXAngle}deg) rotateY(${carouselRotation}deg)`;
  }

  private startAutoRotation() {
    if (this.currentIteration < this.iterationCount) {
      this.emitAnimationEndWithDelay();
    }
  }

  private pauseOnItem(index: number) {
    if (this.isPaused) return;

    this.isPaused = true;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.currentIndex = index;
    this.updateCarousel();

    setTimeout(() => {
      this.isPaused = false;
      this.startAutoRotation();
    }, 2000);
  }

  render() {
    const itemWidth = this.width;
    const itemHeight = this.height;

    return (
      <div
        class="carousel-container"
        style={{ 
          width: `${this.width}px`, 
          height: `${this.height}px`, 
          perspective: `${this.perspective}px`,
          transform: `rotateZ(${this.rotateZAngle}deg)` 
        }}
      >
        <div
          class="carousel"
          ref={el => this.carouselElement = el as HTMLElement}
          style={{
            transform: `rotateX(${this.rotateXAngle}deg)` 
          }}
        >
          {this.parsedItems.map((item, index) => (
            <div
              class="carousel-item"
              style={{
                width: `${itemWidth}px`,
                height: `${itemHeight}px`,
                transform: `rotateY(${index * this.rotationAngle}deg) translateZ(${this.translateZ}px)`
              }}
              onClick={() => this.pauseOnItem(index)}
            >
              {this.renderMediaElement(item, index)}
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
