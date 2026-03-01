document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('header');

    // Handle Header scroll state to match Frame 2
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Handle offset for smooth scrolling to sections
    document.querySelectorAll('.header-nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // Get the height of the scrolled header to offset the scroll position
                const headerHeight = header.classList.contains('scrolled') ? header.offsetHeight : header.offsetHeight / 2;

                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px offset for the sticky header

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Handle Scroll Reveal Animations
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, {
        root: null,
        threshold: 0.15, // Trigger when 15% of the element is visible
        rootMargin: "0px 0px -50px 0px" // Slightly before it hits the true bottom
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // Handle Contact Form Submission
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Basic validation is handled by 'required' attributes in HTML

            const submitBtn = document.getElementById('submit-btn');
            const originalBtnText = submitBtn.innerText;

            submitBtn.innerText = 'Sending...';
            submitBtn.disabled = true;
            formStatus.innerText = '';
            formStatus.style.color = 'white';

            // NOTE: The user will need to configure these EmailJS parameters:
            // 1. Service ID
            // 2. Template ID
            // 3. Form element (this)
            // Example: emailjs.sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', this)

            // Placeholder simulation for the user before they add their keys:
            setTimeout(() => {
                formStatus.innerText = 'Note: To actually send emails, you need to add your EmailJS Public Key, Service ID, and Template ID in index.html and script.js.';
                formStatus.style.color = '#ffb3b3'; // light red/pink for visibility
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
                contactForm.reset();
            }, 1000);

            /* 
            // REAL EMAILJS CODE (Uncomment and fill in your details when ready):
            emailjs.sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', this)
                .then(function() {
                    console.log('SUCCESS!');
                    formStatus.innerText = 'Message sent successfully!';
                    formStatus.style.color = '#4CAF50'; // Green
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                    contactForm.reset();
                }, function(error) {
                    console.log('FAILED...', error);
                    formStatus.innerText = 'Failed to send message. Please try again later.';
                    formStatus.style.color = '#ffb3b3'; // Light red
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                });
            */
        });
    }

    // --- Interactive Minimal Robot Logic (Free Roaming & Home) ---
    const robotContainer = document.getElementById('robot-container');
    const robotEyes = document.getElementById('robot-eyes');
    const ropeContainer = document.getElementById('robot-rope-container');
    const robotRope = document.getElementById('robot-rope');
    const svgWidth = 90;
    const svgHeight = 90;

    // Home Coordinates (roughly bottom right where pad is placed)
    const homeX = window.innerWidth - 65;
    const homeY = window.innerHeight - 90;

    // Position and State variables
    let xPos = homeX;
    let yPos = homeY;

    let targetX = null;
    let targetY = null;
    let isGoingHome = false;

    let speed = 0.8; // Slightly faster for roaming
    let direction = -1;  // Start facing left since home is on the right
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    // Drag State
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // Idle Timer
    let idleTimeout = null;
    const IDLE_LIMIT_MS = 10000; // 10 seconds

    function resetIdleTimer() {
        clearTimeout(idleTimeout);
        isGoingHome = false;

        // Start waiting to go home
        idleTimeout = setTimeout(() => {
            isGoingHome = true;
            targetX = homeX;
            targetY = homeY;
        }, IDLE_LIMIT_MS);
    }

    // Initialize Timer
    resetIdleTimer();

    // Track mouse
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (isDragging) {
            xPos = mouseX - dragOffsetX;
            yPos = mouseY - dragOffsetY;

            // Constrain
            if (xPos < 0) xPos = 0;
            if (xPos > window.innerWidth - svgWidth) xPos = window.innerWidth - svgWidth;
            if (yPos < 0) yPos = 0;
            if (yPos > window.innerHeight - svgHeight) yPos = window.innerHeight - svgHeight;
        }
    });

    // Drag Events
    robotContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        robotContainer.classList.add('is-dragging');
        clearTimeout(idleTimeout); // Pause home logic while holding
        isGoingHome = false;

        const rect = robotContainer.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;

        e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            robotContainer.classList.remove('is-dragging');

            // Placed somewhere -> restart idle timer unless placed exactly on home
            resetIdleTimer();
        }
    });

    // Main animation loop
    function updateRobot() {

        // --- 1. Animation State Management ---
        if (isDragging) {
            // Picked up
            robotContainer.classList.remove('is-walking', 'is-idle', 'is-hanging');
            ropeContainer.style.display = 'none';
        } else if (isGoingHome) {
            // Walking Home
            const dx = targetX - xPos;
            const dy = targetY - yPos;
            const distance = Math.sqrt(dx * dx + dy * dy);

            ropeContainer.style.display = 'none';

            if (distance > 2) {
                // Keep walking towards home
                if (!robotContainer.classList.contains('is-walking')) {
                    robotContainer.classList.add('is-walking');
                    robotContainer.classList.remove('is-idle', 'is-hanging');
                }

                // Move towards target
                xPos += (dx / distance) * speed;
                yPos += (dy / distance) * speed;

                // Set facing direction
                direction = dx > 0 ? 1 : -1;
                robotContainer.style.transform = `scaleX(${direction})`;

            } else {
                // Reached home!
                xPos = homeX;
                yPos = homeY;
                isGoingHome = false;

                // Switch to idle
                if (!robotContainer.classList.contains('is-idle')) {
                    robotContainer.classList.add('is-idle');
                    robotContainer.classList.remove('is-walking', 'is-hanging');
                    // Facing left looks nicer from home base
                    robotContainer.style.transform = `scaleX(-1)`;
                    direction = -1;
                }
            }
        } else {
            // Free roaming / Placed somewhere
            const isNearTop = yPos <= 80;

            if (isNearTop) {
                // Hanging State
                if (!robotContainer.classList.contains('is-hanging')) {
                    robotContainer.classList.add('is-hanging');
                    robotContainer.classList.remove('is-walking', 'is-idle');
                }

                // Draw Rope
                ropeContainer.style.display = 'block';
                const robotHeadX = xPos + (svgWidth / 2);
                robotRope.setAttribute('x1', robotHeadX);
                robotRope.setAttribute('y1', 0);
                robotRope.setAttribute('x2', robotHeadX);
                robotRope.setAttribute('y2', yPos + 10); // Attach to top of head visually

            } else {
                // Sitting Idle wherever placed
                ropeContainer.style.display = 'none';
                if (!robotContainer.classList.contains('is-idle')) {
                    robotContainer.classList.add('is-idle');
                    robotContainer.classList.remove('is-walking', 'is-hanging');
                }
            }
        }

        // Apply true position
        robotContainer.style.left = `${xPos}px`;
        robotContainer.style.top = `${yPos}px`;

        // --- 2. Subtle Eye Tracking ---
        const rect = robotContainer.getBoundingClientRect();
        const robotCenterX = rect.left + rect.width / 2;
        const robotCenterY = rect.top + 35; // Approximate eye height

        const eye_dx = mouseX - robotCenterX;
        const eye_dy = mouseY - robotCenterY;

        const angle = Math.atan2(eye_dy, eye_dx);
        const maxEyeMove = 2.5;

        let eyeMoveX = Math.cos(angle) * maxEyeMove;
        let eyeMoveY = Math.sin(angle) * maxEyeMove;

        // Adjust for scaleX flipping
        const isFlipped = robotContainer.style.transform.includes('scaleX(-1)') || direction === -1 && !robotContainer.style.transform.includes('scaleX(1)');
        if (isFlipped) {
            eyeMoveX *= -1;
        }

        robotEyes.style.transform = `translate(${eyeMoveX}px, ${eyeMoveY}px)`;
        requestAnimationFrame(updateRobot);
    }

    // Start loop
    updateRobot();

    // Handle Resize boundaries safely
    window.addEventListener('resize', () => {
        if (xPos > window.innerWidth) xPos = window.innerWidth - svgWidth;
        if (yPos > window.innerHeight) yPos = window.innerHeight - svgHeight;
    });
});
