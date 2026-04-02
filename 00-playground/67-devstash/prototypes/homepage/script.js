// Chaos Animation
class ChaosAnimation {
  constructor() {
    this.container = document.getElementById("chaosContainer");
    this.icons = [];
    this.mouse = { x: 0, y: 0 };
    this.containerRect = null;
    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    this.init();
  }

  init() {
    if (!this.container) return;

    // Don't animate if user prefers reduced motion
    if (this.reducedMotion) {
      // Position icons statically in a grid pattern
      const iconElements = this.container.querySelectorAll(".chaos-icon");
      const positions = [
        { x: 20, y: 20 },
        { x: 100, y: 30 },
        { x: 180, y: 20 },
        { x: 30, y: 100 },
        { x: 120, y: 110 },
        { x: 200, y: 100 },
        { x: 50, y: 200 },
        { x: 150, y: 210 },
      ];
      iconElements.forEach((el, i) => {
        if (positions[i]) {
          el.style.transform = `translate(${positions[i].x}px, ${positions[i].y}px)`;
        }
      });
      return;
    }

    const iconElements = this.container.querySelectorAll(".chaos-icon");
    this.containerRect = this.container.getBoundingClientRect();

    iconElements.forEach((el, index) => {
      const icon = {
        el,
        x: Math.random() * (this.containerRect.width - 40),
        y: Math.random() * (this.containerRect.height - 40),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        scale: 1,
        scaleDir: 1,
      };
      this.icons.push(icon);
      this.updatePosition(icon);
    });

    this.container.addEventListener("mousemove", (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.container.addEventListener("mouseleave", () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });

    this.animate();
  }

  updatePosition(icon) {
    icon.el.style.transform = `translate(${icon.x}px, ${icon.y}px) rotate(${icon.rotation}deg) scale(${icon.scale})`;
  }

  animate() {
    this.containerRect = this.container.getBoundingClientRect();
    const containerWidth = this.containerRect.width;
    const containerHeight = this.containerRect.height;
    const iconSize = 40;

    this.icons.forEach((icon) => {
      // Apply velocity
      icon.x += icon.vx;
      icon.y += icon.vy;

      // Bounce off walls
      if (icon.x <= 0 || icon.x >= containerWidth - iconSize) {
        icon.vx *= -1;
        icon.x = Math.max(0, Math.min(containerWidth - iconSize, icon.x));
      }
      if (icon.y <= 0 || icon.y >= containerHeight - iconSize) {
        icon.vy *= -1;
        icon.y = Math.max(0, Math.min(containerHeight - iconSize, icon.y));
      }

      // Mouse repulsion
      const dx = icon.x + iconSize / 2 - this.mouse.x;
      const dy = icon.y + iconSize / 2 - this.mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 80) {
        const force = (80 - distance) / 80;
        const angle = Math.atan2(dy, dx);
        icon.vx += Math.cos(angle) * force * 0.5;
        icon.vy += Math.sin(angle) * force * 0.5;
      }

      // Damping
      icon.vx *= 0.99;
      icon.vy *= 0.99;

      // Subtle rotation
      icon.rotation += icon.rotationSpeed;

      // Subtle scale pulsing
      icon.scale += icon.scaleDir * 0.002;
      if (icon.scale > 1.1) icon.scaleDir = -1;
      if (icon.scale < 0.9) icon.scaleDir = 1;

      this.updatePosition(icon);
    });

    requestAnimationFrame(() => this.animate());
  }
}

// Scroll Animations
class ScrollAnimations {
  constructor() {
    this.fadeElements = document.querySelectorAll(".fade-in");
    this.navbar = document.getElementById("navbar");
    this.init();
  }

  init() {
    // Initial check
    this.checkFadeIn();

    // Scroll listener
    window.addEventListener("scroll", () => {
      this.checkFadeIn();
      this.updateNavbar();
    });
  }

  checkFadeIn() {
    this.fadeElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top < windowHeight * 0.85) {
        el.classList.add("visible");
      }
    });
  }

  updateNavbar() {
    if (this.navbar) {
      if (window.scrollY > 50) {
        this.navbar.classList.add("scrolled");
      } else {
        this.navbar.classList.remove("scrolled");
      }
    }
  }
}

// Pricing Toggle
class PricingToggle {
  constructor() {
    this.toggle = document.getElementById("pricingToggle");
    this.proPrice = document.getElementById("proPrice");
    this.priceNote = document.getElementById("priceNote");
    this.isYearly = false;

    if (this.toggle) {
      this.toggle.addEventListener("click", () => this.togglePricing());
    }
  }

  togglePricing() {
    this.isYearly = !this.isYearly;
    this.toggle.classList.toggle("active", this.isYearly);

    if (this.isYearly) {
      this.proPrice.textContent = "$72";
      this.priceNote.textContent = "Billed yearly ($6/mo)";
    } else {
      this.proPrice.textContent = "$8";
      this.priceNote.textContent = "Billed monthly";
    }
  }
}

// Mobile Menu
class MobileMenu {
  constructor() {
    this.button = document.getElementById("mobileMenuBtn");
    this.menu = document.getElementById("mobileMenu");
    this.isOpen = false;

    if (this.button && this.menu) {
      this.button.addEventListener("click", () => this.toggle());

      // Close on link click
      this.menu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => this.close());
      });
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.menu.classList.toggle("active", this.isOpen);
    this.button.classList.toggle("active", this.isOpen);
  }

  close() {
    this.isOpen = false;
    this.menu.classList.remove("active");
    this.button.classList.remove("active");
  }
}

// Copy Button
class CopyButton {
  constructor() {
    const copyBtn = document.querySelector(".copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const code = document.querySelector(".editor-content code").textContent;
        navigator.clipboard.writeText(code).then(() => {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = "Copied!";
          setTimeout(() => {
            copyBtn.textContent = originalText;
          }, 2000);
        });
      });
    }
  }
}

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new ChaosAnimation();
  new ScrollAnimations();
  new PricingToggle();
  new MobileMenu();
  new CopyButton();
});
