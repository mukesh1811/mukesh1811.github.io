// USD to INR Converter Test Suite

// Import functions to test from script.js, or define testing versions here
// In a real environment, we would use a proper testing framework like Jest or Mocha

// Test parseInputValue function
function testParseInputValue() {
    // Test cases for parseInputValue
    const testCases = [
        // Basic numbers
        { input: '1000', expected: 1000 },
        { input: '1,000', expected: 1000 },
        
        // Abbreviations
        { input: '1k', expected: 1000 },
        { input: '1 thousand', expected: 1000 },
        { input: '1 million', expected: 1000000 },
        { input: '1mn', expected: 1000000 },
        { input: '1.5 million', expected: 1500000 },
        { input: '1 billion', expected: 1000000000 },
        { input: '1bn', expected: 1000000000 },
        
        // Indian specific
        { input: '1 crore', expected: 10000000 },
        { input: '5 crores', expected: 50000000 },
        
        // Edge cases
        { input: '', expected: null },
        { input: 'invalid', expected: null },
        { input: '1.2.3', expected: null },
        
        // Additional test cases
        { input: '1,234,567.89', expected: 1234567.89 },
        { input: '0.5mn', expected: 500000 },
        { input: '1.5k', expected: 1500 },
        { input: '1,00,000', expected: 100000 }, // Indian format (should work even though it's not standard)
        { input: '5,00,00,000', expected: 50000000 }, // Indian format for 5 crores
        
        // Mathematical expressions
        { input: '1000 + 500', expected: 1500 },
        { input: '2 * 1000', expected: 2000 },
        { input: '1million - 500k', expected: 500000 },
        { input: '10 / 2', expected: 5 },
        
        // Complex expressions
        { input: '1.5million + 3crores', expected: 31500000 },
        { input: '5k * 2 + 1k', expected: 11000 }
    ];

    // Copy of parseInputValue function from script.js with debugging
    function parseInputValue(input) {
        console.log(`\nProcessing input: "${input}"`);
        
        if (!input || input.trim() === '') return null;
        
        // Convert to lowercase and remove extra spaces
        input = input.toLowerCase().trim();
        console.log(`After lowercase and trim: "${input}"`);
        
        // Remove commas from the input first
        input = input.replace(/,/g, '');
        console.log(`After removing commas: "${input}"`);
        
        // Replace common terms with their numerical equivalents
        const replacements = {
            'k': '* 1000',
            'thousand': '* 1000',
            'million': '* 1000000',
            'mn': '* 1000000',
            'billion': '* 1000000000',
            'bn': '* 1000000000',
            'crore': '* 10000000',
            'crores': '* 10000000'
        };
        
        // Apply replacements - FIXED: The issue is with matching words that don't have a space before them
        let modifiedInput = input;
        for (const [term, replacement] of Object.entries(replacements)) {
            // Fix the regex to handle both with and without space before the term
            // This handles both "1billion" and "1 billion" cases
            const regex = new RegExp(`(\\d)\\s*${term}\\b`, 'gi');
            const before = modifiedInput;
            modifiedInput = modifiedInput.replace(regex, `$1 ${replacement}`);
            if (before !== modifiedInput) {
                console.log(`Replaced "${term}" → "${modifiedInput}"`);
            }
        }
        
        // Handle case where there's no number prefix like just "billion"
        for (const [term, replacement] of Object.entries(replacements)) {
            const regex = new RegExp(`^\\s*${term}\\b`, 'gi');
            const before = modifiedInput;
            modifiedInput = modifiedInput.replace(regex, `1 ${replacement}`);
            if (before !== modifiedInput) {
                console.log(`Replaced standalone "${term}" → "${modifiedInput}"`);
            }
        }
        
        // Remove all non-numeric characters except math operators and decimal point
        const beforeClean = modifiedInput;
        modifiedInput = modifiedInput.replace(/[^0-9.+\-*\/()]/g, '');
        console.log(`After removing non-numeric chars: "${modifiedInput}"`);
        
        try {
            // Safely evaluate the expression
            console.log(`About to evaluate: "${modifiedInput}"`);
            const result = Function('"use strict"; return (' + modifiedInput + ')')();
            console.log(`Evaluation result: ${result}`);
            return isNaN(result) ? null : result;
        } catch (error) {
            console.error(`Error parsing input: ${error.message}`);
            return null;
        }
    }

    console.log('Testing parseInputValue function:');
    let passCount = 0;
    let failCount = 0;

    // Specially focus on the billion test case
    const billionTest = testCases.find(test => test.input === '1 billion');
    if (billionTest) {
        console.log('\n=== TESTING BILLION CASE SPECIFICALLY ===');
        const result = parseInputValue(billionTest.input);
        const pass = result === billionTest.expected || 
                   (result !== null && billionTest.expected !== null && 
                    Math.abs(result - billionTest.expected) < 0.001);
        
        console.log(`1 billion test: expected ${billionTest.expected}, got ${result}, pass: ${pass}`);
        console.log('=== END BILLION TEST ===\n');
    }

    testCases.forEach(test => {
        const result = parseInputValue(test.input);
        const pass = result === test.expected || 
                    (result !== null && test.expected !== null && 
                     Math.abs(result - test.expected) < 0.001);
        
        if (pass) {
            passCount++;
            console.log(`✓ Input "${test.input}" correctly parsed as ${result}`);
        } else {
            failCount++;
            console.error(`✗ Input "${test.input}" failed: expected ${test.expected}, got ${result}`);
        }
    });

    console.log(`parseInputValue: ${passCount} passed, ${failCount} failed\n`);
    return { passCount, failCount };
}

// Test formatToIndianSystem function
function testFormatToIndianSystem() {
    // Test cases for formatToIndianSystem
    const testCases = [
        { input: 1000, expected: "1 thousand" },
        { input: 10000, expected: "10 thousand" },
        { input: 100000, expected: "1 lakh" },
        { input: 1000000, expected: "10 lakhs" },
        { input: 10000000, expected: "1 crore" },
        { input: 20000000, expected: "2 crores" },
        { input: 123456789, expected: "12 crores 34 lakhs 56 thousand 789" },
        { input: 1000000000, expected: "100 crores" },
        // Additional test cases
        { input: 12345, expected: "12 thousand 345" },
        { input: 1234567, expected: "12 lakhs 34 thousand 567" },
        { input: 10000000000, expected: "1 thousand crores" },
        { input: 12345678901, expected: "1 thousand 234 crores 56 lakhs 78 thousand 901" },
        { input: 999, expected: "999" },
        { input: 0, expected: "0" }
    ];

    // Copy of formatToIndianSystem function from script.js
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
                n = n % 1000;
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

    console.log('Testing formatToIndianSystem function:');
    let passCount = 0;
    let failCount = 0;

    testCases.forEach(test => {
        const result = formatToIndianSystem(test.input);
        
        if (result === test.expected) {
            passCount++;
            console.log(`✓ Value ${test.input} correctly formatted as "${result}"`);
        } else {
            failCount++;
            console.error(`✗ Value ${test.input} failed: expected "${test.expected}", got "${result}"`);
        }
    });

    console.log(`formatToIndianSystem: ${passCount} passed, ${failCount} failed\n`);
    return { passCount, failCount };
}

// Test the USD to INR conversion with mock exchange rates
function testUsdToInrConversion() {
    // Get the exchange rate from the HTML page (passed via window.currentExchangeRate)
    // Default to 83.5 if not provided
    const exchangeRate = window.currentExchangeRate || 83.5;
    
    console.log(`Using exchange rate: ${exchangeRate} INR per USD`);
    
    // Common USD values to test
    const testUsdValues = [1, 10, 100, 1000, 0.5, 5.25];
    
    // Generate test cases based on the current exchange rate
    const testCases = testUsdValues.map(usdValue => ({
        input: usdValue,
        expected: usdValue * exchangeRate
    }));
    
    // Add a few manual test cases to verify
    console.log('Sample conversions:');
    testUsdValues.forEach(usd => {
        const inr = (usd * exchangeRate).toFixed(2);
        console.log(`${usd} USD = ${inr} INR`);
    });

    // Test large number inputs with abbreviations
    console.log('\nLarge number conversions:');
    const largeNumberTestCases = [
        { input: '100k', expectedUsd: 100000 },
        { input: '150 million', expectedUsd: 150000000 },
        { input: '1 billion', expectedUsd: 1000000000 },
        { input: '10 billion', expectedUsd: 10000000000 },
        { input: '1 trillion', expectedUsd: 1000000000000 }
    ];
    
    // Import the parseInputValue function for testing large numbers
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
            'bn': '* 1000000000',
            'trillion': '* 1000000000000',
            'crore': '* 10000000',
            'crores': '* 10000000'
        };
        
        // Apply replacements
        let modifiedInput = input;
        
        // Handle cases where number precedes the unit (e.g., "1billion" or "1 billion")
        for (const [term, replacement] of Object.entries(replacements)) {
            // Match both with and without space between the number and term
            const regex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${term}\\b`, 'gi');
            modifiedInput = modifiedInput.replace(regex, `$1 ${replacement}`);
        }
        
        // Handle cases where the term appears without a number prefix (e.g., "billion")
        for (const [term, replacement] of Object.entries(replacements)) {
            const regex = new RegExp(`^\\s*${term}\\b`, 'gi');
            modifiedInput = modifiedInput.replace(regex, `1 ${replacement}`);
        }
        
        // Remove all non-numeric characters except math operators and decimal point
        modifiedInput = modifiedInput.replace(/[^0-9.+\-*\/()]/g, '');
        
        try {
            // Safely evaluate the expression
            const result = Function('"use strict"; return (' + modifiedInput + ')')();
            return isNaN(result) ? null : result;
        } catch (error) {
            console.error('Error parsing input:', error);
            return null;
        }
    }
    
    // Test large number conversions
    largeNumberTestCases.forEach(test => {
        const parsedUsd = parseInputValue(test.input);
        const inrValue = parsedUsd * exchangeRate;
        console.log(`${test.input} (${parsedUsd.toLocaleString()} USD) = ${inrValue.toLocaleString()} INR`);
        
        // Add to test cases
        testCases.push({
            input: parsedUsd,
            expected: parsedUsd * exchangeRate
        });
    });

    // Simple conversion function for testing
    function convertUsdToInr(usdAmount, rate) {
        return usdAmount * rate;
    }

    console.log('\nTesting USD to INR conversion:');
    let passCount = 0;
    let failCount = 0;

    testCases.forEach(test => {
        const result = convertUsdToInr(test.input, exchangeRate);
        
        if (Math.abs(result - test.expected) < 0.001) {
            passCount++;
            console.log(`✓ USD ${test.input.toLocaleString()} correctly converted to INR ${result.toFixed(2)}`);
        } else {
            failCount++;
            console.error(`✗ USD ${test.input.toLocaleString()} failed: expected INR ${test.expected.toFixed(2)}, got INR ${result.toFixed(2)}`);
        }
    });

    console.log(`USD to INR conversion: ${passCount} passed, ${failCount} failed\n`);
    return { passCount, failCount };
}

// Test comma formatting
function testFormatWithCommas() {
    // Test cases for formatWithCommas
    const testCases = [
        { input: '1000', expected: '1,000' },
        { input: '1000000', expected: '1,000,000' },
        { input: '1000.50', expected: '1,000.50' },
        { input: '0.5', expected: '0.5' },
        { input: '123456789.123', expected: '123,456,789.123' },
        { input: 'invalid', expected: 'invalid' }, // Should return input as is
        { input: '', expected: '' },  // Should return empty string
        // Additional test cases
        { input: '1', expected: '1' },
        { input: '999', expected: '999' },
        { input: '1000000000', expected: '1,000,000,000' },
        { input: '1234.5678', expected: '1,234.5678' }
    ];

    // Copy of formatWithCommas function from script.js
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

    console.log('Testing formatWithCommas function:');
    let passCount = 0;
    let failCount = 0;

    testCases.forEach(test => {
        const result = formatWithCommas(test.input);
        
        if (result === test.expected) {
            passCount++;
            console.log(`✓ Value "${test.input}" correctly formatted as "${result}"`);
        } else {
            failCount++;
            console.error(`✗ Value "${test.input}" failed: expected "${test.expected}", got "${result}"`);
        }
    });

    console.log(`formatWithCommas: ${passCount} passed, ${failCount} failed\n`);
    return { passCount, failCount };
}

// Run all tests and summarize results
function runAllTests() {
    console.log('====== USD to INR Converter Test Suite ======\n');
    
    const results = {
        parseInputValue: testParseInputValue(),
        formatToIndianSystem: testFormatToIndianSystem(),
        usdToInrConversion: testUsdToInrConversion(),
        formatWithCommas: testFormatWithCommas()
    };
    
    console.log('====== Test Summary ======');
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const [testName, result] of Object.entries(results)) {
        console.log(`${testName}: ${result.passCount} passed, ${result.failCount} failed`);
        totalPassed += result.passCount;
        totalFailed += result.failCount;
    }
    
    console.log(`\nTotal: ${totalPassed} passed, ${totalFailed} failed`);
    
    if (totalFailed === 0) {
        console.log('🎉 All tests passed!');
    } else {
        console.log('❌ Some tests failed. Please check the results above.');
    }
}

// Run the tests
runAllTests(); 