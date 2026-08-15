const Calculator = {
    displayValue: '0',
    firstOperand: null,
    waitingForSecondOperand: false,
    operator: null,
    hasError: false
};

const updateDisplay = () => {
    const display = document.querySelector('.screen');
    display.value = Calculator.displayValue;
};

updateDisplay();

// Event Listener on container (No inline onclick used)
const keys = document.querySelector('.keys');
keys.addEventListener('click', (event) => {
    const { target } = event;
    if (!target.matches('button')) return;

    if (Calculator.hasError && !target.classList.contains('all-clear')) {
        resetCalculator();
    }

    if (target.classList.contains('operator')) {
        handleOperator(target.value);
        updateDisplay();
        return;
    }

    if (target.classList.contains('decimal')) {
        inputDecimal(target.value);
        updateDisplay();
        return;
    }

    if (target.classList.contains('all-clear')) {
        resetCalculator();
        updateDisplay();
        return;
    }

    if (target.classList.contains('delete')) {
        handleDelete();
        updateDisplay();
        return;
    }

    inputDigit(target.value);
    updateDisplay();
});

const inputDigit = (digit) => {
    const { displayValue, waitingForSecondOperand } = Calculator;

    if (waitingForSecondOperand) {
        Calculator.displayValue = digit;
        Calculator.waitingForSecondOperand = false;
    } else {
        Calculator.displayValue = displayValue === '0' ? digit : displayValue + digit;
    }
};

const inputDecimal = (dot) => {
    if (Calculator.waitingForSecondOperand) {
        Calculator.displayValue = '0.';
        Calculator.waitingForSecondOperand = false;
        return;
    }

    if (!Calculator.displayValue.includes(dot)) {
        Calculator.displayValue += dot;
    }
};

const handleDelete = () => {
    if (Calculator.waitingForSecondOperand) return;

    if (Calculator.displayValue.length > 1) {
        Calculator.displayValue = Calculator.displayValue.slice(0, -1);
    } else {
        Calculator.displayValue = '0';
    }
};

const handleOperator = (nextOperator) => {
    const { firstOperand, displayValue, operator } = Calculator;
    const inputValue = parseFloat(displayValue);

    if (operator && Calculator.waitingForSecondOperand) {
        if (nextOperator !== '=') {
            Calculator.operator = nextOperator;
        }
        return;
    }

    if (firstOperand === null && !isNaN(inputValue)) {
        Calculator.firstOperand = inputValue;
    } else if (operator) {
        const result = calculate(firstOperand, inputValue, operator);

        if (result === 'Error') {
            Calculator.displayValue = 'Error';
            Calculator.hasError = true;
            return;
        }

        Calculator.displayValue = `${parseFloat(result.toFixed(7))}`;
        Calculator.firstOperand = result;
    }

    Calculator.waitingForSecondOperand = true;
    Calculator.operator = nextOperator === '=' ? null : nextOperator;
};

// Logic built without eval()
const calculate = (first, second, op) => {
    switch (op) {
        case '+':
            return first + second;
        case '-':
            return first - second;
        case '*':
            return first * second;
        case '/':
            // Division-by-zero check
            if (second === 0) {
                return 'Error';
            }
            return first / second;
        default:
            return second;
    }
};

const resetCalculator = () => {
    Calculator.displayValue = '0';
    Calculator.firstOperand = null;
    Calculator.waitingForSecondOperand = false;
    Calculator.operator = null;
    Calculator.hasError = false;
};