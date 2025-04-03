document.addEventListener('DOMContentLoaded', function() {
    const usdInput = document.getElementById('usd-input');
    const convertBtn = document.getElementById('convert-btn');
    const resultValue = document.getElementById('result-value');
    const currentRateElement = document.getElementById('current-rate');
    
    let exchangeRate = null;
    
    // Fetch real-time exchange rate
    async function fetchExchangeRate() {
        try {
            const response = await fetch('https://open.er-api.com/v6/latest/USD');
            const data = await response.json();
            
            if (data && data.rates && data.rates.INR) {
                exchangeRate = data.rates.INR;
                currentRateElement.textContent = `1 USD = ${exchangeRate.toFixed(2)} INR`;
                return exchangeRate;
            } else {
                throw new Error('Could not get INR rate');
            }
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            currentRateElement.textContent = 'Failed to load rate';
            // Fallback to a default rate if API fails
            return 83.5; // Approximate rate as of 2023
        }
    }
    
    // Parse the input value (handles regular numbers, k, million, billion)
    function parseInputValue(input) {
        if (!input || input.trim() === '') return null;
        
        // Convert to lowercase and remove extra spaces
        input = input.toLowerCase().trim();
        
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
        
        // Convert to words with Indian system
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
        
        // Handle very large numbers (above 1 crore)
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
    
    // Convert USD to INR and update the result
    async function convertUsdToInr() {
        const usdAmount = parseInputValue(usdInput.value);
        
        if (usdAmount === null) {
            resultValue.textContent = 'Please enter a valid amount';
            return;
        }
        
        if (!exchangeRate) {
            exchangeRate = await fetchExchangeRate();
        }
        
        const inrAmount = usdAmount * exchangeRate;
        resultValue.textContent = `₹${addIndianCommas(inrAmount.toFixed(2))} (${formatToIndianSystem(inrAmount)})`;
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
    
    // Initialize by fetching the exchange rate
    fetchExchangeRate();
}); 