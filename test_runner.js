const vm = require('vm');
const fs = require('fs');

const taxEngineCode = fs.readFileSync('js/taxEngine.js', 'utf8');
const formSelectorCode = fs.readFileSync('js/formSelector.js', 'utf8');

const context = vm.createContext({});
vm.runInContext(taxEngineCode, context);
vm.runInContext(formSelectorCode, context);

const testCode = `
const tc1 = { ageGroup: 'below60', residencyStatus: 'resident', taxpayerType: 'individual', hasBusinessIncome: 'no', presumptiveTax: 'no', isDirector: 'no', hasUnlistedShares: 'no', hasForeignAssets: 'no', grossSalary: 800000, basicSalary: 400000, hraReceived: 120000, rentPaid: 0, isMetro: false, rentalIncome: 0, propertyTax: 0, homeLoanInterest: 0, numProperties: '1', stcg15: 0, stcgOther: 0, ltcg10: 0, ltcg20: 0, interestIncome: 0, dividendIncome: 0, otherIncome: 0, agriculturalIncome: 0, section80C: 50000, section80CCD1B: 0, section80CCD2: 0, section80D_self: 0, section80D_parents: 0, preventiveHealth: 0, section80E: 0, section80G: 0, section80TTA: 0 };
const tc2 = { ageGroup: '60to80', residencyStatus: 'resident', taxpayerType: 'individual', hasBusinessIncome: 'no', presumptiveTax: 'no', isDirector: 'no', hasUnlistedShares: 'no', hasForeignAssets: 'no', grossSalary: 300000, basicSalary: 0, hraReceived: 0, rentPaid: 0, isMetro: false, rentalIncome: 180000, propertyTax: 15000, homeLoanInterest: 0, numProperties: '1', stcg15: 0, stcgOther: 0, ltcg10: 0, ltcg20: 0, interestIncome: 60000, dividendIncome: 0, otherIncome: 0, agriculturalIncome: 0, section80C: 150000, section80CCD1B: 0, section80CCD2: 0, section80D_self: 50000, section80D_parents: 0, preventiveHealth: 0, section80E: 0, section80G: 0, section80TTA: 50000 };
const tc3 = { ageGroup: 'below60', residencyStatus: 'resident', taxpayerType: 'individual', hasBusinessIncome: 'no', presumptiveTax: 'no', isDirector: 'no', hasUnlistedShares: 'no', hasForeignAssets: 'no', grossSalary: 1500000, basicSalary: 700000, hraReceived: 240000, rentPaid: 180000, isMetro: true, rentalIncome: 0, propertyTax: 0, homeLoanInterest: 0, numProperties: '1', stcg15: 80000, stcgOther: 0, ltcg10: 250000, ltcg20: 0, interestIncome: 20000, dividendIncome: 0, otherIncome: 0, agriculturalIncome: 0, section80C: 150000, section80CCD1B: 50000, section80CCD2: 0, section80D_self: 25000, section80D_parents: 0, preventiveHealth: 0, section80E: 0, section80G: 0, section80TTA: 0 };
const tc4 = { ageGroup: 'below60', residencyStatus: 'resident', taxpayerType: 'individual', hasBusinessIncome: 'yes', presumptiveTax: 'yes', isDirector: 'no', hasUnlistedShares: 'no', hasForeignAssets: 'no', grossSalary: 0, basicSalary: 0, hraReceived: 0, rentPaid: 0, isMetro: false, rentalIncome: 0, propertyTax: 0, homeLoanInterest: 0, numProperties: '1', stcg15: 0, stcgOther: 0, ltcg10: 0, ltcg20: 0, interestIncome: 15000, dividendIncome: 0, otherIncome: 1200000, agriculturalIncome: 0, section80C: 100000, section80CCD1B: 0, section80CCD2: 0, section80D_self: 25000, section80D_parents: 0, preventiveHealth: 0, section80E: 0, section80G: 0, section80TTA: 0 };
const tc5 = { ageGroup: 'below60', residencyStatus: 'nri', taxpayerType: 'individual', hasBusinessIncome: 'no', presumptiveTax: 'no', isDirector: 'yes', hasUnlistedShares: 'yes', hasForeignAssets: 'yes', grossSalary: 2500000, basicSalary: 1200000, hraReceived: 0, rentPaid: 0, isMetro: false, rentalIncome: 0, propertyTax: 0, homeLoanInterest: 200000, numProperties: '3', stcg15: 150000, stcgOther: 0, ltcg10: 500000, ltcg20: 1000000, interestIncome: 50000, dividendIncome: 0, otherIncome: 0, agriculturalIncome: 0, section80C: 150000, section80CCD1B: 50000, section80CCD2: 0, section80D_self: 25000, section80D_parents: 0, preventiveHealth: 0, section80E: 0, section80G: 0, section80TTA: 0 };

function runTestCase(no, inputs) {
    const form = FormSelector.selectForm(inputs);
    const results = TaxEngine.compare(inputs);
    
    let res = {
        testCase: no,
        recommendedForm: form.fullName,
        formDescription: form.description,
        winner: results.recommendation.winner,
        savings: results.recommendation.savings,
        oldTax: results.old.totalTaxLiability,
        newTax: results.new.totalTaxLiability,
        newStandardDeduction: results.new.standardDeduction,
        oldStandardDeduction: results.old.standardDeduction,
        rebate87A_Old: results.old.rebate87A,
        rebate87A_New: results.new.rebate87A
    };

    if (no === 2) {
        res.rentIncome = results.old.housePropertyIncome;
        res.deduction80TTB = results.old.deductions['80TTA/TTB'];
        res.deduction80C = results.old.deductions['80C'];
        res.deduction80D = results.old.deductions['80D (Self)'];
    }
    if (no === 3) {
        res.hraExemption = results.old.hraExemption;
        res.stcg111A = results.old.capitalGains.stcg111A;
        res.ltcg112A_raw = results.old.capitalGains.ltcg112A_raw;
        res.ltcg112A_taxed = results.old.capitalGains.ltcg112A;
    }
    if (no === 4) {
        res.otherIncome = results.old.otherIncome;
    }
    if (no === 5) {
        res.foreignAssets = inputs.hasForeignAssets;
        res.nri = inputs.residencyStatus;
    }
    return res;
}

const outputs = [
    runTestCase(1, tc1),
    runTestCase(2, tc2),
    runTestCase(3, tc3),
    runTestCase(4, tc4),
    runTestCase(5, tc5),
];
JSON.stringify(outputs, null, 2);
`;

const outputs = vm.runInContext(testCode, context);
console.log(outputs);
