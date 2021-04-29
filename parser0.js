function ParseAExpression(text) {
    let stack = [],     // preserve order of expressions
        expression = [],      // current expression
        cursor = 0,     // track current symbol in text
        buffer = "";    // accumulate digits into a token

    while(cursor < text.length) {
        switch(text[cursor]) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                buffer += text[cursor];
                break;
            case '-':
            case '+':
                if(expression.length === 3) {
                    expression = [expression, text[cursor]];
                } else if(stack.length > 0 && topOf(stack)[1] == text[cursor]) {
                    // (Term termOp) is top of stack
                    //  Term' termpOp | buffer +
                    // => (Term termOp (Term' * buffer)) + |
                    expression.push([buffer]);
                    buffer = '';
                    let rexpr = expression;
                    let lexpr = stack.pop().concat([rexpr]);
                    expression = [lexpr, text[cursor]]
                } else {
                    // Term + | buffer + 
                    // => (Term + buffer) + |
                    expression.push([buffer]); 
                    buffer = '';
                    expression = [expression, text[cursor]];
                }
                break;
            case '/':
            case '*':
                if(expression.length === 3) {
                    expression = [expression, text[cursor]];
                } else if(isTermOperator(expression)) {
                    // push expression, i.e. Term +, to stack
                    // Term + | buffer *
                    // => buffer * |
                    stack.push(expression);
                    expression = [[buffer], text[cursor]];
                    buffer = '';
                } else {
                    // Factor * | buffer *
                    // => (Factor * buffer) * |
                    expression.push([buffer]); 
                    buffer = '';
                    expression = [expression, text[cursor]];
                }
                break;
            case '(':
                // Term + | buffer (
                // buffer must be empty since operator is part of expression
                if(expression.length > 0) stack.push(expression);
                expression = [];
                break;
            case ')':
                // buffer )
                // expression is now a full expression without dangling operator
                expression.push([buffer]);
                buffer = '';
                break;
            case '\t':
            case '\r':
            case '\n':
                break;
            default:
                console.error('Unexpected symbol ' + text[cursor]);
                break;
        }
        cursor += 1;
    }

    // Push left over buffer
    if(buffer.length > 0) expression.push([buffer]);
    buffer = '';

    // Unpop remaining stack
    while(stack.length > 0) {
        let lexpr = stack.pop();
        lexpr.push(expression);
        expression = lexpr;
    }

    console.log(expression);
    return expression;
}

function isTermOperator(expression) {
    return ['+', '-'].includes(expression[1]);
}

function isFactorOperator(expression) {
    return ['*', '/'].includes(expression[1]);
}

function topOf(stack) {
    return stack[stack.length - 1];
}

function eval(expression) {
    if(expression.length === 1) {
        return parseInt(expression[0]);
    } else {
        return applyOperator(expression[1])(
            eval(expression[0]), 
            eval(expression[2]));
    }
}

function applyOperator(operator) {
    switch(operator) {
        case '+': return (a, b) => a + b;
        case '-': return (a, b) => a - b;
        case '*': return (a, b) => a * b;
        case '/': return (a, b) => a / b;
        default:
            console.error('Unexpected operator ' + operator);
    }
}

// Compare results
console.log(eval(ParseAExpression('1-3+54-5+3*(10)')), 1-3+54-5+3*(10));
console.log(eval(ParseAExpression('(3-2)+5')), (3-2)+5);
console.log(eval(ParseAExpression('3-(2+5)')), 3-(2+5));
console.log(eval(ParseAExpression('6*(234-6)')), 6*(234-6));
console.log(eval(ParseAExpression('34-5*2+6*(234-6)')), 34-5*2+6*(234-6));
console.log(eval(ParseAExpression('(3+5)*7-5')), (3+5)*7-5);
console.log(eval(ParseAExpression('34+5*2+5')), 34+5*2+5);
console.log(eval(ParseAExpression('8+4*2*3+5*1*0')), 8+4*2*3+5*1*0);
console.log(eval(ParseAExpression('1+3-4')), 1+3-4);
console.log(eval(ParseAExpression('2*11+3*33')), 2*11+3*33);
console.log(eval(ParseAExpression('2*3*22+5*10+7+6+66+666')), 2*3*22+5*10+7+6+66+666);