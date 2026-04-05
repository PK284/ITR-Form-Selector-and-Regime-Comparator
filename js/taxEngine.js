/**
 * ============================================================
 * TAX ENGINE — FY 2025-26 (AY 2026-27)
 * Pure client-side tax calculations for Indian Income Tax
 * ============================================================
 * 
 * Sources: Income Tax Act, Budget 2025 announcements
 * Disclaimer: For informational purposes only.
 */

const TaxEngine = (() => {
    'use strict';

    // ──────────────────────────────────────────────────
    // TAX SLABS — FY 2025-26
    // ──────────────────────────────────────────────────

    const NEW_REGIME_SLABS = [
        { min: 0,       max: 400000,   rate: 0    },
        { min: 400000,  max: 800000,   rate: 0.05 },
        { min: 800000,  max: 1200000,  rate: 0.10 },
        { min: 1200000, max: 1600000,  rate: 0.15 },
        { min: 1600000, max: 2000000,  rate: 0.20 },
        { min: 2000000, max: 2400000,  rate: 0.25 },
        { min: 2400000, max: Infinity, rate: 0.30 },
    ];

    // Old Regime — Below 60 years
    const OLD_REGIME_SLABS_GENERAL = [
        { min: 0,       max: 250000,   rate: 0    },
        { min: 250000,  max: 500000,   rate: 0.05 },
        { min: 500000,  max: 1000000,  rate: 0.20 },
        { min: 1000000, max: Infinity, rate: 0.30 },
    ];

    // Old Regime — Senior Citizen (60-80)
    const OLD_REGIME_SLABS_SENIOR = [
        { min: 0,       max: 300000,   rate: 0    },
        { min: 300000,  max: 500000,   rate: 0.05 },
        { min: 500000,  max: 1000000,  rate: 0.20 },
        { min: 1000000, max: Infinity, rate: 0.30 },
    ];

    // Old Regime — Super Senior (80+)
    const OLD_REGIME_SLABS_SUPER_SENIOR = [
        { min: 0,       max: 500000,   rate: 0    },
        { min: 500000,  max: 1000000,  rate: 0.20 },
        { min: 1000000, max: Infinity, rate: 0.30 },
    ];

    // ──────────────────────────────────────────────────
    // CONSTANTS
    // ──────────────────────────────────────────────────

    const STANDARD_DEDUCTION_OLD = 50000;
    const STANDARD_DEDUCTION_NEW = 75000;
    const CESS_RATE = 0.04; // 4% Health & Education Cess

    // Section 87A Rebate
    const REBATE_87A_OLD_LIMIT = 500000;
    const REBATE_87A_OLD_MAX = 12500;
    const REBATE_87A_NEW_LIMIT = 1200000;  // Net taxable income limit for new regime

    // STCG 111A rate
    const STCG_111A_RATE = 0.20;  // Updated from 15% to 20% for FY 2025-26
    
    // LTCG 112A
    const LTCG_112A_EXEMPTION = 125000;  // ₹1.25 lakh exemption
    const LTCG_112A_RATE = 0.125;  // 12.5% for FY 2025-26

    // LTCG Other (112)
    const LTCG_OTHER_RATE = 0.125;  // 12.5% without indexation for FY 2025-26

    // Surcharge slabs
    const SURCHARGE_SLABS = [
        { min: 0,         max: 5000000,   rate: 0    },
        { min: 5000000,   max: 10000000,  rate: 0.10 },
        { min: 10000000,  max: 20000000,  rate: 0.15 },
        { min: 20000000,  max: 50000000,  rate: 0.25 },
        { min: 50000000,  max: Infinity,  rate: 0.37 },
    ];

    // Surcharge for new regime is capped at 25%
    const SURCHARGE_SLABS_NEW = [
        { min: 0,         max: 5000000,   rate: 0    },
        { min: 5000000,   max: 10000000,  rate: 0.10 },
        { min: 10000000,  max: 20000000,  rate: 0.15 },
        { min: 20000000,  max: Infinity,  rate: 0.25 },
    ];

    // ──────────────────────────────────────────────────
    // HELPER: Calculate tax from slabs
    // ──────────────────────────────────────────────────

    function calculateSlabTax(income, slabs) {
        let tax = 0;
        const slabBreakdown = [];

        for (const slab of slabs) {
            if (income <= slab.min) break;
            const taxableInSlab = Math.min(income, slab.max) - slab.min;
            const taxInSlab = taxableInSlab * slab.rate;
            tax += taxInSlab;

            if (taxableInSlab > 0) {
                slabBreakdown.push({
                    min: slab.min,
                    max: Math.min(income, slab.max),
                    rate: slab.rate,
                    taxableAmount: taxableInSlab,
                    tax: taxInSlab
                });
            }
        }

        return { tax: Math.round(tax), breakdown: slabBreakdown };
    }

    // ──────────────────────────────────────────────────
    // HELPER: Calculate Surcharge
    // ──────────────────────────────────────────────────

    function calculateSurcharge(totalIncome, baseTax, isNewRegime) {
        const slabs = isNewRegime ? SURCHARGE_SLABS_NEW : SURCHARGE_SLABS;
        let surchargeRate = 0;

        for (const slab of slabs) {
            if (totalIncome > slab.min && totalIncome <= slab.max) {
                surchargeRate = slab.rate;
                break;
            }
            if (totalIncome > slab.min && slab.max === Infinity) {
                surchargeRate = slab.rate;
                break;
            }
        }

        // Marginal relief logic (simplified)
        let surcharge = Math.round(baseTax * surchargeRate);
        return { surcharge, rate: surchargeRate };
    }

    // ──────────────────────────────────────────────────
    // HRA Exemption Calculation
    // ──────────────────────────────────────────────────

    function calculateHRAExemption(basicSalary, hraReceived, rentPaid, isMetro) {
        if (!hraReceived || !rentPaid || !basicSalary) return 0;

        const hraPercent = isMetro ? 0.50 : 0.40;
        const exemption = Math.min(
            hraReceived,
            hraPercent * basicSalary,
            Math.max(0, rentPaid - 0.10 * basicSalary)
        );

        return Math.max(0, Math.round(exemption));
    }

    // ──────────────────────────────────────────────────
    // HOUSE PROPERTY INCOME
    // ──────────────────────────────────────────────────

    function calculateHousePropertyIncome(rentalIncome, propertyTax, homeLoanInterest, isOldRegime) {
        let netIncome = 0;

        if (rentalIncome > 0) {
            // Let-out property
            const nav = rentalIncome - propertyTax;
            const standardDeduction30 = Math.round(nav * 0.30);
            netIncome = nav - standardDeduction30 - homeLoanInterest;
        } else {
            // Self-occupied: only interest deduction
            const maxInterest = isOldRegime ? 200000 : 200000;
            netIncome = -Math.min(homeLoanInterest, maxInterest);
        }

        return Math.round(netIncome);
    }

    // ──────────────────────────────────────────────────
    // MAIN: Calculate Tax for Old Regime
    // ──────────────────────────────────────────────────

    function calculateOldRegime(inputs) {
        const result = {
            regime: 'old',
            grossSalary: inputs.grossSalary || 0,
            standardDeduction: 0,
            hraExemption: 0,
            netSalaryIncome: 0,
            housePropertyIncome: 0,
            capitalGains: { stcg111A: 0, stcgOther: 0, ltcg112A: 0, ltcgOther: 0 },
            otherIncome: 0,
            grossTotalIncome: 0,
            deductions: {},
            totalDeductions: 0,
            taxableIncome: 0,
            normalTax: 0,
            specialRateTax: 0,
            totalTaxBeforeRebate: 0,
            rebate87A: 0,
            taxAfterRebate: 0,
            surcharge: 0,
            surchargeRate: 0,
            cess: 0,
            totalTaxLiability: 0,
            effectiveTaxRate: 0,
            slabBreakdown: []
        };

        // --- Salary Income ---
        result.standardDeduction = inputs.grossSalary > 0 ? STANDARD_DEDUCTION_OLD : 0;
        result.hraExemption = calculateHRAExemption(
            inputs.basicSalary, inputs.hraReceived, inputs.rentPaid, inputs.isMetro
        );
        result.netSalaryIncome = Math.max(0,
            inputs.grossSalary - result.standardDeduction - result.hraExemption
        );

        // --- House Property ---
        result.housePropertyIncome = calculateHousePropertyIncome(
            inputs.rentalIncome, inputs.propertyTax, inputs.homeLoanInterest, true
        );

        // --- Capital Gains (computed separately) ---
        result.capitalGains = {
            stcg111A: inputs.stcg15 || 0,
            stcgOther: inputs.stcgOther || 0,
            ltcg112A: Math.max(0, (inputs.ltcg10 || 0) - LTCG_112A_EXEMPTION),
            ltcg112A_raw: inputs.ltcg10 || 0,
            ltcgOther: inputs.ltcg20 || 0,
        };

        // --- Other Income ---
        result.otherIncome = (inputs.interestIncome || 0)
            + (inputs.dividendIncome || 0)
            + (inputs.otherIncome || 0);

        // --- Gross Total Income (excluding special rate CG) ---
        const normalIncome = result.netSalaryIncome
            + Math.max(result.housePropertyIncome, -200000) // Loss from HP capped at 2L
            + result.capitalGains.stcgOther
            + result.otherIncome;

        result.grossTotalIncome = normalIncome;

        // --- Deductions (Old Regime) ---
        const sec80C = Math.min(inputs.section80C || 0, 150000);
        const sec80CCD1B = Math.min(inputs.section80CCD1B || 0, 50000);
        const sec80CCD2 = inputs.section80CCD2 || 0;
        const sec80D_self = Math.min(inputs.section80D_self || 0,
            inputs.ageGroup === 'senior' || inputs.ageGroup === 'superSenior' ? 50000 : 25000);
        const sec80D_parents = Math.min(inputs.section80D_parents || 0, 50000);
        const sec80E = inputs.section80E || 0;
        const sec80G = inputs.section80G || 0;
        const sec80TTA = Math.min(inputs.section80TTA || 0,
            inputs.ageGroup === 'senior' || inputs.ageGroup === 'superSenior' ? 50000 : 10000);

        result.deductions = {
            '80C': sec80C,
            '80CCD(1B)': sec80CCD1B,
            '80CCD(2)': sec80CCD2,
            '80D (Self)': sec80D_self,
            '80D (Parents)': sec80D_parents,
            '80E': sec80E,
            '80G': sec80G,
            '80TTA/TTB': sec80TTA,
        };

        result.totalDeductions = sec80C + sec80CCD1B + sec80CCD2
            + sec80D_self + sec80D_parents + sec80E + sec80G + sec80TTA;

        // --- Taxable Income ---
        result.taxableIncome = Math.max(0, result.grossTotalIncome - result.totalDeductions);

        // --- Get slabs based on age ---
        let slabs;
        switch (inputs.ageGroup) {
            case 'senior':
                slabs = OLD_REGIME_SLABS_SENIOR;
                break;
            case 'superSenior':
                slabs = OLD_REGIME_SLABS_SUPER_SENIOR;
                break;
            default:
                slabs = OLD_REGIME_SLABS_GENERAL;
        }

        // --- Normal Income Tax ---
        const slabResult = calculateSlabTax(result.taxableIncome, slabs);
        result.normalTax = slabResult.tax;
        result.slabBreakdown = slabResult.breakdown;

        // --- Special Rate Tax (Capital Gains) ---
        const stcg111ATax = Math.round(result.capitalGains.stcg111A * STCG_111A_RATE);
        const ltcg112ATax = Math.round(result.capitalGains.ltcg112A * LTCG_112A_RATE);
        const ltcgOtherTax = Math.round(result.capitalGains.ltcgOther * LTCG_OTHER_RATE);

        result.specialRateTax = stcg111ATax + ltcg112ATax + ltcgOtherTax;
        result.specialRateBreakdown = {
            'STCG 111A (20%)': stcg111ATax,
            'LTCG 112A (12.5%)': ltcg112ATax,
            'LTCG Other (12.5%)': ltcgOtherTax,
        };

        // --- Total Tax Before Rebate ---
        result.totalTaxBeforeRebate = result.normalTax + result.specialRateTax;

        // --- Rebate 87A ---
        // Applies only to normal income tax, not special rate taxes
        if (result.taxableIncome <= REBATE_87A_OLD_LIMIT) {
            result.rebate87A = Math.min(result.normalTax, REBATE_87A_OLD_MAX);
        }

        // --- Tax After Rebate ---
        result.taxAfterRebate = Math.max(0, result.totalTaxBeforeRebate - result.rebate87A);

        // --- Surcharge ---
        const totalIncomeForSurcharge = result.taxableIncome
            + result.capitalGains.stcg111A
            + result.capitalGains.ltcg112A
            + result.capitalGains.ltcgOther;

        const surchargeResult = calculateSurcharge(totalIncomeForSurcharge, result.taxAfterRebate, false);
        result.surcharge = surchargeResult.surcharge;
        result.surchargeRate = surchargeResult.rate;

        // --- Cess ---
        result.cess = Math.round((result.taxAfterRebate + result.surcharge) * CESS_RATE);

        // --- Total Tax Liability ---
        result.totalTaxLiability = result.taxAfterRebate + result.surcharge + result.cess;

        // --- Effective Tax Rate ---
        const totalGross = inputs.grossSalary + (inputs.rentalIncome || 0)
            + (inputs.stcg15 || 0) + (inputs.stcgOther || 0)
            + (inputs.ltcg10 || 0) + (inputs.ltcg20 || 0)
            + result.otherIncome;
        result.effectiveTaxRate = totalGross > 0
            ? ((result.totalTaxLiability / totalGross) * 100).toFixed(2)
            : '0.00';

        return result;
    }

    // ──────────────────────────────────────────────────
    // MAIN: Calculate Tax for New Regime
    // ──────────────────────────────────────────────────

    function calculateNewRegime(inputs) {
        const result = {
            regime: 'new',
            grossSalary: inputs.grossSalary || 0,
            standardDeduction: 0,
            netSalaryIncome: 0,
            housePropertyIncome: 0,
            capitalGains: { stcg111A: 0, stcgOther: 0, ltcg112A: 0, ltcgOther: 0 },
            otherIncome: 0,
            grossTotalIncome: 0,
            deductions: {},
            totalDeductions: 0,
            taxableIncome: 0,
            normalTax: 0,
            specialRateTax: 0,
            totalTaxBeforeRebate: 0,
            rebate87A: 0,
            taxAfterRebate: 0,
            surcharge: 0,
            surchargeRate: 0,
            cess: 0,
            totalTaxLiability: 0,
            effectiveTaxRate: 0,
            slabBreakdown: []
        };

        // --- Salary Income (New regime: only Standard Deduction) ---
        result.standardDeduction = inputs.grossSalary > 0 ? STANDARD_DEDUCTION_NEW : 0;
        result.netSalaryIncome = Math.max(0, inputs.grossSalary - result.standardDeduction);

        // --- House Property ---
        result.housePropertyIncome = calculateHousePropertyIncome(
            inputs.rentalIncome, inputs.propertyTax, inputs.homeLoanInterest, false
        );

        // --- Capital Gains ---
        result.capitalGains = {
            stcg111A: inputs.stcg15 || 0,
            stcgOther: inputs.stcgOther || 0,
            ltcg112A: Math.max(0, (inputs.ltcg10 || 0) - LTCG_112A_EXEMPTION),
            ltcg112A_raw: inputs.ltcg10 || 0,
            ltcgOther: inputs.ltcg20 || 0,
        };

        // --- Other Income ---
        result.otherIncome = (inputs.interestIncome || 0)
            + (inputs.dividendIncome || 0)
            + (inputs.otherIncome || 0);

        // --- Gross Total Income ---
        const normalIncome = result.netSalaryIncome
            + Math.max(result.housePropertyIncome, -200000)
            + result.capitalGains.stcgOther
            + result.otherIncome;

        result.grossTotalIncome = normalIncome;

        // --- Deductions (New Regime — very limited) ---
        const sec80CCD2 = inputs.section80CCD2 || 0;  // Employer NPS: allowed
        result.deductions = {
            '80CCD(2) - Employer NPS': sec80CCD2,
        };
        result.totalDeductions = sec80CCD2;

        // --- Taxable Income ---
        result.taxableIncome = Math.max(0, result.grossTotalIncome - result.totalDeductions);

        // --- Tax Calculation ---
        const slabResult = calculateSlabTax(result.taxableIncome, NEW_REGIME_SLABS);
        result.normalTax = slabResult.tax;
        result.slabBreakdown = slabResult.breakdown;

        // --- Special Rate Tax ---
        const stcg111ATax = Math.round(result.capitalGains.stcg111A * STCG_111A_RATE);
        const ltcg112ATax = Math.round(result.capitalGains.ltcg112A * LTCG_112A_RATE);
        const ltcgOtherTax = Math.round(result.capitalGains.ltcgOther * LTCG_OTHER_RATE);

        result.specialRateTax = stcg111ATax + ltcg112ATax + ltcgOtherTax;
        result.specialRateBreakdown = {
            'STCG 111A (20%)': stcg111ATax,
            'LTCG 112A (12.5%)': ltcg112ATax,
            'LTCG Other (12.5%)': ltcgOtherTax,
        };

        // --- Total Tax Before Rebate ---
        result.totalTaxBeforeRebate = result.normalTax + result.specialRateTax;

        // --- Rebate 87A (New Regime) ---
        // Full rebate if taxable income ≤ ₹12,00,000 (excluding special rate income)
        if (result.taxableIncome <= REBATE_87A_NEW_LIMIT) {
            result.rebate87A = result.normalTax; // Full rebate on normal tax
        }

        // --- Tax After Rebate ---
        result.taxAfterRebate = Math.max(0, result.totalTaxBeforeRebate - result.rebate87A);

        // --- Surcharge ---
        const totalIncomeForSurcharge = result.taxableIncome
            + result.capitalGains.stcg111A
            + result.capitalGains.ltcg112A
            + result.capitalGains.ltcgOther;

        const surchargeResult = calculateSurcharge(totalIncomeForSurcharge, result.taxAfterRebate, true);
        result.surcharge = surchargeResult.surcharge;
        result.surchargeRate = surchargeResult.rate;

        // --- Cess ---
        result.cess = Math.round((result.taxAfterRebate + result.surcharge) * CESS_RATE);

        // --- Total Tax Liability ---
        result.totalTaxLiability = result.taxAfterRebate + result.surcharge + result.cess;

        // --- Effective Tax Rate ---
        const totalGross = inputs.grossSalary + (inputs.rentalIncome || 0)
            + (inputs.stcg15 || 0) + (inputs.stcgOther || 0)
            + (inputs.ltcg10 || 0) + (inputs.ltcg20 || 0)
            + result.otherIncome;
        result.effectiveTaxRate = totalGross > 0
            ? ((result.totalTaxLiability / totalGross) * 100).toFixed(2)
            : '0.00';

        return result;
    }

    // ──────────────────────────────────────────────────
    // COMPARE & RECOMMEND
    // ──────────────────────────────────────────────────

    function compare(inputs) {
        const oldResult = calculateOldRegime(inputs);
        const newResult = calculateNewRegime(inputs);

        const savings = oldResult.totalTaxLiability - newResult.totalTaxLiability;
        let recommendation;

        if (savings > 0) {
            recommendation = {
                winner: 'new',
                savings: savings,
                message: `New Regime saves you ₹${formatINR(savings)}`
            };
        } else if (savings < 0) {
            recommendation = {
                winner: 'old',
                savings: Math.abs(savings),
                message: `Old Regime saves you ₹${formatINR(Math.abs(savings))}`
            };
        } else {
            recommendation = {
                winner: 'tie',
                savings: 0,
                message: 'Both regimes result in the same tax liability'
            };
        }

        return { old: oldResult, new: newResult, recommendation };
    }

    // ──────────────────────────────────────────────────
    // GENERATE TIPS
    // ──────────────────────────────────────────────────

    function generateTips(inputs, results) {
        const tips = [];
        const oldTax = results.old.totalTaxLiability;
        const newTax = results.new.totalTaxLiability;

        // 80C utilization
        const used80C = inputs.section80C || 0;
        if (used80C < 150000 && results.recommendation.winner === 'old') {
            const remaining = 150000 - used80C;
            tips.push({
                icon: '💰',
                text: `You have <strong>₹${formatINR(remaining)}</strong> unused under Section 80C. Consider investing in ELSS, PPF, or NPS to reduce your Old Regime tax further.`,
                savings: `Save up to ₹${formatINR(Math.round(remaining * 0.3))}`
            });
        }

        // 80D
        const used80D = (inputs.section80D_self || 0) + (inputs.section80D_parents || 0);
        if (used80D === 0 && inputs.grossSalary > 500000) {
            tips.push({
                icon: '🏥',
                text: `You haven't claimed any <strong>health insurance premium</strong> under Section 80D. Self & parents' coverage can save up to ₹75,000 in deductions.`,
                savings: `Save up to ₹${formatINR(Math.round(75000 * 0.3))}`
            });
        }

        // NPS 80CCD(1B)
        if (!inputs.section80CCD1B && results.recommendation.winner === 'old') {
            tips.push({
                icon: '🏦',
                text: `Consider NPS (80CCD(1B)) for an <strong>additional ₹50,000</strong> deduction over 80C. This is one of the most effective tax-saving tools.`,
                savings: `Save up to ₹${formatINR(Math.round(50000 * 0.3))}`
            });
        }

        // HRA optimization
        if (inputs.hraReceived > 0 && (!inputs.rentPaid || inputs.rentPaid === 0)) {
            tips.push({
                icon: '🏠',
                text: `You receive HRA but haven't entered rent paid. If you're paying rent, <strong>claim HRA exemption</strong> to significantly reduce taxable salary under Old Regime.`,
            });
        }

        // Home loan interest
        if (!inputs.homeLoanInterest && inputs.rentalIncome > 0) {
            tips.push({
                icon: '🏡',
                text: `If you have a home loan on your rented property, the <strong>interest deduction under Section 24(b)</strong> can create a significant loss from house property, reducing overall tax.`,
            });
        }

        // New regime advantage explanation
        if (results.recommendation.winner === 'new') {
            tips.push({
                icon: '✨',
                text: `The <strong>New Regime</strong> is more beneficial for you because the lower slab rates and higher standard deduction (₹75,000) outweigh the deductions you're currently claiming.`,
            });

            if (results.recommendation.savings > 50000) {
                tips.push({
                    icon: '📊',
                    text: `With savings of <strong>₹${formatINR(results.recommendation.savings)}</strong> under the New Regime, you might want to redirect your 80C investments (ELSS, PPF) into higher-return non-tax-saving instruments.`,
                });
            }
        }

        // Old regime advantage explanation
        if (results.recommendation.winner === 'old' && results.recommendation.savings > 20000) {
            tips.push({
                icon: '🛡️',
                text: `Your <strong>deductions totaling ₹${formatINR(results.old.totalDeductions)}</strong> make the Old Regime more beneficial. Continue maximizing your tax-saving investments.`,
            });
        }

        // Rebate 87A tip
        if (results.new.rebate87A > 0) {
            tips.push({
                icon: '🎯',
                text: `You qualify for <strong>Section 87A rebate</strong> under the New Regime (income ≤ ₹12 lakh). This makes your normal income tax effectively ₹0.`,
            });
        }

        // High income surcharge
        if (results.old.surcharge > 0 || results.new.surcharge > 0) {
            tips.push({
                icon: '⚠️',
                text: `Surcharge applies on your income. Under the New Regime, surcharge is <strong>capped at 25%</strong> vs 37% in the Old Regime for very high incomes.`,
            });
        }

        // Employer NPS
        if (!inputs.section80CCD2 && inputs.grossSalary > 0) {
            tips.push({
                icon: '💼',
                text: `Ask your employer about <strong>NPS contribution under 80CCD(2)</strong>. This deduction is available in <strong>BOTH regimes</strong> — up to 10% of Basic + DA.`,
            });
        }

        // Capital gains tip
        if ((inputs.ltcg10 || 0) > 0 && (inputs.ltcg10 || 0) <= LTCG_112A_EXEMPTION) {
            tips.push({
                icon: '📈',
                text: `Your LTCG from equity (₹${formatINR(inputs.ltcg10)}) is within the <strong>₹1.25 lakh exemption</strong>. Consider harvesting gains up to this limit annually to reset your cost basis.`,
            });
        }

        return tips;
    }

    // ──────────────────────────────────────────────────
    // UTILITY
    // ──────────────────────────────────────────────────

    function formatINR(amount) {
        if (amount === 0) return '0';
        const absAmount = Math.abs(Math.round(amount));
        let result = absAmount.toString();

        // Indian number system: last 3 digits, then groups of 2
        const lastThree = result.substring(result.length - 3);
        const otherDigits = result.substring(0, result.length - 3);

        if (otherDigits !== '') {
            result = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
        } else {
            result = lastThree;
        }

        return amount < 0 ? `-${result}` : result;
    }

    // ──────────────────────────────────────────────────
    // PUBLIC API
    // ──────────────────────────────────────────────────

    return {
        calculateOldRegime,
        calculateNewRegime,
        compare,
        generateTips,
        formatINR,
        calculateHRAExemption,
        // Expose constants for UI
        STANDARD_DEDUCTION_OLD,
        STANDARD_DEDUCTION_NEW,
        LTCG_112A_EXEMPTION,
    };
})();
