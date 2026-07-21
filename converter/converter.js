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
        
        // Check for multiple unit terms
        const unitTerms = ['k', 'thousand', 'million', 'mn', 'billion', 'bn', 'trillion', 'crore', 'crores'];
        const foundTerms = unitTerms.filter(term => input.includes(term));
        
        if (foundTerms.length > 1) {
            console.error('Multiple unit terms found:', foundTerms);
            return null;
        }
        
        // Replace common terms with their numerical equivalents
        const replacements = {
            'k': '* 1000',
            'thousand': '* 1000',
            'million': '* 1000000',
            'mn': '* 1000000',
            'billion': '* 1000000000',
            'bn': '* 1000000000',
            'trillion': '* 1000000000000',
            'crore': '* 10000000',
            'crores': '* 10000000'
        };
        
        // Apply replacements - FIXED: Improved regex for better pattern matching
        let modifiedInput = input;
        
        // Handle cases where number precedes the unit (e.g., "1billion" or "1 billion")
        for (const [term, replacement] of Object.entries(replacements)) {
            // Match both with and without space between the number and term
            // e.g., "1billion" and "1 billion"
            const regex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${term}\\b`, 'gi');
            modifiedInput = modifiedInput.replace(regex, `$1 ${replacement}`);
        }
        
        // Handle cases where the term appears without a number prefix (e.g., "billion")
        // Assume the value is 1 in such cases
        for (const [term, replacement] of Object.entries(replacements)) {
            const regex = new RegExp(`^\\s*${term}\\b`, 'gi');
            modifiedInput = modifiedInput.replace(regex, `1 ${replacement}`);
        }
        
        // Validation: Check for invalid characters *after* unit replacements
        // Remove all valid numeric/math/space characters. If anything remains, it's invalid.
        const validationCheck = modifiedInput.replace(/[\d.+\-*\/()\s]/g, '');
        if (validationCheck.length > 0) {
            console.error('Invalid characters remaining after unit processing:', validationCheck, 'Original input:', input);
            return null; // Contains unrecognized characters
        }
        
        // Remove potentially remaining non-numeric characters (redundant after validation check, but safe)
        modifiedInput = modifiedInput.replace(/[^0-9.+\-*\/()]/g, '');

        // Prevent empty strings or just operators from being evaluated
        if (modifiedInput.trim() === '' || /^[^0-9]+$/.test(modifiedInput.trim())) {
             console.error('Input reduced to empty or operators only:', modifiedInput);
             return null;
        }

        try {
            // Safely evaluate the expression
            const result = Function('"use strict"; return (' + modifiedInput + ')')();

            // Check if result is a valid finite number
            if (isNaN(result) || !isFinite(result)) {
                 console.error('Evaluation resulted in NaN or Infinity for:', modifiedInput);
                 return null;
            }
            return result; // Return the valid, finite number
        } catch (error) {
            console.error('Error evaluating input expression:', modifiedInput, error);
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
        
        // Break down number into word parts with correct handling of thousand crores
        function detailedIndianFormat(n) {
            if (n < 1000) {
                return n.toString();
            }
            
            const parts = [];
            
            // First, handle numbers in the thousands of crores (tens of billions)
            if (n >= 1000000000) {
                // Calculate thousands
                const thousandCrores = Math.floor(n / 10000000000);
                if (thousandCrores > 0) {
                    // Calculate remaining crores to determine formatting
                    const remainingCrores = Math.floor((n % 10000000000) / 10000000);
                    
                    // Format differently based on whether it's an exact multiple of 10 billion
                    if (remainingCrores === 0 && n % 10000000 === 0) {
                        // Exact multiples like 10000000000 should be "1 thousand crores"
                        parts.push(`${thousandCrores} thousand crores`);
                    } else {
                        // Numbers like 12345678901 should be "1 thousand 234 crores..."
                        parts.push(`${thousandCrores} thousand`);
                        
                        if (remainingCrores > 0) {
                            parts.push(`${remainingCrores} ${remainingCrores === 1 ? 'crore' : 'crores'}`);
                        }
                    }
                    
                    // Handle remaining lakhs, thousands, etc.
                    n = n % 10000000;
                } else {
                    // Handle regular crores (millions)
                    const crores = Math.floor(n / 10000000);
                    parts.push(`${crores} ${crores === 1 ? 'crore' : 'crores'}`);
                    n = n % 10000000;
                }
            } else if (n >= 10000000) {
                // Handle regular crores (millions)
                const crores = Math.floor(n / 10000000);
                parts.push(`${crores} ${crores === 1 ? 'crore' : 'crores'}`);
                n = n % 10000000;
            }
            
            // Extract lakhs (hundred thousands)
            if (n >= 100000) {
                const lakhs = Math.floor(n / 100000);
                n = n % 100000;
                parts.push(`${lakhs} ${lakhs === 1 ? 'lakh' : 'lakhs'}`);
            }
            
            // Extract thousands
            if (n >= 1000) {
                const thousands = Math.floor(n / 1000);
                n = (n % 1000).toFixed(2);
                parts.push(`${thousands} thousand`);
            }
            
            // Add remaining units
            if (n > 0) {
                parts.push(n.toString());
            }
            
            return parts.join(' ');
        }
        
        return detailedIndianFormat(num);
    }
    
    // Convert USD to INR and update the result with animation
    async function convertUsdToInr() {
        // Show processing state
        resultValue.textContent = 'Converting...';
        
        const usdAmount = parseInputValue(usdInput.value);
        
        if (usdAmount === null) {
            // Check if the input contains multiple unit terms
            const unitTerms = ['k', 'thousand', 'million', 'mn', 'billion', 'bn', 'trillion', 'crore', 'crores'];
            const foundTerms = unitTerms.filter(term => usdInput.value.toLowerCase().includes(term));
            
            if (foundTerms.length > 1) {
                resultValue.innerHTML = `
                    <div class="error-message">
                        Please use only one unit term (k, million, billion, etc.)<br>
                        <span class="error-example">Example: "1.5 million" or "1500k"</span>
                    </div>
                `;
            } else {
                resultValue.textContent = 'Please enter a valid amount';
            }
            showInvalidInput();
            return;
        }
        
        // Always fetch the exchange rate when converting
        exchangeRate = await fetchExchangeRate();
        
        const inrAmount = usdAmount * exchangeRate;
        
        // Format the result for display
        const formattedAmount = `₹${addIndianCommas(inrAmount.toFixed(2))}`;
        const wordsAmount = formatToIndianSystem(inrAmount.toFixed(2));
        
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
    
    // Remove manual refresh click handler - no longer needed
    exchangeRateIcon.classList.remove('rotating');
    
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
            border-color: #808080 !important;
        }
        
        @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
            40%, 60% { transform: translate3d(3px, 0, 0); }
        }
        
        .highlight {
            background-color: #f0f0f0 !important;
            box-shadow: 0 0 0 3px rgba(128, 128, 128, 0.2);
        }
        
        .example-pill.active {
            background-color: var(--accent-color);
            color: white;
        }

        .error-message {
            color: #dc3545;
            text-align: center;
            padding: 10px;
            line-height: 1.5;
        }

        .error-example {
            display: block;
            font-size: 0.9em;
            color: #666;
            margin-top: 5px;
        }
    `;
    document.head.appendChild(style);
}); 