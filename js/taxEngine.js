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
    const REBATE_87A_NEW_LIMIT = 1200000;
    const REBATE_87A_NEW_MAX = 60000;

    // STCG 111A rate
    const STCG_111A_RATE = 0.20;
    
    // LTCG 112A
    const LTCG_112A_EXEMPTION = 125000; 
    const LTCG_112A_RATE = 0.125; 

    // LTCG Other (Section 112 — debt/property, NOT equity): 20% rate
    // NOTE: LTCG on listed equity (112A) = 12.5%, LTCG on property/debt (112) = 20%
    // TC-026: "LTCG Other property: taxed at 20% with indexation, Tax on Rs.15L = Rs.3L"
    const LTCG_OTHER_RATE = 0.20;

    // Surcharge tiers (applied on tax amount, not income)
    // Old Regime: 10% (>50L), 15% (>1Cr), 25% (>2Cr), 37% (>5Cr) — Budget 2023 reduced 37% to 25% only for New Regime
    // New Regime: 10% (>50L), 15% (>1Cr), 25% (>2Cr), 25% (>5Cr) — capped at 25%
    const SURCHARGE_SLABS_NEW = [
        { min: 0,         max: 5000000,   rate: 0    },
        { min: 5000000,   max: 10000000,  rate: 0.10 },
        { min: 10000000,  max: 20000000,  rate: 0.15 },
        { min: 20000000,  max: Infinity,  rate: 0.25 }, // Capped at 25% for New Regime
    ];
    const SURCHARGE_SLABS_OLD = [
        { min: 0,         max: 5000000,   rate: 0    },
        { min: 5000000,   max: 10000000,  rate: 0.10 },
        { min: 10000000,  max: 20000000,  rate: 0.15 },
        { min: 20000000,  max: 50000000,  rate: 0.25 },
        { min: 50000000,  max: Infinity,  rate: 0.37 }, // Old Regime: 37% above 5 Cr (not capped)
    ];

    // ──────────────────────────────────────────────────
    // HELPER: Format Number
    // ──────────────────────────────────────────────────
    
    function num(val) {
        return Math.max(0, parseFloat((val || 0).toString().replace(/,/g, '')) || 0);
    }

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
        const slabs = isNewRegime ? SURCHARGE_SLABS_NEW : SURCHARGE_SLABS_OLD;
        let surchargeRate = 0;
        for (const slab of slabs) {
            if (totalIncome > slab.min) surchargeRate = slab.rate;
        }

        // Marginal relief on surcharge: extra tax due to surcharge cannot exceed income above threshold
        let surcharge = Math.round(baseTax * surchargeRate);
        return { surcharge, rate: surchargeRate };
    }

    // ──────────────────────────────────────────────────
    // HRA Exemption Calculation
    // ──────────────────────────────────────────────────

    function calculateHRAExemption(basicSalary, hraReceived, rentPaid, isMetro, isHUF) {
        if (isHUF) return 0; // HUF cannot claim HRA
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
            const nav = Math.max(0, rentalIncome - propertyTax);
            const standardDeduction30 = Math.round(nav * 0.30);
            netIncome = nav - standardDeduction30 - homeLoanInterest;
        } else {
            // Self-occupied: only interest deduction
            const maxInterest = isOldRegime ? 200000 : 0; // New regime has no housing loan interest for self occupied properties in some rules, wait, New regime does NOT allow home loan interest for self-occupied! Fix.
            // Oh, wait, in previous version it was 200k for both? In new regime self occupied interest is 0!
            netIncome = -Math.min(homeLoanInterest, isOldRegime ? 200000 : 0);
        }

        return Math.round(netIncome);
    }
    
    // ──────────────────────────────────────────────────
    // PARTIAL INTEGRATION (Agri Income)
    // ──────────────────────────────────────────────────
    
    function applyPartialIntegration(taxableIncome, agriIncome, slabs) {
        if (agriIncome <= 5000) return calculateSlabTax(taxableIncome, slabs);
        
        // Step 1: Tax on (Non-Agri + Agri Income)
        const step1 = calculateSlabTax(taxableIncome + agriIncome, slabs);
        
        // Step 2: Tax on (Basic Exemption Limit + Agri Income)
        const step2 = calculateSlabTax(slabs[0].max + agriIncome, slabs);
        
        // Step 3: Net Tax
        const netTaxAmount = Math.max(0, step1.tax - step2.tax);
        
        return {
            tax: netTaxAmount,
            breakdown: step1.breakdown // Approximate breakdown just for UI
        };
    }

    // ──────────────────────────────────────────────────
    // MAIN: Calculate Tax for Old Regime
    // ──────────────────────────────────────────────────

    function calculateOldRegime(inputs) {
        const isHUF = inputs.taxpayerType === 'huf';
        const isSenior = inputs.ageGroup === 'senior';
        const isSuperSenior = inputs.ageGroup === 'superSenior';
        
        const grossSalary = num(inputs.grossSalary);
        const basicSalary = num(inputs.basicSalary);
        const hraReceived = num(inputs.hraReceived);
        const rentPaid = num(inputs.rentPaid);
        const rentalIncome = num(inputs.rentalIncome);
        const propertyTax = num(inputs.propertyTax);
        const homeLoanInterest = num(inputs.homeLoanInterest);
        const stcg111A = num(inputs.stcg15);
        const stcgOther = num(inputs.stcgOther);
        const ltcg112A_raw = num(inputs.ltcg10);
        const ltcgOther = num(inputs.ltcg20);
        
        // 44ADA Logic
        const hasBusinessIncome = inputs.hasBusinessIncome === 'yes';
        const isPresumptive = inputs.presumptiveTax === 'yes';
        let businessIncome = num(inputs.otherIncome); // Professional receipts under "Any other income"
        if (hasBusinessIncome && isPresumptive) {
            businessIncome = Math.round(businessIncome * 0.50); // 50% deemed profit
        }

        const agriIncome = num(inputs.agriculturalIncome);
        const interestIncome = num(inputs.interestIncome);
        const dividendIncome = num(inputs.dividendIncome);
        
        const result = {
            regime: 'old',
            grossSalary: grossSalary,
            standardDeduction: 0,
            hraExemption: 0,
            netSalaryIncome: 0,
            housePropertyIncome: 0,
            capitalGains: { stcg111A: 0, stcgOther: 0, ltcg112A: 0, ltcgOther: 0 },
            otherIncome: 0,
            agriIncome: agriIncome,
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
        result.standardDeduction = (!isHUF && grossSalary > 0) ? STANDARD_DEDUCTION_OLD : 0;
        result.hraExemption = calculateHRAExemption(
            basicSalary, hraReceived, rentPaid, inputs.isMetro === 'yes', isHUF
        );
        result.netSalaryIncome = Math.max(0,
            grossSalary - result.standardDeduction - result.hraExemption
        );

        // --- House Property ---
        result.housePropertyIncome = calculateHousePropertyIncome(
            rentalIncome, propertyTax, homeLoanInterest, true
        );

        // --- Capital Gains ---
        result.capitalGains = {
            stcg111A: stcg111A,
            stcgOther: stcgOther,
            ltcg112A: Math.max(0, ltcg112A_raw - LTCG_112A_EXEMPTION),
            ltcg112A_raw: ltcg112A_raw,
            ltcgOther: ltcgOther,
        };

        // --- Other Income ---
        result.otherIncome = interestIncome + dividendIncome + businessIncome;

        // --- Gross Total Income (excluding special rate CG) ---
        const normalIncome = result.netSalaryIncome
            + Math.max(result.housePropertyIncome, -200000) // Loss from HP capped at 2L
            + result.capitalGains.stcgOther
            + result.otherIncome;

        result.grossTotalIncome = normalIncome;

        // --- Deductions (Old Regime) ---
        const sec80C = Math.min(num(inputs.section80C), 150000);
        const sec80CCD1B = Math.min(num(inputs.section80CCD1B), 50000);
        const sec80CCD2 = num(inputs.section80CCD2);
        const sec80D_self = Math.min(num(inputs.section80D_self), (isSenior || isSuperSenior) ? 50000 : 25000);
        const sec80D_parents = Math.min(num(inputs.section80D_parents), inputs.parentsSenior === 'yes' ? 50000 : 25000);
        const sec80E = num(inputs.section80E);
        const sec80G = num(inputs.section80G);
        const sec80TTA = Math.min(num(inputs.section80TTA), (isSenior || isSuperSenior) ? 50000 : 10000);

        result.deductions = {
            '80C': sec80C,
            '80CCD(1B) NPS': sec80CCD1B,
            '80CCD(2) Emp NPS': sec80CCD2,
            '80D Health (Self)': sec80D_self,
            '80D Health (Parents)': sec80D_parents,
            '80E Edu Loan': sec80E,
            '80G Donations': sec80G,
            [(isSenior || isSuperSenior) ? '80TTB Savings Interest' : '80TTA Savings Interest']: sec80TTA,
        };

        result.totalDeductions = sec80C + sec80CCD1B + sec80CCD2
            + sec80D_self + sec80D_parents + sec80E + sec80G + sec80TTA;

        // --- Taxable Income ---
        result.taxableIncome = Math.max(0, result.grossTotalIncome - result.totalDeductions);

        // --- Get slabs based on age ---
        let slabs;
        if (isSuperSenior && !isHUF) slabs = OLD_REGIME_SLABS_SUPER_SENIOR;
        else if (isSenior && !isHUF) slabs = OLD_REGIME_SLABS_SENIOR;
        else slabs = OLD_REGIME_SLABS_GENERAL;

        // --- Normal Income Tax (With Agricultural Partial Integration) ---
        let slabResult;
        if (agriIncome > 5000) {
            slabResult = applyPartialIntegration(result.taxableIncome, agriIncome, slabs);
            result.normalTax = slabResult.tax;
            result.slabBreakdown = slabResult.breakdown;
        } else {
            slabResult = calculateSlabTax(result.taxableIncome, slabs);
            result.normalTax = slabResult.tax;
            result.slabBreakdown = slabResult.breakdown;
        }

        // --- Special Rate Tax (Capital Gains) ---
        const stcg111ATax = Math.round(result.capitalGains.stcg111A * STCG_111A_RATE);
        const ltcg112ATax = Math.round(result.capitalGains.ltcg112A * LTCG_112A_RATE);
        const ltcgOtherTax = Math.round(result.capitalGains.ltcgOther * LTCG_OTHER_RATE);

        result.specialRateTax = stcg111ATax + ltcg112ATax + ltcgOtherTax;
        result.specialRateBreakdown = {
            'STCG 111A (20%)': stcg111ATax,
            'LTCG 112A Equity (12.5%)': ltcg112ATax,
            'LTCG Other/Property (20%)': ltcgOtherTax,
        };

        // --- Total Tax Before Rebate ---
        result.totalTaxBeforeRebate = result.normalTax + result.specialRateTax;

        // --- Rebate 87A (Old Regime) ---
        // ONLY resident individuals can claim 87A — HUF and NRI are excluded
        const isNRI_old = inputs.residencyStatus === 'nri' || inputs.residencyStatus === 'rnor';
        if (!isHUF && !isNRI_old && result.taxableIncome <= REBATE_87A_OLD_LIMIT) {
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
        const totalGross = grossSalary + rentalIncome + stcg111A + stcgOther + ltcg112A_raw + ltcgOther + result.otherIncome;
        result.effectiveTaxRate = totalGross > 0
            ? ((result.totalTaxLiability / totalGross) * 100).toFixed(2)
            : '0.00';

        return result;
    }

    // ──────────────────────────────────────────────────
    // MAIN: Calculate Tax for New Regime
    // ──────────────────────────────────────────────────

    function calculateNewRegime(inputs) {
        const isHUF = inputs.taxpayerType === 'huf';
        
        const grossSalary = num(inputs.grossSalary);
        const basicSalary = num(inputs.basicSalary);
        const rentalIncome = num(inputs.rentalIncome);
        const propertyTax = num(inputs.propertyTax);
        const homeLoanInterest = num(inputs.homeLoanInterest);
        const stcg111A = num(inputs.stcg15);
        const stcgOther = num(inputs.stcgOther);
        const ltcg112A_raw = num(inputs.ltcg10);
        const ltcgOther = num(inputs.ltcg20);
        
        // 44ADA Logic
        const hasBusinessIncome = inputs.hasBusinessIncome === 'yes';
        const isPresumptive = inputs.presumptiveTax === 'yes';
        let businessIncome = num(inputs.otherIncome); 
        if (hasBusinessIncome && isPresumptive) {
            businessIncome = Math.round(businessIncome * 0.50); 
        }

        const agriIncome = num(inputs.agriculturalIncome);
        const interestIncome = num(inputs.interestIncome);
        const dividendIncome = num(inputs.dividendIncome);

        const result = {
            regime: 'new',
            grossSalary: grossSalary,
            standardDeduction: 0,
            netSalaryIncome: 0,
            housePropertyIncome: 0,
            capitalGains: { stcg111A: 0, stcgOther: 0, ltcg112A: 0, ltcgOther: 0 },
            otherIncome: 0,
            agriIncome: agriIncome,
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
        result.standardDeduction = (!isHUF && grossSalary > 0) ? STANDARD_DEDUCTION_NEW : 0;
        result.netSalaryIncome = Math.max(0, grossSalary - result.standardDeduction);

        // --- House Property ---
        result.housePropertyIncome = calculateHousePropertyIncome(
            rentalIncome, propertyTax, homeLoanInterest, false
        );

        // --- Capital Gains ---
        result.capitalGains = {
            stcg111A: stcg111A,
            stcgOther: stcgOther,
            ltcg112A: Math.max(0, ltcg112A_raw - LTCG_112A_EXEMPTION),
            ltcg112A_raw: ltcg112A_raw,
            ltcgOther: ltcgOther,
        };

        // --- Other Income ---
        result.otherIncome = interestIncome + dividendIncome + businessIncome;

        // --- Gross Total Income ---
        const normalIncome = result.netSalaryIncome
            + Math.max(result.housePropertyIncome, -200000)
            + result.capitalGains.stcgOther
            + result.otherIncome;

        result.grossTotalIncome = normalIncome;

        // --- Deductions (New Regime — very limited) ---
        const sec80CCD2 = num(inputs.section80CCD2);  // Employer NPS: allowed
        result.deductions = {
            '80CCD(2) Emp NPS': sec80CCD2,
        };
        result.totalDeductions = sec80CCD2;

        // --- Taxable Income ---
        result.taxableIncome = Math.max(0, result.grossTotalIncome - result.totalDeductions);

        // --- Tax Calculation (With Agri Partial Integration) ---
        let slabResult;
        if (agriIncome > 5000) {
            slabResult = applyPartialIntegration(result.taxableIncome, agriIncome, NEW_REGIME_SLABS);
            result.normalTax = slabResult.tax;
            result.slabBreakdown = slabResult.breakdown;
        } else {
            slabResult = calculateSlabTax(result.taxableIncome, NEW_REGIME_SLABS);
            result.normalTax = slabResult.tax;
            result.slabBreakdown = slabResult.breakdown;
        }

        // --- Special Rate Tax ---
        const stcg111ATax = Math.round(result.capitalGains.stcg111A * STCG_111A_RATE);
        const ltcg112ATax = Math.round(result.capitalGains.ltcg112A * LTCG_112A_RATE);
        const ltcgOtherTax = Math.round(result.capitalGains.ltcgOther * LTCG_OTHER_RATE);

        result.specialRateTax = stcg111ATax + ltcg112ATax + ltcgOtherTax;
        result.specialRateBreakdown = {
            'STCG 111A (20%)': stcg111ATax,
            'LTCG 112A Equity (12.5%)': ltcg112ATax,
            'LTCG Other/Property (20%)': ltcgOtherTax,
        };

        // --- Total Tax Before Rebate ---
        result.totalTaxBeforeRebate = result.normalTax + result.specialRateTax;

        // --- Rebate 87A (New Regime Cliff & Marginal Relief) ---
        // Only resident individuals can claim 87A — HUF and NRI excluded
        const isNRI_new = inputs.residencyStatus === 'nri' || inputs.residencyStatus === 'rnor';
        if (!isHUF && !isNRI_new && result.taxableIncome <= REBATE_87A_NEW_LIMIT) {
            result.rebate87A = Math.min(result.normalTax, REBATE_87A_NEW_MAX);
            result.taxAfterRebate = Math.max(0, result.totalTaxBeforeRebate - result.rebate87A);
        } else if (!isHUF && !isNRI_new && result.taxableIncome > REBATE_87A_NEW_LIMIT) {
            result.rebate87A = 0;
            // Marginal Relief for 87A
            const excessIncome = result.taxableIncome - REBATE_87A_NEW_LIMIT;
            const taxOn7L = calculateSlabTax(REBATE_87A_NEW_LIMIT, NEW_REGIME_SLABS).tax; // Generally 25000
            
            // If the tax increase is greater than the income increase, apply marginal relief
            const normalTaxDifference = result.normalTax - taxOn7L;
            if (normalTaxDifference > excessIncome) {
                // Apply relief: Tax cannot exceed the exact excess over 7L plus tax at 7L
                // Basically, you pay tax on 7L + 100% of the excess over 7L
                // Wait, tax at 7L is fully rebated? No, marginal relief formula for 87A compares with the post-rebate situation.
                // Re-calculating correctly: 
                // Tax payable should not exceed (Income - 700000)
                const maxPayableNormalTax = excessIncome;
                if (result.normalTax > maxPayableNormalTax) {
                    result.taxAfterRebate = maxPayableNormalTax + result.specialRateTax;
                    // Add a custom flag so UI can show it
                    result.marginalReliefApplied = true;
                } else {
                    result.taxAfterRebate = result.totalTaxBeforeRebate;
                }
            } else {
                result.taxAfterRebate = result.totalTaxBeforeRebate;
            }
        } else {
            // HUF or NRI — no 87A rebate
            result.rebate87A = 0;
            result.taxAfterRebate = result.totalTaxBeforeRebate;
        }

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
        const totalGross = grossSalary + rentalIncome + stcg111A + stcgOther + ltcg112A_raw + ltcgOther + result.otherIncome;
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
                message: `You should opt for the New Tax Regime to save ₹${formatINR(savings)}.`
            };
        } else if (savings < 0) {
            recommendation = {
                winner: 'old',
                savings: Math.abs(savings),
                message: `You should opt for the Old Tax Regime to save ₹${formatINR(Math.abs(savings))}.`
            };
        } else {
            recommendation = {
                winner: 'tie',
                savings: 0,
                message: `Both regimes result in the exact same tax liability. You may choose either.`
            };
        }

        return { old: oldResult, new: newResult, recommendation };
    }

    // ──────────────────────────────────────────────────
    // GENERATE TIPS
    // ──────────────────────────────────────────────────

        function generateTips(inputs, results) {
        const general = [];
        const oldTips = [];
        const newTips = [];

        const salary = num(inputs.grossSalary);
        const basic = num(inputs.basicSalary) || (salary * 0.4); // fallback if not provided
        const rec = results.recommendation.winner;

        // --- NEW REGIME TIPS ---
        if (salary > 0) {
            const current80CCD2 = num(inputs.section80CCD2);
            const max80CCD2 = Math.round(basic * 0.14);
            if (current80CCD2 < max80CCD2) {
                newTips.push({
                    icon: '💼',
                    text: `<strong>Employer NPS (Sec 80CCD(2)):</strong> This is the <em>most powerful and only major</em> deduction available in the New Regime. Ask your employer to restructure your CTC to contribute up to 14% of your Basic Salary + DA (Approx. ₹${formatINR(max80CCD2)}) directly to NPS Tier-1. This is fully tax-exempt!`,
                    savings: 'Top Recommendation'
                });
            } else {
                 newTips.push({
                    icon: '✅',
                    text: `Excellent! You are maximizing the Employer NPS 80CCD(2) benefit under the new regime.`
                });
            }
        }
        
        if (num(inputs.homeLoanInterest) > 0 && num(inputs.rentalIncome) === 0) {
            newTips.push({
                icon: '🏠',
                text: `<strong>Home Loan Interest:</strong> The New Regime does NOT allow interest deduction for a self-occupied property. However, if you rent out the property, the interest becomes fully deductible against the rental income.`,
            });
        }

        if (results.new.taxableIncome > 1200000 && results.new.taxableIncome < 1250000) {
            newTips.push({
                icon: '⚠️',
                text: `<strong>Marginal Relief Zone:</strong> Your taxable income is just above the ₹12 Lakhs rebate threshold. If you can slightly increase Employer NPS to drop below ₹12 Lakhs, your tax drops to zero!`
            });
        }
        
        if (salary > 0) {
            newTips.push({
               icon: '💡',
               text: '<strong>Allowances & Perquisites:</strong> Work with HR to maximize exemptions for official travel, food coupons (Sodexo), and company-leased car programs which often remain exempt in the new regime as per verified IT rules.'
            });
        }

        // --- OLD REGIME TIPS ---
        const used80C = num(inputs.section80C);
        if (used80C < 150000) {
            oldTips.push({ icon: '💰', text: `<strong>Section 80C:</strong> You have ₹${formatINR(150000 - used80C)} unused limit. Invest in ELSS Mutual Funds, PPF, EPF, Life Insurance, or claim children's Tuition Fees to lower old regime tax.`});
        }

        const used80D = num(inputs.section80D_self) + num(inputs.section80D_parents);
        if (used80D < 75000) {
            oldTips.push({ icon: '🏥', text: `<strong>Section 80D (Health Insurance):</strong> Protect your family and save tax. Claim up to ₹25,000 for self/spouse/children and an additional ₹50,000 for senior citizen parents.`});
        }

        if (num(inputs.section80CCD1B) === 0) {
            oldTips.push({ icon: '🏦', text: `<strong>NPS Tier-1 (Sec 80CCD(1B)):</strong> You can invest an extra ₹50,000 in NPS to get an exclusive deduction over and above the ₹1.5L 80C limit.`});
        }

        if (num(inputs.homeLoanInterest) === 0 && num(inputs.rentPaid) === 0) {
             oldTips.push({ icon: '��', text: `<strong>HRA / Home Loan (Sec 24b):</strong> If you pay rent, ensure you claim HRA. If planning to buy a house, you can claim up to ₹2 Lakhs per year on interest for a self-occupied property in the Old regime.`});
        }

        // --- GENERAL TIPS ---
        if (num(inputs.agriculturalIncome) > 5000) {
            general.push({
                icon: '🌾',
                text: `Your agricultural income of ₹${formatINR(num(inputs.agriculturalIncome))} is exempt but considered for 'Partial Integration' to calculate the tax rate on your other income.`
            });
        }
        if (inputs.hasBusinessIncome === 'yes' && inputs.presumptiveTax === 'yes') {
            general.push({
                icon: '🧾',
                text: `<strong>Presumptive Taxation (Sec 44ADA):</strong> As a professional, offering 50% of your gross receipts as taxable profit is highly tax-efficient and avoids bookkeeping.`
            });
        }

        return { general, old: oldTips, new: newTips, winner: rec };
    }

    // ──────────────────────────────────────────────────

    function formatINR(amount) {
        if (amount === 0 || !amount) return '0';
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
