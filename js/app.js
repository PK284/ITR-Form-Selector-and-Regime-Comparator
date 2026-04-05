/**
 * ============================================================
 * APP CONTROLLER — Main application logic & event handlers
 * ============================================================
 */

(function () {
    'use strict';

    // ──────────────────────────────────────────────────
    // STATE
    // ──────────────────────────────────────────────────

    let currentStep = 1;
    let lastResults = null;
    let lastFormResult = null;
    let lastTips = null;

    // ──────────────────────────────────────────────────
    // HERO & NAVIGATION
    // ──────────────────────────────────────────────────

    window.startCalculator = function () {
        const hero = document.getElementById('heroSection');
        const app = document.getElementById('calculatorApp');
        const footer = document.getElementById('footer');

        hero.style.display = 'none';
        app.classList.add('visible');
        footer.style.display = 'block';

        currentStep = 1;
        updateProgressBar();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.goToHero = function () {
        const hero = document.getElementById('heroSection');
        const app = document.getElementById('calculatorApp');
        const footer = document.getElementById('footer');

        hero.style.display = 'flex';
        app.classList.remove('visible');
        footer.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.startOver = function () {
        // Clear all inputs
        document.querySelectorAll('input[type="text"]').forEach(input => {
            input.value = '';
        });

        document.querySelectorAll('select').forEach(select => {
            select.selectedIndex = 0;
        });

        // Reset toggles
        document.querySelectorAll('.toggle-group').forEach(group => {
            const buttons = group.querySelectorAll('.toggle-btn');
            buttons.forEach((btn, i) => {
                btn.classList.toggle('active', i === 0);
            });
        });

        document.querySelectorAll('input[type="hidden"]').forEach(input => {
            if (input.id === 'isMetroCity' || input.id === 'hasBusinessIncome' ||
                input.id === 'isDirector' || input.id === 'hasUnlistedShares' ||
                input.id === 'hasForeignAssets' || input.id === 'presumptiveTax') {
                input.value = 'no';
            }
        });

        document.getElementById('presumptiveGroup').style.display = 'none';

        // Go to step 1
        currentStep = 1;
        showStep(1);
        updateProgressBar();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ──────────────────────────────────────────────────
    // STEP NAVIGATION
    // ──────────────────────────────────────────────────

    window.nextStep = function (step) {
        showStep(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.prevStep = function (step) {
        showStep(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    function showStep(step) {
        // Hide all panels
        document.querySelectorAll('.step-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Show target panel
        const panel = document.getElementById(`step${step}`);
        if (panel) {
            panel.classList.add('active');
        }

        currentStep = step;
        updateProgressBar();
    }

    function updateProgressBar() {
        const fill = document.getElementById('progressFill');
        fill.style.width = `${(currentStep / 4) * 100}%`;

        document.querySelectorAll('.progress-step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');

            if (stepNum === currentStep) {
                step.classList.add('active');
            } else if (stepNum < currentStep) {
                step.classList.add('completed');
            }
        });
    }

    // ──────────────────────────────────────────────────
    // TOGGLE OPTIONS (Yes/No buttons)
    // ──────────────────────────────────────────────────

    window.toggleOption = function (btn, inputId) {
        const group = btn.parentElement;
        group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const hiddenInput = document.getElementById(inputId);
        hiddenInput.value = btn.dataset.value;

        // Show/hide conditional fields
        if (inputId === 'hasBusinessIncome') {
            const presumptiveGroup = document.getElementById('presumptiveGroup');
            presumptiveGroup.style.display = btn.dataset.value === 'yes' ? 'block' : 'none';
            if (btn.dataset.value === 'no') {
                document.getElementById('presumptiveTax').value = 'no';
            }
        }
    };

    // ──────────────────────────────────────────────────
    // CURRENCY FORMATTING (Indian Numbering)
    // ──────────────────────────────────────────────────

    window.formatCurrency = function (input) {
        // Strip everything except digits
        let value = input.value.replace(/[^0-9]/g, '');

        if (value.length === 0) {
            input.value = '';
            return;
        }

        // Convert to number
        const num = parseInt(value, 10);

        // Format in Indian numbering
        input.value = TaxEngine.formatINR(num);
    };

    function parseFormattedNumber(str) {
        if (!str || str.trim() === '') return 0;
        return parseInt(str.replace(/,/g, ''), 10) || 0;
    }

    // ──────────────────────────────────────────────────
    // COLLECT ALL INPUTS
    // ──────────────────────────────────────────────────

    function collectInputs() {
        return {
            // Step 1: Basic Info
            ageGroup: document.getElementById('ageGroup').value,
            residencyStatus: document.getElementById('residencyStatus').value,
            taxpayerType: document.getElementById('taxpayerType').value,
            hasBusinessIncome: document.getElementById('hasBusinessIncome').value,
            presumptiveTax: document.getElementById('presumptiveTax').value,
            isDirector: document.getElementById('isDirector').value,
            hasUnlistedShares: document.getElementById('hasUnlistedShares').value,
            hasForeignAssets: document.getElementById('hasForeignAssets').value,

            // Step 2: Income
            grossSalary: parseFormattedNumber(document.getElementById('grossSalary').value),
            basicSalary: parseFormattedNumber(document.getElementById('basicSalary').value),
            hraReceived: parseFormattedNumber(document.getElementById('hraReceived').value),
            rentPaid: parseFormattedNumber(document.getElementById('rentPaid').value),
            isMetro: document.getElementById('isMetroCity').value === 'yes',
            rentalIncome: parseFormattedNumber(document.getElementById('rentalIncome').value),
            propertyTax: parseFormattedNumber(document.getElementById('propertyTax').value),
            homeLoanInterest: parseFormattedNumber(document.getElementById('homeLoanInterest').value),
            numProperties: document.getElementById('numProperties').value,
            stcg15: parseFormattedNumber(document.getElementById('stcg15').value),
            stcgOther: parseFormattedNumber(document.getElementById('stcgOther').value),
            ltcg10: parseFormattedNumber(document.getElementById('ltcg10').value),
            ltcg20: parseFormattedNumber(document.getElementById('ltcg20').value),
            interestIncome: parseFormattedNumber(document.getElementById('interestIncome').value),
            dividendIncome: parseFormattedNumber(document.getElementById('dividendIncome').value),
            otherIncome: parseFormattedNumber(document.getElementById('otherIncome').value),
            agriculturalIncome: parseFormattedNumber(document.getElementById('agriculturalIncome').value),

            // Step 3: Deductions
            section80C: parseFormattedNumber(document.getElementById('section80C').value),
            section80CCD1B: parseFormattedNumber(document.getElementById('section80CCD1B').value),
            section80CCD2: parseFormattedNumber(document.getElementById('section80CCD2').value),
            section80D_self: parseFormattedNumber(document.getElementById('section80D_self').value),
            section80D_parents: parseFormattedNumber(document.getElementById('section80D_parents').value),
            preventiveHealth: parseFormattedNumber(document.getElementById('preventiveHealth').value),
            section80E: parseFormattedNumber(document.getElementById('section80E').value),
            section80G: parseFormattedNumber(document.getElementById('section80G').value),
            section80TTA: parseFormattedNumber(document.getElementById('section80TTA').value),
        };
    }

    // ──────────────────────────────────────────────────
    // CALCULATE & SHOW RESULTS
    // ──────────────────────────────────────────────────

    window.calculateAndShowResults = function () {
        const inputs = collectInputs();

        // 1. Determine ITR Form
        lastFormResult = FormSelector.selectForm(inputs);

        // 2. Calculate and Compare Regimes
        lastResults = TaxEngine.compare(inputs);

        // 3. Generate Tips
        lastTips = TaxEngine.generateTips(inputs, lastResults);

        // 4. Render Results
        UIController.renderITRResult(lastFormResult);
        UIController.renderComparison(lastResults);
        UIController.renderBreakdown(lastResults);
        UIController.renderTips(lastTips);

        // 5. Navigate to Step 4
        showStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ──────────────────────────────────────────────────
    // BREAKDOWN TAB TOGGLE
    // ──────────────────────────────────────────────────

    window.switchBreakdownTab = function (regime, btn) {
        document.querySelectorAll('.breakdown-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');

        document.getElementById('breakdownOld').style.display = regime === 'old' ? 'block' : 'none';
        document.getElementById('breakdownNew').style.display = regime === 'new' ? 'block' : 'none';
    };

    // ──────────────────────────────────────────────────
    // DOWNLOAD REPORT
    // ──────────────────────────────────────────────────

    window.downloadReport = function () {
        if (!lastResults || !lastFormResult) return;

        const report = UIController.generateReport(lastFormResult, lastResults, lastTips || []);

        // Create and trigger download
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ITR_Tax_Report_FY2025-26_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ──────────────────────────────────────────────────
    // HERO ANIMATIONS (Counter Animation)
    // ──────────────────────────────────────────────────

    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number[data-count]');
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.count);
            const duration = 1500;
            let startTime = null;

            function tick(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // easeOutExpo
                const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                counter.textContent = Math.round(eased * target);

                if (progress < 1) {
                    requestAnimationFrame(tick);
                }
            }

            requestAnimationFrame(tick);
        });
    }

    // ──────────────────────────────────────────────────
    // INITIALIZATION
    // ──────────────────────────────────────────────────

    function init() {
        // Hide footer initially
        document.getElementById('footer').style.display = 'none';

        // Run counter animations
        animateCounters();

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
                e.preventDefault();
                // Focus next input
                const inputs = Array.from(document.querySelectorAll(
                    `.step-panel.active input[type="text"], .step-panel.active select`
                ));
                const currentIndex = inputs.indexOf(e.target);
                if (currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                }
            }
        });

        console.log(
            '%c🧾 ITR Form Selector + Regime Comparator %c FY 2025-26 ',
            'background: #6C63FF; color: #fff; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: bold;',
            'background: #06D6A0; color: #000; padding: 4px 8px; border-radius: 0 4px 4px 0; font-weight: bold;'
        );
        console.log(
            '%c✓ All calculations run locally in your browser. Zero data stored.',
            'color: #06D6A0; font-style: italic;'
        );
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
