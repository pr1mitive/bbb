/**
 * 発注管理システム - 金額計算処理
 * 
 * 明細行の金額計算、合計金額計算をリアルタイムで実行
 */

(function(window) {
  'use strict';
  
  const CONFIG = window.PO_CONFIG;
  const Utils = window.PO_Utils;
  
  const Calculator = {
    
    /**
     * 明細行の金額を計算
     * @param {HTMLElement} row - 明細行のtr要素
     */
    calculateRowAmount(row) {
      const unitPriceInput = row.querySelector('.unit-price');
      const quantityInput = row.querySelector('.quantity');
      const amountCell = row.querySelector('.amount');
      
      if (!unitPriceInput || !quantityInput || !amountCell) {
        Utils.warn('金額計算: 必要な要素が見つかりません');
        return;
      }
      
      const unitPrice = Utils.parseNumber(unitPriceInput.value);
      const quantity = Utils.parseNumber(quantityInput.value);
      const amount = unitPrice * quantity;
      
      // 金額を表示(小数点2桁、カンマ区切り)
      amountCell.textContent = Utils.formatNumber(amount, 2);
      amountCell.dataset.value = amount; // 計算用に数値を保持
      
      Utils.log(`明細行金額計算: 単価=${unitPrice}, 数量=${quantity}, 金額=${amount}`);
      
      // 合計金額を再計算
      this.calculateTotal();
    },
    
    /**
     * 全明細の合計金額を計算
     */
    calculateTotal() {
      const rows = document.querySelectorAll('#itemsBody tr');
      let subtotal = 0;
      
      // 全明細の金額を合計
      rows.forEach(row => {
        const amountCell = row.querySelector('.amount');
        if (amountCell && amountCell.dataset.value) {
          subtotal += parseFloat(amountCell.dataset.value);
        }
      });
      
      // 税率を取得
      const taxCodeSelect = document.getElementById('taxCode');
      const taxRate = parseFloat(taxCodeSelect?.dataset.taxRate || 0);
      
      // 税額・総合計を計算
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;
      
      // 表示更新
      this.updateSummaryDisplay(subtotal, taxAmount, total);
      
      // 円貨換算
      this.calculateJpyConversion(total);
      
      Utils.log(`合計金額計算: 小計=${subtotal}, 税額=${taxAmount}, 総合計=${total}`);
    },
    
    /**
     * 金額サマリー表示を更新
     * @param {number} subtotal - 小計
     * @param {number} taxAmount - 税額
     * @param {number} total - 総合計
     */
    updateSummaryDisplay(subtotal, taxAmount, total) {
      const subtotalEl = document.getElementById('subtotal');
      const taxAmountEl = document.getElementById('taxAmount');
      const totalEl = document.getElementById('total');
      
      if (subtotalEl) {
        subtotalEl.textContent = Utils.formatNumber(subtotal, 2);
        subtotalEl.dataset.value = subtotal;
      }
      
      if (taxAmountEl) {
        taxAmountEl.textContent = Utils.formatNumber(taxAmount, 2);
        taxAmountEl.dataset.value = taxAmount;
      }
      
      if (totalEl) {
        totalEl.textContent = Utils.formatNumber(total, 2);
        totalEl.dataset.value = total;
      }
    },
    
    /**
     * 円貨換算を計算
     * @param {number} total - 総合計
     */
    calculateJpyConversion(total) {
      const currencySelect = document.getElementById('currency');
      const exchangeRateInput = document.getElementById('exchangeRate');
      const totalJpyRow = document.getElementById('totalJpyRow');
      const totalJpyEl = document.getElementById('totalJpy');
      
      if (!currencySelect || !totalJpyRow || !totalJpyEl) return;
      
      const currency = currencySelect.value;
      
      // JPYの場合は円貨換算行を非表示
      if (currency === CONFIG.CURRENCY_CODES.JPY) {
        totalJpyRow.style.display = 'none';
        return;
      }
      
      // 為替レートが入力されていれば換算
      const exchangeRate = Utils.parseNumber(exchangeRateInput?.value);
      
      if (exchangeRate > 0) {
        const totalJpy = total * exchangeRate;
        totalJpyEl.textContent = Utils.formatNumber(totalJpy, 0);
        totalJpyEl.dataset.value = totalJpy;
        totalJpyRow.style.display = '';
      } else {
        totalJpyRow.style.display = 'none';
      }
    },
    
    /**
     * 通貨記号を更新
     * @param {string} symbol - 通貨記号
     */
    updateCurrencySymbols(symbol) {
      const symbolElements = document.querySelectorAll('[id^="currencySymbol"]');
      symbolElements.forEach(el => {
        el.textContent = symbol;
      });
    },
    
    /**
     * 小計を取得
     * @returns {number} 小計
     */
    getSubtotal() {
      const subtotalEl = document.getElementById('subtotal');
      return parseFloat(subtotalEl?.dataset.value || 0);
    },
    
    /**
     * 税額を取得
     * @returns {number} 税額
     */
    getTaxAmount() {
      const taxAmountEl = document.getElementById('taxAmount');
      return parseFloat(taxAmountEl?.dataset.value || 0);
    },
    
    /**
     * 総合計を取得
     * @returns {number} 総合計
     */
    getTotal() {
      const totalEl = document.getElementById('total');
      return parseFloat(totalEl?.dataset.value || 0);
    },
    
    /**
     * 総合計(円貨)を取得
     * @returns {number} 総合計(円貨)
     */
    getTotalJpy() {
      const totalJpyEl = document.getElementById('totalJpy');
      return parseFloat(totalJpyEl?.dataset.value || 0);
    }
  };
  
  // グローバルに公開
  window.PO_Calculator = Calculator;
  
})(window);
