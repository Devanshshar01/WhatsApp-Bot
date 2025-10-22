// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const navLinks = document.querySelectorAll('.nav__link');
const filterButtons = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');
const sections = document.querySelectorAll('.section');

// Theme Management
class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme();
        this.init();
    }

    getStoredTheme() {
        return localStorage.getItem('portfolio-theme') || 
               (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    init() {
        this.setTheme(this.currentTheme);
        this.bindEvents();
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-color-scheme', theme);
        this.currentTheme = theme;
        localStorage.setItem('portfolio-theme', theme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    bindEvents() {
        themeToggle?.addEventListener('click', () => this.toggleTheme());
    }
}

// Navigation Manager
class NavigationManager {
    constructor() {
        this.isMenuOpen = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupIntersectionObserver();
    }

    bindEvents() {
        // Mobile menu toggle
        navToggle?.addEventListener('click', () => this.toggleMobileMenu());

        // Navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        navMenu?.classList.toggle('show', this.isMenuOpen);
        navToggle?.classList.toggle('active', this.isMenuOpen);
        document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
    }

    closeMobileMenu() {
        this.isMenuOpen = false;
        navMenu?.classList.remove('show');
        navToggle?.classList.remove('active');
        document.body.style.overflow = '';
    }

    handleNavClick(e) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        
        if (targetId && targetId.startsWith('#')) {
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                this.scrollToSection(targetSection);
                this.closeMobileMenu();
            }
        }
    }

    scrollToSection(section) {
        const headerHeight = 60;
        const targetPosition = section.offsetTop - headerHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    setupIntersectionObserver() {
        const observerOptions = {
            root: null,
            rootMargin: '-50px 0px -50px 0px',
            threshold: 0.3
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.updateActiveNavLink(entry.target.id);
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            if (section.id) {
                observer.observe(section);
            }
        });
    }

    updateActiveNavLink(sectionId) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
    }
}

// Project Filter Manager
class ProjectFilterManager {
    constructor() {
        this.activeFilter = 'all';
        this.init();
    }

    init() {
        this.bindEvents();
        this.showAllProjects();
    }

    bindEvents() {
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleFilterClick(e));
        });
    }

    handleFilterClick(e) {
        const filter = e.target.dataset.filter;
        
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // Filter projects
        this.filterProjects(filter);
        this.activeFilter = filter;
    }

    filterProjects(filter) {
        projectCards.forEach(card => {
            const category = card.dataset.category;
            const shouldShow = filter === 'all' || category === filter;
            
            if (shouldShow) {
                this.showProject(card);
            } else {
                this.hideProject(card);
            }
        });
    }

    showProject(card) {
        card.style.display = 'block';
        card.classList.remove('hidden');
        card.classList.add('visible');
    }

    hideProject(card) {
        card.classList.add('hidden');
        card.classList.remove('visible');
        setTimeout(() => {
            if (card.classList.contains('hidden')) {
                card.style.display = 'none';
            }
        }, 250);
    }

    showAllProjects() {
        projectCards.forEach(card => this.showProject(card));
    }
}

// Animation Manager
class AnimationManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupHoverAnimations();
    }

    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.card, .skill-category, .contact__item');
        
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -100px 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        animatedElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            observer.observe(element);
        });
    }

    setupHoverAnimations() {
        // Add smooth hover effects to cards
        const cards = document.querySelectorAll('.project-card, .skill-category, .contact__item');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }
}

// Smooth Scroll Enhancement
class SmoothScrollManager {
    constructor() {
        this.init();
    }

    init() {
        // Handle all internal links
        const internalLinks = document.querySelectorAll('a[href^="#"]');
        
        internalLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleSmoothScroll(e));
        });
    }

    handleSmoothScroll(e) {
        const targetId = e.target.getAttribute('href');
        
        if (targetId && targetId !== '#') {
            e.preventDefault();
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = 60;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }
    }
}

// Performance Manager
class PerformanceManager {
    constructor() {
        this.init();
    }

    init() {
        this.optimizeImages();
        this.handleScrollPerformance();
    }

    optimizeImages() {
        // Lazy loading simulation for future image implementation
        const imageContainers = document.querySelectorAll('.project-image-placeholder, .hero__avatar');
        
        imageContainers.forEach(container => {
            container.style.willChange = 'transform';
        });
    }

    handleScrollPerformance() {
        let ticking = false;
        
        const updateOnScroll = () => {
            this.updateHeaderBackground();
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateOnScroll);
                ticking = true;
            }
        });
    }

    updateHeaderBackground() {
        const header = document.querySelector('.header');
        const scrolled = window.scrollY > 50;
        
        if (header) {
            header.style.backgroundColor = scrolled 
                ? 'rgba(var(--color-background-rgb, 15, 23, 42), 0.95)'
                : 'rgba(var(--color-background-rgb, 15, 23, 42), 0.95)';
        }
    }
}

// Accessibility Manager
class AccessibilityManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupARIA();
    }

    setupKeyboardNavigation() {
        // Handle Escape key for mobile menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const navManager = window.navManager;
                if (navManager && navManager.isMenuOpen) {
                    navManager.closeMobileMenu();
                }
            }
        });

        // Handle Tab navigation for theme toggle
        themeToggle?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                themeToggle.click();
            }
        });
    }

    setupFocusManagement() {
        // Focus management for mobile menu
        navToggle?.addEventListener('click', () => {
            setTimeout(() => {
                const firstNavLink = navMenu?.querySelector('.nav__link');
                if (firstNavLink && navMenu?.classList.contains('show')) {
                    firstNavLink.focus();
                }
            }, 300);
        });
    }

    setupARIA() {
        // Set up ARIA attributes
        if (navToggle) {
            navToggle.setAttribute('aria-label', 'Toggle navigation menu');
            navToggle.setAttribute('aria-expanded', 'false');
        }

        if (themeToggle) {
            themeToggle.setAttribute('aria-label', 'Toggle dark/light theme');
            themeToggle.setAttribute('role', 'button');
            themeToggle.setAttribute('tabindex', '0');
        }

        // Update ARIA states
        const updateARIA = () => {
            if (navToggle) {
                const isOpen = navMenu?.classList.contains('show');
                navToggle.setAttribute('aria-expanded', isOpen.toString());
            }
        };

        navToggle?.addEventListener('click', updateARIA);
    }
}

// Email Link Handler
class ContactManager {
    constructor() {
        this.init();
    }

    init() {
        const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
        
        emailLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Analytics or tracking could be added here
                console.log('Email link clicked:', link.href);
            });
        });

        // Handle external links
        const externalLinks = document.querySelectorAll('a[href^="http"]');
        
        externalLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                console.log('External link clicked:', link.href);
            });
        });
    }
}

// Main App Initialization
class PortfolioApp {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        try {
            // Initialize all managers
            this.themeManager = new ThemeManager();
            this.navigationManager = new NavigationManager();
            this.projectFilterManager = new ProjectFilterManager();
            this.animationManager = new AnimationManager();
            this.smoothScrollManager = new SmoothScrollManager();
            this.performanceManager = new PerformanceManager();
            this.accessibilityManager = new AccessibilityManager();
            this.contactManager = new ContactManager();

            // Make navigation manager globally accessible
            window.navManager = this.navigationManager;

            // Add loaded class for any CSS transitions
            document.body.classList.add('loaded');

            console.log('Portfolio app initialized successfully');
        } catch (error) {
            console.error('Error initializing portfolio app:', error);
        }
    }
}

// Error Handling
window.addEventListener('error', (e) => {
    console.error('Portfolio app error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

// Initialize the application
const portfolioApp = new PortfolioApp();

// Utility Functions
const utils = {
    // Debounce function for performance optimization
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for scroll events
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Check if element is in viewport
    isInViewport: (element) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
};

// Export for potential future use
window.portfolioUtils = utils;