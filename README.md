# USD to INR Converter

A simple, user-friendly web application that converts USD amounts to INR with Indian number formatting (thousands, lakhs, crores).

## Features

- Convert USD to INR using real-time exchange rates
- Accept input in various formats:
  - Plain numbers (e.g., "100")
  - US number notation (e.g., "100k", "1 million", "2.5 billion")
- Display results in Indian number format with text representation
  - Example: "₹8,30,000 (8.3 lakhs)"
- Clean, responsive UI that works on all devices

## How to Use

1. Open `index.html` in any modern web browser
2. Enter a USD amount in the input field using any supported format
3. Click the "Convert" button or press Enter
4. View the result displayed below in Indian number format

## Examples

Input examples:
- 100
- 100k
- 1 million
- 2.75 million
- 1 billion
- 500 billion

## Technical Details

This is a static web application built with:
- HTML5
- CSS3
- Vanilla JavaScript

The app uses the [Exchange Rate API](https://www.exchangerate-api.com/) to fetch real-time USD to INR exchange rates.

## Installation

No installation required. Simply download the files and open `index.html` in a web browser.

```
git clone https://github.com/yourusername/usd-inr-converter.git
cd usd-inr-converter
```

Then open `index.html` in your browser.

## License

MIT 