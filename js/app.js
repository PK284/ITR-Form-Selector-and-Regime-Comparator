/**
 * ============================================================
 * APP CONTROLLER — Main application logic & event handlers
 * All events wired via addEventListener (CSP-compliant, no inline handlers)
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

    function startCalculator() {
        document.getElementById('heroSection').style.display = 'none';
        document.getElementById('calculatorApp').classList.add('visible');
        document.getElementById('footer').style.display = 'block';
        currentStep = 1;
        updateProgressBar();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function goToHero() {
        document.getElementById('heroSection').style.display = 'flex';
        document.getElementById('calculatorApp').classList.remove('visible');
        document.getElementById('footer').style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function startOver() {
        document.querySelectorAll('input[type="text"]').forEach(input => {
            input.value = '';
        });
        document.querySelectorAll('select').forEach(select => {
            select.selectedIndex = 0;
        });
        document.querySelectorAll('.toggle-group').forEach(group => {
            group.querySelectorAll('.toggle-btn').forEach((btn, i) => {
                btn.classList.toggle('active', i === 0);
            });
        });
        document.querySelectorAll('input[type="hidden"]').forEach(input => {
            const resetIds = ['isMetroCity', 'hasBusinessIncome', 'isDirector', 'hasUnlistedShares', 'hasForeignAssets', 'presumptiveTax'];
            if (resetIds.includes(input.id)) input.value = 'no';
        });
        document.getElementById('presumptiveGroup').style.display = 'none';
        currentStep = 1;
        showStep(1);
        updateProgressBar();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ──────────────────────────────────────────────────
    // STEP NAVIGATION
    // ──────────────────────────────────────────────────

    function showStep(step) {
        document.querySelectorAll('.step-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        const panel = document.getElementById(`step${step}`);
        if (panel) panel.classList.add('active');
        currentStep = step;
        updateProgressBar();
    }

    function updateProgressBar() {
        const fill = document.getElementById('progressFill');
        if (fill) fill.style.width = `${(currentStep / 4) * 100}%`;

        document.querySelectorAll('.progress-step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');
            if (stepNum === currentStep) step.classList.add('active');
            else if (stepNum < currentStep) step.classList.add('completed');
        });
    }

    // ──────────────────────────────────────────────────
    // TOGGLE OPTIONS (Yes/No buttons)
    // ──────────────────────────────────────────────────

    function handleToggle(btn) {
        const inputId = btn.dataset.inputId;
        const group = btn.parentElement;
        group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const hiddenInput = document.getElementById(inputId);
        if (hiddenInput) hiddenInput.value = btn.dataset.value;

        if (inputId === 'hasBusinessIncome') {
            const presumptiveGroup = document.getElementById('presumptiveGroup');
            presumptiveGroup.style.display = btn.dataset.value === 'yes' ? 'block' : 'none';
            if (btn.dataset.value === 'no') {
                document.getElementById('presumptiveTax').value = 'no';
                // Reset presumptive toggle to "No"
                const presGroup = document.getElementById('presumptiveGroup');
                if (presGroup) {
                    presGroup.querySelectorAll('.toggle-btn').forEach((b, i) => {
                        b.classList.toggle('active', i === 0);
                    });
                }
            }
        }
    }

    // ──────────────────────────────────────────────────
    // BREAKDOWN TAB TOGGLE
    // ──────────────────────────────────────────────────

    function switchBreakdownTab(regime, btn) {
        document.querySelectorAll('.breakdown-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('breakdownOld').style.display = regime === 'old' ? 'block' : 'none';
        document.getElementById('breakdownNew').style.display = regime === 'new' ? 'block' : 'none';
    }

    // ──────────────────────────────────────────────────
    // CURRENCY FORMATTING (Indian Numbering)
    // ──────────────────────────────────────────────────

    function formatCurrencyInput(input) {
        let value = input.value.replace(/[^0-9]/g, '');
        if (value.length === 0) { input.value = ''; return; }
        input.value = TaxEngine.formatINR(parseInt(value, 10));
    }

    function parseFormattedNumber(str) {
        if (!str || str.trim() === '') return 0;
        return parseInt(str.replace(/,/g, ''), 10) || 0;
    }

    // ──────────────────────────────────────────────────
    // COLLECT ALL INPUTS
    // ──────────────────────────────────────────────────

    function collectInputs() {
        return {
            ageGroup: document.getElementById('ageGroup').value,
            residencyStatus: document.getElementById('residencyStatus').value,
            taxpayerType: document.getElementById('taxpayerType').value,
            hasBusinessIncome: document.getElementById('hasBusinessIncome').value,
            presumptiveTax: document.getElementById('presumptiveTax').value,
            isDirector: document.getElementById('isDirector').value,
            hasUnlistedShares: document.getElementById('hasUnlistedShares').value,
            hasForeignAssets: document.getElementById('hasForeignAssets').value,

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

    function calculateAndShowResults() {
        const inputs = collectInputs();
        lastFormResult = FormSelector.selectForm(inputs);
        lastResults = TaxEngine.compare(inputs);
        lastTips = TaxEngine.generateTips(inputs, lastResults);

        UIController.renderITRResult(lastFormResult);
        UIController.renderComparison(lastResults);
        UIController.renderBreakdown(lastResults);
        UIController.renderTips(lastTips);

        showStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ──────────────────────────────────────────────────
    // DOWNLOAD REPORT
    // ──────────────────────────────────────────────────

    function downloadReport() {
        if (!lastResults || !lastFormResult) return;
        const report = UIController.generateReport(lastFormResult, lastResults, lastTips || []);
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ITR_Tax_Report_FY2025-26_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ──────────────────────────────────────────────────
    // HERO ANIMATIONS (Counter Animation)
    // ──────────────────────────────────────────────────

    function animateCounters() {
        document.querySelectorAll('.stat-number[data-count]').forEach(counter => {
            const target = parseInt(counter.dataset.count);
            const duration = 1500;
            let startTime = null;
            function tick(timestamp) {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                counter.textContent = Math.round(eased * target);
                if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        });
    }

    // ──────────────────────────────────────────────────
    // WIRE ALL EVENT LISTENERS (CSP-compliant — no onclick in HTML)
    // ──────────────────────────────────────────────────

    function wireEvents() {
        // Hero CTA
        const startBtn = document.getElementById('startButton');
        if (startBtn) startBtn.addEventListener('click', startCalculator);

        // Step 1 → Back to hero
        const backToHeroBtn = document.querySelector('#step1 .btn-secondary');
        if (backToHeroBtn) backToHeroBtn.addEventListener('click', goToHero);

        // Step 1 → Continue to step 2
        const step1Next = document.querySelector('#step1 .btn-primary');
        if (step1Next) step1Next.addEventListener('click', () => { showStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); });

        // Step 2 → Back to step 1
        const step2Back = document.querySelector('#step2 .btn-secondary');
        if (step2Back) step2Back.addEventListener('click', () => { showStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); });

        // Step 2 → Continue to step 3
        const step2Next = document.querySelector('#step2 .btn-primary');
        if (step2Next) step2Next.addEventListener('click', () => { showStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); });

        // Step 3 → Back to step 2
        const step3Back = document.querySelector('#step3 .btn-secondary');
        if (step3Back) step3Back.addEventListener('click', () => { showStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); });

        // Step 3 → Calculate
        const calcBtn = document.querySelector('.btn-calculate');
        if (calcBtn) calcBtn.addEventListener('click', calculateAndShowResults);

        // Step 4 → Modify Inputs (go to step 3)
        const step4Back = document.querySelector('#step4 .btn-secondary');
        if (step4Back) step4Back.addEventListener('click', () => { showStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); });

        // Step 4 → Download report
        const downloadBtn = document.querySelector('#step4 .btn-primary');
        if (downloadBtn) downloadBtn.addEventListener('click', downloadReport);

        // Step 4 → Start over
        const startOverBtn = document.querySelector('.btn-ghost');
        if (startOverBtn) startOverBtn.addEventListener('click', startOver);

        // Breakdown tabs
        document.querySelectorAll('.breakdown-tab').forEach(tab => {
            tab.addEventListener('click', function () {
                const regime = this.textContent.toLowerCase().includes('old') ? 'old' : 'new';
                switchBreakdownTab(regime, this);
            });
        });

        // Toggle buttons (Yes/No) — use data-input-id attribute
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                handleToggle(this);
            });
        });

        // Currency inputs — format on input
        document.querySelectorAll('input[type="text"]').forEach(input => {
            input.addEventListener('input', function () {
                formatCurrencyInput(this);
            });
        });

        // Keyboard navigation (Tab-through with Enter)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
                e.preventDefault();
                const inputs = Array.from(document.querySelectorAll(
                    `.step-panel.active input[type="text"], .step-panel.active select`
                ));
                const currentIndex = inputs.indexOf(e.target);
                if (currentIndex < inputs.length - 1) inputs[currentIndex + 1].focus();
            }
        });
    }

    // ──────────────────────────────────────────────────
    // INITIALIZATION
    // ──────────────────────────────────────────────────

    function init() {
        document.getElementById('footer').style.display = 'none';
        animateCounters();
        wireEvents();

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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
/* Netlify cache bust: Sun Apr  5 16:49:50 IST 2026 */
