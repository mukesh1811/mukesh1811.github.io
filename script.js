document.addEventListener('DOMContentLoaded', function() {
    const usdInput = document.getElementById('usd-input');
    const convertBtn = document.getElementById('convert-btn');
    const resultValue = document.getElementById('result-value');
    const currentRateElement = document.getElementById('current-rate');
    const examplePills = document.querySelectorAll('.example-pill');
    const exchangeRateIcon = document.querySelector('.exchange-rate i');
    
    let exchangeRate = null;
    let lastUpdateTime = null;
    let isFormatting = false; // Flag to prevent recursive formatting
    
    // Format number with commas (American system)
    function formatWithCommas(value) {
        // Skip empty values or values with text indicators
        if (!value || /[a-zA-Z]/.test(value)) return value;
        
        // Remove existing commas first
        let cleanValue = value.replace(/,/g, '');
        
        // Check if it's a valid number
        if (!/^\d*\.?\d*$/.test(cleanValue)) return value;
        
        // Split by decimal point
        let parts = cleanValue.split('.');
        let wholePart = parts[0];
        let decimalPart = parts.length > 1 ? '.' + parts[1] : '';
        
        // Add commas to the whole part
        return wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + decimalPart;
    }
    
    // Handle input formatting
    usdInput.addEventListener('input', function(e) {
        if (isFormatting) return; // Prevent recursion
        
        const cursorPos = this.selectionStart;
        const originalLength = this.value.length;
        
        // Only format if it's a pure number (no k, million, etc.)
        if (!/[a-zA-Z]/.test(this.value)) {
            isFormatting = true;
            const formattedValue = formatWithCommas(this.value);
            this.value = formattedValue;
            isFormatting = false;
            
            // Adjust cursor position after formatting
            const newLength = this.value.length;
            const newPos = cursorPos + (newLength - originalLength);
            this.setSelectionRange(newPos, newPos);
        }
    });
    
    // Fetch real-time exchange rate
    async function fetchExchangeRate() {
        try {
            // Show loading animation
            exchangeRateIcon.classList.add('rotating');
            
            const response = await fetch('https://open.er-api.com/v6/latest/USD');
            const data = await response.json();
            
            if (data && data.rates && data.rates.INR) {
                exchangeRate = data.rates.INR;
                lastUpdateTime = new Date();
                
                // Format the exchange rate with subtle animation
                updateExchangeRateDisplay();
                
                // Remove loading animation with slight delay
                setTimeout(() => {
                    exchangeRateIcon.classList.remove('rotating');
                }, 500);
                
                return exchangeRate;
            } else {
                throw new Error('Could not get INR rate');
            }
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            currentRateElement.textContent = 'Failed to load rate';
            exchangeRateIcon.classList.remove('rotating');
            
            // Fallback to a default rate if API fails
            return 83.5; // Approximate rate as of 2023
        }
    }
    
    // Update the exchange rate display with time
    function updateExchangeRateDisplay() {
        if (!exchangeRate) return;
        
        // Animate the number change
        animateNumber(currentRateElement, exchangeRate.toFixed(2), '1 USD = ₹', ' INR');
        
        // Update the tooltip with last update time if available
        if (lastUpdateTime) {
            const timeString = lastUpdateTime.toLocaleTimeString();
            currentRateElement.title = `Last updated: ${timeString}`;
        }
    }
    
    // Animate number counting up
    function animateNumber(element, targetValue, prefix = '', suffix = '') {
        const duration = 1000; // ms
        const start = parseFloat(element.textContent.replace(/[^\d.-]/g, '')) || 0;
        const target = parseFloat(targetValue);
        const startTime = performance.now();
        
        function updateNumber(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easedProgress = easeOutQuart(progress);
            const currentValue = start + ((target - start) * easedProgress);
            
            element.textContent = `${prefix}${currentValue.toFixed(2)}${suffix}`;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = `${prefix}${targetValue}${suffix}`;
            }
        }
        
        requestAnimationFrame(updateNumber);
    }
    
    // Easing function for smoother animation
    function easeOutQuart(x) {
        return 1 - Math.pow(1 - x, 4);
    }
    
    // Parse the input value (handles regular numbers, k, million, billion)
    function parseInputValue(input) {
        if (!input || input.trim() === '') return null;
        
        // Convert to lowercase and remove extra spaces
        input = input.toLowerCase().trim();
        
        // Remove commas from the input first
        input = input.replace(/,/g, '');
        
        // Replace common terms with their numerical equivalents
        const replacements = {
            'k': '* 1000',
            'thousand': '* 1000',
            'million': '* 1000000',
            'mn': '* 1000000',
            'billion': '* 1000000000',
            'bn': '* 1000000000'
        };
        
        // Apply replacements
        for (const [term, replacement] of Object.entries(replacements)) {
            const regex = new RegExp(`\\s*${term}\\b`, 'gi');
            input = input.replace(regex, replacement);
        }
        
        // Remove all non-numeric characters except math operators and decimal point
        input = input.replace(/[^0-9.+\-*\/()]/g, '');
        
        try {
            // Safely evaluate the expression
            const result = Function('"use strict"; return (' + input + ')')();
            return isNaN(result) ? null : result;
        } catch (error) {
            console.error('Error parsing input:', error);
            return null;
        }
    }
    
    // Format number to Indian system (with thousand, lakh, crore)
    function formatToIndianSystem(num) {
        if (num === null || isNaN(num)) return 'Invalid input';
        
        // Function to format large numbers with commas in Indian numbering system
        function addIndianCommas(x) {
            x = x.toString();
            let afterPoint = '';
            
            if (x.includes('.')) {
                afterPoint = x.substring(x.indexOf('.'));
                x = x.substring(0, x.indexOf('.'));
            }
            
            let lastThree = x.substring(x.length - 3);
            let otherNumbers = x.substring(0, x.length - 3);
            
            if (otherNumbers !== '') {
                lastThree = ',' + lastThree;
            }
            
            let res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree + afterPoint;
            return res;
        }
        
        // Convert to words with Indian system for simple numbers
        function getIndianWords(n) {
            if (n < 1000) {
                return n.toString();
            } else if (n < 100000) { // less than 1 lakh
                return (n / 1000).toFixed(n % 1000 !== 0 ? 2 : 0).replace(/\.00$/, '') + ' thousand';
            } else if (n < 10000000) { // less than 1 crore
                return (n / 100000).toFixed(n % 100000 !== 0 ? 2 : 0).replace(/\.00$/, '') + ' lakh';
            } else {
                return (n / 10000000).toFixed(n % 10000000 !== 0 ? 2 : 0).replace(/\.00$/, '') + ' crore';
            }
        }
        
        // Break down number into word parts (e.g., 123456 -> "1 lakh 23 thousand 456")
        function detailedIndianFormat(n) {
            if (n < 1000) {
                return n.toString();
            }
            
            const parts = [];
            
            // Extract crores (10 million)
            if (n >= 10000000) {
                const crores = Math.floor(n / 10000000);
                n = n % 10000000;
                
                // For very large crore values, break them down further
                if (crores >= 100) {
                    const croreFormatted = breakDownLargeNumber(crores);
                    parts.push(`${croreFormatted} crores`);
                } else {
                    parts.push(`${crores} ${crores === 1 ? 'crore' : 'crores'}`);
                }
            }
            
            // Extract lakhs (100 thousand)
            if (n >= 100000) {
                const lakhs = Math.floor(n / 100000);
                n = n % 100000;
                parts.push(`${lakhs} ${lakhs === 1 ? 'lakh' : 'lakhs'}`);
            }
            
            // Extract thousands
            if (n >= 1000) {
                const thousands = Math.floor(n / 1000);
                n = n % 1000;
                parts.push(`${thousands} thousand`);
            }
            
            // Add remaining
            if (n > 0) {
                parts.push(n.toString());
            }
            
            return parts.join(' ');
        }
        
        // Break down large numbers in a readable way
        function breakDownLargeNumber(num) {
            if (num < 1000) {
                return num.toString();
            }
            
            // Break down numbers above 1000
            const parts = [];
            
            // Extract lakhs (if num is in crores)
            if (num >= 100) {
                const lakhs = Math.floor(num / 100);
                num = num % 100;
                parts.push(`${lakhs} ${lakhs === 1 ? 'lakh' : 'lakhs'}`);
            }
            
            // Extract thousands
            if (num >= 10) {
                const thousands = Math.floor(num / 10) * 10;
                num = num % 10;
                if (thousands > 0) {
                    parts.push(`${thousands} thousand`);
                }
            }
            
            // Add remaining thousands
            if (num > 0) {
                parts.push(`${num} thousand`);
            }
            
            return parts.join(' ');
        }
        
        // For very large numbers, use the detailed format
        if (num >= 1000000000) { // Greater than or equal to 1 billion INR
            return detailedIndianFormat(num);
        }
        
        // Handle numbers between 1 crore and 1 billion
        if (num >= 10000000) {
            const crores = Math.floor(num / 10000000);
            const remaining = num % 10000000;
            
            if (remaining === 0) {
                return `${crores} ${crores === 1 ? 'crore' : 'crores'}`;
            }
            
            // Format the remaining amount
            let remainingFormatted = '';
            if (remaining >= 100000) {
                // If remaining has lakhs
                const lakhs = Math.floor(remaining / 100000);
                const lakhremainder = remaining % 100000;
                
                remainingFormatted = `${lakhs} ${lakhs === 1 ? 'lakh' : 'lakhs'}`;
                
                if (lakhremainder > 0) {
                    remainingFormatted += ` ${formatToIndianSystem(lakhremainder)}`;
                }
            } else {
                remainingFormatted = formatToIndianSystem(remaining);
            }
            
            return `${crores} ${crores === 1 ? 'crore' : 'crores'} ${remainingFormatted}`;
        }
        
        // For numbers below 1 crore, use the simplified approach
        return getIndianWords(num);
    }
    
    // Convert USD to INR and update the result with animation
    async function convertUsdToInr() {
        // Show processing state
        resultValue.textContent = 'Converting...';
        
        const usdAmount = parseInputValue(usdInput.value);
        
        if (usdAmount === null) {
            resultValue.textContent = 'Please enter a valid amount';
            showInvalidInput();
            return;
        }
        
        if (!exchangeRate) {
            exchangeRate = await fetchExchangeRate();
        }
        
        const inrAmount = usdAmount * exchangeRate;
        
        // Format the result for display
        const formattedAmount = `₹${addIndianCommas(inrAmount.toFixed(2))}`;
        const wordsAmount = formatToIndianSystem(inrAmount);
        
        // Update with animation effect - Show just the numeric value first
        resultValue.textContent = formattedAmount;
        
        // Then update with the full formatted result, prioritizing the text format
        setTimeout(() => {
            resultValue.innerHTML = `
                <div class="result-text">${wordsAmount}</div>
                <div class="result-numeric">${formattedAmount}</div>
            `;
            showSuccessAnimation();
        }, 300);
    }
    
    // Visual feedback for invalid input
    function showInvalidInput() {
        usdInput.classList.add('invalid');
        setTimeout(() => {
            usdInput.classList.remove('invalid');
        }, 800);
    }
    
    // Show success animation on conversion
    function showSuccessAnimation() {
        const resultBox = document.getElementById('result-box');
        resultBox.classList.add('highlight');
        
        // Add highlight animation to the text result
        const resultText = document.querySelector('.result-text');
        if (resultText) {
            resultText.classList.add('text-highlight');
            setTimeout(() => {
                resultText.classList.remove('text-highlight');
            }, 1500);
        }
        
        setTimeout(() => {
            resultBox.classList.remove('highlight');
        }, 800);
    }
    
    // Helper function for Indian system commas
    function addIndianCommas(x) {
        x = x.toString();
        let afterPoint = '';
        
        if (x.includes('.')) {
            afterPoint = x.substring(x.indexOf('.'));
            x = x.substring(0, x.indexOf('.'));
        }
        
        let lastThree = x.substring(x.length - 3);
        let otherNumbers = x.substring(0, x.length - 3);
        
        if (otherNumbers !== '') {
            lastThree = ',' + lastThree;
        }
        
        let res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree + afterPoint;
        return res;
    }
    
    // Set up event listeners
    convertBtn.addEventListener('click', convertUsdToInr);
    
    usdInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            convertUsdToInr();
        }
    });
    
    // Make the example pills clickable
    examplePills.forEach(pill => {
        pill.addEventListener('click', function() {
            usdInput.value = this.textContent;
            
            // Format the value if it's a pure number
            if (!/[a-zA-Z]/.test(usdInput.value)) {
                usdInput.value = formatWithCommas(usdInput.value);
            }
            
            convertUsdToInr();
            
            // Add visual feedback
            this.classList.add('active');
            setTimeout(() => {
                this.classList.remove('active');
            }, 300);
        });
    });
    
    // Allow manual refresh of exchange rate
    exchangeRateIcon.addEventListener('click', function() {
        if (!this.classList.contains('rotating')) {
            fetchExchangeRate();
        }
    });
    
    // Initialize by fetching the exchange rate
    fetchExchangeRate();
    
    // Add some CSS for the new interactive elements
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rotating {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .rotating {
            animation: rotating 1s linear infinite;
        }
        
        .invalid {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
            border-color: #ef4444 !important;
        }
        
        @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
            40%, 60% { transform: translate3d(3px, 0, 0); }
        }
        
        .highlight {
            background-color: #f0f9ff !important;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .example-pill.active {
            background-color: var(--primary-color);
            color: white;
        }
    `;
    document.head.appendChild(style);
}); 