import { newSpecPage } from '@stencil/core/testing';
import { Carousel3D } from './admir-carousel-3d';

describe('admir-carousel-3d', () => {
  // Setup and teardown for timer mocks
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders', async () => {
    const { root } = await newSpecPage({
      components: [Carousel3D],
      html: '<admir-carousel-3d></admir-carousel-3d>',
    });
    expect(root).toBeTruthy();
  });

  it('renders with props', async () => {
    const items = JSON.stringify([
      { image: 'image1.jpg', delay: 3 },
      { image: 'image2.jpg', delay: 4 },
    ]);
    const { root } = await newSpecPage({
      components: [Carousel3D],
      html: `<admir-carousel-3d items='${items}' width="200" height="150"></admir-carousel-3d>`,
    });
    expect(root).toBeTruthy();
    expect(root.querySelector('.carousel-container')).toBeTruthy();
    expect(root.querySelectorAll('.carousel-item').length).toBe(2);
  });

  it('rotates carousel on button click', async () => {
    const items = JSON.stringify([
      { image: 'image1.jpg', delay: 3 },
      { image: 'image2.jpg', delay: 4 },
    ]);
    const page = await newSpecPage({
      components: [Carousel3D],
      html: `<admir-carousel-3d items='${items}' width="200" height="150"></admir-carousel-3d>`,
    });

    const component = page.rootInstance as Carousel3D;
    const nextButton = page.root.querySelector('button:nth-child(2)') as HTMLButtonElement;

    expect(component.currentIndex).toBe(0);
    nextButton.click();
    await page.waitForChanges();
    expect(component.currentIndex).toBe(1);
  });

  it('emits slideInView event after component loads', async () => {
    const items = JSON.stringify([
      { image: 'image1.jpg', delay: 3 },
      { image: 'image2.jpg', delay: 4 },
    ]);
    const page = await newSpecPage({
      components: [Carousel3D],
      html: `<admir-carousel-3d items='${items}' width="200" height="150"></admir-carousel-3d>`,
    });

    const component = page.rootInstance as Carousel3D;
    const slideInViewSpy = jest.fn();
    component.slideInView.emit = slideInViewSpy;

    // Trigger componentDidLoad manually
    await component.componentDidLoad();

    // The event should have been emitted during componentDidLoad
    expect(slideInViewSpy).toHaveBeenCalledWith(0);
  });

  it('pauses on item click', async () => {
    const items = JSON.stringify([
      { image: 'image1.jpg', delay: 3 },
      { image: 'image2.jpg', delay: 4 },
    ]);
    const page = await newSpecPage({
      components: [Carousel3D],
      html: `<admir-carousel-3d items='${items}' width="200" height="150"></admir-carousel-3d>`,
    });

    const component = page.rootInstance as Carousel3D;
    const firstItem = page.root.querySelector('.carousel-item') as HTMLElement;

    expect(component.isPaused).toBe(false);
    firstItem.click();
    await page.waitForChanges();
    expect(component.isPaused).toBe(true);

    // Fast-forward time instead of waiting
    jest.advanceTimersByTime(2100);
    await page.waitForChanges();

    expect(component.isPaused).toBe(false);
  });
});