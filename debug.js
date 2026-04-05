const vm = require('vm');
const fs = require('fs');

const taxEngineCode = fs.readFileSync('js/taxEngine.js', 'utf8');

const context = vm.createContext({});
vm.runInContext(taxEngineCode, context);

const debugCode = `
const tc1 = { ageGroup: 'below60', residencyStatus: 'resident', taxpayerType: 'individual', hasBusinessIncome: 'no', presumptiveTax: 'no', isDirector: 'no', hasUnlistedShares: 'no', hasForeignAssets: 'no', grossSalary: 800000, basicSalary: 400000, hraReceived: 120000, rentPaid: 0, isMetro: false, rentalIncome: 0, propertyTax: 0, homeLoanInterest: 0, numProperties: '1', stcg15: 0, stcgOther: 0, ltcg10: 0, ltcg20: 0, interestIncome: 0, dividendIncome: 0, otherIncome: 0, agriculturalIncome: 0, section80C: 50000, section80CCD1B: 0, section80CCD2: 0, section80D_self: 0, section80D_parents: 0, preventiveHealth: 0, section80E: 0, section80G: 0, section80TTA: 0 };
JSON.stringify(TaxEngine.compare(tc1), null, 2);
`;
const output = vm.runInContext(debugCode, context);
console.log(output);
