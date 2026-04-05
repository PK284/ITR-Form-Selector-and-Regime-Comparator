/**
 * ============================================================
 * UI CONTROLLER — Renders results, manages DOM updates
 * ============================================================
 */

const UIController = (() => {
    'use strict';

    // ──────────────────────────────────────────────────
    // RENDER ITR FORM RESULT
    // ──────────────────────────────────────────────────

    function renderITRResult(formResult) {
        const container = document.getElementById('itrResult');
        
        const reasonsHTML = formResult.reasons.map(r => `<li>${r}</li>`).join('');
        const warningsHTML = (formResult.warnings && formResult.warnings.length > 0) ? 
            formResult.warnings.map(w => `<li style="color:var(--error);">${w}</li>`).join('') : '';
        
        container.innerHTML = `
            <div class="itr-form-badge" style="border-color: ${formResult.color}40; background: ${formResult.color}10;">
                <div>
                    <div class="itr-form-number" style="background: linear-gradient(135deg, ${formResult.color}, ${formResult.color}99); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${formResult.form}</div>
                    ${formResult.name ? `<div class="itr-form-name">${formResult.name}</div>` : ''}
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 4px;">${formResult.fullName}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${formResult.description}</div>
                </div>
            </div>
            <div>
                <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px;">Why this form?</div>
                <ul class="itr-reasons">${reasonsHTML}</ul>
                ${warningsHTML ? `<div style="font-size: 0.82rem; font-weight: 600; color: var(--error); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 16px; margin-bottom: 8px;">Important Warnings</div><ul class="itr-reasons" style="background-color: #ff00000a; padding: 12px 12px 12px 28px; border-radius: 6px;">${warningsHTML}</ul>` : ''}
            </div>
        `;
    }

    // ──────────────────────────────────────────────────
    // RENDER REGIME COMPARISON
    // ──────────────────────────────────────────────────

    function renderComparison(results) {
        const { old: oldResult, new: newResult, recommendation } = results;
        const container = document.getElementById('comparisonGrid');
        const badge = document.getElementById('winnerBadge');

        // Winner badge
        if (recommendation.winner === 'old') {
            badge.className = 'winner-badge old-wins';
            badge.textContent = '🏆 Old Regime Wins';
        } else if (recommendation.winner === 'new') {
            badge.className = 'winner-badge new-wins';
            badge.textContent = '🏆 New Regime Wins';
        } else {
            badge.className = 'winner-badge tie';
            badge.textContent = '🤝 It\'s a Tie';
        }

        const oldIsWinner = recommendation.winner === 'old';
        const newIsWinner = recommendation.winner === 'new';

        container.innerHTML = `
            <div class="comparison-column ${oldIsWinner ? 'winner' : ''}">
                <div class="comparison-column-header">
                    <div class="comparison-column-title">Old Regime</div>
                    <div class="comparison-column-amount">₹${TaxEngine.formatINR(oldResult.totalTaxLiability)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 4px;">
                        Effective Rate: ${oldResult.effectiveTaxRate}%
                    </div>
                </div>
                <div class="comparison-row">
                    <span class="comparison-row-label">Gross Income</span>
                    <span class="comparison-row-value">₹${TaxEngine.formatINR(oldResult.grossSalary + (oldResult.otherIncome || 0))}</span>
                </div>
                <div class="comparison-row">
                    <span class="comparison-row-label">Standard Deduction</span>
                    <span class="comparison-row-value">- ₹${TaxEngine.formatINR(oldResult.standardDeduction)}</span>
                </div>
                ${oldResult.hraExemption > 0 ? `
                <div class="comparison-row">
                    <span class="comparison-row-label">HRA Exemption</span>
                    <span class="comparison-row-value">- ₹${TaxEngine.formatINR(oldResult.hraExemption)}</span>
                </div>` : ''}
                <div class="comparison-row">
                    <span class="comparison-row-label">Deductions (80C, 80D etc.)</span>
                    <span class="comparison-row-value">- ₹${TaxEngine.formatINR(oldResult.totalDeductions)}</span>
                </div>
                <div class="comparison-row">
                    <span class="comparison-row-label">Taxable Income</span>
                    <span class="comparison-row-value">₹${TaxEngine.formatINR(oldResult.taxableIncome)}</span>
                </div>
                <div class="comparison-row">
                    <span class="comparison-row-label">Tax (Slabs)</span>
                    <span class="comparison-row-value">₹${TaxEngine.formatINR(oldResult.normalTax)}</span>
                </div>
                ${oldResult.specialRateTax > 0 ? `
                <div class="comparison-row">
                    <span class="comparison-row-label">Tax (Capital Gains)</span>
                    <span class="comparison-row-value">₹${TaxEngine.formatINR(oldResult.specialRateTax)}</span>
                </div>` : ''}
                ${oldResult.rebate87A > 0 ? `
                <div class="comparison-row">
                    <span class="comparison-row-label">Rebate u/s 87A</span>
                    <span class="comparison-row-value" style="color: var(--accent-secondary);">- ₹${TaxEngine.formatINR(oldResult.rebate87A)}</span>
                </div>` : ''}
                ${oldResult.surcharge > 0 ? `
                <div class="comparison-row">
                    <span class="comparison-row-label">Surcharge (${(oldResult.surchargeRate * 100).toFixed(0)}%)</span>
                    <span class="comparison-row-value">₹${TaxEngine.formatINR(oldResult.surcharge)}</span>
                </div>` : ''}
                <div class="comparison-row">
                    <span class="comparison-row-label">Cess (4%)</span>
                    <span class="comparison-row-value">₹${TaxEngine.formatINR(oldResult.cess)}</span>
                </div>
                <div class="comparison-row total">
                    <span class="comparison-row-label">Total Tax</span>
                    <span class="comparison-row-value" ${oldIsWinner ? 'style="color: var(--accent-secondary);"' : ''}>₹${TaxEngine.formatINR(oldResult.totalTaxLiability)}</span>
                </div>
            </div>
            <div class="comparison-column ${newIsWinner ? 'winner' : ''}">
                <div class="comparison-column-header">
                    <div class="comparison-column-title">New Regime</div>
                    <div class="comparison-column-amount">₹${TaxEngine.formatINR(newResult.totalTaxLiability)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 4px;">
                        Effective Rate: ${newResult.effectiveTaxRate}%
                    </div>
                </div>
                <div class="comparison-row">
                    <span class="comparison-row-label">Gross Income</span>
                    <span class="comparison-row-value">₹${TaxEngine.formatINR(newResult.grossSalary + (newResult.otherIncome || 0))}</span>
                </div>
                <div class="comparison-row">
                    <span class="comparison-row-label">Standard Deduction</span>
                    <span class="comparison-row-value">- ₹${TaxEngine.formatINR(newResult.standardDeduction)}</span>
                </div>
                <div class="comparison-row">
                    <span class="comparison-row-label">Deductions</span>
                    <span class="comparison-row-value">- ₹${TaxEngine.formatINR(newResult.totalDeductions)}</span>
                </div>
                <div class="comparison-row">
                    <span class="comparison-row-label">Taxable Income</span>
                    <span class="comparison-row-value">₹${TaxEngine.formatINR(newResult.taxableIncome)}</span>
                </div>
                <div class="comparison-row">
                    <span class="comparison-row-label">Tax (Slabs)</span>
                    <span class="comparison-row-value">₹${TaxEngine.formatINR(newResult.normalTax)}</span>
                </div>
                ${newResult.specialRateTax > 0 ? `
                <div class="comparison-row">
                    <span class="comparison-row-label">Tax (Capital Gains)</span>
                    <span class="comparison-row-value">₹${TaxEngine.formatINR(newResult.specialRateTax)}</span>
                </div>` : ''}
                ${newResult.rebate87A > 0 ? `
                <div class="comparison-row">
                    <span class="comparison-row-label">Rebate u/s 87A</span>
                    <span class="comparison-row-value" style="color: var(--accent-secondary);">- ₹${TaxEngine.formatINR(newResult.rebate87A)}</span>
                </div>` : ''}
                ${newResult.surcharge > 0 ? `
                <div class="comparison-row">
                    <span class="comparison-row-label">Surcharge (${(newResult.surchargeRate * 100).toFixed(0)}%)</span>
                    <span class="comparison-row-value">₹${TaxEngine.formatINR(newResult.surcharge)}</span>
                </div>` : ''}
                <div class="comparison-row">
                    <span class="comparison-row-label">Cess (4%)</span>
                    <span class="comparison-row-value">₹${TaxEngine.formatINR(newResult.cess)}</span>
                </div>
                <div class="comparison-row total">
                    <span class="comparison-row-label">Total Tax</span>
                    <span class="comparison-row-value" ${newIsWinner ? 'style="color: var(--accent-secondary);"' : ''}>₹${TaxEngine.formatINR(newResult.totalTaxLiability)}</span>
                </div>
            </div>
            ${recommendation.savings > 0 ? `
            <div class="savings-callout">
                <div>
                    <div class="savings-callout-amount">₹${TaxEngine.formatINR(recommendation.savings)}</div>
                    <div class="savings-callout-text">${recommendation.message}</div>
                </div>
            </div>` : `
            <div class="savings-callout">
                <div>
                    <div class="savings-callout-text">${recommendation.message}</div>
                </div>
            </div>`}
        `;
    }

    // ──────────────────────────────────────────────────
    // RENDER DETAILED BREAKDOWN
    // ──────────────────────────────────────────────────

    function renderBreakdown(results) {
        renderBreakdownForRegime(results.old, 'breakdownOld');
        renderBreakdownForRegime(results.new, 'breakdownNew');
    }

    function renderBreakdownForRegime(result, containerId) {
        const container = document.getElementById(containerId);
        const isOld = result.regime === 'old';

        let rows = '';

        // Income section
        rows += sectionHeader('Income');
        rows += breakdownRow('Gross Salary / Pension', result.grossSalary);
        rows += breakdownRow(`Standard Deduction`, -result.standardDeduction, 'negative');
        if (isOld && result.hraExemption > 0) {
            rows += breakdownRow('HRA Exemption', -result.hraExemption, 'negative');
        }
        rows += breakdownRow('Net Salary Income', result.netSalaryIncome);

        if (result.housePropertyIncome !== 0) {
            rows += breakdownRow('House Property Income', result.housePropertyIncome,
                result.housePropertyIncome < 0 ? 'negative' : '');
        }

        if (result.otherIncome > 0) {
            rows += breakdownRow('Other Income', result.otherIncome);
        }

        if (result.capitalGains.stcgOther > 0) {
            rows += breakdownRow('STCG (Slab Rate)', result.capitalGains.stcgOther);
        }

        rows += breakdownRow('Gross Total Income', result.grossTotalIncome, '', true);

        // Deductions section
        if (result.totalDeductions > 0) {
            rows += sectionHeader('Deductions');
            for (const [key, value] of Object.entries(result.deductions)) {
                if (value > 0) {
                    rows += breakdownRow(`Section ${key}`, -value, 'negative');
                }
            }
            rows += breakdownRow('Total Deductions', -result.totalDeductions, 'negative', true);
        }

        // Tax calculation
        rows += sectionHeader('Tax Computation');
        rows += breakdownRow('Taxable Income (Normal)', result.taxableIncome);

        // Slab breakdown
        if (result.slabBreakdown && result.slabBreakdown.length > 0) {
            for (const slab of result.slabBreakdown) {
                const rate = (slab.rate * 100).toFixed(0);
                const range = `₹${TaxEngine.formatINR(slab.min)} – ₹${TaxEngine.formatINR(slab.max)}`;
                rows += breakdownRow(`  ${range} @ ${rate}%`, slab.tax, '', false, true);
            }
        }

        rows += breakdownRow('Tax on Normal Income', result.normalTax);

        // Special rate taxes
        if (result.specialRateTax > 0) {
            rows += sectionHeader('Special Rate Taxes');
            for (const [key, value] of Object.entries(result.specialRateBreakdown || {})) {
                if (value > 0) {
                    rows += breakdownRow(key, value);
                }
            }
        }

        rows += breakdownRow('Total Tax Before Rebate', result.totalTaxBeforeRebate);

        if (result.rebate87A > 0) {
            rows += breakdownRow('Less: Rebate u/s 87A', -result.rebate87A, 'positive');
        }

        rows += breakdownRow('Tax After Rebate', result.taxAfterRebate);

        if (result.surcharge > 0) {
            rows += breakdownRow(`Surcharge (${(result.surchargeRate * 100).toFixed(0)}%)`, result.surcharge);
        }

        rows += breakdownRow('Health & Education Cess (4%)', result.cess);

        // Total
        rows += `<tr class="total-row">
            <td>Total Tax Liability</td>
            <td>₹${TaxEngine.formatINR(result.totalTaxLiability)}</td>
        </tr>`;

        container.innerHTML = `<table class="breakdown-table">${rows}</table>`;
    }

    function sectionHeader(title) {
        return `<tr class="section-header"><td colspan="2">${title}</td></tr>`;
    }

    function breakdownRow(label, value, cssClass = '', isBold = false, isSubRow = false) {
        const formattedValue = value < 0
            ? `- ₹${TaxEngine.formatINR(Math.abs(value))}`
            : `₹${TaxEngine.formatINR(value)}`;

        const style = isBold ? 'font-weight: 700;' : '';
        const labelStyle = isSubRow ? 'font-size: 0.78rem; color: var(--text-muted); padding-left: 1.5rem;' : '';
        const valueClass = cssClass ? ` class="${cssClass}"` : '';

        return `<tr style="${style}">
            <td style="${labelStyle}">${label}</td>
            <td${valueClass}>${formattedValue}</td>
        </tr>`;
    }

    // ──────────────────────────────────────────────────
    // RENDER TIPS
    // ──────────────────────────────────────────────────

    function renderTips(tips) {
        const container = document.getElementById('tipsContent');

        if (tips.length === 0) {
            container.innerHTML = `
                <div class="tip-item">
                    <span class="tip-icon">✅</span>
                    <span class="tip-text">Your tax situation looks well optimized! No additional suggestions at this time.</span>
                </div>
            `;
            return;
        }

        container.innerHTML = tips.map(tip => `
            <div class="tip-item">
                <span class="tip-icon">${tip.icon}</span>
                <div>
                    <span class="tip-text">${tip.text}</span>
                    ${tip.savings ? `<div style="margin-top: 6px;"><span class="tip-savings">${tip.savings}</span></div>` : ''}
                </div>
            </div>
        `).join('');
    }

    // ──────────────────────────────────────────────────
    // GENERATE PDF REPORT
    // ──────────────────────────────────────────────────

    function generateReport(formResult, results, tips) {
        const { old: o, new: n, recommendation: rec } = results;
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        let report = `
═══════════════════════════════════════════════════════════
       ITR FORM SELECTOR & REGIME COMPARATOR REPORT
                    FY 2025-26 (AY 2026-27)
═══════════════════════════════════════════════════════════
Generated: ${dateStr}
Disclaimer: For informational purposes only. Consult a CA.

───────────────────────────────────────────────────────────
  RECOMMENDED ITR FORM: ${formResult.fullName}
───────────────────────────────────────────────────────────
${formResult.description}

Reasons:
${formResult.reasons.map(r => `  ✓ ${r}`).join('\n')}

───────────────────────────────────────────────────────────
  REGIME COMPARISON
───────────────────────────────────────────────────────────

                        OLD REGIME       NEW REGIME
─────────────────────  ─────────────    ─────────────
Gross Salary           ₹${padNum(o.grossSalary)}    ₹${padNum(n.grossSalary)}
Standard Deduction     ₹${padNum(o.standardDeduction)}    ₹${padNum(n.standardDeduction)}
${o.hraExemption > 0 ? `HRA Exemption          ₹${padNum(o.hraExemption)}    ₹0\n` : ''}Net Salary Income      ₹${padNum(o.netSalaryIncome)}    ₹${padNum(n.netSalaryIncome)}
Total Deductions       ₹${padNum(o.totalDeductions)}    ₹${padNum(n.totalDeductions)}
Taxable Income         ₹${padNum(o.taxableIncome)}    ₹${padNum(n.taxableIncome)}
Tax on Normal Income   ₹${padNum(o.normalTax)}    ₹${padNum(n.normalTax)}
${o.specialRateTax > 0 || n.specialRateTax > 0 ? `Tax on Capital Gains   ₹${padNum(o.specialRateTax)}    ₹${padNum(n.specialRateTax)}\n` : ''}Rebate u/s 87A         ₹${padNum(o.rebate87A)}    ₹${padNum(n.rebate87A)}
Surcharge              ₹${padNum(o.surcharge)}    ₹${padNum(n.surcharge)}
Cess (4%)              ₹${padNum(o.cess)}    ₹${padNum(n.cess)}
─────────────────────  ─────────────    ─────────────
TOTAL TAX              ₹${padNum(o.totalTaxLiability)}    ₹${padNum(n.totalTaxLiability)}
Effective Tax Rate     ${o.effectiveTaxRate}%${' '.repeat(Math.max(1, 13 - o.effectiveTaxRate.length - 1))}${n.effectiveTaxRate}%

► RECOMMENDATION: ${rec.message}

───────────────────────────────────────────────────────────
  TAX SAVING TIPS
───────────────────────────────────────────────────────────
${tips.map((t, i) => `${i + 1}. ${stripHTML(t.text)}${t.savings ? ` [${t.savings}]` : ''}`).join('\n')}

═══════════════════════════════════════════════════════════
  This report was generated locally in your browser.
  No data was stored or transmitted. 
  Built for Indian Taxpayers • FY 2025-26 (AY 2026-27)
═══════════════════════════════════════════════════════════
`;

        return report;
    }

    function padNum(num) {
        return TaxEngine.formatINR(num).padStart(12, ' ');
    }

    function stripHTML(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    // ──────────────────────────────────────────────────
    // PUBLIC API
    // ──────────────────────────────────────────────────

    return {
        renderITRResult,
        renderComparison,
        renderBreakdown,
        renderTips,
        generateReport,
    };
})();
