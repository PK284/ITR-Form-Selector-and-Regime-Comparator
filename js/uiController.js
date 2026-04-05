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

function generatePDF(formResult, results, tips) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');
        const PAGE_W = doc.internal.pageSize.getWidth();
        const PAGE_H = doc.internal.pageSize.getHeight();
        const MARGIN = 45;
        const CONTENT_W = PAGE_W - MARGIN * 2;
        const { old: o, new: n, recommendation: rec } = results;
        const fmt = (num) => 'Rs. ' + TaxEngine.formatINR(num);
        const dateStr = new Date().toLocaleDateString('en-IN', { year:'numeric',month:'long',day:'numeric' });

        function checkPage(y, needed) {
            if (y + needed > PAGE_H - 55) { doc.addPage(); return 40; }
            return y;
        }

        let y = MARGIN;

        // ── HEADER BANNER ─────────────────────────────────────────────
        doc.setFillColor(108, 99, 255);
        doc.rect(0, 0, PAGE_W, 68, 'F');
        doc.setFillColor(6, 214, 160);
        doc.rect(0, 68, PAGE_W, 4, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text('ITR FORM SELECTOR & REGIME COMPARATOR', MARGIN, 32);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(200, 195, 255);
        doc.text('FY 2025-26  (AY 2026-27)', MARGIN, 52);
        doc.text('Generated: ' + dateStr, PAGE_W - MARGIN, 52, { align: 'right' });

        y = 90;

        // ── DISCLAIMER ───────────────────────────────────────────────
        const dlText = 'DISCLAIMER: This report was generated by an AI-assisted tax tool for informational purposes only. Figures are estimates based on your inputs. Please consult a qualified Chartered Accountant (CA) before filing your Income Tax Return (ITR).';
        const dlLines = doc.splitTextToSize(dlText, CONTENT_W - 24);
        const dlH = dlLines.length * 12 + 18;

        doc.setFillColor(255, 248, 225);
        doc.setDrawColor(240, 180, 0);
        doc.setLineWidth(1);
        doc.roundedRect(MARGIN, y, CONTENT_W, dlH, 3, 3, 'FD');
        doc.setFillColor(240, 180, 0);
        doc.rect(MARGIN, y, 4, dlH, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(140, 90, 0);
        dlLines.forEach(function(line, i) {
            doc.text(line, MARGIN + 12, y + 12 + i * 12);
        });
        y += dlH + 20;

        // ── SECTION 1: RECOMMENDED FORM ───────────────────────────────
        doc.setFillColor(108, 99, 255);
        doc.roundedRect(MARGIN, y, CONTENT_W, 24, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('SECTION 1   RECOMMENDED ITR FORM', MARGIN + 10, y + 16);
        y += 32;

        // Form badge
        doc.setFillColor(243, 241, 255);
        doc.setDrawColor(170, 160, 255);
        doc.setLineWidth(0.5);
        doc.roundedRect(MARGIN, y, 150, 58, 5, 5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(108, 99, 255);
        doc.text(formResult.form, MARGIN + 75, y + 27, { align: 'center' });
        doc.setFontSize(8);
        doc.setTextColor(100, 90, 180);
        const bname = doc.splitTextToSize(formResult.name || '', 136);
        doc.text(bname, MARGIN + 75, y + 42, { align: 'center' });

        // Form full name + description
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(25, 25, 40);
        doc.text(formResult.fullName, MARGIN + 162, y + 16);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(70, 70, 100);
        const descL = doc.splitTextToSize(formResult.description, CONTENT_W - 170);
        doc.text(descL, MARGIN + 162, y + 30);
        y += 68;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 80);
        doc.text('Applicable because:', MARGIN, y);
        y += 14;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        formResult.reasons.forEach(function(r) {
            y = checkPage(y, 16);
            doc.setTextColor(6, 160, 110);
            doc.text('>', MARGIN + 3, y);
            doc.setTextColor(50, 50, 80);
            const rl = doc.splitTextToSize(r, CONTENT_W - 16);
            doc.text(rl, MARGIN + 14, y);
            y += rl.length * 13;
        });

        if (formResult.warnings && formResult.warnings.length > 0) {
            formResult.warnings.forEach(function(w) {
                y = checkPage(y, 16);
                doc.setTextColor(200, 50, 50);
                const wl = doc.splitTextToSize('[Warning] ' + w, CONTENT_W - 10);
                doc.text(wl, MARGIN + 6, y);
                y += wl.length * 13;
            });
        }
        y += 20;

        // ── SECTION 2: REGIME COMPARISON ─────────────────────────────
        y = checkPage(y, 60);
        doc.setFillColor(108, 99, 255);
        doc.roundedRect(MARGIN, y, CONTENT_W, 24, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('SECTION 2   OLD REGIME vs NEW REGIME  -  TAX COMPARISON', MARGIN + 10, y + 16);
        y += 32;

        // Recommendation banner
        const oldWins = rec.winner === 'old';
        const newWins = rec.winner === 'new';
        const bannerFill = newWins ? [6, 200, 150] : oldWins ? [80, 70, 220] : [200, 160, 0];
        doc.setFillColor(bannerFill[0], bannerFill[1], bannerFill[2]);
        doc.roundedRect(MARGIN, y, CONTENT_W, 26, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(255, 255, 255);
        const recLabel = rec.savings > 0
            ? 'RECOMMENDATION: ' + (newWins ? 'NEW TAX REGIME' : 'OLD TAX REGIME') + ' saves Rs. ' + TaxEngine.formatINR(rec.savings) + ' more this year'
            : 'RECOMMENDATION: Both regimes result in equal tax. You may choose either.';
        const recL = doc.splitTextToSize(recLabel, CONTENT_W - 20);
        doc.text(recL[0], PAGE_W / 2, y + 17, { align: 'center' });
        y += 36;

        // Comparison table
        const tableBody = [
            ['Gross Salary / Pension', fmt(o.grossSalary), fmt(n.grossSalary)],
            ['Standard Deduction', '(-) ' + fmt(o.standardDeduction), '(-) ' + fmt(n.standardDeduction)],
        ];
        if (o.hraExemption > 0) tableBody.push(['HRA Exemption (Sec 10(13A))', '(-) ' + fmt(o.hraExemption), 'Not Available']);
        if (o.otherIncome > 0 || n.otherIncome > 0) tableBody.push(['Other Income (Interest+Dividends)', fmt(o.otherIncome), fmt(n.otherIncome)]);
        if (o.housePropertyIncome !== 0) tableBody.push(['House Property Income / Loss', fmt(o.housePropertyIncome), fmt(n.housePropertyIncome)]);
        tableBody.push(['Total Chapter VI-A Deductions', '(-) ' + fmt(o.totalDeductions), '(-) ' + fmt(n.totalDeductions)]);
        tableBody.push(['Taxable Income', fmt(o.taxableIncome), fmt(n.taxableIncome)]);
        tableBody.push(['Tax on Slab Income', fmt(o.normalTax), fmt(n.normalTax)]);
        if (o.specialRateTax > 0 || n.specialRateTax > 0) tableBody.push(['Tax on Capital Gains', fmt(o.specialRateTax), fmt(n.specialRateTax)]);
        if (o.rebate87A > 0 || n.rebate87A > 0) tableBody.push(['(-) Rebate u/s 87A', '(-) ' + fmt(o.rebate87A), '(-) ' + fmt(n.rebate87A)]);
        if (o.surcharge > 0 || n.surcharge > 0) tableBody.push(['Surcharge', fmt(o.surcharge), fmt(n.surcharge)]);
        tableBody.push(['Health & Education Cess (4%)', fmt(o.cess), fmt(n.cess)]);

        doc.autoTable({
            startY: y,
            head: [['Income / Tax Component', 'Old Regime', 'New Regime (Default)']],
            body: tableBody,
            foot: [
                ['TOTAL TAX LIABILITY', fmt(o.totalTaxLiability), fmt(n.totalTaxLiability)],
                ['Effective Tax Rate', o.effectiveTaxRate + '%', n.effectiveTaxRate + '%'],
            ],
            theme: 'grid',
            margin: { left: MARGIN, right: MARGIN },
            headStyles: { fillColor: [40, 40, 60], textColor: [255,255,255], fontStyle: 'bold', fontSize: 9, cellPadding: 7 },
            footStyles: { fillColor: [238, 236, 255], textColor: [30,30,70], fontStyle: 'bold', fontSize: 9.5, cellPadding: 7 },
            bodyStyles: { fontSize: 9, cellPadding: 6 },
            alternateRowStyles: { fillColor: [249, 249, 255] },
            columnStyles: {
                0: { cellWidth: 250 },
                1: { halign: 'right', cellWidth: 127.5 },
                2: { halign: 'right', cellWidth: 127.5 },
            },
        });

        y = doc.lastAutoTable.finalY + 25;

        // ── SECTION 3: TAX SAVING TIPS ────────────────────────────────
        if (tips && tips.length > 0) {
            y = checkPage(y, 80);
            doc.setFillColor(108, 99, 255);
            doc.roundedRect(MARGIN, y, CONTENT_W, 24, 3, 3, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(255, 255, 255);
            doc.text('SECTION 3   PERSONALIZED TAX SAVING TIPS', MARGIN + 10, y + 16);
            y += 32;

            tips.forEach(function(t, i) {
                y = checkPage(y, 30);
                doc.setFillColor(108, 99, 255);
                doc.circle(MARGIN + 8, y + 5, 8, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(255, 255, 255);
                doc.text(String(i + 1), MARGIN + 8, y + 8, { align: 'center' });

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9.5);
                doc.setTextColor(30, 30, 60);
                const tipLines = doc.splitTextToSize(stripHTML(t.text), CONTENT_W - 28);
                doc.text(tipLines, MARGIN + 22, y + 8);
                y += tipLines.length * 13 + 10;
            });

            y += 10;
        }

        // ── CLOSING NOTE ───────────────────────────────────────────────
        y = checkPage(y, 48);
        doc.setFillColor(245, 245, 252);
        doc.setDrawColor(200, 200, 220);
        doc.setLineWidth(0.5);
        doc.roundedRect(MARGIN, y, CONTENT_W, 38, 3, 3, 'FD');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 100, 130);
        doc.text('This report was generated entirely within your browser. No data was stored, uploaded, or transmitted anywhere.', MARGIN + 8, y + 14);
        doc.text('Built for Indian Taxpayers  |  FY 2025-26 (AY 2026-27)  |  100% Free & Private', MARGIN + 8, y + 28);

        // ── FOOTER ON ALL PAGES ─────────────────────────────────────────
        const totalPages = doc.internal.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(160, 160, 160);
            doc.text('ITR Form Selector & Regime Comparator  |  FY 2025-26  |  ' + dateStr, MARGIN, PAGE_H - 20);
            doc.text('Page ' + p + ' of ' + totalPages, PAGE_W - MARGIN, PAGE_H - 20, { align: 'right' });
            doc.setDrawColor(210, 210, 225);
            doc.setLineWidth(0.3);
            doc.line(MARGIN, PAGE_H - 28, PAGE_W - MARGIN, PAGE_H - 28);
        }

        doc.save('ITR_Tax_Report_FY2025-26_' + new Date().toISOString().slice(0,10) + '.pdf');
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
        generatePDF,
    };
})();
