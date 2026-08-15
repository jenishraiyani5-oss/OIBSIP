
document.addEventListener('DOMContentLoaded', () => {

    // 1. Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.getElementById('nav-links');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    // 2. Simple Quote Switcher
    const quotes = [
        "Dream is not that which you see while sleeping; it is something that does not let you sleep.",
        "If you want to shine like a sun, first burn like a sun.",
        "To succeed in your mission, you must have single-minded devotion to your goal.",
        "Excellence happens not by accident. It is a process.",
        "Learning gives creativity, creativity leads to thinking, thinking provides knowledge, knowledge makes you great."
    ];

    let currentQuoteIndex = 0;
    const quoteText = document.getElementById('quote-text');
    const prevBtn = document.getElementById('prev-quote');
    const nextBtn = document.getElementById('next-quote');

    function updateQuote(index) {
        if (quoteText) {
            quoteText.style.opacity = '0.4';
            setTimeout(() => {
                quoteText.textContent = `"${quotes[index]}"`;
                quoteText.style.opacity = '1';
            }, 150);
        }
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentQuoteIndex = (currentQuoteIndex - 1 + quotes.length) % quotes.length;
            updateQuote(currentQuoteIndex);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
            updateQuote(currentQuoteIndex);
        });
    }

});
