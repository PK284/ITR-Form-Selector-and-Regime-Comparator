/**
 * ============================================================
 * ITR FORM SELECTOR — FY 2025-26
 * Determines the correct ITR form based on user inputs
 * ============================================================
 */

const FormSelector = (() => {
    'use strict';

    // ──────────────────────────────────────────────────
    // ITR FORM DEFINITIONS
    // ──────────────────────────────────────────────────

    const FORMS = {
        'ITR-1': {
            name: 'Sahaj',
            fullName: 'ITR-1 (Sahaj)',
            description: 'Simplest form for resident individuals with straightforward income.',
            color: '#06D6A0',
        },
        'ITR-2': {
            name: '',
            fullName: 'ITR-2',
            description: 'For individuals/HUFs without business income but with capital gains, foreign assets, or complex scenarios.',
            color: '#6C63FF',
        },
        'ITR-3': {
            name: '',
            fullName: 'ITR-3',
            description: 'For individuals/HUFs with income from business or profession (non-presumptive).',
            color: '#FF6B6B',
        },
        'ITR-4': {
            name: 'Sugam',
            fullName: 'ITR-4 (Sugam)',
            description: 'For individuals/HUFs/firms with presumptive business income.',
            color: '#FFD93D',
        },
    };

    // ──────────────────────────────────────────────────
    // DETERMINE ITR FORM
    // ──────────────────────────────────────────────────

    function selectForm(inputs) {
        const reasons = [];
        let form = 'ITR-1'; // Start with simplest

        // Calculate total income for the ₹50L check
        const totalIncome = (inputs.grossSalary || 0)
            + (inputs.rentalIncome || 0)
            + (inputs.stcg15 || 0)
            + (inputs.stcgOther || 0)
            + (inputs.ltcg10 || 0)
            + (inputs.ltcg20 || 0)
            + (inputs.interestIncome || 0)
            + (inputs.dividendIncome || 0)
            + (inputs.otherIncome || 0);

        const hasCapitalGains = (inputs.stcg15 || 0) > 0
            || (inputs.stcgOther || 0) > 0
            || (inputs.ltcg10 || 0) > 0
            || (inputs.ltcg20 || 0) > 0;

        // Only small LTCG under 112A up to ₹1.25L is allowed in ITR-1
        const hasSignificantCapitalGains = (inputs.stcg15 || 0) > 0
            || (inputs.stcgOther || 0) > 0
            || (inputs.ltcg10 || 0) > 125000
            || (inputs.ltcg20 || 0) > 0;

        const hasBusinessIncome = inputs.hasBusinessIncome === 'yes';
        const isPresumptive = inputs.presumptiveTax === 'yes';
        const isDirector = inputs.isDirector === 'yes';
        const hasUnlistedShares = inputs.hasUnlistedShares === 'yes';
        const hasForeignAssets = inputs.hasForeignAssets === 'yes';
        const isNRI = inputs.residencyStatus === 'nri' || inputs.residencyStatus === 'rnor';
        const isHUF = inputs.taxpayerType === 'huf';
        const numProperties = parseInt(inputs.numProperties) || 0;
        const agriculturalIncome = inputs.agriculturalIncome || 0;

        // ─── Check for ITR-3 first (business income, non-presumptive) ───
        if (hasBusinessIncome && !isPresumptive) {
            form = 'ITR-3';
            reasons.push('You have income from business/profession (non-presumptive)');
            if (hasCapitalGains) reasons.push('Capital gains income reported');
            if (isDirector) reasons.push('You are a director in a company');
            if (hasForeignAssets) reasons.push('Foreign assets/income present');

            return buildResult(form, reasons);
        }

        // ─── Check for ITR-4 (presumptive taxation) ───
        if (hasBusinessIncome && isPresumptive) {
            // ITR-4 has restrictions similar to ITR-1
            if (isDirector || hasUnlistedShares || hasForeignAssets || isNRI || hasCapitalGains) {
                // Can't use ITR-4, must use ITR-3
                form = 'ITR-3';
                reasons.push('Presumptive income but disqualified from ITR-4');
                if (isDirector) reasons.push('Director in a company — ITR-4 not eligible');
                if (hasUnlistedShares) reasons.push('Unlisted equity shares — ITR-4 not eligible');
                if (hasForeignAssets) reasons.push('Foreign assets — ITR-4 not eligible');
                if (hasCapitalGains) reasons.push('Capital gains — ITR-4 not eligible');
                if (isNRI) reasons.push('NRI/RNOR status — ITR-4 not eligible');

                return buildResult(form, reasons);
            }

            if (totalIncome > 5000000) {
                form = 'ITR-3';
                reasons.push('Total income exceeds ₹50 lakhs — ITR-4 not eligible');
                return buildResult(form, reasons);
            }

            form = 'ITR-4';
            reasons.push('Income from business/profession under presumptive taxation (44AD/44ADA/44AE)');
            if (inputs.grossSalary > 0) reasons.push('Salary/pension income included');
            if (inputs.rentalIncome > 0) reasons.push('Rental income from house property included');

            return buildResult(form, reasons);
        }

        // ─── No business income — decide between ITR-1 and ITR-2 ───

        // Conditions that require ITR-2 over ITR-1
        let needsITR2 = false;

        if (isHUF) {
            needsITR2 = true;
            reasons.push('HUF (Hindu Undivided Family) must file ITR-2 or higher');
        }

        if (isNRI) {
            needsITR2 = true;
            reasons.push('Non-Resident / RNOR status requires ITR-2');
        }

        if (hasSignificantCapitalGains) {
            needsITR2 = true;
            if ((inputs.stcg15 || 0) > 0) reasons.push('Short-term capital gains (Section 111A) present');
            if ((inputs.stcgOther || 0) > 0) reasons.push('Short-term capital gains (other) present');
            if ((inputs.ltcg10 || 0) > 125000) reasons.push('Long-term capital gains (112A) exceed ₹1.25 lakh');
            if ((inputs.ltcg20 || 0) > 0) reasons.push('Long-term capital gains (other/property) present');
        }

        if (isDirector) {
            needsITR2 = true;
            reasons.push('You are a director in a company');
        }

        if (hasUnlistedShares) {
            needsITR2 = true;
            reasons.push('You hold unlisted equity shares');
        }

        if (hasForeignAssets) {
            needsITR2 = true;
            reasons.push('Foreign assets or foreign income present');
        }

        if (numProperties > 2) {
            needsITR2 = true;
            reasons.push('More than 2 house properties owned');
        }

        if (totalIncome > 5000000) {
            needsITR2 = true;
            reasons.push('Total income exceeds ₹50 lakhs');
        }

        if (agriculturalIncome > 5000) {
            needsITR2 = true;
            reasons.push('Agricultural income exceeds ₹5,000');
        }

        if (needsITR2) {
            form = 'ITR-2';
        } else {
            form = 'ITR-1';
            // ITR-1 eligibility reasons
            reasons.push('Resident individual with salary/pension income');
            if (numProperties <= 2 && (inputs.rentalIncome || 0) > 0) {
                reasons.push('House property income from up to 2 properties');
            }
            if ((inputs.interestIncome || 0) > 0 || (inputs.dividendIncome || 0) > 0) {
                reasons.push('Other sources (interest, dividend) income included');
            }
            if ((inputs.ltcg10 || 0) > 0 && (inputs.ltcg10 || 0) <= 125000) {
                reasons.push('LTCG from equity within ₹1.25L exemption (allowed in ITR-1)');
            }
            reasons.push('Total income within ₹50 lakhs');
        }

        return buildResult(form, reasons);
    }

    // ──────────────────────────────────────────────────
    // BUILD RESULT OBJECT
    // ──────────────────────────────────────────────────

    function buildResult(formKey, reasons) {
        const formData = FORMS[formKey];
        return {
            form: formKey,
            name: formData.name,
            fullName: formData.fullName,
            description: formData.description,
            color: formData.color,
            reasons: reasons.length > 0 ? reasons : ['Standard eligibility criteria met'],
        };
    }

    // ──────────────────────────────────────────────────
    // PUBLIC API
    // ──────────────────────────────────────────────────

    return {
        selectForm,
        FORMS,
    };
})();
